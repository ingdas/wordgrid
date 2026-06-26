import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LEVELS, bossTwist } from "./puzzles";
import {
  loadProgress,
  saveProgress,
  totalStars,
  clearedCount,
  recordDaily,
  dailyIndex,
  pushHistory,
  MAX_STARS,
  type Progress,
} from "./progress";
import { initAudio, isMuted, setMuted, isMusicOn, setMusicOn, startMusic } from "./audio";
import { initSdk, gameplayStart, gameplayStop, happytime, showInterstitial } from "./sdk";
import {
  ACHIEVEMENTS,
  evaluateUnlocks,
  achievementStatus,
  TIER_NAMES,
  TIER_COLORS,
} from "./achievements";
import StartScreen from "./StartScreen";
import LevelSelect from "./LevelSelect";
import Game from "./Game";

type Screen = "home" | "levels" | "game";

export default function App() {
  const reduce = useReducedMotion() ?? false;
  const [screen, setScreen] = useState<Screen>("home");
  const [levelIndex, setLevelIndex] = useState(0);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [muted, setMutedState] = useState(() => isMuted());
  const [musicOn, setMusicOnState] = useState(() => isMusicOn());
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [playingDaily, setPlayingDaily] = useState(false);
  const [unlockedAch, setUnlockedAch] = useState<{ icon: string; label: string } | null>(null);

  useEffect(() => {
    if (!unlockedAch) return;
    const t = setTimeout(() => setUnlockedAch(null), 3200);
    return () => clearTimeout(t);
  }, [unlockedAch]);

  useEffect(() => {
    initSdk();
  }, []);
  // The interactive coached tutorial runs once, on the player's first level.
  const [tutorialPending, setTutorialPending] = useState(() => {
    try {
      return !localStorage.getItem("wordgrid:tutorial");
    } catch {
      return true;
    }
  });

  const finishTutorial = useCallback(() => {
    setTutorialPending(false);
    try {
      localStorage.setItem("wordgrid:tutorial", "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      const next = !m;
      setMuted(next);
      if (!next) initAudio();
      return next;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicOnState((m) => {
      const next = !m;
      setMusicOn(next); // also starts/stops the loop
      return next;
    });
  }, []);

  const play = useCallback(() => {
    initAudio(); // unlock the AudioContext from this user gesture
    startMusic(); // no-op unless music is enabled
    setScreen("levels");
  }, []);

  const pickLevel = useCallback((index: number) => {
    setPlayingDaily(false);
    setLevelIndex(index);
    setScreen("game");
    gameplayStart();
  }, []);

  const playDaily = useCallback(() => {
    initAudio();
    startMusic();
    setPlayingDaily(true);
    setLevelIndex(dailyIndex());
    setScreen("game");
    gameplayStart();
  }, []);

  const handleWin = useCallback(
    (result: { stars: number; linkCorrect: boolean; timeMs: number; mistakes: number; title: string }) => {
      happytime();
      setProgress((prev) => {
        const lvl = LEVELS[levelIndex];
        const id = lvl.id;
        const bestStars = Math.max(prev.stars[id] ?? 0, result.stars);
        const streak = prev.streak + 1;
        const prevBestTime = prev.best[id];
        let next: Progress = {
          ...prev,
          stars: { ...prev.stars, [id]: bestStars },
          streak,
          bestStreak: Math.max(prev.bestStreak, streak),
          linksGuessed: prev.linksGuessed + (result.linkCorrect ? 1 : 0),
          best: {
            ...prev.best,
            [id]: prevBestTime ? Math.min(prevBestTime, result.timeMs) : result.timeMs,
          },
          hints: prev.hints + 1, // earn a hint for clearing a level
        };
        if (playingDaily) next = recordDaily(next);
        // Tiered achievements: award newly-reached tiers + their hint rewards.
        const { unlocked, reward, keys } = evaluateUnlocks(next);
        if (unlocked.length) {
          next = {
            ...next,
            achievements: [...next.achievements, ...keys],
            hints: next.hints + reward,
          };
          const top = unlocked[unlocked.length - 1];
          setTimeout(
            () => setUnlockedAch({ icon: top.def.icon, label: `${TIER_NAMES[top.tier]} · ${top.def.title}` }),
            1800
          );
        }
        next = pushHistory(next, {
          at: Date.now(),
          id,
          level: levelIndex + 1,
          title: result.title,
          won: true,
          stars: result.stars,
          mistakes: result.mistakes,
          timeMs: result.timeMs,
          linkCorrect: result.linkCorrect,
          daily: playingDaily,
        });
        saveProgress(next);
        return next;
      });
    },
    [levelIndex, playingDaily]
  );

  const useHintToken = useCallback(() => {
    setProgress((prev) => {
      if (prev.hints <= 0) return prev;
      const next = { ...prev, hints: prev.hints - 1 };
      saveProgress(next);
      return next;
    });
  }, []);

  const handleLoss = useCallback(
    (result: { timeMs: number; mistakes: number; title: string }) => {
      setProgress((prev) => {
        const lvl = LEVELS[levelIndex];
        let next = { ...prev, streak: 0 };
        next = pushHistory(next, {
          at: Date.now(),
          id: lvl.id,
          level: levelIndex + 1,
          title: result.title,
          won: false,
          stars: 0,
          mistakes: result.mistakes,
          timeMs: result.timeMs,
          linkCorrect: false,
          daily: playingDaily,
        });
        saveProgress(next);
        return next;
      });
    },
    [levelIndex, playingDaily]
  );

  const nextLevel = useCallback(() => {
    showInterstitial(); // between-level ad break (no-op without the SDK)
    setLevelIndex((i) => Math.min(i + 1, LEVELS.length - 1));
    gameplayStart();
  }, []);

  const exitToLevels = useCallback(() => {
    gameplayStop();
    setScreen("levels");
  }, []);

  return (
    <>
      <div className="aurora" />
      <div className="grain" />

      <AnimatePresence mode="wait">
        {screen === "home" && (
          <ScreenWrap key="home">
            <StartScreen
              progress={progress}
              onPlay={play}
              onDaily={playDaily}
              onHelp={() => setShowHelp(true)}
              onStats={() => setShowStats(true)}
              onHistory={() => setShowHistory(true)}
              muted={muted}
              onToggleMute={toggleMute}
              musicOn={musicOn}
              onToggleMusic={toggleMusic}
            />
          </ScreenWrap>
        )}

        {screen === "levels" && (
          <ScreenWrap key="levels">
            <LevelSelect
              progress={progress}
              onPick={pickLevel}
              onHome={() => setScreen("home")}
              onHelp={() => setShowHelp(true)}
              onStats={() => setShowStats(true)}
              muted={muted}
              onToggleMute={toggleMute}
              musicOn={musicOn}
              onToggleMusic={toggleMusic}
            />
          </ScreenWrap>
        )}

        {screen === "game" && (
          <ScreenWrap key="game">
            <Game
              key={levelIndex}
              puzzleIndex={levelIndex}
              reduce={reduce}
              streak={progress.streak}
              tutorial={tutorialPending && levelIndex === 0}
              daily={playingDaily}
              twist={bossTwist(levelIndex)}
              bestMs={progress.best[LEVELS[levelIndex].id]}
              hintBank={progress.hints}
              onUseHint={useHintToken}
              onWin={handleWin}
              onLoss={handleLoss}
              onExit={exitToLevels}
              onNext={levelIndex < LEVELS.length - 1 ? nextLevel : undefined}
              onHelp={() => setShowHelp(true)}
              onTutorialDone={finishTutorial}
            />
          </ScreenWrap>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        {showStats && (
          <StatsModal
            progress={progress}
            onClose={() => setShowStats(false)}
            onHistory={() => {
              setShowStats(false);
              setShowHistory(true);
            }}
          />
        )}
        {showHistory && <HistoryModal progress={progress} onClose={() => setShowHistory(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {unlockedAch && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-[#1b1740]/95 px-4 py-2.5 shadow-2xl backdrop-blur">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 text-lg">
                {unlockedAch.icon}
              </span>
              <div className="text-left">
                <div className="text-[0.65rem] font-bold uppercase tracking-widest text-amber-300">
                  Achievement unlocked
                </div>
                <div className="text-sm font-bold text-white">{unlockedAch.label}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StatsModal({
  progress,
  onClose,
  onHistory,
}: {
  progress: Progress;
  onClose: () => void;
  onHistory: () => void;
}) {
  const cleared = clearedCount(progress);
  const stats: [string, string][] = [
    ["Stars collected", `${totalStars(progress)} / ${MAX_STARS}`],
    ["Levels cleared", `${cleared} / ${LEVELS.length}`],
    ["Completion", `${Math.round((cleared / LEVELS.length) * 100)}%`],
    ["Links guessed", `${progress.linksGuessed}`],
    ["Hints available", `💡 ${progress.hints}`],
    ["Current streak", `🔥 ${progress.streak}`],
    ["Best streak", `${progress.bestStreak}`],
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Your stats"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-3xl border border-white/12 bg-[#15122e] p-6 shadow-2xl"
      >
        <h3 className="font-display text-2xl font-bold text-white">Your stats</h3>
        <dl className="mt-4 divide-y divide-white/10">
          {stats.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-indigo-100/80">{k}</dt>
              <dd className="font-bold text-white">{v}</dd>
            </div>
          ))}
        </dl>

        {(() => {
          const earnedTiers = ACHIEVEMENTS.reduce((n, d) => n + achievementStatus(progress, d).tier + 1, 0);
          return (
            <h4 className="mt-5 text-sm font-bold uppercase tracking-widest text-indigo-300/80">
              Achievements {earnedTiers}/{ACHIEVEMENTS.length * 3}
            </h4>
          );
        })()}
        <div className="mt-3 space-y-2">
          {ACHIEVEMENTS.map((def) => {
            const { tier, value, nextThreshold } = achievementStatus(progress, def);
            const prevThreshold = tier >= 0 ? def.tiers[tier] : 0;
            const target = nextThreshold ?? def.tiers[2];
            const pct = nextThreshold
              ? Math.min(100, Math.round(((value - prevThreshold) / (target - prevThreshold)) * 100))
              : 100;
            return (
              <div key={def.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>{def.icon}</span>
                  <span className="flex-1 text-sm font-bold text-white">{def.title}</span>
                  {tier >= 0 ? (
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.6rem] font-extrabold uppercase"
                      style={{ background: `${TIER_COLORS[tier]}33`, color: TIER_COLORS[tier] }}
                    >
                      {TIER_NAMES[tier]}
                    </span>
                  ) : (
                    <span className="text-[0.6rem] font-semibold uppercase text-indigo-200/40">Locked</span>
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 text-[0.65rem] text-indigo-200/60">
                  {nextThreshold ? `${value} / ${nextThreshold} ${def.unit}` : `Maxed · ${value} ${def.unit}`}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onHistory}
          className="mt-5 w-full rounded-2xl border border-white/20 py-3 text-sm font-bold text-indigo-100 transition hover:bg-white/10"
        >
          📜 View play history
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-2xl bg-white py-3 text-sm font-bold text-slate-900 transition hover:scale-[1.02] active:scale-95"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

function relativeTime(at: number): string {
  const s = Math.floor((Date.now() - at) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

function HistoryModal({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Play history"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-sm flex-col rounded-3xl border border-white/12 bg-[#15122e] p-6 shadow-2xl"
      >
        <h3 className="font-display text-2xl font-bold text-white">Play history</h3>
        {progress.history.length === 0 ? (
          <p className="mt-6 text-center text-sm text-indigo-200/70">
            No games yet — your finished levels will appear here.
          </p>
        ) : (
          <ul className="mt-4 -mr-2 space-y-2 overflow-y-auto pr-2">
            {progress.history.map((h, i) => (
              <li
                key={`${h.at}-${i}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate font-bold text-white">
                    {h.daily && <span className="text-xs">📅</span>}
                    {/* A lost level's title spells the link, so keep it hidden until cleared. */}
                    {h.won ? h.title : <span className="text-indigo-200/70">🔒 Link still hidden</span>}
                  </div>
                  <div className="text-[0.7rem] text-indigo-200/60">
                    {h.daily ? "Daily" : `Level ${h.level}`} · {relativeTime(h.at)} · ⏱ {fmt(h.timeMs)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {h.won ? (
                    <div className="font-bold text-amber-300">
                      {"★".repeat(h.stars)}
                      <span className="text-white/20">{"★".repeat(3 - h.stars)}</span>
                    </div>
                  ) : (
                    <div className="font-bold text-rose-300">Missed</div>
                  )}
                  <div className="text-[0.7rem] text-indigo-200/60">{h.linkCorrect ? "🔑 link" : ""}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full shrink-0 rounded-2xl bg-white py-3 text-sm font-bold text-slate-900 transition hover:scale-[1.02] active:scale-95"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

function ScreenWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}

const STEPS = [
  {
    icon: "🔗",
    grad: "from-violet-400 to-fuchsia-400",
    title: "There's a secret link",
    body: "One hidden word belongs to every group. It stays masked at the top until the very end.",
  },
  {
    icon: "🔤",
    grad: "from-sky-400 to-cyan-300",
    title: "Group the words",
    body: "Tap three words that share a theme, then Submit. The hidden link joins them to make a group of four.",
  },
  {
    icon: "⭐",
    grad: "from-amber-300 to-orange-400",
    title: "Guess the link, earn stars",
    body: "Find all four groups (four mistakes allowed), then guess the secret word that links them all.",
  },
];

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="How to play"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-white/12 bg-[#15122e] p-6 shadow-2xl"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-lg text-white">
            <span aria-hidden>◆</span>
          </div>
          <h3 className="font-display text-2xl font-bold text-white">How to play</h3>
        </div>

        <div className="mt-5 space-y-3">
          {STEPS.map((s) => (
            <div key={s.title} className="flex gap-3 rounded-2xl bg-white/[0.05] p-3">
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.grad} text-xl shadow-lg`}
              >
                <span aria-hidden>{s.icon}</span>
              </div>
              <div>
                <div className="font-bold text-white">{s.title}</div>
                <p className="mt-0.5 text-sm leading-snug text-indigo-100/80">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-400 to-fuchsia-500 py-3.5 text-base font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-[1.02] active:scale-95"
        >
          Let's play
        </button>
      </motion.div>
    </motion.div>
  );
}
