# WordGrid — Project State & Backlog

_Last updated 2026-08-26, after iteration 37 (GSAP replaces Framer Motion;
one animation library, −41 kB gzip)._

This file is the bootstrap for a fresh session: how to work on the repo, what
is where, the rules that must hold, the decisions that must not be quietly
reversed, and what is still open. It is deliberately short. Two other places
hold the detail:

- **`README.md`** — the player-facing description, the motion system, level
  tracking, the submission pack, debug mode, saving.
- **`git log`** — every iteration's long-form write-up is in its commit body.
  The iteration essays that used to live in this file (iterations 7–36,
  ~1,800 lines) are in its history: `git log -p -- BACKLOG.md`, last long
  version at `a6f89ee`.

## What this is

A casual word puzzle for **CrazyGames / GitHub Pages**. Each level is a board
of 12 words that sort into 4 themed groups of three, all joined by one hidden
**link word** (the "pivot", e.g. STAR) that is spelled at the end. Flow: first
launch → straight into the guided tutorial; afterwards Home (Daily hero card,
quests, mode row) → Level index (100 levels, 12 chapters, a boss with its own
twist closing each) → Game. Side modes on the same boards: **Pairs** (memory
matching), **Logic Grid** (pure deduction, 30 abstract levels), **Endless**
(unlocked by finishing the campaign).

## Session bootstrap

- **Commit every change immediately, directly on `main`, and push** (owner's
  standing instruction — no branches, no waiting for review). The production
  build is committed in `docs/` (GitHub Pages), so any change that touches the
  app needs `npm run build` before its commit to keep `docs/` in sync.
- **Commands**: `npm run build` (tsc + vite → `docs/`), `npm test` (ten unit
  suites: engine, deduction, progress/key gating, quests, storage, debug,
  i18n, sdk, level tracking, audio), `npm run validate` (puzzle structure,
  category-name spoilers, chapter-key lengths, the campaign curve, emoji
  board), `npm run audit` (ambiguity report for a human), `npm run
  gen:deduction` (regenerate Logic Grid levels), `node scripts/gen-assets.mjs`
  (og-image + icons), `npm run submission` / `npm run clip` (store art — see
  README).
- **Headless playtests — all five must pass with zero issues before a push.**
  They need Chrome: either `npm install --no-save puppeteer` (pruned by any
  later `npm install`) or a system Chrome, which `scripts/browser.mjs` finds
  on its own (`CHROME_PATH` if it lives somewhere unusual). Serve the build
  with `npx vite preview --port <fresh port>` — previews die between turns, so
  always a new port, never `pkill` — then:
  - `BASE=http://localhost:<port>/ SHOT=<dir> node scripts/playtest.mjs` — the
    full flow: tutorial, boss briefing, keys, loss path, unlock reveal, the
    720p embed fitting without page scroll, unsolved titles never shown, the
    pivot never distinguishable by colour.
  - `BASE=… node scripts/pairs.test.mjs` — a Pairs run plus the two
    iteration-24 timer/stale-state repros.
  - `BASE=… node scripts/debug.playtest.mjs` — the tool tray, free hints,
    auto-solve, the index and Logic Grid tools.
  - `BASE=… node scripts/iteration33.playtest.mjs` — quests paying out, the
    letter-counting link mask, Tab trapped in a dialog, play with a throwing
    `localStorage`.
  - `node scripts/stats.playtest.mjs` — level tracking against the real
    reference server, a level played offline; it serves `docs/` and runs the
    server itself, so it needs no preview.
- **Debug mode**: only on a page opened with `?debug` in the URL — not
  remembered, nothing stored; the scripts open `?debug` too. That page's
  **Settings → Developer** has a toggle to turn it off and on for the session.
  Everything unlocked, free hints, the 🛠 tool tray. Full list in README.
- **Commit style**: imperative summary + a body that says why; end with
  `Co-Authored-By: Claude <model name> <noreply@anthropic.com>` and the
  session's `Claude-Session:` URL trailer. Never put a model id in code.
- **Verify visually** with puppeteer screenshots: 390×844 (phone) and
  1280×720 (the CrazyGames embed). Use `deviceScaleFactor: 1` or JPEG clips —
  the screenshot API rejects very large images.

## Architecture map

