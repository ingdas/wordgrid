import { motion } from "framer-motion";
import { LEVELS, TIER_LABELS, type Tier } from "./puzzles";
import { isUnlocked, MAX_STARS, totalStars, type Progress } from "./progress";

const TIER_DOT: Record<Tier, string> = {
  1: "bg-emerald-400",
  2: "bg-amber-400",
  3: "bg-rose-400",
};

export default function LevelSelect({
  progress,
  onPick,
  onHome,
  onHelp,
  onStats,
  muted,
  onToggleMute,
  musicOn,
  onToggleMusic,
}: {
  progress: Progress;
  onPick: (index: number) => void;
  onHome: () => void;
  onHelp: () => void;
  onStats: () => void;
  muted: boolean;
  onToggleMute: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
}) {
  const stars = totalStars(progress);
  const nextIndex = LEVELS.findIndex((p, i) => isUnlocked(progress, i) && !(progress.stars[p.id] > 0));

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-16 pt-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onHome}
          aria-label="Home"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-base text-indigo-100 transition hover:bg-white/15 active:scale-95"
        >
          ‹
        </button>
        <button
          onClick={onStats}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold text-indigo-100 transition hover:bg-white/15"
        >
          <span>⭐ {stars}/{MAX_STARS}</span>
          {progress.streak >= 2 && <span className="text-amber-300">🔥 {progress.streak}</span>}
        </button>
        <div className="flex gap-2">
          <button
            onClick={onToggleMusic}
            aria-label={musicOn ? "Turn music off" : "Turn music on"}
            className={`grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-base transition hover:bg-white/15 active:scale-95 ${
              musicOn ? "" : "opacity-50"
            }`}
          >
            🎵
          </button>
          <button
            onClick={onToggleMute}
            aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-base transition hover:bg-white/15 active:scale-95"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={onHelp}
            aria-label="How to play"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-base font-semibold text-indigo-100 transition hover:bg-white/15 active:scale-95"
          >
            ?
          </button>
        </div>
      </div>

      <h2 className="mt-6 text-center font-display text-3xl font-bold tracking-tight text-white">
        Choose a level
      </h2>
      <p className="mt-1 text-center text-sm text-indigo-200/70">
        Levels ramp up in difficulty. Fewer mistakes earn more stars.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {LEVELS.map((p, i) => {
          const unlocked = isUnlocked(progress, i);
          const earned = progress.stars[p.id] ?? 0;
          return (
            <LevelNode
              key={p.id}
              index={i}
              tier={p.tier}
              unlocked={unlocked}
              earned={earned}
              highlight={i === nextIndex}
              onClick={() => unlocked && onPick(i)}
            />
          );
        })}
      </div>
    </div>
  );
}

function LevelNode({
  index,
  tier,
  unlocked,
  earned,
  highlight,
  onClick,
}: {
  index: number;
  tier: Tier;
  unlocked: boolean;
  earned: number;
  highlight: boolean;
  onClick: () => void;
}) {
  const done = earned > 0;

  let face = "border border-white/10 bg-white/[0.05] text-indigo-100";
  if (done) face = "border-transparent bg-gradient-to-br from-amber-300 to-orange-400 text-orange-950";
  else if (unlocked) face = "border-transparent bg-white text-slate-900";

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.012, 0.4), type: "spring", stiffness: 320, damping: 24 }}
      whileTap={unlocked ? { scale: 0.92 } : undefined}
      onClick={onClick}
      disabled={!unlocked}
      aria-label={`Level ${index + 1}, ${TIER_LABELS[tier]}${
        done ? `, ${earned} of 3 stars` : unlocked ? "" : ", locked"
      }`}
      className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl p-1 shadow-lg transition disabled:cursor-default ${face}`}
    >
      {highlight && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-2xl ring-2 ring-fuchsia-300"
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.04, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
      {unlocked ? (
        <>
          <span className="font-display text-2xl font-bold leading-none">{index + 1}</span>
          <span className="mt-1 flex gap-0.5 text-[0.65rem] leading-none">
            {[0, 1, 2].map((s) => (
              <span key={s} className={s < earned ? "" : "opacity-30"}>
                {s < earned ? "⭐" : "☆"}
              </span>
            ))}
          </span>
          {!done && (
            <span
              className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${TIER_DOT[tier]}`}
              aria-hidden
            />
          )}
        </>
      ) : (
        <span className="text-xl opacity-60" aria-hidden>
          🔒
        </span>
      )}
    </motion.button>
  );
}
