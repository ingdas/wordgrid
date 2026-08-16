import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LEVELS, TIER_KEY, EMOJI_BOSS, buildPuzzle, decoyTiles, type BossTwist, type Category, type Level, type Puzzle, type RawPuzzle } from "./puzzles";
import { computeStars, evaluateGuess, guessKey, shuffle, linkMatches, scrambleWord } from "./engine";
import { requestRewarded } from "./sdk";
import { CATEGORY_THEMES } from "./theme";
import { fmtTime } from "./format";
import { plural, t } from "./i18n";
import { LinkGuess } from "./LinkGuess";
import { EndCard } from "./EndCard";
import Confetti from "./Confetti";
import {
  playSelect,
  playDeselect,
  playClear,
  playWrong,
  playCorrect,
  playWin,
  playStar,
} from "./audio";

const MAX_MISTAKES = 4;

// Per-twist flavour shown in the top bar and the one-time intro toast.
const twistLabel = (tw: BossTwist) => t(`twist.${tw}.label`);
const twistIntro = (tw: BossTwist) => t(`twist.${tw}.intro`);


type Status = "playing" | "guessing" | "won" | "lost";

interface GameProps {
  puzzleIndex: number;
  /** Play this puzzle instead of LEVELS[puzzleIndex] (daily pool / Endless). */
  overrideRaw?: RawPuzzle;
  reduce: boolean;
  streak: number;
  tutorial: boolean;
  daily: boolean;
  twist: BossTwist | null;
  endless?: boolean;
  endlessInfo?: { solved: number; score: number; best: number };
  bestMs?: number;
  hintBank: number;
  onUseHint: () => void;
  onRefillHints: () => Promise<boolean>;
  onWin: (result: { stars: number; linkCorrect: boolean; timeMs: number; mistakes: number; title: string; score: number }) => void;
  onLoss: (result: { timeMs: number; mistakes: number; title: string }) => void;
  onExit: () => void;
  onNext?: () => void;
  onHelp: () => void;
  onTutorialDone: () => void;
}


