import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LEVELS, CHAPTERS, TIER_KEY, bossTwist, isBossLevel, levelTitle } from "./puzzles";
import { chapterInk, type ChapterInk } from "./theme";
import { playStar } from "./audio";
import { t } from "./i18n";
import {
  isUnlocked,
  isDebug,
  MAX_STARS,
  totalStars,
  newlyUnlocked,
  furthestCleared,
  type Progress,
} from "./progress";

// ---------------------------------------------------------------------------
// The level list is an INDEX, not a map.
//
// It used to be 63 identical numbered squares in a grid, which was wrong in two
// directions at once. Behind you it threw away everything that makes a level
// memorable — you solved "Bank On It", and the list remembered "a gold square".
// Ahead of you a numbered square promises nothing, so there was nothing to want.
//
// So the two halves are now drawn differently, because they *are* different:
//
//   solved  → a word. The board's title, which the win card and the history
//             already show once you've cracked it, on a chip in the chapter's
//             ink. Titles are different lengths, so the rows set like a page of
//             type and every player's index is shaped by what they've beaten.
//   unsolved→ a bare number, small and quiet. Anonymity is the product here:
//             a level you haven't played should give away nothing.
//
// And the thing you actually came to do — play the next level — is a card at the
// top, not a node to hunt for in a grid.
// ---------------------------------------------------------------------------

// Pacing of the unlock reveal: the first lock pops shortly after the page
// settles, and any others follow one at a time so two never read as one blur.
const REVEAL_LEAD = 620;
const REVEAL_GAP = 520;

