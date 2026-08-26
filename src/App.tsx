import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  EASE,
  dialogIn,
  dialogOut,
  dropOut,
  liftOut,
  motionOn,
  riseOut,
  screenOut,
  useGsap,
  usePresence,
  useReduceMotion,
  useSwitch,
  useSystemReduceMotion,
} from "./anim";
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
import { debugRequested, isDebug, setDebug } from "./debug";
import { useModal } from "./modal";
import { readItem, writeItem, removeItem, readSession, writeSession, startSdkMirror } from "./storage";
import {
  initAudio,
  isMuted,
  setMuted,
  isMusicOn,
  setMusicOn,
  startMusic,
  suspendAudio,
  resumeAudio,
  setAdPlaying,
  setMusicScene,
  getSfxVolume,
  setSfxVolume,
  getMusicVolume,
  setMusicVolume,
  playUi,
  playStar,
  playSelect,
} from "./audio";
import {
  initSdk,
  loadingStart,
  loadingStop,
  gameplayStart,
  gameplayStop,
  happytime,
  showInterstitial,
  requestRewarded,
  onAdBreak,
} from "./sdk";
import { startStats, trackFinish } from "./stats";
import { analyticsStatus, startAnalytics, trackEvent, trackScreen } from "./analytics";
import { LevelStatsModal } from "./LevelStats";
import { ACHIEVEMENTS, evaluateUnlocks, achievementStatus, TIER_COLORS } from "./achievements";
import { chapterPage } from "./theme";
import { LOCALES, getLocale, setLocale, t, type Locale } from "./i18n";
import StartScreen from "./StartScreen";
import LevelSelect from "./LevelSelect";
import Game from "./Game";
import { BossRules } from "./BossBriefing";
import { Intro } from "./Intro";

type Screen = "home" | "levels" | "game";

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

/**
 * Report a setting to analytics whenever its value changes — not on mount, and
 * not for a StrictMode double effect, which sees the same value twice.
 */
function useTrackSetting(name: string, value: string) {
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    trackEvent("setting", { name, value });
  }, [name, value]);
}

const CALM_KEY = "wordgrid:calm";
const readCalm = () => readItem(CALM_KEY) === "1";

// The opening has played this visit. Session-scoped on purpose: a visit is the
// unit — coming back to the menu from a level, or from any side mode, must not
// replay it, and neither should a reload mid-session — but the next time the
// game is opened it runs again, for the returning player as much as the new one.
const INTRO_KEY = "wordgrid:intro";

