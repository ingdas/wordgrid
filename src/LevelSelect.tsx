import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LEVELS,
  CHAPTERS,
  TIER_KEY,
  bossTwist,
  chapterKey,
  isBossLevel,
  keyLetterOf,
  keySlots,
  levelTitle,
} from "./puzzles";
import { chapterInk, type ChapterInk } from "./theme";
import { playCorrect, playClear, playStar, playWin } from "./audio";
import { plural, t } from "./i18n";
import { LinkGuess } from "./LinkGuess";
import { shuffledLetters } from "./letters";
import { DebugPanel } from "./DebugPanel";
import {
  isUnlocked,
  MAX_STARS,
  totalStars,
  newlyUnlocked,
  newlyBanked,
  furthestCleared,
  keyReady,
  keySolved,
  bossAwaitingKey,
  type Progress,
} from "./progress";

// ---------------------------------------------------------------------------
// The level list is an INDEX, not a map.
//
// It used to be one identical numbered square per level in a grid, which was
// wrong in two
// directions at once. Behind you it threw away everything that makes a level
// memorable — you solved "Bank On It", and the list remembered "a gold square".
// Ahead of you a numbered square promises nothing, so there was nothing to want.
//
// So the two halves are now drawn differently, because they *are* different:
//
//   solved  → an index LINE: numeral, the board's title (which the win card and
//             the history already show once you've cracked it), a dotted
//             leader, the stars. Numerals align in one column and stars in
//             another, so the titles' different lengths are absorbed by the
//             leader instead of ragging out — the whole point of a leader.
//   unsolved→ a fixed-size square in an even strip. It carries no information
//             on purpose, so it has nothing to size itself by.
//
// And the thing you actually came to do — play the next level — is a card at the
// top, not a node to hunt for in a grid.
//
// The boss is the exception to all of it. It closes the chapter, it's the most
// distinctive content in the game, and it used to be an 11mm square with a
// crown sticker. It now gets the BossPanel: a rail of the letters this
// chapter's levels have handed over, sitting on a door drawn in solid ink —
// the one dark object on a page of cream, which is exactly how much weight it
// deserves.
// ---------------------------------------------------------------------------

// Pacing of the unlock reveal: the first lock pops shortly after the page
// settles, and any others follow one at a time so two never read as one blur.
const REVEAL_LEAD = 620;
const REVEAL_GAP = 520;

// Pacing of the letter hand-over, which runs FIRST: clearing a level is what
// bought the letter, so the map pays that out before it opens anything new.
const BANK_LEAD = 520; // page settles, then the first chip turns
const FLIP_HOLD = 660; // how long the letter is held up on the chip
const FLY_MS = 620; // chip → rail
const LAND_HOLD = 300; // the slot's pop, before the next letter starts
const BANK_STEP = FLIP_HOLD + FLY_MS + LAND_HOLD;
// A chapter's worth of letters at full pace would be a ten-second cutscene, so
// a backlog plays quicker. One letter always gets the full performance.
const bankRate = (n: number) => (n > 2 ? 0.62 : 1);

/** The moment the key panel dismisses itself — the door opens on that beat. */
const KEY_PANEL_MS = 1900;

const wait = (ms: number, sink: ReturnType<typeof setTimeout>[]) =>
  new Promise<void>((resolve) => sink.push(setTimeout(resolve, ms)));

