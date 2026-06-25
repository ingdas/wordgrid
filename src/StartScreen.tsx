import { motion } from "framer-motion";
import { MAX_STARS, totalStars, dailyDoneToday, type Progress } from "./progress";
import { t } from "./i18n";

export default function StartScreen({
  progress,
  onPlay,
  onDaily,
  onHelp,
  muted,
  onToggleMute,
  musicOn,
  onToggleMusic,
}: {
  progress: Progress;
  onPlay: () => void;
  onDaily: () => void;
  onHelp: () => void;
  muted: boolean;
  onToggleMute: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
}) {
  const stars = totalStars(progress);
  const returning = stars > 0 || progress.bestStreak > 0;
  const dailyDone = dailyDoneToday(progress);

  return (
    <div className="relative mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-6 text-center">
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

      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-4xl text-white shadow-2xl shadow-fuchsia-500/40"
      >
        <span aria-hidden>◆</span>
      </motion.div>

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
          {returning ? t("btn.continue") : t("btn.play")}
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
        <button
          onClick={onHelp}
          className="text-sm font-semibold text-indigo-200/80 underline-offset-4 transition hover:text-white hover:underline"
        >
          {t("btn.howToPlay")}
        </button>
      </motion.div>

      {returning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-indigo-100"
        >
          <span className="font-semibold">⭐ {stars}/{MAX_STARS}</span>
          {progress.bestStreak > 0 && <span className="font-semibold">🔥 best {progress.bestStreak}</span>}
        </motion.div>
      )}
    </div>
  );
}
