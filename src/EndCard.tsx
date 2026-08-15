import { motion } from "framer-motion";
import { fmtTime } from "./format";
import { renderShareCard, type ShareCardData } from "./sharecard";

const RATINGS = ["Flawless ✨", "Brilliant!", "Great work!", "Nicely done", "Just made it!"];

function StarRow({ stars }: { stars: number }) {
  return (
    <div className="flex justify-center gap-2">
      {[0, 1, 2].map((i) => {
        const earned = i < stars;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: earned ? 1 : 0.8, rotate: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.2 + i * 0.2 }}
            style={{ fontSize: 44 }}
            className={earned ? "drop-shadow-[2px_2px_0_rgba(38,34,26,0.4)]" : "opacity-30 grayscale"}
          >
            {earned ? "⭐" : "☆"}
          </motion.div>
        );
      })}
    </div>
  );
}

export function EndCard({
  won,
  title,
  stars,
  mistakes,
  streak,
  pivot,
  linkCorrect,
  timeMs,
  bestMs,
  score,
  shareText,
  shareData,
  endless,
  endlessInfo,
  daily,
  onShareToast,
  onExit,
  onRestart,
  onNext,
}: {
  won: boolean;
  title: string;
  stars: number;
  mistakes: number;
  streak: number;
  pivot: string;
  linkCorrect: boolean;
  timeMs: number;
  bestMs?: number;
  score: number;
  shareText: string;
  shareData: ShareCardData;
  endless?: boolean;
  endlessInfo?: { solved: number; score: number; best: number };
  daily?: boolean;
  onShareToast: (msg: string) => void;
  onExit: () => void;
  onRestart: () => void;
  onNext?: () => void;
}) {
  const newBest = won && (bestMs == null || timeMs < bestMs);
  const share = async () => {
    // Render the result image; share it with the caption when the platform
    // supports file sharing, else copy the text and save the image.
    const blob = await renderShareCard(shareData);
    const file = blob ? new File([blob], "wordgrid.png", { type: "image/png" }) : null;
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: shareText });
        return;
      }
    } catch {
      /* fall through to copy/save */
    }
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      /* ignore */
    }
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wordgrid.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      onShareToast("Image saved · text copied!");
    } else {
      onShareToast("Result copied to clipboard!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="mt-8 rounded-3xl border-2 border-ink bg-white p-6 text-center"
    >
      {won ? (
        <>
          <StarRow stars={stars} />
          <h3 className="mt-3 font-display text-2xl font-bold text-ink">
            {RATINGS[Math.min(mistakes, RATINGS.length - 1)]}
          </h3>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-press">{title}</p>
          <p className="mt-2 text-sm text-ink-soft">
            The secret link was{" "}
            <span className="font-bold text-ink underline decoration-press/70 decoration-2 underline-offset-4">
              {pivot}
            </span>
            . {linkCorrect ? "🔑 You guessed it!" : "Missed the link — that cost a star."}
          </p>
          {streak >= 2 && <div className="mt-1 text-sm font-semibold text-gold-deep">🔥 {streak} in a row!</div>}
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-1.5 text-base font-extrabold text-gold-deep">
            <span aria-hidden>✦</span> {score.toLocaleString()} pts
            {stars === 3 && <span className="text-sm font-bold text-press">· full combo!</span>}
          </div>
          {endless && endlessInfo ? (
            <div className="mt-2 text-sm font-semibold text-leaf">
              🧘 {endlessInfo.solved} solved this run
              {endlessInfo.solved > 0 && endlessInfo.solved >= endlessInfo.best ? (
                <span className="ml-1 text-gold-deep">· new best!</span>
              ) : (
                endlessInfo.best > 0 && <span className="ml-1 text-leaf/70">· best {endlessInfo.best}</span>
              )}
            </div>
          ) : (
            <div className="mt-2 text-xs text-ink-soft">
              ⏱ {fmtTime(timeMs)}
              {newBest ? (
                <span className="ml-1 font-semibold text-leaf">— new best!</span>
              ) : (
                bestMs != null && <span className="ml-1">· best {fmtTime(bestMs)}</span>
              )}
            </div>
          )}
          {daily && (
            <div className="mt-3 rounded-2xl border border-gold/70 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold-deep">
              🔥 Daily done — come back tomorrow to keep your streak!
            </div>
          )}
        </>
      ) : (
        <>
          <div className="text-4xl">🧩</div>
          <h3 className="mt-2 font-display text-2xl font-bold text-ink">Out of guesses</h3>
          <p className="mt-2 text-sm text-ink-soft">
            The secret link stays hidden — replay the level and you can still crack it.
          </p>
        </>
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          onClick={onExit}
          className="rounded-full border border-ink/30 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream"
        >
          {endless ? "End run" : "Levels"}
        </button>
        <button
          onClick={won ? share : onRestart}
          className="rounded-full border border-ink/30 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream"
        >
          {won ? "Share" : "Try again"}
        </button>
        {won &&
          (onNext ? (
            <button
              onClick={onNext}
              className="rounded-full bg-press px-6 py-2.5 text-sm font-bold text-paper shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition hover:scale-[1.03] active:scale-95"
            >
              {endless ? "Next puzzle →" : "Next level →"}
            </button>
          ) : (
            <button
              onClick={onExit}
              className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition hover:scale-[1.03] active:scale-95"
            >
              {daily ? "See you tomorrow 👋" : "All done 🎉"}
            </button>
          ))}
      </div>
    </motion.div>
  );
}
