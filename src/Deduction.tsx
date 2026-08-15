import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DEDUCTION_LEVELS,
  type DeductionAxis,
  type DeductionClue,
  type DeductionLevel,
  type DeductionLineClue,
} from "./deductionLevels";
import { CATEGORY_THEMES } from "./theme";
import Confetti from "./Confetti";
import { playSelect, playDeselect, playWrong, playWin, playStar } from "./audio";

// ---------------------------------------------------------------------------
// Deduction Grid — a pure-logic mode on the same boards.
//
// An abstract grid of 12 tiles, split into 4 hidden groups of 3. Groups can
// be ANY shapes — they don't have to touch.
//
// Tiles carry clues about their own group: how many neighbours share it,
// whether a named neighbour or diagonal does, how many group-mates share the
// tile's row or column, whether its line holds an odd number of them, how many
// sit in a corner. Row and column headers carry clues about a whole line — all
// different, or exactly one matching pair. Every level is solvable by pure
// forced reasoning from the shown clues — no guessing, no vocabulary, no
// timer. Deliberately NOT tied to the word boards: the chain is the reward.
// ---------------------------------------------------------------------------

interface DeductionProps {
  reduce: boolean;
  solvedIds: string[];
  onSolve: (id: string) => void;
  onExit: () => void;
}

