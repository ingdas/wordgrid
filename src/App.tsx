import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LEVELS, CHAPTERS, bossTwist, chapterKey, chapterOfLevel, type BossTwist, type RawPuzzle } from "./puzzles";
import { DAILY_PUZZLES } from "./dailyPuzzles";
import {
  loadProgress,
  saveProgress,
  totalStars,
  clearedCount,
  recordDaily,
  dailyPuzzle,
  pushHistory,
  furthestCleared,
  endlessUnlocked,
  nextLevelIndex,
  markSeen,
  markBanked,
  keyLockedBoss,
  solveKey,
  todayKey,
  MAX_STARS,
  type Progress,
} from "./progress";
import { recordQuest, QUEST_SET_BONUS, COMBO_TARGET, type QuestDef, type QuestEvent } from "./quests";
import { isDebug, setDebug } from "./debug";
import { useModal } from "./modal";
import { readItem, writeItem, removeItem, startSdkMirror } from "./storage";
import { initAudio, isMuted, setMuted, isMusicOn, setMusicOn, startMusic, suspendAudio, resumeAudio } from "./audio";
import {
  initSdk,
  loadingStart,
  loadingStop,
  gameplayStart,
  gameplayStop,
  happytime,
  showInterstitial,
  requestRewarded,
} from "./sdk";
import { ACHIEVEMENTS, evaluateUnlocks, achievementStatus, TIER_COLORS } from "./achievements";
import { chapterPage } from "./theme";
import { LOCALES, getLocale, setLocale, t, type Locale } from "./i18n";
import StartScreen from "./StartScreen";
import LevelSelect from "./LevelSelect";
import Game from "./Game";
import { BossRules } from "./BossBriefing";
import Pairs from "./Pairs";
import Deduction from "./Deduction";

type Screen = "home" | "levels" | "game" | "pairs" | "deduction";

/**
 * What the win card's "Next" button should say. Most players never open the
 * map between levels, so without this the reward for clearing a boss or
 * finishing a chapter is the same grey "Next level →" as every other win.
 * Plain levels keep the plain label — the teaser only means something if it
 * isn't on every card.
 */
function nextLevelTeaser(index: number): string | undefined {
  if (index >= LEVELS.length) return undefined;
  const chapter = CHAPTERS.findIndex((c) => c.start === index);
  if (chapter >= 0) return t("end.next.chapter", { name: t(CHAPTERS[chapter].nameKey) });
  const twist = bossTwist(index);
  if (twist) return t("end.next.boss", { what: t(`twist.${twist}.short`) });
  return undefined;
}

/** Which of today's quests a finished word board moves along. */
function winEvents(
  result: { mistakes: number; linkCorrect: boolean; maxCombo: number },
  daily: boolean
): QuestEvent[] {
  const events: QuestEvent[] = ["solve"];
  if (result.mistakes === 0) events.push("perfect");
  if (result.linkCorrect) events.push("link");
  if (result.maxCombo >= COMBO_TARGET) events.push("combo");
  if (daily) events.push("daily");
  return events;
}

const noop = () => {};

const CALM_KEY = "wordgrid:calm";
const readCalm = () => readItem(CALM_KEY) === "1";

