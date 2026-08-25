import { useEffect, useRef, useState, type Ref } from "react";
import gsap from "gsap";
import { openingIn, useGsap } from "./anim";
import { initAudio, playWhoosh, startMusic } from "./audio";
import { CATEGORY_THEMES } from "./theme";
import { t } from "./i18n";

/**
 * The opening — the press run that plays once per visit, before the first
 * screen. The timeline itself is `openingIn` in src/anim.ts; this owns the
 * plate it runs on, and the way past it.
 *
 * Any tap or key fast-forwards the run rather than cutting it: the rest of the
 * sequence plays out in under half a second, so the plate still lifts off a
 * finished page. That tap is also the visit's first gesture, which is what the
 * audio needs to start — so the menu's bed is playing by the time the screen
 * under the plate is stamped in, instead of on the second thing you touch.
 *
 * `App` keeps this mounted through its lift-off with `usePresence`, and mounts
 * the screen underneath the moment `onDone` fires, so the two overlap by the
 * length of the lift and nothing is ever blank.
 */
export function Intro({ ref, onDone }: { ref?: Ref<HTMLDivElement>; onDone: () => void }) {
  const tl = useRef<gsap.core.Timeline | null>(null);
  const forward = useRef<gsap.core.Tween | null>(null);
  const finished = useRef(false);
  // Stamped on the plate for the playtest, which reads how long the run took.
  const [startedAt] = useState(() => Math.round(performance.now()));

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onDone();
  };

  const scope = useGsap<HTMLDivElement>((el) => {
    tl.current = openingIn(el, { onDone: finish });
  }, []);

  const skip = () => {
    const run = tl.current;
    if (!run || finished.current || forward.current) return;
    // A gesture: the one thing the audio has been waiting for.
    initAudio();
    startMusic();
    playWhoosh();
    run.pause();
    forward.current = gsap.to(run, { progress: 1, duration: 0.4, ease: "power2.in", onComplete: finish });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.altKey || e.ctrlKey || e.metaKey) return;
      skip();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      forward.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={(el) => {
        scope.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      data-intro={startedAt}
      role="presentation"
      onPointerDown={skip}
      className="fixed inset-0 z-[70] grid select-none place-items-center overflow-hidden bg-paper"
    >
      <div className="intro-grain" aria-hidden />

      <div className="relative flex w-full max-w-md flex-col items-center px-6 text-center">
        {/* The stage: the tiles are dealt across it and pulled into its centre,
            which is exactly where the mark then comes down. Both are centred in
            the same box so the meeting point needs no arithmetic at render time. */}
        <div data-open-stage className="relative grid h-24 w-full place-items-center">
          <div className="absolute flex gap-3" aria-hidden>
            {CATEGORY_THEMES.map((th, i) => (
              <span
                key={i}
                data-open-tile
                className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${th.grad} shadow-stamp-sm`}
              >
                {/* A word with no letters yet: a blank the tile is holding for one. */}
                <span className="h-1.5 w-6 rounded-full" style={{ background: th.ink, opacity: 0.5 }} />
              </span>
            ))}
          </div>
          <div
            data-open-ring
            aria-hidden
            className="absolute h-16 w-16 rounded-3xl border-[3px] border-press sm:h-20 sm:w-20"
          />
          <div
            data-open-mark
            aria-hidden
            className="relative grid h-16 w-16 place-items-center rounded-3xl bg-press text-3xl text-paper shadow-stamp-lg sm:h-20 sm:w-20 sm:text-4xl"
          >
            <span>◆</span>
          </div>
        </div>

        <h1
          aria-label={t("app.name")}
          className="mt-5 font-display text-5xl font-bold tracking-tight text-ink sm:text-6xl"
        >
          {[...t("app.name")].map((ch, i) => (
            <span key={i} data-open-letter aria-hidden className="inline-block">
              {ch === " " ? " " : ch}
            </span>
          ))}
        </h1>
        <div data-open-line aria-hidden className="mt-3 h-[3px] w-24 rounded-full bg-ink" />
        <p data-open-rule className="mt-3 text-balance text-base font-semibold text-ink-soft sm:text-lg">
          {t("intro.tagline")}
        </p>
      </div>

      <button
        data-open-skip
        onClick={skip}
        className="absolute bottom-6 rounded-full px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-soft transition hover:text-ink"
      >
        {t("intro.skip")}
      </button>
    </div>
  );
}