### Content and pure logic (`src/`)

- `puzzles.ts` — 100 campaign `RawPuzzle`s (pivot + 4×3 spokes) and the
  bespoke `EMOJI_BOSS`; `buildPuzzle`, `seededShuffle`. **The campaign
  curve**: hand grades `GRADE_BANDS` (1–5, lists of ids), `lexicalLoad` as a
  tiebreak only, `suitsTwist` (can a board carry a twist — rules below), and
  the placement pass `dealChapters → spreadWordplay → spaceOutRepeats` that
  deals a rising sawtooth (`SPIKE = 4` grades past a chapter's band for its
  boss). `OPENING = star,trunk,ring,bug,bank` is hand-pinned (the tutorial
  ramp); `EMOJI_TWIN = "bolt"` pins the BOLT board to the emoji slot.
  `CHAPTER_SIZES = [6,7,7,8,8,8,8,9,9,9,10]` + remainder → 12 chapters, boss =
  last level; `CHAPTER_TWISTS` (one per chapter, no adjacent repeats):
  scramble · cipher · emoji · blackout · decoy · memory · scramble · blackout ·
  cipher · decoy · blackout · memory. `CHAPTER_KEYS` (SPARK … MASTERMIND),
  `KEY_DEAL` (letters dealt to a chapter's non-boss levels in a seeded
  scramble), `keyLetterOf`/`keySlots`/`chapterKey`/`chapterOfLevel`, and
  `levelTitle(index)` — use it, not `LEVELS[i].title`, because the emoji slot
  substitutes its board.
- `dailyPuzzles.ts` — the 80-puzzle daily-only pool (no pivot shared with the
  campaign). Also feeds Endless and Pairs.
- `deductionLevels.ts` / `deductionRules.ts` — the 30 pre-generated Logic Grid
  levels (`logic-1…30`) and the clue rules shared by the generator and the
  screen.
- `engine.ts` — pure, unit-tested: `evaluateGuess` (one-away), `computeStars`,
  `linkMatches` (case/plural/synonyms via `accept`), `scrambleWord`,
  `cipherWord` (vowel-stripping; imported back by `puzzles.ts` with an
  explicit `.ts` extension so node scripts can load it), `shuffle`, `guessKey`.
- `progress.ts` — `Progress` schema: `stars`, `streak`, `bestStreak`,
  `linksGuessed`, `best`, `daily{lastDate,streak}`, `achievements`, `hints`,
  `history`, `score`, `endlessBest`, `pairsBest`, `deductionSolved`, `seen`,
  `banked`, `keys`, `quests`. `isUnlocked` (`LOOKAHEAD = 3` + debug + the
  chapter-key boss gate), `endlessUnlocked` (every campaign level cleared, or
  debug), the key helpers (`bankedLetters`/`keyReady`/`keySolved`/`solveKey`/
  `keyLockedBoss`/`bossAwaitingKey`), `newlyUnlocked`/`markSeen` and
  `newlyBanked`/`markBanked` (what the index still owes a reveal for — both
  debug-blind, both migrated), `dailyPuzzle()` (fixed seeded tour, same for
  everyone, no repeat in 80 days), `liveDailyStreak` (only a run cleared today
  or yesterday counts). Rules pinned in `scripts/progress.test.mts`.
