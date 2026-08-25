/**
 * The press room — every animation in the game that isn't a layout transition.
 *
 * The look is "The Puzzle Press": ink on warm paper, flat colour, chunky offset
 * shadows. So the motion is printing, not physics-toy bounce. Things get
 * *stamped* onto the page (fast in, one hard settle), paper *rattles* when a
 * guess is rejected, solved tiles are *pulled* into the banner that files them
 * away, and the only continuous motion anywhere is a card breathing while it
 * waits to be noticed.
 *
 * Framer Motion still owns mount/unmount and layout (`AnimatePresence`,
 * `layout`) because that's what it's good at. This module owns the beats — the
 * moments the game reacts to something you did — because those want timelines,
 * staggers and imperative control from an event handler, which is what GSAP is
 * good at. The split is deliberate: nothing here animates a property that a
 * `motion.*` component is also driving on the same node, or the two would take
 * turns writing the same transform.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, type DependencyList, type RefObject } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(CustomEase, Flip);

// ---------------------------------------------------------------------------
// Eases
// ---------------------------------------------------------------------------

/**
 * The stamp: hits the page fast, overshoots a hair, and settles in two
 * decreasing bounces — a rubber stamp rocking on its edge before it lifts.
 * The stock `back.out` overshoots once and glides; this one is doing the thing
 * the whole visual identity is about, so it's worth authoring by hand.
 */
CustomEase.create("stamp", "M0,0 C0.05,0.86 0.11,1.16 0.26,1.08 0.4,1.01 0.47,0.97 0.6,1.01 0.76,1.05 0.83,1 1,1");

/** Ink soaking into paper: quick contact, long slow finish. */
CustomEase.create("soak", "M0,0 C0.08,0.72 0.13,0.94 0.26,0.985 0.5,1.005 0.62,1 1,1");

export const EASE = {
  stamp: "stamp",
  soak: "soak",
  press: "power3.out",
  pull: "power2.inOut",
  gravity: "power1.in",
} as const;

// ---------------------------------------------------------------------------
// Reduced motion
// ---------------------------------------------------------------------------

// One module-level flag rather than a prop threaded through every component:
// the helpers below are called from leaf components and from event handlers,
// and a decorative animation that forgot to check the setting is exactly the
// bug the setting exists to prevent. App keeps this in step with the in-game
// Calm switch (see `useReduceMotion`); it starts from the system preference so
// that a player who has asked for less motion doesn't get one frame of it
// before React has mounted anything.
let reduced =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Turn every decorative animation in this module into a no-op (or a cut). */
export function setReduceMotion(on: boolean) {
  reduced = on;
  // Reduced motion should also stop whatever is already looping.
  if (on) gsap.globalTimeline.getChildren(true, true, true).forEach((tw) => tw.progress(1).kill());
}

/** True when motion is allowed. Every helper here bails on `false`. */
export const motionOn = () => !reduced;

/**
 * Keep the module flag in step with a React value.
 *
 * Set during render rather than from an effect, and deliberately so: a screen
 * builds its entrance from a layout effect in a *child* of the component that
 * owns the setting, and a child's effects run first. By the time an effect here
 * could flip the flag, the animation it was meant to suppress has already been
 * created. The write is guarded, so the only thing that ever happens twice
 * under StrictMode is a comparison.
 */
export function useReduceMotion(reduce: boolean) {
  if (reduced !== reduce) setReduceMotion(reduce);
}

// ---------------------------------------------------------------------------
// React plumbing
// ---------------------------------------------------------------------------

/**
 * Run GSAP setup scoped to an element, cleaned up on unmount or a dep change.
 *
 * `gsap.context()` records every tween made inside it and `revert()` undoes
 * them *and* the inline styles they left behind — which is what makes this safe
 * under StrictMode, where every effect is mounted, torn down and mounted again.
 */
