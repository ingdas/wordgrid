import { motion } from "framer-motion";
import { LEVELS } from "./puzzles";
import { MAX_STARS, totalStars, dailyDoneToday, furthestCleared, playerRank, type Progress } from "./progress";
import { t } from "./i18n";

export default function StartScreen({
  progress,
  onPlay,
  onDaily,
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
  onDaily: () => void;
  onHelp: () => void;
  onStats: () => void;
  onHistory: () => void;
  onSettings: () => void;
  muted: boolean;
  onToggleMute: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
}) {
  const stars = totalStars(progress);
  const returning = stars > 0 || progress.bestStreak > 0;
  const dailyDone = dailyDoneToday(progress);
  const nextLevel = Math.min(furthestCleared(progress) + 2, LEVELS.length);
  const rank = playerRank(progress.score);

  return (
    <div className="relative mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-6 pb-12 pt-24 text-center sm:pt-28">
      <button
        onClick={onSettings}
        aria-label="Settings"
        className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-lg transition hover:bg-white/15 active:scale-95"
      >
        ⚙️
      </button>
      <div className="absolute right-4 top-4 flex gap-2">
        <button
          onClick={onToggleMusic}
          aria-label={musicOn ? "Turn music off" : "Turn music on"}
          className={`grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-lg transition hover:bg-white/15 active:scale-95 ${
            musicOn ? "" : "opacity-50"
          }`}
        >
          🎵
        </button>
        <button
          onClick={onToggleMute}
          aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-lg transition hover:bg-white/15 active:scale-95"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="relative grid place-items-center">
        {/* Soft pulsing aura behind the mark */}
        <motion.div
          aria-hidden
          className="absolute h-28 w-28 rounded-full bg-fuchsia-500/30 blur-2xl"
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
          className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-4xl text-white shadow-2xl shadow-fuchsia-500/40"
        >
          <span aria-hidden>◆</span>
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 font-display text-6xl font-bold tracking-tight text-white"
      >
        WordGrid
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-3 max-w-xs text-balance text-lg leading-relaxed text-indigo-100/90"
      >
        Four hidden groups. <span className="font-semibold text-white">One secret word</span> they all
        share. Can you find it?
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, type: "spring", stiffness: 260, damping: 20 }}
        className="mt-9 flex w-full max-w-xs flex-col items-center gap-3"
      >
        <button
          onClick={onPlay}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-400 to-fuchsia-500 py-4 text-lg font-bold text-white shadow-xl shadow-fuchsia-500/30 transition hover:scale-[1.03] active:scale-95"
        >
          {returning ? `${t("btn.continue")} · Level ${nextLevel}` : t("btn.play")}
        </button>
        <button
          onClick={onDaily}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 py-3 text-base font-bold text-indigo-50 transition hover:bg-white/10 active:scale-95"
        >
          📅 {t("btn.daily")}
          {dailyDone ? (
            <span className="text-emerald-300">✓</span>
          ) : (
            progress.daily.streak > 0 && <span className="text-amber-300">🔥 {progress.daily.streak}</span>
          )}
        </button>
        <div className="mt-1 grid w-full grid-cols-3 gap-2">
          {[
            { label: t("btn.howToPlay"), icon: "❔", onClick: onHelp },
            { label: "Achievements", icon: "🏆", onClick: onStats },
            { label: "History", icon: "📜", onClick: onHistory },
          ].map((b) => (
            <button
              key={b.label}
              onClick={b.onClick}
              className="flex flex-col items-center gap-1 rounded-2xl border border-white/12 bg-white/[0.04] py-3 text-xs font-semibold text-indigo-100 transition hover:bg-white/10 active:scale-95"
            >
              <span className="text-lg" aria-hidden>{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46 }}
        className="mt-8 w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
      >
        <div className="flex items-baseline justify-between">
          <span className="font-display text-sm font-bold text-white">
            Lv {rank.level} · <span className="text-fuchsia-300">{rank.title}</span>
          </span>
          <span className="text-[0.7rem] font-semibold text-indigo-200/70">
            {rank.into}/{rank.span} XP
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rank.pct}%` }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-indigo-100"
      >
        <span className="font-semibold">⭐ {stars}/{MAX_STARS}</span>
        <span className="font-semibold">💡 {progress.hints}</span>
        {progress.bestStreak > 0 && <span className="font-semibold">🔥 best {progress.bestStreak}</span>}
      </motion.div>
    </div>
  );
}