- `quests.ts` — `QUEST_POOL` (7), `QUESTS_PER_DAY = 3`, a date-seeded draw that
  never exactly repeats yesterday's, `recordQuest` pays once. `QUEST_REWARD =
  1` hint, `QUEST_SET_BONUS = 2`, `COMBO_TARGET = 3`. State rides in
  `Progress.quests`; events are raised in `App.tsx`.
- `storage.ts` — **every** persisted read/write. `localStorage` when a real
  probe write works, the CrazyGames data module when the SDK is there
  (`startSdkMirror` polls `MIRROR_TRIES = 12` × `MIRROR_GAP_MS = 700`, then
  reconciles both ways — adopts a key only the platform has, pushes up a key
  only we have), memory always. `KEYS` lists the mirrored keys. Nothing else
  in `src/` touches `localStorage`.
- `stats.ts` — level tracking client: `start` on deal, `win`/`loss` on end,
  queued under `wordgrid:stats-queue`, aggregate cached 6 h; `MIN_SAMPLE = 5`
  finished attempts before a percentage is shown; `parseLevels` sanitises the
  server's answer. Off unless `VITE_STATS_URL` or the `<meta
  name="wordgrid:stats">` tag is set. Debug and Endless are never counted.
- `debug.ts` — `isDebug` (URL / storage, cached per load), `setDebug` (live),
  `resetDebugCache` (test seam).
- `achievements.ts` — 6 tiered (Bronze/Silver/Gold) defs + hint rewards.
- `sharecard.ts` — 1080×1080 spoiler-free canvas PNG for Web Share.
- `i18n/` — `index.ts` (detect, persist, `t()`, `plural()`), `en.ts` (source
  of truth, ~460 keys), `es.ts`. Components never hold copy: chapter names,
  tier labels, achievement titles, boss rules/briefings and every Logic clue
  sentence are keys. Puzzle *content* stays English on purpose (see
  Decisions). `scripts/i18n.test.mts` fails on a missing/stray key or a lost
  `{placeholder}`.
- `sdk.ts` — defensive CrazyGames v3 wrapper. Off-platform the script loads
  but is disabled, so every call throws/rejects `sdkDisabled`: the wrapper
  swallows both, latches "unusable", and every rewarded failure path (no SDK,
  disabled, ad error, no callback in `AD_CALLBACK_TIMEOUT_MS = 5 s`) resolves
  **true** so watch-&-continue and hint refills always pay out.
  `MIN_AD_GAP_MS = 60 s` between interstitials, none in a session's first
  minute. `sdkData()` is the data module `storage.ts` mirrors through.
- `audio.ts` — everything synthesized, no files. Mixer: sfx and music buses
  under a make-up gain and limiter, one shared generated reverb on a send,
  stings duck the music, a voice budget and per-sound rate gate. Music is
  three four-bar scenes (`menu`/`play`/`boss`) in one key, scheduled ahead of
  the audio clock, swapped at the bar by `setMusicScene()` (App drives it off
  the screen). Each bus has a switch and a level (`wordgrid:sfxvol` /
  `wordgrid:musicvol`). Nothing is scheduled while the tab is hidden. Pinned
  by `scripts/audio.test.mts`.
- `anim.ts` — all motion, GSAP. `EASE` (incl. the hand-authored stamp
  `CustomEase`), `setReduceMotion`/`motionOn` (one module flag, kept in step
  with the system preference and the Calm switch by App), hooks
  `usePresence` (holds a leaving node mounted **and carries a payload frozen
  at its last present value**), `useSwitch` (one screen at a time),
  `useGsap`, `useOdometer` (score count-up written straight to the DOM),
  `useElementMap`; exits `fadeOut`/`dropOut`/`sinkOut`/`riseOut`/`screenOut`;
  `dialogIn`/`dialogOut` shared by every dialog (parts marked with
  `data-panel`/`data-dialog-mark`/`data-dialog-row`/`data-dialog-cta`);
  beats `stampIn`, `dealIn`, `rattle`, `punch`, `floatPop`, `breathe`,
  `inkFlash`, `pressDown`/`release`; the solve flight
  (`captureGhosts`/`flyGhosts`), the Flip shuffle (`captureOrder`/`playOrder`)
  and `confetti()` (punched-paper chads).
- `theme.ts` / `letters.ts` / `format.ts` — `CATEGORY_THEMES` (the four group
  colours — load-bearing for gameplay), `CHAPTER_INKS` (twelve spot colours)
  + `CHAPTER_PAGES` (per-chapter page stain), `buildLetterBank` /
  `shuffledLetters`, `fmtTime`.
- `modal.ts` — `useModal()`: focus into the dialog, Tab trapped, Escape
  closes, focus returns to the opener. The close callback is held in a ref so
  the effect runs once.

### Screens (`src/`)

- `App.tsx` — screen router (home / levels / game / pairs / deduction) and
  progress state. **All progress writes go through `applyProgress(mutate)`**;
  side effects (save, achievements, toasts, quest events) run in the handler,
  never inside a React updater. `handleWin` (stars/streak/best/+1 hint/score,
  achievements, history; a daily win never writes campaign stars — history id
  = daily id, level 0). Daily via `overrideRaw`; Endless (campaign + daily
  pool, no-fail, `endlessBest`, gated on a finished campaign); Pairs and
  Logic routing; the sheets (settings: sound + level, music + level, calm,
  locale, Developer → debug toggle + level tracking, reset; stats; history;
  how-to-play); the storage banner; music scene; `visibilitychange` pause;
  rewarded `refillHints` (+3).
- `StartScreen.tsx` — Daily hero (7-day streak strip, countdown, Solve CTA),
  the quests card, Continue · L{n} (plays that level; the index is the link
  under it), mode row (Endless — a locked door until the campaign is done ·
  Pairs · Logic), each stat with its unit. Two columns at `lg`.
- `LevelSelect.tsx` — the level **index**: an Up-next card (chapter, tier,
  boss rule, community clear rate, Play), then twelve chapter sections in
  their own ink, each split into `LevelRow` (solved: numeral · title · dotted
  leader · stars in aligned columns) and `LevelTile` (unsolved: uniform 44 px
  square, dashed when locked). Per chapter: the key rail (letters handed over
  from cleared levels — chip turns over, throws its letter to the rail) and
  the boss panel (`far`/`sealed`/`ready`/`open`/`beaten`); `KEY_PANEL_MS`
  waits for the key modal before the door swings. Unlocks play once (lock
  pops, fixed banner names what opened). At `lg` the collection scrolls in
  its own pane so the page never scrolls at 1280×720.
- `Game.tsx` — the board. Props: `puzzleIndex`, `overrideRaw`, `twist`,
  `bossBeaten`, `daily`, `endless`, hint bank callbacks, `onWin`/`onLoss`/
  `onNext`/`onExit`. Inside: score + combo with floating pops; the rule strip
  for a boss (reopens the briefing); tap-**or**-type finale; the **early
  call** (once a group is solved and ≥2 remain, not in the tutorial; spent on
  opening; hit = reveal + 250 × (1 + open groups) and play on; miss = no
  mistake, no star, no retry); the **memory boss** (study as long as you
  like → Ready flips to numbered backs → three armed peeks; clock starts at
  the flip; no shuffle; backs stay down through the early call); rewarded
  second chance (+2 tries, once); tutorial coach (welcome modal, sticky-note
  steps, escalating nudges that never give the group away); `SolvedBanner`
  prints the picture beside the word on the emoji boss; two columns at `lg`.
- `LinkGuess.tsx` — the spell-the-link panel, three callers: finale, early
  call (`early` + `onMiss`), chapter key (`bank`, copy keys, `dismissKey`).
  `suspended` stops its window keydown handler typing under an open dialog.
- `BossBriefing.tsx` — `BossBriefing` (opens itself on an unbeaten boss; the
  rule strip reopens it) and `BossRules` (reused by how-to-play). Copy:
  `twist.<twist>.rule` / `.brief.a` / `.brief.b`.
- `EndCard.tsx` — win/loss card, stars, ratings, share.
- `Pairs.tsx` — 🃏 matching → coupling (the four leftovers; a wrong couple
  flashes red and stays in hand, still costs a move) → spell the link.
  Fewest moves = `pairsBest`. All timers go through a cancellable `later()`;
  tap guards read refs, not closure state. Face-down cards never leak their
  word.
- `Deduction.tsx` — 🧩 Logic Grid. A 3×4/4×3 grid, four hidden groups of
  three in any shape (15,400 partitions); eight clue kinds drawn as icon +
  value with a per-board key (`deg`, `dir`, `diag`, `line`, `parity`,
  `corners` on tiles; `rainbow`, `onepair` on row/column headers). Paint by
  tap or drag; live ✓/✕ badge per clue; a full wrong board shakes and opens a
  plain-words problem panel. Generator (`scripts/gen-deduction.mts`) keeps
  only boards a human-style forced-inference solver cracks, minimises clues,
  proves uniqueness by brute force, and orders levels as a vocabulary ramp
  (`BANDS`); the tier chip reports measured inference depth. **Adding a clue
  kind**: a `countScope` entry (or pair/line rule) in `deductionRules.ts`
  (shared by the generator, the screen and `scripts/deduction.test.mts`),
  wording in `clueText`/`violationText` and a `LEGEND` row in
  `Deduction.tsx`, a `BANDS` slot in `scripts/gen-deduction.mts`, then
  `npm run gen:deduction`.
- `LevelStats.tsx` — Settings → Developer → Level tracking dashboard, plus
  `useCommunityStats()` for the Up-next card's clear-rate line.
- `DebugPanel.tsx` — the 🛠 tray, bottom-left, mounted only in debug mode;
  each screen passes its own tools.
- `Toast.tsx` — one component, mounted unconditionally with `text | null`;
  owns its own entrance and exit. `Confetti.tsx` — the chads.
- `index.css` — "The Puzzle Press" tokens (Tailwind v4 `@theme`): paper
  `#faf5ea`, cream `#efe7d3`, ink `#26221a`, ink-soft `#6f6757`, press
  `#d9482b` / `#a93318`, gold `#eda820` / `#8a5c00`, leaf `#1c7a4d`. Hard
  offset shadows on one three-step scale, no gradients or glass. Reduced-
  motion CSS; the rotate-to-portrait hint for short landscape phones.

