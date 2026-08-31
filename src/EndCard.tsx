import { useRef, type Ref } from "react";
import gsap from "gsap";
import { EASE, motionOn, stampIn, useGsap } from "./anim";
import { fmtTime } from "./format";
import { t } from "./i18n";
import { renderShareCard, type ShareCardData } from "./sharecard";
import { trackEvent } from "./analytics";
import { playConfirm, playUi } from "./audio";

const RATING_COUNT = 5; // end.rating.0 … end.rating.4 (see src/i18n)

/**
 * The stars, awarded one at a time.
 *
 * A star doesn't appear — it's *struck*: it comes in oversized and spinning,
 * hits the card, and the card takes the blow (the whole row recoils a couple of
 * pixels under each one). The beats are 200ms apart, which is the spacing the
 * star chime is already scheduled on in `Game`, so the picture and the sound
 * land together. An unearned star just sits there, grey, from the start —
 * a hollow star arriving with a bang would be reading the result wrong.
 */
function StarRow({ stars }: { stars: number }) {
  const row = useGsap<HTMLDivElement>((scope) => {
    const earned = scope.querySelectorAll("[data-earned]");
    if (!earned.length || !motionOn()) return;
    // Hidden, not oversized, while they wait their turn: a `fromTo` writes its
    // start values as soon as it is built, so all three stars would otherwise
    // sit at 2.6× for the length of the delay — three 114px stars inside a card
    // sized for 44px ones.
    gsap.set(earned, { opacity: 0 });
    const tl = gsap.timeline({ delay: 0.35 });
    earned.forEach((star, i) => {
      tl.fromTo(
        star,
        { scale: 2.6, rotate: -140, opacity: 0 },
        { scale: 1, rotate: 0, opacity: 1, duration: 0.5, ease: EASE.stamp, immediateRender: false },
        i * 0.2
      ).to(scope, { y: 3, duration: 0.06, yoyo: true, repeat: 1, ease: "power2.out" }, i * 0.2 + 0.16);
    });
  }, [stars]);

  return (
    <div ref={row} className="flex justify-center gap-2">
      {[0, 1, 2].map((i) => {
        const earned = i < stars;
        return (
          <div
            key={i}
            data-earned={earned ? "" : undefined}
            style={{ fontSize: 44 }}
            className={earned ? "drop-shadow-stamp" : "scale-75 opacity-30 grayscale"}
          >
            {earned ? "⭐" : "☆"}
          </div>
        );
      })}
    </div>
  );
}

export function EndCard({
  ref,
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
  nextLabel,
  onShareToast,
  onExit,
  onRestart,
  onNext,
}: {
  /** Presence handle: keeps the card mounted long enough to leave. */
  ref?: Ref<HTMLDivElement>;
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
  /** Overrides "Next level →" when the next one is a boss or a new chapter. */
  nextLabel?: string;
  onShareToast: (msg: string) => void;
  onExit: () => void;
  onRestart: () => void;
  onNext?: () => void;
}) {
  const card = useRef<HTMLDivElement | null>(null);
  // The result lands on the page like everything else does.
  useGsap(() => void stampIn(card.current, { from: 0.94, tilt: 0 }), [won]);

  const newBest = won && (bestMs == null || timeMs < bestMs);
  const share = async () => {
    // Render the result image; share it with the caption when the platform
    // supports file sharing, else copy the text and save the image.
    const blob = await renderShareCard(shareData);
    const file = blob ? new File([blob], "wordgrid.png", { type: "image/png" }) : null;
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
        trackEvent("share", { won, method: "files" });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: shareText });
        trackEvent("share", { won, method: "text" });
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
    trackEvent("share", { won, method: "copy" });
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wordgrid.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      onShareToast(t("end.shared.image"));
    } else {
      onShareToast(t("end.shared.text"));
    }
  };

  return (
    <div
      ref={(node) => {
        card.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className="mt-8 rounded-3xl border-2 border-ink bg-white p-6 text-center"
    >
      {won ? (
        <>
          <StarRow stars={stars} />
          <h3 className="mt-3 font-display text-2xl font-bold text-ink">
            {t(`end.rating.${Math.min(mistakes, RATING_COUNT - 1)}`)}
          </h3>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-press">{title}</p>
          <p className="mt-2 text-sm text-ink-soft">
            {t("end.linkWas")}{" "}
            <span className="font-bold text-ink underline decoration-press/70 decoration-2 underline-offset-4">
              {pivot}
            </span>
            . {t(linkCorrect ? "end.linkGot" : "end.linkMissed")}
          </p>
          {streak >= 2 && (
            <div className="mt-1 text-sm font-semibold text-gold-deep">{t("end.streak", { n: streak })}</div>
          )}
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-1.5 text-base font-extrabold text-gold-deep">
            <span aria-hidden>✦</span> {t("end.points", { n: score.toLocaleString() })}
            {stars === 3 && <span className="text-sm font-bold text-press">{t("end.fullCombo")}</span>}
          </div>
          {endless && endlessInfo ? (
            <div className="mt-2 text-sm font-semibold text-leaf">
              {t("end.endlessSolved", { n: endlessInfo.solved })}
              {endlessInfo.solved > 0 && endlessInfo.solved >= endlessInfo.best ? (
                <span className="ms-1 text-gold-deep">{t("end.newBestRun")}</span>
              ) : (
                endlessInfo.best > 0 && <span className="ms-1 text-leaf/70">{t("end.bestRun", { n: endlessInfo.best })}</span>
              )}
            </div>
          ) : (
            <div className="mt-2 text-xs text-ink-soft">
              ⏱ {fmtTime(timeMs)}
              {newBest ? (
                <span className="ms-1 font-semibold text-leaf">{t("end.newBestTime")}</span>
              ) : (
                bestMs != null && <span className="ms-1">{t("end.bestTime", { time: fmtTime(bestMs) })}</span>
              )}
            </div>
          )}
          {daily && (
            <div className="mt-3 rounded-2xl border border-gold/70 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold-deep">
              {t("end.dailyDone")}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="text-4xl">🧩</div>
          <h3 className="mt-2 font-display text-2xl font-bold text-ink">{t("end.lost.title")}</h3>
          <p className="mt-2 text-sm text-ink-soft">{t("end.lost.body")}</p>
        </>
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => { playUi(); onExit(); }}
          className="rounded-full border border-ink/30 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream"
        >
          {t(endless ? "common.endRun" : "common.levels")}
        </button>
        <button
          onClick={() => { playUi(); (won ? share : onRestart)(); }}
          className="rounded-full border border-ink/30 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream"
        >
          {t(won ? "common.share" : "common.tryAgain")}
        </button>
        {won &&
          (onNext ? (
            <button
              onClick={() => { playConfirm(); onNext(); }}
              className="rounded-full bg-press px-6 py-2.5 text-sm font-bold text-paper shadow-stamp transition hover:scale-[1.03] active:scale-95"
            >
              {nextLabel ?? t(endless ? "end.nextPuzzle" : "end.next")}
            </button>
          ) : (
            <button
              onClick={() => { playConfirm(); onExit(); }}
              className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink shadow-stamp transition hover:scale-[1.03] active:scale-95"
            >
              {t(daily ? "end.seeYouTomorrow" : "end.allDone")}
            </button>
          ))}
      </div>
    </div>
  );
}
