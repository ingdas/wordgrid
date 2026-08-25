import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import gsap from "gsap";
import { EASE, dropOut, rattle, stampIn, usePresence, useGsap } from "./anim";
import { Toast } from "./Toast";
import {
  DEDUCTION_LEVELS,
  type DeductionAxis,
  type DeductionClue,
  type DeductionLevel,
  type DeductionLineClue,
} from "./deductionLevels";
import { CATEGORY_THEMES } from "./theme";
import { clueTarget, countScope, grid, samePairsInLine } from "./deductionRules";
import { t } from "./i18n";
import Confetti from "./Confetti";
import { DebugPanel } from "./DebugPanel";
import { playSelect, playDeselect, playWrong, playWin, playStar, playClear } from "./audio";

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
  /** Debug mode: the board can paint its own solution. */
  debug?: boolean;
  solvedIds: string[];
  onSolve: (id: string) => void;
  onExit: () => void;
}

export default function Deduction({ reduce, debug = false, solvedIds, onSolve, onExit }: DeductionProps) {
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
      debug={debug}
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
  debug,
  solvedIds,
  onSolve,
  onPick,
  onExit,
}: {
  level: DeductionLevel;
  index: number;
  total: number;
  reduce: boolean;
  debug: boolean;
  solvedIds: string[];
  onSolve: (id: string) => void;
  onPick: (i: number) => void;
  onExit: () => void;
}) {
  const alreadySolved = solvedIds.includes(level.id);
  const { rows, cols } = level;
  const N = rows * cols;

  // Geometry and clue semantics come from the shared rules module — the same
  // code the generator verified these levels with, so the board can't disagree
  // with the puzzle it was handed.
  const geo = useMemo(() => grid(rows, cols), [rows, cols]);
  const { lineCells } = geo;

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

  const [colors, setColors] = useState<number[]>(() => new Array(N).fill(-1));
  // Mirrors `colors` for the paint handler, which has to read the grid mid-drag
  // before React has re-rendered. Re-synced on every render, so a reset or a
  // level change lands here too.
  const colorsRef = useRef(colors);
  colorsRef.current = colors;
  const [brush, setBrush] = useState(0); // 0-3 theme, -1 eraser
  const [solved, setSolved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(timer);
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
        const t = clueTarget(cl, geo);
        if (colors[cl.cell] < 0 || colors[t] < 0) {
          m.set(cl.cell, { state: "pending", found: 0 });
          continue;
        }
        const same = colors[t] === colors[cl.cell];
        m.set(cl.cell, { state: same === cl.same ? "ok" : "bad", found: same ? 1 : 0 });
        continue;
      }
      const scope = countScope(cl, geo);
      if (!scope) continue;
      if (colors[cl.cell] < 0 || scope.cells.some((j) => colors[j] < 0)) {
        m.set(cl.cell, { state: "pending", found: 0 });
        continue;
      }
      const found = scope.cells.reduce((n, j) => n + (colors[j] === colors[cl.cell] ? 1 : 0), 0);
      m.set(cl.cell, { state: scope.targets.includes(found) ? "ok" : "bad", found });
    }
    return m;
  }, [colors, level.clues, geo]);

  // Row/column header clues judge themselves the same way, keyed by axis+index.
  const lineStatus = useMemo(() => {
    const m = new Map<string, ClueStatus>();
    for (const ln of level.lines) {
      const key = `${ln.axis}${ln.index}`;
      if (lineCells(ln.axis, ln.index).some((j) => colors[j] < 0)) {
        m.set(key, { state: "pending", found: 0 });
        continue;
      }
      const same = samePairsInLine(ln, colors, geo);
      m.set(key, { state: same === (ln.kind === "rainbow" ? 0 : 1) ? "ok" : "bad", found: same });
    }
    return m;
  }, [colors, level.lines, lineCells, geo]);

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
      // The tile's current colour is read from a ref, so the no-op check and
      // the click sound stay out of the updater — dragging across a tile can
      // otherwise re-run it and blip twice for one stroke.
      if (colorsRef.current[i] === brush) return;
      if (brush >= 0) playSelect(brush * 2); else playDeselect();
      const next = [...colorsRef.current];
      next[i] = brush;
      colorsRef.current = next;
      setColors(next);
    },
    [brush, solved]
  );

  // Drag to paint: 12 taps per attempt (with a brush switch between) is a lot
  // of pecking for what is one gesture. Touch pointers stay captured by the
  // tile they started on, so the run is tracked from the grid with
  // elementFromPoint rather than per-tile enter events.
  const dragging = useRef(false);
  // The grid recoils when a full-but-wrong answer is checked, and the panel
  // explaining why has to outlive the state that dismisses it.
  const gridEl = useRef<HTMLDivElement>(null);
  const whyHere = usePresence(evalNow.full && !evalNow.solved, null, dropOut);
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
    playClear();
  }, [N]);

  // Nudge only once the board is full but wrong (never mid-solve → stays chill).
  // The details live in the problem panel below the grid — the toast just points.
  const checkFull = useCallback(() => {
    if (!evalNow.full || evalNow.solved) return;
    playWrong();
    // The whole grid recoils. It used to be a remount key on the container,
    // which threw away and rebuilt every cell in it to replay a nudge.
    rattle(gridEl.current, [], 0.8);
    setToast(
      !evalNow.sizesOk
        ? t("logic.sizes")
        : t("logic.notYet")
    );
  }, [evalNow]);

  useEffect(() => {
    if (evalNow.full && !evalNow.solved) checkFull();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors]);

  const used = (k: number) => colors.filter((c) => c === k).length;

  // Debug: paint the level's own verified solution. The solve effect above
  // watches the grid, so this lands the win exactly as hand-painting it would.
  const debugSolve = useCallback(() => {
    colorsRef.current = [...level.solution];
    setColors(colorsRef.current);
  }, [level.solution]);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-white py-2 ps-2.5 pe-4 text-sm font-semibold text-ink transition hover:bg-cream active:scale-95"
        >
          <span aria-hidden>‹</span> {t("common.home")}
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 font-display text-lg font-bold leading-none text-ink">
            <span aria-hidden>🧩</span> {t("logic.title")}
          </div>
          <div className="mt-0.5 text-[0.7rem] font-bold uppercase tracking-widest text-ink-soft">
            {t("logic.solved", { n: solvedIds.length, total })}
          </div>
        </div>
        <button
          onClick={reset}
          className="rounded-full border-2 border-ink bg-white px-3 py-2 text-xs font-bold text-ink transition hover:bg-cream active:scale-95"
        >
          {t("common.reset")}
        </button>
      </div>

      {/* Puzzle stepper (a prev/next pager, not a chip wall) */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          onClick={() => onPick((index - 1 + total) % total)}
          aria-label={t("logic.a11y.prev")}
          className="grid h-8 w-8 place-items-center rounded-lg border-2 border-ink/30 bg-white text-ink transition hover:bg-cream active:scale-95"
        >
          ‹
        </button>
        <span className="flex min-w-[6.5rem] items-center justify-center gap-1.5 text-center text-sm font-bold text-ink">
          {t("logic.puzzle", { n: index + 1, total })}
          <span
            className="rounded-full px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase"
            style={{ background: `${TIER_COLOR[level.tier]}22`, color: TIER_COLOR[level.tier] }}
          >
            {t(`logic.tier.${level.tier}`)}
          </span>
          {alreadySolved && <span className="text-leaf">✓</span>}
        </span>
        <button
          onClick={() => onPick((index + 1) % total)}
          aria-label={t("logic.a11y.next")}
          className="grid h-8 w-8 place-items-center rounded-lg border-2 border-ink/30 bg-white text-ink transition hover:bg-cream active:scale-95"
        >
          ›
        </button>
      </div>

      <p className="mx-auto mt-3 max-w-md text-center text-sm text-ink-soft">
        {t("logic.rules")}
      </p>

      <main className="relative mt-4 flex flex-1 flex-col justify-center">
        <div
          ref={gridEl}
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
        </div>

        {/* Why-it's-wrong panel: every violated clue explained in plain words. */}
        {whyHere.rendered && (
            <WhyPanel ref={whyHere.ref}>
              {!evalNow.sizesOk ? (
                <p className="text-sm font-semibold text-press">
                  {t("logic.sizes")}
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
            </WhyPanel>
        )}

        {/* The key. Only the icons on THIS board, so it stays short as the
            clue vocabulary grows. */}
        {!solved && (
          <div className="mx-auto mt-3 grid w-full max-w-sm grid-cols-2 gap-x-3 gap-y-0.5 text-[0.62rem] leading-tight text-ink-soft">
            {LEGEND.filter((e) => level.clues.some(e.match)).map((e) => (
              <span key={e.icon} className="flex items-baseline gap-1">
                <b className="shrink-0 font-display text-xs text-ink">{e.icon}</b> {t(e.key)}
              </span>
            ))}
            {level.lines.some((l) => l.kind === "rainbow") && (
              <span className="flex items-baseline gap-1">
                <b className="shrink-0 font-display text-xs text-ink">≠</b> {t("logic.key.rainbow")}
              </span>
            )}
            {level.lines.some((l) => l.kind === "onepair") && (
              <span className="flex items-baseline gap-1">
                <b className="shrink-0 font-display text-xs text-ink">1=</b> {t("logic.key.onepair")}
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
                onClick={() => { setBrush(k); playSelect(k * 2); }}
                aria-label={t("logic.a11y.brush", { n: k + 1 })}
                className={`relative grid h-11 w-11 place-items-center rounded-xl border-2 bg-gradient-to-br ${th.grad} text-lg font-bold transition ${
                  brush === k ? "border-ink ring-2 ring-ink" : "border-ink/30"
                }`}
                style={{ color: th.ink }}
              >
                <span aria-hidden>{th.shape}</span>
                <span className="absolute -bottom-1.5 -end-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.6rem] font-extrabold text-paper">
                  {3 - used(k)}
                </span>
              </button>
            ))}
            <button
              onClick={() => { setBrush(-1); playDeselect(); }}
              aria-label={t("logic.a11y.eraser")}
              className={`grid h-11 w-11 place-items-center rounded-xl border-2 bg-white text-lg transition ${
                brush === -1 ? "border-ink ring-2 ring-ink" : "border-ink/30"
              }`}
            >
              <span aria-hidden>⌫</span>
            </button>
          </div>
        )}

        {/* The grid is replaced wholesale on the next board, so this never had
            an exit to run and the presence wrapper around it did nothing. */}
        {solved && (
            <SolvedCard>
              <div className="text-4xl" aria-hidden>🧠</div>
              <h3 className="mt-2 font-display text-2xl font-bold text-ink">{t("logic.win.title")}</h3>
              <p className="mt-2 text-sm text-ink-soft">{t("logic.win.body")}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  onClick={onExit}
                  className="rounded-full border border-ink/30 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream"
                >
                  {t("common.home")}
                </button>
                {index < total - 1 && (
                  <button
                    onClick={() => onPick(index + 1)}
                    className="rounded-full bg-press px-6 py-2.5 text-sm font-bold text-paper shadow-stamp transition hover:scale-[1.03] active:scale-95"
                  >
                    {t("end.nextPuzzle")}
                  </button>
                )}
              </div>
            </SolvedCard>
        )}
      </main>

      <Toast text={toast} />
      <div className="sr-only" role="status" aria-live="polite">{toast}</div>

      {debug && (
        <DebugPanel tools={[{ key: "debug.solveGrid", onClick: debugSolve, disabled: solved }]} />
      )}

      {solved && !reduce && <Confetti count={90} />}
    </div>
  );
}