### Elsewhere

- `scripts/` — `validate.mts`, `audit.mts`, `gen-deduction.mts`, the ten
  `*.test.mts` unit suites, the five `*.playtest.mjs` / `pairs.test.mjs`
  browser suites, `browser.mjs` (Chrome launcher), `gen-assets.mjs`,
  `gen-submission.mjs` + `submission-art.mjs`, `gen-clip.mjs`.
- `server/stats-server.mjs` — dependency-free Node + SQLite reference server
  for level tracking (`POST /events`, `GET /levels`, `/levels.csv`,
  `/health`).
- `public/art/` — the submission pack, served at `<site>/art/`.

## Hard requirements (owner)

1. **No time pressure.** Chill game. Time Attack was built and removed; the
   memory boss has no study countdown for the same reason.
2. **Never the "AI default" look.** Keep the Puzzle Press print identity.
3. Tutorial is hands-on but never gives the answer away; skippable.
4. A loss never reveals the link (and history hides a lost level's title).
5. Solved groups keep showing their words, including through the finale.
6. Push to main; playtests green and screenshots checked before pushing.
7. **One progression system.** The XP/rank ladder was removed (iteration 33)
   as a second ladder over stars, tiers and streaks. `score` stays as combo
   currency and a stats line — it is not a level.
8. **A boss's rule is explained on screen**, not named: the door, the up-next
   card, a briefing on an unbeaten boss, and a rule strip on the board.
9. **Emoji boss tiles are the picture's own name** (💅 NAIL, 🦭 SEAL). What
   moves is the sense, never the noun; a picture you must call something it
   isn't called is a guessing game.

## Engineering rules

- Persisted state goes through `storage.ts`; copy goes through `i18n/`;
  progress writes go through `applyProgress`. Grep before adding an exception.
- **No side effects inside React state updaters** (StrictMode double-invokes
  them). Compute from a ref, act in the handler.
- **Every deferred beat is cancellable** and cleared on new board / unmount.
- **Never park a hidden face in the DOM.** An `opacity: 0` letter is a
  chapter key readable off the page. Both faces exist only for the turn.
- **`immediateRender: false` on any delayed `fromTo`**, or the element sits
  in its "from" pose through the delay (this once broke the 720p fit by 6 px).
- The pivot must never be distinguishable by colour, order or markup
  mid-game; unsolved level titles are never rendered; face-down cards and
  memory-boss backs carry no word in any attribute. The playtest asserts all
  of it.
- Debug never leaks into a normal save (its own key, tray mounted only while
  on); debug and Endless are never counted by level tracking.
- `npm run validate` is the gate for content: a new board that fails it
  doesn't build.

## Authoring a board

Every group on every campaign and daily board has been read by a human;
`validate` catches the structural leaks, `audit` reports the likely ones, and
the rest needs the same read for any new batch.

**Enforced by `validate` (build fails):**
1. A category name may not spell the pivot — the 💡 hint prints that name.
2. A category name may not name one of its own tiles, singular or plural.
3. A category name may not name a tile from another group on the board.
4. No tile may contain the pivot as a substring (SLIGHT on a LIGHT board).
5. Campaign curve: every puzzle hand-graded, level 1 is `star`, a boss grades
   ≥ every level before it in its chapter, boss grades never drop across
   chapters, a boss can carry its twist, one compound-word board per chapter,
   no adjacent levels share a tile, chapter-key length = non-boss level count.
6. Emoji board: every tile has a picture, none reused, none for a non-tile,
   none on the ⚡ / 🔩 / 🌩 spoiler list.

**Reported by `audit`, for a human:** two tiles sharing a 5-letter stem; two
groups on different boards sharing 2 of 3 words; tiles reused on 3+ boards;
very short tiles.

**Only a human catches these** — the four classes the passes actually found:
- **A tile another group's category could claim** (FIELD in "Baseball venues"
  beside "Green spaces"). The commonest and the most unfair: the player is
  right and the game says no.