export default function Game({
  puzzleIndex,
  overrideRaw,
  reduce,
  streak,
  tutorial,
  daily,
  twist,
  endless = false,
  endlessInfo,
  bestMs,
  hintBank,
  onUseHint,
  onRefillHints,
  onWin,
  onLoss,
  onExit,
  onNext,
  onHelp,
  onTutorialDone,
}: GameProps) {
  const boss = twist != null;
  // Endless/Zen mode never fails: no mistake cap, no second-chance/loss path.
  const maxMistakes = endless ? Number.POSITIVE_INFINITY : MAX_MISTAKES;
  // The emoji boss swaps in a bespoke picture board; every other twist plays the
  // chapter's own level with a different presentation/rule.
  const levelRaw = overrideRaw ?? LEVELS[puzzleIndex];
  // Campaign levels carry a difficulty tier; daily/Endless overrides don't.
  const tier = (levelRaw as Partial<Level>).tier;
  const raw = twist === "emoji" ? EMOJI_BOSS : levelRaw;
  const puzzle: Puzzle = useMemo(() => buildPuzzle(raw, 7), [raw]);

  // The "decoy" boss salts the board with impostor tiles that fit no group.
  const decoys = useMemo(() => (twist === "decoy" ? decoyTiles(puzzle) : []), [twist, puzzle]);

  // The spoke tiles on the board (everything except the hidden link), plus any
  // impostors. The set of decoys never changes, so they linger as red herrings.
  const spokeTiles = useMemo(
    () => [...puzzle.words.filter((w) => w !== puzzle.pivot), ...decoys],
    [puzzle, decoys]
  );

  // How each tile is shown: scrambled anagram, an emoji, or the plain word. The
  // real word is always kept for grouping and the solved banner. Stable per word.
  const displayOf = useMemo(() => {
    const m = new Map<string, string>();
    if (twist === "scramble") spokeTiles.forEach((w) => m.set(w, scrambleWord(w)));
    else if (twist === "emoji") spokeTiles.forEach((w) => m.set(w, puzzle.emoji[w] ?? w));
    return (w: string) => m.get(w) ?? w;
  }, [twist, spokeTiles, puzzle.emoji]);

  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState<Category[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const mistakesRef = useRef(0);
  // The Oracle boss flips the flow: name the link first (a "guessing" phase up
  // front), then group. Every other mode starts straight into grouping.
  const [status, setStatus] = useState<Status>(twist === "oracle" ? "guessing" : "playing");
  const [shake, setShake] = useState(0);
  const [burst, setBurst] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [pastGuesses, setPastGuesses] = useState<Set<string>>(new Set());
  const [linkGuess, setLinkGuess] = useState<string | null>(null);
  const [revealedHints, setRevealedHints] = useState<Set<string>>(new Set());
  // No letters revealed up front — the letter bank already removes blank-page
  // paralysis. The reveal-a-letter hint locks in letters one at a time.
  const [revealedLetters, setRevealedLetters] = useState(0);
  const [moves, setMoves] = useState(0);
  // Score & combo: gentle dopamine, not pressure. Points per solved group, a
  // consecutive-solve multiplier, and floating "+N" popups.
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  const [pops, setPops] = useState<{ id: number; text: string }[]>([]);
  const popId = useRef(0);
  // Early call: name the link before the last group is found. Worth a big
  // bonus and reveals the word (which makes the rest easier — that's the
  // reward), but you get exactly one shot per level, spent the moment you
  // open it so the letter count can't be peeked at for free.
  const [earlyCall, setEarlyCall] = useState(false);
  const [earlyCallSpent, setEarlyCallSpent] = useState(false);
  // Second chance: on the first time you run out of guesses, offer a rewarded
  // continue (+2 tries) before the run actually ends.
  const [offering, setOffering] = useState(false);
  const [secondChanceUsed, setSecondChanceUsed] = useState(false);
  // Decoys are appended last, so shuffle once up front to scatter the impostors.
  const [order, setOrder] = useState<string[]>(() => (twist === "decoy" ? shuffle(spokeTiles) : spokeTiles));
  const [now, setNow] = useState(Date.now());
  const [coach, setCoach] = useState(tutorial ? 0 : -1);
  const [finalMs, setFinalMs] = useState(0);
  const reported = useRef(false);
  const startedAt = useRef(Date.now());
  const prevBest = useRef(bestMs); // captured once, before this run updates it
  // Tutorial helpers: this stays true for the whole run even after the coach
  // marks the tutorial done (so the finale can still nudge a first-timer).
  const isTutorialRun = useRef(tutorial).current;
  const coachMisses = useRef(0);
  const finaleHinted = useRef(false);

  // Tick a clock once a second while playing, for the timer display.
  useEffect(() => {
    if (status !== "playing") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // One-time boss intro, tailored to this boss's twist.
  useEffect(() => {
    if (twist) setToast(twistIntro(twist));
  }, [twist]);

  // First-timer's finale: the tap-to-spell step is new, so nudge what to do.
  useEffect(() => {
    if (isTutorialRun && status === "guessing" && !finaleHinted.current) {
      finaleHinted.current = true;
      setToast(t("finale.firstTime"));
    }
  }, [isTutorialRun, status]);

  // Deferred beats that change `status` (the early call landing, the give-up
  // reveal) go through `later` so a restart or an exit cancels them: an
  // 800ms-old timer must not drop a fresh board straight into "won".
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => () => clearTimers(), [clearTimers]);

  const buzz = useCallback(
    (pattern: number | number[]) => {
      if (!reduce && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
    },
    [reduce]
  );

  const indexByName = useMemo(() => {
    const m = new Map<string, number>();
    puzzle.categories.forEach((c, i) => m.set(c.name, i));
    return m;
  }, [puzzle]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(timer);
  }, [toast]);

  const solvedSpokes = useMemo(() => {
    const s = new Set<string>();
    solved.forEach((c) => c.spokes.forEach((w) => s.add(w)));
    return s;
  }, [solved]);

  const remainingSpokes = useMemo(
    () => order.filter((w) => !solvedSpokes.has(w)),
    [order, solvedSpokes]
  );

  const unsolvedCategories = useMemo(
    () => puzzle.categories.filter((c) => !solved.includes(c)),
    [puzzle, solved]
  );

  const [announce, setAnnounce] = useState("");

  // Floating reward popups ("+200 ×2") that rise and fade near the link card.
  const pushPop = useCallback((text: string) => {
    const id = ++popId.current;
    setPops((prev) => [...prev, { id, text }]);
    setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== id)), 1100);
  }, []);

  const solveCategory = useCallback(
    (cat: Category, index: number) => {
      playCorrect(index);
      buzz(30);
      setBurst((b) => b + 1);
      setAnnounce(t("game.groupFound", { theme: cat.name, n: index + 1 }));
      setSolved((prev) => [...prev, cat]);
      setSelected([]);
      // A consecutive-solve combo multiplies the 100-point base. The combo runs
      // off a ref so the points and the popup are raised HERE, in the handler —
      // a state updater can be invoked more than once for one call (StrictMode
      // does it on every dev render), which would pay the group twice.
      const nc = comboRef.current + 1;
      comboRef.current = nc;
      setCombo(nc);
      const pts = 100 * nc;
      setScore((s) => s + pts);
      pushPop(nc > 1 ? `+${pts}  ×${nc}` : `+${pts}`);
    },
    [buzz, pushPop]
  );

  // Auto-solve the final pair, then move on. Normally that's the "guess the
  // link" finale; the Oracle already knows the link, so it wins outright.
  useEffect(() => {
    if (status !== "playing") return;
    if (solved.length === puzzle.categories.length - 1) {
      const last = unsolvedCategories[0];
      const timer = setTimeout(() => solveCategory(last, solved.length), 600);
      return () => clearTimeout(timer);
    }
    // A link already named (the Oracle, or a successful early call) means the
    // finale has nothing left to ask — the last group solved is the win.
    if (solved.length === puzzle.categories.length) setStatus(linkGuess != null ? "won" : "guessing");
  }, [solved, status, unsolvedCategories, puzzle.categories.length, solveCategory, linkGuess]);

  // Advance the coach once the player lands their first pair, and record that
  // the tutorial has been completed so it never re-triggers.
  useEffect(() => {
    if (coach === 1 && solved.length >= 1) {
      setCoach(2);
      onTutorialDone();
    }
  }, [coach, solved.length, onTutorialDone]);

  // The link is "resolved" once typed correctly or revealed; correctness allows
  // synonyms the puzzle permits (and is forgiving about case/plurals).
  const linkGuessed = linkGuess != null;
  const linkCorrect = linkGuessed && linkMatches(linkGuess!, puzzle.pivot, puzzle.accept);

  // Final stars: from pairing mistakes, minus a missed link guess.
  const finalStars = computeStars({ mistakes, linkGuessed, linkCorrect });

  // Report the result up exactly once.
  useEffect(() => {
    if (reported.current) return;
    if (status === "won") {
      reported.current = true;
      const elapsed = Date.now() - startedAt.current;
      setFinalMs(elapsed);
      playWin();
      buzz([0, 40, 60, 40]);
      setAnnounce(t("game.a11y.won", { word: puzzle.pivot, stars: finalStars }));
      for (let i = 0; i < finalStars; i++) setTimeout(() => playStar(i), 450 + i * 200);
      onWin({ stars: finalStars, linkCorrect, timeMs: elapsed, mistakes, title: puzzle.title, score });
    } else if (status === "lost") {
      reported.current = true;
      // The link stays secret on a loss so it can still be guessed on a replay.
      setAnnounce(t("game.a11y.lost"));
      onLoss({ timeMs: Date.now() - startedAt.current, mistakes, title: puzzle.title });
    }
  }, [status, finalStars, onWin, onLoss, buzz, linkCorrect, puzzle.title, mistakes, score]);

  const toggleSelect = useCallback(
    (word: string) => {
      if (status !== "playing" || offering) return;
      setSelected((prev) => {
        if (prev.includes(word)) {
          playDeselect();
          return prev.filter((w) => w !== word);
        }
        if (prev.length >= 3) return prev; // a group is three spokes
        playSelect();
        return [...prev, word];
      });
    },
    [status, offering]
  );

  const submit = useCallback(() => {
    if (status !== "playing" || offering || selected.length !== 3) return;
    setMoves((m) => m + 1);
    const result = evaluateGuess(unsolvedCategories, selected, pastGuesses);
    if (result.kind === "solved") {
      solveCategory(result.category, solved.length);
      return;
    }
    if (result.kind === "repeat") {
      setToast(t("game.repeat"));
      setShake((s) => s + 1);
      return;
    }
    playWrong();
    buzz([0, 50, 30, 50]);
    setShake((s) => s + 1);
    // During the guided tutorial a wrong guess never costs anything — just nudge
    // toward the theme, escalating to a real hint if they keep missing (but
    // never handing over the whole group).
    if (coach >= 0) {
      const n = coachMisses.current++;
      const teach = puzzle.categories[0];
      const msg = result.oneAway
        ? t("coach.nudge.oneAway")
        : n === 0
          ? t("coach.nudge.1", { theme: teach.name })
          : n === 1
            ? t("coach.nudge.2", { theme: teach.name })
            : t("coach.nudge.3", { word: teach.spokes[0] });
      setToast(msg);
      return;
    }
    setPastGuesses((prev) => new Set(prev).add(guessKey(selected)));
    setToast(t(result.oneAway ? "game.oneAway" : "game.wrong"));
    setCombo(0); // a wrong guess breaks the combo
    comboRef.current = 0;
    if (combo >= 2) pushPop(t("game.comboLost"));
    // Count the mistake off a ref and decide the run's fate here, not inside
    // the updater: ending a run is a side effect, and an updater is not a safe
    // place to have one (it can run twice for a single wrong guess).
    const next = mistakesRef.current + 1;
    mistakesRef.current = next;
    setMistakes(next);
    if (next >= maxMistakes) {
      setSelected([]);
      // Offer a one-time rewarded continue before ending the run.
      if (!secondChanceUsed) setOffering(true);
      else setStatus("lost");
    }
  }, [status, offering, selected, unsolvedCategories, solveCategory, solved.length, pastGuesses, buzz, combo, pushPop, secondChanceUsed, coach, puzzle, maxMistakes]);

  const clearSelection = useCallback(() => {
    if (selected.length) playClear();
    setSelected([]);
  }, [selected.length]);

  // Second chance: a rewarded ad (instant true when no SDK) buys +2 tries once.
  const takeSecondChance = useCallback(async () => {
    const ok = await requestRewarded();
    if (!ok) return; // ad failed/declined — leave the offer up
    setSecondChanceUsed(true);
    setOffering(false);
    mistakesRef.current = Math.max(0, mistakesRef.current - 2);
    setMistakes(mistakesRef.current);
    setToast(t("game.continue.taken"));
  }, []);
  const declineSecondChance = useCallback(() => {
    setOffering(false);
    setStatus("lost");
  }, []);

  const shuffleTiles = useCallback(() => {
    playSelect();
    setOrder((o) => shuffle(o));
  }, []);

  // The unsolved categories whose theme hasn't been revealed yet.
  const hintableCategories = useMemo(
    () => unsolvedCategories.filter((c) => !revealedHints.has(c.name)),
    [unsolvedCategories, revealedHints]
  );
  const canHint = status === "playing" && hintBank > 0 && hintableCategories.length > 0;

  // Hint: spend a token to reveal one category's description (not its words).
  const revealCategory = useCallback(() => {
    if (!canHint) return;
    const cat = hintableCategories[0];
    setRevealedHints((prev) => new Set(prev).add(cat.name));
    setToast(t("game.hint.given", { theme: cat.name }));
    onUseHint();
    playSelect();
  }, [canHint, hintableCategories, onUseHint]);

  // Finale hint: spend a token to reveal the next letter of the secret link.
  const canRevealLetter = hintBank > 0 && revealedLetters < puzzle.pivot.length;
  const revealLetter = useCallback(() => {
    if (hintBank <= 0) return;
    setRevealedLetters((n) => Math.min(n + 1, puzzle.pivot.length));
    onUseHint();
    playSelect();
  }, [hintBank, puzzle.pivot.length, onUseHint]);

  // Empty bank → rewarded refill (instant in standalone play, an ad on the platform).
  const refill = useCallback(async () => {
    const ok = await onRefillHints();
    if (ok) {
      setToast(t("game.hint.refilled"));
      playCorrect(0);
    }
  }, [onRefillHints]);

  const restart = useCallback(() => {
    clearTimers(); // nothing from the finished run may land on the fresh one
    reported.current = false;
    startedAt.current = Date.now();
    setNow(Date.now());
    setSolved([]);
    setSelected([]);
    mistakesRef.current = 0;
    setMistakes(0);
    setStatus(twist === "oracle" ? "guessing" : "playing");
    setShake(0);
    setBurst(0);
    setToast(null);
    setPastGuesses(new Set());
    setLinkGuess(null);
    setRevealedHints(new Set());
    setRevealedLetters(0);
    setMoves(0);
    setScore(0);
    comboRef.current = 0;
    setCombo(0);
    setPops([]);
    setOffering(false);
    setSecondChanceUsed(false);
    setEarlyCall(false);
    setEarlyCallSpent(false);
    coachMisses.current = 0;
    finaleHinted.current = false;
    setOrder(shuffle(spokeTiles));
  }, [spokeTiles, twist, clearTimers]);

  // Keyboard shortcuts: Enter submits, Escape clears.
  useEffect(() => {
    if (status !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && selected.length === 3) submit();
      else if (e.key === "Escape" && selected.length) clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, selected.length, submit, clearSelection]);

  // Returns true if the typed guess is accepted; otherwise the caller shows an
  // inline "try again" (no penalty for retries).
  const submitLink = useCallback(
    (text: string): boolean => {
      if (!linkMatches(text, puzzle.pivot, puzzle.accept)) return false;
      setLinkGuess(text);
      // Naming the link early is the hard way to do it — every group still
      // unsolved is one less clue you had — so it pays proportionally.
      const early = unsolvedCategories.length;
      const pts = 250 * (1 + early);
      setScore((s) => s + pts);
      pushPop(early > 0 ? `+${pts}  🔑 early!` : "+250  🔑");
      playStar(2);
      buzz(40);
      // Link named with groups still open (the Oracle, or an early call) →
      // back to the board, now knowing the word. Otherwise it's the win.
      later(() => {
        setEarlyCall(false);
        setStatus(early > 0 ? "playing" : "won");
      }, 800);
      return true;
    },
    [puzzle.pivot, puzzle.accept, buzz, pushPop, unsolvedCategories.length, later]
  );

  // One call per level, spent on opening: no free look at the letter count.
  const canCallEarly =
    status === "playing" && !offering && !earlyCallSpent && coach < 0 && twist !== "oracle" &&
    solved.length >= 1 && unsolvedCategories.length >= 2;
  const startEarlyCall = useCallback(() => {
    setEarlyCallSpent(true);
    setEarlyCall(true);
    setSelected([]);
    setStatus("guessing");
    playSelect();
  }, []);
  // A missed early call costs no mistake and no star — just the shot itself.
  const missEarlyCall = useCallback(() => {
    playWrong();
    buzz(30);
    setEarlyCall(false);
    setStatus("playing");
    setToast(t("game.early.missed"));
  }, [buzz]);

  // Give up: reveal the word (counts as a miss → costs a star). For the Oracle
  // this still hands you the link and moves you into the grouping phase.
  const revealLinkWord = useCallback(() => {
    setLinkGuess(" "); // a value that never matches
    playWrong();
    later(() => setStatus(twist === "oracle" ? "playing" : "won"), 700);
  }, [twist, later]);

  // The Oracle's "name the link first" phase: shown all words + themes, link
  // still hidden, before any grouping.
  const oraclePending = twist === "oracle" && status === "guessing" && linkGuess == null;
  // Both "name it before you've grouped" states keep the tiles on screen —
  // they're what you're reasoning from.
  const linkPending = oraclePending || (earlyCall && linkGuess == null);
  // A win reveals the link; a loss keeps it secret for the replay. The Oracle
  // also reveals it the moment you've named it (you've earned the sight).
  const revealLink = status === "won" || linkGuess != null;
  const stars = finalStars;
  // Blackout boss: keep solved group names/words hidden until the final reveal.
  const maskSolved = twist === "blackout" && !revealLink;
  // Show only the groups actually solved (never the unsolved ones on a loss).
  const bannerCats: Category[] = solved;

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-8 pt-4 lg:max-w-5xl">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-white py-2 pl-2.5 pr-4 text-sm font-semibold text-ink transition hover:bg-cream active:scale-95"
        >
          <span aria-hidden>‹</span> {t(endless ? "common.endRun" : daily ? "common.home" : "common.levels")}
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 font-display text-lg font-bold leading-none text-ink">
            {endless ? (
              <><span aria-hidden>🧘</span> {t("game.endless")}</>
            ) : daily ? (
              <><span aria-hidden>📅</span> {t("game.daily")}</>
            ) : (
              <>
                {boss && !revealLink && <span aria-hidden>👑</span>}
                {t("game.level", { n: puzzleIndex + 1 })}
              </>
            )}
          </div>
          <div
            className={`mt-0.5 text-[0.7rem] font-bold uppercase tracking-widest ${
              boss && !revealLink ? "text-press" : "text-ink-soft"
            }`}
          >
            {endless
              ? t("game.endless.progress", { n: endlessInfo?.solved ?? 0, score: (endlessInfo?.score ?? 0).toLocaleString() })
              : revealLink
                ? puzzle.title
                : daily
                  ? t("game.daily.today")
                  : twist
                    ? twistLabel(twist)
                    : tier
                      ? t(TIER_KEY[tier])
                      : ""}
          </div>
        </div>
        <button
          onClick={onHelp}
          aria-label={t("home.howToPlay")}
          className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white text-base font-semibold text-ink transition hover:bg-cream active:scale-95"
        >
          ?
        </button>
      </div>

      <main className="relative mt-4 flex flex-1 flex-col justify-center lg:block">
        {/* Floating reward popups ("+200 ×2") rising near the link card */}
        <div className="pointer-events-none absolute inset-x-0 top-12 z-30 flex flex-col items-center gap-1">
          <AnimatePresence>
            {pops.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12, scale: 0.7 }}
                animate={{ opacity: 1, y: -16, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-full bg-gold px-3 py-1 text-sm font-extrabold text-ink shadow-lg"
              >
                {p.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* On wide viewports (landscape embeds / desktop) the game splits into
            two columns — board on the left, actions on the right — so the
            controls never fall below the fold of a 720p iframe. */}
        <div className="lg:flex lg:items-start lg:justify-center lg:gap-8">
        <div className="min-w-0 lg:max-w-xl lg:flex-1">
        {/* The secret link — present in every group, word hidden until the end */}
        <SecretLink
          reveal={revealLink}
          word={puzzle.pivot}
          spotlight={coach === 0}
          score={score}
          combo={combo}
        />

        {oraclePending && (
          <div className="mt-3 rounded-2xl border border-ink/20 bg-press/5 p-3">
            <div className="text-center text-[0.7rem] font-bold uppercase tracking-widest text-press">
              The four themes — what single word joins them all?
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {puzzle.categories.map((cat) => {
                const theme = CATEGORY_THEMES[(indexByName.get(cat.name) ?? 0) % CATEGORY_THEMES.length];
                return (
                  <div
                    key={cat.name}
                    className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[0.72rem] font-bold"
                    style={{ background: `${theme.tint}1f`, color: theme.tint }}
                  >
                    <span aria-hidden>{theme.shape}</span>
                    <span className="leading-tight">{cat.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Solved groups stay on screen with their words — through the finale
            too — so you can see what you've already found. Each banner shrinks a
            little during the guess to keep the end-state compact. */}
        {(bannerCats.length > 0 || revealedHints.size > 0) && (
          <div className="mt-3 space-y-2">
            <AnimatePresence initial={false}>
              {bannerCats.map((cat, i) => (
                <SolvedBanner
                  key={cat.name}
                  cat={cat}
                  themeIndex={indexByName.get(cat.name) ?? 0}
                  masked={maskSolved}
                  compact={status === "guessing"}
                  order={i}
                />
              ))}
              {status !== "lost" &&
                puzzle.categories
                  .filter((c) => !solved.includes(c) && revealedHints.has(c.name))
                  .map((cat) => (
                    <HintBanner key={`hint-${cat.name}`} cat={cat} themeIndex={indexByName.get(cat.name) ?? 0} />
                  ))}
            </AnimatePresence>
          </div>
        )}

        {(status === "playing" || status === "lost" || linkPending) && (
          <motion.div
            key={shake}
            animate={shake && !reduce ? { x: [0, -10, 10, -8, 8, -4, 0] } : {}}
            transition={{ duration: 0.45 }}
            className="mt-4 flex flex-wrap justify-center gap-3"
          >
            <AnimatePresence mode="popLayout">
              {remainingSpokes.map((word) => (
                <WordTile
                  key={word}
                  word={word}
                  display={displayOf(word)}
                  emoji={twist === "emoji"}
                  selected={selected.includes(word)}
                  disabled={status !== "playing" || offering}
                  onClick={() => toggleSelect(word)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        {status === "lost" && (
          <p className="mt-6 text-center text-sm text-ink-soft">
            {t("game.lost")}
          </p>
        )}
        </div>

        {/* Right column on wide viewports: stats, controls, finale, end card. */}
        <div className="lg:w-80 lg:shrink-0">
        {status === "playing" && !offering && (
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-ink-soft">
            <span aria-label={t("game.time")}>⏱ {fmtTime(now - startedAt.current)}</span>
            <span aria-hidden>·</span>
            <span>{plural("common.moves", moves)}</span>
            <button
              onClick={shuffleTiles}
              className="rounded-full border-2 border-ink px-2.5 py-1 font-semibold text-ink transition hover:bg-cream active:scale-95"
            >
              {t("game.shuffle")}
            </button>
          </div>
        )}

        {canCallEarly && (
          <div className="mt-4 text-center">
            <button
              onClick={startEarlyCall}
              className="rounded-full border-2 border-dashed border-press/70 px-4 py-2 text-xs font-bold text-press transition hover:bg-press/5 active:scale-95"
            >
              {t("game.early.offer")}
            </button>
          </div>
        )}

        {status === "playing" && !offering && (
          <Controls
            mistakes={mistakes}
            max={MAX_MISTAKES}
            hideMistakes={endless}
            canSubmit={selected.length === 3}
            hasSelection={selected.length > 0}
            canHint={canHint}
            hintBank={hintBank}
            showRefill={hintBank === 0}
            onSubmit={submit}
            onClear={clearSelection}
            onHint={revealCategory}
            onRefill={refill}
          />
        )}

        <AnimatePresence>
          {offering && <ContinueOffer onAccept={takeSecondChance} onDecline={declineSecondChance} />}
        </AnimatePresence>

        {status === "guessing" && (
          <LinkGuess
            oracle={twist === "oracle"}
            early={earlyCall}
            onMiss={missEarlyCall}
            resolved={linkGuess != null}
            pivot={puzzle.pivot}
            revealedLetters={revealedLetters}
            hintBank={hintBank}
            canRevealLetter={canRevealLetter}
            onRevealLetter={revealLetter}
            onRefill={refill}
            onSubmit={submitLink}
            onReveal={revealLinkWord}
          />
        )}

        <AnimatePresence>
          {(status === "won" || status === "lost") && (
            <EndCard
              key={status}
              won={status === "won"}
              title={raw.title}
              stars={stars}
              mistakes={mistakes}
              streak={streak}
              pivot={puzzle.pivot}
              linkCorrect={linkCorrect}
              timeMs={finalMs}
              bestMs={prevBest.current}
              score={score}
              shareText={buildShare({
                level: puzzleIndex + 1,
                daily,
                won: status === "won",
                stars: finalStars,
                mistakes,
                linkCorrect,
                timeMs: finalMs,
                order:
                  status === "won"
                    ? solved
                    : [...solved, ...puzzle.categories.filter((c) => !solved.includes(c))],
                indexByName,
              })}
              shareData={{
                level: puzzleIndex + 1,
                daily,
                won: status === "won",
                stars: finalStars,
                score,
                mistakes,
                linkCorrect,
                timeMs: finalMs,
                colors: (status === "won"
                  ? solved
                  : [...solved, ...puzzle.categories.filter((c) => !solved.includes(c))]
                ).map((c) => CATEGORY_THEMES[(indexByName.get(c.name) ?? 0) % CATEGORY_THEMES.length].tint),
              }}
              onShareToast={(msg) => setToast(msg)}
              endless={endless}
              endlessInfo={endlessInfo}
              daily={daily}
              onExit={onExit}
              onRestart={restart}
              onNext={onNext}
            />
          )}
        </AnimatePresence>

        {/* Steps 1–2 of the coach sit in the game flow (just below the board) so
            they stay close to the action without pinning to the viewport. */}
        <AnimatePresence>
          {coach >= 1 && coach <= 2 && status === "playing" && (
            <Coach
              step={coach}
              theme={puzzle.categories[0].name}
              onNext={() => setCoach((c) => c + 1)}
              onDone={() => { setCoach(-1); onTutorialDone(); }}
              onSkip={() => { setCoach(-1); onTutorialDone(); }}
            />
          )}
        </AnimatePresence>
        </div>
        </div>
      </main>

      {/* The welcome step is a centred, dimmed overlay so a first-time player
          reads the rules before the board tempts them into tapping. */}
      <AnimatePresence>
        {coach === 0 && status === "playing" && (
          <WelcomeOverlay
            onStart={() => setCoach(1)}
            onSkip={() => { setCoach(-1); onTutorialDone(); }}
          />
        )}
      </AnimatePresence>

      <div className="sr-only" role="status" aria-live="polite">
        {announce} {toast}
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-center text-sm font-semibold text-paper shadow-[4px_4px_0_rgba(38,34,26,0.4)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {!reduce && burst > 0 && status === "playing" && (
        <Confetti key={burst} count={Math.min(64, 16 + combo * 12)} />
      )}
      {status === "won" && !reduce && <Confetti count={110} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function buildShare(opts: {
  level: number;
  daily: boolean;
  won: boolean;
  stars: number;
  mistakes: number;
  linkCorrect: boolean;
  timeMs: number;
  order: Category[];
  indexByName: Map<string, number>;
}): string {
  // Spoiler-free: shows the solve path as coloured squares, never the words or
  // the level title (which would give the link away to whoever you share with).
  const head = opts.daily ? t("share.daily") : t("share.level", { n: opts.level });
  const rating = opts.won ? "★".repeat(opts.stars) + "☆".repeat(3 - opts.stars) : "✖✖✖";
  const grid = opts.order.map((c) => CATEGORY_THEMES[opts.indexByName.get(c.name) ?? 0].emoji).join("");
  const detail = opts.won
    ? `${opts.linkCorrect ? "🔑✅" : "🔑❌"}  ⏱️ ${fmtTime(opts.timeMs)}${opts.mistakes ? `  ❌${opts.mistakes}` : ""}`
    : t("share.soClose");
  return `${head}  ${rating}\n${grid}\n${detail}\n${t("share.play", { url: location.href })}`;
}

function SecretLink({
  reveal,
  word,
  spotlight,
  score,
  combo,
}: {
  reveal: boolean;
  word: string;
  spotlight: boolean;
  score: number;
  combo: number;
}) {
  return (
    <motion.div
      animate={spotlight ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 1.4, repeat: spotlight ? Infinity : 0 }}
      className={`relative overflow-hidden rounded-2xl border px-4 py-3 text-center ${
        spotlight ? "border-press ring-2 ring-press/60" : "border-ink/25"
      }`}
      style={{ background: "#fffdf6", border: "2px dashed rgba(38,34,26,0.45)", boxShadow: "3px 3px 0 rgba(38,34,26,0.25)" }}
    >
      {score > 0 && (
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-ink/85 px-2 py-0.5 text-xs font-extrabold text-gold-deep">
          <span aria-hidden>✦</span>
          {score.toLocaleString()}
          {combo >= 2 && <span className="ml-0.5 text-press">🔥{combo}</span>}
        </div>
      )}
      <div className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-ink-soft">
        {t(score > 0 ? "game.secretLink" : "game.secretLinkFull")}
      </div>
      <div className="mt-1 flex items-center justify-center gap-2">
        <span aria-hidden className="text-lg">◆</span>
        {reveal ? (
          <motion.span
            initial={{ rotateX: 90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            className="font-display text-2xl font-bold uppercase tracking-wide text-ink"
          >
            {word}
          </motion.span>
        ) : (
          <span className="font-display text-2xl font-bold tracking-[0.3em] text-ink">? ? ?</span>
        )}
      </div>
    </motion.div>
  );
}

function WordTile({
  word,
  display,
  emoji,
  selected,
  disabled,
  onClick,
}: {
  word: string;
  display?: string;
  emoji?: boolean;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const shown = display ?? word;
  const sizeClass = emoji
    ? "text-3xl sm:text-4xl"
    : shown.length >= 8
      ? "text-[0.7rem] sm:text-xs"
      : shown.length >= 7
        ? "text-xs sm:text-sm"
        : "text-sm sm:text-base";

  let look = "border-2 border-ink bg-white text-ink hover:bg-cream";
  let style: React.CSSProperties | undefined;
  if (selected) {
    look = "bg-ink text-paper";
    style = { boxShadow: "2px 2px 0 rgba(38,34,26,0.5)" };
  }

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4, y: -24 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={word}
      className={`relative grid aspect-[1.7/1] w-[calc((100%-1.5rem)/3)] select-none place-items-center rounded-2xl px-1.5 text-center font-bold uppercase leading-tight tracking-wide transition-colors duration-150 ${sizeClass} ${look} disabled:cursor-default`}
      style={style}
    >
      {shown}
    </motion.button>
  );
}

function SolvedBanner({
  cat,
  themeIndex,
  masked,
  compact,
  order,
}: {
  cat: Category;
  themeIndex: number;
  masked: boolean;
  compact?: boolean;
  order: number;
}) {
  const theme = CATEGORY_THEMES[themeIndex % CATEGORY_THEMES.length];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={`flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-r ${theme.grad} shadow-lg ${
        compact ? "px-3 py-1.5" : "px-4 py-2.5"
      }`}
      style={{ color: theme.ink }}
    >
      <span className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-widest opacity-80">
        <span aria-hidden className="text-xs">{theme.shape}</span>
        {masked ? t("game.lockedGroup", { n: order + 1 }) : cat.name}
      </span>
      <span className={`flex gap-1.5 font-extrabold ${compact ? "text-xs" : "text-sm"}`}>
        {cat.spokes.map((w) => (
          <span
            key={w}
            className={`rounded-md ${compact ? "px-1.5 py-0.5" : "px-2 py-0.5"}`}
            style={{ background: "rgba(255,255,255,0.45)" }}
          >
            {masked ? "•••" : w}
          </span>
        ))}
      </span>
    </motion.div>
  );
}

// A hinted-but-unsolved group: shows the theme and placeholders, never the words.
function HintBanner({ cat, themeIndex }: { cat: Category; themeIndex: number }) {
  const theme = CATEGORY_THEMES[themeIndex % CATEGORY_THEMES.length];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="flex items-center justify-between rounded-2xl border-2 border-dashed px-4 py-2.5"
      style={{ borderColor: theme.tint, background: `${theme.tint}14`, color: theme.tint }}
    >
      <span className="flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-widest">
        <span aria-hidden className="text-sm">{theme.shape}</span>
        {cat.name}
      </span>
      <span className="flex gap-1.5" aria-label={t("game.a11y.wordsHidden")}>
        {cat.spokes.map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="h-5 w-7 rounded-md border-2 border-dashed"
            style={{ borderColor: theme.tint, opacity: 0.6 }}
          />
        ))}
      </span>
    </motion.div>
  );
}

function ContinueOffer({ onAccept, onDecline }: { onAccept: () => Promise<void>; onDecline: () => void }) {
  const [pending, setPending] = useState(false);
  const accept = async () => {
    setPending(true);
    try {
      await onAccept();
    } finally {
      setPending(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="mt-7 rounded-3xl border border-gold/70 bg-gold/10 p-6 text-center"
    >
      <div className="text-4xl">😮‍💨</div>
      <h3 className="mt-2 font-display text-2xl font-bold text-ink">{t("game.continue.title")}</h3>
      <p className="mt-1 text-sm text-ink-soft">{t("game.continue.body")}</p>
      <button
        onClick={accept}
        disabled={pending}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-base font-bold text-ink shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition enabled:hover:scale-[1.03] enabled:active:scale-95 disabled:opacity-60"
      >
        <span aria-hidden>🎬</span> {t(pending ? "game.continue.loading" : "game.continue.accept")}
      </button>
      <div>
        <button
          onClick={onDecline}
          disabled={pending}
          className="mt-3 text-xs font-semibold text-ink-soft underline-offset-4 transition enabled:hover:text-ink enabled:hover:underline disabled:opacity-40"
        >
          {t("game.continue.decline")}
        </button>
      </div>
    </motion.div>
  );
}

function Controls({
  mistakes,
  max,
  hideMistakes,
  canSubmit,
  hasSelection,
  canHint,
  hintBank,
  showRefill,
  onSubmit,
  onClear,
  onHint,
  onRefill,
}: {
  mistakes: number;
  max: number;
  hideMistakes?: boolean;
  canSubmit: boolean;
  hasSelection: boolean;
  canHint: boolean;
  hintBank: number;
  showRefill?: boolean;
  onSubmit: () => void;
  onClear: () => void;
  onHint: () => void;
  onRefill: () => void;
}) {
  return (
    <div className="mt-7 flex flex-col items-center gap-4">
      {hideMistakes ? (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-leaf">
          <span aria-hidden>🧘</span> {t("game.zen")}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <span>{t("game.mistakesLeft")}</span>
          <div className="flex gap-1.5" role="img" aria-label={t("game.a11y.guessesLeft", { n: max - mistakes, max })}>
            {Array.from({ length: max }).map((_, i) => (
              <motion.span
                key={i}
                animate={{ scale: i < max - mistakes ? 1 : 0.7, opacity: i < max - mistakes ? 1 : 0.25 }}
                className="h-2.5 w-2.5 rounded-full bg-press"
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onClear}
          disabled={!hasSelection}
          className="rounded-full border border-ink/30 px-5 py-2.5 text-sm font-semibold text-ink transition enabled:hover:bg-cream disabled:opacity-35"
        >
          {t("game.clear")}
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-full bg-ink px-7 py-2.5 text-sm font-bold text-paper shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition enabled:hover:scale-[1.03] enabled:active:scale-95 disabled:opacity-35"
        >
          {t("game.submit")}
        </button>
      </div>
      {showRefill ? (
        <button
          onClick={onRefill}
          className="flex items-center gap-2 rounded-full bg-press px-5 py-2.5 text-sm font-bold text-paper shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition hover:scale-[1.03] active:scale-95"
        >
          <span className="text-base" aria-hidden>🎬</span>
          {t("game.hint.refill")}
        </button>
      ) : (
        <button
          onClick={onHint}
          disabled={!canHint}
          className="flex items-center gap-2 rounded-full border border-gold bg-gold/15 px-5 py-2.5 text-sm font-bold text-gold-deep shadow-[3px_3px_0_rgba(38,34,26,0.35)] transition enabled:hover:bg-gold/25 enabled:hover:scale-[1.03] enabled:active:scale-95 disabled:opacity-35"
        >
          <span className="text-base" aria-hidden>💡</span>
          {t("game.hint")}
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-xs font-extrabold text-ink">
            {hintBank}
          </span>
        </button>
      )}
    </div>
  );
}





// Step 1 teaches with the tutorial board's own first theme rather than words
// baked in here, so re-pinning the opening level can't leave the coach
// describing a puzzle the player isn't looking at.
const COACH: readonly (null | { key: string; cta: string | null })[] = [
  null, // step 0 is the WelcomeOverlay, not an inline coach card
  { key: "coach.1", cta: null }, // advances when the player solves any group
  { key: "coach.2", cta: "common.gotIt" },
];

const WELCOME_RULES = [
  { icon: "🔗", key: "welcome.rule1" },
  { icon: "👆", key: "welcome.rule2" },
  { icon: "⭐", key: "welcome.rule3" },
];

function WelcomeOverlay({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={t("welcome.title")}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-5"
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="w-full max-w-sm rounded-3xl border-2 border-ink bg-paper p-6 text-center shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 13, delay: 0.08 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-press text-3xl text-paper shadow-[3px_3px_0_rgba(38,34,26,0.8)]"
        >
          <span aria-hidden>◆</span>
        </motion.div>
        <h2 className="mt-4 font-display text-3xl font-bold text-ink">{t("welcome.title")}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t("welcome.subtitle")}</p>
        <div className="mt-5 space-y-2.5 text-left">
          {WELCOME_RULES.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.09 }}
              className="flex items-center gap-3 rounded-2xl bg-white p-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-press/10 text-xl" aria-hidden>
                {r.icon}
              </span>
              <span className="text-sm font-semibold leading-snug text-ink">{t(r.key)}</span>
            </motion.div>
          ))}
        </div>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onStart}
          className="mt-6 w-full rounded-2xl bg-press py-3.5 text-base font-bold text-paper shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition hover:scale-[1.02] active:scale-95"
        >
          {t("welcome.start")}
        </motion.button>
        <button
          onClick={onSkip}
          className="mx-auto mt-2 block py-1.5 text-xs font-semibold text-ink-soft transition hover:text-ink"
        >
          {t("welcome.skip")}
        </button>
      </motion.div>
    </motion.div>
  );
}

function Coach({
  step,
  theme,
  onNext,
  onDone,
  onSkip,
}: {
  step: number;
  /** The tutorial board's first category, so the copy matches the tiles. */
  theme: string;
  onNext: () => void;
  onDone: () => void;
  onSkip: () => void;
}) {
  const c = COACH[step];
  if (!c) return null;
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      // Sticky: sits in-flow just below the board on tall screens, but pins to
      // the bottom of the viewport on short ones so it's never off-screen.
      // Styled as a sticky note pinned to the puzzle page.
      className="sticky bottom-3 z-30 mx-auto mt-6 w-full max-w-sm -rotate-1 rounded-sm border border-ink/15 bg-[#ffe9a3] p-4 shadow-[3px_4px_0_rgba(38,34,26,0.3)]"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-press text-sm">
          💡
        </span>
        <span className="font-bold text-ink">{t(`${c.key}.title`)}</span>
        <button
          onClick={onSkip}
          className="ml-auto rounded-full px-2 py-1 text-xs font-semibold text-ink-soft transition hover:bg-cream hover:text-ink"
        >
          {t("common.skip")}
        </button>
      </div>
      <p className="mt-2 text-sm leading-snug text-ink-soft">{t(`${c.key}.body`, { theme })}</p>
      {c.cta && (
        <button
          onClick={step === COACH.length - 1 ? onDone : onNext}
          className="mt-3 w-full rounded-xl bg-ink py-2.5 text-sm font-bold text-paper transition hover:scale-[1.02] active:scale-95"
        >
          {t(c.cta)}
        </button>
      )}
      {!c.cta && (
        <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-press">{t("coach.yourTurn")}</div>
      )}
    </motion.div>
  );
}
