import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LEVELS, CHAPTERS, TIER_KEY, bossTwist, isBossLevel, type Tier } from "./puzzles";
import { chapterInk, type ChapterInk } from "./theme";
import { playStar } from "./audio";
import { t } from "./i18n";
import {
  isUnlocked,
  isDebug,
  MAX_STARS,
  totalStars,
  clearedCount,
  furthestCleared,
  newlyUnlocked,
  type Progress,
} from "./progress";

// Pacing of the unlock reveal: the first lock pops shortly after the map
// settles, and any others follow one at a time so two unlocks never read as
// one blur.
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
  /** Called once the map has shown what's new, so each unlock plays only once. */
  onSeen: () => void;
  onHome: () => void;
  onHelp: () => void;
  onStats: () => void;
  muted: boolean;
  onToggleMute: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
}) {
  const stars = totalStars(progress);
  const cleared = clearedCount(progress);
  const nextIndex = LEVELS.findIndex((p, i) => isUnlocked(progress, i) && !(progress.stars[p.id] > 0));

  // What opened since the player last looked — captured once, at mount, before
  // it's marked as seen. A player who hasn't cleared anything yet isn't told
  // that level 1 "just unlocked"; they were never locked out of it.
  const [fresh] = useState<string[]>(() =>
    furthestCleared(progress) >= 0 ? newlyUnlocked(progress) : []
  );
  const freshOrder = useMemo(() => new Map(fresh.map((id, i) => [id, i])), [fresh]);
  useEffect(() => {
    onSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chapters start expanded only where there's something to do: the one you're
  // in, and any other with an open level you haven't cleared. Finished
  // chapters fold up into a one-line trophy row and locked ones into a teaser,
  // so the map opens on your business instead of forty padlocks.
  const [open, setOpen] = useState<Set<number>>(() => {
    const set = new Set<number>();
    CHAPTERS.forEach((chap, ci) => {
      const slice = LEVELS.slice(chap.start, chap.end);
      const hasOpenWork = slice.some((p, j) => isUnlocked(progress, chap.start + j) && !(progress.stars[p.id] > 0));
      const hasFresh = slice.some((p) => freshOrder.has(p.id));
      if (hasOpenWork || hasFresh) set.add(ci);
    });
    if (!set.size) set.add(CHAPTERS.length - 1); // everything cleared: show the last
    return set;
  });
  const toggle = (ci: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(ci)) next.add(ci);
      return next;
    });

  // The map is tall, so a returning player would land at level 1 and have to
  // scroll to find where they are. Bring the next-playable node into view
  // instead (instantly — no distracting glide).
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    nextRef.current?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-16 pt-5 lg:max-w-2xl">
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
        {t("levels.cleared", { done: cleared, total: LEVELS.length })}
      </p>
      <div className="mx-auto mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-ink/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(cleared / LEVELS.length) * 100}%` }}
          transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.2 }}
          className="h-full rounded-full bg-press"
        />
      </div>
      {isDebug() && (
        <p className="mt-1 text-center text-[0.7rem] font-bold uppercase tracking-widest text-leaf">
          {t("levels.debug")}
        </p>
      )}

      <UnlockBanner fresh={fresh} reduce={reduce} />

      <div className="mt-5 space-y-4">
        {CHAPTERS.map((chap, ci) => {
          const slice = LEVELS.slice(chap.start, chap.end);
          const ink = chapterInk(ci);
          const chapStars = slice.reduce((n, p) => n + (progress.stars[p.id] ?? 0), 0);
          const chapCleared = slice.filter((p) => (progress.stars[p.id] ?? 0) > 0).length;
          const chapDone = chapCleared === slice.length;
          const chapUnlocked = isUnlocked(progress, chap.start);
          const here = nextIndex >= chap.start && nextIndex < chap.end;
          const expanded = open.has(ci);
          const twist = bossTwist(chap.boss);
          const bossOpen = isUnlocked(progress, chap.boss);

          return (
            <section
              key={ci}
              className="overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-[3px_3px_0_rgba(38,34,26,0.3)]"
            >
              <button
                onClick={() => toggle(ci)}
                aria-expanded={expanded}
                aria-label={
                  t("levels.a11y.chapter", { n: ci + 1, name: t(chap.nameKey) }) +
                  (chapUnlocked ? "" : `, ${t("levels.locked")}`)
                }
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:brightness-[0.97]"
                style={{ background: ink.wash }}
              >
                <span
                  aria-hidden
                  className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 font-display text-lg font-bold ${
                    chapUnlocked ? "border-ink text-ink" : "border-ink/40"
                  }`}
                  style={{ background: chapUnlocked ? ink.fill : "#fff", color: chapUnlocked ? undefined : ink.deep }}
                >
                  {ci + 1}
                  {!chapUnlocked && <span className="absolute -bottom-1 -right-1 text-[0.7rem]">🔒</span>}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    {/* A locked chapter still shows its name. It's flavour, never a
                        puzzle spoiler, and five rows reading "Locked" was the
                        dullest stretch of the map — a named chapter is a tease. */}
                    <span
                      className={`truncate font-display text-base font-bold ${
                        chapUnlocked ? "text-ink" : "text-ink-soft"
                      }`}
                    >
                      {t(chap.nameKey)}
                    </span>
                    {chapDone && (
                      <span
                        className="shrink-0 -rotate-6 rounded border border-press px-1 py-px text-[0.55rem] font-extrabold uppercase tracking-wider text-press"
                        style={{ background: "rgba(217,72,43,0.08)" }}
                      >
                        {t("levels.chapter.done")}
                      </span>
                    )}
                    {here && !chapDone && (
                      <span className="shrink-0 rounded-full bg-press px-1.5 py-px text-[0.55rem] font-extrabold uppercase tracking-wider text-paper">
                        {t("levels.chapter.next")}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-ink-soft">
                    {chapUnlocked
                      ? t(chap.flavorKey)
                      : t("levels.chapter.locked", { n: chap.start - 2 })}
                  </span>
                  {/* A finished chapter drops the bar — a permanently full one
                      says nothing, and the COMPLETE stamp already says it. */}
                  {chapUnlocked && !chapDone && (
                    <span className="mt-1.5 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${(chapCleared / slice.length) * 100}%`, background: ink.deep }}
                        />
                      </span>
                      <span className="shrink-0 text-[0.6rem] font-semibold text-ink-soft">
                        {t("levels.chapter.progress", { done: chapCleared, total: slice.length })}
                      </span>
                    </span>
                  )}
                </span>

                <span className="shrink-0 text-right">
                  <span className="block text-xs font-bold" style={{ color: ink.deep }}>
                    ⭐ {chapStars}/{slice.length * 3}
                  </span>
                  <span aria-hidden className="block text-sm text-ink-soft">
                    {expanded ? "▴" : "▾"}
                  </span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-4 gap-3 px-3 pb-3 pt-3 sm:grid-cols-6">
                      {slice.map((p, j) => {
                        const i = chap.start + j;
                        const revealAt = freshOrder.get(p.id);
                        return (
                          <LevelNode
                            key={p.id}
                            index={i}
                            ink={ink}
                            tier={p.tier}
                            reduce={reduce}
                            unlocked={isUnlocked(progress, i)}
                            earned={progress.stars[p.id] ?? 0}
                            highlight={i === nextIndex}
                            nodeRef={i === nextIndex ? nextRef : undefined}
                            boss={i === chap.boss}
                            revealDelay={revealAt == null ? null : REVEAL_LEAD + revealAt * REVEAL_GAP}
                            onClick={() => isUnlocked(progress, i) && onPick(i)}
                          />
                        );
                      })}
                    </div>
                    {/* Each chapter ends on a boss that plays by different rules —
                        saying which one gives the last node of a chapter its own
                        pull instead of being level N+1. */}
                    <p
                      className="border-t px-3 py-2 text-[0.65rem] font-semibold"
                      style={{ borderColor: "rgba(38,34,26,0.12)", color: ink.deep }}
                    >
                      {bossOpen && twist
                        ? t("levels.boss.twist", { what: t(`twist.${twist}.short`) })
                        : t("levels.boss.teaser")}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          );
        })}
      </div>
    </div>
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
    const idx = fresh
      .map((id) => LEVELS.findIndex((l) => l.id === id))
      .filter((i) => i >= 0);
    if (!idx.length) return null;

    const chapterOpener = idx.find((i) => CHAPTERS.some((c) => c.start === i));
    if (chapterOpener != null) {
      const c = CHAPTERS.findIndex((ch) => ch.start === chapterOpener);
      return { icon: `${c + 1}`, text: t("levels.unlock.chapter", { name: t(CHAPTERS[c].nameKey) }) };
    }
    const boss = idx.find((i) => isBossLevel(i));
    if (boss != null) {
      const twist = bossTwist(boss);
      return { icon: "👑", text: t("levels.unlock.boss", { what: t(`twist.${twist}.short`) }) };
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
          // Fixed, not in flow: the map scrolls itself to wherever the player
          // left off, so a banner at the top of the page would announce the
          // unlock somewhere they never look.
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

function LevelNode({
  index,
  ink,
  tier,
  reduce,
  unlocked,
  earned,
  highlight,
  nodeRef,
  boss,
  revealDelay,
  onClick,
}: {
  index: number;
  ink: ChapterInk;
  tier: Tier;
  reduce: boolean;
  unlocked: boolean;
  earned: number;
  highlight: boolean;
  nodeRef?: React.Ref<HTMLButtonElement>;
  boss: boolean;
  /** ms to wait before popping the lock off, or null for "already open". */
  revealDelay: number | null;
  onClick: () => void;
}) {
  // A freshly unlocked node starts on its locked face and opens on a timer, so
  // the player *watches* it happen instead of finding it already changed.
  const [opened, setOpened] = useState(revealDelay == null);
  useEffect(() => {
    if (revealDelay == null) return;
    const id = setTimeout(() => {
      setOpened(true);
      playStar(Math.min(index % 5, 4));
    }, reduce ? 0 : revealDelay);
    return () => clearTimeout(id);
  }, [revealDelay, reduce, index]);

  const showOpen = unlocked && opened;
  const done = earned > 0;
  const perfect = earned >= 3;

  const style: React.CSSProperties = {};
  let face = "border-2 border-dashed border-ink/25 bg-cream/70 text-ink";
  if (done) {
    face = "border-2 border-ink text-ink";
    style.background = ink.fill;
    // A flawless clear keeps a gold rule inside the tile, so the map records
    // *how well* you did rather than only that you passed.
    if (perfect) style.boxShadow = "3px 3px 0 rgba(38,34,26,0.3), inset 0 0 0 3px #f7dd9a";
  } else if (showOpen && boss) {
    face = "border-2 text-ink";
    style.background = "#fff";
    style.borderColor = ink.deep;
  } else if (showOpen) {
    face = "border-2 border-ink bg-white";
    style.color = ink.deep;
  }

  return (
    <motion.button
      ref={nodeRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: reduce ? 0 : Math.min(index * 0.01, 0.3), type: "spring", stiffness: 320, damping: 24 }}
      whileTap={showOpen ? { scale: 0.92 } : undefined}
      onClick={onClick}
      disabled={!showOpen}
      aria-label={
        t("levels.a11y.node", { n: index + 1 }) +
        (boss ? t("levels.a11y.boss") : "") +
        `, ${t(TIER_KEY[tier])}` +
        (done ? t("levels.a11y.stars", { n: earned }) : showOpen ? "" : t("levels.a11y.lockedNode")) +
        (revealDelay != null ? t("levels.a11y.freshNode") : "")
      }
      className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl p-1 shadow-[3px_3px_0_rgba(38,34,26,0.3)] transition-colors disabled:cursor-default ${face}`}
      style={style}
    >
      {highlight && showOpen && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-2xl ring-2 ring-press"
          animate={reduce ? { opacity: 1 } : { opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] }}
          transition={reduce ? undefined : { duration: 1.6, repeat: Infinity }}
        />
      )}
      {/* The crown teases a boss on every boss node — even locked ones — while
          the node face still shows a 🔒 so a locked boss never looks playable. */}
      {boss && (
        <span aria-hidden className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-sm drop-shadow">
          👑
        </span>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {showOpen ? (
          <motion.span
            key="open"
            className="flex flex-col items-center"
            initial={reduce || revealDelay == null ? false : { scale: 0.4, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 15 }}
          >
            <span className="font-display text-xl font-bold leading-none">{index + 1}</span>
            <span className="mt-1 flex gap-0.5 text-[0.6rem] leading-none">
              {[0, 1, 2].map((s) => (
                <span key={s} className={s < earned ? "" : "opacity-30"}>
                  {s < earned ? "⭐" : "☆"}
                </span>
              ))}
            </span>
          </motion.span>
        ) : (
          <motion.span
            key="locked"
            aria-hidden
            className="text-lg opacity-60"
            exit={reduce ? { opacity: 0 } : { scale: 1.6, opacity: 0, rotate: 25 }}
            transition={{ duration: 0.28 }}
          >
            🔒
          </motion.span>
        )}
      </AnimatePresence>

      {/* The shockwave the popping lock leaves behind. */}
      {revealDelay != null && showOpen && !reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl border-2"
          style={{ borderColor: ink.deep }}
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0, scale: 1.7 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      )}
    </motion.button>
  );
}
