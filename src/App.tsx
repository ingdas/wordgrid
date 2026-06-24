import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LEVELS } from "./puzzles";
import {
  loadProgress,
  saveProgress,
  totalStars,
  clearedCount,
  MAX_STARS,
  type Progress,
} from "./progress";
import { initAudio, isMuted, setMuted } from "./audio";
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
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
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

  const play = useCallback(() => {
    initAudio(); // unlock the AudioContext from this user gesture
    setScreen("levels");
  }, []);

  const pickLevel = useCallback((index: number) => {
    setLevelIndex(index);
    setScreen("game");
  }, []);

  const handleWin = useCallback(
    (result: { stars: number; linkCorrect: boolean; timeMs: number }) => {
      setProgress((prev) => {
        const id = LEVELS[levelIndex].id;
        const bestStars = Math.max(prev.stars[id] ?? 0, result.stars);
        const streak = prev.streak + 1;
        const prevBestTime = prev.best[id];
        const next: Progress = {
          stars: { ...prev.stars, [id]: bestStars },
          streak,
          bestStreak: Math.max(prev.bestStreak, streak),
          linksGuessed: prev.linksGuessed + (result.linkCorrect ? 1 : 0),
          best: {
            ...prev.best,
            [id]: prevBestTime ? Math.min(prevBestTime, result.timeMs) : result.timeMs,
          },
        };
        saveProgress(next);
        return next;
      });
    },
    [levelIndex]
  );

  const handleLoss = useCallback(() => {
    setProgress((prev) => {
      const next = { ...prev, streak: 0 };
      saveProgress(next);
      return next;
    });
  }, []);

  const nextLevel = useCallback(() => {
    setLevelIndex((i) => Math.min(i + 1, LEVELS.length - 1));
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
              onHelp={() => setShowHelp(true)}
              muted={muted}
              onToggleMute={toggleMute}
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
              onWin={handleWin}
              onLoss={handleLoss}
              onExit={() => setScreen("levels")}
              onNext={levelIndex < LEVELS.length - 1 ? nextLevel : undefined}
              onHelp={() => setShowHelp(true)}
              onTutorialDone={finishTutorial}
            />
          </ScreenWrap>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        {showStats && <StatsModal progress={progress} onClose={() => setShowStats(false)} />}
      </AnimatePresence>
    </>
  );
}

function StatsModal({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const cleared = clearedCount(progress);
  const stats: [string, string][] = [
    ["Stars collected", `${totalStars(progress)} / ${MAX_STARS}`],
    ["Levels cleared", `${cleared} / ${LEVELS.length}`],
    ["Completion", `${Math.round((cleared / LEVELS.length) * 100)}%`],
    ["Links guessed", `${progress.linksGuessed}`],
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
        className="w-full max-w-sm rounded-3xl border border-white/12 bg-[#15122e] p-6 shadow-2xl"
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
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-white py-3 text-sm font-bold text-slate-900 transition hover:scale-[1.02] active:scale-95"
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