export default function Deduction({ reduce, solvedIds, onSolve, onExit }: DeductionProps) {
  // Open on the first puzzle you haven't cracked yet, so coming back doesn't
  // mean paging past everything already solved. (All solved → back to #1.)
  const [levelIdx, setLevelIdx] = useState(() => {
    const next = DEDUCTION_LEVELS.findIndex((l) => !solvedIds.includes(l.id));
    return next < 0 ? 0 : next;
  });
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

  // The cells of a row/column, and the four corners — the scopes the newer
  // clue kinds count over. Same definitions the generator verifies against.
  const lineCells = useCallback(
    (axis: DeductionAxis, index: number) => {
      const out: number[] = [];
      if (axis === "row") for (let c = 0; c < cols; c++) out.push(index * cols + c);
      else for (let r = 0; r < rows; r++) out.push(r * cols + index);
      return out;
    },
    [rows, cols]
  );
  const lineOf = useCallback(
    (axis: DeductionAxis, cell: number) => (axis === "row" ? Math.floor(cell / cols) : cell % cols),
    [cols]
  );
  const corners = useMemo(() => [0, cols - 1, (rows - 1) * cols, rows * cols - 1], [rows, cols]);

  /** The cells a counting clue counts over (never itself) + the counts it allows. */
  const scopeOf = useCallback(
    (cl: DeductionClue): { cells: number[]; targets: number[] } | null => {
      switch (cl.kind) {
        case "deg":
          return { cells: neighbors[cl.cell], targets: [cl.n] };
        case "line":
          return { cells: lineCells(cl.axis, lineOf(cl.axis, cl.cell)).filter((j) => j !== cl.cell), targets: [cl.n] };
        case "parity":
          // odd counting me → 0 or 2 group-mates alongside me on the line
          return { cells: lineCells(cl.axis, lineOf(cl.axis, cl.cell)).filter((j) => j !== cl.cell), targets: [0, 2] };
        case "corners":
          return { cells: corners.filter((j) => j !== cl.cell), targets: [cl.n] };
        default:
          return null; // dir / diag name a single tile instead of counting
      }
    },
    [neighbors, lineCells, lineOf, corners]
  );

  const lineOfHeader = useCallback(
    (axis: DeductionAxis, index: number) => level.lines.find((l) => l.axis === axis && l.index === index),
    [level.lines]
  );

  // One clue max per tile; the rest are blank (that's the difficulty).
  const clueOf = useMemo(() => {
    const m = new Map<number, DeductionClue>();
    for (const cl of level.clues) m.set(cl.cell, cl);
    return m;
  }, [level]);

  // Where a directional or diagonal clue points, so it can be checked.
  const dirTarget = useCallback(
    (cell: number, dir: string) => {
      const r = Math.floor(cell / cols), c = cell % cols;
      const [dr, dc] = DIR_STEP[dir];
      return (r + dr) * cols + (c + dc);
    },
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

  // Live status of every clue: "pending" until the tile and everything it
  // talks about are painted, then ok/bad with the count actually found. This
  // is the feedback backbone — each clue tile wears a ✓/✕ badge the moment it
  // can be judged, so a wrong line of reasoning surfaces where it happened.
  type ClueStatus = { state: "pending" | "ok" | "bad"; found: number };
  const clueStatus = useMemo(() => {
    const m = new Map<number, ClueStatus>();
    for (const cl of level.clues) {
      if (cl.kind === "dir" || cl.kind === "diag") {
        const t = dirTarget(cl.cell, cl.dir);
        if (colors[cl.cell] < 0 || colors[t] < 0) {
          m.set(cl.cell, { state: "pending", found: 0 });
          continue;
        }
        const same = colors[t] === colors[cl.cell];
        m.set(cl.cell, { state: same === cl.same ? "ok" : "bad", found: same ? 1 : 0 });
        continue;
      }
      const scope = scopeOf(cl);
      if (!scope) continue;
      if (colors[cl.cell] < 0 || scope.cells.some((j) => colors[j] < 0)) {
        m.set(cl.cell, { state: "pending", found: 0 });
        continue;
      }
      const found = scope.cells.reduce((n, j) => n + (colors[j] === colors[cl.cell] ? 1 : 0), 0);
      m.set(cl.cell, { state: scope.targets.includes(found) ? "ok" : "bad", found });
    }
    return m;
  }, [colors, level.clues, dirTarget, scopeOf]);

  // Row/column header clues judge themselves the same way, keyed by axis+index.
  const lineStatus = useMemo(() => {
    const m = new Map<string, ClueStatus>();
    for (const ln of level.lines) {
      const cells = lineCells(ln.axis, ln.index);
      const key = `${ln.axis}${ln.index}`;
      if (cells.some((j) => colors[j] < 0)) {
        m.set(key, { state: "pending", found: 0 });
        continue;
      }
      let same = 0;
      for (let a = 0; a < cells.length; a++)
        for (let b = a + 1; b < cells.length; b++) if (colors[cells[a]] === colors[cells[b]]) same++;
      const want = ln.kind === "rainbow" ? 0 : 1;
      m.set(key, { state: same === want ? "ok" : "bad", found: same });
    }
    return m;
  }, [colors, level.lines, lineCells]);

  // Evaluate the current painting (label-agnostic): every tile painted, each
  // colour used exactly 3×, and every shown clue satisfied. The generator
  // guarantees exactly one partition satisfies the clues, so a full pass IS
  // the solution.
  const evalNow = useMemo(() => {
    const full = colors.every((c) => c >= 0);
    let sizesOk = true;
    if (full) for (let k = 0; k < 4; k++) if (colors.filter((c) => c === k).length !== 3) sizesOk = false;
    const violated = full ? level.clues.filter((cl) => clueStatus.get(cl.cell)?.state === "bad") : [];
    const violatedLines = full
      ? level.lines.filter((ln) => lineStatus.get(`${ln.axis}${ln.index}`)?.state === "bad")
      : [];
    return {
      full,
      violated,
      violatedLines,
      sizesOk,
      solved: full && sizesOk && violated.length === 0 && violatedLines.length === 0,
    };
  }, [colors, level.clues, level.lines, clueStatus, lineStatus]);

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

  // Drag to paint: 12 taps per attempt (with a brush switch between) is a lot
  // of pecking for what is one gesture. Touch pointers stay captured by the
  // tile they started on, so the run is tracked from the grid with
  // elementFromPoint rather than per-tile enter events.
  const dragging = useRef(false);
  useEffect(() => {
    const stop = () => (dragging.current = false);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);
  const paintAt = useCallback(
    (clientX: number, clientY: number) => {
      const el = document.elementFromPoint(clientX, clientY)?.closest("[data-cell]");
      if (el) paint(Number(el.getAttribute("data-cell")));
    },
    [paint]
  );
  const onGridPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (solved) return;
      dragging.current = true;
      paintAt(e.clientX, e.clientY);
    },
    [paintAt, solved]
  );
  const onGridPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || solved) return;
      paintAt(e.clientX, e.clientY);
    },
    [paintAt, solved]
  );

  const reset = useCallback(() => {
    setColors(new Array(N).fill(-1));
    setSolved(false);
    playDeselect();
  }, [N]);

  // Nudge only once the board is full but wrong (never mid-solve → stays chill).
  // The details live in the problem panel below the grid — the toast just points.
  const checkFull = useCallback(() => {
    if (!evalNow.full || evalNow.solved) return;
    playWrong();
    setBadKey((k) => k + 1);
    setToast(
      !evalNow.sizesOk
        ? "Each group needs exactly 3 tiles."
        : "Not solved yet — check the ✕ clues below."
    );
  }, [evalNow]);

  useEffect(() => {
    if (evalNow.full && !evalNow.solved) checkFull();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors]);

  const used = (k: number) => colors.filter((c) => c === k).length;

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-8 pt-4">
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

      {/* Puzzle stepper (a prev/next pager, not a chip wall) */}
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
        Four hidden groups of 3 tiles — any shapes, they don't have to touch.
        Every clue talks about its own tile's group. Deduce and colour all 12.
      </p>

      <main className="relative mt-4 flex flex-1 flex-col justify-center">
        <motion.div
          key={badKey}
          animate={badKey && !reduce ? { x: [0, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          onPointerDown={onGridPointerDown}
          onPointerMove={onGridPointerMove}
          className="mx-auto grid w-full max-w-sm gap-2"
          // A 1.6rem gutter on the top and left carries the line clues, so a
          // row/column header sits with the line it talks about.
          // touch-action:none so a paint drag doesn't scroll the page with it.
          style={{ gridTemplateColumns: `1.6rem repeat(${cols}, minmax(0, 1fr))`, touchAction: "none" }}
        >
          <span aria-hidden />
          {Array.from({ length: cols }, (_, c) => (
            <LineHeader
              key={`col${c}`}
              clue={lineOfHeader("col", c)}
              status={solved ? undefined : lineStatus.get(`col${c}`)?.state}
            />
          ))}
          {Array.from({ length: rows }, (_, r) => (
            <Fragment key={`r${r}`}>
              <LineHeader
                clue={lineOfHeader("row", r)}
                status={solved ? undefined : lineStatus.get(`row${r}`)?.state}
              />
              {Array.from({ length: cols }, (_, c) => {
                const i = r * cols + c;
                return (
                  <GridTile
                    key={i}
                    cell={i}
                    clue={clueOf.get(i)}
                    theme={colors[i] >= 0 ? CATEGORY_THEMES[colors[i]] : undefined}
                    solved={solved}
                    status={solved ? undefined : clueStatus.get(i)?.state}
                    onClick={() => paint(i)}
                  />
                );
              })}
            </Fragment>
          ))}
        </motion.div>

        {/* Why-it's-wrong panel: every violated clue explained in plain words. */}
        <AnimatePresence>
          {evalNow.full && !evalNow.solved && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mx-auto mt-4 w-full max-w-sm rounded-2xl border-2 border-press/50 bg-press/5 p-3"
            >
              {!evalNow.sizesOk ? (
                <p className="text-sm font-semibold text-press">
                  Each colour must be used on exactly 3 tiles.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {evalNow.violated.map((cl) => (
                    <li key={cl.cell} className="flex gap-1.5 text-[0.8rem] font-semibold leading-snug text-press">
                      <span aria-hidden>✕</span>
                      <span>{violationText(cl, clueStatus.get(cl.cell)!.found, cols)}</span>
                    </li>
                  ))}
                  {evalNow.violatedLines.map((ln) => (
                    <li
                      key={`${ln.axis}${ln.index}`}
                      className="flex gap-1.5 text-[0.8rem] font-semibold leading-snug text-press"
                    >
                      <span aria-hidden>✕</span>
                      <span>{lineViolationText(ln, lineStatus.get(`${ln.axis}${ln.index}`)!.found)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* The key. Only the icons on THIS board, so it stays short as the
            clue vocabulary grows. */}
        {!solved && (
          <div className="mx-auto mt-3 grid w-full max-w-sm grid-cols-2 gap-x-3 gap-y-0.5 text-[0.62rem] leading-tight text-ink-soft">
            {LEGEND.filter((e) => level.clues.some(e.match)).map((e) => (
              <span key={e.icon} className="flex items-baseline gap-1">
                <b className="shrink-0 font-display text-xs text-ink">{e.icon}</b> {e.text}
              </span>
            ))}
            {level.lines.some((l) => l.kind === "rainbow") && (
              <span className="flex items-baseline gap-1">
                <b className="shrink-0 font-display text-xs text-ink">≠</b> that whole line is all different groups
              </span>
            )}
            {level.lines.some((l) => l.kind === "onepair") && (
              <span className="flex items-baseline gap-1">
                <b className="shrink-0 font-display text-xs text-ink">1=</b> that line holds exactly one matching pair
              </span>
            )}
          </div>
        )}

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
                All four groups placed by pure logic — every clue checks out, and no
                other colouring fits.
              </p>
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

const DIR_ARROW: Record<string, string> = {
  up: "↑", down: "↓", left: "←", right: "→",
  upLeft: "↖", upRight: "↗", downLeft: "↙", downRight: "↘",
};
const DIR_WORD: Record<string, string> = {
  up: "above", down: "below", left: "left of", right: "right of",
  upLeft: "up-left of", upRight: "up-right of", downLeft: "down-left of", downRight: "down-right of",
};
/** Row/column step per direction name — shared by the clue targets. */
const DIR_STEP: Record<string, [number, number]> = {
  up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1],
  upLeft: [-1, -1], upRight: [-1, 1], downLeft: [1, -1], downRight: [1, 1],
};

const AXIS_WORD: Record<DeductionAxis, string> = { row: "row", col: "column" };
const MATES = ["Neither of my group-mates", "One of my group-mates", "Both of my group-mates"];

const where = (cell: number, cols: number) => `Row ${Math.floor(cell / cols) + 1}, column ${(cell % cols) + 1}`;

// Plain-words explanation of a violated clue, locating the tile by row/column.
function violationText(cl: DeductionClue, found: number, cols: number): string {
  const at = where(cl.cell, cols);
  switch (cl.kind) {
    case "deg": {
      const want = cl.n === 0 ? "no neighbours" : cl.n === 1 ? "exactly one neighbour" : "two neighbours";
      return `${at} needs ${want} in its group — your colouring gives it ${found}.`;
    }
    case "dir":
    case "diag":
      return `${at} says the tile ${DIR_WORD[cl.dir]} it is ${cl.same ? "" : "not "}in its group — in your colouring it ${cl.same ? "isn't" : "is"}.`;
    case "line":
      return `${at} needs ${cl.n} of its group in the rest of its ${AXIS_WORD[cl.axis]} — your colouring puts ${found} there.`;
    case "parity":
      return `${at} needs an odd number of its ${AXIS_WORD[cl.axis]} in its group, counting itself — your colouring makes it ${found + 1}.`;
    case "corners":
      return `${at} needs ${cl.n} of its group in the grid's corners — your colouring puts ${found} there.`;
  }
}

function lineViolationText(ln: DeductionLineClue, found: number): string {
  const at = `${ln.axis === "row" ? "Row" : "Column"} ${ln.index + 1}`;
  return ln.kind === "rainbow"
    ? `${at} must have four different groups — your colouring repeats ${found === 1 ? "one pair" : `${found} pairs`}.`
    : `${at} must hold exactly one matching pair — your colouring has ${found}.`;
}

// A clue tile is read at a glance, not word by word. Each clue draws as an
// icon (what it's about) plus a value (0/1/2, = / ≠, or ODD); the legend under
// the grid explains only the icons this level actually uses. The full sentence
// survives in the aria-label and in the problem panel, where prose helps.
function clueText(cl: DeductionClue): { icon: string; value: string; full: string } {
  switch (cl.kind) {
    case "deg":
      return {
        icon: "✛",
        value: String(cl.n),
        full:
          cl.n === 0
            ? "No neighbour is in my group"
            : cl.n === 1
              ? "One neighbour is in my group"
              : "Two neighbours are in my group",
      };
    case "dir":
    case "diag":
      return {
        icon: DIR_ARROW[cl.dir],
        value: cl.same ? "=" : "≠",
        full: `The tile ${DIR_WORD[cl.dir]} me is ${cl.same ? "" : "not "}in my group`,
      };
    case "line":
      return {
        icon: cl.axis === "row" ? "↔" : "↕",
        value: String(cl.n),
        full: `${MATES[cl.n]} ${cl.n === 1 ? "is" : "are"} in my ${AXIS_WORD[cl.axis]}`,
      };
    case "parity":
      return {
        icon: cl.axis === "row" ? "↔" : "↕",
        value: "ODD",
        full: `Counting me, an odd number of my ${AXIS_WORD[cl.axis]} is in my group`,
      };
    case "corners":
      return {
        icon: "◱",
        value: String(cl.n),
        full: `${MATES[cl.n]} ${cl.n === 1 ? "is" : "are"} in a corner of the grid`,
      };
  }
}

function lineClueText(ln: DeductionLineClue): { glyph: string; full: string } {
  return ln.kind === "rainbow"
    ? { glyph: "≠", full: `No two tiles in this ${AXIS_WORD[ln.axis]} share a group` }
    : { glyph: "1=", full: `Exactly one pair in this ${AXIS_WORD[ln.axis]} shares a group` };
}

// One legend line per icon actually on this board.
const LEGEND: { match: (cl: DeductionClue) => boolean; icon: string; text: string }[] = [
  { match: (c) => c.kind === "deg", icon: "✛n", text: "n of my 4 neighbours share my group (never diagonal)" },
  { match: (c) => c.kind === "dir", icon: "→=", text: "that tile is mine (≠ it isn't)" },
  { match: (c) => c.kind === "diag", icon: "↘=", text: "that diagonal is mine (≠ it isn't)" },
  { match: (c) => c.kind === "line" && c.axis === "row", icon: "↔n", text: "n group-mates in my row" },
  { match: (c) => c.kind === "line" && c.axis === "col", icon: "↕n", text: "n group-mates in my column" },
  { match: (c) => c.kind === "parity", icon: "↕ODD", text: "odd count in that line, me included" },
  { match: (c) => c.kind === "corners", icon: "◱n", text: "n group-mates in a corner" },
];

function GridTile({
  cell,
  clue,
  theme,
  solved,
  status,
  onClick,
}: {
  cell: number; // exposed as data-cell so a drag can find it by point
  clue?: DeductionClue; // undefined = a blank tile (no clue shown)
  theme?: (typeof CATEGORY_THEMES)[number];
  solved: boolean;
  /** Live clue check: ok/bad once judgeable, pending (no badge) before that. */
  status?: "pending" | "ok" | "bad";
  onClick: () => void;
}) {
  const text = clue ? clueText(clue) : null;
  const statusWord = status === "ok" ? ", satisfied" : status === "bad" ? ", NOT satisfied" : "";
  const label = `Tile${text ? `, clue: ${text.full}${statusWord}` : ", no clue"}${theme ? `, ${theme.shape}` : ", uncoloured"}`;
  // NOTE: the red outline must live in the inline boxShadow — Tailwind's ring
  // is also a box-shadow, and the inline style would silently override it.
  const shadow =
    status === "bad"
      ? "0 0 0 3px rgba(217,72,43,0.95), 2px 2px 0 rgba(38,34,26,0.25)"
      : "2px 2px 0 rgba(38,34,26,0.25)";
  return (
    <button
      data-cell={cell}
      onClick={onClick}
      disabled={solved}
      aria-label={label}
      className={`relative grid aspect-square place-items-center rounded-2xl border-2 leading-none transition-colors ${
        theme ? "border-transparent" : "border-ink bg-white text-ink"
      }`}
      style={{ boxShadow: shadow }}
    >
      {/* Live ✓/✕ badge once the clue's neighbourhood is fully painted */}
      {(status === "ok" || status === "bad") && (
        <span
          aria-hidden
          className={`absolute -right-1 -top-1 z-10 grid h-4 w-4 place-items-center rounded-full text-[0.6rem] font-extrabold text-white ${
            status === "ok" ? "bg-leaf" : "bg-press"
          }`}
        >
          {status === "ok" ? "✓" : "✕"}
        </span>
      )}
      {theme ? (
        <div className={`absolute inset-0 grid place-items-center rounded-2xl bg-gradient-to-br ${theme.grad}`}>
          {text ? (
            <ClueFace icon={text.icon} value={text.value} color={theme.ink} />
          ) : (
            <span className="text-base opacity-90" style={{ color: theme.ink }} aria-hidden>
              {theme.shape}
            </span>
          )}
        </div>
      ) : text ? (
        <ClueFace icon={text.icon} value={text.value} />
      ) : (
        // Blank tile — a faint dot signals "still to colour" without giving a clue.
        <span aria-hidden className="text-lg text-ink/20">·</span>
      )}
    </button>
  );
}

/** The icon-plus-value face every clue tile wears. ODD gets its own size. */
function ClueFace({ icon, value, color }: { icon: string; value: string; color?: string }) {
  const wide = value.length > 1;
  return (
    <span className="flex flex-col items-center leading-none" style={color ? { color } : undefined}>
      <span className="font-display text-xl font-bold leading-none">{icon}</span>
      <span className={`font-display font-bold leading-none ${wide ? "text-[0.6rem] tracking-wide" : "text-base"}`}>
        {value}
      </span>
    </span>
  );
}

/** A row/column header clue: a small badge outside the grid proper. */
function LineHeader({
  clue,
  status,
}: {
  clue?: DeductionLineClue;
  status?: "pending" | "ok" | "bad";
}) {
  if (!clue) return <span aria-hidden />;
  const text = lineClueText(clue);
  return (
    <span
      role="note"
      aria-label={`${clue.axis === "row" ? "Row" : "Column"} ${clue.index + 1} clue: ${text.full}${
        status === "ok" ? ", satisfied" : status === "bad" ? ", NOT satisfied" : ""
      }`}
      className={`relative grid h-6 w-full place-items-center self-center justify-self-center rounded-lg border-2 font-display text-xs font-bold leading-none ${
        status === "bad"
          ? "border-press bg-press/10 text-press"
          : status === "ok"
            ? "border-leaf bg-leaf/10 text-leaf"
            : "border-ink/40 bg-white text-ink"
      }`}
    >
      {text.glyph}
    </span>
  );
}