- **A tile that is a synonym of a tile in another group** (SWELL vs SURGE).
- **A tile that is a synonym of the pivot** (a wedding RING on a BAND board).
- **A category name that is factually wrong** ("Armored vehicles" over JEEP).

The test for every tile: *read it alone, with no category names, and ask which
groups on this board it could join.* If the answer isn't exactly one, change
the tile — never the category name, which the player can't see while guessing.
Tile vocabulary is US spelling (HARBOR, TIRE). Titles stay global-English;
idiom is allowed only where a category teaches it (Bank On It).

**Board fit per twist** (`suitsTwist`): *scramble* — every spoke ≤ 7 letters
(anagramming PIROUETTE is a different, worse game); *cipher* — no two spokes
strip to the same skeleton, every skeleton ≥ 2 letters, at most three 2-letter
stubs; *memory* — spokes ≤ 8 letters and no two share their first two letters
(near-twins are one tile in recall); *decoy* — no compound-word board (its
tiles can't be verified without the link, so they're indistinguishable from
the fakes) and at most one 9+-letter spoke; *blackout* — anything, so it takes
the hardest; *emoji* — the one bespoke board.

## Decisions worth keeping (read before "fixing" one)

**Campaign shape**
- Difficulty is a **hand grade** (senses vs sets, how far the pivot sits from
  its everyday meaning, how much the groups tempt each other); word length is
  only a tiebreak. The old length score ranked GLASS hardest in the game.
