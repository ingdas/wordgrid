// Modal behaviour that a keyboard or screen-reader player expects, in one hook.
//
// Escape-to-close was already here; the rest was not. Every dialog in the game
// (settings, stats, history, how-to-play, the boss briefing, the welcome
// overlay) rendered on top of a live screen with the whole page still tabbable
// underneath, so Tab walked straight out of the dialog and into the board
// behind it — invisible to a sighted keyboard player, and nonsense to a screen
// reader that had just been told it was in a modal.
//
// So: focus moves into the panel when it opens, Tab cycles inside it, and
// whatever was focused before gets it back on close.
import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Attach the returned ref to the dialog's panel (and give it `tabIndex={-1}`,
 * so it can hold focus itself before the player has tabbed anywhere).
 *
 * @param onClose called on Escape. Omit for a dialog that must be answered.
 */
export function useModal<T extends HTMLElement>(onClose?: () => void) {
  const ref = useRef<T | null>(null);
  // Callers pass inline arrows, which change identity every render. Held in a
  // ref so the effect below can run exactly once — re-running it would yank
  // focus back to the first button on every parent re-render.
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const panel = ref.current;
    const previous = (document.activeElement as HTMLElement | null) ?? null;

    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
      );

    // Into the dialog, not onto its first button when that button is "Close" —
    // the panel itself is a fine landing spot and reads the dialog's label.
    panel?.focus?.();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close.current?.();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const list = focusables();
      if (list.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      const outside = !panel.contains(active);
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    // Capture, so a handler on the page underneath can't eat the key first.
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      // Back where they were — the button that opened the dialog.
      if (previous && document.contains(previous)) previous.focus?.();
    };
  }, []);

  return ref;
}