const TIER_COLOR: Record<number, string> = { 1: "#1c7a4d", 2: "#8a5c00", 3: "#d9482b" };

const DIR_ARROW: Record<string, string> = {
  up: "↑", down: "↓", left: "←", right: "→",
  upLeft: "↖", upRight: "↗", downLeft: "↙", downRight: "↘",
};

const axisWord = (axis: DeductionAxis) => t(`logic.axis.${axis}`);
const dirWord = (dir: string) => t(`logic.dir.${dir}`);
const at = (cell: number, cols: number) =>
  t("logic.at", { row: Math.floor(cell / cols) + 1, col: (cell % cols) + 1 });

// Plain-words explanation of a violated clue, locating the tile by row/column.
function violationText(cl: DeductionClue, found: number, cols: number): string {
  const where = at(cl.cell, cols);
  switch (cl.kind) {
    case "deg":
      return t(`logic.bad.deg.${cl.n}`, { at: where, found });
    case "dir":
    case "diag":
      return t(cl.same ? "logic.bad.dir" : "logic.bad.dirNot", { at: where, where: dirWord(cl.dir) });
    case "line":
      return t("logic.bad.line", { at: where, n: cl.n, axis: axisWord(cl.axis), found });
    case "parity":
      return t("logic.bad.parity", { at: where, axis: axisWord(cl.axis), found: found + 1 });
    case "corners":
      return t("logic.bad.corners", { at: where, n: cl.n, found });
  }
}

