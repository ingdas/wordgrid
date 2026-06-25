import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LEVELS, TIER_LABELS, buildPuzzle, type Category, type Puzzle } from "./puzzles";
import { computeStars, evaluateGuess, guessKey, shuffle } from "./engine";
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

// A distinct shape per group so colour is never the only differentiator
// (colourblind-friendly).
export const CATEGORY_THEMES = [
  { grad: "from-amber-300 to-orange-400", ink: "#3b1f00", emoji: "🟨", shape: "●" },
  { grad: "from-sky-400 to-cyan-300", ink: "#04293a", emoji: "🟦", shape: "▲" },
  { grad: "from-violet-400 to-fuchsia-400", ink: "#2a0a3a", emoji: "🟪", shape: "■" },
  { grad: "from-emerald-400 to-teal-300", ink: "#04302a", emoji: "🟩", shape: "◆" },
];

const RATINGS = ["Flawless ✨", "Brilliant!", "Great work!", "Nicely done", "Phew — just made it!"];

type Status = "playing" | "guessing" | "won" | "lost";

interface GameProps {
  puzzleIndex: number;
  reduce: boolean;
  streak: number;
  tutorial: boolean;
  daily: boolean;
  bestMs?: number;
  onWin: (result: { stars: number; linkCorrect: boolean; timeMs: number }) => void;
  onLoss: () => void;
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
  bestMs,
  onWin,
  onLoss,
  onExit,
  onNext,
  onHelp,
  onTutorialDone,
}: GameProps) {
  const raw = LEVELS[puzzleIndex];
  const puzzle: Puzzle = useMemo(() => buildPuzzle(raw, 7), [raw]);

  // The 12 spoke tiles (everything except the hidden link), in shuffled order.
  const spokeTiles = useMemo(() => puzzle.words.filter((w) => w !== puzzle.pivot), [puzzle]);

  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState<Category[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [status, setStatus] = useState<Status>("playing");
  const [shake, setShake] = useState(0);
  const [burst, setBurst] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [pastGuesses, setPastGuesses] = useState<Set<string>>(new Set());
  const [linkGuess, setLinkGuess] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [moves, setMoves] = useState(0);
  const [order, setOrder] = useState<string[]>(spokeTiles);
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

  // Four multiple-choice options for the finale: the real link + 3 decoys.
  // Decoys are biased toward a similar length to the answer so they can't be
  // eliminated at a glance — a bit more thought than purely random picks.
  const linkOptions = useMemo(() => {
    const pool = LEVELS.map((p) => p.pivot).filter((w) => w !== puzzle.pivot);
    const near = pool
      .map((w) => ({ w, d: Math.abs(w.length - puzzle.pivot.length) + Math.random() }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 8)
      .map((x) => x.w);
    const decoys = near.sort(() => Math.random() - 0.5).slice(0, 3);
    return [puzzle.pivot, ...decoys].sort(() => Math.random() - 0.5);
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

  const solveCategory = useCallback(
    (cat: Category, combo: number) => {
      playCorrect(combo);
      buzz(30);
      setBurst((b) => b + 1);
      setAnnounce(`Group found: ${cat.name}. ${combo + 1} of 4.`);
      setSolved((prev) => [...prev, cat]);
      setSelected([]);
    },
    [buzz]
  );

  // Auto-solve the final pair, then move to the "guess the link" finale.
  useEffect(() => {
    if (status !== "playing") return;
    if (solved.length === puzzle.categories.length - 1) {
      const last = unsolvedCategories[0];
      const t = setTimeout(() => solveCategory(last, solved.length), 600);
      return () => clearTimeout(t);
    }
    if (solved.length === puzzle.categories.length) setStatus("guessing");
  }, [solved, status, unsolvedCategories, puzzle.categories.length, solveCategory]);

  // Advance the coach once the player lands their first pair, and record that
  // the tutorial has been completed so it never re-triggers.
  useEffect(() => {
    if (coach === 1 && solved.length >= 1) {
      setCoach(2);
      onTutorialDone();
    }
  }, [coach, solved.length, onTutorialDone]);

  // Final stars: from pairing mistakes, minus a wrong link guess and any hints.
  const finalStars = computeStars({
    mistakes,
    linkGuessed: linkGuess != null,
    linkCorrect: linkGuess === puzzle.pivot,
    hintsUsed,
  });

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
      onWin({ stars: finalStars, linkCorrect: linkGuess === puzzle.pivot, timeMs: t });
    } else if (status === "lost") {
      reported.current = true;
      setAnnounce(`Out of guesses. The secret link was ${puzzle.pivot}.`);
      onLoss();
    }
  }, [status, finalStars, onWin, onLoss, buzz, linkGuess, puzzle.pivot]);

  const toggleSelect = useCallback(
    (word: string) => {
      if (status !== "playing") return;
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
    [status]
  );

  const submit = useCallback(() => {
    if (status !== "playing" || selected.length !== 3) return;
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
    setToast("Those three aren't a group.");
    playWrong();
    buzz([0, 50, 30, 50]);
    setShake((s) => s + 1);
    setMistakes((m) => {
      const next = m + 1;
      if (next >= MAX_MISTAKES) {
        setStatus("lost");
        setSelected([]);
      }
      return next;
    });
  }, [status, selected, unsolvedCategories, solveCategory, solved.length, pastGuesses, buzz]);

  const clearSelection = useCallback(() => {
    if (selected.length) playClear();
    setSelected([]);
  }, [selected.length]);

  const shuffleTiles = useCallback(() => {
    playSelect();
    setOrder((o) => shuffle(o));
  }, []);

  // Hint: auto-solve one unsolved group for the cost of a star.
  const useHint = useCallback(() => {
    if (status !== "playing" || unsolvedCategories.length <= 1) return;
    setHintsUsed((h) => h + 1);
    solveCategory(unsolvedCategories[0], solved.length);
  }, [status, unsolvedCategories, solveCategory, solved.length]);

  const restart = useCallback(() => {
    reported.current = false;
    startedAt.current = Date.now();
    setNow(Date.now());
    setSolved([]);
    setSelected([]);
    setMistakes(0);
    setStatus("playing");
    setShake(0);
    setBurst(0);
    setToast(null);
    setPastGuesses(new Set());
    setLinkGuess(null);
    setHintsUsed(0);
    setMoves(0);
    setOrder(shuffle(spokeTiles));
  }, [spokeTiles]);

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

  const guessLink = useCallback(
    (word: string) => {
      setLinkGuess(word);
      if (word === puzzle.pivot) playStar(2);
      else playWrong();
      setTimeout(() => setStatus("won"), 900);
    },
    [puzzle.pivot]
  );

  const revealLink = status === "won" || status === "lost";
  const stars = finalStars;
  const hintWords = coach === 1 ? new Set(puzzle.categories[0].spokes) : null;
  // On a loss, reveal every group (solved first, then the rest, faded).
  const bannerCats: Category[] =
    status === "lost" ? [...solved, ...puzzle.categories.filter((c) => !solved.includes(c))] : solved;

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-16 pt-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 py-2 pl-2.5 pr-4 text-sm font-semibold text-indigo-100 transition hover:bg-white/15 active:scale-95"
        >
          <span aria-hidden>‹</span> Levels
        </button>
        <div className="text-center">
          <div className="font-display text-lg font-bold leading-none text-white">
            Level {puzzleIndex + 1}
          </div>
          <div className="mt-0.5 text-[0.7rem] uppercase tracking-widest text-indigo-300/70">
            {revealLink ? raw.title : TIER_LABELS[raw.tier]}
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

      <main className="mt-4 flex-1">
        {/* The secret link — present in every group, word hidden until the end */}
        <SecretLink
          reveal={revealLink}
          word={puzzle.pivot}
          spotlight={coach === 0}
        />

        {bannerCats.length > 0 && (
          <div className="mt-3 space-y-2">
            <AnimatePresence initial={false}>
              {bannerCats.map((cat) => (
                <SolvedBanner
                  key={cat.name}
                  cat={cat}
                  themeIndex={indexByName.get(cat.name) ?? 0}
                  faded={status === "lost" && !solved.includes(cat)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {status !== "lost" ? (
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
                  selected={selected.includes(word)}
                  hinted={!!hintWords?.has(word)}
                  disabled={status !== "playing"}
                  onClick={() => toggleSelect(word)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <p className="mt-6 text-center text-sm text-indigo-200/70">
            The groups are revealed above — give it another go!
          </p>
        )}

        {status === "playing" && (
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

        {status === "playing" && (
          <Controls
            mistakes={mistakes}
            max={MAX_MISTAKES}
            canSubmit={selected.length === 3}
            hasSelection={selected.length > 0}
            canHint={unsolvedCategories.length > 1}
            onSubmit={submit}
            onClear={clearSelection}
            onHint={useHint}
          />
        )}

        {status === "guessing" && (
          <LinkGuess options={linkOptions} chosen={linkGuess} answer={puzzle.pivot} onGuess={guessLink} />
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
              linkCorrect={linkGuess === puzzle.pivot}
              timeMs={finalMs}
              bestMs={prevBest.current}
              shareText={buildShare({
                level: puzzleIndex + 1,
                daily,
                won: status === "won",
                stars: finalStars,
                mistakes,
                linkCorrect: linkGuess === puzzle.pivot,
                timeMs: finalMs,
                order:
                  status === "won"
                    ? solved
                    : [...solved, ...puzzle.categories.filter((c) => !solved.includes(c))],
                indexByName,
              })}
              onShareToast={() => setToast("Result copied to clipboard!")}
              onExit={onExit}
              onRestart={restart}
              onNext={onNext}
            />
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

      {!reduce && burst > 0 && status === "playing" && <Confetti key={burst} count={24} />}
      {status === "won" && !reduce && <Confetti count={110} />}

      <AnimatePresence>
        {coach >= 0 && coach <= 2 && status === "playing" && (
          <Coach step={coach} onNext={() => setCoach((c) => c + 1)} onDone={() => { setCoach(-1); onTutorialDone(); }} />
        )}
      </AnimatePresence>
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

function SecretLink({ reveal, word, spotlight }: { reveal: boolean; word: string; spotlight: boolean }) {
  return (
    <motion.div
      animate={spotlight ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 1.4, repeat: spotlight ? Infinity : 0 }}
      className={`relative overflow-hidden rounded-2xl border px-4 py-3 text-center ${
        spotlight ? "border-fuchsia-300 ring-2 ring-fuchsia-300/70" : "border-white/15"
      }`}
      style={{ background: "linear-gradient(110deg,rgba(129,140,248,0.18),rgba(232,121,249,0.18))" }}
    >
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
  selected,
  hinted,
  disabled,
  onClick,
}: {
  word: string;
  selected: boolean;
  hinted: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const sizeClass =
    word.length >= 8 ? "text-[0.7rem] sm:text-xs" : word.length >= 7 ? "text-xs sm:text-sm" : "text-sm sm:text-base";

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
      {word}
    </motion.button>
  );
}

function SolvedBanner({ cat, themeIndex, faded }: { cat: Category; themeIndex: number; faded: boolean }) {
  const theme = CATEGORY_THEMES[themeIndex % CATEGORY_THEMES.length];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: -8 }}
      animate={{ opacity: faded ? 0.55 : 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={`flex items-center justify-between rounded-2xl bg-gradient-to-r ${theme.grad} px-4 py-2.5 shadow-lg`}
      style={{ color: theme.ink }}
    >
      <span className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-widest opacity-80">
        <span aria-hidden className="text-xs">{theme.shape}</span>
        {cat.name}
      </span>
      <span className="flex gap-1.5 text-sm font-extrabold">
        {cat.spokes.map((w) => (
          <span key={w} className="rounded-md px-2 py-0.5" style={{ background: "rgba(255,255,255,0.28)" }}>
            {w}
          </span>
        ))}
      </span>
    </motion.div>
  );
}

function Controls({
  mistakes,
  max,
  canSubmit,
  hasSelection,
  canHint,
  onSubmit,
  onClear,
  onHint,
}: {
  mistakes: number;
  max: number;
  canSubmit: boolean;
  hasSelection: boolean;
  canHint: boolean;
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
        className="text-xs font-semibold text-indigo-200/70 underline-offset-4 transition enabled:hover:text-white enabled:hover:underline disabled:opacity-30"
      >
        💡 Hint — reveal a group (costs a star)
      </button>
    </div>
  );
}

function LinkGuess({
  options,
  chosen,
  answer,
  onGuess,
}: {
  options: string[];
  chosen: string | null;
  answer: string;
  onGuess: (w: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-7 text-center"
    >
      <h3 className="font-display text-xl font-bold text-white">All four groups found!</h3>
      <p className="mt-1 text-sm text-indigo-200/80">Now — what's the secret word linking them all?</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {options.map((w) => {
          const isChosen = chosen === w;
          const isAnswer = w === answer;
          let cls = "border-white/15 bg-white/[0.06] text-indigo-50 hover:bg-white/[0.12]";
          if (chosen) {
            if (isAnswer) cls = "border-transparent bg-gradient-to-r from-emerald-400 to-teal-300 text-emerald-950";
            else if (isChosen) cls = "border-transparent bg-gradient-to-r from-rose-400 to-pink-500 text-white";
            else cls = "border-white/10 bg-white/[0.04] text-indigo-100/40";
          }
          return (
            <button
              key={w}
              disabled={!!chosen}
              onClick={() => onGuess(w)}
              className={`rounded-2xl border px-3 py-3 text-base font-bold uppercase tracking-wide transition ${cls}`}
            >
              {w}
            </button>
          );
        })}
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
  shareText,
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
  shareText: string;
  onShareToast: () => void;
  onExit: () => void;
  onRestart: () => void;
  onNext?: () => void;
}) {
  const newBest = won && (bestMs == null || timeMs < bestMs);
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(shareText);
      onShareToast();
    } catch {
      /* ignore */
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
          <div className="mt-1 text-xs text-indigo-200/70">
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
            The secret link was{" "}
            <span className="font-bold text-white underline decoration-fuchsia-400/70 decoration-2 underline-offset-4">
              {pivot}
            </span>
            .
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
    body: "Find the other groups, then guess the secret word that links them all. Good luck!",
    cta: "Let's go",
  },
];

function Coach({ step, onNext, onDone }: { step: number; onNext: () => void; onDone: () => void }) {
  const c = COACH[step];
  if (!c) return null;
  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5"
    >
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/15 bg-[#1b1740]/95 p-4 shadow-2xl backdrop-blur">
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
      </div>
    </motion.div>
  );
}