- The order is a **rising sawtooth**, not a sort: each chapter climbs, spikes
  on its boss, and the displaced board opens the next chapter as a breather.
  "MIND BENDERS · EASY" on level 45 is the design, not a bug — the tier chip
  reads the grade, not the position.
- `bolt` is pinned to the emoji slot because EMOJI_BOSS *is* the BOLT board;
  loose, the player solved it twice.
- The **oracle** twist (name the link first, then group) was removed: it
  duplicated the early call, disabled it to avoid the clash, and spent the
  finale in the opening ten seconds. Its theme panel survives in git if the
  "brief" idea below is ever built.
- Twist deal rules: no adjacent repeats; emoji exactly once (it swaps in the
  one bespoke board); memory never beside blackout; cipher never beside
  scramble.
- **Memory boss ≠ Pairs.** Pairs is a flip-two mode on its own screen; the
  memory boss is the normal grouping game on a board you can no longer read.

**Level index**
- It is an **index, not a map**: solved levels are named rows in aligned
  columns, unsolved ones a strip of identical squares. Wrapped title chips
  were tried and looked like clutter; a grid of squares hid every unlock.
- The page opens at the **top** on purpose (the next level is the card
  there) — iteration 11's scroll-to-your-node was deliberately reversed. The
  one exception is a pending unlock reveal.
- **Chapter-key letters are visible and dealt scrambled.** Hiding them was
  backwards: the anagram *is* the puzzle, and you can't want a collectible
  you've never seen. Letters land before locks pop (you're paid before the
  index opens anything).
- Banked letters are **derived from cleared levels, never stored**; a beaten
  boss never re-locks; an unsolved key can't deadlock the campaign (the
  lookahead still opens levels past it); the win card's Next never walks
  into a sealed door.

**Game**
- The **early call is spent on opening the panel**, so the letter count can't
  be peeked at for free. The link mask shows one `?` per letter (iteration
  33) — the finale lost a little, the whole middle of the board gained a
  deduction.
