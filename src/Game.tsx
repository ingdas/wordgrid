import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PUZZLES, buildPuzzle, type Category, type Puzzle } from "./puzzles";
import { starsForMistakes } from "./progress";
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

export const CATEGORY_THEMES = [
  { grad: "from-amber-300 to-orange-400", ink: "#3b1f00", emoji: "🟨" },
  { grad: "from-sky-400 to-cyan-300", ink: "#04293a", emoji: "🟦" },
  { grad: "from-violet-400 to-fuchsia-400", ink: "#2a0a3a", emoji: "🟪" },
  { grad: "from-emerald-400 to-teal-300", ink: "#04302a", emoji: "🟩" },
];

const RATINGS = ["Flawless ✨", "Brilliant!", "Great work!", "Nicely done", "Phew — just made it!"];

type Status = "playing" | "won" | "lost";

interface GameProps {
  puzzleIndex: number;
  reduce: boolean;
  streak: number;
  onWin: (mistakes: number) => void;
  onLoss: () => void;
  onExit: () => void;
  onNext?: () => void;
  onHelp: () => void;
}

export default function Game({
  puzzleIndex,
  reduce,
  streak,
  onWin,
  onLoss,
  onExit,
  onNext,
  onHelp,
}: GameProps) {
  const raw = PUZZLES[puzzleIndex];
  const puzzle: Puzzle = useMemo(() => buildPuzzle(raw, 7), [raw]);

  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState<Category[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [status, setStatus] = useState<Status>("playing");
  const [shake, setShake] = useState(0);
  const [burst, setBurst] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [pastGuesses, setPastGuesses] = useState<Set<string>>(new Set());
  const reported = useRef(false);

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

  const allSolved = solved.length === puzzle.categories.length;

  const remainingWords = useMemo(
    () => puzzle.words.filter((w) => w === puzzle.pivot || !solvedSpokes.has(w)),
    [puzzle.words, puzzle.pivot, solvedSpokes]
  );

  const unsolvedCategories = useMemo(
    () => puzzle.categories.filter((c) => !solved.includes(c)),
    [puzzle, solved]
  );

  const solveCategory = useCallback(
    (cat: Category, combo: number) => {
      playCorrect(combo);
      buzz(30);
      setBurst((b) => b + 1);
      setSolved((prev) => [...prev, cat]);
      setSelected([]);
    },
    [buzz]
  );

  // Auto-solve the final category once only one remains, then declare the win.
  useEffect(() => {
    if (status !== "playing") return;
    if (solved.length === puzzle.categories.length - 1) {
      const last = unsolvedCategories[0];
      const t = setTimeout(() => solveCategory(last, solved.length), 600);
      return () => clearTimeout(t);
    }
    if (allSolved && solved.length > 0) setStatus("won");
  }, [solved, status, allSolved, unsolvedCategories, puzzle.categories.length, solveCategory]);

  // Report the result up exactly once, and fire the win fanfare + stars.
  useEffect(() => {
    if (status === "playing" || reported.current) return;
    reported.current = true;
    if (status === "won") {
      playWin();
      buzz([0, 40, 60, 40]);
      const stars = starsForMistakes(mistakes);
      for (let i = 0; i < stars; i++) setTimeout(() => playStar(i), 500 + i * 220);
      onWin(mistakes);
    } else {
      onLoss();
    }
  }, [status, mistakes, onWin, onLoss, buzz]);

  const toggleSelect = useCallback(
    (word: string) => {
      if (status !== "playing") return;
      setSelected((prev) => {
        if (prev.includes(word)) {
          playDeselect();
          return prev.filter((w) => w !== word);
        }
        if (prev.length >= 3) return prev;
        playSelect();
        return [...prev, word];
      });
    },
    [status]
  );

  const submit = useCallback(() => {
    if (status !== "playing" || selected.length !== 3) return;
    const sel = new Set(selected);
    const match = unsolvedCategories.find((c) => c.members.every((m) => sel.has(m)));
    if (match) {
      solveCategory(match, solved.length);
      return;
    }

    const key = [...selected].sort().join("|");
    if (pastGuesses.has(key)) {
      setToast("You already tried that combo.");
      setShake((s) => s + 1);
      return;
    }
    setPastGuesses((prev) => new Set(prev).add(key));

    const bestOverlap = Math.max(
      ...unsolvedCategories.map((c) => c.members.filter((m) => sel.has(m)).length)
    );
    if (!sel.has(puzzle.pivot)) setToast("Every group shares one word — include it!");
    else if (bestOverlap === 2) setToast("So close — one away!");
    else setToast("Not a group. Try again.");

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
  }, [status, selected, unsolvedCategories, solveCategory, solved.length, puzzle.pivot, pastGuesses, buzz]);

  const clearSelection = useCallback(() => {
    if (selected.length) playClear();
    setSelected([]);
  }, [selected.length]);

  const restart = useCallback(() => {
    reported.current = false;
    setSolved([]);
    setSelected([]);
    setMistakes(0);
    setStatus("playing");
    setShake(0);
    setBurst(0);
    setToast(null);
    setPastGuesses(new Set());
  }, []);

  const bannerCats: Category[] = useMemo(() => {
    if (status === "playing") return solved;
    const rest = puzzle.categories.filter((c) => !solved.includes(c));
    return [...solved, ...rest];
  }, [status, solved, puzzle.categories]);

  const revealPivot = status !== "playing";
  const stars = starsForMistakes(mistakes);

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-16 pt-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 py-2 pl-2.5 pr-4 text-sm font-semibold text-indigo-100 transition hover:bg-white/15 active:scale-95"
        >
          <span aria-hidden>‹</span> Levels
        </button>
        <div className="text-center">
          <div className="font-display text-lg font-bold leading-none text-white">{puzzle.title}</div>
          <div className="mt-0.5 text-[0.7rem] uppercase tracking-widest text-indigo-300/70">
            Level {puzzleIndex + 1}
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

      <main className="mt-5 flex-1">
        <p className="text-center text-sm text-indigo-200/70">
          Four groups of three — all sharing one secret word.
        </p>

        {bannerCats.length > 0 && (
          <div className="mt-5 space-y-2.5">
            <AnimatePresence initial={false}>
              {bannerCats.map((cat) => (
                <SolvedBanner
                  key={cat.name}
                  cat={cat}
                  pivot={puzzle.pivot}
                  themeIndex={indexByName.get(cat.name) ?? 0}
                  revealPivot={revealPivot}
                  faded={status === "lost" && !solved.includes(cat)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        <motion.div
          key={shake}
          animate={shake && !reduce ? { x: [0, -10, 10, -8, 8, -4, 0] } : {}}
          transition={{ duration: 0.45 }}
          className="mt-5 flex flex-wrap justify-center gap-3"
        >
          <AnimatePresence mode="popLayout">
            {remainingWords.map((word) => (
              <WordTile
                key={word}
                word={word}
                selected={selected.includes(word)}
                pivotReveal={revealPivot && word === puzzle.pivot}
                disabled={status !== "playing"}
                onClick={() => toggleSelect(word)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {status === "playing" && (
          <Controls
            mistakes={mistakes}
            max={MAX_MISTAKES}
            canSubmit={selected.length === 3}
            hasSelection={selected.length > 0}
            onSubmit={submit}
            onClear={clearSelection}
          />
        )}

        <AnimatePresence>
          {status !== "playing" && (
            <EndCard
              key={status}
              won={status === "won"}
              stars={stars}
              mistakes={mistakes}
              streak={streak}
              pivot={puzzle.pivot}
              shareText={buildShare(puzzle, solved, indexByName, mistakes, status === "won")}
              onShareToast={() => setToast("Result copied to clipboard!")}
              onExit={onExit}
              onRestart={restart}
              onNext={onNext}
            />
          )}
        </AnimatePresence>
      </main>

      <div className="sr-only" role="status" aria-live="polite">
        {toast}
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

      {/* Per-solve particle pop, plus the big win shower */}
      {!reduce && burst > 0 && status === "playing" && <Confetti key={burst} count={26} />}
      {status === "won" && !reduce && <Confetti count={110} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function buildShare(
  puzzle: Puzzle,
  solved: Category[],
  indexByName: Map<string, number>,
  mistakes: number,
  won: boolean
): string {
  const order = (won ? solved : [...solved, ...puzzle.categories.filter((c) => !solved.includes(c))])
    .map((c) => CATEGORY_THEMES[indexByName.get(c.name) ?? 0].emoji)
    .join("");
  const stars = won ? "★".repeat(starsForMistakes(mistakes)) + "☆".repeat(3 - starsForMistakes(mistakes)) : "—";
  const tag = won ? `${stars}` : "didn't crack it";
  return `WordGrid — ${puzzle.title}\n${order}\n${tag}\n${location.href}`;
}

function WordTile({
  word,
  selected,
  pivotReveal,
  disabled,
  onClick,
}: {
  word: string;
  selected: boolean;
  pivotReveal: boolean;
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
  } else if (pivotReveal) {
    look = "border-transparent text-slate-900";
    style = {
      backgroundImage: "linear-gradient(135deg,#fff,#fde68a,#fbcfe8,#c7d2fe)",
      boxShadow: "0 0 28px rgba(255,255,255,0.5)",
    };
  }

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.6 }}
      animate={pivotReveal ? { opacity: 1, scale: [1, 1.12, 1] } : { opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4, y: -24 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${word}${pivotReveal ? ", the shared word" : ""}`}
      className={`relative grid aspect-[1.7/1] w-[calc((100%-1.5rem)/3)] select-none place-items-center rounded-2xl px-1.5 text-center font-bold uppercase leading-tight tracking-wide ${sizeClass} ${look} disabled:cursor-default`}
      style={style}
    >
      {pivotReveal && (
        <span aria-hidden className="absolute right-1.5 top-1 text-[0.6rem]">
          ◆
        </span>
      )}
      {word}
    </motion.button>
  );
}

function SolvedBanner({
  cat,
  pivot,
  themeIndex,
  revealPivot,
  faded,
}: {
  cat: Category;
  pivot: string;
  themeIndex: number;
  revealPivot: boolean;
  faded: boolean;
}) {
  const theme = CATEGORY_THEMES[themeIndex % CATEGORY_THEMES.length];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: -8 }}
      animate={{ opacity: faded ? 0.55 : 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={`rounded-2xl bg-gradient-to-r ${theme.grad} px-4 py-2.5 shadow-lg`}
      style={{ color: theme.ink }}
    >
      <div className="text-[0.7rem] font-bold uppercase tracking-widest opacity-80">{cat.name}</div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-extrabold">
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5" style={{ background: "rgba(0,0,0,0.16)" }}>
          <span aria-hidden>◆</span>
          {revealPivot ? pivot : "SHARED"}
        </span>
        {cat.spokes.map((w) => (
          <span key={w} className="rounded-md px-2 py-0.5" style={{ background: "rgba(255,255,255,0.28)" }}>
            {w}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function Controls({
  mistakes,
  max,
  canSubmit,
  hasSelection,
  onSubmit,
  onClear,
}: {
  mistakes: number;
  max: number;
  canSubmit: boolean;
  hasSelection: boolean;
  onSubmit: () => void;
  onClear: () => void;
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
          Submit
        </button>
      </div>
    </div>
  );
}

function StarRow({ stars, size = 44 }: { stars: number; size?: number }) {
  return (
    <div className="flex justify-center gap-2">
      {[0, 1, 2].map((i) => {
        const earned = i < stars;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: earned ? 1 : 0.8, rotate: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.25 + i * 0.22 }}
            style={{ fontSize: size }}
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
  stars,
  mistakes,
  streak,
  pivot,
  shareText,
  onShareToast,
  onExit,
  onRestart,
  onNext,
}: {
  won: boolean;
  stars: number;
  mistakes: number;
  streak: number;
  pivot: string;
  shareText: string;
  onShareToast: () => void;
  onExit: () => void;
  onRestart: () => void;
  onNext?: () => void;
}) {
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
          {streak >= 2 && (
            <div className="mt-1 text-sm font-semibold text-amber-300">🔥 {streak} in a row!</div>
          )}
        </>
      ) : (
        <>
          <div className="text-4xl">🧩</div>
          <h3 className="mt-2 font-display text-2xl font-bold text-white">Out of guesses</h3>
        </>
      )}
      <p className="mt-3 text-sm text-indigo-200/80">
        The shared word was{" "}
        <span className="font-bold text-white underline decoration-fuchsia-400/70 decoration-2 underline-offset-4">
          {pivot}
        </span>
        .
      </p>
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
