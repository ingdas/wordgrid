import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { t } from "./i18n";

// The debug tool tray. Mounted only when debug mode is on (see src/debug.ts),
// and collapsed to a single 🛠 button until it's asked for, so a screen being
// tested still looks like the screen a player sees. Each screen passes its own
// tools — the word game solves groups, the Logic Grid paints its solution.
//
// Pinned bottom-left: the toast sits bottom-centre and the coach card bottom-
// middle, so this is the one corner nothing else claims.

export interface DebugTool {
  /** i18n key for the button's label. */
  key: string;
  onClick: () => void;
  disabled?: boolean;
  /** Destructive tools (force a loss) are drawn in the mistake colour. */
  danger?: boolean;
}

export function DebugPanel({ tools }: { tools: DebugTool[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-3 left-3 z-[70] flex flex-col items-start gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="w-52 rounded-2xl border-2 border-leaf bg-paper p-2 shadow-2xl"
          >
            <div className="px-1.5 pb-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-leaf">
              {t("debug.title")}
            </div>
            <div className="flex flex-col gap-1">
              {tools.map((tool) => (
                <button
                  key={tool.key}
                  onClick={tool.onClick}
                  disabled={tool.disabled}
                  className={`rounded-xl border px-2.5 py-1.5 text-left text-xs font-bold transition enabled:hover:bg-cream enabled:active:scale-95 disabled:opacity-35 ${
                    tool.danger ? "border-press/50 text-press" : "border-ink/25 text-ink"
                  }`}
                >
                  {t(tool.key)}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("debug.tools")}
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-full border-2 border-leaf bg-paper text-base shadow-lg transition hover:bg-cream active:scale-95"
      >
        <span aria-hidden>🛠</span>
      </button>
    </div>
  );
}