function lineViolationText(ln: DeductionLineClue, found: number): string {
  const where = `${t(ln.axis === "row" ? "logic.row" : "logic.col")} ${ln.index + 1}`;
  return ln.kind === "rainbow"
    ? t("logic.bad.rainbow", {
        at: where,
        found: found === 1 ? t("logic.bad.rainbow.pair") : t("logic.bad.rainbow.pairs", { n: found }),
      })
    : t("logic.bad.onepair", { at: where, found });
}

// A clue tile is read at a glance, not word by word. Each clue draws as an
// icon (what it's about) plus a value (0/1/2, = / ≠, or ODD); the legend under
// the grid explains only the icons this level actually uses. The full sentence
// survives in the aria-label and in the problem panel, where prose helps.
function clueText(cl: DeductionClue): { icon: string; value: string; full: string } {
  switch (cl.kind) {
    case "deg":
      return { icon: "✛", value: String(cl.n), full: t(`logic.clue.deg.${cl.n}`) };
    case "dir":
    case "diag":
      return {
        icon: DIR_ARROW[cl.dir],
        value: cl.same ? "=" : "≠",
        full: t(cl.same ? "logic.clue.dir" : "logic.clue.dirNot", { where: dirWord(cl.dir) }),
      };
    case "line":
      return {
        icon: cl.axis === "row" ? "↔" : "↕",
        value: String(cl.n),
        full: t(`logic.clue.line.${cl.n}`, { axis: axisWord(cl.axis) }),
      };
    case "parity":
      return {
        icon: cl.axis === "row" ? "↔" : "↕",
        value: "ODD",
        full: t("logic.clue.parity", { axis: axisWord(cl.axis) }),
      };
    case "corners":
      return { icon: "◱", value: String(cl.n), full: t(`logic.clue.corners.${cl.n}`) };
  }
}

