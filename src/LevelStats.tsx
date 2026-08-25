import { useCallback, useEffect, useState, type Ref } from "react";
import { dialogIn, useGsap } from "./anim";
import { LEVELS, levelTitle } from "./puzzles";
import { useModal } from "./modal";
import { t } from "./i18n";
import {
  MIN_SAMPLE,
  communityStats,
  myStats,
  refreshStats,
  statsStatus,
  subscribeStats,
  successRate,
  type LevelStat,
  type Snapshot,
} from "./stats";
import type { Progress } from "./progress";

/**
 * The community numbers, re-rendering the caller when a fetch lands. Returns
 * null until there are any — every caller draws nothing rather than zeroes.
 */
export function useCommunityStats(): Snapshot | null {
  const [snap, setSnap] = useState<Snapshot | null>(() => communityStats());
  useEffect(() => subscribeStats(() => setSnap(communityStats())), []);
  return snap;
}

// The level-tracking dashboard: how many people have cleared each level, and
// how often an attempt on it ends in a win.
//
// It lives in Settings → Developer because it is an author's tool, not a
// player feature — it is the view that says which board is a wall and which is
// free, which is the whole point of collecting the numbers. Two rules it
// keeps, both borrowed from the rest of the game:
//
//   • **It never invents data.** A level with too few attempts to mean
//     anything shows a dash, not a percentage (see MIN_SAMPLE). With no
//     endpoint configured — the default — it says so plainly and shows this
//     install's own record instead of an empty table.
//   • **It doesn't spoil.** A board's title is a hint at its link, so a level
//     the owner hasn't solved is listed by number, exactly as the index does.

