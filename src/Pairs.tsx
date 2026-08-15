import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LEVELS, buildPuzzle, type Puzzle, type RawPuzzle } from "./puzzles";
import { DAILY_PUZZLES } from "./dailyPuzzles";
import { CATEGORY_THEMES } from "./theme";
import { buildLetterBank } from "./letters";
import { linkMatches } from "./engine";
import { showInterstitial } from "./sdk";
import Confetti from "./Confetti";
import { playSelect, playDeselect, playCorrect, playWrong, playWin, playStar } from "./audio";

// ---------------------------------------------------------------------------
// Pairs — a cozy memory mode on the same boards as the main game.
//
// The 12 spoke cards start face down. Flip two; they match when they share a
// theme (the match names the theme and takes the pair in its colour). Every
// category holds three words, so after four pairs exactly four cards remain —
// one per category — and what THEY share is the secret link: flip to the
// letter bank and spell it for the finale. No timer, no fail; the score is
// fewest moves.
// ---------------------------------------------------------------------------

const POOL: RawPuzzle[] = [...LEVELS, ...DAILY_PUZZLES];

const randomRaw = () => POOL[Math.floor(Math.random() * POOL.length)];

// matching → couple the 4 leftovers into their groups → spell the link → done.
type Phase = "matching" | "coupling" | "spell" | "done";

interface PairsProps {
  reduce: boolean;
  /** Fewest moves in a cleared board so far (0 = never cleared). */
  best: number;
  onFinish: (result: { moves: number; score: number }) => void;
  onExit: () => void;
}

