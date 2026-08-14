import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEDUCTION_LEVELS, type DeductionClue, type DeductionLevel } from "./deductionLevels";
import { CATEGORY_THEMES } from "./Game";
import Confetti from "./Confetti";
import { playSelect, playDeselect, playWrong, playWin, playStar } from "./audio";

// ---------------------------------------------------------------------------
// Deduction Grid — a pure-logic mode on the same boards.
//
// An abstract grid of 12 tiles, split into 4 hidden groups of 3. Groups can
// be ANY shapes — they don't have to touch. Some tiles carry a plain-text
// clue about their neighbours ("None of my neighbours are in my group", "The
// tile below me is in my group"). Every level is solvable by pure reasoning
// from the shown clues — no guessing, no vocabulary, no timer. Deliberately
// NOT tied to the word boards: the logic chain is the whole reward.
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

  // Live status of every clue: "pending" until the tile and everything it
  // talks about are painted, then ok/bad with the count actually found. This
  // is the feedback backbone — each clue tile wears a ✓/✕ badge the moment it
  // can be judged, so a wrong line of reasoning surfaces where it happened.
  type ClueStatus = { state: "pending" | "ok" | "bad"; found: number };
  const clueStatus = useMemo(() => {
    const m = new Map<number, ClueStatus>();
    for (const cl of level.clues) {
      if (cl.kind === "deg") {
        if (colors[cl.cell] < 0 || neighbors[cl.cell].some((j) => colors[j] < 0)) {
          m.set(cl.cell, { state: "pending", found: 0 });
          continue;
        }
        const found = neighbors[cl.cell].reduce((n, j) => n + (colors[j] === colors[cl.cell] ? 1 : 0), 0);
        m.set(cl.cell, { state: found === cl.n ? "ok" : "bad", found });
      } else {
        const t = dirTarget(cl.cell, cl.dir);
        if (colors[cl.cell] < 0 || colors[t] < 0) {
          m.set(cl.cell, { state: "pending", found: 0 });
          continue;
        }
        const same = colors[t] === colors[cl.cell];
        m.set(cl.cell, { state: same === cl.same ? "ok" : "bad", found: same ? 1 : 0 });
      }
    }
    return m;
  }, [colors, level.clues, neighbors, dirTarget]);

  // Evaluate the current painting (label-agnostic): every tile painted, each
  // colour used exactly 3×, and every shown clue satisfied. The generator
  // guarantees exactly one partition satisfies the clues, so a full pass IS
  // the solution.
  const evalNow = useMemo(() => {
    const full = colors.every((c) => c >= 0);
    let sizesOk = true;
    if (full) for (let k = 0; k < 4; k++) if (colors.filter((c) => c === k).length !== 3) sizesOk = false;
    const violated = full ? level.clues.filter((cl) => clueStatus.get(cl.cell)?.state === "bad") : [];
    return { full, violated, sizesOk, solved: full && sizesOk && violated.length === 0 };
  }, [colors, level.clues, clueStatus]);

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
        <br />
        <span className="text-[0.72rem] font-semibold text-ink">
          A tile's neighbours are the tiles directly above, below, left and right — never diagonal.
        </span>
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
              solved={solved}
              status={solved ? undefined : clueStatus.get(i)?.state}
              onClick={() => paint(i)}
            />
          ))}
        </motion.div>

        {/* Why-it's-wrong panel: every violated clue explained in plain words. */}
        <AnimatePresence>
          {evalNow.full && !evalNow.solved && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mx-auto mt-4 max-w-sm rounded-2xl border-2 border-press/50 bg-press/5 p-3"
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
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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

const DIR_ARROW = { up: "↑", down: "↓", left: "←", right: "→" } as const;
const DIR_WORD = { up: "above", down: "below", left: "left of", right: "right of" } as const;

// Plain-words explanation of a violated clue, locating the tile by row/column.
function violationText(cl: DeductionClue, found: number, cols: number): string {
  const where = `Row ${Math.floor(cl.cell / cols) + 1}, column ${(cl.cell % cols) + 1}`;
  if (cl.kind === "deg") {
    const want = cl.n === 0 ? "no neighbours" : cl.n === 1 ? "exactly one neighbour" : "two neighbours";
    return `${where} needs ${want} in its group — your colouring gives it ${found}.`;
  }
  return `${where} says the tile ${DIR_WORD[cl.dir]} it is ${cl.same ? "" : "not "}in its group — in your colouring it ${cl.same ? "isn't" : "is"}.`;
}

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
  solved,
  status,
  onClick,
}: {
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
            <span
              className="px-1 text-center text-[0.55rem] font-bold leading-tight"
              style={{ color: theme.ink }}
            >
              {text.short}
            </span>
          ) : (
            <span className="text-base opacity-90" style={{ color: theme.ink }} aria-hidden>
              {theme.shape}
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