export function useGsap<T extends HTMLElement>(
  setup: (scope: T, ctx: gsap.Context) => void,
  deps: DependencyList = []
): RefObject<T | null> {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context((self) => setup(el, self), el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/**
 * A stable map of keyed elements, for boards that animate their own children.
 *
 * Everything here is memoised down to the individual ref callback, because a
 * fresh callback identity makes React detach and re-attach that ref on every
 * render — which for a twelve-tile board is twenty-four map writes per
 * keystroke, and a returned object that changes identity would re-run every
 * effect that depends on the map besides.
 */
export function useElementMap<K>() {
  const map = useRef(new Map<K, HTMLElement>()).current;
  const binders = useRef(new Map<K, (el: HTMLElement | null) => void>()).current;
  return useMemo(() => {
    const bind = (key: K) => {
      let fn = binders.get(key);
      if (!fn) {
        fn = (el: HTMLElement | null) => {
          if (el) map.set(key, el);
          else map.delete(key);
        };
        binders.set(key, fn);
      }
      return fn;
    };
    const pick = (keys: Iterable<K>) =>
      [...keys].map((k) => map.get(k)).filter((el): el is HTMLElement => !!el);
    return { map, bind, pick };
  }, [map, binders]);
}

/**
 * A number that counts to its new value instead of jumping.
 *
 * Returns a ref to put on the element that shows it. The text is written
 * straight to the DOM rather than through state — sixty renders a second of a
 * whole game screen to animate one label is not a trade worth making.
 */
export function useOdometer(value: number, format: (n: number) => string = (n) => n.toLocaleString()) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!motionOn() || shown.current === value) {
      shown.current = value;
      el.textContent = format(value);
      return;
    }
    const proxy = { n: shown.current };
    const tw = gsap.to(proxy, {
      n: value,
      duration: Math.min(0.9, 0.25 + Math.abs(value - shown.current) / 1200),
      ease: EASE.soak,
      onUpdate: () => {
        el.textContent = format(Math.round(proxy.n));
      },
      onComplete: () => {
        shown.current = value;
        el.textContent = format(value);
      },
    });
    return () => {
      tw.kill();
      shown.current = value;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return ref;
}

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

type El = HTMLElement | null | undefined;
type Els = El | El[];

const alive = (els: Els): HTMLElement[] =>
  (Array.isArray(els) ? els : [els]).filter((el): el is HTMLElement => !!el && el.isConnected);

/** A thing arriving on the page: stamped down, hard, with one settle. */
export function stampIn(els: Els, opts: { from?: number; delay?: number; stagger?: number; tilt?: number } = {}) {
  const targets = alive(els);
  if (!targets.length || !motionOn()) return null;
  const { from = 1.35, delay = 0, stagger = 0, tilt = 1.5 } = opts;
  return gsap.fromTo(
    targets,
    { scale: from, opacity: 0, rotate: () => gsap.utils.random(-tilt, tilt) },
    { scale: 1, opacity: 1, rotate: 0, duration: 0.52, ease: EASE.stamp, delay, stagger, clearProps: "transform,opacity" }
  );
}

/**
 * Dealing a board: tiles drop in from just above the page, in a wave from the
 * middle out, each landing with the same stamp as everything else.
 */
export function dealIn(els: Els) {
  const targets = alive(els);
  if (!targets.length || !motionOn()) return null;
  return gsap.fromTo(
    targets,
    { y: -18, scale: 0.86, opacity: 0, rotate: () => gsap.utils.random(-4, 4) },
    {
      y: 0,
      scale: 1,
      opacity: 1,
      rotate: 0,
      duration: 0.5,
      ease: EASE.stamp,
      stagger: { each: 0.045, from: "center" },
      clearProps: "transform,opacity",
    }
  );
}

/**
 * A rejected guess. The container recoils once and the tiles rattle after it
 * with a decaying wobble — paper shoved and settling, not a screen shake.
 * The rattle is staggered from the centre so the board reads as one sheet.
 */
export function rattle(container: El, tiles: Els = [], strength = 1) {
  if (!motionOn()) return null;
  const tl = gsap.timeline();
  const box = alive(container)[0];
  if (box) {
    tl.fromTo(
      box,
      { x: 0 },
      {
        keyframes: { x: [-11, 10, -7, 6, -3, 0].map((v) => v * strength) },
        duration: 0.44,
        ease: "none",
        clearProps: "x",
      },
      0
    );
  }
  const targets = alive(tiles);
  if (targets.length) {
    tl.fromTo(
      targets,
      { rotate: 0 },
      {
        keyframes: { rotate: [-3.5, 3, -2, 1.4, 0].map((v) => v * strength) },
        duration: 0.4,
        ease: "none",
        stagger: { each: 0.018, from: "center" },
        clearProps: "rotate",
      },
      0.03
    );
  }
  return tl;
}

/** A quick "look at me" punch — a chip that just changed, a counter that ticked. */
export function punch(els: Els, scale = 1.3) {
  const targets = alive(els);
  if (!targets.length || !motionOn()) return null;
  return gsap.fromTo(
    targets,
    { scale: 1 },
    { scale, duration: 0.14, ease: EASE.press, yoyo: true, repeat: 1, clearProps: "scale" }
  );
}

/** A card that wants to be noticed, breathing until it is. Kill the return value. */
export function breathe(el: El, scale = 1.035) {
  const target = alive(el)[0];
  if (!target || !motionOn()) return null;
  return gsap.to(target, { scale, duration: 1.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
}

/** The ink flash a surface gives off when something lands on it. */
export function inkFlash(el: El, colour: string) {
  const target = alive(el)[0];
  if (!target || !motionOn()) return null;
  return gsap.fromTo(
    target,
    { boxShadow: `0 0 0 0 ${colour}` },
    { boxShadow: `0 0 0 14px transparent`, duration: 0.6, ease: EASE.press, clearProps: "boxShadow" }
  );
}

/** The press coming down on a tile you tapped. Paired with `release`. */
export function pressDown(el: El) {
  const target = alive(el)[0];
  if (!target || !motionOn()) return;
  gsap.to(target, { scale: 0.9, duration: 0.09, ease: "power2.out", overwrite: "auto" });
}

/** …and lifting off it again. */
export function release(el: El, bounce = true) {
  const target = alive(el)[0];
  if (!target || !motionOn()) return;
  gsap.to(target, {
    scale: 1,
    duration: bounce ? 0.42 : 0.12,
    ease: bounce ? EASE.stamp : "power2.out",
    overwrite: "auto",
    clearProps: "scale",
  });
}

// ---------------------------------------------------------------------------
// Ghosts — carrying an element somewhere after React has taken it away
// ---------------------------------------------------------------------------

export interface Ghost {
  node: HTMLElement;
  rect: DOMRect;
}

/**
 * Photocopy elements where they currently stand.
 *
 * Capture happens in the event handler, *before* the state change that removes
 * them; the flight happens in a layout effect, *after* the thing they're flying
 * to has rendered. In between, React is free to unmount the originals — the
 * clones don't care, which is the whole point of doing it this way instead of
 * fighting the reconciler to keep the real nodes alive.
 */
export function captureGhosts(els: Els): Ghost[] {
  if (!motionOn()) return [];
  return alive(els).map((el) => {
    const node = el.cloneNode(true) as HTMLElement;
    node.removeAttribute("id");
    node.setAttribute("aria-hidden", "true");
    node.inert = true;
    return { node, rect: el.getBoundingClientRect() };
  });
}

/**
 * Fly captured ghosts into a target and let them fall in.
 *
 * This is the solve: the three tiles you picked are pulled out of the board and
 * filed into the banner that now holds them, so the group visibly *becomes* the
 * banner instead of one thing vanishing while another appears somewhere else.
 */
export function flyGhosts(ghosts: Ghost[], target: El, opts: { onDone?: () => void } = {}) {
  const dest = alive(target)[0];
  if (!ghosts.length || !dest || !motionOn()) {
    ghosts.forEach((g) => g.node.remove());
    opts.onDone?.();
    return null;
  }
  const layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;z-index:45;pointer-events:none;";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  const to = dest.getBoundingClientRect();
  ghosts.forEach((g) => {
    Object.assign(g.node.style, {
      position: "fixed",
      left: `${g.rect.left}px`,
      top: `${g.rect.top}px`,
      width: `${g.rect.width}px`,
      height: `${g.rect.height}px`,
      margin: "0",
    });
    layer.appendChild(g.node);
  });

  const tl = gsap.timeline({
    onComplete: () => {
      layer.remove();
      opts.onDone?.();
    },
  });
  // A beat of "yes, these three" before they leave, then the pull.
  tl.to(ghosts.map((g) => g.node), {
    scale: 1.12,
    duration: 0.16,
    ease: EASE.press,
    stagger: 0.04,
  });
  ghosts.forEach((g, i) => {
    tl.to(
      g.node,
      {
        x: to.left + to.width / 2 - (g.rect.left + g.rect.width / 2),
        y: to.top + to.height / 2 - (g.rect.top + g.rect.height / 2),
        scale: 0.35,
        rotate: gsap.utils.random(-16, 16),
        opacity: 0,
        duration: 0.46,
        ease: "power2.in",
      },
      0.2 + i * 0.06
    );
  });
  return tl;
}

// ---------------------------------------------------------------------------
// Flip — reordering a board without teleporting anything
// ---------------------------------------------------------------------------

/** Record where things are, immediately before the state change that moves them. */
export function captureOrder(els: HTMLElement[]) {
  return motionOn() && els.length ? Flip.getState(els) : null;
}

/** …and slide them from there to wherever React just put them. */
export function playOrder(
  state: Flip.FlipState | null,
  els: HTMLElement[] = [],
  opts: { stagger?: number; spin?: boolean } = {}
) {
  if (!state || !motionOn()) return null;
  const tl = Flip.from(state, {
    duration: 0.55,
    ease: EASE.pull,
    stagger: opts.stagger ?? 0.025,
    // Transforms only — deliberately NOT `absolute: true`. Lifting the tiles
    // out of the flow collapses the board to nothing for half a second, and
    // everything under it (the link card, the controls, the coach) jumps up
    // and back. Every tile keeps its slot in a reorder, so their final flow
    // positions are already right and there is nothing to lift them for.
  });
  // A shuffle that only slides reads like a spreadsheet re-sorting. A few
  // degrees of spin on the way makes it a handful of cards being cut.
  if (opts.spin && els.length) {
    gsap.fromTo(
      els,
      { rotate: () => gsap.utils.random(-7, 7) },
      { rotate: 0, duration: 0.55, ease: EASE.pull, stagger: opts.stagger ?? 0.025, clearProps: "rotate" }
    );
  }
  return tl;
}

// ---------------------------------------------------------------------------
// Confetti
// ---------------------------------------------------------------------------

/** The four group colours plus the press's own two inks. */
const CHAD_COLOURS = ["#eda820", "#d9482b", "#5eb0e0", "#b48fd9", "#6cc793", "#1c7a4d"];

export interface ConfettiOpts {
  count?: number;
  /** Viewport point to burst from, in px. Omitted → rains from above the fold. */
  origin?: { x: number; y: number };
  /** How hard a burst is thrown. Ignored when it's raining. */
  power?: number;
}

/**
 * Punched-paper chads, thrown or dropped.
 *
 * Every piece gets its own gravity arc, spin and a flutter — a fast yoyo on
 * `scaleX` that turns it edge-on and back, which is what sells a flat scrap of
 * paper falling rather than a coloured dot sliding down the screen. Runs on the
 * body, outside React, and cleans itself up.
 */
export function confetti(opts: ConfettiOpts = {}): () => void {
  if (!motionOn()) return () => {};
  const { count = 90, origin, power = 1 } = opts;
  const layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;z-index:50;overflow:hidden;pointer-events:none;";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tl = gsap.timeline({ onComplete: () => layer.remove() });

  for (let i = 0; i < count; i++) {
    const round = Math.random() > 0.62;
    const size = 6 + Math.random() * 8;
    const chad = document.createElement("span");
    chad.style.cssText = `position:absolute;width:${size}px;height:${round ? size : size * 0.5}px;border-radius:${
      round ? "50%" : "2px"
    };background:${CHAD_COLOURS[i % CHAD_COLOURS.length]};will-change:transform;`;
    layer.appendChild(chad);

    // A burst throws pieces out along a random heading and lets gravity win;
    // a rain just drops them from above the top edge.
    const angle = gsap.utils.random(-Math.PI, 0); // upward half-circle
    const speed = gsap.utils.random(180, 520) * power;
    const startX = origin ? origin.x : gsap.utils.random(0, vw);
    const startY = origin ? origin.y : gsap.utils.random(-140, -40);
    const flight = origin ? gsap.utils.random(1.5, 2.4) : gsap.utils.random(2.4, 4);
    const driftX = origin
      ? Math.cos(angle) * speed * flight * 0.45
      : gsap.utils.random(-70, 70);
    const fallTo = vh + 80 - startY;

    gsap.set(chad, { x: startX, y: startY });
    const spin = tl.to(
      chad,
      {
        x: `+=${driftX}`,
        duration: flight,
        ease: origin ? "power2.out" : "sine.inOut",
      },
      0
    );
    // Vertical is its own tween so the arc is a real parabola: a burst rises
    // first and then falls, a rain only falls.
    if (origin) {
      const rise = Math.abs(Math.sin(angle)) * speed * 0.5;
      spin.to(chad, { y: `-=${rise}`, duration: flight * 0.32, ease: "power2.out" }, 0);
      spin.to(chad, { y: `+=${rise + fallTo}`, duration: flight * 0.68, ease: EASE.gravity }, flight * 0.32);
    } else {
      spin.to(chad, { y: `+=${fallTo}`, duration: flight, ease: EASE.gravity }, 0);
    }
    spin.to(chad, { rotation: gsap.utils.random(-900, 900), duration: flight, ease: "none" }, 0);
    // The flutter: the piece turns edge-on and back, forever, while it falls.
    spin.to(
      chad,
      { scaleX: 0.1, duration: gsap.utils.random(0.18, 0.42), ease: "sine.inOut", yoyo: true, repeat: -1 },
      0
    );
    spin.to(chad, { opacity: 0, duration: 0.5 }, flight - 0.5);
  }

  return () => {
    tl.kill();
    layer.remove();
  };
}
