import { motion } from "framer-motion";
import { LEVELS, CHAPTERS, TIER_LABELS, type Tier } from "./puzzles";
import { isUnlocked, isDebug, MAX_STARS, totalStars, type Progress } from "./progress";

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
          className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white text-base text-ink transition hover:bg-cream active:scale-95"
        >
          ‹
        </button>
        <button
          onClick={onStats}
          aria-label="Stats and achievements"
          className="flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-1.5 text-sm font-semibold text-ink shadow transition hover:bg-cream active:scale-95"
        >
          <span>⭐ {stars}/{MAX_STARS}</span>
          {progress.streak >= 2 && <span className="text-gold-deep">🔥 {progress.streak}</span>}
          <span aria-hidden className="text-ink-soft">›</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={onToggleMusic}
            aria-label={musicOn ? "Turn music off" : "Turn music on"}
            className={`grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white text-base transition hover:bg-cream active:scale-95 ${
              musicOn ? "" : "opacity-50"
            }`}
          >
            🎵
          </button>
          <button
            onClick={onToggleMute}
            aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white text-base transition hover:bg-cream active:scale-95"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={onHelp}
            aria-label="How to play"
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white text-base font-semibold text-ink transition hover:bg-cream active:scale-95"
          >
            ?
          </button>
        </div>
      </div>

      <h2 className="mt-6 text-center font-display text-3xl font-bold tracking-tight text-ink">
        Your journey
      </h2>
      {isDebug() && (
        <p className="mt-1 text-center text-[0.7rem] font-bold uppercase tracking-widest text-leaf">
          🛠 Debug · all levels unlocked
        </p>
      )}

      <div className="mt-5 space-y-7">
        {CHAPTERS.map((chap, ci) => {
          const slice = LEVELS.slice(chap.start, chap.end);
          const chapStars = slice.reduce((n, p) => n + (progress.stars[p.id] ?? 0), 0);
          const chapDone = slice.every((p) => (progress.stars[p.id] ?? 0) > 0);
          const chapUnlocked = isUnlocked(progress, chap.start);
          return (
            <section key={ci}>
              <div className="flex items-end justify-between px-1">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                    <span className="text-ink-soft">{ci + 1}.</span>
                    {chapUnlocked ? chap.name : "Locked"}
                    {chapDone && <span aria-hidden>✓</span>}
                  </h3>
                  <p className="truncate text-xs text-ink-soft">
                    {chapUnlocked ? chap.flavor : "Clear the previous chapter to unlock."}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-gold-deep">
                  ⭐ {chapStars}/{slice.length * 3}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-3">
                {slice.map((p, j) => {
                  const i = chap.start + j;
                  return (
                    <LevelNode
                      key={p.id}
                      index={i}
                      tier={p.tier}
                      unlocked={isUnlocked(progress, i)}
                      earned={progress.stars[p.id] ?? 0}
                      highlight={i === nextIndex}
                      boss={i === chap.boss}
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

function LevelNode({
  index,
  tier,
  unlocked,
  earned,
  highlight,
  boss,
  onClick,
}: {
  index: number;
  tier: Tier;
  unlocked: boolean;
  earned: number;
  highlight: boolean;
  boss: boolean;
  onClick: () => void;
}) {
  const done = earned > 0;

  let face = "border-2 border-dashed border-ink/25 bg-cream/70 text-ink";
  if (done) face = "border-2 border-ink bg-gold text-ink";
  else if (unlocked && boss) face = "border-2 border-ink bg-press text-paper";
  else if (unlocked) face = "border-2 border-ink bg-white text-ink";

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.01, 0.3), type: "spring", stiffness: 320, damping: 24 }}
      whileTap={unlocked ? { scale: 0.92 } : undefined}
      onClick={onClick}
      disabled={!unlocked}
      aria-label={`Level ${index + 1}${boss ? ", boss" : ""}, ${TIER_LABELS[tier]}${
        done ? `, ${earned} of 3 stars` : unlocked ? "" : ", locked"
      }`}
      className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl p-1 shadow-[3px_3px_0_rgba(38,34,26,0.3)] transition disabled:cursor-default ${face}`}
    >
      {highlight && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-2xl ring-2 ring-press"
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
      {/* The crown teases a boss on every boss node — even locked ones — while
          the node face still shows a 🔒 so a locked boss never looks playable. */}
      {boss && (
        <span aria-hidden className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-sm drop-shadow">
          👑
        </span>
      )}
      {unlocked ? (
        <>
          <span className="font-display text-xl font-bold leading-none">{index + 1}</span>
          <span className="mt-1 flex gap-0.5 text-[0.6rem] leading-none">
            {[0, 1, 2].map((s) => (
              <span key={s} className={s < earned ? "" : "opacity-30"}>
                {s < earned ? "⭐" : "☆"}
              </span>
            ))}
          </span>
        </>
      ) : (
        <span className="text-lg opacity-60" aria-hidden>
          🔒
        </span>
      )}
    </motion.button>
  );
}