- A loss keeps the link masked so the level is replayable.
- The tutorial board is STAR with no compound-word group; coach copy derives
  from `OPENING[0]`'s own first category, so re-pinning it can't strand the
  coach.

**Meta and platform**
- Daily is a deterministic seeded tour — same board for everyone, nothing
  stored; a daily win never touches campaign stars.
- Quests are a **pure function of the date**, paid in hints the moment a goal
  is met (no claim button); a `pairs`/`logic` draw is the only nudge into a
  side mode.
- Endless is locked behind a finished campaign — it's the payoff, not a
  fourth mode on day one.
- Storage: the "nothing durable" banner waits ~8 s for the async SDK; a live
  save is never overwritten by a stale platform copy (adoption only fills a
  key we have nothing for).
- Level tracking is **off by default**, shows a dash under `MIN_SAMPLE`, and
  treats the server's answer as untrusted input.
- Rewarded-ad failure paths **resolve true**: never strand a player behind an
  ad that couldn't load.
- **Puzzle content is not localized.** A board of English words can only be
  rewritten per language, not translated; a locale unlocks the Logic Grid
  (no vocabulary) and every menu, rule and result screen.

**Audio and motion**
- Music defaults to **off** — honest for a loop that has to survive an hour.
  Nothing is scheduled while the tab is hidden (a frozen clock fires it all at
  once on return).
- `usePresence` carries a **payload frozen at its last present value**: a
  leaving toast keeps its words, a leaving win card doesn't flip to the loss
  card, a leaving coach doesn't return null.
- The score counts up via the DOM, not React state — sixty renders a second
  of the game screen for one label is not a trade worth making.
- Motion "animates the identity": stamps, rattles, punched-paper chads, the
  link assembled letter by letter. Don't reach for generic fades.

## Open backlog

Ranked by expected impact. Nothing here is started.

1. **[platform] Level tracking has no endpoint.** `<meta name="wordgrid:stats">`
   is empty in both `index.html` and `docs/index.html`, so the whole feature
   is inert in production. Deploy `server/stats-server.mjs` (or equivalent)
   somewhere and point the tag at it.
2. **[platform] CrazyGames integration is unverified on-platform.** SDK, data
   module and ads all correctly no-op off-platform; final QA against their
   preview tool is still owed at submission time.
3. **[content] Ambiguity is hand-reviewed, not solver-proven.** Any new batch
   needs the full read in *Authoring a board*. Growing the daily pool is the
   evergreen content task.
4. **[ux] Landscape phones are cramped.** The two-column split needs ≥1024 px;
   at 844×390 it's one scrolling column behind the rotate hint. A compact
   landscape board (smaller tiles, controls rail at `md` + landscape) would
   make "Play anyway" a real option.
5. **[a11y] Never run past a real screen reader.** Keyboard play, Escape and
   the focus trap are in; nothing has been checked with VoiceOver/NVDA. A
   large-text mode is also still missing from Settings.
6. **[gameplay] The hint token has one shape** (reveal a theme, then a
   letter). A cheaper "rule out one tile" would let a stuck player spend less
   than a whole theme.
7. **[gameplay] Two twist candidates**, designed but not built: **brief** —
   the four theme names shown up front, tiles assigned to a *named* group
   (recycles the oracle's panel without the cold-spelling lottery; any board
   fits); **cascade** — the board re-scrambles after every solved group
   (kills the park-three-for-later strategy; scramble's board fit; never
   adjacent to scramble or cipher).
8. **[balance] Grades are one number per board.** A facet split (abstraction /
   pivot / interference) would let a chapter be built from one kind of hard.
9. **[mobile] Tall end-states scroll on small phones**; 320×568 scrolls a
   little on the board and finale (accepted for legacy phones).
10. **[engagement] Small retention hooks not built**: a post-win "N to
    Silver" nudge toast (the stats modal already says it), a daily-streak
    calendar with milestones, a "did you know" line about the link word on
    the win card.
11. **[music] The loop is written, not composed** — the melody is chosen at
    random inside the bar's chord, so it never develops or resolves. Recorded
    samples remain a taste call, not a gap (levels are measured; nothing
    clips).
12. **[docs] `README.md`'s intro still says "9 words / four categories of two"**
    — the board is 12 words, 4 × 3 spokes. Rewrite the first paragraph and the
    *Adding puzzles* section.