export default function LevelSelect({
  progress,
  reduce,
  onPick,
  onSeen,
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
  onPick: (index: number) => void;
  /** Called once the page has shown what's new, so each unlock plays only once. */
  onSeen: () => void;
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
  useEffect(() => {
    onSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The old map auto-scrolled to the next level because that node was buried in
  // the grid. It isn't any more — it's the card at the top — so the page opens
  // at the top, on your record. The one exception is a pending unlock: that's
  // an animation, and an animation nobody sees may as well not run.
  const freshRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    freshRef.current?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const lastFresh = fresh[fresh.length - 1];

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-20 pt-5 lg:max-w-2xl">
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
          className="flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-1.5 text-sm font-semibold text-ink shadow transition hover:bg-cream active:scale-95"
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

      <h2 className="mt-6 text-center font-display text-3xl font-bold tracking-tight text-ink">
        {t("levels.title")}
      </h2>
      <p className="mt-1 text-center text-xs font-semibold text-ink-soft">
        {t("levels.summary", { solved: solvedCount, perfect: perfectCount, total: LEVELS.length })}
      </p>
      {isDebug() && (
        <p className="mt-1 text-center text-[0.7rem] font-bold uppercase tracking-widest text-leaf">
          {t("levels.debug")}
        </p>
      )}

      {nextIndex >= 0 ? (
        <UpNextCard index={nextIndex} reduce={reduce} onPlay={() => onPick(nextIndex)} />
      ) : (
        <div className="mt-5 rounded-3xl border-2 border-ink bg-white p-5 text-center shadow-[3px_3px_0_rgba(38,34,26,0.3)]">
          <div className="text-3xl" aria-hidden>🏆</div>
          <h3 className="mt-1 font-display text-xl font-bold text-ink">{t("levels.done.title")}</h3>
          <p className="mt-1 text-sm text-ink-soft">{t("levels.done.body")}</p>
        </div>
      )}

      <UnlockBanner fresh={fresh} reduce={reduce} />

      <div className="mt-7 space-y-5">
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
              </section>
            );
          }

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

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {slice.map((p, j) => {
                  const i = chap.start + j;
                  const revealAt = freshOrder.get(p.id);
                  return (
                    <LevelChip
                      key={p.id}
                      index={i}
                      ink={ink}
                      reduce={reduce}
                      unlocked={isUnlocked(progress, i)}
                      earned={progress.stars[p.id] ?? 0}
                      isNext={i === nextIndex}
                      chipRef={p.id === lastFresh ? freshRef : undefined}
                      revealDelay={revealAt == null ? null : REVEAL_LEAD + revealAt * REVEAL_GAP}
                      onClick={() => isUnlocked(progress, i) && onPick(i)}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
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
      className="mt-5 overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-[3px_3px_0_rgba(38,34,26,0.35)]"
    >
      <div className="px-4 pb-4 pt-3" style={{ background: ink.wash }}>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[0.6rem] font-extrabold uppercase tracking-[0.15em]" style={{ color: ink.deep }}>
            {t("levels.upNext")} · {t(CHAPTERS[Math.max(chapter, 0)].nameKey)}
          </span>
          <span className="shrink-0 rounded-full border border-ink/25 bg-white px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft">
            {t(TIER_KEY[LEVELS[index].tier])}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="font-display text-2xl font-bold leading-tight text-ink">
              {t("game.level", { n: index + 1 })}
            </div>
            <div className="mt-0.5 text-xs text-ink-soft">
              {twist ? t("levels.boss.twist", { what: t(`twist.${twist}.short`) }) : t("levels.upNext.blurb")}
            </div>
          </div>
          <button
            onClick={onPlay}
            className="shrink-0 rounded-full bg-press px-7 py-2.5 text-sm font-bold text-paper shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition hover:scale-[1.03] active:scale-95"
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
function UnlockBanner({ fresh, reduce }: { fresh: string[]; reduce: boolean }) {
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
  const delay = reduce ? 0 : REVEAL_LEAD + (fresh.length - 1) * REVEAL_GAP;
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
          className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[min(28rem,calc(100%-2rem))] cursor-pointer items-center gap-3 rounded-2xl border-2 border-ink bg-gold/95 px-4 py-2.5 shadow-[3px_3px_0_rgba(38,34,26,0.55)]"
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
 * One entry in the index. Solved levels wear their title; everything else is a
 * bare number or a lock. All three are the same height so the rows set cleanly.
 */
function LevelChip({
  index,
  ink,
  reduce,
  unlocked,
  earned,
  isNext,
  chipRef,
  revealDelay,
  onClick,
}: {
  index: number;
  ink: ChapterInk;
  reduce: boolean;
  unlocked: boolean;
  earned: number;
  isNext: boolean;
  chipRef?: React.Ref<HTMLButtonElement>;
  /** ms to wait before popping the lock off, or null for "already open". */
  revealDelay: number | null;
  onClick: () => void;
}) {
  // A freshly unlocked entry starts on its locked face and opens on a timer, so
  // the player *watches* it happen instead of finding it already changed.
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
  const solved = earned > 0;
  const boss = isBossLevel(index);
  const twist = bossTwist(index);

  const base =
    "relative flex h-9 items-center justify-center gap-1 rounded-xl border-2 font-display transition-colors disabled:cursor-default";
  const style: React.CSSProperties = {};
  let cls: string;

  if (solved) {
    // Flat, no offset shadow: a level you've finished is a record, not a
    // control. Only the things you can act on now — the Up next card and the
    // open numbered entries — sit raised off the page.
    cls = `${base} border-ink/20 px-2 text-ink`;
    style.background = ink.fill;
    // A flawless clear keeps a gold rule inside the chip, so the index records
    // how well you did and not only that you passed.
    if (earned >= 3) style.boxShadow = "inset 0 0 0 2px #f7dd9a";
  } else if (showOpen && boss) {
    cls = `${base} bg-white px-2 shadow-[2px_2px_0_rgba(38,34,26,0.3)]`;
    style.borderColor = ink.deep;
    style.color = ink.deep;
  } else if (showOpen) {
    cls = `${base} w-9 border-ink bg-white shadow-[2px_2px_0_rgba(38,34,26,0.3)]`;
    style.color = ink.deep;
  } else {
    cls = `${base} w-9 border-dashed border-ink/25 bg-cream/60`;
  }

  const label =
    (solved
      ? t("levels.a11y.solved", { n: index + 1, title: levelTitle(index) })
      : t("levels.a11y.node", { n: index + 1 })) +
    (boss ? t("levels.a11y.boss") : "") +
    `, ${t(TIER_KEY[LEVELS[index].tier])}` +
    (solved ? t("levels.a11y.stars", { n: earned }) : showOpen ? "" : t("levels.a11y.lockedNode")) +
    (revealDelay != null ? t("levels.a11y.freshNode") : "");

  return (
    <motion.button
      ref={chipRef}
      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: reduce ? 0 : Math.min(index * 0.008, 0.25), type: "spring", stiffness: 340, damping: 24 }}
      whileTap={showOpen ? { scale: 0.94 } : undefined}
      onClick={onClick}
      disabled={!showOpen}
      aria-label={label}
      className={cls}
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

      <AnimatePresence mode="wait" initial={false}>
        {showOpen ? (
          <motion.span
            key="open"
            className="flex items-center gap-1"
            initial={reduce || revealDelay == null ? false : { scale: 0.4, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 15 }}
          >
            {boss && <span aria-hidden className="text-[0.65rem] leading-none">👑</span>}
            {solved ? (
              <>
                <span className="text-xs font-bold leading-none">{levelTitle(index)}</span>
                <span aria-hidden className="flex gap-px text-[0.45rem] leading-none">
                  {[0, 1, 2].map((s) => (
                    <span key={s} className={s < earned ? "" : "opacity-30"}>
                      {s < earned ? "⭐" : "☆"}
                    </span>
                  ))}
                </span>
              </>
            ) : boss && twist ? (
              // An open boss announces its twist: the last entry of a chapter is
              // the one worth walking towards, and "63" doesn't say that.
              <span className="text-xs font-bold capitalize leading-none">{t(`twist.${twist}.short`)}</span>
            ) : (
              <span className="text-sm font-bold leading-none">{index + 1}</span>
            )}
          </motion.span>
        ) : (
          <motion.span
            key="locked"
            aria-hidden
            className="flex items-center gap-1 text-sm opacity-55"
            exit={reduce ? { opacity: 0 } : { scale: 1.6, opacity: 0, rotate: 25 }}
            transition={{ duration: 0.28 }}
          >
            {boss && <span className="text-xs leading-none">👑</span>}
            🔒
          </motion.span>
        )}
      </AnimatePresence>

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