type Sort = "level" | "hardest";

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** "3 hours ago" at the granularity a slow-moving aggregate deserves. */
function ago(at: number): string {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60_000));
  if (mins < 2) return t("track.ago.now");
  if (mins < 60) return t("track.ago.minutes", { n: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t("track.ago.hours", { n: hours });
  return t("track.ago.days", { n: Math.round(hours / 24) });
}

export function LevelStatsModal({
  ref,
  progress,
  onClose,
}: {
  /** Presence handle: keeps the dialog mounted long enough to leave. */
  ref?: Ref<HTMLDivElement>;
  progress: Progress;
  onClose: () => void;
}) {
  const panel = useModal<HTMLDivElement>(onClose);
  const [, bump] = useState(0);
  const rerender = useCallback(() => bump((n) => n + 1), []);
  const [sort, setSort] = useState<Sort>("level");
  const [busy, setBusy] = useState(false);

  // A fetch landing while the sheet is open should fill the table in.
  useEffect(() => subscribeStats(rerender), [rerender]);

  // The game itself is happy with numbers a few hours old — it reads them on
  // a card between levels. Someone who opened this sheet is asking *now*, so
  // it always refetches, TTL or not.
  useEffect(() => {
    void refreshStats(true).then(rerender);
  }, [rerender]);

  const status = statsStatus();
  const snapshot = useCommunityStats();
  const mine = myStats();

  const refresh = useCallback(async () => {
    setBusy(true);
    await refreshStats(true);
    setBusy(false);
    rerender();
  }, [rerender]);

  const rows = LEVELS.map((lvl, i) => {
    const community: LevelStat | undefined = snapshot?.levels[lvl.id];
    return {
      index: i,
      id: lvl.id,
      solved: (progress.stars[lvl.id] ?? 0) > 0,
      community,
      rate: successRate(community),
      mine: mine[lvl.id],
    };
  });

  const withData = rows.filter((r) => r.rate !== null);
  const ordered =
    sort === "hardest"
      ? [...rows].sort((a, b) => {
          if (a.rate === null && b.rate === null) return a.index - b.index;
          if (a.rate === null) return 1;
          if (b.rate === null) return -1;
          return a.rate - b.rate;
        })
      : rows;

  // Attempts and wins across every tracked level — the headline rate.
  const totals = rows.reduce(
    (acc, r) => ({
      plays: acc.plays + (r.community?.plays ?? 0),
      wins: acc.wins + (r.community?.wins ?? 0),
      solvers: Math.max(acc.solvers, r.community?.solvers ?? 0),
    }),
    { plays: 0, wins: 0, solvers: 0 }
  );

  // The same entrance every dialog in the game gets — see src/anim.ts.
  const scope = useGsap<HTMLDivElement>((el) => void dialogIn(el), []);

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
      aria-label={t("track.title")}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
    >
      <div
        data-panel
        ref={panel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-ink bg-paper p-6 shadow-2xl"
      >
        <h3 className="font-display text-2xl font-bold text-ink">{t("track.title")}</h3>
        <p className="mt-1 text-[0.7rem] leading-snug text-ink-soft">{t("track.blurb")}</p>

        {/* The pipe itself: is anything being collected, and did it get out? */}
        <div className="mt-4 rounded-2xl border border-ink/20 bg-white p-3 text-[0.7rem] leading-relaxed text-ink-soft">
          {status.enabled ? (
            <>
              <div className="font-bold text-ink">{t("track.on")}</div>
              <div className="break-all">{status.endpoint}</div>
              <div>
                {snapshot
                  ? t("track.updated", { when: ago(snapshot.fetchedAt) })
                  : status.online
                    ? t("track.noData")
                    : t("track.offlineNoData")}
              </div>
              {status.pending > 0 && <div>{t("track.pending", { n: status.pending })}</div>}
              {!status.online && <div>{t("track.offline")}</div>}
              {status.lastError && status.online && <div>{t("track.error", { what: status.lastError })}</div>}
              <button
                onClick={refresh}
                disabled={busy}
                className="mt-2 rounded-full border border-ink/30 px-3 py-1 text-[0.65rem] font-bold text-ink transition hover:bg-cream disabled:opacity-40"
              >
                {busy ? t("track.refreshing") : t("track.refresh")}
              </button>
            </>
          ) : (
            <>
              <div className="font-bold text-ink">{t("track.off")}</div>
              <div>{t("track.off.how")}</div>
            </>
          )}
        </div>

        {status.enabled && totals.plays > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Tile label={t("track.tile.players")} value={`${totals.solvers}`} />
            <Tile label={t("track.tile.plays")} value={`${totals.plays}`} />
            <Tile label={t("track.tile.rate")} value={pct(totals.wins / totals.plays)} />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <h4 className="text-[0.6rem] font-bold uppercase tracking-widest text-ink-soft">
            {t("track.perLevel")}
          </h4>
          <div className="flex gap-1">
            {(["level", "hardest"] as Sort[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={sort === s}
                className={`rounded-full border px-2.5 py-1 text-[0.6rem] font-bold transition ${
                  sort === s ? "border-ink bg-ink text-paper" : "border-ink/30 text-ink hover:bg-cream"
                }`}
              >
                {t(`track.sort.${s}`)}
              </button>
            ))}
          </div>
        </div>

        {status.enabled && withData.length === 0 && (
          <p className="mt-2 text-[0.7rem] text-ink-soft">{t("track.thin", { n: MIN_SAMPLE })}</p>
        )}

        <div className="mt-2 divide-y divide-ink/10">
          {ordered.map((r) => (
            <div key={r.id} className="flex items-center gap-2 py-1.5">
              <span className="w-6 shrink-0 text-right font-display text-[0.7rem] font-bold tabular-nums text-ink-soft">
                {r.index + 1}
              </span>
              {/* Unsolved levels stay nameless: the title is a clue. */}
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
                {r.solved ? levelTitle(r.index) : t("track.unsolved")}
              </span>
              <span className="w-16 shrink-0 text-right text-[0.65rem] tabular-nums text-ink-soft">
                {r.community?.solvers
                  ? t("track.solvers", { n: r.community.solvers })
                  : r.mine
                    ? t("track.mine", { wins: r.mine.wins, plays: r.mine.plays })
                    : "—"}
              </span>
              <span className="w-9 shrink-0 text-right font-display text-[0.7rem] font-bold tabular-nums text-ink">
                {r.rate === null ? "—" : pct(r.rate)}
              </span>
              <span aria-hidden className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-ink/10">
                {r.rate !== null && (
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.round(r.rate * 100)}%`,
                      // Red end = a wall, green end = a breather. The colours
                      // are the level index's own, so the reading is familiar.
                      background: r.rate < 0.35 ? "var(--color-press)" : r.rate < 0.7 ? "var(--color-gold)" : "var(--color-leaf)",
                    }}
                  />
                )}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-ink py-3 text-sm font-bold text-paper transition hover:scale-[1.02] active:scale-95"
        >
          {t("common.done")}
        </button>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/20 bg-white px-2 py-2">
      <div className="font-display text-lg font-bold tabular-nums text-ink">{value}</div>
      <div className="text-[0.55rem] font-bold uppercase tracking-widest text-ink-soft">{label}</div>
    </div>
  );
}