export default function LevelSelect({
  progress,
  reduce,
  debug = false,
  onPick,
  onSeen,
  onSolveKey,
  onDebugClear,
  onDebugHints,
  hints,
  onUseHint,
  onRefillHints,
  onHome,
  onHelp,
  onStats,
  muted,
  onToggleMute,
  musicOn,
  onToggleMusic,
}: {
  progress: Progress;
  reduce: boolean;
  /** Debug mode: everything is open, and the tool tray can clear levels. */
  debug?: boolean;
  onPick: (index: number) => void;
  /** Called once the page has shown what's new, so each unlock plays only once. */
  onSeen: () => void;
  /** A chapter's keyword was spelled — its boss door opens. */
  onSolveKey: (chapter: number) => void;
  /** Debug: mark a level cleared at three stars without playing it. */
  onDebugClear?: (index: number) => void;
  /** Debug: drop ten hints into the bank. */
  onDebugHints?: () => void;
  hints: number;
  onUseHint: () => void;
  onRefillHints: () => Promise<boolean>;
  onHome: () => void;
  onHelp: () => void;
  onStats: () => void;
  muted: boolean;
  onToggleMute: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
}) {
  const starsOf = (i: number) => progress.stars[LEVELS[i].id] ?? 0;
  const stars = totalStars(progress);
  const solvedCount = LEVELS.filter((_, i) => starsOf(i) > 0).length;
  const perfectCount = LEVELS.filter((_, i) => starsOf(i) >= 3).length;
  const nextIndex = LEVELS.findIndex((_, i) => isUnlocked(progress, i) && starsOf(i) === 0);

  // What opened since the player last looked — captured at mount, before it's
  // marked seen.
  const [fresh] = useState<string[]>(() =>
    furthestCleared(progress) >= 0 ? newlyUnlocked(progress) : []
  );
  const freshOrder = useMemo(() => new Map(fresh.map((id, i) => [id, i])), [fresh]);

  // …and which levels still owe the map their key letter. Same deal: captured
  // at mount, then marked, so the hand-over plays exactly once.
  const [pending] = useState<string[]>(() => newlyBanked(progress));
  const pendingSet = useMemo(() => new Set(pending), [pending]);

  useEffect(() => {
    onSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- the hand-over --------------------------------------------------------
  // One level id at a time: its chip flips to the letter, the letter flies to
  // the chapter's rail, the slot pops. `landed` is what the rail draws from, so
  // a slot the player is about to watch fill starts the page empty.
  // With motion turned down there is no hand-over to watch, so the letters are
  // simply already there — no empty first frame that fills a beat later.
  const [landed, setLanded] = useState<Set<string>>(() => new Set(reduce ? pending : []));
  const [flipping, setFlipping] = useState<string | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  // The hand-over is a purely visual event, so it's narrated separately for
  // anyone who isn't watching it happen.
  const [said, setSaid] = useState("");
  const chipRefs = useRef(new Map<string, HTMLElement | null>());
  const slotRefs = useRef(new Map<string, HTMLElement | null>());

  useEffect(() => {
    if (!pending.length || reduce) return;
    let dead = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const rate = bankRate(pending.length);
    (async () => {
      await wait(BANK_LEAD, timers);
      for (let n = 0; n < pending.length; n++) {
        const id = pending[n];
        if (dead) return;
        setFlipping(id);
        playStar(n % 5);
        await wait(FLIP_HOLD * rate, timers);
        if (dead) return;

        const from = chipRefs.current.get(id)?.getBoundingClientRect();
        const to = slotRefs.current.get(id)?.getBoundingClientRect();
        const index = LEVELS.findIndex((l) => l.id === id);
        if (from && to && index >= 0) {
          // The chip turns back to its numeral as the letter leaves it: the
          // level handed the letter over, so it can't still be holding one.
          setFlipping(null);
          setFlight({
            letter: keyLetterOf(index) ?? "",
            fill: chapterInk(CHAPTERS.findIndex((c) => index >= c.start && index < c.end)).fill,
            x0: from.left + from.width / 2,
            y0: from.top + from.height / 2,
            x1: to.left + to.width / 2,
            y1: to.top + to.height / 2,
            w: to.width,
            h: to.height,
          });
          await wait(FLY_MS * rate, timers);
          if (dead) return;
        }
        setFlight(null);
        setFlipping(null);
        setLanded((prev) => new Set(prev).add(id));
        setSaid(t("key.a11y.banked", { n: index + 1, letter: keyLetterOf(index) ?? "" }));
        playClear();
        await wait(LAND_HOLD * rate, timers);
      }
    })();
    return () => {
      dead = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Is this level's letter on the rail yet, as far as the page is concerned? */
  const onRail = (index: number) => {
    const id = LEVELS[index].id;
    if ((progress.stars[id] ?? 0) <= 0) return false;
    return !pendingSet.has(id) || landed.has(id);
  };

  // Everything new waits for the letters: bank first, then open doors.
  const bankTime = reduce || !pending.length
    ? 0
    : BANK_LEAD + pending.length * BANK_STEP * bankRate(pending.length);

  // The map used to open at the top, on your record — the next level is a card
  // up there, not a node to hunt for. Two things still pull the page down: a
  // letter about to be handed over, and a lock about to pop. The letter wins,
  // because it's the one that happens first.
  const freshRef = useRef<HTMLButtonElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    (bankRef.current ?? freshRef.current)?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const lastFresh = fresh[fresh.length - 1];
  const bankChapter = pending.length
    ? CHAPTERS.findIndex((c) => {
        const i = LEVELS.findIndex((l) => l.id === pending[0]);
        return i >= c.start && i < c.end;
      })
    : -1;

  // Which chapter's key panel is open, if any.
  const [keyPanel, setKeyPanel] = useState<number | null>(null);

  // A concrete thing to walk towards. Bosses are the most distinctive content
  // in the game, so "3 to the boss" is a better carrot than "level 26".
  const bossAhead = useMemo(() => {
    if (nextIndex < 0) return null;
    const boss = CHAPTERS.map((c) => c.boss).find((b) => b >= nextIndex);
    return boss == null || boss === nextIndex ? null : boss - nextIndex;
  }, [nextIndex]);

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-20 pt-5 lg:h-screen lg:max-w-5xl lg:pb-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onHome}
          aria-label={t("common.home")}
          className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white text-base text-ink transition hover:bg-cream active:scale-95"
        >
          ‹
        </button>
        <button
          onClick={onStats}
          aria-label={t("levels.a11y.stats")}
          className="flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-cream active:scale-95"
        >
          <span>⭐ {stars}/{MAX_STARS}</span>
          {progress.streak >= 2 && <span className="text-gold-deep">🔥 {progress.streak}</span>}
          <span aria-hidden className="text-ink-soft">›</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={onToggleMusic}
            aria-label={t(musicOn ? "a11y.musicOff" : "a11y.musicOn")}
            className={`grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white text-base transition hover:bg-cream active:scale-95 ${
              musicOn ? "" : "opacity-50"
            }`}
          >
            🎵
          </button>
          <button
            onClick={onToggleMute}
            aria-label={t(muted ? "a11y.unmute" : "a11y.mute")}
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white text-base transition hover:bg-cream active:scale-95"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={onHelp}
            aria-label={t("home.howToPlay")}
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white text-base font-semibold text-ink transition hover:bg-cream active:scale-95"
          >
            ?
          </button>
        </div>
      </div>

      <UnlockBanner fresh={fresh} reduce={reduce} lead={bankTime + REVEAL_LEAD} />

      {/* Portrait keeps one column. On a landscape embed — the 1280×720 iframe
          CrazyGames serves most desktop players — it splits: what to play on
          the left, the collection in its own scroller on the right, so the
          whole screen sits above the fold and the page itself never scrolls
          (the same trick the game screen uses at lg). */}
      <div className="lg:flex lg:min-h-0 lg:flex-1 lg:items-stretch lg:gap-8">
        <div className="lg:flex lg:w-[21rem] lg:shrink-0 lg:flex-col lg:justify-start lg:pt-6">
          <h2 className="mt-6 text-center font-display text-3xl font-bold tracking-tight text-ink lg:mt-0 lg:text-left lg:text-4xl">
            {t("levels.title")}
          </h2>
          <p className="mt-1 text-center text-xs font-semibold text-ink-soft lg:text-left">
            {t("levels.summary", { solved: solvedCount, perfect: perfectCount, total: LEVELS.length })}
          </p>
          {debug && (
            <p className="mt-1 text-center text-[0.7rem] font-bold uppercase tracking-widest text-leaf lg:text-left">
              {t("levels.debug")}
            </p>
          )}

          {nextIndex >= 0 ? (
            <>
              <UpNextCard index={nextIndex} reduce={reduce} onPlay={() => onPick(nextIndex)} />
              {bossAhead != null && (
                <p className="mt-2.5 text-center text-xs font-semibold text-ink-soft lg:text-left">
                  {plural("levels.bossIn", bossAhead)}
                </p>
              )}
            </>
          ) : (
            <div className="mt-5 rounded-3xl border-2 border-ink bg-white p-5 text-center shadow-stamp">
              <div className="text-3xl" aria-hidden>🏆</div>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">{t("levels.done.title")}</h3>
              <p className="mt-1 text-sm text-ink-soft">{t("levels.done.body")}</p>
            </div>
          )}
        </div>

        <div className="mt-7 space-y-5 lg:mt-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-4 lg:pr-2 lg:pt-4">
        {CHAPTERS.map((chap, ci) => {
          const ink = chapterInk(ci);
          const slice = LEVELS.slice(chap.start, chap.end);
          const chapStars = slice.reduce((n, p) => n + (progress.stars[p.id] ?? 0), 0);
          const chapDone = slice.every((p) => (progress.stars[p.id] ?? 0) > 0);
          const chapUnlocked = isUnlocked(progress, chap.start);

          // A chapter you can't reach yet is one quiet line. It keeps its name
          // — that's flavour, never puzzle content — so the tail of the index
          // reads as things to come rather than a wall of padlocks.
          if (!chapUnlocked) {
            return (
              <section key={ci} aria-label={t("levels.a11y.chapter", { n: ci + 1, name: t(chap.nameKey) }) + `, ${t("levels.locked")}`}>
                <div className="flex items-baseline gap-2.5">
                  <span aria-hidden className="font-display text-base font-bold text-ink-soft/70">
                    {ci + 1}
                  </span>
                  <h3 className="font-display text-base font-bold text-ink-soft">{t(chap.nameKey)}</h3>
                  <span aria-hidden className="text-xs">🔒</span>
                  <span aria-hidden className="h-px flex-1 bg-ink/10" />
                  <span className="shrink-0 text-xs font-semibold text-ink-soft/70">
                    ⭐ 0/{slice.length * 3}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-soft/80">
                  {t("levels.chapter.locked", { n: chap.start - 2 })} · {t("levels.boss.teaser")}
                </p>
                {/* The empty rail, greyed out: the shape of the thing you'll be
                    collecting, so a locked chapter still advertises the game
                    it's holding rather than just refusing you. */}
                <div aria-hidden className="mt-1.5 flex items-center gap-1 opacity-30">
                  {chapterKey(ci)
                    .split("")
                    .map((_, i) => (
                      <span key={i} className="h-4 w-3.5 rounded-[3px] border border-dashed border-ink" />
                    ))}
                </div>
              </section>
            );
          }

          // Two registers, so each can be laid out by its own rules — and the
          // boss belongs to neither: it gets the panel underneath.
          const indices = slice.map((_, j) => chap.start + j).filter((i) => i !== chap.boss);
          const solved = indices.filter((i) => (progress.stars[LEVELS[i].id] ?? 0) > 0);
          const ahead = indices.filter((i) => (progress.stars[LEVELS[i].id] ?? 0) === 0);

          return (
            <section key={ci}>
              {/* A contents-page rule: numeral, name, hairline, star count. */}
              <div className="flex items-baseline gap-2.5">
                <span aria-hidden className="font-display text-base font-bold" style={{ color: ink.deep }}>
                  {ci + 1}
                </span>
                <h3 className="font-display text-base font-bold text-ink">{t(chap.nameKey)}</h3>
                {chapDone && (
                  <span className="-rotate-6 rounded border border-press px-1 py-px text-[0.55rem] font-extrabold uppercase tracking-wider text-press">
                    {t("levels.chapter.done")}
                  </span>
                )}
                <span aria-hidden className="h-px flex-1" style={{ background: "rgba(38,34,26,0.18)" }} />
                <span className="shrink-0 text-xs font-bold" style={{ color: ink.deep }}>
                  ⭐ {chapStars}/{slice.length * 3}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">{t(chap.flavorKey)}</p>

              {/* Solved levels are index lines: a colour-coded numeral, the
                  board's name, a leader, the stars, and the letter it gave up.
                  Both edges align, so the different title lengths read as
                  typesetting instead of as a ragged row of pills. */}
              {solved.length > 0 && (
                <div className="mt-2">
                  {solved.map((i) => (
                    <LevelRow
                      key={LEVELS[i].id}
                      index={i}
                      ink={ink}
                      earned={progress.stars[LEVELS[i].id] ?? 0}
                      letter={keyLetterOf(i)}
                      banked={onRail(i)}
                      flipping={flipping === LEVELS[i].id}
                      chipRef={(el) => chipRefs.current.set(LEVELS[i].id, el)}
                      onClick={() => onPick(i)}
                    />
                  ))}
                </div>
              )}

              {/* Everything still ahead is a strip of identical squares. They
                  hold no information to size themselves by — that's the point
                  — so they're uniform and they line up. */}
              {ahead.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2 px-1">
                  {ahead.map((i) => {
                    const revealAt = freshOrder.get(LEVELS[i].id);
                    return (
                      <LevelTile
                        key={LEVELS[i].id}
                        index={i}
                        ink={ink}
                        reduce={reduce}
                        unlocked={isUnlocked(progress, i)}
                        isNext={i === nextIndex}
                        tileRef={LEVELS[i].id === lastFresh ? freshRef : undefined}
                        revealDelay={revealAt == null ? null : bankTime + REVEAL_LEAD + revealAt * REVEAL_GAP}
                        onClick={() => isUnlocked(progress, i) && onPick(i)}
                      />
                    );
                  })}
                </div>
              )}

              <BossPanel
                chapter={ci}
                ink={ink}
                reduce={reduce}
                boss={chap.boss}
                bossStars={progress.stars[LEVELS[chap.boss].id] ?? 0}
                open={isUnlocked(progress, chap.boss)}
                awaitingKey={bossAwaitingKey(progress, chap.boss)}
                solvedKey={keySolved(progress, ci)}
                canSpell={keyReady(progress, ci)}
                onRail={onRail}
                slotRef={(id, el) => slotRefs.current.set(id, el)}
                panelRef={ci === bankChapter ? bankRef : undefined}
                onOpenKey={() => setKeyPanel(ci)}
                onPlay={() => onPick(chap.boss)}
              />
            </section>
          );
        })}
        </div>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {said}
      </span>

      {/* The letter in transit, drawn above everything and outside the layout
          so it can cross from an index row into the rail below it. */}
      <AnimatePresence>
        {flight && (
          <motion.span
            key="flight"
            aria-hidden
            className="pointer-events-none fixed z-[80] grid place-items-center rounded-md border-2 border-ink font-display text-sm font-bold text-ink shadow-stamp-sm"
            style={{
              left: flight.x0 - flight.w / 2,
              top: flight.y0 - flight.h / 2,
              width: flight.w,
              height: flight.h,
              background: flight.fill,
            }}
            initial={{ x: 0, y: 0, scale: 1.3, rotate: -12 }}
            animate={{
              x: [0, (flight.x1 - flight.x0) * 0.45, flight.x1 - flight.x0],
              // A lob, not a slide: the letter is thrown to the rail.
              y: [0, (flight.y1 - flight.y0) * 0.5 - 38, flight.y1 - flight.y0],
              scale: [1.3, 1.15, 1],
              rotate: [-12, 8, 0],
            }}
            exit={{ opacity: 0, scale: 1.4, transition: { duration: 0.14 } }}
            transition={{ duration: FLY_MS / 1000, times: [0, 0.5, 1], ease: "easeInOut" }}
          >
            {flight.letter}
          </motion.span>
        )}
      </AnimatePresence>

      {debug && (
        <DebugPanel
          tools={[
            {
              key: "debug.clearLevel",
              onClick: () => nextIndex >= 0 && onDebugClear?.(nextIndex),
              disabled: nextIndex < 0 || !onDebugClear,
            },
            { key: "debug.hints10", onClick: () => onDebugHints?.(), disabled: !onDebugHints },
          ]}
        />
      )}

      <AnimatePresence>
        {keyPanel != null && (
          <ChapterKeyPanel
            chapter={keyPanel}
            hints={hints}
            unlimited={debug}
            onUseHint={onUseHint}
            onRefillHints={onRefillHints}
            onSolved={() => onSolveKey(keyPanel)}
            onClose={() => setKeyPanel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** A letter mid-throw, in viewport coordinates. */
interface Flight {
  letter: string;
  fill: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  w: number;
  h: number;
}

// ---------------------------------------------------------------------------
// The boss panel: the chapter's climax, and the only dark object on the page.
//
// Above, the rail — one slot per letter of the chapter's key, filled by the
// levels that gave them up. Below, the door itself, which reads its state off
// the rail: sealed while letters are missing, charged the moment the last one
// lands, open once the key is spelled, forced once the boss is beaten.
// ---------------------------------------------------------------------------

type DoorState = "far" | "sealed" | "ready" | "open" | "beaten";

function BossPanel({
  chapter,
  ink,
  reduce,
  boss,
  bossStars,
  open,
  awaitingKey,
  solvedKey,
  canSpell,
  onRail,
  slotRef,
  panelRef,
  onOpenKey,
  onPlay,
}: {
  chapter: number;
  ink: ChapterInk;
  reduce: boolean;
  boss: number;
  bossStars: number;
  /** The boss is playable right now (key spelled, or already beaten). */
  open: boolean;
  /** Shut by its key rather than by the progress window. */
  awaitingKey: boolean;
  solvedKey: boolean;
  /** Every letter is genuinely banked in the save (not just on screen). */
  canSpell: boolean;
  onRail: (index: number) => boolean;
  slotRef: (id: string, el: HTMLElement | null) => void;
  panelRef?: React.Ref<HTMLDivElement>;
  onOpenKey: () => void;
  onPlay: () => void;
}) {
  const word = chapterKey(chapter);
  const slots = useMemo(() => keySlots(chapter), [chapter]);
  const filled = slots.filter((s) => onRail(s.index)).length;
  const railFull = filled >= slots.length;
  const twist = bossTwist(boss);

  // Solving the key happens in a modal that sits over this panel and dismisses
  // itself. Opening the door underneath it while it's still up would spend the
  // payoff on a covered-up view, so the panel waits for the modal to clear and
  // then swings — jumble reordering into the keyword, door burst, and all.
  const [spelled, setSpelled] = useState(solvedKey);
  const wasSolved = useRef(solvedKey);
  const [burst, setBurst] = useState(false);
  useEffect(() => {
    const was = wasSolved.current;
    wasSolved.current = solvedKey;
    if (!solvedKey || was) return;
    if (reduce) {
      setSpelled(true);
      return;
    }
    const a = setTimeout(() => {
      setSpelled(true);
      setBurst(true);
      playWin();
    }, KEY_PANEL_MS);
    const b = setTimeout(() => setBurst(false), KEY_PANEL_MS + 1400);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [solvedKey, reduce]);

  // The last letter landing is the moment the key becomes usable, so the rail
  // charges: a gold sweep across the slots and an arpeggio. It fires on the
  // transition only — a rail that was already full when the page opened has
  // had its moment.
  const [charge, setCharge] = useState(false);
  const wasFull = useRef(railFull);
  useEffect(() => {
    const was = wasFull.current;
    wasFull.current = railFull;
    if (!railFull || was || solvedKey || reduce) return;
    setCharge(true);
    const a = setTimeout(() => playCorrect(4), 220);
    const b = setTimeout(() => setCharge(false), 1500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [railFull, solvedKey, reduce]);

  // A door can be open for reasons that have nothing to do with this key — a
  // boss beaten before keys existed, or the debug switch — so `open` is the
  // authority. `spelled` only holds it shut for the beat between solving the
  // key and the modal getting out of the way.
  const doorOpen = open && (spelled || !solvedKey);
  const state: DoorState =
    bossStars > 0 ? "beaten"
    : doorOpen ? "open"
    : railFull ? "ready"
    : awaitingKey ? "sealed"
    : "far";

  // The twist is the hook, so it's revealed as soon as the chapter's levels are
  // done — one beat before the door itself opens. Until then it's a rumour.
  const known = state !== "far" && state !== "sealed";
  const headline = state === "beaten"
    ? levelTitle(boss)
    : known && twist
      ? t(`twist.${twist}.short`)
      : "? ? ?";

  // …and the name on its own ("impostors", "blackout") is a label, not a rule.
  // Once the twist is out, the door says what it actually does, so the player
  // walks in knowing which game they're about to play. A beaten door has
  // nothing left to warn about — it names the board instead.
  const doorRule = known && twist && state !== "beaten" ? t(`twist.${twist}.rule`) : null;

  const label = t(`boss.a11y.${state}`, { n: chapter + 1, level: boss + 1, title: levelTitle(boss) })
    + (doorRule ? `. ${doorRule}` : "");

  return (
    <motion.div
      ref={panelRef}
      className="relative mt-3 overflow-hidden rounded-2xl border-2 border-ink shadow-stamp"
      style={{ background: ink.wash, opacity: state === "far" ? 0.9 : 1 }}
      animate={burst && !reduce ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* --- the rail ------------------------------------------------------ */}
      <div
        className="relative flex flex-wrap items-center gap-1.5 px-2.5 pb-2 pt-2.5"
        role="group"
        aria-label={t("key.a11y.rail", { done: filled, total: slots.length })}
      >
        {spelled
          ? // Spelled: the jumble settles into the word itself, which is the
            // trophy — and the only place the player ever sees it written out.
            word.split("").map((ch, i) => (
              <Rune
                key={`solved-${i}`}
                letter={ch}
                filled
                gold
                index={i}
                ink={ink}
                reduce={reduce}
                pop={burst}
              />
            ))
          : slots.map((slot, i) => (
              <Rune
                key={slot.index}
                letter={slot.letter}
                filled={onRail(slot.index)}
                index={i}
                ink={ink}
                reduce={reduce}
                charge={charge || (railFull && !reduce)}
                tileRef={(el) => slotRef(LEVELS[slot.index].id, el)}
              />
            ))}

        <span
          className="ml-auto shrink-0 pl-1 text-[0.6rem] font-bold"
          style={{ color: spelled ? "#8a5c00" : ink.deep }}
        >
          {spelled
            ? `🔑 ${t("key.rail.solved")}`
            : railFull
              ? t("key.rail.ready")
              : filled === 0
                ? // An empty rail explains itself: nobody should have to infer
                  // what six dashed boxes want from them.
                  t("key.rail.hint")
                : t("key.rail", { done: filled, total: slots.length })}
        </span>

        {/* The charge sweep: one pass of gold light across the finished rail. */}
        {charge && !reduce && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-24 -skew-x-12"
            style={{ background: "linear-gradient(90deg, transparent, rgba(237,168,32,0.55), transparent)" }}
            initial={{ left: "-20%", opacity: 0 }}
            animate={{ left: "110%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
        )}
      </div>

      {/* --- the door ------------------------------------------------------ */}
      <div className="relative flex items-center gap-2.5 border-t-2 border-ink bg-ink px-2.5 py-2 text-paper">
        {/* Ink is the darkest thing on a cream page; the chapter's colour bleeds
            up through it so the door still belongs to its chapter. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ background: `radial-gradient(120% 140% at 12% 120%, ${ink.fill}, transparent 65%)` }}
        />

        <motion.span
          aria-hidden
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink text-lg"
          style={{ background: state === "far" || state === "sealed" ? "#4a443a" : ink.fill }}
          animate={
            reduce || state === "far" || state === "sealed"
              ? { scale: 1 }
              : state === "beaten"
                ? { scale: 1 }
                : { scale: [1, 1.09, 1], rotate: [0, -4, 0] }
          }
          transition={{ duration: 2.1, repeat: state === "open" || state === "ready" ? Infinity : 0 }}
        >
          {state === "far" || state === "sealed" ? "🔒" : "👑"}
        </motion.span>

        {/* The whole stack is decorative: the sr-only label at the foot of the
            panel says the same thing in one sentence, and reads "? ? ?" as the
            mystery it is rather than three question marks. */}
        <div aria-hidden className="relative min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[0.55rem] font-extrabold uppercase tracking-[0.2em] text-paper/55">
              {t("boss.label")} · {t("game.level", { n: boss + 1 })}
            </span>
            {state === "beaten" && (
              <span aria-hidden className="text-[0.6rem] leading-none">
                {[0, 1, 2].map((s) => (
                  <span key={s} className={s < bossStars ? "" : "opacity-30"}>
                    {s < bossStars ? "⭐" : "☆"}
                  </span>
                ))}
              </span>
            )}
          </div>
          <div
            className={`truncate font-display text-base font-bold capitalize leading-tight ${
              known ? "text-paper" : "tracking-[0.25em] text-paper/45"
            }`}
          >
            {headline}
          </div>
          {doorRule && (
            <div className="text-[0.62rem] font-semibold leading-snug text-paper/75">{doorRule}</div>
          )}
          <div className="truncate text-[0.6rem] font-semibold text-paper/60">{t(`boss.${state}`)}</div>
        </div>

        {state === "ready" && (
          <motion.button
            onClick={onOpenKey}
            disabled={!canSpell}
            aria-label={label}
            className="relative shrink-0 rounded-full border-2 border-ink bg-gold px-3.5 py-1.5 text-xs font-extrabold text-ink shadow-stamp-sm transition hover:brightness-105 active:scale-95"
            animate={reduce ? { scale: 1 } : { scale: [1, 1.055, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {t("boss.cta.key")}
          </motion.button>
        )}
        {(state === "open" || state === "beaten") && (
          <motion.button
            onClick={onPlay}
            aria-label={label}
            className={`relative shrink-0 rounded-full border-2 border-ink px-3.5 py-1.5 text-xs font-extrabold shadow-stamp-sm transition active:scale-95 ${
              state === "open" ? "bg-press text-paper hover:brightness-110" : "bg-paper text-ink hover:bg-cream"
            }`}
            animate={reduce || state === "beaten" ? { scale: 1 } : { scale: [1, 1.06, 1] }}
            transition={{ duration: 1.5, repeat: state === "open" ? Infinity : 0 }}
          >
            {t(state === "open" ? "boss.cta.play" : "boss.cta.replay")}
          </motion.button>
        )}
        {(state === "far" || state === "sealed") && (
          // A keyhole, drawn rather than set in emoji: the shut door's answer
          // to the CTA the other states get. It's what the key is *for*.
          <span
            aria-hidden
            className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-paper/20"
          >
            <span className="h-[7px] w-[7px] rounded-full bg-paper/35" />
            <span
              className="absolute h-2.5 w-2 bg-paper/35"
              style={{ top: "52%", clipPath: "polygon(38% 0, 62% 0, 100% 100%, 0 100%)" }}
            />
          </span>
        )}

        {/* The door coming open: one flash of light across the ink. */}
        <AnimatePresence>
          {burst && !reduce && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,240,200,0.85), transparent)" }}
              initial={{ x: "-100%", opacity: 0.9 }}
              animate={{ x: "100%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* A shut door has no control to carry its state, so it says it here.
          The other states put the same sentence on their button. */}
      {(state === "far" || state === "sealed") && <span className="sr-only">{label}</span>}
    </motion.div>
  );
}

/**
 * One slot on a chapter's rail. Empty it's a dashed hole; filled it's a letter
 * pressed in the chapter's ink, set a degree or two off square so a full rail
 * reads as hand-set type rather than a progress bar.
 */
function Rune({
  letter,
  filled,
  gold,
  index,
  ink,
  reduce,
  charge,
  pop,
  tileRef,
}: {
  letter: string;
  filled: boolean;
  /** The spelled key: the whole rail goes gold. */
  gold?: boolean;
  index: number;
  ink: ChapterInk;
  reduce: boolean;
  /** The rail is complete and waiting to be spelled — the slots stir. */
  charge?: boolean;
  /** Land with a pop (the key was just spelled). */
  pop?: boolean;
  tileRef?: (el: HTMLElement | null) => void;
}) {
  const tilt = index % 2 ? 1.5 : -1.5;
  return (
    <span ref={tileRef} className="relative grid h-8 w-[1.65rem] place-items-center">
      <AnimatePresence initial={false}>
        {filled ? (
          <motion.span
            key="filled"
            className="absolute inset-0 grid place-items-center rounded-md border-2 border-ink font-display text-sm font-bold text-ink shadow-stamp-sm"
            style={{ background: gold ? "#f0c04a" : ink.fill }}
            initial={reduce ? { opacity: 1 } : { scale: 0.35, rotate: tilt - 22, opacity: 0 }}
            animate={
              reduce || !charge
                ? { scale: 1, rotate: tilt, opacity: 1, y: 0 }
                : { scale: 1, rotate: tilt, opacity: 1, y: [0, -3, 0] }
            }
            exit={{ opacity: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : charge
                  ? { y: { duration: 1.5, repeat: Infinity, delay: index * 0.11 }, default: { type: "spring", stiffness: 460, damping: 16 } }
                  : { type: "spring", stiffness: 460, damping: 16, delay: pop ? index * 0.06 : 0 }
            }
          >
            {letter}
            {charge && !reduce && !gold && (
              <span aria-hidden className="pointer-events-none absolute -inset-0.5 rounded-md ring-2 ring-gold" />
            )}
          </motion.span>
        ) : (
          <motion.span
            key="empty"
            aria-hidden
            className="absolute inset-0 rounded-md border-2 border-dashed bg-ink/5"
            style={{ borderColor: ink.deep, opacity: 0.35 }}
            exit={reduce ? { opacity: 0 } : { scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
      <span className="sr-only">
        {filled ? t("key.a11y.rune", { letter }) : t("key.a11y.emptyRune")}
      </span>
    </span>
  );
}

/**
 * Spell the chapter's keyword from the letters its levels banked. The bank is
 * exactly those letters, jumbled — so this is a pure anagram, and the chapter's
 * own name is the clue. Reuses the finale's panel, which is the verb the whole
 * game has already taught.
 */
function ChapterKeyPanel({
  chapter,
  hints,
  unlimited,
  onUseHint,
  onRefillHints,
  onSolved,
  onClose,
}: {
  chapter: number;
  hints: number;
  /** Debug: hints are free, so the letter reveal never runs out. */
  unlimited?: boolean;
  onUseHint: () => void;
  onRefillHints: () => Promise<boolean>;
  onSolved: () => void;
  onClose: () => void;
}) {
  const word = chapterKey(chapter);
  const ink = chapterInk(chapter);
  const bank = useMemo(() => shuffledLetters(word), [word]);
  const [revealed, setRevealed] = useState(0);
  const [resolved, setResolved] = useState(false);

  const submit = (text: string) => {
    if (text.toUpperCase() !== word) return false;
    setResolved(true);
    playWin();
    onSolved();
    setTimeout(onClose, KEY_PANEL_MS);
    return true;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/45 px-4 py-8"
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="w-full max-w-md rounded-3xl border-2 border-ink bg-paper px-5 pb-5 pt-4 shadow-stamp-lg"
      >
        <div className="text-center">
          <span
            className="text-[0.6rem] font-extrabold uppercase tracking-[0.2em]"
            style={{ color: ink.deep }}
          >
            {t("key.chapter", { n: chapter + 1, name: t(CHAPTERS[chapter].nameKey) })}
          </span>
        </div>
        <LinkGuess
          bank={bank}
          titleKey="key.title"
          bodyKey="key.body"
          dismissKey={resolved ? "common.done" : "common.close"}
          onMiss={onClose}
          resolved={resolved}
          pivot={word}
          revealedLetters={revealed}
          hintBank={hints}
          unlimited={unlimited}
          canRevealLetter={(unlimited || hints > 0) && revealed < word.length - 1}
          onRevealLetter={() => {
            if (!unlimited && hints <= 0) return;
            onUseHint();
            setRevealed((r) => r + 1);
          }}
          onRefill={() => void onRefillHints()}
          onSubmit={submit}
          onReveal={onClose}
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * The one thing most visits are actually for. It names the chapter, the level
 * and its difficulty — and, for a boss, which twist is waiting — but never the
 * board's title, which would leak the link on a level you haven't played.
 */
function UpNextCard({ index, reduce, onPlay }: { index: number; reduce: boolean; onPlay: () => void }) {
  const chapter = CHAPTERS.findIndex((c) => index >= c.start && index < c.end);
  const ink = chapterInk(Math.max(chapter, 0));
  const twist = bossTwist(index);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="mt-5 overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-stamp"
    >
      <div className="px-4 pb-4 pt-3 lg:px-5 lg:pb-5 lg:pt-4" style={{ background: ink.wash }}>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[0.6rem] font-extrabold uppercase tracking-[0.15em]" style={{ color: ink.deep }}>
            {t("levels.upNext")} · {t(CHAPTERS[Math.max(chapter, 0)].nameKey)}
          </span>
          <span className="shrink-0 rounded-full border border-ink/25 bg-white px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft">
            {t(TIER_KEY[LEVELS[index].tier])}
          </span>
        </div>

        {/* Compact side-by-side on a phone. In the landscape embed it stacks
            and the Play button goes full width — on a games portal the primary
            CTA should be the biggest thing in its column, not a chip beside a
            heading. */}
        <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3 lg:mt-2 lg:block">
          <div className="min-w-0">
            <div className="font-display text-2xl font-bold leading-tight text-ink lg:text-4xl">
              {t("game.level", { n: index + 1 })}
            </div>
            <div className="mt-0.5 text-xs text-ink-soft lg:mt-1 lg:text-sm">
              {twist ? t("levels.boss.twist", { what: t(`twist.${twist}.short`) }) : t("levels.upNext.blurb")}
            </div>
            {/* The card you actually press Play on says what the boss does,
                not just what it's called. */}
            {twist && (
              <div className="mt-1 text-xs font-semibold leading-snug text-ink lg:text-sm">
                {t(`twist.${twist}.rule`)}
              </div>
            )}
          </div>
          <button
            onClick={onPlay}
            className="shrink-0 rounded-full bg-press px-7 py-2.5 text-sm font-bold text-paper shadow-stamp transition hover:scale-[1.03] active:scale-95 lg:mt-4 lg:w-full lg:py-3.5 lg:text-base lg:shadow-stamp-lg"
          >
            {t("levels.play")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * The headline for what just opened. It varies by *kind* — a whole new chapter,
 * a boss with its twist named, or a plain level with one of five rotating lines
 * — so a run of unlocks doesn't repeat one sentence over and over.
 */
function UnlockBanner({ fresh, reduce, lead }: { fresh: string[]; reduce: boolean; lead: number }) {
  const [show, setShow] = useState(fresh.length > 0);
  const news = useMemo(() => {
    if (!fresh.length) return null;
    const idx = fresh.map((id) => LEVELS.findIndex((l) => l.id === id)).filter((i) => i >= 0);
    if (!idx.length) return null;

    const chapterOpener = idx.find((i) => CHAPTERS.some((c) => c.start === i));
    if (chapterOpener != null) {
      const c = CHAPTERS.findIndex((ch) => ch.start === chapterOpener);
      return { icon: `${c + 1}`, text: t("levels.unlock.chapter", { name: t(CHAPTERS[c].nameKey) }) };
    }
    const boss = idx.find((i) => isBossLevel(i));
    if (boss != null) {
      return { icon: "👑", text: t("levels.unlock.boss", { what: t(`twist.${bossTwist(boss)}.short`) }) };
    }
    const top = idx[idx.length - 1];
    return { icon: "🔓", text: t(`levels.unlock.flavor.${top % 5}`, { n: top + 1 }) };
  }, [fresh]);

  const extra = fresh.length - 1;
  const delay = reduce ? 0 : lead + (fresh.length - 1) * REVEAL_GAP;
  useEffect(() => {
    if (!news) return;
    const id = setTimeout(() => setShow(false), delay + 5200);
    return () => clearTimeout(id);
  }, [news, delay]);

  if (!news) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ delay: delay / 1000, type: "spring", stiffness: 280, damping: 22 }}
          onClick={() => setShow(false)}
          role="status"
          // Fixed, not in flow: the page scrolls itself to the chip that's
          // opening, so a banner in the layout would announce the news
          // somewhere the player isn't looking.
          className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[min(28rem,calc(100%-2rem))] cursor-pointer items-center gap-3 rounded-2xl border-2 border-ink bg-gold/95 px-4 py-2.5 shadow-stamp lg:left-[max(1rem,calc((100vw-64rem)/2+1rem))] lg:right-auto lg:mx-0 lg:w-[21rem]"
        >
          <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border-2 border-ink bg-white font-display text-base font-bold">
            {news.icon}
          </span>
          <span className="min-w-0 flex-1 text-sm font-bold text-ink">{news.text}</span>
          {extra > 0 && (
            <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-[0.6rem] font-bold text-paper">
              {t("levels.unlock.more", { n: extra })}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * A solved level, as a line in a contents page: a colour-coded numeral, the
 * board's name, a leader, the stars. The numerals form one aligned column and
 * the stars another, so titles of different lengths sit between fixed edges
 * instead of ragging out into the gutter.
 *
 * The numeral chip is also where a cleared level pays out: it turns over to
 * show the key letter this level bought, holds it up, and then that letter is
 * thrown down to the chapter's rail (the parent drives the throw). The row
 * keeps a faint copy at the end, so the rail can always be read back to the
 * levels that filled it.
 */
function LevelRow({
  index,
  ink,
  earned,
  letter,
  banked,
  flipping,
  chipRef,
  onClick,
}: {
  index: number;
  ink: ChapterInk;
  earned: number;
  letter: string | null;
  /** The letter has reached the rail — the row can show its copy. */
  banked: boolean;
  /** Right now: the chip is holding the letter up, about to throw it. */
  flipping: boolean;
  chipRef: (el: HTMLElement | null) => void;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={
        t("levels.a11y.solved", { n: index + 1, title: levelTitle(index) }) +
        `, ${t(TIER_KEY[LEVELS[index].tier])}` +
        t("levels.a11y.stars", { n: earned })
      }
      className="flex w-full items-center gap-2.5 rounded-lg px-1 py-[3px] text-left transition hover:bg-cream"
    >
      <motion.span
        ref={chipRef}
        aria-hidden
        className="relative grid h-6 w-6 shrink-0 place-items-center rounded-md border font-display text-[0.7rem] font-bold tabular-nums text-ink"
        style={{ background: ink.fill, borderColor: flipping ? ink.deep : "rgba(38,34,26,0.25)" }}
        animate={flipping ? { scale: 1.35, y: -2 } : { scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 18 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {flipping && letter ? (
            <motion.span
              key="letter"
              className="text-[0.8rem]"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              {letter}
            </motion.span>
          ) : (
            <motion.span
              key="num"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              {index + 1}
            </motion.span>
          )}
        </AnimatePresence>
        {flipping && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-md border-2"
            style={{ borderColor: ink.deep }}
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 2.1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        )}
      </motion.span>

      <span className="shrink-0 font-display text-sm font-bold text-ink">{levelTitle(index)}</span>
      <span aria-hidden className="h-0 flex-1 self-end border-b border-dotted border-ink/30 pb-[7px]" />
      {/* A fixed three-cell grid: ☆ is narrower than ⭐, so letting the pips
          size themselves would leave every leader ending somewhere different. */}
      <span aria-hidden className="grid w-[2.6rem] shrink-0 grid-cols-3 justify-items-center text-[0.6rem] leading-none">
        {[0, 1, 2].map((s) => (
          <span key={s} className={s < earned ? "" : "opacity-25"}>
            {s < earned ? "⭐" : "☆"}
          </span>
        ))}
      </span>
      <span
        aria-hidden
        className="w-3 shrink-0 text-right font-display text-[0.65rem] font-bold"
        style={{ color: ink.deep, opacity: banked && !flipping ? 0.45 : 0 }}
      >
        {letter}
      </span>
    </button>
  );
}

/**
 * A level still ahead of you. It carries no information — deliberately, since a
 * board you haven't played should give nothing away — so every one of these is
 * the same size and they tile into an even strip. A freshly unlocked tile
 * starts on its locked face and opens on a timer, so the player *watches* it
 * happen instead of finding it already changed.
 */
function LevelTile({
  index,
  ink,
  reduce,
  unlocked,
  isNext,
  tileRef,
  revealDelay,
  onClick,
}: {
  index: number;
  ink: ChapterInk;
  reduce: boolean;
  unlocked: boolean;
  isNext: boolean;
  tileRef?: React.Ref<HTMLButtonElement>;
  /** ms to wait before popping the lock off, or null for "already open". */
  revealDelay: number | null;
  onClick: () => void;
}) {
  const [opened, setOpened] = useState(revealDelay == null);
  useEffect(() => {
    if (revealDelay == null) return;
    const id = setTimeout(() => {
      setOpened(true);
      playStar(index % 5);
    }, reduce ? 0 : revealDelay);
    return () => clearTimeout(id);
  }, [revealDelay, reduce, index]);

  const showOpen = unlocked && opened;
  const style: React.CSSProperties = {};
  let face = "border-dashed border-ink/25 bg-cream/60";
  if (showOpen) {
    face = "border-ink bg-white shadow-stamp-sm";
    style.color = ink.deep;
  }

  return (
    <motion.button
      ref={tileRef}
      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: reduce ? 0 : Math.min(index * 0.008, 0.25), type: "spring", stiffness: 340, damping: 24 }}
      whileTap={showOpen ? { scale: 0.94 } : undefined}
      onClick={onClick}
      disabled={!showOpen}
      aria-label={
        t("levels.a11y.node", { n: index + 1 }) +
        `, ${t(TIER_KEY[LEVELS[index].tier])}` +
        (showOpen ? "" : t("levels.a11y.lockedNode")) +
        (revealDelay != null ? t("levels.a11y.freshNode") : "")
      }
      className={`relative grid h-11 w-11 place-items-center rounded-xl border-2 font-display transition-colors disabled:cursor-default ${face}`}
      style={style}
    >
      {isNext && showOpen && (
        <motion.span
          aria-hidden
          className="absolute -inset-0.5 rounded-xl ring-2 ring-press"
          animate={reduce ? { opacity: 1 } : { opacity: [0.35, 1, 0.35] }}
          transition={reduce ? undefined : { duration: 1.6, repeat: Infinity }}
        />
      )}

      {/* With motion turned down the face is plain markup, not an animation
          that has been shortened to nothing: the page's own reduced-motion CSS
          caps every animation at 0.001ms, which used to leave the numeral
          stuck on a frame that never painted — an open tile with nothing on
          it. Nothing to animate, nothing to get stuck. */}
      {reduce ? (
        showOpen ? (
          <span className="text-base font-bold leading-none">{index + 1}</span>
        ) : (
          <span aria-hidden className="text-sm opacity-55">🔒</span>
        )
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {showOpen ? (
            <motion.span
              key="open"
              className="text-base font-bold leading-none"
              initial={revealDelay == null ? false : { scale: 0.4, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 15 }}
            >
              {index + 1}
            </motion.span>
          ) : (
            <motion.span
              key="locked"
              aria-hidden
              className="text-sm opacity-55"
              exit={{ scale: 1.6, opacity: 0, rotate: 25 }}
              transition={{ duration: 0.28 }}
            >
              🔒
            </motion.span>
          )}
        </AnimatePresence>
      )}

      {/* The shockwave the popping lock leaves behind. */}
      {revealDelay != null && showOpen && !reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl border-2"
          style={{ borderColor: ink.deep }}
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      )}
    </motion.button>
  );
}
