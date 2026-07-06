import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEDUCTION_LEVELS, type DeductionClue, type DeductionLevel } from "./deductionLevels";
import { CATEGORY_THEMES } from "./Game";
import Confetti from "./Confetti";
import { playSelect, playDeselect, playWrong, playWin, playStar } from "./audio";

// ---------------------------------------------------------------------------
// Deduction Grid — a pure-logic mode on the same boards.
//
// The 12 words are hidden, split into 4 hidden groups of 3 tiles. Groups can
// be ANY shapes — they don't have to touch. Some tiles carry a plain-text
// clue about their neighbours ("None of my neighbours are in my group", "The
// tile below me is in my group"). Every level is solvable by pure reasoning
// from the shown clues — no guessing, no vocabulary, no timer. Colour every
// tile; solving flips the grid to reveal the words and the hidden link.
// ---------------------------------------------------------------------------

interface DeductionProps {
  reduce: boolean;
  solvedIds: string[];
  onSolve: (id: string) => void;
  onExit: () => void;
}

export default function Deduction({ reduce, solvedIds, onSolve, onExit }: DeductionProps) {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = DEDUCTION_LEVELS[levelIdx];
  return (
    <DeductionBoard
      key={level.id}
      level={level}
      index={levelIdx}
      total={DEDUCTION_LEVELS.length}
      reduce={reduce}
      solvedIds={solvedIds}
      onSolve={onSolve}
      onPick={setLevelIdx}
      onExit={onExit}
    />
  );
}

