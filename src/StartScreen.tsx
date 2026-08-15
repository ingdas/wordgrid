import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LEVELS } from "./puzzles";
import { DEDUCTION_LEVELS } from "./deductionLevels";
import {
  MAX_STARS,
  totalStars,
  dailyDoneToday,
  dailyWeek,
  liveDailyStreak,
  msUntilNextDaily,
  furthestCleared,
  playerRank,
  type Progress,
} from "./progress";
import { t } from "./i18n";

const DEDUCTION_COUNT = DEDUCTION_LEVELS.length;

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
  onPairs,
  onDeduction,
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
  onPairs: () => void;
  onDeduction: () => void;
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
  const rank = playerRank(progress.score);
  const week = dailyWeek(progress, now);
  // A streak only counts while it's still alive (cleared today or yesterday).
  const streakNow = liveDailyStreak(progress, now);
  const countdown = fmtCountdown(msUntilNextDaily(now));
  const dateLabel = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  // Portrait keeps a single centred column. On a landscape embed (the 1280×720
  // iframe CrazyGames serves most desktop players) it splits: the masthead and
  // progress on the left, everything you can press on the right, so nothing
  // falls below the fold. DOM order stays mobile-correct; the columns are
  // placed explicitly.
  return (
    <div className="relative mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-6 pb-10 pt-12 text-center sm:pt-20 lg:grid lg:min-h-screen lg:max-w-4xl lg:grid-cols-2 lg:content-center lg:items-center lg:gap-x-12 lg:pt-12">
      <button
        onClick={onSettings}
        aria-label="Settings"
        className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-white text-lg transition hover:bg-cream active:scale-95"
      >
        ⚙️
      </button>
      <div className="absolute right-4 top-4 flex gap-2">
        <button
          onClick={onToggleMusic}
          aria-label={musicOn ? "Turn music off" : "Turn music on"}
          className={`grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-white text-lg transition hover:bg-cream active:scale-95 ${
            musicOn ? "" : "opacity-50"
          }`}
        >
          🎵
        </button>
        <button
          onClick={onToggleMute}
          aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
          className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-white text-lg transition hover:bg-cream active:scale-95"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="flex flex-col items-center lg:col-start-1 lg:row-start-1">
      <div className="relative grid place-items-center">
        {/* Soft pulsing aura behind the mark */}
        <motion.div
          aria-hidden
          className="absolute h-28 w-28 rounded-full bg-press/15 blur-2xl"
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0, y: [0, -6, 0] }}
          transition={{
            scale: { type: "spring", stiffness: 200, damping: 14 },
            rotate: { type: "spring", stiffness: 200, damping: 14 },
            y: { duration: 3.4, repeat: Infinity, ease: "easeInOut" },
          }}
          className="relative grid h-14 w-14 place-items-center rounded-3xl bg-press text-3xl text-paper shadow-[4px_4px_0_rgba(38,34,26,0.85)] sm:h-20 sm:w-20 sm:text-4xl"
        >
          <span aria-hidden>◆</span>
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 font-display text-5xl font-bold tracking-tight text-ink sm:mt-6 sm:text-6xl"
      >
        WordGrid
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-2 max-w-xs text-balance text-base leading-relaxed text-ink-soft sm:mt-3 sm:text-lg"
      >
        Four hidden groups. <span className="font-semibold text-press">One secret word</span> they all
        share. Can you find it?
      </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, type: "spring", stiffness: 260, damping: 20 }}
        className="mt-6 flex w-full max-w-sm flex-col items-center gap-3 sm:mt-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0"
      >
        {/* Daily Challenge — the hero. A shared puzzle each day with a streak. */}
        <motion.button
          onClick={onDaily}
          whileTap={{ scale: 0.98 }}
          className="w-full overflow-hidden rounded-3xl border border-ink/20 bg-white p-4 text-left shadow-[3px_3px_0_rgba(38,34,26,0.25)] transition hover:border-press/60"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-display text-base font-bold text-ink">
              <span aria-hidden>📅</span> Daily Challenge
            </span>
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">{dateLabel}</span>
          </div>

          <div className="mt-3 flex justify-between gap-1">
            {week.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[0.55rem] font-bold uppercase text-ink-soft">{d.label}</span>
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
                  ✓ Solved! {streakNow > 0 && `🔥 ${streakNow}`}
                </span>
                <span className="text-xs font-semibold text-ink-soft">Next in {countdown}</span>
              </>
            ) : (
              <>
                <span className="text-sm font-semibold text-ink">
                  {streakNow > 0 ? `🔥 ${streakNow}-day streak` : "Start your streak"}
                </span>
                <span className="rounded-full bg-press px-4 py-1.5 text-sm font-bold text-paper">Solve →</span>
              </>
            )}
          </div>
        </motion.button>

        <button
          onClick={onPlay}
          className="w-full rounded-2xl bg-press py-3.5 text-sm font-bold text-paper shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition hover:scale-[1.03] active:scale-95"
        >
          {returning ? `Continue · L${nextLevel}` : t("btn.play")}
        </button>
        <button
          onClick={onLevels}
          className="-mt-1 text-xs font-semibold text-ink-soft underline-offset-4 transition hover:text-ink hover:underline"
        >
          🗺 Browse all {LEVELS.length} levels
        </button>
        <div className="grid w-full grid-cols-3 gap-2">
          {[
            { icon: "🧘", label: "Endless", stat: progress.endlessBest > 0 ? `best ${progress.endlessBest}` : "no fail", onClick: onEndless },
            { icon: "🃏", label: "Pairs", stat: progress.pairsBest > 0 ? `${progress.pairsBest} moves` : "memory", onClick: onPairs },
            { icon: "🧩", label: "Logic", stat: `${progress.deductionSolved.length}/${DEDUCTION_COUNT} solved`, onClick: onDeduction },
          ].map((m) => (
            <button
              key={m.label}
              onClick={m.onClick}
              className="flex flex-col items-center justify-center gap-0.5 rounded-2xl border border-ink/30 bg-white py-2.5 text-sm font-bold text-ink transition hover:bg-cream active:scale-95"
            >
              <span className="flex items-center gap-1.5">
                <span aria-hidden>{m.icon}</span> {m.label}
              </span>
              <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-ink-soft">{m.stat}</span>
            </button>
          ))}
        </div>

        <div className="mt-1 grid w-full grid-cols-3 gap-2">
          {[
            { label: t("btn.howToPlay"), icon: "❔", onClick: onHelp },
            { label: "Achievements", icon: "🏆", onClick: onStats },
            { label: "History", icon: "📜", onClick: onHistory },
          ].map((b) => (
            <button
              key={b.label}
              onClick={b.onClick}
              className="flex flex-col items-center gap-1 rounded-2xl border-2 border-ink bg-white py-3 text-xs font-semibold text-ink transition hover:bg-cream active:scale-95"
            >
              <span className="text-lg" aria-hidden>{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex w-full flex-col items-center lg:col-start-1 lg:row-start-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46 }}
        className="mt-8 w-full max-w-xs rounded-2xl border border-ink/20 bg-white px-4 py-3 lg:mt-6"
      >
        <div className="flex items-baseline justify-between">
          <span className="font-display text-sm font-bold text-ink">
            Lv {rank.level} · <span className="text-press">{rank.title}</span>
          </span>
          <span className="text-[0.7rem] font-semibold text-ink-soft">
            {rank.into}/{rank.span} XP
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rank.pct}%` }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="h-full rounded-full bg-press"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 flex items-center gap-4 rounded-full border border-ink/20 bg-white px-5 py-2 text-sm text-ink"
      >
        <span className="font-semibold">⭐ {stars}/{MAX_STARS}</span>
        <span className="font-semibold">💡 {progress.hints}</span>
        {progress.bestStreak > 0 && <span className="font-semibold">🔥 best {progress.bestStreak}</span>}
      </motion.div>
      </div>
    </div>
  );
}
