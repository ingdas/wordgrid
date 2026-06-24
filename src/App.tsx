import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PUZZLES, buildPuzzle, type Category, type Puzzle } from "./puzzles";
import Confetti from "./Confetti";

const MAX_MISTAKES = 4;

// Stable colour identity per category index (0-3).
const CATEGORY_THEMES = [
  { grad: "from-amber-300 to-orange-400", chip: "#f59e0b", ink: "#3b1f00", emoji: "🟨" },
  { grad: "from-sky-400 to-cyan-300", chip: "#0ea5e9", ink: "#04293a", emoji: "🟦" },
  { grad: "from-violet-400 to-fuchsia-400", chip: "#a855f7", ink: "#2a0a3a", emoji: "🟪" },
  { grad: "from-emerald-400 to-teal-300", chip: "#10b981", ink: "#04302a", emoji: "🟩" },
];

type Status = "playing" | "won" | "lost";

interface SavedState {
  solved: string[]; // category names, in solve order
  mistakes: number;
  status: Status;
}

function loadSaved(id: string): SavedState | null {
  try {
    const raw = localStorage.getItem(`wordgrid:${id}`);
    return raw ? (JSON.parse(raw) as SavedState) : null;
  } catch {
    return null;
  }
}

function saveState(id: string, state: SavedState) {
  try {
    localStorage.setItem(`wordgrid:${id}`, JSON.stringify(state));
  } catch {
    /* ignore quota / privacy mode */
  }
}

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem("wordgrid:completed");
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

const RATINGS = ["Flawless ✨", "Brilliant!", "Great work!", "Nicely done", "Phew — just made it!"];

