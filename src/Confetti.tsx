import { useEffect } from "react";
import { confetti } from "./anim";

/**
 * A short, celebratory burst of punched-paper chads.
 *
 * The pieces live outside React — mounting this fires a GSAP timeline that
 * builds them, throws them and cleans up after itself (see `confetti` in
 * `src/anim.ts`). React's job here is only to say *when*: the component is
 * remounted with a fresh `key` on every burst, so one solved group is one
 * effect run, and unmounting mid-flight kills the timeline.
 *
 * With an `origin` the paper is thrown from that point on the viewport — the
 * banner a group just landed in. Without one it rains from above the fold,
 * which is what a whole win deserves.
 */
export default function Confetti({
  count = 90,
  origin,
  power,
}: {
  count?: number;
  origin?: { x: number; y: number };
  power?: number;
}) {
  useEffect(
    () => confetti({ count, origin, power }),
    // A burst is a one-shot: re-running it because a parent re-rendered with a
    // new object literal for `origin` would fire a second one mid-flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return null;
}
