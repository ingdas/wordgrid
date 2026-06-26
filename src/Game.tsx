import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LEVELS, TIER_LABELS, EMOJI_BOSS, buildPuzzle, decoyTiles, type BossTwist, type Category, type Puzzle } from "./puzzles";
import { computeStars, evaluateGuess, guessKey, shuffle, linkMatches, scrambleWord } from "./engine";
import { requestRewarded } from "./sdk";
import { renderShareCard, type ShareCardData } from "./sharecard";
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
const TWIST_LABEL: Record<BossTwist, string> = {
  scramble: "Boss · scrambled tiles",
  emoji: "Boss · emoji only",
  oracle: "Boss · the oracle",
  decoy: "Boss · impostors",
  blackout: "Boss · blackout",
};

const TWIST_INTRO: Record<BossTwist, string> = {
  scramble: "👑 Boss fight — the tiles are scrambled. Unscramble, then group them!",
  emoji: "👑 Boss fight — every tile is an emoji. Read the pictures, then group them!",
  oracle: "🔮 The Oracle — every word and theme is laid bare. Name the hidden link first, then group at your leisure.",
  decoy: "👑 Boss fight — three impostor tiles belong to NO group. Choose carefully!",
  blackout: "👑 Boss fight — blackout! Solved groups stay hidden until the reveal.",
};

// A distinct shape per group so colour is never the only differentiator
// (colourblind-friendly).
export const CATEGORY_THEMES = [
  { grad: "from-amber-300 to-orange-400", ink: "#3b1f00", emoji: "🟨", shape: "●", tint: "#fbbf24" },
  { grad: "from-sky-400 to-cyan-300", ink: "#04293a", emoji: "🟦", shape: "▲", tint: "#38bdf8" },
  { grad: "from-violet-400 to-fuchsia-400", ink: "#2a0a3a", emoji: "🟪", shape: "■", tint: "#c084fc" },
  { grad: "from-emerald-400 to-teal-300", ink: "#04302a", emoji: "🟩", shape: "◆", tint: "#34d399" },
];

const RATINGS = ["Flawless ✨", "Brilliant!", "Great work!", "Nicely done", "Phew — just made it!"];

type Status = "playing" | "guessing" | "won" | "lost";

interface GameProps {
  puzzleIndex: number;
  reduce: boolean;
  streak: number;
  tutorial: boolean;
  daily: boolean;
  twist: BossTwist | null;
  bestMs?: number;
  hintBank: number;
  onUseHint: () => void;
  onWin: (result: { stars: number; linkCorrect: boolean; timeMs: number; mistakes: number; title: string; score: number }) => void;
  onLoss: (result: { timeMs: number; mistakes: number; title: string }) => void;
  onExit: () => void;
  onNext?: () => void;
  onHelp: () => void;
  onTutorialDone: () => void;
}

function fmtTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function Game({
  puzzleIndex,
  reduce,
  streak,
  tutorial,
  daily,
  twist,
  bestMs,
  hintBank,
  onUseHint,
  onWin,
  onLoss,
  onExit,
  onNext,
  onHelp,
  onTutorialDone,
}: GameProps) {
  const boss = twist != null;
  // The emoji boss swaps in a bespoke picture board; every other twist plays the
  // chapter's own level with a different presentation/rule.
  const levelRaw = LEVELS[puzzleIndex];
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
  const [pops, setPops] = useState<{ id: number; text: string }[]>([]);
  const popId = useRef(0);
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

  // Tick a clock once a second while playing, for the timer display.
  useEffect(() => {
    if (status !== "playing") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [status]);

  // One-time boss intro, tailored to this boss's twist.
  useEffect(() => {
    if (twist) setToast(TWIST_INTRO[twist]);
  }, [twist]);

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
    const t = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(t);
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
      setAnnounce(`Group found: ${cat.name}. ${index + 1} of 4.`);
      setSolved((prev) => [...prev, cat]);
      setSelected([]);
      // A consecutive-solve combo multiplies the 100-point base.
      setCombo((c) => {
        const nc = c + 1;
        const pts = 100 * nc;
        setScore((s) => s + pts);
        pushPop(nc > 1 ? `+${pts}  ×${nc}` : `+${pts}`);
        return nc;
      });
    },
    [buzz, pushPop]
  );

  // Auto-solve the final pair, then move on. Normally that's the "guess the
  // link" finale; the Oracle already knows the link, so it wins outright.
  useEffect(() => {
    if (status !== "playing") return;
    if (solved.length === puzzle.categories.length - 1) {
      const last = unsolvedCategories[0];
      const t = setTimeout(() => solveCategory(last, solved.length), 600);
      return () => clearTimeout(t);
    }
    if (solved.length === puzzle.categories.length) setStatus(twist === "oracle" ? "won" : "guessing");
  }, [solved, status, unsolvedCategories, puzzle.categories.length, solveCategory, twist]);

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
      const t = Date.now() - startedAt.current;
      setFinalMs(t);
      playWin();
      buzz([0, 40, 60, 40]);
      setAnnounce(`Solved! The secret link was ${puzzle.pivot}. ${finalStars} of 3 stars.`);
      for (let i = 0; i < finalStars; i++) setTimeout(() => playStar(i), 450 + i * 200);
      onWin({ stars: finalStars, linkCorrect, timeMs: t, mistakes, title: puzzle.title, score });
    } else if (status === "lost") {
      reported.current = true;
      // The link stays secret on a loss so it can still be guessed on a replay.
      setAnnounce("Out of guesses. Replay the level to discover the secret link.");
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
      setToast("You already tried that group.");
      setShake((s) => s + 1);
      return;
    }
    setPastGuesses((prev) => new Set(prev).add(guessKey(selected)));
    setToast(result.oneAway ? "🎯 So close — one away!" : "Those three aren't a group.");
    playWrong();
    buzz([0, 50, 30, 50]);
    setShake((s) => s + 1);
    setCombo(0); // a wrong guess breaks the combo
    if (combo >= 2) pushPop("Combo lost");
    setMistakes((m) => {
      const next = m + 1;
      if (next >= MAX_MISTAKES) {
        setSelected([]);
        // Offer a one-time rewarded continue before ending the run.
        if (!secondChanceUsed) setOffering(true);
        else setStatus("lost");
      }
      return next;
    });
  }, [status, offering, selected, unsolvedCategories, solveCategory, solved.length, pastGuesses, buzz, combo, pushPop, secondChanceUsed]);

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
    setMistakes((m) => Math.max(0, m - 2));
    setToast("Second chance! Two tries back. 🎬");
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
    setToast(`Hint: a group is “${cat.name}”.`);
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

  const restart = useCallback(() => {
    reported.current = false;
    startedAt.current = Date.now();
    setNow(Date.now());
    setSolved([]);
    setSelected([]);
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
    setCombo(0);
    setPops([]);
    setOffering(false);
    setSecondChanceUsed(false);
    setOrder(shuffle(spokeTiles));
  }, [spokeTiles, twist]);

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
      setScore((s) => s + 250);
      pushPop("+250  🔑");
      playStar(2);
      buzz(40);
      // The Oracle names the link first, then drops into grouping; everyone
      // else has already grouped, so a correct link wins.
      setTimeout(() => setStatus(twist === "oracle" ? "playing" : "won"), 800);
      return true;
    },
    [puzzle.pivot, puzzle.accept, buzz, twist, pushPop]
  );

  // Give up: reveal the word (counts as a miss → costs a star). For the Oracle
  // this still hands you the link and moves you into the grouping phase.
  const revealLinkWord = useCallback(() => {
    setLinkGuess(" "); // a value that never matches
    playWrong();
    setTimeout(() => setStatus(twist === "oracle" ? "playing" : "won"), 700);
  }, [twist]);

  // The Oracle's "name the link first" phase: shown all words + themes, link
  // still hidden, before any grouping.
  const oraclePending = twist === "oracle" && status === "guessing" && linkGuess == null;
  // A win reveals the link; a loss keeps it secret for the replay. The Oracle
  // also reveals it the moment you've named it (you've earned the sight).
  const revealLink = status === "won" || (twist === "oracle" && linkGuess != null);
  const stars = finalStars;
  const hintWords = coach === 1 ? new Set(puzzle.categories[0].spokes) : null;
  // Blackout boss: keep solved group names/words hidden until the final reveal.
  const maskSolved = twist === "blackout" && !revealLink;
  // Show only the groups actually solved (never the unsolved ones on a loss).
  const bannerCats: Category[] = solved;

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 py-2 pl-2.5 pr-4 text-sm font-semibold text-indigo-100 transition hover:bg-white/15 active:scale-95"
        >
          <span aria-hidden>‹</span> Levels
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 font-display text-lg font-bold leading-none text-white">
            {boss && !revealLink && <span aria-hidden>👑</span>}
            Level {puzzleIndex + 1}
          </div>
          <div
            className={`mt-0.5 text-[0.7rem] font-bold uppercase tracking-widest ${
              boss && !revealLink ? "text-fuchsia-300" : "text-indigo-300/70"
            }`}
          >
            {revealLink ? puzzle.title : twist ? TWIST_LABEL[twist] : TIER_LABELS[levelRaw.tier]}
          </div>
        </div>
        <button
          onClick={onHelp}
          aria-label="How to play"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-base font-semibold text-indigo-100 transition hover:bg-white/15 active:scale-95"
        >
          ?
        </button>
      </div>

      <main className="relative mt-4 flex-1">
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
                className="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-3 py-1 text-sm font-extrabold text-amber-950 shadow-lg"
              >
                {p.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* The secret link — present in every group, word hidden until the end */}
        <SecretLink
          reveal={revealLink}
          word={puzzle.pivot}
          spotlight={coach === 0}
          score={score}
          combo={combo}
        />

        {oraclePending && (
          <div className="mt-3 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-300/5 p-3">
            <div className="text-center text-[0.7rem] font-bold uppercase tracking-widest text-fuchsia-200/80">
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

        {/* During the typed finale, collapse the solved groups into a compact
            two-column strip so the whole end-state fits one phone screen. */}
        {status === "guessing" && !oraclePending && bannerCats.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {bannerCats.map((cat) => {
              const theme = CATEGORY_THEMES[(indexByName.get(cat.name) ?? 0) % CATEGORY_THEMES.length];
              return (
                <div
                  key={cat.name}
                  className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[0.7rem] font-bold"
                  style={{ background: `${theme.tint}24`, color: theme.tint }}
                >
                  <span aria-hidden>{theme.shape}</span>
                  <span className="truncate leading-tight">{cat.name}</span>
                  <span className="ml-auto" aria-hidden>✓</span>
                </div>
              );
            })}
          </div>
        )}

        {status !== "guessing" && (bannerCats.length > 0 || revealedHints.size > 0) && (
          <div className="mt-3 space-y-2">
            <AnimatePresence initial={false}>
              {bannerCats.map((cat, i) => (
                <SolvedBanner
                  key={cat.name}
                  cat={cat}
                  themeIndex={indexByName.get(cat.name) ?? 0}
                  masked={maskSolved}
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

        {(status === "playing" || status === "lost" || oraclePending) && (
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
                  hinted={!!hintWords?.has(word)}
                  disabled={status !== "playing" || offering}
                  onClick={() => toggleSelect(word)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        {status === "lost" && (
          <p className="mt-6 text-center text-sm text-indigo-200/70">
            Out of guesses — the link is still a secret. Replay to crack it!
          </p>
        )}

        {status === "playing" && !offering && (
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-indigo-200/70">
            <span aria-label="time elapsed">⏱ {fmtTime(now - startedAt.current)}</span>
            <span aria-hidden>·</span>
            <span>{moves} {moves === 1 ? "move" : "moves"}</span>
            <button
              onClick={shuffleTiles}
              className="rounded-full border border-white/15 px-2.5 py-1 font-semibold text-indigo-100 transition hover:bg-white/10 active:scale-95"
            >
              🔀 Shuffle
            </button>
          </div>
        )}

        {status === "playing" && !offering && (
          <Controls
            mistakes={mistakes}
            max={MAX_MISTAKES}
            canSubmit={selected.length === 3}
            hasSelection={selected.length > 0}
            canHint={canHint}
            hintBank={hintBank}
            onSubmit={submit}
            onClear={clearSelection}
            onHint={revealCategory}
          />
        )}

        <AnimatePresence>
          {offering && <ContinueOffer onAccept={takeSecondChance} onDecline={declineSecondChance} />}
        </AnimatePresence>

        {status === "guessing" && (
          <LinkGuess
            oracle={twist === "oracle"}
            resolved={linkGuess != null}
            pivot={puzzle.pivot}
            revealedLetters={revealedLetters}
            hintBank={hintBank}
            canRevealLetter={canRevealLetter}
            onRevealLetter={revealLetter}
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
              onExit={onExit}
              onRestart={restart}
              onNext={onNext}
            />
          )}
        </AnimatePresence>

        {/* The coach sits in the game flow (just below the board) so it stays
            close to the action on wide/tall desktop screens, not pinned far away
            at the bottom of the viewport. */}
        <AnimatePresence>
          {coach >= 0 && coach <= 2 && status === "playing" && (
            <Coach step={coach} onNext={() => setCoach((c) => c + 1)} onDone={() => { setCoach(-1); onTutorialDone(); }} />
          )}
        </AnimatePresence>
      </main>

      <div className="sr-only" role="status" aria-live="polite">
        {announce} {toast}
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-full bg-white/95 px-5 py-2.5 text-center text-sm font-semibold text-slate-900 shadow-2xl shadow-black/40 backdrop-blur"
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
  const head = opts.daily ? "WordGrid Daily" : `WordGrid · Level ${opts.level}`;
  const rating = opts.won ? "★".repeat(opts.stars) + "☆".repeat(3 - opts.stars) : "✖✖✖";
  const grid = opts.order.map((c) => CATEGORY_THEMES[opts.indexByName.get(c.name) ?? 0].emoji).join("");
  const detail = opts.won
    ? `${opts.linkCorrect ? "🔑✅" : "🔑❌"}  ⏱️ ${fmtTime(opts.timeMs)}${opts.mistakes ? `  ❌${opts.mistakes}` : ""}`
    : "So close!";
  return `${head}  ${rating}\n${grid}\n${detail}\nPlay 👉 ${location.href}`;
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
        spotlight ? "border-fuchsia-300 ring-2 ring-fuchsia-300/70" : "border-white/15"
      }`}
      style={{ background: "linear-gradient(110deg,rgba(129,140,248,0.18),rgba(232,121,249,0.18))" }}
    >
      {score > 0 && (
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-xs font-extrabold text-amber-200">
          <span aria-hidden>✦</span>
          {score.toLocaleString()}
          {combo >= 2 && <span className="ml-0.5 text-orange-300">🔥{combo}</span>}
        </div>
      )}
      <div className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-indigo-200/80">
        Secret link · in every group
      </div>
      <div className="mt-1 flex items-center justify-center gap-2">
        <span aria-hidden className="text-lg">◆</span>
        {reveal ? (
          <motion.span
            initial={{ rotateX: 90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            className="font-display text-2xl font-bold uppercase tracking-wide text-white"
          >
            {word}
          </motion.span>
        ) : (
          <span className="font-display text-2xl font-bold tracking-[0.3em] text-white/90">? ? ?</span>
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
  hinted,
  disabled,
  onClick,
}: {
  word: string;
  display?: string;
  emoji?: boolean;
  selected: boolean;
  hinted: boolean;
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

  let look = "border border-white/12 bg-white/[0.06] text-indigo-50 hover:bg-white/[0.12]";
  let style: React.CSSProperties | undefined;
  if (selected) {
    look = "bg-white text-slate-900";
    style = { boxShadow: "0 10px 30px -8px rgba(255,255,255,0.4)" };
  } else if (hinted) {
    look = "border-fuchsia-300 text-white";
    style = { boxShadow: "0 0 0 2px rgba(240,171,252,0.8)" };
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
      className={`relative grid aspect-[1.7/1] w-[calc((100%-1.5rem)/3)] select-none place-items-center rounded-2xl px-1.5 text-center font-bold uppercase leading-tight tracking-wide ${sizeClass} ${look} disabled:cursor-default`}
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
  order,
}: {
  cat: Category;
  themeIndex: number;
  masked: boolean;
  order: number;
}) {
  const theme = CATEGORY_THEMES[themeIndex % CATEGORY_THEMES.length];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={`flex items-center justify-between rounded-2xl bg-gradient-to-r ${theme.grad} px-4 py-2.5 shadow-lg`}
      style={{ color: theme.ink }}
    >
      <span className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-widest opacity-80">
        <span aria-hidden className="text-xs">{theme.shape}</span>
        {masked ? `Group ${order + 1} · locked` : cat.name}
      </span>
      <span className="flex gap-1.5 text-sm font-extrabold">
        {cat.spokes.map((w) => (
          <span key={w} className="rounded-md px-2 py-0.5" style={{ background: "rgba(255,255,255,0.28)" }}>
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
      <span className="flex gap-1.5" aria-label="words not revealed">
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
      className="mt-7 rounded-3xl border border-amber-300/30 bg-gradient-to-b from-amber-300/10 to-transparent p-6 text-center"
    >
      <div className="text-4xl">😮‍💨</div>
      <h3 className="mt-2 font-display text-2xl font-bold text-white">So close — don't stop now!</h3>
      <p className="mt-1 text-sm text-indigo-200/80">Take a second chance and get two tries back.</p>
      <button
        onClick={accept}
        disabled={pending}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-3 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition enabled:hover:scale-[1.03] enabled:active:scale-95 disabled:opacity-60"
      >
        <span aria-hidden>🎬</span> {pending ? "Loading…" : "Watch & continue (+2)"}
      </button>
      <div>
        <button
          onClick={onDecline}
          disabled={pending}
          className="mt-3 text-xs font-semibold text-indigo-200/70 underline-offset-4 transition enabled:hover:text-white enabled:hover:underline disabled:opacity-40"
        >
          No thanks — end the run
        </button>
      </div>
    </motion.div>
  );
}

function Controls({
  mistakes,
  max,
  canSubmit,
  hasSelection,
  canHint,
  hintBank,
  onSubmit,
  onClear,
  onHint,
}: {
  mistakes: number;
  max: number;
  canSubmit: boolean;
  hasSelection: boolean;
  canHint: boolean;
  hintBank: number;
  onSubmit: () => void;
  onClear: () => void;
  onHint: () => void;
}) {
  return (
    <div className="mt-7 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-indigo-200/80">
        <span>Mistakes left</span>
        <div className="flex gap-1.5" role="img" aria-label={`${max - mistakes} of ${max} guesses remaining`}>
          {Array.from({ length: max }).map((_, i) => (
            <motion.span
              key={i}
              animate={{ scale: i < max - mistakes ? 1 : 0.7, opacity: i < max - mistakes ? 1 : 0.25 }}
              className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-rose-400 to-pink-500"
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onClear}
          disabled={!hasSelection}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-indigo-100 transition enabled:hover:bg-white/10 disabled:opacity-35"
        >
          Clear
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-full bg-white px-7 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-black/30 transition enabled:hover:scale-[1.03] enabled:active:scale-95 disabled:opacity-35"
        >
          Submit group
        </button>
      </div>
      <button
        onClick={onHint}
        disabled={!canHint}
        className="flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-300/15 px-5 py-2.5 text-sm font-bold text-amber-200 shadow-lg shadow-amber-500/10 transition enabled:hover:bg-amber-300/25 enabled:hover:scale-[1.03] enabled:active:scale-95 disabled:opacity-35"
      >
        <span className="text-base" aria-hidden>💡</span>
        Reveal a group's theme
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-300 px-1 text-xs font-extrabold text-amber-950">
          {hintBank}
        </span>
      </button>
    </div>
  );
}

// Build a deterministic letter bank: the pivot's letters plus filler letters,
// shuffled, totalling ~13–15 tiles. The pivot is always spellable from it.
function buildLetterBank(pivot: string): string[] {
  const letters = pivot.split("");
  const total = Math.min(15, Math.max(13, pivot.length + 8));
  const POOL = "EAIOTNRSLCUDPMHGBFYWKVXZJQ";
  let seed = 7;
  for (const c of pivot) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const rand = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 0x100000000;
  while (letters.length < total) letters.push(POOL[Math.floor(rand() * POOL.length)]);
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters;
}

function LinkGuess({
  oracle,
  resolved,
  pivot,
  revealedLetters,
  hintBank,
  canRevealLetter,
  onRevealLetter,
  onSubmit,
  onReveal,
}: {
  oracle: boolean;
  resolved: boolean;
  pivot: string;
  revealedLetters: number;
  hintBank: number;
  canRevealLetter: boolean;
  onRevealLetter: () => void;
  onSubmit: (text: string) => boolean;
  onReveal: () => void;
}) {
  const bank = useMemo(() => buildLetterBank(pivot), [pivot]);
  // Indices of bank tiles the player has tapped, in order (the suffix after the
  // free/ revealed prefix). Cleared whenever the revealed prefix grows.
  const [taps, setTaps] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    setTaps([]);
  }, [revealedLetters]);

  // Bank tiles consumed: greedily by the locked prefix, then the player's taps.
  const used = useMemo(() => {
    const s = new Set<number>();
    for (let k = 0; k < revealedLetters && k < pivot.length; k++) {
      const ch = pivot[k];
      for (let i = 0; i < bank.length; i++) {
        if (!s.has(i) && bank[i] === ch) { s.add(i); break; }
      }
    }
    taps.forEach((i) => s.add(i));
    return s;
  }, [bank, pivot, revealedLetters, taps]);

  const prefix = pivot.slice(0, revealedLetters);
  const built = prefix + taps.map((i) => bank[i]).join("");
  const full = built.length >= pivot.length;

  // Auto-check once every slot is filled (no keyboard, no Submit button).
  useEffect(() => {
    if (resolved || !full || submitting.current) return;
    submitting.current = true;
    const t = setTimeout(() => {
      const ok = onSubmit(built);
      submitting.current = false;
      if (!ok) {
        setWrong(true);
        setShakeKey((k) => k + 1);
        setTaps([]);
      }
    }, 280);
    return () => { clearTimeout(t); submitting.current = false; };
  }, [full, built, resolved, onSubmit]);

  const tap = (i: number) => {
    if (resolved || used.has(i) || full) return;
    setWrong(false);
    playSelect();
    setTaps((prev) => [...prev, i]);
  };
  const backspace = () => {
    if (!taps.length) return;
    playDeselect();
    setWrong(false);
    setTaps((prev) => prev.slice(0, -1));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-7 text-center">
      <h3 className="font-display text-xl font-bold text-white">
        {oracle ? "🔮 Name the hidden link" : "All four groups found!"}
      </h3>
      <p className="mt-1 text-sm text-indigo-200/80">
        {oracle
          ? "Read the words and themes above — tap letters to spell the word that joins them."
          : "Tap the letters to spell the secret word that links them all."}
      </p>

      {/* The answer so far. Tapped letters fill the slots; reveal-a-letter locks some. */}
      <motion.div
        key={shakeKey}
        animate={wrong ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="mt-4 flex flex-wrap justify-center gap-1.5"
        aria-label={`${pivot.length} letters`}
      >
        {pivot.split("").map((_, i) => {
          const locked = i < revealedLetters;
          const placed = i < built.length;
          const next = i === built.length && !resolved;
          return (
            <span
              key={i}
              className={`grid h-10 w-8 place-items-center rounded-md border text-lg font-extrabold transition ${
                resolved || placed
                  ? locked
                    ? "border-amber-300/60 bg-amber-300/10 text-amber-100"
                    : "border-fuchsia-300/60 bg-fuchsia-300/15 text-white"
                  : next
                    ? "border-fuchsia-300 text-white/30"
                    : "border-white/15 text-white/25"
              }`}
            >
              {resolved ? pivot[i] : placed ? built[i] : "_"}
            </span>
          );
        })}
      </motion.div>

      {wrong ? (
        <p className="mt-2 text-sm font-semibold text-rose-300">Not the word — try again.</p>
      ) : (
        <p className="mt-2 text-xs text-indigo-200/50">Tap a tile to place it; each letter is used once.</p>
      )}

      {/* The letter bank */}
      <div className="mx-auto mt-3 flex max-w-sm flex-wrap justify-center gap-2">
        {bank.map((ch, i) => {
          const isUsed = used.has(i);
          return (
            <motion.button
              key={i}
              whileTap={isUsed || resolved ? undefined : { scale: 0.88 }}
              onClick={() => tap(i)}
              disabled={isUsed || resolved || full}
              aria-label={`Letter ${ch}${isUsed ? ", used" : ""}`}
              className={`grid h-11 w-9 place-items-center rounded-xl text-lg font-extrabold transition ${
                isUsed
                  ? "border border-white/5 bg-white/[0.02] text-white/15"
                  : "border border-white/15 bg-white/[0.08] text-indigo-50 hover:bg-white/[0.16] active:scale-95"
              }`}
            >
              {ch}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={backspace}
          disabled={resolved || !taps.length}
          className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-indigo-100 transition enabled:hover:bg-white/10 enabled:active:scale-95 disabled:opacity-35"
        >
          ⌫ Undo
        </button>
        <button
          onClick={onRevealLetter}
          disabled={resolved || !canRevealLetter}
          className="flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-300/15 px-4 py-2 text-xs font-bold text-amber-200 transition enabled:hover:bg-amber-300/25 enabled:active:scale-95 disabled:opacity-35"
        >
          💡 Reveal a letter
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-amber-300 px-1 text-[0.65rem] font-extrabold text-amber-950">
            {hintBank}
          </span>
        </button>
        <button
          onClick={onReveal}
          disabled={resolved}
          className="rounded-full px-3 py-2 text-xs font-semibold text-indigo-200/70 underline-offset-4 transition enabled:hover:text-white enabled:hover:underline disabled:opacity-40"
        >
          Give up (costs a star)
        </button>
      </div>
    </motion.div>
  );
}

function StarRow({ stars }: { stars: number }) {
  return (
    <div className="flex justify-center gap-2">
      {[0, 1, 2].map((i) => {
        const earned = i < stars;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: earned ? 1 : 0.8, rotate: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.2 + i * 0.2 }}
            style={{ fontSize: 44 }}
            className={earned ? "drop-shadow-[0_2px_10px_rgba(251,191,36,0.6)]" : "opacity-30 grayscale"}
          >
            {earned ? "⭐" : "☆"}
          </motion.div>
        );
      })}
    </div>
  );
}

function EndCard({
  won,
  title,
  stars,
  mistakes,
  streak,
  pivot,
  linkCorrect,
  timeMs,
  bestMs,
  score,
  shareText,
  shareData,
  onShareToast,
  onExit,
  onRestart,
  onNext,
}: {
  won: boolean;
  title: string;
  stars: number;
  mistakes: number;
  streak: number;
  pivot: string;
  linkCorrect: boolean;
  timeMs: number;
  bestMs?: number;
  score: number;
  shareText: string;
  shareData: ShareCardData;
  onShareToast: (msg: string) => void;
  onExit: () => void;
  onRestart: () => void;
  onNext?: () => void;
}) {
  const newBest = won && (bestMs == null || timeMs < bestMs);
  const share = async () => {
    // Render the result image; share it with the caption when the platform
    // supports file sharing, else copy the text and save the image.
    const blob = await renderShareCard(shareData);
    const file = blob ? new File([blob], "wordgrid.png", { type: "image/png" }) : null;
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: shareText });
        return;
      }
    } catch {
      /* fall through to copy/save */
    }
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      /* ignore */
    }
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wordgrid.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      onShareToast("Image saved · text copied!");
    } else {
      onShareToast("Result copied to clipboard!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="mt-8 rounded-3xl border border-white/12 bg-white/[0.06] p-6 text-center backdrop-blur-xl"
    >
      {won ? (
        <>
          <StarRow stars={stars} />
          <h3 className="mt-3 font-display text-2xl font-bold text-white">
            {RATINGS[Math.min(mistakes, RATINGS.length - 1)]}
          </h3>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-fuchsia-300/90">{title}</p>
          <p className="mt-2 text-sm text-indigo-200/80">
            The secret link was{" "}
            <span className="font-bold text-white underline decoration-fuchsia-400/70 decoration-2 underline-offset-4">
              {pivot}
            </span>
            . {linkCorrect ? "🔑 You guessed it!" : "Missed the link — that cost a star."}
          </p>
          {streak >= 2 && <div className="mt-1 text-sm font-semibold text-amber-300">🔥 {streak} in a row!</div>}
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300/20 to-orange-400/20 px-4 py-1.5 text-base font-extrabold text-amber-200">
            <span aria-hidden>✦</span> {score.toLocaleString()} pts
            {stars === 3 && <span className="text-sm font-bold text-orange-300">· full combo!</span>}
          </div>
          <div className="mt-2 text-xs text-indigo-200/70">
            ⏱ {fmtTime(timeMs)}
            {newBest ? (
              <span className="ml-1 font-semibold text-emerald-300">— new best!</span>
            ) : (
              bestMs != null && <span className="ml-1">· best {fmtTime(bestMs)}</span>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="text-4xl">🧩</div>
          <h3 className="mt-2 font-display text-2xl font-bold text-white">Out of guesses</h3>
          <p className="mt-2 text-sm text-indigo-200/80">
            The secret link stays hidden — replay the level and you can still crack it.
          </p>
        </>
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          onClick={onExit}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-white/10"
        >
          Levels
        </button>
        <button
          onClick={won ? share : onRestart}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-white/10"
        >
          {won ? "Share" : "Try again"}
        </button>
        {won &&
          (onNext ? (
            <button
              onClick={onNext}
              className="rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-[1.03] active:scale-95"
            >
              Next level →
            </button>
          ) : (
            <button
              onClick={onExit}
              className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:scale-[1.03] active:scale-95"
            >
              All done 🎉
            </button>
          ))}
      </div>
    </motion.div>
  );
}

const COACH = [
  {
    title: "Meet the secret link",
    body: "One hidden word belongs to every group. It stays masked up top — you'll reveal it at the very end.",
    cta: "Next",
  },
  {
    title: "Find a group",
    body: "Tap the three highlighted words that share a theme, then hit Submit group. The hidden link joins them automatically.",
    cta: null, // advances when the player solves their first group
  },
  {
    title: "You've got it!",
    body: "Find the other groups, then tap out the secret word that links them all — no typing needed. Good luck!",
    cta: "Let's go",
  },
];

function Coach({ step, onNext, onDone }: { step: number; onNext: () => void; onDone: () => void }) {
  const c = COACH[step];
  if (!c) return null;
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="mx-auto mt-6 w-full max-w-sm rounded-2xl border border-fuchsia-300/30 bg-[#1b1740]/95 p-4 shadow-2xl backdrop-blur"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-sm">
          💡
        </span>
        <span className="font-bold text-white">{c.title}</span>
      </div>
      <p className="mt-2 text-sm leading-snug text-indigo-100/85">{c.body}</p>
      {c.cta && (
        <button
          onClick={step === COACH.length - 1 ? onDone : onNext}
          className="mt-3 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-slate-900 transition hover:scale-[1.02] active:scale-95"
        >
          {c.cta}
        </button>
      )}
      {!c.cta && <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-fuchsia-300">Your turn ↑</div>}
    </motion.div>
  );
}
