import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { EASE, motionOn, pressDown, punch, rattle, release, stampIn } from "./anim";
import gsap from "gsap";
import { buildLetterBank } from "./letters";
import { activeScript, graphemes } from "./i18n/script";
import { playDeselect, playSelect } from "./audio";
import { adsMode, subscribeAds } from "./sdk";
import { t } from "./i18n";

// The spell-the-link finale: tap (or type) letters from a bank into the
// answer slots, auto-checked the moment they're full. Also serves the early
// call, which asks the same question before the grouping is done — see the
// `early` prop.
export function LinkGuess({
  early = false,
  bank: providedBank,
  suspended = false,
  titleKey,
  bodyKey,
  dismissKey,
  onMiss,
  resolved,
  pivot,
  revealedLetters,
  hintBank,
  unlimited = false,
  canRevealLetter,
  onRevealLetter,
  onRefill,
  onSubmit,
  onReveal,
}: {
  /** An early call: one attempt, and a miss hands the board back. */
  early?: boolean;
  /** Use these tiles instead of a generated bank (the chapter keys pass the
   *  exact letters the player banked, with no decoys). */
  bank?: string[];
  /** A dialog is over the board (the boss briefing): ignore the keyboard, or
   *  reading the rules would type letters into the answer behind it. */
  suspended?: boolean;
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
  /** Debug: hints are free here, so never offer the refill and show ∞. */
  unlimited?: boolean;
  canRevealLetter: boolean;
  onRevealLetter: () => void;
  onRefill: () => void;
  onSubmit: (text: string) => boolean;
  onReveal: () => void;
}) {
  const bank = useMemo(() => providedBank ?? buildLetterBank(pivot), [providedBank, pivot]);
  // The answer as the units a player spells with (a Hangul block, a Thai
  // cluster, a kana) — never code units, which would split a mark from its letter.
  const letters = useMemo(() => graphemes(pivot), [pivot]);
  // Whether the refill is a video to watch, a free top-up, or unavailable.
  const ads = useSyncExternalStore(subscribeAds, adsMode, adsMode);
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
    for (let k = 0; k < revealedLetters && k < letters.length; k++) {
      const ch = letters[k];
      for (let i = 0; i < bank.length; i++) {
        if (!s.has(i) && bank[i] === ch) { s.add(i); break; }
      }
    }
    taps.forEach((i) => s.add(i));
    return s;
  }, [bank, letters, revealedLetters, taps]);

  const built = [...letters.slice(0, revealedLetters), ...taps.map((i) => bank[i])];
  const builtText = built.join("");
  const full = built.length >= letters.length;

  // Auto-check once every slot is filled (no keyboard, no Submit button).
  useEffect(() => {
    if (resolved || !full || submitting.current) return;
    submitting.current = true;
    const timer = setTimeout(() => {
      const ok = onSubmit(builtText);
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
  }, [full, builtText, resolved, onSubmit, early, onMiss]);

  const tap = (i: number) => {
    if (resolved || used.has(i) || full) return;
    setWrong(false);
    playSelect(taps.length); // spelling it out climbs, letter by letter
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
      if (resolved || suspended || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }
      // A single typed letter in any script; compared folded, so "e" finds
      // an É tile and "и" an Й one. Names like "Shift" are longer and skipped.
      if (e.key.length > 2 || !/\p{L}/u.test(e.key)) return;
      const norm = activeScript().normalize;
      const want = norm(e.key);
      if (!want) return;
      const i = bank.findIndex((b, idx) => norm(b) === want && !used.has(idx));
      if (i >= 0) tap(i);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // no dep array: the handler closes over the current taps/used set

  // The row of slots: rattled on a rejected word, punched on the right one.
  const slotRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (shakeKey) rattle(slotRow.current, [...(slotRow.current?.children ?? [])] as HTMLElement[]);
  }, [shakeKey]);
  useEffect(() => {
    if (resolved) punch(slotRow.current, 1.08);
  }, [resolved]);

  // The finale coming up out of the board.
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (motionOn() && panel.current) {
      gsap.fromTo(panel.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: EASE.press });
    }
  }, []);

  return (
    <div ref={panel} className="mt-7 text-center">
      <h3 className="font-display text-xl font-bold text-ink">
        {t(titleKey ?? (early ? "game.early.title" : "finale.title"))}
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        {t(bodyKey ?? (early ? "game.early.body" : "finale.body"))}
      </p>

      {/* The answer so far. Tapped letters are stamped into the slots; a wrong
          word rattles the row; a correct one gives it a beat of its own. */}
      <div
        ref={slotRow}
        className="mt-4 flex flex-wrap justify-center gap-1.5"
        aria-label={t("finale.a11y.slots", { n: letters.length })}
      >
        {letters.map((_, i) => {
          const locked = i < revealedLetters;
          const placed = i < built.length;
          const next = i === built.length && !resolved;
          const ch = resolved ? letters[i] : placed ? built[i] : "";
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
              {ch ? <Slot key={ch + i} ch={ch} /> : "_"}
            </span>
          );
        })}
      </div>

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
            <button
              key={i}
              onPointerDown={(e) => !isUsed && !resolved && !full && pressDown(e.currentTarget)}
              onPointerUp={(e) => release(e.currentTarget)}
              onPointerLeave={(e) => release(e.currentTarget)}
              onClick={() => tap(i)}
              disabled={isUsed || resolved || full}
              aria-label={t(isUsed ? "finale.a11y.letterUsed" : "finale.a11y.letter", { letter: ch })}
              className={`grid h-11 w-9 place-items-center rounded-xl text-lg font-extrabold transition ${
                isUsed
                  ? "border border-ink/10 bg-cream text-ink/15"
                  : "border-2 border-ink bg-white text-ink shadow-stamp-sm hover:bg-cream active:scale-95"
              }`}
            >
              {ch}
            </button>
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
        {hintBank === 0 && !unlimited && !resolved && ads === "blocked" ? (
          // An ad blocker: say why there's no refill rather than offer a dead button.
          <p role="status" className="max-w-[16rem] text-center text-xs font-semibold text-ink-soft">
            {t("game.hint.refill.blocked")}
          </p>
        ) : hintBank === 0 && !unlimited && !resolved ? (
          <button
            onClick={onRefill}
            className="flex items-center gap-2 rounded-full bg-press px-4 py-2 text-xs font-bold text-paper shadow-stamp transition hover:scale-[1.03] active:scale-95"
          >
            {/* Only promise a video where one plays. */}
            {t(ads === "ads" ? "finale.refill" : "finale.refill.free")}
          </button>
        ) : (
          <button
            onClick={onRevealLetter}
            disabled={resolved || !canRevealLetter}
            className="flex items-center gap-2 rounded-full border border-gold bg-gold/15 px-4 py-2 text-xs font-bold text-gold-deep transition enabled:hover:bg-gold/25 enabled:active:scale-95 disabled:opacity-35"
          >
            {t("finale.revealLetter")}
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[0.65rem] font-extrabold text-ink">
              {unlimited ? "∞" : hintBank}
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
    </div>
  );
}

/** One letter landing in its slot — stamped, like everything else here. */
function Slot({ ch }: { ch: string }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    stampIn(el.current, { from: 1.7, tilt: 6 });
  }, [ch]);
  return (
    <span ref={el} className="inline-block">
      {ch}
    </span>
  );
}
