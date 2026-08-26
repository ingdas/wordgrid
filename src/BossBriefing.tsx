import { type Ref } from "react";
import { dialogIn, useGsap } from "./anim";
import { t } from "./i18n";
import { useModal } from "./modal";
import type { BossTwist } from "./puzzles";

// Every boss rewrites a rule of the game, and a name for that rewrite —
// "impostors", "blackout", "from memory" — only means something to a player who
// has already been told what it does. This is where they get told: the rule in
// one line, then what changes and what to do about it, in the boss's own
// words. It opens itself on a boss you haven't beaten, and the rule strip on
// the board (plus the how-to-play sheet) brings it back whenever it's wanted.

/** The rule, unpacked. Shared by the briefing dialog and the help sheet. */
export function BossRules({ twist }: { twist: BossTwist }) {
  const parts = [
    { key: "boss.brief.what", body: t(`twist.${twist}.brief.a`), icon: "🎲" },
    { key: "boss.brief.how", body: t(`twist.${twist}.brief.b`), icon: "🧭" },
  ];
  return (
    <div className="space-y-2.5 text-left">
      {parts.map((p) => (
        <div key={p.key} data-dialog-row className="flex gap-3 rounded-2xl bg-white p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-press/10 text-xl" aria-hidden>
            {p.icon}
          </span>
          <div className="min-w-0">
            <div className="text-[0.65rem] font-extrabold uppercase tracking-widest text-press">{t(p.key)}</div>
            <p className="mt-0.5 text-sm leading-snug text-ink">{p.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BossBriefing({
  ref,
  twist,
  onClose,
}: {
  /** The presence handle that keeps this mounted long enough to leave. */
  ref?: Ref<HTMLDivElement>;
  twist: BossTwist;
  onClose: () => void;
}) {
  // Escape closes it and Tab stays inside it, like every other dialog.
  const panel = useModal<HTMLDivElement>(onClose);
  // …and it arrives the way every other dialog does. The parts are marked with
  // data attributes; the timeline lives in src/anim.ts.
  const scope = useGsap<HTMLDivElement>((el) => void dialogIn(el), [twist]);

  const name = t(`twist.${twist}.short`);
  return (
    <div
      ref={(el) => {
        scope.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("boss.brief.a11y", { what: name })}
      className="fixed inset-0 z-50 dialog-scrim flex flex-col items-center overflow-y-auto bg-ink/55 p-5"
    >
      <div
        data-panel
        ref={panel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        // The longest briefing (the Oracle's) is taller than a 720p embed, so
        // the card scrolls rather than pushing its own dismiss button off.
        className="max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-3xl border-2 border-ink bg-paper p-6 text-center shadow-stamp-lg"
      >
        <div
          data-dialog-mark
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-ink text-3xl text-paper shadow-stamp"
        >
          <span aria-hidden>👑</span>
        </div>
        <div className="mt-3 text-[0.6rem] font-extrabold uppercase tracking-[0.25em] text-press">
          {t("boss.brief.eyebrow")}
        </div>
        <h2 className="mt-1 font-display text-3xl font-bold capitalize text-ink">{name}</h2>
        {/* The one-liner first: a player who reads nothing else still leaves
            this dialog knowing what the board is about to do to them. */}
        <p className="mx-auto mt-1.5 max-w-[22rem] text-sm font-semibold leading-snug text-ink-soft">
          {t(`twist.${twist}.rule`)}
        </p>

        <div className="mt-5">
          <BossRules twist={twist} />
        </div>

        <button
          data-dialog-cta
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-press py-3.5 text-base font-bold text-paper shadow-stamp transition hover:scale-[1.02] active:scale-95"
        >
          {t("boss.brief.cta")}
        </button>
      </div>
    </div>
  );
}