export default function App() {
  const reduce = useReducedMotion();
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const raw = PUZZLES[puzzleIndex];
  const puzzle: Puzzle = useMemo(() => buildPuzzle(raw, 7), [raw]);

  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState<Category[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [status, setStatus] = useState<Status>("playing");
  const [shake, setShake] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [pastGuesses, setPastGuesses] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState<Set<string>>(() => loadCompleted());
  const [showHelp, setShowHelp] = useState(false);

  // Onboarding: open How-to-play on the very first visit.
  useEffect(() => {
    try {
      if (!localStorage.getItem("wordgrid:seen")) {
        setShowHelp(true);
        localStorage.setItem("wordgrid:seen", "1");
      }
    } catch {
      /* ignore */
    }
  }, []);

  // For each spoke word, which category index it belongs to.
  const spokeCategoryIndex = useMemo(() => {
    const m = new Map<string, number>();
    puzzle.categories.forEach((c, i) => c.spokes.forEach((w) => m.set(w, i)));
    return m;
  }, [puzzle]);

  const indexByName = useMemo(() => {
    const m = new Map<string, number>();
    puzzle.categories.forEach((c, i) => m.set(c.name, i));
    return m;
  }, [puzzle]);

  // Restore progress for this puzzle on switch.
  useEffect(() => {
    const saved = loadSaved(puzzle.id);
    if (saved) {
      const restored = saved.solved
        .map((name) => puzzle.categories.find((c) => c.name === name))
        .filter((c): c is Category => Boolean(c));
      setSolved(restored);
      setMistakes(saved.mistakes);
      setStatus(saved.status);
    } else {
      setSolved([]);
      setMistakes(0);
      setStatus("playing");
    }
    setSelected([]);
    setToast(null);
    setPastGuesses(new Set());
  }, [puzzle]);

  // Persist whenever progress changes.
  useEffect(() => {
    saveState(puzzle.id, { solved: solved.map((c) => c.name), mistakes, status });
  }, [puzzle.id, solved, mistakes, status]);

  // Record completion for the picker ticks.
  useEffect(() => {
    if (status === "won" && !completed.has(puzzle.id)) {
      const next = new Set(completed).add(puzzle.id);
      setCompleted(next);
      try {
        localStorage.setItem("wordgrid:completed", JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
    }
  }, [status, puzzle.id, completed]);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(t);
  }, [toast]);

  const solvedCategoryIndices = useMemo(
    () => new Set(solved.map((c) => indexByName.get(c.name)!)),
    [solved, indexByName]
  );

  const allSolved = solved.length === puzzle.categories.length;

  const unsolvedCategories = useMemo(
    () => puzzle.categories.filter((c) => !solved.includes(c)),
    [puzzle, solved]
  );

  const solveCategory = useCallback((cat: Category) => {
    setSolved((prev) => [...prev, cat]);
    setSelected([]);
  }, []);

  // Auto-solve the final category once only one remains, then declare the win.
  useEffect(() => {
    if (status !== "playing") return;
    if (solved.length === puzzle.categories.length - 1) {
      const last = unsolvedCategories[0];
      const t = setTimeout(() => solveCategory(last), 600);
      return () => clearTimeout(t);
    }
    if (allSolved && solved.length > 0) {
      setStatus("won");
    }
  }, [solved, status, allSolved, unsolvedCategories, puzzle.categories.length, solveCategory]);

  // Whether a given word is currently locked into a solved group (spokes only).
  const lockedIndexOf = useCallback(
    (word: string): number | null => {
      if (word === puzzle.pivot) return null;
      const ci = spokeCategoryIndex.get(word);
      if (ci != null && solvedCategoryIndices.has(ci)) return ci;
      return null;
    },
    [puzzle.pivot, spokeCategoryIndex, solvedCategoryIndices]
  );

  const toggleSelect = useCallback(
    (word: string) => {
      if (status !== "playing") return;
      if (lockedIndexOf(word) != null) return;
      setSelected((prev) => {
        if (prev.includes(word)) return prev.filter((w) => w !== word);
        if (prev.length >= 3) return prev;
        return [...prev, word];
      });
    },
    [status, lockedIndexOf]
  );

  const submit = useCallback(() => {
    if (status !== "playing" || selected.length !== 3) return;
    const sel = new Set(selected);
    const match = unsolvedCategories.find(
      (c) => c.members.length === 3 && c.members.every((m) => sel.has(m))
    );
    if (match) {
      solveCategory(match);
      return;
    }

    // Don't punish a repeated wrong guess.
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
    if (!sel.has(puzzle.pivot)) {
      setToast("Every group shares one word — include it!");
    } else if (bestOverlap === 2) {
      setToast("So close — one away!");
    } else {
      setToast("Not a group. Try again.");
    }
    setShake((s) => s + 1);
    setMistakes((m) => {
      const next = m + 1;
      if (next >= MAX_MISTAKES) {
        setStatus("lost");
        setSelected([]);
      }
      return next;
    });
  }, [status, selected, unsolvedCategories, solveCategory, puzzle.pivot, pastGuesses]);

  const resetPuzzle = useCallback(() => {
    setSolved([]);
    setMistakes(0);
    setStatus("playing");
    setSelected([]);
    setToast(null);
    setPastGuesses(new Set());
    saveState(puzzle.id, { solved: [], mistakes: 0, status: "playing" });
  }, [puzzle.id]);

  // Categories shown as banners: solved ones while playing; all of them once over.
  const bannerCats: Category[] = useMemo(() => {
    if (status === "playing") return solved;
    const rest = puzzle.categories.filter((c) => !solved.includes(c));
    return [...solved, ...rest];
  }, [status, solved, puzzle.categories]);

  const revealPivot = status !== "playing";

  return (
    <>
      <div className="aurora" />
      <div className="grain" />

      <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-16 pt-6 sm:pt-10">
        <Header onHelp={() => setShowHelp(true)} onReset={resetPuzzle} />

        <main className="mt-6 flex-1">
          <PuzzlePicker current={puzzleIndex} completed={completed} onPick={setPuzzleIndex} />

          <h2 className="mt-6 text-center font-display text-3xl font-bold tracking-tight text-white/95 sm:text-4xl">
            {puzzle.title}
          </h2>
          <p className="mt-1 text-center text-sm text-indigo-200/70">
            Four groups of three — all sharing one secret word.
          </p>

          {/* Solved / revealed banners */}
          {bannerCats.length > 0 && (
            <div className="mt-6 space-y-2.5">
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

          {/* The board: a stable 3x3 grid that never reflows */}
          <motion.div
            key={shake}
            animate={shake && !reduce ? { x: [0, -10, 10, -8, 8, -4, 0] } : {}}
            transition={{ duration: 0.45 }}
            className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3"
          >
            {puzzle.words.map((word) => {
              const locked = lockedIndexOf(word);
              const isPivotReveal = revealPivot && word === puzzle.pivot;
              return (
                <WordTile
                  key={word}
                  word={word}
                  selected={selected.includes(word)}
                  lockedIndex={locked}
                  pivotReveal={isPivotReveal}
                  disabled={status !== "playing" || locked != null}
                  onClick={() => toggleSelect(word)}
                />
              );
            })}
          </motion.div>

          {/* Controls */}
          {status === "playing" && (
            <Controls
              mistakes={mistakes}
              max={MAX_MISTAKES}
              canSubmit={selected.length === 3}
              hasSelection={selected.length > 0}
              onSubmit={submit}
              onClear={() => setSelected([])}
            />
          )}

          {/* End states */}
          <AnimatePresence>
            {status !== "playing" && (
              <EndCard
                key={status}
                won={status === "won"}
                mistakes={mistakes}
                pivot={puzzle.pivot}
                shareText={buildShare(puzzle, solved, indexByName, mistakes, status === "won")}
                onShareToast={() => setToast("Result copied to clipboard!")}
                onReplay={resetPuzzle}
                onNext={
                  puzzleIndex < PUZZLES.length - 1
                    ? () => setPuzzleIndex((i) => i + 1)
                    : undefined
                }
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Live region for screen readers + visible toast */}
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

      {status === "won" && !reduce && <Confetti />}

      <AnimatePresence>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </AnimatePresence>
    </>
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
  const order = (
    won ? solved : [...solved, ...puzzle.categories.filter((c) => !solved.includes(c))]
  )
    .map((c) => CATEGORY_THEMES[indexByName.get(c.name) ?? 0].emoji)
    .join("");
  const tag = won ? `solved with ${mistakes} mistake${mistakes === 1 ? "" : "s"}` : "didn't crack it";
  return `WordGrid — ${puzzle.title}\n${order}\n(${tag})\n${location.href}`;
}

function Header({ onHelp, onReset }: { onHelp: () => void; onReset: () => void }) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-lg shadow-lg shadow-fuchsia-500/30">
          <span aria-hidden>◆</span>
        </div>
        <span className="font-display text-xl font-bold tracking-tight text-white">WordGrid</span>
      </div>
      <div className="flex items-center gap-2">
        <IconButton label="How to play" onClick={onHelp}>
          ?
        </IconButton>
        <IconButton label="Restart puzzle" onClick={onReset}>
          ↺
        </IconButton>
      </div>
    </header>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-base font-semibold text-indigo-100 transition hover:bg-white/15 active:scale-95"
    >
      {children}
    </button>
  );
}

function PuzzlePicker({
  current,
  completed,
  onPick,
}: {
  current: number;
  completed: Set<string>;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {PUZZLES.map((p, i) => {
        const done = completed.has(p.id);
        return (
          <button
            key={p.id}
            onClick={() => onPick(i)}
            aria-current={i === current}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
              i === current
                ? "bg-white text-slate-900 shadow"
                : "bg-white/8 text-indigo-100/80 hover:bg-white/15"
            }`}
          >
            {done && <span className={i === current ? "text-emerald-600" : "text-emerald-400"}>✓</span>}
            {p.title}
          </button>
        );
      })}
    </div>
  );
}

function WordTile({
  word,
  selected,
  lockedIndex,
  pivotReveal,
  disabled,
  onClick,
}: {
  word: string;
  selected: boolean;
  lockedIndex: number | null;
  pivotReveal: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const theme = lockedIndex != null ? CATEGORY_THEMES[lockedIndex] : null;
  // Shrink the font for longer words so nothing overflows the tile.
  const sizeClass =
    word.length >= 8 ? "text-[0.7rem] sm:text-xs" : word.length >= 7 ? "text-xs sm:text-sm" : "text-sm sm:text-base";

  let look = "border border-white/12 bg-white/[0.06] text-indigo-50 hover:bg-white/[0.12]";
  let style: React.CSSProperties | undefined;
  if (selected) {
    look = "bg-white text-slate-900";
    style = { boxShadow: "0 10px 30px -8px rgba(255,255,255,0.4)" };
  } else if (theme) {
    look = "border-transparent text-white";
    style = { background: theme.chip, color: theme.ink };
  } else if (pivotReveal) {
    look = "border-transparent text-slate-900";
    style = {
      backgroundImage: "linear-gradient(135deg,#fff,#fde68a,#fbcfe8,#c7d2fe)",
      boxShadow: "0 0 24px rgba(255,255,255,0.45)",
    };
  }

  return (
    <motion.button
      layout
      whileTap={disabled ? undefined : { scale: 0.92 }}
      animate={pivotReveal ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${word}${theme ? ", solved" : ""}${pivotReveal ? ", the shared word" : ""}`}
      className={`relative grid aspect-[1.7/1] select-none place-items-center rounded-2xl px-1.5 text-center font-bold uppercase leading-tight tracking-wide transition-colors ${sizeClass} ${look} disabled:cursor-default`}
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
        {/* The shared word stays masked until the puzzle ends */}
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5"
          style={{ background: "rgba(0,0,0,0.16)" }}
        >
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
              animate={{
                scale: i < max - mistakes ? 1 : 0.7,
                opacity: i < max - mistakes ? 1 : 0.25,
              }}
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

function EndCard({
  won,
  mistakes,
  pivot,
  shareText,
  onShareToast,
  onReplay,
  onNext,
}: {
  won: boolean;
  mistakes: number;
  pivot: string;
  shareText: string;
  onShareToast: () => void;
  onReplay: () => void;
  onNext?: () => void;
}) {
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
        return;
      }
    } catch {
      /* user cancelled — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(shareText);
      onShareToast();
    } catch {
      /* clipboard blocked */
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
      <div className="text-4xl">{won ? "🎉" : "🧩"}</div>
      <h3 className="mt-2 font-display text-2xl font-bold text-white">
        {won ? RATINGS[Math.min(mistakes, RATINGS.length - 1)] : "Out of guesses"}
      </h3>
      <p className="mt-2 text-sm text-indigo-200/80">
        The shared word was{" "}
        <span className="font-bold text-white underline decoration-fuchsia-400/70 decoration-2 underline-offset-4">
          {pivot}
        </span>
        .
      </p>
      <p className="mt-1 text-sm text-indigo-200/70">
        {won
          ? mistakes === 0
            ? "A perfect solve — not a single wrong move."
            : `Solved with ${mistakes} mistake${mistakes === 1 ? "" : "s"}.`
          : "The full board is revealed above. Give it another go!"}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          onClick={share}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-white/10"
        >
          Share result
        </button>
        <button
          onClick={onReplay}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-white/10"
        >
          Play again
        </button>
        {onNext && (
          <button
            onClick={onNext}
            className="rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-[1.03] active:scale-95"
          >
            Next puzzle →
          </button>
        )}
      </div>
    </motion.div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="How to play"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-white/12 bg-[#15122e] p-6 shadow-2xl"
      >
        <h3 className="font-display text-2xl font-bold text-white">How to play</h3>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-indigo-100/90">
          <li className="flex gap-3">
            <span className="text-indigo-300">①</span>
            There are <b>9 words</b> hiding <b>4 categories</b>.
          </li>
          <li className="flex gap-3">
            <span className="text-indigo-300">②</span>
            One secret word belongs to <b>every</b> category — find it and reuse it in all four groups.
          </li>
          <li className="flex gap-3">
            <span className="text-indigo-300">③</span>
            Tap <b>three</b> words that form a group, then <b>Submit</b>. Solved words lock in with the group's
            colour so you can see what's been used. The shared word stays in play and is revealed at the end.
          </li>
          <li className="flex gap-3">
            <span className="text-indigo-300">④</span>
            You get <b>4 mistakes</b>. Solve all four to win.
          </li>
        </ul>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-white py-3 text-sm font-bold text-slate-900 transition hover:scale-[1.02] active:scale-95"
        >
          Got it
        </button>
      </motion.div>
    </motion.div>
  );
}
