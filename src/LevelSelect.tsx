import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LEVELS, CHAPTERS, TIER_KEY, bossTwist, chapterKey, isBossLevel, levelTitle } from "./puzzles";
import { chapterInk, type ChapterInk } from "./theme";
import { playStar, playWin } from "./audio";
import { plural, t } from "./i18n";
import { LinkGuess } from "./LinkGuess";
import { shuffledLetters } from "./letters";
import {
  isUnlocked,
  isDebug,
  MAX_STARS,
  totalStars,
  newlyUnlocked,
  furthestCleared,
  bankedLetters,
  keyReady,
  keySolved,
  bossAwaitingKey,
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
  onSolveKey,
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
  onPick: (index: number) => void;
  /** Called once the page has shown what's new, so each unlock plays only once. */
  onSeen: () => void;
  /** A chapter's keyword was spelled — its boss door opens. */
  onSolveKey: (chapter: number) => void;
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

      <UnlockBanner fresh={fresh} reduce={reduce} />

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
          {isDebug() && (
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
            <div className="mt-5 rounded-3xl border-2 border-ink bg-white p-5 text-center shadow-[3px_3px_0_rgba(38,34,26,0.3)]">
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
              </section>
            );
          }

          // Two registers, so each can be laid out by its own rules.
          const indices = slice.map((_, j) => chap.start + j);
          const solved = indices.filter((i) => (progress.stars[LEVELS[i].id] ?? 0) > 0);
          const ahead = indices.filter((i) => (progress.stars[LEVELS[i].id] ?? 0) === 0);
          const bossUnbeaten = (progress.stars[LEVELS[chap.boss].id] ?? 0) === 0;
          const bossTwistOpen = bossUnbeaten && isUnlocked(progress, chap.boss) ? bossTwist(chap.boss) : null;
          const bossNeedsKey = bossUnbeaten && bossAwaitingKey(progress, chap.boss);

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

              <ChapterKeyBar
                chapter={ci}
                ink={ink}
                banked={bankedLetters(progress, ci)}
                ready={keyReady(progress, ci)}
                solved={keySolved(progress, ci)}
                onOpen={() => setKeyPanel(ci)}
              />

              {/* Solved levels are index lines: a colour-coded numeral, the
                  board's name, a leader, the stars. Both edges align, so the
                  different title lengths read as typesetting instead of as a
                  ragged row of pills. */}
              {solved.length > 0 && (
                <div className="mt-2">
                  {solved.map((i) => (
                    <LevelRow
                      key={LEVELS[i].id}
                      index={i}
                      ink={ink}
                      earned={progress.stars[LEVELS[i].id] ?? 0}
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
                        keyLocked={bossAwaitingKey(progress, i)}
                        isNext={i === nextIndex}
                        tileRef={LEVELS[i].id === lastFresh ? freshRef : undefined}
                        revealDelay={revealAt == null ? null : REVEAL_LEAD + revealAt * REVEAL_GAP}
                        onClick={() => isUnlocked(progress, i) && onPick(i)}
                      />
                    );
                  })}
                </div>
              )}

              {/* The boss's twist can't ride on a fixed-size square, so it gets
                  a caption once that boss is reachable and still unbeaten. */}
              {bossTwistOpen && (
                <p className="mt-2 px-1 text-[0.65rem] font-semibold capitalize" style={{ color: ink.deep }}>
                  {t("levels.boss.twist", { what: t(`twist.${bossTwistOpen}.short`) })}
                </p>
              )}
              {bossNeedsKey && (
                <p className="mt-2 px-1 text-[0.65rem] font-semibold" style={{ color: ink.deep }}>
                  {t("key.bossLocked")}
                </p>
              )}
            </section>
          );
        })}
        </div>
      </div>

      <AnimatePresence>
        {keyPanel != null && (
          <ChapterKeyPanel
            chapter={keyPanel}
            hints={hints}
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

/**
 * A chapter's key, on its header: one slot per level that banks a letter, a
 * button once they're all in, and the word itself as a trophy once solved.
 * Filled slots stay blank — showing the letters here would hand over the
 * anagram before the player ever opens the panel.
 */
function ChapterKeyBar({
  chapter,
  ink,
  banked,
  ready,
  solved,
  onOpen,
}: {
  chapter: number;
  ink: ChapterInk;
  banked: number;
  ready: boolean;
  solved: boolean;
  onOpen: () => void;
}) {
  const word = chapterKey(chapter);
  if (solved) {
    return (
      <p className="mt-1.5 px-1 text-[0.7rem] font-bold tracking-[0.2em]" style={{ color: ink.deep }}>
        🔑 {word}
      </p>
    );
  }
  return (
    <div className="mt-1.5 flex items-center gap-2 px-1">
      <span aria-hidden className="flex gap-1">
        {word.split("").map((_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-[3px] border"
            style={{
              borderColor: ink.deep,
              background: i < banked ? ink.fill : "transparent",
              opacity: i < banked ? 1 : 0.4,
            }}
          />
        ))}
      </span>
      {ready ? (
        <motion.button
          onClick={onOpen}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="rounded-full border-2 border-ink bg-gold px-2.5 py-0.5 text-[0.65rem] font-extrabold text-ink shadow-[2px_2px_0_rgba(38,34,26,0.4)] transition hover:brightness-105 active:scale-95"
        >
          {t("key.open")}
        </motion.button>
      ) : (
        <span className="text-[0.65rem] font-semibold text-ink-soft">
          {t("key.progress", { done: banked, total: word.length })}
        </span>
      )}
    </div>
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
  onUseHint,
  onRefillHints,
  onSolved,
  onClose,
}: {
  chapter: number;
  hints: number;
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
    setTimeout(onClose, 1900);
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
        className="w-full max-w-md rounded-3xl border-2 border-ink bg-paper px-5 pb-5 pt-4 shadow-[4px_4px_0_rgba(38,34,26,0.5)]"
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
          oracle={false}
          bank={bank}
          titleKey="key.title"
          bodyKey="key.body"
          dismissKey={resolved ? "common.done" : "common.close"}
          onMiss={onClose}
          resolved={resolved}
          pivot={word}
          revealedLetters={revealed}
          hintBank={hints}
          canRevealLetter={hints > 0 && revealed < word.length - 1}
          onRevealLetter={() => {
            if (hints <= 0) return;
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
      className="mt-5 overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-[3px_3px_0_rgba(38,34,26,0.35)]"
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
          </div>
          <button
            onClick={onPlay}
            className="shrink-0 rounded-full bg-press px-7 py-2.5 text-sm font-bold text-paper shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition hover:scale-[1.03] active:scale-95 lg:mt-4 lg:w-full lg:py-3.5 lg:text-base lg:shadow-[4px_4px_0_rgba(38,34,26,0.8)]"
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
          className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[min(28rem,calc(100%-2rem))] cursor-pointer items-center gap-3 rounded-2xl border-2 border-ink bg-gold/95 px-4 py-2.5 shadow-[3px_3px_0_rgba(38,34,26,0.55)] lg:left-[max(1rem,calc((100vw-64rem)/2+1rem))] lg:right-auto lg:mx-0 lg:w-[21rem]"
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
/**
 * A solved level, as a line in a contents page: a colour-coded numeral, the
 * board's name, a leader, the stars. The numerals form one aligned column and
 * the stars another, so titles of different lengths sit between fixed edges
 * instead of ragging out into the gutter.
 */
function LevelRow({
  index,
  ink,
  earned,
  onClick,
}: {
  index: number;
  ink: ChapterInk;
  earned: number;
  onClick: () => void;
}) {
  const boss = isBossLevel(index);
  return (
    <button
      onClick={onClick}
      aria-label={
        t("levels.a11y.solved", { n: index + 1, title: levelTitle(index) }) +
        (boss ? t("levels.a11y.boss") : "") +
        `, ${t(TIER_KEY[LEVELS[index].tier])}` +
        t("levels.a11y.stars", { n: earned })
      }
      className="flex w-full items-center gap-2.5 rounded-lg px-1 py-[3px] text-left transition hover:bg-cream"
    >
      <span
        aria-hidden
        className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-ink/25 font-display text-[0.7rem] font-bold tabular-nums text-ink"
        style={{ background: ink.fill }}
      >
        {index + 1}
      </span>
      {/* The crown trails the title rather than leading it, so every row's
          title starts at the same x. */}
      <span className="shrink-0 font-display text-sm font-bold text-ink">{levelTitle(index)}</span>
      {boss && <span aria-hidden className="-ml-1 text-[0.7rem] leading-none">👑</span>}
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
  keyLocked,
  isNext,
  tileRef,
  revealDelay,
  onClick,
}: {
  index: number;
  ink: ChapterInk;
  reduce: boolean;
  unlocked: boolean;
  /** Shut by its chapter key rather than by the progress window. */
  keyLocked: boolean;
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
  const boss = isBossLevel(index);
  const style: React.CSSProperties = {};
  if (keyLocked) style.borderColor = ink.deep;
  let face = "border-dashed border-ink/25 bg-cream/60";
  if (!showOpen && keyLocked) face = "border-dashed bg-gold/15";
  if (showOpen) {
    face = "border-ink bg-white shadow-[2px_2px_0_rgba(38,34,26,0.3)]";
    style.color = ink.deep;
    if (boss) style.borderColor = ink.deep;
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
        (boss ? t("levels.a11y.boss") : "") +
        `, ${t(TIER_KEY[LEVELS[index].tier])}` +
        (showOpen ? "" : t(keyLocked ? "key.a11y.locked" : "levels.a11y.lockedNode")) +
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
      {boss && (
        <span aria-hidden className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm drop-shadow">
          👑
        </span>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {showOpen ? (
          <motion.span
            key="open"
            className="text-base font-bold leading-none"
            initial={reduce || revealDelay == null ? false : { scale: 0.4, rotate: -12 }}
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
            exit={reduce ? { opacity: 0 } : { scale: 1.6, opacity: 0, rotate: 25 }}
            transition={{ duration: 0.28 }}
          >
            {keyLocked ? "🔑" : "🔒"}
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
