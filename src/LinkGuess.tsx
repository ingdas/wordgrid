import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { buildLetterBank } from "./letters";
import { playDeselect, playSelect } from "./audio";
import { t } from "./i18n";

// The spell-the-link finale: tap (or type) letters from a bank into the
// answer slots, auto-checked the moment they're full. Also serves the Oracle
// boss and the early call, which ask the same question before the grouping is
// done — see the `early` prop.
export function LinkGuess({
  oracle,
  early = false,
  bank: providedBank,
  titleKey,
  bodyKey,
  dismissKey,
  onMiss,
  resolved,
  pivot,
  revealedLetters,
  hintBank,
  canRevealLetter,
  onRevealLetter,
  onRefill,
  onSubmit,
  onReveal,
}: {
  oracle: boolean;
  /** An early call: one attempt, and a miss hands the board back. */
  early?: boolean;
  /** Use these tiles instead of a generated bank (the chapter keys pass the
   *  exact letters the player banked, with no decoys). */
  bank?: string[];
  /** Copy overrides, for callers that aren't the finale. */
  titleKey?: string;
  bodyKey?: string;
  /** Show a plain dismiss button with this label instead of "give up". */
  dismissKey?: string;
  onMiss?: () => void;
  resolved: boolean;
  pivot: string;
  revealedLetters: number;
  hintBank: number;
  canRevealLetter: boolean;
  onRevealLetter: () => void;
  onRefill: () => void;
  onSubmit: (text: string) => boolean;
  onReveal: () => void;
}) {
  const bank = useMemo(() => providedBank ?? buildLetterBank(pivot), [providedBank, pivot]);
  // Indices of bank tiles the player has tapped, in order (the suffix after the
  // free/ revealed prefix). Cleared whenever the revealed prefix grows.
  const [taps, setTaps] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    setTaps([]);
  }, [revealedLetters]);

  // Bank tiles consumed: greedily by the locked prefix, then the player's taps.
  const used = useMemo(() => {
    const s = new Set<number>();
    for (let k = 0; k < revealedLetters && k < pivot.length; k++) {
      const ch = pivot[k];
      for (let i = 0; i < bank.length; i++) {
        if (!s.has(i) && bank[i] === ch) { s.add(i); break; }
      }
    }
    taps.forEach((i) => s.add(i));
    return s;
  }, [bank, pivot, revealedLetters, taps]);

  const prefix = pivot.slice(0, revealedLetters);
  const built = prefix + taps.map((i) => bank[i]).join("");
  const full = built.length >= pivot.length;

  // Auto-check once every slot is filled (no keyboard, no Submit button).
  useEffect(() => {
    if (resolved || !full || submitting.current) return;
    submitting.current = true;
    const timer = setTimeout(() => {
      const ok = onSubmit(built);
      submitting.current = false;
      if (!ok) {
        setWrong(true);
        setShakeKey((k) => k + 1);
        setTaps([]);
        // An early call gets one attempt; the finale lets you keep trying.
        if (early) setTimeout(() => onMiss?.(), 700);
      }
    }, 280);
    return () => { clearTimeout(timer); submitting.current = false; };
  }, [full, built, resolved, onSubmit, early, onMiss]);

  const tap = (i: number) => {
    if (resolved || used.has(i) || full) return;
    setWrong(false);
    playSelect();
    setTaps((prev) => [...prev, i]);
  };
  const backspace = () => {
    if (!taps.length) return;
    playDeselect();
    setWrong(false);
    setTaps((prev) => prev.slice(0, -1));
  };

  // Desktop players reach for the keyboard here: typing a letter places the
  // first unused tile bearing it, Backspace undoes. Tapping still works.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (resolved || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }
      if (!/^[a-zA-Z]$/.test(e.key)) return;
      const ch = e.key.toUpperCase();
      const i = bank.findIndex((b, idx) => b === ch && !used.has(idx));
      if (i >= 0) tap(i);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // no dep array: the handler closes over the current taps/used set

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-7 text-center">
      <h3 className="font-display text-xl font-bold text-ink">
        {t(titleKey ?? (oracle ? "finale.oracle.title" : early ? "game.early.title" : "finale.title"))}
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        {t(bodyKey ?? (oracle ? "finale.oracle.body" : early ? "game.early.body" : "finale.body"))}
      </p>

      {/* The answer so far. Tapped letters pop into the slots; a wrong word
          shakes; a correct word gives the whole row a quick success pulse. */}
      <motion.div
        key={shakeKey}
        animate={resolved ? { scale: [1, 1.08, 1] } : wrong ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="mt-4 flex flex-wrap justify-center gap-1.5"
        aria-label={t("finale.a11y.slots", { n: pivot.length })}
      >
        {pivot.split("").map((_, i) => {
          const locked = i < revealedLetters;
          const placed = i < built.length;
          const next = i === built.length && !resolved;
          const ch = resolved ? pivot[i] : placed ? built[i] : "";
          return (
            <span
              key={i}
              className={`grid h-10 w-8 place-items-center rounded-md border text-lg font-extrabold transition-colors ${
                resolved || placed
                  ? locked
                    ? "border-gold bg-gold/10 text-gold-deep"
                    : "border-press/60 bg-press/10 text-ink"
                  : next
                    ? "border-press text-ink/30 ring-2 ring-press/40"
                    : "border-ink/25 text-ink/25"
              }`}
            >
              {ch ? (
                <motion.span
                  key={ch + i}
                  initial={{ scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 24 }}
                >
                  {ch}
                </motion.span>
              ) : (
                "_"
              )}
            </span>
          );
        })}
      </motion.div>

      {wrong ? (
        <p className="mt-2 text-sm font-semibold text-press">{t("finale.wrong")}</p>
      ) : (
        <p className="mt-2 text-xs text-ink-soft">{t("finale.hintLine")}</p>
      )}

      {/* The letter bank */}
      <div className="mx-auto mt-3 flex max-w-sm flex-wrap justify-center gap-2">
        {bank.map((ch, i) => {
          const isUsed = used.has(i);
          return (
            <motion.button
              key={i}
              whileTap={isUsed || resolved ? undefined : { scale: 0.88 }}
              onClick={() => tap(i)}
              disabled={isUsed || resolved || full}
              aria-label={t(isUsed ? "finale.a11y.letterUsed" : "finale.a11y.letter", { letter: ch })}
              className={`grid h-11 w-9 place-items-center rounded-xl text-lg font-extrabold transition ${
                isUsed
                  ? "border border-ink/10 bg-cream text-ink/15"
                  : "border-2 border-ink bg-white text-ink hover:bg-cream active:scale-95"
              }`}
            >
              {ch}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={backspace}
          disabled={resolved || !taps.length}
          className="flex items-center gap-1.5 rounded-full border border-ink/30 px-4 py-2 text-xs font-bold text-ink transition enabled:hover:bg-cream enabled:active:scale-95 disabled:opacity-35"
        >
          {t("finale.undo")}
        </button>
        {hintBank === 0 && !resolved ? (
          <button
            onClick={onRefill}
            className="flex items-center gap-2 rounded-full bg-press px-4 py-2 text-xs font-bold text-paper shadow-[3px_3px_0_rgba(38,34,26,0.8)] transition hover:scale-[1.03] active:scale-95"
          >
            {t("finale.refill")}
          </button>
        ) : (
          <button
            onClick={onRevealLetter}
            disabled={resolved || !canRevealLetter}
            className="flex items-center gap-2 rounded-full border border-gold bg-gold/15 px-4 py-2 text-xs font-bold text-gold-deep transition enabled:hover:bg-gold/25 enabled:active:scale-95 disabled:opacity-35"
          >
            {t("finale.revealLetter")}
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[0.65rem] font-extrabold text-ink">
              {hintBank}
            </span>
          </button>
        )}
        {dismissKey ? (
          <button
            onClick={onMiss}
            className="rounded-full px-3 py-2 text-xs font-semibold text-ink-soft underline-offset-4 transition hover:text-ink hover:underline"
          >
            {t(dismissKey)}
          </button>
        ) : early ? (
          <button
            onClick={onMiss}
            disabled={resolved}
            className="rounded-full px-3 py-2 text-xs font-semibold text-ink-soft underline-offset-4 transition enabled:hover:text-ink enabled:hover:underline disabled:opacity-40"
          >
            {t("game.early.back")}
          </button>
        ) : (
          <button
            onClick={onReveal}
            disabled={resolved}
            className="rounded-full px-3 py-2 text-xs font-semibold text-ink-soft underline-offset-4 transition enabled:hover:text-ink enabled:hover:underline disabled:opacity-40"
          >
            {t("finale.giveUp")}
          </button>
        )}
      </div>
    </motion.div>
  );
}