export default function App() {
  const systemReduce = useReducedMotion() ?? false;
  const [calm, setCalm] = useState(readCalm);
  const reduce = systemReduce || calm; // calm mode = no confetti / minimal motion
  // The interactive coached tutorial runs once, on the player's first level.
  const [tutorialPending, setTutorialPending] = useState(() => !readItem("wordgrid:tutorial"));
  // First-ever launch drops straight into the tutorial level rather than the
  // menu, so a new player is playing within seconds.
  const startedInGame = useRef(tutorialPending).current;
  const [screen, setScreen] = useState<Screen>(startedInGame ? "game" : "home");
  const [levelIndex, setLevelIndex] = useState(0);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  // t() reads a module-level locale, so the switch has to force a re-render:
  // the whole tree is keyed on it below.
  const [locale, setLocaleState] = useState<Locale>(() => getLocale());
  const changeLocale = useCallback((next: Locale) => {
    setLocale(next);
    setLocaleState(next);
  }, []);
  // Debug mode. The flag lives in localStorage (and answers to `?debug`), but
  // it's mirrored in state so flipping it in Settings re-renders the tree —
  // the level gating, the hint bank and the tool panels all read it.
  const [debug, setDebugState] = useState(() => isDebug());
  const toggleDebug = useCallback(() => {
    setDebugState((d) => {
      const next = !d;
      setDebug(next);
      return next;
    });
  }, []);
  const [muted, setMutedState] = useState(() => isMuted());
  const [musicOn, setMusicOnState] = useState(() => isMusicOn());
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playingDaily, setPlayingDaily] = useState(false);
  // Today's puzzle from the dedicated daily pool, captured when Play is hit so
  // a session that crosses midnight finishes the puzzle it started.
  const [dailyRaw, setDailyRaw] = useState<RawPuzzle | null>(null);
  const [unlockedAch, setUnlockedAch] = useState<{ icon: string; label: string; header?: string } | null>(null);
  // No durable storage anywhere (no localStorage, no platform data module):
  // this session's progress dies with the tab, and saying so is the least the
  // game owes a player about to spend an hour on it.
  const [storageWarn, setStorageWarn] = useState(false);

  useEffect(() => {
    if (!unlockedAch) return;
    const t = setTimeout(() => setUnlockedAch(null), 3200);
    return () => clearTimeout(t);
  }, [unlockedAch]);

  useEffect(() => {
    loadingStart();
    // The bundle is already parsed by the time React mounts, so loading is
    // effectively done here — tell the platform we're interactive.
    loadingStop();
    let stopMirror: (() => void) | undefined;
    void initSdk().then(() => {
      // Once the platform is up, reconcile the save with its data module: the
      // embed's own localStorage can be partitioned away between visits, and
      // that store is the copy that survives it. See src/storage.ts.
      stopMirror = startSdkMirror(
        () => {
          // A save came back from the platform that this session didn't have.
          const restored = loadProgress();
          progressRef.current = restored;
          setProgress(restored);
          setUnlockedAch({ icon: "💾", header: t("storage.restored"), label: t("storage.restored.body") });
        },
        (durable) => setStorageWarn(!durable)
      );
    });
    return () => stopMirror?.();
  }, []);

  // Platform QA: pause the session + audio when the tab/iframe is hidden.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        gameplayStop();
        suspendAudio();
      } else {
        resumeAudio();
        if (screen === "game") gameplayStart();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [screen]);

  // On a direct-to-game first launch, start the SDK gameplay session and unlock
  // audio on the player's first tap (there's no Play button gesture to do it).
  useEffect(() => {
    if (!startedInGame) return;
    gameplayStart();
    const unlock = () => {
      initAudio();
      startMusic();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [startedInGame]);

  // Every progress write goes through here. The updater passed to useState
  // must stay pure — React 19 StrictMode double-invokes it in development, so
  // saving, awarding achievements and firing toasts from inside it ran them
  // twice. A ref holds the live value so the new state can be computed (and
  // its side effects run) in the handler, exactly once, and consecutive calls
  // in one tick still see each other's result.
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const applyProgress = useCallback((mutate: (prev: Progress) => Progress) => {
    const prev = progressRef.current;
    const next = mutate(prev);
    if (next === prev) return { prev, next };
    progressRef.current = next;
    saveProgress(next);
    setProgress(next);
    return { prev, next };
  }, []);

  /** Points earned outside the campaign — Endless, Pairs, the logic grid. */
  const awardScore = useCallback(
    (points: number) => {
      applyProgress((p) => ({ ...p, score: p.score + points }));
    },
    [applyProgress]
  );

  /**
   * Raise today's quest events for one finished board, and pay out anything
   * they completed.
   *
   * Batched on purpose: a single clean win can satisfy "solve 2", "no
   * mistakes" and "name the link" at once, and three toasts stacking on top of
   * the win card would bury the win itself. One toast, the set bonus if it
   * landed, and the hints go into the bank either way.
   */
  const questEvents = useCallback(
    (events: QuestEvent[]) => {
      const date = todayKey();
      let state = progressRef.current.quests;
      const completed: QuestDef[] = [];
      let reward = 0;
      let setDone = false;
      for (const event of events) {
        const out = recordQuest(state, event, date);
        state = out.state;
        completed.push(...out.completed);
        reward += out.reward;
        setDone = setDone || out.setDone;
      }
      applyProgress((p) => ({ ...p, quests: state, hints: p.hints + reward }));
      if (!completed.length) return;
      const first = completed[0];
      // After the win card has landed and after any achievement toast (1800ms).
      setTimeout(
        () =>
          setUnlockedAch({
            icon: setDone ? "🎁" : first.icon,
            header: setDone ? t("quest.set") : t("quest.complete"),
            label: setDone ? t("quest.set.body", { n: QUEST_SET_BONUS }) : t(first.titleKey, { n: first.goal }),
          }),
        3200
      );
    },
    [applyProgress]
  );

  const finishTutorial = useCallback(() => {
    setTutorialPending(false);
    writeItem("wordgrid:tutorial", "1");
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

  const toggleCalm = useCallback(() => {
    setCalm((c) => {
      const next = !c;
      writeItem(CALM_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    removeItem("wordgrid:progress");
    const fresh = loadProgress();
    progressRef.current = fresh; // keep the write path's view in sync
    setProgress(fresh);
    setShowSettings(false);
    setScreen("home");
  }, []);

  // Home's primary CTA promised a level ("Continue · L6") and delivered the
  // map, so playing cost two taps. It now drops straight into that level; the
  // map is a link of its own underneath.
  const play = useCallback(() => {
    initAudio(); // unlock the AudioContext from this user gesture
    startMusic(); // no-op unless music is enabled
    setPlayingDaily(false);
    setEndless(false);
    setLevelIndex(Math.min(furthestCleared(progress) + 1, LEVELS.length - 1));
    setScreen("game");
    gameplayStart();
  }, [progress]);

  const openLevels = useCallback(() => {
    initAudio();
    startMusic();
    setScreen("levels");
  }, []);

  // The map has finished showing which levels just opened and which letters
  // just landed on a chapter's rail; neither replays on the next visit.
  const markLevelsSeen = useCallback(() => {
    applyProgress((p) => markBanked(markSeen(p)));
  }, [applyProgress]);

  // A chapter key was spelled: its boss door opens, and the effort pays out in
  // points plus a couple of hints.
  const solveChapterKey = useCallback(
    (chapter: number) => {
      const { prev, next } = applyProgress((p) =>
        p.keys.includes(chapter) ? p : { ...solveKey(p, chapter), score: p.score + 500, hints: p.hints + 2 }
      );
      if (next === prev) return;
      happytime();
      // The keyword itself is the trophy — it is content, not a catalogue key.
      setUnlockedAch({ icon: "🔑", header: t("key.unlocked"), label: chapterKey(chapter) });
    },
    [applyProgress]
  );

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
    setDailyRaw(dailyPuzzle());
    setScreen("game");
    gameplayStart();
  }, []);

  const handleWin = useCallback(
    (result: {
      stars: number;
      linkCorrect: boolean;
      timeMs: number;
      mistakes: number;
      title: string;
      score: number;
      maxCombo: number;
    }) => {
      happytime();
      // The daily plays from its own pool: it feeds streaks/score/history but
      // never writes campaign stars or best times (its ids aren't levels).
      const id = playingDaily ? dailyRaw?.id ?? "daily" : LEVELS[levelIndex].id;
      let unlocked: ReturnType<typeof evaluateUnlocks>["unlocked"] = [];
      applyProgress((p) => {
        const streak = p.streak + 1;
        const prevBestTime = p.best[id];
        let acc: Progress = {
          ...p,
          stars: playingDaily ? p.stars : { ...p.stars, [id]: Math.max(p.stars[id] ?? 0, result.stars) },
          streak,
          bestStreak: Math.max(p.bestStreak, streak),
          linksGuessed: p.linksGuessed + (result.linkCorrect ? 1 : 0),
          best: playingDaily
            ? p.best
            : { ...p.best, [id]: prevBestTime ? Math.min(prevBestTime, result.timeMs) : result.timeMs },
          hints: p.hints + 1, // earn a hint for clearing a level
          score: p.score + result.score, // lifetime points
        };
        if (playingDaily) acc = recordDaily(acc);
        // Tiered achievements: award newly-reached tiers + their hint rewards.
        const earned = evaluateUnlocks(acc);
        unlocked = earned.unlocked;
        if (earned.unlocked.length) {
          acc = { ...acc, achievements: [...acc.achievements, ...earned.keys], hints: acc.hints + earned.reward };
        }
        return pushHistory(acc, {
          at: Date.now(),
          id,
          level: playingDaily ? 0 : levelIndex + 1,
          title: result.title,
          won: true,
          stars: result.stars,
          mistakes: result.mistakes,
          timeMs: result.timeMs,
          linkCorrect: result.linkCorrect,
          daily: playingDaily,
        });
      });
      if (unlocked.length) {
        const top = unlocked[unlocked.length - 1];
        setTimeout(
          () => setUnlockedAch({ icon: top.def.icon, label: `${t(`ach.tier.${top.tier}`)} · ${t(top.def.titleKey)}` }),
          1800
        );
      }
      questEvents(winEvents(result, playingDaily));
    },
    [levelIndex, playingDaily, dailyRaw, applyProgress, questEvents]
  );

  // Debug mode plays with an unlimited bank, so a hint spent there costs
  // nothing — otherwise testing the hints is what empties them.
  const useHintToken = useCallback(() => {
    if (debug) return;
    applyProgress((p) => (p.hints <= 0 ? p : { ...p, hints: p.hints - 1 }));
  }, [applyProgress, debug]);

  /** Debug: drop a handful of hints straight into the bank. */
  const grantHints = useCallback(
    (n: number) => {
      applyProgress((p) => ({ ...p, hints: p.hints + n }));
    },
    [applyProgress]
  );

  /**
   * Debug: mark a campaign level cleared at three stars, exactly as a real win
   * would leave it — so the letters, the unlock reveals and the chapter keys
   * all behave the way they do for a player who actually solved it.
   */
  const debugClearLevel = useCallback(
    (index: number) => {
      const id = LEVELS[index]?.id;
      if (!id) return;
      applyProgress((p) => ({ ...p, stars: { ...p.stars, [id]: Math.max(p.stars[id] ?? 0, 3) } }));
    },
    [applyProgress]
  );

  // Rewarded refill: an empty hint bank offers "watch an ad → +3 hints".
  const refillHints = useCallback(async (): Promise<boolean> => {
    const ok = await requestRewarded();
    if (!ok) return false;
    applyProgress((p) => ({ ...p, hints: p.hints + 3 }));
    return true;
  }, [applyProgress]);

  const handleLoss = useCallback(
    (result: { timeMs: number; mistakes: number; title: string }) => {
      applyProgress((p) =>
        pushHistory({ ...p, streak: 0 }, {
          at: Date.now(),
          id: playingDaily ? dailyRaw?.id ?? "daily" : LEVELS[levelIndex].id,
          level: playingDaily ? 0 : levelIndex + 1,
          title: result.title,
          won: false,
          stars: 0,
          mistakes: result.mistakes,
          timeMs: result.timeMs,
          linkCorrect: false,
          daily: playingDaily,
        })
      );
    },
    [levelIndex, playingDaily, dailyRaw, applyProgress]
  );

  // Where "Next" leads from the campaign level being played. Read from live
  // progress — the win that opened the card is already recorded by the time
  // this renders, so a replayed level counts as cleared here and is skipped
  // like any other. (Endless and the daily have their own Next; they ignore it.)
  const nextIndex = nextLevelIndex(progress, levelIndex);

  const nextLevel = useCallback(() => {
    if (nextIndex === null) return;
    showInterstitial(); // between-level ad break (no-op without the SDK)
    setLevelIndex(nextIndex);
    gameplayStart();
  }, [nextIndex]);

  const exitToLevels = useCallback(() => {
    gameplayStop();
    setScreen("levels");
  }, []);

  const exitToHome = useCallback(() => {
    gameplayStop();
    setScreen("home");
  }, []);

  // --- Endless / Zen mode ------------------------------------------------
  // Endless draws from the campaign AND the daily pool, so it's roughly twice
  // as deep as the level map and keeps serving fresh boards for a long run.
  const ENDLESS_POOL = useRef<RawPuzzle[]>([...LEVELS, ...DAILY_PUZZLES]).current;
  const [endless, setEndless] = useState(false);
  const endlessQueue = useRef<number[]>([]);
  const [endlessPos, setEndlessPos] = useState(0);
  const [endlessSolved, setEndlessSolved] = useState(0);
  const [endlessScore, setEndlessScore] = useState(0);

  const shuffleQueue = () => {
    const q = [...Array(ENDLESS_POOL.length).keys()];
    for (let i = q.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [q[i], q[j]] = [q[j], q[i]];
    }
    return q;
  };

  const playEndless = useCallback(() => {
    // The tile is already disabled while the campaign is unfinished; this is the
    // same rule at the door, so no other caller can slip into Endless early.
    if (!endlessUnlocked(progress)) return;
    initAudio();
    startMusic();
    endlessQueue.current = shuffleQueue();
    setEndlessPos(0);
    setEndlessSolved(0);
    setEndlessScore(0);
    setPlayingDaily(false);
    setEndless(true);
    setScreen("game");
    gameplayStart();
  }, [progress]);

  const handleEndlessWin = useCallback(
    (result: { score: number; mistakes: number; linkCorrect: boolean; maxCombo: number }) => {
      happytime();
      setEndlessSolved((n) => n + 1);
      setEndlessScore((s) => s + result.score);
      awardScore(result.score);
      // An Endless board is a solved board: it counts for today's quests too,
      // minus the daily one (it isn't the daily).
      questEvents(winEvents(result, false));
    },
    [awardScore, questEvents]
  );

  const nextEndless = useCallback(() => {
    showInterstitial();
    setEndlessPos((pos) => {
      let np = pos + 1;
      if (np >= endlessQueue.current.length) {
        endlessQueue.current = shuffleQueue();
        np = 0;
      }
      return np;
    });
    gameplayStart();
  }, []);

  // --- Pairs (memory) mode -------------------------------------------------
  const playPairs = useCallback(() => {
    initAudio();
    startMusic();
    setPlayingDaily(false);
    setScreen("pairs");
    gameplayStart();
  }, []);

  const exitPairs = useCallback(() => {
    gameplayStop();
    setScreen("home");
  }, []);

  // --- Deduction Grid mode -------------------------------------------------
  const playDeduction = useCallback(() => {
    initAudio();
    startMusic();
    setPlayingDaily(false);
    setScreen("deduction");
    gameplayStart();
  }, []);

  const exitDeduction = useCallback(() => {
    gameplayStop();
    setScreen("home");
  }, []);

  const handleDeductionSolve = useCallback(
    (id: string) => {
      happytime();
      applyProgress((p) =>
        p.deductionSolved.includes(id)
          ? p
          : {
              ...p,
              deductionSolved: [...p.deductionSolved, id],
              score: p.score + 500, // a solved logic grid is worth a chunk of points
            }
      );
      questEvents(["logic"]);
    },
    [applyProgress, questEvents]
  );

  // Each cleared Pairs board feeds lifetime score and the fewest-moves best.
  const handlePairsFinish = useCallback(
    (result: { moves: number; score: number }) => {
      happytime();
      applyProgress((p) => ({
        ...p,
        score: p.score + result.score,
        pairsBest: p.pairsBest === 0 ? result.moves : Math.min(p.pairsBest, result.moves),
      }));
      questEvents(["pairs"]);
    },
    [applyProgress, questEvents]
  );

  const exitEndless = useCallback(() => {
    gameplayStop();
    applyProgress((p) => (endlessSolved <= p.endlessBest ? p : { ...p, endlessBest: endlessSolved }));
    setEndless(false);
    setScreen("home");
  }, [endlessSolved, applyProgress]);

  // Playing a campaign level stains the page with that chapter's paper stock,
  // so chapter 6 doesn't look like chapter 1. The daily, Endless, Pairs and
  // every menu keep the plain cream — the stain means "you are in chapter N",
  // and it would say nothing if it were everywhere.
  const page =
    screen === "game" && !playingDaily && !endless ? chapterPage(chapterOfLevel(levelIndex)) : null;

  // Is the level Next would take you to a boss still shut behind its chapter key?
  const nextIsSealed =
    !endless && !playingDaily && nextIndex !== null && keyLockedBoss(progress, nextIndex);

  return (
    <div key={locale} className="contents">
      <div
        className="aurora"
        style={
          page
            ? ({ "--page-paper": page.paper, "--page-glow": page.glow } as React.CSSProperties)
            : undefined
        }
      />
      <div className="grain" />

      <AnimatePresence mode="wait">
        {screen === "home" && (
          <ScreenWrap key="home">
            <StartScreen
              progress={progress}
              onPlay={play}
              onLevels={openLevels}
              onDaily={playDaily}
              onEndless={playEndless}
              onPairs={playPairs}
              onDeduction={playDeduction}
              onHelp={() => setShowHelp(true)}
              onStats={() => setShowStats(true)}
              onHistory={() => setShowHistory(true)}
              onSettings={() => setShowSettings(true)}
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
              reduce={reduce}
              debug={debug}
              onPick={pickLevel}
              onSeen={markLevelsSeen}
              onSolveKey={solveChapterKey}
              onDebugClear={debugClearLevel}
              onDebugHints={() => grantHints(10)}
              hints={progress.hints}
              onUseHint={useHintToken}
              onRefillHints={refillHints}
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

        {screen === "pairs" && (
          <ScreenWrap key="pairs">
            <Pairs
              reduce={reduce}
              best={progress.pairsBest}
              onFinish={handlePairsFinish}
              onExit={exitPairs}
            />
          </ScreenWrap>
        )}

        {screen === "deduction" && (
          <ScreenWrap key="deduction">
            <Deduction
              reduce={reduce}
              debug={debug}
              solvedIds={progress.deductionSolved}
              onSolve={handleDeductionSolve}
              onExit={exitDeduction}
            />
          </ScreenWrap>
        )}

        {screen === "game" && (
          <ScreenWrap key="game">
            <Game
              key={endless ? `e${endlessPos}` : playingDaily ? `d-${dailyRaw?.id}` : levelIndex}
              puzzleIndex={levelIndex}
              overrideRaw={
                endless
                  ? ENDLESS_POOL[endlessQueue.current[endlessPos] ?? 0]
                  : playingDaily
                    ? dailyRaw ?? undefined
                    : undefined
              }
              reduce={reduce}
              streak={progress.streak}
              tutorial={!endless && !playingDaily && tutorialPending && levelIndex === 0}
              daily={playingDaily}
              endless={endless}
              endlessInfo={endless ? { solved: endlessSolved, score: endlessScore, best: progress.endlessBest } : undefined}
              twist={endless || playingDaily ? null : bossTwist(levelIndex)}
              // A boss you've already beaten doesn't re-brief you on the way
              // in — you know what it does; the rule strip is there if not.
              bossBeaten={!endless && !playingDaily && (progress.stars[LEVELS[levelIndex].id] ?? 0) > 0}
              bestMs={endless || playingDaily ? undefined : progress.best[LEVELS[levelIndex].id]}
              hintBank={progress.hints}
              debug={debug}
              onDebugHints={() => grantHints(5)}
              onUseHint={useHintToken}
              onRefillHints={refillHints}
              onWin={endless ? handleEndlessWin : handleWin}
              onLoss={endless ? noop : handleLoss}
              onExit={endless ? exitEndless : playingDaily ? exitToHome : exitToLevels}
              // "Next level" used to walk straight into the level after this
              // one — including a boss whose door is still sealed, which made
              // the chapter key skippable and the door decorative. When the
              // next level is that boss, the button goes to the map instead,
              // where the rail and the door are waiting.
              onNext={
                endless
                  ? nextEndless
                  : playingDaily
                    ? undefined
                    : nextIndex === null
                      ? undefined
                      : nextIsSealed
                        ? exitToLevels
                        : nextLevel
              }
              nextLabel={
                endless || playingDaily || nextIndex === null
                  ? undefined
                  : nextIsSealed
                    ? t("end.next.sealed")
                    : // Skipping cleared levels lands somewhere the player
                      // isn't expecting, so the button says where — unless the
                      // teaser already has something better to announce.
                      nextLevelTeaser(nextIndex) ??
                      (nextIndex > levelIndex + 1
                        ? t("end.next.resume", { n: nextIndex + 1 })
                        : undefined)
              }
              onHelp={() => setShowHelp(true)}
              onTutorialDone={finishTutorial}
            />
          </ScreenWrap>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <HelpModal
            // Asked for help mid-boss, the sheet answers about *this* boss
            // first: the three ordinary steps aren't what stopped them.
            twist={screen === "game" && !endless && !playingDaily ? bossTwist(levelIndex) : null}
            onClose={() => setShowHelp(false)}
          />
        )}
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
        {showSettings && (
          <SettingsModal
            muted={muted}
            musicOn={musicOn}
            calm={calm}
            debug={debug}
            onToggleMute={toggleMute}
            onToggleMusic={toggleMusic}
            onToggleCalm={toggleCalm}
            onToggleDebug={toggleDebug}
            onLocale={changeLocale}
            onReset={resetProgress}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {unlockedAch && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-gold/60 bg-paper px-4 py-2.5 shadow-stamp-lg">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-lg">
                {unlockedAch.icon}
              </span>
              <div className="text-left">
                <div className="text-[0.65rem] font-bold uppercase tracking-widest text-gold-deep">
                  {unlockedAch.header ?? t("achievement.unlocked")}
                </div>
                <div className="text-sm font-bold text-ink">{unlockedAch.label}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nothing here will outlive the tab. Said once, quietly, at the bottom —
          it's a warning, not a modal, and the game plays fine either way. */}
      <AnimatePresence>
        {storageWarn && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            role="status"
            className="fixed inset-x-0 bottom-3 z-[55] flex justify-center px-4"
          >
            <div className="flex max-w-sm items-start gap-3 rounded-2xl border-2 border-press bg-paper px-4 py-3 shadow-stamp-lg">
              <span className="text-lg" aria-hidden>⚠️</span>
              <div className="text-left">
                <div className="text-sm font-bold text-ink">{t("storage.warn.title")}</div>
                <p className="mt-0.5 text-[0.7rem] leading-snug text-ink-soft">{t("storage.warn.body")}</p>
              </div>
              <button
                onClick={() => setStorageWarn(false)}
                className="shrink-0 rounded-full border border-ink/30 px-3 py-1 text-[0.65rem] font-bold text-ink transition hover:bg-cream"
              >
                {t("common.dismiss")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const panel = useModal<HTMLDivElement>(onClose);
  const cleared = clearedCount(progress);
  const stats: [string, string][] = [
    [t("stats.score"), `✦ ${progress.score.toLocaleString()}`],
    [t("stats.stars"), `${totalStars(progress)} / ${MAX_STARS}`],
    [t("stats.cleared"), `${cleared} / ${LEVELS.length}`],
    [t("stats.completion"), `${Math.round((cleared / LEVELS.length) * 100)}%`],
    [t("stats.links"), `${progress.linksGuessed}`],
    [t("stats.hints"), `💡 ${progress.hints}`],
    [t("stats.streak"), `🔥 ${progress.streak}`],
    [t("stats.bestStreak"), `${progress.bestStreak}`],
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("stats.title")}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        ref={panel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-3xl border-2 border-ink bg-paper p-6 shadow-stamp-lg"
      >
        <h3 className="font-display text-2xl font-bold text-ink">{t("stats.title")}</h3>
        <dl className="mt-4 divide-y divide-ink/15">
          {stats.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-ink-soft">{k}</dt>
              <dd className="font-bold text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        {(() => {
          const earnedTiers = ACHIEVEMENTS.reduce((n, d) => n + achievementStatus(progress, d).tier + 1, 0);
          return (
            <h4 className="mt-5 text-sm font-bold uppercase tracking-widest text-ink-soft">
              {t("stats.achievements", { earned: earnedTiers, total: ACHIEVEMENTS.length * 3 })}
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
            const remaining = nextThreshold ? nextThreshold - value : 0;
            const almost = nextThreshold != null && remaining > 0 && remaining <= Math.max(1, Math.ceil(nextThreshold * 0.15));
            return (
              <div key={def.id} className="rounded-2xl border border-ink/20 bg-white p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>{def.icon}</span>
                  <span className="flex-1 text-sm font-bold text-ink">{t(def.titleKey)}</span>
                  {tier >= 0 ? (
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.6rem] font-extrabold uppercase"
                      style={{ background: `${TIER_COLORS[tier]}33`, color: TIER_COLORS[tier] }}
                    >
                      {t(`ach.tier.${tier}`)}
                    </span>
                  ) : (
                    <span className="text-[0.6rem] font-semibold uppercase text-ink-soft">{t("stats.locked")}</span>
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[0.65rem]">
                  <span className="text-ink-soft">
                    {nextThreshold
                      ? t("stats.progress", { value, target: nextThreshold, unit: t(def.unitKey) })
                      : t("stats.maxed", { value, unit: t(def.unitKey) })}
                  </span>
                  {almost && (
                    <span className="font-bold text-gold-deep">
                      {t("stats.almost", { n: remaining, tier: t(`ach.tier.${tier + 1}`) })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onHistory}
          className="mt-5 w-full rounded-2xl border border-ink/30 py-3 text-sm font-bold text-ink transition hover:bg-cream"
        >
          {t("stats.viewHistory")}
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-2xl bg-ink py-3 text-sm font-bold text-paper transition hover:scale-[1.02] active:scale-95"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

function relativeTime(at: number): string {
  const s = Math.floor((Date.now() - at) / 1000);
  if (s < 60) return t("history.justNow");
  const m = Math.floor(s / 60);
  if (m < 60) return t("history.minutes", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("history.hours", { n: h });
  const d = Math.floor(h / 24);
  return d === 1 ? t("history.yesterday") : t("history.days", { n: d });
}

function HistoryModal({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const panel = useModal<HTMLDivElement>(onClose);
  const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("history.title")}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        ref={panel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-sm flex-col rounded-3xl border-2 border-ink bg-paper p-6 shadow-stamp-lg"
      >
        <h3 className="font-display text-2xl font-bold text-ink">{t("history.title")}</h3>
        {progress.history.length === 0 ? (
          <p className="mt-6 text-center text-sm text-ink-soft">
            {t("history.empty")}
          </p>
        ) : (
          <ul className="mt-4 -mr-2 space-y-2 overflow-y-auto pr-2">
            {progress.history.map((h, i) => (
              <li
                key={`${h.at}-${i}`}
                className="flex items-center justify-between rounded-2xl border border-ink/20 bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate font-bold text-ink">
                    {h.daily && <span className="text-xs">📅</span>}
                    {/* A lost level's title spells the link, so keep it hidden until cleared. */}
                    {h.won ? h.title : <span className="text-ink-soft">{t("history.hidden")}</span>}
                  </div>
                  <div className="text-[0.7rem] text-ink-soft">
                    {h.daily ? t("history.daily") : t("history.level", { n: h.level })} · {relativeTime(h.at)} · ⏱{" "}
                    {fmt(h.timeMs)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {h.won ? (
                    <div className="font-bold text-gold-deep">
                      {"★".repeat(h.stars)}
                      <span className="text-ink/20">{"★".repeat(3 - h.stars)}</span>
                    </div>
                  ) : (
                    <div className="font-bold text-press">{t("history.missed")}</div>
                  )}
                  <div className="text-[0.7rem] text-ink-soft">{h.linkCorrect ? "🔑 link" : ""}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full shrink-0 rounded-2xl bg-ink py-3 text-sm font-bold text-paper transition hover:scale-[1.02] active:scale-95"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

function ToggleRow({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="text-sm font-bold text-ink">{label}</div>
        <div className="text-[0.7rem] text-ink-soft">{hint}</div>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-leaf" : "bg-ink/15"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-stamp-sm transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

function SettingsModal({
  muted,
  musicOn,
  calm,
  debug,
  onToggleMute,
  onToggleMusic,
  onToggleCalm,
  onToggleDebug,
  onLocale,
  onReset,
  onClose,
}: {
  muted: boolean;
  musicOn: boolean;
  calm: boolean;
  debug: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onToggleCalm: () => void;
  onToggleDebug: () => void;
  onLocale: (l: Locale) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const panel = useModal<HTMLDivElement>(onClose);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("settings.title")}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        ref={panel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border-2 border-ink bg-paper p-6 shadow-stamp-lg"
      >
        <h3 className="font-display text-2xl font-bold text-ink">{t("settings.title")}</h3>
        <div className="mt-3 divide-y divide-ink/15">
          <ToggleRow label={t("settings.sfx")} hint={t("settings.sfx.hint")} on={!muted} onToggle={onToggleMute} />
          <ToggleRow label={t("settings.music")} hint={t("settings.music.hint")} on={musicOn} onToggle={onToggleMusic} />
          <ToggleRow label={t("settings.calm")} hint={t("settings.calm.hint")} on={calm} onToggle={onToggleCalm} />
          <div className="py-3">
            <div className="text-sm font-bold text-ink">{t("settings.language")}</div>
            <div className="text-[0.7rem] text-ink-soft">{t("settings.language.hint")}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {LOCALES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onLocale(l.id)}
                  aria-pressed={getLocale() === l.id}
                  className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${
                    getLocale() === l.id ? "border-ink bg-ink text-paper" : "border-ink/30 text-ink hover:bg-cream"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Developer tools. Off by default and last on the page, but a real
            switch rather than a URL you have to remember: it's the same flag
            `?debug` sets, so everything downstream behaves identically. */}
        <div className="mt-4 border-t border-dashed border-ink/20 pt-1">
          <div className="pt-2 text-[0.6rem] font-bold uppercase tracking-widest text-ink-soft">
            {t("settings.developer")}
          </div>
          <ToggleRow
            label={t("settings.debug")}
            hint={t("settings.debug.hint")}
            on={debug}
            onToggle={onToggleDebug}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-press/30 bg-press/5 p-3">
          {confirm ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-press">{t("settings.reset.confirm")}</p>
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={() => setConfirm(false)}
                  className="rounded-full border border-ink/30 px-4 py-2 text-xs font-bold text-ink transition hover:bg-cream"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={onReset}
                  className="rounded-full bg-press px-4 py-2 text-xs font-bold text-paper transition hover:bg-press-deep active:scale-95"
                >
                  {t("settings.reset.yes")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="w-full text-sm font-bold text-press transition hover:text-press"
            >
              {t("settings.reset")}
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-2xl bg-ink py-3 text-sm font-bold text-paper transition hover:scale-[1.02] active:scale-95"
        >
          {t("common.done")}
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
  { icon: "🔗", grad: "from-[#c5a3e8] to-[#b48fd9]", key: "help.step1" },
  { icon: "🔤", grad: "from-[#7cc0e8] to-[#5eb0e0]", key: "help.step2" },
  { icon: "⭐", grad: "from-[#f2b544] to-[#eda820]", key: "help.step3" },
];

function HelpModal({ twist, onClose }: { twist?: BossTwist | null; onClose: () => void }) {
  const panel = useModal<HTMLDivElement>(onClose);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("help.title")}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        ref={panel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        // Mid-boss the sheet carries the boss's rules on top of the three
        // steps, which is taller than a phone — so it scrolls.
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-ink bg-paper p-6 shadow-stamp-lg"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-press text-lg text-paper">
            <span aria-hidden>◆</span>
          </div>
          <h3 className="font-display text-2xl font-bold text-ink">{t("help.title")}</h3>
        </div>

        {twist && (
          <div className="mt-5 rounded-2xl border-2 border-ink bg-ink/5 p-3">
            <div className="flex items-baseline gap-1.5">
              <span aria-hidden>👑</span>
              <span className="text-[0.6rem] font-extrabold uppercase tracking-[0.2em] text-press">
                {t("help.boss.eyebrow")}
              </span>
            </div>
            <div className="mt-0.5 font-display text-lg font-bold capitalize leading-tight text-ink">
              {t(`twist.${twist}.short`)}
            </div>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-ink-soft">{t(`twist.${twist}.rule`)}</p>
            <div className="mt-2.5">
              <BossRules twist={twist} />
            </div>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {STEPS.map((s) => (
            <div key={s.key} className="flex gap-3 rounded-2xl bg-white p-3">
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.grad} text-xl shadow-stamp-sm`}
              >
                <span aria-hidden>{s.icon}</span>
              </div>
              <div>
                <div className="font-bold text-ink">{t(`${s.key}.title`)}</div>
                <p className="mt-0.5 text-sm leading-snug text-ink-soft">{t(`${s.key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-press py-3.5 text-base font-bold text-paper shadow-stamp transition hover:scale-[1.02] active:scale-95"
        >
          {t("help.letsPlay")}
        </button>
      </motion.div>
    </motion.div>
  );
}