## Parked ideas

Not scheduled; listed so they aren't re-invented. Anything with a clock or an
energy cap is out (hard requirement 1).

- Leaderboard on the daily via the CrazyGames user/data SDK; cloud save.
  `server/stats-server.mjs` could grow a table if a backend is wanted anyway.
- Versus / async duel on the same board; a weekly seeded challenge.
- Themed packs (Movies, Science, Sports) with their own inks.
- Cosmetic unlocks (tile skins, confetti) bought with stars; streak freeze.
- Adaptive difficulty from the player's own win rate (the tracking client
  already has the numbers).
- Player-authored puzzles, and an authoring tool that runs the ambiguity
  checks as you write.
- Definition-on-tap for solved words; a harder no-hint mode.

## History

One line per iteration, newest first. The commit bodies carry the reasoning.

| # | What | Commits |
|---|---|---|
| 37 | GSAP for the beats, then Framer Motion retired entirely; `anim.ts`, `usePresence`, shared `dialogIn`; found and fixed a chapter-key DOM leak | `2dd039e` `d400a92` `a6f89ee` |
| 36 | Audio pass: mixer, limiter, reverb send, FM bells, sounds for silent moments, three music scenes, per-bus volume | `9e169e8` |
| 35 | Emoji boss rebuilt: the name is the answer, the picture misleads; banner names the picture; validate checks emoji maps | `c55d0ca` `31b2222` |
| 34 | Level tracking (client, reference server, dashboard, clear-rate line); submission pack finished and published at `/art/` | `08bab1e` `de34b1b` `7be41c8` `acd7606` |
| 33 | `storage.ts` (SDK mirror, memory fallback, banner); daily quests; link mask counts letters; `useModal` focus trap; rank ladder removed. Follow-ups: Endless gated on a finished campaign, shadows on one scale, compound group off the tutorial board | `5501af9` `e6f41d0` `b6548ba` `ee6ff21` |
| 32 | Oracle twist scrapped; memory and cipher twists added; twists re-dealt | `0682b1d` `621fc0c` `0ca9f24` |
| 31 | Boss briefing: rule + two-part brief per twist, dialog on an unbeaten boss, rule strip on the board | `cccaa8a` |
| 30 | Debug mode: `debug.ts`, free hints, the 🛠 tray; Next level skips cleared boards | `04dbd1b` `a3663bc` |
| 29 | Difficulty ramp rebuilt: hand grades, sawtooth placement, bosses cast to their twist, tier from grade | `6ea4f2a` |
| 28 | 100 levels in twelve chapters (37 new boards, four new chapters and keys) | `a922a59` |
| 27 | Boss door and the letter hand-over; keep working when the SDK is disabled | `9e2bccd` `b0886c6` |
| 26 | Chapter keys gate the boss; per-chapter page stain | `dd47d57` |
| 25 | Level select rebuilt as an index; landscape-first; unlock reveals | `5ef0a80` `1a2b50f` `47b6f5d` `6518df2` |
| 24 | Pairs timers and stale-state bugs; side effects out of updaters everywhere | `36ae84b` `c99bfc9` |
| 23 | Ambiguity pass over all 576 groups; real i18n catalogue + Spanish | `aebd0b5` `014b7c1` |
| 22 | Logic Grid: eight clue kinds on a vocabulary ramp, rules in one tested module | `eb90ccc` `e104f4b` |
| 20–21 | Review pass (hint spoilers, stale streak, typed finale) and burn-down (71 category names, early call, `applyProgress`, Game.tsx split, home fits the embed) | `8540e05` … `dc7ac44` |
| 18–19 | 80-puzzle daily pool; submission assets; global-English copy; opening curve; Pairs mode; Logic Grid first version | `bb9d553` `c77c8d0` `170729d` |
| 17 | The Puzzle Press retheme; two-column embed layout; live SDK; rewarded hint refill | — |
| 13–16 | Tutorial redesign (straight into play, welcome modal, escalating coach); animation review | — |
| 10–12 | Persona playtest → score/combo, tap-to-spell finale, Endless, daily hero, rewarded continue; device pass; content quality pass | — |
| 7–9 | Engine tests, difficulty tiers, hints, daily, achievements, PWA, share card, chapters and bosses | — |