function DeductionBoard({
  level,
  index,
  total,
  reduce,
  solvedIds,
  onSolve,
  onPick,
  onExit,
}: {
  level: DeductionLevel;
  index: number;
  total: number;
  reduce: boolean;
  solvedIds: string[];
  onSolve: (id: string) => void;
  onPick: (i: number) => void;
  onExit: () => void;
}) {
  const alreadySolved = solvedIds.includes(level.id);
  const { rows, cols } = level;
  const N = rows * cols;

  // Orthogonal neighbours for this grid shape.
  const neighbors = useMemo(() => {
    const ns: number[][] = [];
    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / cols), c = i % cols, a: number[] = [];
      if (r > 0) a.push(i - cols);
      if (r < rows - 1) a.push(i + cols);
      if (c > 0) a.push(i - 1);
      if (c < cols - 1) a.push(i + 1);
      ns.push(a);
    }
    return ns;
  }, [N, rows, cols]);

  // One clue max per tile; the rest are blank (that's the difficulty).
  const clueOf = useMemo(() => {
    const m = new Map<number, DeductionClue>();
    for (const cl of level.clues) m.set(cl.cell, cl);
    return m;
  }, [level]);

  // Where a directional clue points, so we can evaluate it against a painting.
  const dirTarget = useCallback(
    (cell: number, dir: "up" | "down" | "left" | "right") =>
      dir === "up" ? cell - cols : dir === "down" ? cell + cols : dir === "left" ? cell - 1 : cell + 1,
    [cols]
  );

  const [colors, setColors] = useState<number[]>(() => new Array(N).fill(-1));
  const [brush, setBrush] = useState(0); // 0-3 theme, -1 eraser
  const [solved, setSolved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [badKey, setBadKey] = useState(0);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(t);
  }, [toast]);

  // Evaluate the current painting (label-agnostic): every tile painted, each
  // colour used exactly 3×, and every shown clue satisfied. The generator
  // guarantees exactly one partition satisfies the clues, so a full pass IS
  // the solution.
  const evalNow = useMemo(() => {
    const full = colors.every((c) => c >= 0);
    const violated: number[] = [];
    let sizesOk = true;
    if (full) {
      for (let k = 0; k < 4; k++) if (colors.filter((c) => c === k).length !== 3) sizesOk = false;
      for (const cl of level.clues) {
        const ok =
          cl.kind === "deg"
            ? neighbors[cl.cell].reduce((n, j) => n + (colors[j] === colors[cl.cell] ? 1 : 0), 0) === cl.n
            : (colors[dirTarget(cl.cell, cl.dir)] === colors[cl.cell]) === cl.same;
        if (!ok) violated.push(cl.cell);
      }
    }
    return { full, violated, sizesOk, solved: full && sizesOk && violated.length === 0 };
  }, [colors, level.clues, neighbors, dirTarget]);

  useEffect(() => {
    if (evalNow.solved && !solved) {
      setSolved(true);
      playWin();
      for (let i = 0; i < 3; i++) setTimeout(() => playStar(i), 400 + i * 200);
      if (!alreadySolved) onSolve(level.id);
    }
  }, [evalNow.solved, solved, alreadySolved, onSolve, level.id]);

  const paint = useCallback(
    (i: number) => {
      if (solved) return;
      setColors((prev) => {
        if (prev[i] === brush) return prev; // no-op
        if (brush >= 0) playSelect(); else playDeselect();
        const next = [...prev];
        next[i] = brush;
        return next;
      });
    },
    [brush, solved]
  );

  const reset = useCallback(() => {
    setColors(new Array(N).fill(-1));
    setSolved(false);
    playDeselect();
  }, [N]);

  // Nudge only once the board is full but wrong (never mid-solve → stays chill).
  const checkFull = useCallback(() => {
    if (!evalNow.full || evalNow.solved) return;
    playWrong();
    setBadKey((k) => k + 1);
    setToast(
      !evalNow.sizesOk
        ? "Each group needs exactly 3 tiles."
        : `${evalNow.violated.length} clue${evalNow.violated.length === 1 ? " isn't" : "s aren't"} satisfied yet.`
    );
  }, [evalNow]);

  useEffect(() => {
    if (evalNow.full && !evalNow.solved) checkFull();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors]);

  const used = (k: number) => colors.filter((c) => c === k).length;

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-white py-2 pl-2.5 pr-4 text-sm font-semibold text-ink transition hover:bg-cream active:scale-95"
        >
          <span aria-hidden>‹</span> Home
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 font-display text-lg font-bold leading-none text-ink">
            <span aria-hidden>🧩</span> Logic Grid
          </div>
          <div className="mt-0.5 text-[0.7rem] font-bold uppercase tracking-widest text-ink-soft">
            {solvedIds.length}/{total} solved
          </div>
        </div>
        <button
          onClick={reset}
          className="rounded-full border-2 border-ink bg-white px-3 py-2 text-xs font-bold text-ink transition hover:bg-cream active:scale-95"
        >
          Reset
        </button>
      </div>

      {/* Puzzle stepper (20 levels — a prev/next pager, not a chip wall) */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          onClick={() => onPick((index - 1 + total) % total)}
          aria-label="Previous puzzle"
          className="grid h-8 w-8 place-items-center rounded-lg border-2 border-ink/30 bg-white text-ink transition hover:bg-cream active:scale-95"
        >
          ‹
        </button>
        <span className="flex min-w-[6.5rem] items-center justify-center gap-1.5 text-center text-sm font-bold text-ink">
          Puzzle {index + 1} / {total}
          <span
            className="rounded-full px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase"
            style={{ background: `${TIER_COLOR[level.tier]}22`, color: TIER_COLOR[level.tier] }}
          >
            {TIER_NAME[level.tier]}
          </span>
          {alreadySolved && <span className="text-leaf">✓</span>}
        </span>
        <button
          onClick={() => onPick((index + 1) % total)}
          aria-label="Next puzzle"
          className="grid h-8 w-8 place-items-center rounded-lg border-2 border-ink/30 bg-white text-ink transition hover:bg-cream active:scale-95"
        >
          ›
        </button>
      </div>

      <p className="mx-auto mt-3 max-w-md text-center text-sm text-ink-soft">
        Four hidden groups of 3 tiles — any shapes, they don't have to touch. Some
        tiles tell you about their neighbours. Deduce and colour all 12.
      </p>

      <main className="relative mt-4">
        <motion.div
          key={badKey}
          animate={badKey && !reduce ? { x: [0, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="mx-auto grid max-w-sm gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {colors.map((col, i) => (
            <GridTile
              key={i}
              clue={clueOf.get(i)}
              theme={col >= 0 ? CATEGORY_THEMES[col] : undefined}
              word={solved ? level.cells[i].word : undefined}
              solvedCat={solved ? level.cells[i].cat : undefined}
              violated={evalNow.full && !evalNow.solved && evalNow.violated.includes(i)}
              onClick={() => paint(i)}
            />
          ))}
        </motion.div>

        {/* Brush palette */}
        {!solved && (
          <div className="mt-5 flex items-center justify-center gap-2">
            {CATEGORY_THEMES.map((th, k) => (
              <button
                key={k}
                onClick={() => { setBrush(k); playSelect(); }}
                aria-label={`Group ${k + 1} brush`}
                className={`relative grid h-11 w-11 place-items-center rounded-xl border-2 bg-gradient-to-br ${th.grad} text-lg font-bold transition ${
                  brush === k ? "border-ink ring-2 ring-ink" : "border-ink/30"
                }`}
                style={{ color: th.ink }}
              >
                <span aria-hidden>{th.shape}</span>
                <span className="absolute -bottom-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.6rem] font-extrabold text-paper">
                  {3 - used(k)}
                </span>
              </button>
            ))}
            <button
              onClick={() => { setBrush(-1); playDeselect(); }}
              aria-label="Eraser"
              className={`grid h-11 w-11 place-items-center rounded-xl border-2 bg-white text-lg transition ${
                brush === -1 ? "border-ink ring-2 ring-ink" : "border-ink/30"
              }`}
            >
              <span aria-hidden>⌫</span>
            </button>
          </div>
        )}

        <AnimatePresence>
          {solved && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="mt-6 rounded-3xl border-2 border-ink bg-white p-6 text-center"
            >
              <div className="text-4xl" aria-hidden>🧠</div>
              <h3 className="mt-2 font-display text-2xl font-bold text-ink">Deduced!</h3>
              <p className="mt-2 text-sm text-ink-soft">
                Every group placed by logic. The hidden link was{" "}
                <span className="font-bold text-ink underline decoration-press/70 decoration-2 underline-offset-4">
                  {level.pivot}
                </span>
                .
              </p>
              <div className="mt-3 grid grid-cols-2 gap-1.5 text-left">
                {level.categories.map((name, k) => (
                  <div
                    key={name}
                    className="flex items-center gap-1.5 rounded-xl px-2 py-1 text-[0.7rem] font-bold"
                    style={{ background: `${CATEGORY_THEMES[k].tint}1f`, color: CATEGORY_THEMES[k].tint }}
                  >
                    <span aria-hidden>{CATEGORY_THEMES[k].shape}</span>
                    <span className="leading-tight">{name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  onClick={onExit}
                  className="rounded-full border border-ink/30 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream"
                >
                  Home
                </button>
                {index < total - 1 && (
                  <button
                    onClick={() => onPick(index + 1)}
                    className="rounded-full bg-press px-6 py-2.5 text-sm font-bold text-paper shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition hover:scale-[1.03] active:scale-95"
                  >
                    Next puzzle →
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
      <div className="sr-only" role="status" aria-live="polite">{toast}</div>

      {solved && !reduce && <Confetti count={90} />}
    </div>
  );
}

const TIER_NAME: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };
const TIER_COLOR: Record<number, string> = { 1: "#1c7a4d", 2: "#8a5c00", 3: "#d9482b" };

const DIR_ARROW = { up: "↑", down: "↓", left: "←", right: "→" } as const;
const DIR_WORD = { up: "above", down: "below", left: "left of", right: "right of" } as const;

// The short text painted on a clue tile, and the full sentence for a11y.
function clueText(cl: DeductionClue): { short: string; full: string } {
  if (cl.kind === "deg") {
    const short =
      cl.n === 0
        ? "No neighbour is in my group"
        : cl.n === 1
          ? "One neighbour is in my group"
          : "Two neighbours are in my group";
    return { short, full: short };
  }
  return {
    short: `The tile ${DIR_ARROW[cl.dir]} is ${cl.same ? "" : "NOT "}in my group`,
    full: `The tile ${DIR_WORD[cl.dir]} me is ${cl.same ? "" : "not "}in my group`,
  };
}

function GridTile({
  clue,
  theme,
  word,
  solvedCat,
  violated,
  onClick,
}: {
  clue?: DeductionClue; // undefined = a blank tile (no clue shown)
  theme?: (typeof CATEGORY_THEMES)[number];
  word?: string;
  solvedCat?: number;
  violated: boolean;
  onClick: () => void;
}) {
  const revealTheme = solvedCat != null ? CATEGORY_THEMES[solvedCat] : theme;
  const sizeClass = word && word.length >= 8 ? "text-[0.6rem]" : word && word.length >= 6 ? "text-[0.7rem]" : "text-sm";
  const text = clue ? clueText(clue) : null;
  const label = word ?? `Tile${text ? `, clue: ${text.full}` : ", no clue"}${theme ? `, ${theme.shape}` : ", uncoloured"}`;
  return (
    <button
      onClick={onClick}
      disabled={word != null}
      aria-label={label}
      className={`relative grid aspect-square place-items-center overflow-hidden rounded-2xl border-2 leading-none transition-colors ${
        revealTheme ? "border-transparent" : "border-ink bg-white text-ink"
      } ${violated ? "ring-2 ring-press" : ""}`}
      style={{ boxShadow: "2px 2px 0 rgba(38,34,26,0.25)" }}
    >
      {revealTheme ? (
        <div className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${revealTheme.grad}`}>
          {word ? (
            <span className={`px-1 text-center font-extrabold uppercase ${sizeClass}`} style={{ color: revealTheme.ink }}>
              {word}
            </span>
          ) : text ? (
            <span
              className="px-1 text-center text-[0.55rem] font-bold leading-tight"
              style={{ color: revealTheme.ink }}
            >
              {text.short}
            </span>
          ) : (
            <span className="text-base opacity-90" style={{ color: revealTheme.ink }} aria-hidden>
              {revealTheme.shape}
            </span>
          )}
        </div>
      ) : text ? (
        <span className="px-1 text-center text-[0.55rem] font-bold leading-tight text-ink">
          {text.short}
        </span>
      ) : (
        // Blank tile — a faint dot signals "still to colour" without giving a clue.
        <span aria-hidden className="text-lg text-ink/20">·</span>
      )}
    </button>
  );
}