export default function App() {
  const systemReduce = useSystemReduceMotion();
  const [calm, setCalm] = useState(readCalm);
  const reduce = systemReduce || calm; // calm mode = no confetti / minimal motion
  // One switch for the whole GSAP layer: every beat in src/anim.ts checks it,
  // including the ones fired from event handlers deep in a screen that was
  // never handed the flag as a prop.
  useReduceMotion(reduce);
  // The opening: the press run in src/Intro.tsx, in front of whichever screen
  // the visit starts on — the tutorial board on a first launch, Home after.
  // Decorative, so Calm and the system's reduced-motion preference cut it
  // entirely rather than showing a still of it.
  const [intro, setIntro] = useState(() => motionOn() && readSession(INTRO_KEY) !== "1");
  useEffect(() => {
    writeSession(INTRO_KEY, "1");
  }, []);
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
  // Debug mode. It's on when the page was opened with `?debug` (src/debug.ts),
  // mirrored in state so flipping it in Settings re-renders the tree — the
  // level gating, the hint bank and the tool panels all read it.
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
  // Both channels have a level as well as a switch: "too loud" and "off" are
  // different complaints, and only one of them used to have an answer.
  const [sfxVol, setSfxVolState] = useState(() => getSfxVolume());
  const [musicVol, setMusicVolState] = useState(() => getMusicVolume());
  useTrackSetting("sound", muted ? "off" : "on");
  useTrackSetting("music", musicOn ? "on" : "off");
  useTrackSetting("calm", calm ? "on" : "off");
  useTrackSetting("locale", locale);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // The level-tracking dashboard (Settings → Developer): solve counts and
  // success rates per level. An author's view, not a player's.
  const [showTracking, setShowTracking] = useState(false);
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
    // The SDK script is `async` and must be initialised before it will take a
    // call, so these two (and a first launch's gameplayStart below) are queued
    // by src/sdk.ts and delivered, in order, the moment init settles.
    loadingStart();
    // The bundle is already parsed by the time React mounts, so loading is
    // effectively done here — tell the platform we're interactive.
    loadingStop();
    // Level tracking: drain anything a previous (offline) session queued and
    // pull the community numbers. Off entirely unless an endpoint is
    // configured, and never on the path of anything the player is waiting for.
    const stopStats = startStats();
    // Product analytics (src/analytics.ts): same contract — off unless
    // configured, loaded on an idle slot after this mount, never awaited.
    const stopAnalytics = startAnalytics();
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
        (durable) => {
          setStorageWarn(!durable);
          if (!durable) trackEvent("storage", { durable: false });
        }
      );
    });
    return () => {
      stopMirror?.();
      stopStats();
      stopAnalytics();
    };
  }, []);

  // Pause the audio when the tab/iframe is hidden. Only the audio: the SDK's
  // gameplay session deliberately isn't touched here — the platform's docs say
  // a focus change or a tab switch is not a game break, so gameplayStop is
  // reserved for a board ending or a menu opening.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) suspendAudio();
      else resumeAudio();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // An ad is on screen: the game is muted for exactly that long (not from the
  // request — an unfilled ad must change nothing), and the page is held so
  // nothing can be clicked under it.
  const [adBusy, setAdBusy] = useState(false);
  useEffect(() => onAdBreak(setAdPlaying), []);
  /**
   * The between-boards ad break. Blocks the page, asks the platform, and only
   * then restarts the gameplay session — so the next board never starts, and
   * gameplayStart is never sent, while an ad might be showing.
   */
  const adBreak = useCallback(async () => {
    setAdBusy(true);
    try {
      await showInterstitial();
    } finally {
      setAdBusy(false);
    }
    gameplayStart();
  }, []);

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

  /** Points earned outside the campaign — Endless. */
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
      for (const q of completed) trackEvent("quest", { id: q.id, set: setDone });
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
      // Unmuting says so out loud — a switch you can't hear leaves you
      // wondering whether it took.
      if (!next) {
        initAudio();
        playStar(0);
      }
      return next;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicOnState((m) => {
      const next = !m;
      initAudio();
      setMusicOn(next); // also starts/stops the loop (with a fade either way)
      return next;
    });
  }, []);

  const changeSfxVol = useCallback((v: number) => {
    initAudio();
    setSfxVolume(v);
    setSfxVolState(v);
  }, []);

  const changeMusicVol = useCallback((v: number) => {
    initAudio();
    setMusicVolume(v);
    setMusicVolState(v);
  }, []);

  const toggleCalm = useCallback(() => {
    playUi();
    setCalm((c) => {
      const next = !c;
      writeItem(CALM_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    trackEvent("progress_reset");
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
      trackEvent("chapter_key", { chapter });
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
      // The board is over: the win card is a break to the platform. Whatever
      // Next does restarts the session (see adBreak).
      gameplayStop();
      // happytime is the platform's celebration, and its docs ask for it
      // sparingly — so a boss falling, not every one of a hundred boards.
      if (!playingDaily && bossTwist(levelIndex) !== null) happytime();
      // The daily plays from its own pool: it feeds streaks/score/history but
      // never writes campaign stars or best times (its ids aren't levels).
      const id = playingDaily ? dailyRaw?.id ?? "daily" : LEVELS[levelIndex].id;
      if (!debug) {
        trackFinish({
          id,
          level: playingDaily ? 0 : levelIndex + 1,
          mode: playingDaily ? "daily" : "campaign",
          won: true,
          mistakes: result.mistakes,
          timeMs: result.timeMs,
          stars: result.stars,
        });
      }
      trackEvent("level_win", {
        mode: playingDaily ? "daily" : "campaign",
        level: playingDaily ? 0 : levelIndex + 1,
        id,
        stars: result.stars,
        mistakes: result.mistakes,
        timeS: Math.round(result.timeMs / 1000),
        link: result.linkCorrect,
        combo: result.maxCombo,
        twist: playingDaily ? "none" : bossTwist(levelIndex) ?? "none",
      });
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
        for (const a of unlocked) trackEvent("achievement", { id: a.def.id, tier: a.tier });
        const top = unlocked[unlocked.length - 1];
        setTimeout(
          () => setUnlockedAch({ icon: top.def.icon, label: `${t(`ach.tier.${top.tier}`)} · ${t(top.def.titleKey)}` }),
          1800
        );
      }
      questEvents(winEvents(result, playingDaily));
    },
    [levelIndex, playingDaily, dailyRaw, applyProgress, questEvents, debug]
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
    trackEvent("rewarded", { placement: "hints", result: ok ? "granted" : "failed" });
    if (!ok) return false;
    applyProgress((p) => ({ ...p, hints: p.hints + 3 }));
    return true;
  }, [applyProgress]);

  const handleLoss = useCallback(
    (result: { timeMs: number; mistakes: number; title: string }) => {
      gameplayStop(); // the loss card is a break; a retry restarts the session
      if (!debug) {
        trackFinish({
          id: playingDaily ? dailyRaw?.id ?? "daily" : LEVELS[levelIndex].id,
          level: playingDaily ? 0 : levelIndex + 1,
          mode: playingDaily ? "daily" : "campaign",
          won: false,
          mistakes: result.mistakes,
          timeMs: result.timeMs,
        });
      }
      trackEvent("level_loss", {
        mode: playingDaily ? "daily" : "campaign",
        level: playingDaily ? 0 : levelIndex + 1,
        id: playingDaily ? dailyRaw?.id ?? "daily" : LEVELS[levelIndex].id,
        mistakes: result.mistakes,
        timeS: Math.round(result.timeMs / 1000),
        twist: playingDaily ? "none" : bossTwist(levelIndex) ?? "none",
      });
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
    [levelIndex, playingDaily, dailyRaw, applyProgress, debug]
  );

  // Where "Next" leads from the campaign level being played. Read from live
  // progress — the win that opened the card is already recorded by the time
  // this renders, so a replayed level counts as cleared here and is skipped
  // like any other. (Endless and the daily have their own Next; they ignore it.)
  const nextIndex = nextLevelIndex(progress, levelIndex);

  const nextLevel = useCallback(async () => {
    if (nextIndex === null) return;
    await adBreak(); // the ad plays over the win card; the next board waits
    setLevelIndex(nextIndex);
  }, [nextIndex, adBreak]);

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
      gameplayStop();
      trackEvent("level_win", {
        mode: "endless",
        level: 0,
        id: ENDLESS_POOL[endlessQueue.current[endlessPos] ?? 0]?.id,
        mistakes: result.mistakes,
        link: result.linkCorrect,
        combo: result.maxCombo,
        twist: "none",
      });
      setEndlessSolved((n) => n + 1);
      setEndlessScore((s) => s + result.score);
      awardScore(result.score);
      // An Endless board is a solved board: it counts for today's quests too,
      // minus the daily one (it isn't the daily).
      questEvents(winEvents(result, false));
    },
    [awardScore, questEvents, endlessPos, ENDLESS_POOL]
  );

  const nextEndless = useCallback(async () => {
    await adBreak();
    setEndlessPos((pos) => {
      let np = pos + 1;
      if (np >= endlessQueue.current.length) {
        endlessQueue.current = shuffleQueue();
        np = 0;
      }
      return np;
    });
  }, [adBreak]);

  const exitEndless = useCallback(() => {
    gameplayStop();
    trackEvent("endless_end", { solved: endlessSolved });
    applyProgress((p) => (endlessSolved <= p.endlessBest ? p : { ...p, endlessBest: endlessSolved }));
    setEndless(false);
    setScreen("home");
  }, [endlessSolved, applyProgress]);

  // Playing a campaign level stains the page with that chapter's paper stock,
  // so chapter 6 doesn't look like chapter 1. The daily, Endless and every
  // menu keep the plain cream — the stain means "you are in chapter N",
  // and it would say nothing if it were everywhere.
  const page =
    screen === "game" && !playingDaily && !endless ? chapterPage(chapterOfLevel(levelIndex)) : null;

  // The loop follows the player rather than the navigation handlers: menus get
  // the warm bed, any board gets the one with a pulse, and a boss door turns it
  // minor. All three share a key, so a change lands as a modulation on the next
  // bar and not as a record being swapped.
  // One screen at a time: the outgoing one leaves before the next arrives, so
  // two full screens are never laid out together.
  const shownScreen = useSwitch(screen, screenOut);
  // Everything that has to outlive the state that dismissed it. Each carries
  // the state it is drawn from, so a sheet on its way out isn't redrawn from a
  // game that has already moved on. See `usePresence` in src/anim.ts.
  const helpHere = usePresence(
    showHelp,
    screen === "game" && !endless && !playingDaily ? bossTwist(levelIndex) : null,
    dialogOut
  );
  const statsHere = usePresence(showStats, null, dialogOut);
  const historyHere = usePresence(showHistory, null, dialogOut);
  const trackHere = usePresence(showTracking, null, dialogOut);
  const settingsHere = usePresence(showSettings, null, dialogOut);
  const achHere = usePresence(unlockedAch != null, unlockedAch, riseOut);
  const warnHere = usePresence(storageWarn, null, dropOut);
  // The plate stays up through its lift-off while the first screen mounts
  // under it, so the hand-over is an overlap and never a blank page.
  const introHere = usePresence(intro, null, liftOut);

  const onBoard = screen === "game";
  const onBoss = screen === "game" && !endless && !playingDaily && bossTwist(levelIndex) !== null;
  useEffect(() => {
    setMusicScene(onBoss ? "boss" : onBoard ? "play" : "menu");
  }, [onBoard, onBoss]);

  // Each screen is a page to analytics (`/home`, `/game`, …) — the same one
  // twice in a row is one view, so a StrictMode double effect is harmless.
  useEffect(() => {
    trackScreen(screen);
  }, [screen]);

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

      {adBusy && (
        // Held page during an ad break: the platform draws the ad over the
        // iframe; this keeps the board under it from taking a tap, and says
        // what is happening if the request takes a second.
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-paper/50 pb-10"
          role="status"
          aria-live="polite"
        >
          <span className="rounded-full border border-ink/20 bg-paper px-4 py-1.5 text-xs font-semibold text-ink-soft shadow-stamp-sm">
            {t("ad.break")}
          </span>
        </div>
      )}

      {!intro && shownScreen.key === "home" && (
          <ScreenWrap key="home" ref={shownScreen.ref}>
            <StartScreen
              progress={progress}
              onPlay={play}
              onLevels={openLevels}
              onDaily={playDaily}
              onEndless={playEndless}
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

      {!intro && shownScreen.key === "levels" && (
          <ScreenWrap key="levels" ref={shownScreen.ref}>
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

      {!intro && shownScreen.key === "game" && (
          <ScreenWrap key="game" ref={shownScreen.ref}>
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
              onRestart={gameplayStart}
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

      {introHere.rendered && <Intro ref={introHere.ref} onDone={() => setIntro(false)} />}

      {helpHere.rendered && (
        <HelpModal
          ref={helpHere.ref}
          // Asked for help mid-boss, the sheet answers about *this* boss
          // first: the three ordinary steps aren't what stopped them.
          twist={helpHere.data}
          onClose={() => setShowHelp(false)}
        />
      )}
      {statsHere.rendered && (
        <StatsModal
          ref={statsHere.ref}
          progress={progress}
          onClose={() => setShowStats(false)}
          onHistory={() => {
            setShowStats(false);
            setShowHistory(true);
          }}
        />
      )}
      {historyHere.rendered && (
        <HistoryModal ref={historyHere.ref} progress={progress} onClose={() => setShowHistory(false)} />
      )}
      {trackHere.rendered && (
        <LevelStatsModal ref={trackHere.ref} progress={progress} onClose={() => setShowTracking(false)} />
      )}
      {settingsHere.rendered && (
        <SettingsModal
          ref={settingsHere.ref}
            muted={muted}
            musicOn={musicOn}
            sfxVol={sfxVol}
            musicVol={musicVol}
            onSfxVol={changeSfxVol}
            onMusicVol={changeMusicVol}
            calm={calm}
            debug={debug}
            onToggleMute={toggleMute}
            onToggleMusic={toggleMusic}
            onToggleCalm={toggleCalm}
            onToggleDebug={toggleDebug}
            onTracking={() => {
              setShowSettings(false);
              setShowTracking(true);
            }}
          onLocale={changeLocale}
          onReset={resetProgress}
          onClose={() => setShowSettings(false)}
        />
      )}

      {achHere.rendered && achHere.data && (
          <Banner ref={achHere.ref} from={-60} className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
            <div className="flex items-center gap-3 rounded-2xl border border-gold/60 bg-paper px-4 py-2.5 shadow-stamp-lg">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-lg">
                {achHere.data.icon}
              </span>
              <div className="text-left">
                <div className="text-[0.65rem] font-bold uppercase tracking-widest text-gold-deep">
                  {achHere.data.header ?? t("achievement.unlocked")}
                </div>
                <div className="text-sm font-bold text-ink">{achHere.data.label}</div>
              </div>
            </div>
          </Banner>
      )}

      {/* Nothing here will outlive the tab. Said once, quietly, at the bottom —
          it's a warning, not a modal, and the game plays fine either way. */}
      {warnHere.rendered && (
          <Banner ref={warnHere.ref} from={60} role="status" className="fixed inset-x-0 bottom-3 z-[55] flex justify-center px-4">
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
          </Banner>
      )}
    </div>
  );
}

function StatsModal({
  ref,
  progress,
  onClose,
  onHistory,
}: {
  ref?: React.Ref<HTMLDivElement>;
  progress: Progress;
  onClose: () => void;
  onHistory: () => void;
}) {
  const scope = useGsap<HTMLDivElement>((el) => void dialogIn(el), []);

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
    <div
      ref={(el) => {
        scope.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("stats.title")}
      className="fixed inset-0 z-50 dialog-scrim flex flex-col items-center overflow-y-auto bg-ink/40 p-4"
    >
      <div
        data-panel
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
      </div>
    </div>
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

function HistoryModal({
  ref,
  progress,
  onClose,
}: {
  ref?: React.Ref<HTMLDivElement>;
  progress: Progress;
  onClose: () => void;
}) {
  const scope = useGsap<HTMLDivElement>((el) => void dialogIn(el), []);
  const panel = useModal<HTMLDivElement>(onClose);
  const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
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
      aria-label={t("history.title")}
      className="fixed inset-0 z-50 dialog-scrim flex flex-col items-center overflow-y-auto bg-ink/40 p-4"
    >
      <div
        data-panel
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
      </div>
    </div>
  );
}

/**
 * A level, under the switch it belongs to. It only exists while that channel
 * is on — a slider under a dead switch is a puzzle, not a control.
 */
function VolumeRow({
  label,
  value,
  onChange,
  onPreview,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  /** Played when the drag ends, so you hear what you just set. */
  onPreview?: () => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3 pb-3">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={pct}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        onPointerUp={onPreview}
        onKeyUp={onPreview}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink/15 accent-leaf"
      />
      <span className="w-9 shrink-0 text-right text-[0.7rem] font-bold tabular-nums text-ink-soft">{pct}%</span>
    </div>
  );
}

/** Settings → Developer: the state of the analytics pipe (src/analytics.ts). */
function AnalyticsRow() {
  const s = analyticsStatus();
  let host = s.script;
  try {
    if (s.script) host = new URL(s.script).host;
  } catch {
    /* show it as written */
  }
  const hint = !s.enabled
    ? t("settings.analytics.off")
    : s.loaded
      ? t("settings.analytics.on", { host, n: s.handed })
      : t("settings.analytics.waiting", { host, n: s.buffered });
  return (
    <div className="border-t border-ink/15 py-3">
      <div className="text-sm font-bold text-ink">{t("settings.analytics")}</div>
      <div className="break-words text-[0.7rem] text-ink-soft">{hint}</div>
    </div>
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
  ref,
  muted,
  musicOn,
  sfxVol,
  musicVol,
  onSfxVol,
  onMusicVol,
  calm,
  debug,
  onToggleMute,
  onToggleMusic,
  onToggleCalm,
  onToggleDebug,
  onTracking,
  onLocale,
  onReset,
  onClose,
}: {
  ref?: React.Ref<HTMLDivElement>;
  muted: boolean;
  musicOn: boolean;
  sfxVol: number;
  musicVol: number;
  onSfxVol: (v: number) => void;
  onMusicVol: (v: number) => void;
  calm: boolean;
  debug: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onToggleCalm: () => void;
  onToggleDebug: () => void;
  /** Open the level-tracking dashboard. */
  onTracking: () => void;
  onLocale: (l: Locale) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const scope = useGsap<HTMLDivElement>((el) => void dialogIn(el), []);
  const panel = useModal<HTMLDivElement>(onClose);
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
      aria-label={t("settings.title")}
      className="fixed inset-0 z-50 dialog-scrim flex flex-col items-center overflow-y-auto bg-ink/40 p-4"
    >
      <div
        data-panel
        ref={panel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border-2 border-ink bg-paper p-6 shadow-stamp-lg"
      >
        <h3 className="font-display text-2xl font-bold text-ink">{t("settings.title")}</h3>
        <div className="mt-3 divide-y divide-ink/15">
          <div>
            <ToggleRow label={t("settings.sfx")} hint={t("settings.sfx.hint")} on={!muted} onToggle={onToggleMute} />
            {!muted && (
              <VolumeRow label={t("settings.sfx.level")} value={sfxVol} onChange={onSfxVol} onPreview={() => playSelect(2)} />
            )}
          </div>
          <div>
            <ToggleRow label={t("settings.music")} hint={t("settings.music.hint")} on={musicOn} onToggle={onToggleMusic} />
            {musicOn && <VolumeRow label={t("settings.music.level")} value={musicVol} onChange={onMusicVol} />}
          </div>
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

        {/* Developer tools, last on the page. The debug switch only exists on
            a page opened with `?debug` — a player never sees a toggle that
            hands them the whole game — and it flips the same flag the URL set,
            so everything downstream behaves identically. */}
        <div className="mt-4 border-t border-dashed border-ink/20 pt-1">
          <div className="pt-2 text-[0.6rem] font-bold uppercase tracking-widest text-ink-soft">
            {t("settings.developer")}
          </div>
          {debugRequested() && (
            <ToggleRow
              label={t("settings.debug")}
              hint={t("settings.debug.hint")}
              on={debug}
              onToggle={onToggleDebug}
            />
          )}
          {/* How the campaign is actually landing: solve counts and success
              rates per level, straight from the players who have tried them. */}
          <button
            onClick={onTracking}
            className="w-full border-t border-ink/15 py-3 text-left transition hover:bg-cream"
          >
            <div className="text-sm font-bold text-ink">{t("settings.tracking")}</div>
            <div className="text-[0.7rem] text-ink-soft">{t("settings.tracking.hint")}</div>
          </button>
          {/* The other pipe: is Umami configured, did its tracker arrive, and
              how much has gone through it this session. Read-only — there is
              nothing to open; the dashboard lives on the Umami host. */}
          <AnalyticsRow />
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
      </div>
    </div>
  );
}

function ScreenWrap({ ref, children }: { ref?: React.Ref<HTMLDivElement>; children: React.ReactNode }) {
  const el = useGsap<HTMLDivElement>(
    (node) => void gsap.fromTo(node, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: EASE.press }),
    []
  );
  return (
    <div
      ref={(node) => {
        el.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className="min-h-full"
    >
      {children}
    </div>
  );
}

/**
 * A strip that slides in from an edge and back out to it — the achievement
 * banner from the top, the storage warning from the bottom.
 */
function Banner({
  ref,
  from,
  className,
  role,
  children,
}: {
  ref?: React.Ref<HTMLDivElement>;
  /** Offset it comes in from: negative for the top edge, positive the bottom. */
  from: number;
  className: string;
  role?: string;
  children: React.ReactNode;
}) {
  const el = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (motionOn() && el.current) {
      gsap.fromTo(el.current, { y: from, opacity: 0 }, { y: 0, opacity: 1, duration: 0.34, ease: EASE.press });
    }
  }, [from]);
  return (
    <div
      ref={(node) => {
        el.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      role={role}
      className={className}
    >
      {children}
    </div>
  );
}

const STEPS = [
  { icon: "🔗", grad: "from-[#c5a3e8] to-[#b48fd9]", key: "help.step1" },
  { icon: "🔤", grad: "from-[#7cc0e8] to-[#5eb0e0]", key: "help.step2" },
  { icon: "⭐", grad: "from-[#f2b544] to-[#eda820]", key: "help.step3" },
];

function HelpModal({
  ref,
  twist,
  onClose,
}: {
  ref?: React.Ref<HTMLDivElement>;
  twist?: BossTwist | null;
  onClose: () => void;
}) {
  const scope = useGsap<HTMLDivElement>((el) => void dialogIn(el), []);
  const panel = useModal<HTMLDivElement>(onClose);
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
      aria-label={t("help.title")}
      className="fixed inset-0 z-50 dialog-scrim flex flex-col items-center overflow-y-auto bg-ink/40 p-4"
    >
      <div
        data-panel
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
      </div>
    </div>
  );
}
