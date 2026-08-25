import { useEffect, useRef, type Ref } from "react";
import gsap from "gsap";
import { EASE, dropOut, motionOn, usePresence } from "./anim";

/**
 * The bottom-of-screen message: up from the edge, and back down to it.
 *
 * Mount it unconditionally and hand it the current text — `null` when there
 * isn't one. It owns its own coming and going, which is why the text is a prop
 * rather than the mounting being the caller's problem: a toast whose parent
 * stops rendering it has already lost the words it needs to leave with. The
 * three screens that raise toasts were each doing this by hand.
 */
export function Toast({ text }: { text: string | null }) {
  const here = usePresence(text != null, text, dropOut);
  if (!here.rendered) return null;
  return <ToastBody ref={here.ref} text={here.data} />;
}

function ToastBody({ ref, text }: { ref: Ref<HTMLDivElement>; text: string | null }) {
  const el = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (motionOn() && el.current) {
      gsap.fromTo(el.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, ease: EASE.press });
    }
  }, []);
  return (
    <div
      ref={(node) => {
        el.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-center text-sm font-semibold text-paper shadow-stamp-lg"
    >
      {text}
    </div>
  );
}
