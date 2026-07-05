import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEDUCTION_LEVELS, type DeductionLevel } from "./deductionLevels";
import { CATEGORY_THEMES } from "./Game";
import Confetti from "./Confetti";
import { playSelect, playDeselect, playWrong, playWin, playStar } from "./audio";

// ---------------------------------------------------------------------------
// Deduction Grid — a pure-logic mode on the same boards.
//
// The 12 words are hidden; each tile shows only a NUMBER = how many of its
// orthogonal neighbours share its (hidden) theme. There are 4 themes of 3
// tiles each, and every theme is a connected region. The clue grid has a
// unique solution, so you can always reach it by reasoning — no guessing, no
// vocabulary, no timer. Colour every tile into its group; solving flips the
// tiles to reveal the words and the hidden link.
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

  // The clue shown on each tile — same-theme neighbour count in the solution.
  const clue = useMemo(() => {
    const cat = level.cells.map((c) => c.cat);
    return cat.map((_, i) => neighbors[i].reduce((n, j) => n + (cat[j] === cat[i] ? 1 : 0), 0));
  }, [level, neighbors]);

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

  // Evaluate the current painting against the rules (label-agnostic): every
  // tile painted, each colour used exactly 3× and connected, and every clue
  // matched. The generator guarantees a unique solution, so a full match IS it.
  const evalNow = useMemo(() => {
    const full = colors.every((c) => c >= 0);
    let mismatches = 0;
    let structureOk = true;
    if (full) {
      for (let i = 0; i < N; i++) {
        const cnt = neighbors[i].reduce((n, j) => n + (colors[j] === colors[i] ? 1 : 0), 0);
        if (cnt !== clue[i]) mismatches++;
      }
      for (let k = 0; k < 4; k++) {
        const cells = [...Array(N).keys()].filter((i) => colors[i] === k);
        if (cells.length !== 3) { structureOk = false; break; }
        const seen = new Set([cells[0]]);
        const st = [cells[0]];
        while (st.length) {
          const x = st.pop()!;
          for (const nb of neighbors[x]) if (colors[nb] === k && !seen.has(nb)) { seen.add(nb); st.push(nb); }
        }
        if (seen.size !== 3) { structureOk = false; break; }
      }
    }
    return { full, mismatches, solved: full && mismatches === 0 && structureOk };
  }, [colors, clue, neighbors, N]);

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
    setToast(`${evalNow.mismatches || "Some"} tiles don't fit their number yet.`);
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
            Puzzle {index + 1} / {total}
          </div>
        </div>
        <button
          onClick={reset}
          className="rounded-full border-2 border-ink bg-white px-3 py-2 text-xs font-bold text-ink transition hover:bg-cream active:scale-95"
        >
          Reset
        </button>
      </div>

      {/* Level picker chips */}
      <div className="mt-3 flex justify-center gap-2">
        {DEDUCTION_LEVELS.map((l, i) => (
          <button
            key={l.id}
            onClick={() => onPick(i)}
            className={`grid h-8 w-8 place-items-center rounded-lg border-2 text-sm font-bold transition ${
              i === index ? "border-ink bg-ink text-paper" : "border-ink/30 bg-white text-ink hover:bg-cream"
            }`}
          >
            {solvedIds.includes(l.id) && i !== index ? "✓" : i + 1}
          </button>
        ))}
      </div>

      <p className="mx-auto mt-3 max-w-md text-center text-sm text-ink-soft">
        Four hidden groups of 3, each a connected patch. A tile's number is how many
        of its neighbours share its group. Colour every tile.
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
              clue={clue[i]}
              theme={col >= 0 ? CATEGORY_THEMES[col] : undefined}
              word={solved ? level.cells[i].word : undefined}
              solvedCat={solved ? level.cells[i].cat : undefined}
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

function GridTile({
  clue,
  theme,
  word,
  solvedCat,
  onClick,
}: {
  clue: number;
  theme?: (typeof CATEGORY_THEMES)[number];
  word?: string;
  solvedCat?: number;
  onClick: () => void;
}) {
  const revealTheme = solvedCat != null ? CATEGORY_THEMES[solvedCat] : theme;
  const sizeClass = word && word.length >= 8 ? "text-[0.6rem]" : word && word.length >= 6 ? "text-[0.7rem]" : "text-sm";
  return (
    <button
      onClick={onClick}
      disabled={word != null}
      aria-label={word ?? `Tile, clue ${clue}${theme ? `, ${theme.shape}` : ", uncoloured"}`}
      className={`relative grid aspect-square place-items-center overflow-hidden rounded-2xl border-2 font-extrabold uppercase leading-none transition-colors ${
        revealTheme ? "border-transparent" : "border-ink bg-white text-ink"
      }`}
      style={{ boxShadow: "2px 2px 0 rgba(38,34,26,0.25)" }}
    >
      {revealTheme ? (
        <div className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${revealTheme.grad}`}>
          {word ? (
            <span className={`px-1 text-center ${sizeClass}`} style={{ color: revealTheme.ink }}>
              {word}
            </span>
          ) : (
            <span className="text-lg" style={{ color: revealTheme.ink }}>
              <span aria-hidden className="mr-0.5 text-xs opacity-70">{revealTheme.shape}</span>
              {clue}
            </span>
          )}
        </div>
      ) : (
        <span className="text-xl text-ink">{clue}</span>
      )}
    </button>
  );
}