function lineClueText(ln: DeductionLineClue): { glyph: string; full: string } {
  return ln.kind === "rainbow"
    ? { glyph: "≠", full: t("logic.clue.rainbow", { axis: axisWord(ln.axis) }) }
    : { glyph: "1=", full: t("logic.clue.onepair", { axis: axisWord(ln.axis) }) };
}

// One legend line per icon actually on this board.
const LEGEND: { match: (cl: DeductionClue) => boolean; icon: string; key: string }[] = [
  { match: (c) => c.kind === "deg", icon: "✛n", key: "logic.key.deg" },
  { match: (c) => c.kind === "dir", icon: "→=", key: "logic.key.dir" },
  { match: (c) => c.kind === "diag", icon: "↘=", key: "logic.key.diag" },
  { match: (c) => c.kind === "line" && c.axis === "row", icon: "↔n", key: "logic.key.lineRow" },
  { match: (c) => c.kind === "line" && c.axis === "col", icon: "↕n", key: "logic.key.lineCol" },
  { match: (c) => c.kind === "parity", icon: "↕ODD", key: "logic.key.parity" },
  { match: (c) => c.kind === "corners", icon: "◱n", key: "logic.key.corners" },
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
  const statusWord = status === "ok" ? t("logic.a11y.satisfied") : status === "bad" ? t("logic.a11y.violated") : "";
  const label =
    (text ? t("logic.a11y.tileClue", { clue: text.full }) + statusWord : t("logic.a11y.noClue")) +
    (theme ? `, ${theme.shape}` : t("logic.a11y.uncoloured"));
  // NOTE: the red outline must live in the inline boxShadow — Tailwind's ring
  // is also a box-shadow, and the inline style would silently override it.
  const shadow =
    status === "bad"
      ? "0 0 0 3px rgba(217,72,43,0.95), var(--shadow-stamp-sm)"
      : "var(--shadow-stamp-sm)";
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
          className={`absolute -end-1 -top-1 z-10 grid h-4 w-4 place-items-center rounded-full text-[0.6rem] font-extrabold text-white ${
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
      aria-label={
        t("logic.a11y.lineClue", {
          line: `${t(clue.axis === "row" ? "logic.row" : "logic.col")} ${clue.index + 1}`,
          clue: text.full,
        }) + (status === "ok" ? t("logic.a11y.satisfied") : status === "bad" ? t("logic.a11y.violated") : "")
      }
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

/** Why the board is wrong: in from just below, out the same way. */
function WhyPanel({ ref, children }: { ref?: Ref<HTMLDivElement>; children: ReactNode }) {
  const el = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (el.current) gsap.fromTo(el.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.24, ease: EASE.press });
  }, []);
  return (
    <div
      ref={(node) => {
        el.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className="mx-auto mt-4 w-full max-w-sm rounded-2xl border-2 border-press/50 bg-press/5 p-3"
    >
      {children}
    </div>
  );
}

/** The grid-solved panel, stamped onto the page like every other result. */
function SolvedCard({ children }: { children: ReactNode }) {
  const el = useGsap<HTMLDivElement>((node) => void stampIn(node, { from: 0.94, tilt: 0 }), []);
  return (
    <div ref={el} className="mt-6 rounded-3xl border-2 border-ink bg-white p-6 text-center">
      {children}
    </div>
  );
}
