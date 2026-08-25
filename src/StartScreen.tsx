import { useEffect, useState } from "react";
import gsap from "gsap";
import { EASE, motionOn, pressDown, release, useGsap } from "./anim";
import { LEVELS } from "./puzzles";
import {
  MAX_STARS,
  totalStars,
  dailyDoneToday,
  dailyWeek,
  liveDailyStreak,
  msUntilNextDaily,
  furthestCleared,
  endlessUnlocked,
  type Progress,
} from "./progress";
import { todayKey } from "./progress";
import {
  todaysQuests,
  questsFor,
  questProgress,
  questDone,
  QUEST_SET_BONUS,
  SET_ID,
} from "./quests";
import { getLocale, t } from "./i18n";
import { playConfirm, playUi } from "./audio";

function fmtCountdown(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export default function StartScreen({
  progress,
  onPlay,
  onLevels,
  onDaily,
  onEndless,
  onHelp,
  onStats,
  onHistory,
  onSettings,
  muted,
  onToggleMute,
  musicOn,
  onToggleMusic,
}: {
  progress: Progress;
  onPlay: () => void;
  onLevels: () => void;
  onDaily: () => void;
  onEndless: () => void;
  onHelp: () => void;
  onStats: () => void;
  onHistory: () => void;
  onSettings: () => void;
  muted: boolean;
  onToggleMute: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const stars = totalStars(progress);
  const returning = stars > 0 || progress.bestStreak > 0;
  const dailyDone = dailyDoneToday(progress);
  const nextLevel = Math.min(furthestCleared(progress) + 2, LEVELS.length);
  const questDate = todayKey(now);
  const quests = questsFor(progress.quests, questDate);
  const questList = todaysQuests(questDate);
  const week = dailyWeek(progress, now);
  // A streak only counts while it's still alive (cleared today or yesterday).
  const streakNow = liveDailyStreak(progress, now);
  const countdown = fmtCountdown(msUntilNextDaily(now));
  // Endless is the campaign's payoff, so it shows as a locked door until every
  // level is cleared rather than disappearing — you can see what's coming.
  const endlessOpen = endlessUnlocked(progress);
  const endlessStat = !endlessOpen
    ? t("home.mode.endless.locked")
    : progress.endlessBest > 0
      ? t("home.mode.endless.best", { n: progress.endlessBest })
      : t("home.mode.endless.empty");
  const dateLabel = now.toLocaleDateString(getLocale(), { weekday: "short", month: "short", day: "numeric" });

  /**
   * The home screen introducing itself.
   *
   * The mark is the press's own stamp, so it arrives the way a stamp does —
   * oversized, turned, and brought down hard — and everything else rises in
   * behind it on one stagger rather than four hand-tuned delays scattered
   * across four components. Once it has landed the mark keeps breathing, which
   * is the only thing on this screen that moves while you read it.
   */
  const stage = useGsap<HTMLDivElement>((scope) => {
    if (!motionOn()) return;
    const mark = scope.querySelector("[data-mark]");
    const aura = scope.querySelector("[data-aura]");
    const rest = scope.querySelectorAll("[data-enter]");
    const tl = gsap.timeline();
    if (mark) {
      tl.fromTo(
        mark,
        { scale: 2.4, rotate: -34, opacity: 0 },
        { scale: 1, rotate: 0, opacity: 1, duration: 0.62, ease: EASE.stamp }
      );
      tl.to(mark, { y: -6, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 }, ">");
    }
    if (aura) {
      tl.fromTo(aura, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 0.5, duration: 0.5, ease: "power2.out" }, 0.16);
      tl.to(aura, { scale: 1.25, opacity: 0.8, duration: 2, ease: "sine.inOut", yoyo: true, repeat: -1 }, 0.7);
    }
    if (rest.length) {
      tl.fromTo(
        rest,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.09, clearProps: "transform,opacity" },
        0.22
      );
    }
  }, []);

  // Portrait keeps a single centred column. On a landscape embed (the 1280×720
  // iframe CrazyGames serves most desktop players) it splits: the masthead and
  // progress on the left, everything you can press on the right, so nothing
  // falls below the fold. DOM order stays mobile-correct; the columns are
  // placed explicitly.
  return (
    <div
      ref={stage}
      className="relative mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-6 pb-10 pt-12 text-center sm:pt-20 lg:grid lg:min-h-screen lg:max-w-4xl lg:grid-cols-2 lg:content-center lg:items-center lg:gap-x-12 lg:pt-12"
    >
      <button
        onClick={() => { playUi(); onSettings(); }}
        aria-label={t("a11y.settings")}
        className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-white text-lg transition hover:bg-cream active:scale-95"
      >
        ⚙️
      </button>
      <div className="absolute right-4 top-4 flex gap-2">
        <button
          onClick={onToggleMusic}
          aria-label={t(musicOn ? "a11y.musicOff" : "a11y.musicOn")}
          className={`grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-white text-lg transition hover:bg-cream active:scale-95 ${
            musicOn ? "" : "opacity-50"
          }`}
        >
          🎵
        </button>
        <button
          onClick={onToggleMute}
          aria-label={t(muted ? "a11y.unmute" : "a11y.mute")}
          className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-white text-lg transition hover:bg-cream active:scale-95"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="flex flex-col items-center lg:col-start-1 lg:row-start-1">
      <div className="relative grid place-items-center">
        {/* Soft pulsing aura behind the mark */}
        <div data-aura aria-hidden className="absolute h-28 w-28 rounded-full bg-press/15 blur-2xl" />
        <div
          data-mark
          className="relative grid h-14 w-14 place-items-center rounded-3xl bg-press text-3xl text-paper shadow-stamp-lg sm:h-20 sm:w-20 sm:text-4xl"
        >
          <span aria-hidden>◆</span>
        </div>
      </div>

      <h1 data-enter className="mt-4 font-display text-5xl font-bold tracking-tight text-ink sm:mt-6 sm:text-6xl">
        {t("app.name")}
      </h1>

      <p
        data-enter
        className="mt-2 max-w-xs text-balance text-base leading-relaxed text-ink-soft sm:mt-3 sm:text-lg"
      >
        {t("home.taglineBefore")}{" "}
        <span className="font-semibold text-press">{t("home.taglineHighlight")}</span>{" "}
        {t("home.taglineAfter")}
      </p>
      </div>

      <div
        data-enter
        className="mt-6 flex w-full max-w-sm flex-col items-center gap-3 sm:mt-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0"
      >
        {/* Daily Challenge — the hero. A shared puzzle each day with a streak. */}
        <button
          onClick={() => { playConfirm(); onDaily(); }}
          onPointerDown={(e) => pressDown(e.currentTarget)}
          onPointerUp={(e) => release(e.currentTarget)}
          onPointerLeave={(e) => release(e.currentTarget)}
          className="w-full overflow-hidden rounded-3xl border border-ink/20 bg-white p-4 text-left shadow-stamp transition hover:border-press/60"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-display text-base font-bold text-ink">
              <span aria-hidden>📅</span> {t("home.daily")}
            </span>
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">{dateLabel}</span>
          </div>

          <div className="mt-3 flex justify-between gap-1">
            {week.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[0.55rem] font-bold uppercase text-ink-soft">
                  {d.date.toLocaleDateString(getLocale(), { weekday: "narrow" })}
                </span>
                <span
                  className={`grid h-7 w-full place-items-center rounded-lg text-xs ${
                    d.done
                      ? "bg-gold"
                      : d.today
                        ? "border border-press/80 bg-press/10"
                        : "border border-ink/20 bg-white"
                  }`}
                >
                  {d.done ? "🔥" : d.today ? <span className="text-press">●</span> : ""}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            {dailyDone ? (
              <>
                <span className="text-sm font-bold text-leaf">
                  {t("home.daily.solved")} {streakNow > 0 && `🔥 ${streakNow}`}
                </span>
                <span className="text-xs font-semibold text-ink-soft">{t("home.daily.nextIn", { time: countdown })}</span>
              </>
            ) : (
              <>
                <span className="text-sm font-semibold text-ink">
                  {streakNow > 0 ? t("home.daily.streak", { n: streakNow }) : t("home.daily.start")}
                </span>
                <span className="rounded-full bg-press px-4 py-1.5 text-sm font-bold text-paper">{t("home.daily.solve")}</span>
              </>
            )}
          </div>
        </button>

        <button
          onClick={() => { playConfirm(); onPlay(); }}
          className="w-full rounded-2xl bg-press py-3.5 text-sm font-bold text-paper shadow-stamp transition hover:scale-[1.03] active:scale-95"
        >
          {returning ? t("home.continue", { n: nextLevel }) : t("home.play")}
        </button>
        <button
          onClick={() => { playUi(); onLevels(); }}
          className="-mt-1 text-xs font-semibold text-ink-soft underline-offset-4 transition hover:text-ink hover:underline"
        >
          {t("home.browseLevels", { n: LEVELS.length })}
        </button>
        {/* The one side mode, on its own row: the door reads as a door when
            it is not one tile among three. */}
        <button
          onClick={endlessOpen ? () => { playConfirm(); onEndless(); } : undefined}
          disabled={!endlessOpen}
          aria-label={endlessOpen ? undefined : `${t("home.mode.endless")}, ${t("levels.locked")}`}
          className={`flex w-full items-center justify-between rounded-2xl border border-ink/30 bg-white px-4 py-2.5 text-sm font-bold text-ink transition ${
            endlessOpen ? "hover:bg-cream active:scale-95" : "cursor-not-allowed opacity-60"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden>{endlessOpen ? "🧘" : "🔒"}</span> {t("home.mode.endless")}
          </span>
          <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-ink-soft">{endlessStat}</span>
        </button>

        <div className="mt-1 grid w-full grid-cols-3 gap-2">
          {[
            { label: t("home.howToPlay"), icon: "❔", onClick: onHelp },
            { label: t("home.achievements"), icon: "🏆", onClick: onStats },
            { label: t("home.history"), icon: "📜", onClick: onHistory },
          ].map((b) => (
            <button
              key={b.label}
              onClick={() => { playUi(); b.onClick(); }}
              className="flex flex-col items-center gap-1 rounded-2xl border-2 border-ink bg-white py-3 text-xs font-semibold text-ink transition hover:bg-cream active:scale-95"
            >
              <span className="text-lg" aria-hidden>{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col items-center lg:col-start-1 lg:row-start-2">
      {/* Three goals that expire at midnight. Everything else the game counts
          (stars, tiers, lifetime score) accumulates forever and so says nothing
          about today; these are the reason to come back. */}
      <div data-enter className="mt-8 w-full max-w-xs rounded-2xl border border-ink/20 bg-white px-4 py-3 lg:mt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-sm font-bold text-ink">{t("quest.title")}</span>
          <span className="text-[0.7rem] font-semibold text-ink-soft">
            {t("quest.count", { done: questList.filter((d) => questDone(quests, d)).length, total: questList.length })}
          </span>
        </div>
        <ul className="mt-2 space-y-1.5">
          {questList.map((def) => {
            const done = questDone(quests, def);
            const at = questProgress(quests, def);
            return (
              <li key={def.id} className="flex items-center gap-2">
                <span className={`text-sm ${done ? "" : "opacity-45"}`} aria-hidden>
                  {def.icon}
                </span>
                <span className={`flex-1 text-left text-[0.72rem] font-semibold leading-tight ${done ? "text-ink-soft line-through" : "text-ink"}`}>
                  {t(def.titleKey, { n: def.goal })}
                </span>
                <span className={`shrink-0 text-[0.7rem] font-bold ${done ? "text-leaf" : "text-ink-soft"}`}>
                  {done ? "✓" : def.goal > 1 ? `${at}/${def.goal}` : "💡"}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 border-t border-dashed border-ink/15 pt-1.5 text-left text-[0.65rem] font-semibold text-ink-soft">
          {quests.claimed.includes(SET_ID) ? t("quest.set.done") : t("quest.set.hint", { n: QUEST_SET_BONUS })}
        </div>
      </div>

      <div
        data-enter
        className="mt-3 flex items-center gap-4 rounded-full border border-ink/20 bg-white px-5 py-2 text-sm text-ink"
      >
        <span className="font-semibold">⭐ {stars}/{MAX_STARS}</span>
        <span className="font-semibold">💡 {progress.hints}</span>
        {progress.bestStreak > 0 && <span className="font-semibold">🔥 best {progress.bestStreak}</span>}
      </div>
      </div>
    </div>
  );
}