export default function Pairs({ reduce, best, onFinish, onExit }: PairsProps) {
  const bestRef = useRef(best);
  bestRef.current = best;
  const [raw, setRaw] = useState<RawPuzzle>(randomRaw);
  const puzzle: Puzzle = useMemo(() => buildPuzzle(raw, 7), [raw]);

  // Face-down deck: the 12 spokes, shuffled fresh (not the seeded board order,
  // so replaying a known level is still a memory challenge).
  const [order, setOrder] = useState<string[]>(() => shuffleSpokes(puzzle));
  const catOf = useMemo(() => {
    const m = new Map<string, number>();
    puzzle.categories.forEach((c, i) => c.spokes.forEach((w) => m.set(w, i)));
    return m;
  }, [puzzle]);

  const [phase, setPhase] = useState<Phase>("matching");
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Map<string, number>>(new Map());
  // Coupling phase: the leftover the player has picked up, plus a transient
  // "wrong group" marker for the red flash on a mis-couple.
  const [selectedLeftover, setSelectedLeftover] = useState<string | null>(null);
  const [wrongCouple, setWrongCouple] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [linkSpelled, setLinkSpelled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const reported = useRef(false);
  // Captured before this board reports, so the end card compares against the
  // best as it stood when the round was played (onFinish updates the prop).
  const prevBest = useRef(best);
  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (resolveTimer.current) clearTimeout(resolveTimer.current); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  const newBoard = useCallback(() => {
    showInterstitial(); // between-board ad break (no-op without the SDK)
    if (resolveTimer.current) clearTimeout(resolveTimer.current);
    const next = randomRaw();
    const p = buildPuzzle(next, 7);
    setRaw(next);
    setOrder(shuffleSpokes(p));
    setPhase("matching");
    setFlipped([]);
    setMatched(new Map());
    setSelectedLeftover(null);
    setWrongCouple(null);
    setMoves(0);
    setScore(0);
    setLinkSpelled(false);
    setToast(null);
    reported.current = false;
    prevBest.current = bestRef.current;
  }, []);

  const flip = useCallback(
    (index: number) => {
      if (phase !== "matching") return;
      const word = order[index];
      if (matched.has(word) || flipped.includes(index) || flipped.length >= 2) return;
      playSelect();
      const pair = [...flipped, index];
      setFlipped(pair);
      if (pair.length < 2) return;

      setMoves((m) => m + 1);
      const [a, b] = pair.map((i) => order[i]);
      const hit = catOf.get(a) === catOf.get(b);
      resolveTimer.current = setTimeout(() => {
        if (hit) {
          const cat = catOf.get(a)!;
          playCorrect(cat);
          setToast(`✓ ${puzzle.categories[cat].name}`);
          setScore((s) => s + 100);
          setMatched((prev) => {
            const next = new Map(prev);
            next.set(a, cat);
            next.set(b, cat);
            // Four pairs down → the 4 leftovers (one per theme) flip face up and
            // the player must couple each into its group (the coupling phase).
            if (next.size === 8) {
              setTimeout(() => { playStar(1); setPhase("coupling"); }, 450);
            }
            return next;
          });
        } else {
          playDeselect();
        }
        setFlipped([]);
      }, hit ? 500 : 950);
    },
    [phase, order, matched, flipped, catOf, puzzle]
  );

  // Coupling: tap a leftover to pick it up, then tap any card from the group
  // you think it joins. A right guess slots it in; a wrong one flashes red and
  // you keep the card in hand to try again (a wrong try still costs a move).
  const coupleCard = useCallback(
    (index: number) => {
      if (phase !== "coupling") return;
      const word = order[index];
      const placedCat = matched.get(word);
      if (placedCat == null) {
        // an unplaced leftover → pick it up (or drop it if tapped again)
        playSelect();
        setSelectedLeftover((s) => (s === word ? null : word));
        return;
      }
      // a placed card → couple the held leftover to this card's group
      if (selectedLeftover == null) return;
      const leftover = selectedLeftover;
      const trueCat = catOf.get(leftover)!;
      setMoves((m) => m + 1);
      if (placedCat !== trueCat) {
        // Wrong group — flash red and keep it in hand for another try.
        playWrong();
        setToast("Not that group — try again.");
        setWrongCouple(leftover);
        setTimeout(() => setWrongCouple(null), 700);
        return;
      }
      playCorrect(trueCat);
      setToast(`✓ ${puzzle.categories[trueCat].name}`);
      setScore((s) => s + 100);
      setSelectedLeftover(null);
      setMatched((prev) => {
        const next = new Map(prev);
        next.set(leftover, trueCat);
        if (next.size === 12) {
          setTimeout(() => { playStar(2); setPhase("spell"); }, 500);
        }
        return next;
      });
    },
    [phase, order, matched, selectedLeftover, catOf, puzzle]
  );

  // A single tap dispatcher: flip during matching, couple during coupling.
  const onCardTap = useCallback(
    (index: number) => {
      if (phase === "matching") flip(index);
      else if (phase === "coupling") coupleCard(index);
    },
    [phase, flip, coupleCard]
  );

  // Report each cleared board up exactly once (score → lifetime XP, best moves).
  useEffect(() => {
    if (phase !== "done" || reported.current) return;
    reported.current = true;
    playWin();
    onFinish({ moves, score });
  }, [phase, moves, score, onFinish]);

  const solveLink = useCallback(
    (spelled: boolean) => {
      setLinkSpelled(spelled);
      if (spelled) {
        setScore((s) => s + 300);
        playStar(2);
      } else {
        playWrong();
      }
      setTimeout(() => setPhase("done"), 700);
    },
    []
  );

  const newBest = phase === "done" && (prevBest.current === 0 || moves < prevBest.current);

  // How many of each group's three cards are placed. The board gave no sense
  // of progress before — you couldn't tell a good run from a bad one until the
  // end card, which is also the only place the move count meant anything.
  const placedPerCat = useMemo(() => {
    const n = [0, 0, 0, 0];
    matched.forEach((cat) => (n[cat] += 1));
    return n;
  }, [matched]);

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
            <span aria-hidden>🃏</span> Pairs
          </div>
          <div className="mt-0.5 text-[0.7rem] font-bold uppercase tracking-widest text-ink-soft">
            {moves} {moves === 1 ? "move" : "moves"}
            {best > 0 ? ` · best ${best}` : " · fewest wins"}
          </div>
        </div>
        <button
          onClick={newBoard}
          className="rounded-full border-2 border-ink bg-white px-3 py-2 text-xs font-bold text-ink transition hover:bg-cream active:scale-95"
        >
          🔀 New
        </button>
      </div>

      <p className="mt-3 text-center text-sm text-ink-soft">
        {phase === "matching"
          ? "Flip two cards — they match when they share a theme."
          : phase === "coupling"
            ? selectedLeftover
              ? "Now tap a card from the group it joins."
              : "Four left! Tap one, then tap a card from its group."
            : phase === "spell"
              ? "Spell the word that links the last four."
              : ""}
      </p>

      {phase !== "done" && (
        <div className="mt-2 flex items-center justify-center gap-2" aria-label="Groups completed">
          {CATEGORY_THEMES.map((th, k) => (
            <span
              key={k}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-bold transition-colors ${
                placedPerCat[k] === 3 ? "border-transparent text-ink" : "border-ink/20 text-ink-soft"
              }`}
              style={placedPerCat[k] === 3 ? { background: `${th.tint}26`, color: th.tint } : undefined}
            >
              <span aria-hidden>{th.shape}</span>
              {placedPerCat[k]}/3
            </span>
          ))}
        </div>
      )}

      <main className="relative mt-4 flex flex-1 flex-col justify-center">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {order.map((word, i) => {
            const cat = matched.get(word);
            const isLeftover = phase === "coupling" && cat == null;
            const tappable = phase === "matching" ? cat == null : phase === "coupling";
            return (
              <PairCard
                key={word}
                word={word}
                faceUp={flipped.includes(i) || cat != null || isLeftover}
                matchedTheme={cat != null ? CATEGORY_THEMES[cat % CATEGORY_THEMES.length] : undefined}
                leftover={isLeftover}
                selected={selectedLeftover === word}
                wrong={wrongCouple === word}
                disabled={!tappable}
                onClick={() => onCardTap(i)}
              />
            );
          })}
        </div>

        <AnimatePresence>
          {phase === "spell" && (
            <LinkSpell key="spell" pivot={puzzle.pivot} accept={puzzle.accept} onSolve={solveLink} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="mt-6 rounded-3xl border-2 border-ink bg-white p-6 text-center"
            >
              <div className="text-4xl" aria-hidden>🃏</div>
              <h3 className="mt-2 font-display text-2xl font-bold text-ink">Board cleared!</h3>
              <p className="mt-2 text-sm text-ink-soft">
                The secret link was{" "}
                <span className="font-bold text-ink underline decoration-press/70 decoration-2 underline-offset-4">
                  {puzzle.pivot}
                </span>
                . {linkSpelled ? "🔑 You spelled it!" : "Revealed for you this time."}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
                <span className="rounded-full bg-cream px-3 py-1 text-ink">{moves} moves</span>
                <span className="rounded-full bg-gold/15 px-3 py-1 font-extrabold text-gold-deep">
                  ✦ {score.toLocaleString()}
                </span>
                {newBest && <span className="rounded-full bg-leaf/15 px-3 py-1 text-leaf">New best!</span>}
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  onClick={onExit}
                  className="rounded-full border border-ink/30 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream"
                >
                  Home
                </button>
                <button
                  onClick={newBoard}
                  className="rounded-full bg-press px-6 py-2.5 text-sm font-bold text-paper shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition hover:scale-[1.03] active:scale-95"
                >
                  Next board →
                </button>
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

      {phase === "done" && !reduce && <Confetti count={90} />}
    </div>
  );
}

// Fresh random order for the 12 spokes (never the pivot).
function shuffleSpokes(puzzle: Puzzle): string[] {
  const spokes = puzzle.words.filter((w) => w !== puzzle.pivot);
  for (let i = spokes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [spokes[i], spokes[j]] = [spokes[j], spokes[i]];
  }
  return spokes;
}

function PairCard({
  word,
  faceUp,
  matchedTheme,
  leftover,
  selected,
  wrong,
  disabled,
  onClick,
}: {
  word: string;
  faceUp: boolean;
  matchedTheme?: (typeof CATEGORY_THEMES)[number];
  leftover: boolean;
  selected: boolean;
  wrong: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const sizeClass =
    word.length >= 10 ? "text-[0.6rem]" : word.length >= 8 ? "text-[0.7rem]" : word.length >= 7 ? "text-xs" : "text-sm";
  // A face-up card is still tappable during coupling (as a couple target or to
  // pick up a leftover), so tappability is driven purely by `disabled`.
  const face = wrong
    ? "border-press bg-press/10 text-ink ring-2 ring-press"
    : matchedTheme
      ? `border-transparent bg-gradient-to-r ${matchedTheme.grad}`
      : selected
        ? "border-ink bg-cream text-ink ring-2 ring-ink"
        : leftover
          ? "border-dashed border-press bg-white text-ink"
          : "border-ink bg-white text-ink";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      // Never leak the word while face down (screen readers included).
      aria-label={faceUp ? word : "Face-down card"}
      className="aspect-[1.15/1] select-none disabled:cursor-default sm:aspect-[1.55/1]"
      style={{ perspective: 600 }}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: faceUp ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        {/* Back: a Puzzle Press card sleeve */}
        <div
          className="absolute inset-0 grid place-items-center rounded-2xl border-2 border-ink bg-cream text-lg text-ink/30"
          style={{ backfaceVisibility: "hidden", boxShadow: "2px 2px 0 rgba(38,34,26,0.25)" }}
        >
          <span aria-hidden>◆</span>
        </div>
        {/* Front: the word — inked in its theme colour once matched/coupled */}
        <motion.div
          animate={wrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`absolute inset-0 grid place-items-center rounded-2xl border-2 px-1 text-center font-bold uppercase leading-tight tracking-wide ${sizeClass} ${face}`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            color: matchedTheme?.ink,
            boxShadow: "2px 2px 0 rgba(38,34,26,0.25)",
          }}
        >
          <span>
            {matchedTheme && (
              <span aria-hidden className="mr-1 text-[0.65em] opacity-70">
                {matchedTheme.shape}
              </span>
            )}
            {word}
          </span>
        </motion.div>
      </motion.div>
    </button>
  );
}

// A compact tap-to-spell finale (same letter bank as the main game, minus the
// hint economy — Pairs stays consequence-free).
function LinkSpell({
  pivot,
  accept,
  onSolve,
}: {
  pivot: string;
  accept: string[];
  onSolve: (spelled: boolean) => void;
}) {
  const bank = useMemo(() => buildLetterBank(pivot), [pivot]);
  const [taps, setTaps] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [resolved, setResolved] = useState(false);
  const built = taps.map((i) => bank[i]).join("");
  const full = built.length >= pivot.length;

  useEffect(() => {
    if (resolved || !full) return;
    const t = setTimeout(() => {
      if (linkMatches(built, pivot, accept)) {
        setResolved(true);
        onSolve(true);
      } else {
        setWrong(true);
        setShakeKey((k) => k + 1);
        setTaps([]);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [full, built, resolved, pivot, accept, onSolve]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
      <motion.div
        key={shakeKey}
        animate={wrong ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap justify-center gap-1.5"
        aria-label={`${pivot.length} letters`}
      >
        {pivot.split("").map((_, i) => {
          const placed = i < built.length;
          const next = i === built.length && !resolved;
          return (
            <span
              key={i}
              className={`grid h-10 w-8 place-items-center rounded-md border text-lg font-extrabold transition-colors ${
                placed
                  ? "border-press/60 bg-press/10 text-ink"
                  : next
                    ? "border-press text-ink/30 ring-2 ring-press/40"
                    : "border-ink/25 text-ink/25"
              }`}
            >
              {placed ? built[i] : "_"}
            </span>
          );
        })}
      </motion.div>
      {wrong && <p className="mt-2 text-sm font-semibold text-press">Not the word — try again.</p>}

      <div className="mx-auto mt-3 flex max-w-sm flex-wrap justify-center gap-2">
        {bank.map((ch, i) => {
          const used = taps.includes(i);
          return (
            <button
              key={i}
              onClick={() => {
                if (used || resolved || full) return;
                setWrong(false);
                playSelect();
                setTaps((prev) => [...prev, i]);
              }}
              disabled={used || resolved || full}
              aria-label={`Letter ${ch}${used ? ", used" : ""}`}
              className={`grid h-11 w-9 place-items-center rounded-xl text-lg font-extrabold transition ${
                used
                  ? "border border-ink/10 bg-cream text-ink/15"
                  : "border-2 border-ink bg-white text-ink hover:bg-cream active:scale-95"
              }`}
            >
              {ch}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={() => {
            if (!taps.length) return;
            playDeselect();
            setWrong(false);
            setTaps((prev) => prev.slice(0, -1));
          }}
          disabled={resolved || !taps.length}
          className="flex items-center gap-1.5 rounded-full border border-ink/30 px-4 py-2 text-xs font-bold text-ink transition enabled:hover:bg-cream enabled:active:scale-95 disabled:opacity-35"
        >
          ⌫ Undo
        </button>
        <button
          onClick={() => {
            if (resolved) return;
            setResolved(true);
            onSolve(false);
          }}
          disabled={resolved}
          className="rounded-full px-3 py-2 text-xs font-semibold text-ink-soft underline-offset-4 transition enabled:hover:text-ink enabled:hover:underline disabled:opacity-40"
        >
          Show me the word
        </button>
      </div>
    </motion.div>
  );
}
