# WordGrid — Critical Evaluation & Backlog

_Last updated: iteration 10 (persona playtest + scoring/combo, finale & difficulty fixes)._

A casual word puzzle: **62 levels**, each a board of 12 words that sort into 4
themed groups of four, all joined by one **hidden link word** revealed only at
the end. Flow: **Start → Level Map → Game (group + guess the link)**.

Tooling: `npm run build` (type-check + build to `/docs`), `npm run validate`
(puzzle structure), `npm run audit` (ambiguity helper), `npm test` (engine unit
tests). A headless-Chrome runthrough (`scripts/playtest.mjs`) drives the whole
flow and passes with **zero console errors / zero issues**, including the check
that the link word never appears on screen mid-game.

---

## CrazyGames launch-readiness backlog (iteration 17)

Played the game again as a CrazyGames submission reviewer (incl. a 1280×720
landscape-iframe pass — their most common desktop embed). Ranked by expected
impact on the platform:

1. ✅ **Retheme away from the "AI default" look.** The dark purple/fuchsia
   gradient + glassmorphism is exactly what every LLM generates; it reads
   generic and dates the game. New identity: **"The Puzzle Press"** — a warm
   paper/print daily-puzzle-page look (cream paper, ink type, flat category
   colours, chunky offset shadows, stamp-red accents, serif masthead). It
   matches the word-puzzle audience (NYT-games adjacent, older & calmer than
   the bloxd/Minecraft crowd) while staying playful. (Done this iteration.)
2. ✅ **Landscape/desktop layout** — on wide viewports (≥lg) the game now splits
   into two columns: link card + banners + board on the left, timer/controls/
   finale/end-card in a right-hand rail. At a 1280×720 embed everything sits
   above the fold with zero page overflow (Submit at y≈222). Mobile flow is
   untouched (the wrappers only flex at lg).
3. ✅ **Enable the real CrazyGames SDK** — the v3 script now loads (async,
   defensive: every call no-ops when it's absent, so local/GitHub Pages play is
   unaffected), with loadingStart/loadingStop wired around app boot. Final QA
   against their preview tool still needed at submission time.
4. **Dedicated daily pool + content batch** — the daily currently redraws from
   the 62 campaign levels (repeats + spoilers). Author 60–100 new puzzles,
   reserve a slice for dailies.
5. ✅ **Rewarded hint refill** — an empty bank now swaps the hint pill (both
   in-board and in the finale) for a stamp-red "🎬 refill (+3)" button backed by
   requestRewarded (instant in standalone play, an ad on the platform).
6. **Session quests** — 3 rotating dailies ("solve 2 puzzles", "hit a ×3
   combo", "guess a link first try") with hint/XP rewards; drives the
   session-length metric CrazyGames ranks by.
7. **Leaderboard on the daily** via the CrazyGames user/data SDK (their
   platform accounts remove the need for our own backend).
8. **Submission assets** — cover art (16:9 + square), 3–5 screenshots in the
   new theme, short gameplay clip; regenerate og-image to match the retheme.
9. **Global-English copy pass** — shorten idioms ("Worse Than Bite",
   "hypercasual" phrasing) for the huge non-native-speaker share of the
   audience.
10. **Save-data resilience in iframes** — localStorage can be partitioned or
    blocked in embeds; mirror progress through the CrazyGames data module when
    present.
11. ✅ **Tab-blur pause** — visibilitychange now suspends the AudioContext and
    calls gameplayStop(); on return it resumes audio and re-opens the gameplay
    session if a level is active.
12. **First-5-levels curve** — the opening levels are near-identical difficulty;
    tighten so level 5 already feels like a step up.
13. **Sound polish** — the synth blips are serviceable; a small recorded SFX set
    (tile tap, group pop, win sting) would lift perceived quality a lot.
14. **Interstitial pacing guard** — never show one within 60s of the last, per
    CrazyGames policy.

## Animation & visual-polish review (iteration 14)

Played the whole game watching motion. Findings + fixes:

- **Missing animation (the big one): the finale felt flat.** Tapped letters
  snapped into the answer slots with no feedback and there was no "correct!"
  moment. Now each placed/revealed letter **pops in** (spring), the **next slot
  has a pulsing fuchsia ring** so you always know where you're typing, and the
  whole row gives a **success pulse** when the word resolves. (Reveal-a-letter
  pops too, for free.)
- **Hard cut on tile select** → added `transition-colors` so selecting /
  deselecting a tile eases instead of snapping.
- **Visual noise on the level map**: removed the per-node tier "dot," which read
  like an unread/notification badge and was redundant (difficulty is shown
  in-level and by chapter).
- **Expectation mismatch**: a *locked* boss node showed only a 👑 (looked
  playable). Locked bosses now show a 🔒 with the crown as a teaser above.
- **Collision**: the live score badge overlapped the "…in every group" header.
  The header shortens to "Secret link" once the score badge appears.

Everything else (page transitions, tile/banner springs, secret-link reveal
flip, score popups, combo-scaled confetti, coach slide, end-card + star
stagger, mistake-dot pips, wrong-guess shake) was reviewed and left as-is —
they read as purposeful, not noisy.

## Tutorial redesign + first-launch (iteration 13)

- **Straight into gameplay**: a brand-new player now lands directly in the
  tutorial level (no menu) — playing within seconds. Returning players still get
  the home screen. (SDK gameplay session + audio unlock are wired for the
  direct-entry case.)
- **Attention-grabbing welcome** (iteration 15 follow-up): the opening step is a
  centred, dimmed **"How to play" modal** with the three core rules and a big
  "Let's play" CTA — it gates the board so a first-timer reads the rules instead
  of tapping past a quiet card. The hands-on coaching then continues inline.
- **Coach never off-screen on small embeds** (iteration 16): the inline coach
  (steps 1–2) is now `position: sticky` at the bottom — it sits in-flow just
  below the board on tall screens, but pins to the bottom of the viewport on
  short CrazyGames-style resolutions so it's always visible without scrolling.
  (`main` lost its `flex-1` so the sticky box is content-sized, not full-height.)
- **Hands-on, think-for-yourself coach**: instead of highlighting the answer
  tiles, the coach reveals a group's *theme* ("three of these mean a famous
  person") and lets the player find the words. Wrong guesses cost nothing during
  the tutorial and the nudge **escalates** — theme reminder → stronger theme
  hint → finally a single word revealed ("ICON is one of the three") — but never
  the whole group.
- **Skippable**: every coach card has a Skip button.
- **Finale prompt**: first time you reach the tap-to-spell step, a one-time hint
  explains the four groups all point to one hidden word.
- **Solved words stay visible**: solved groups keep showing their words through
  the finale (the banners just shrink a little), per feedback — no more hiding
  them behind a chip.
- Kept STAR as the tutorial puzzle: celebrity / night sky / ___-FISH / symbols
  all resolve to STAR — an ideal first "aha".

## Content quality pass (iteration 12)

Read all 62 puzzles and replaced genuinely obscure spokes with more common,
interesting words (none needed deleting — every level was salvageable). 18
puzzles touched:

- **bark**: sailing jargon SLOOP/KETCH/YAWL → "Kinds of boat" YACHT/CANOE/FERRY
  (this single fix made bark a fair Level 2 again).
- **well**: AQUIFER→STREAM, HALE→ROBUST, DERRICK→DRILL.
- **cell**: ANODE/CATHODE → SOLAR/DYNAMO (also more accurate "power sources").
- **stamp**: QUASH/ERADICATE → ERASE/DESTROY.
- **tank**: APC→CHOPPER, CISTERN→JUG.
- **shower**: FETE→FIESTA, BESTOW→SPLURGE.
- **sole**: PLAICE→FLOUNDER ("Fish on the menu").
- **note** TENNER→DOLLAR, **drop** LOZENGE/PASTILLE→LOLLIPOP/GUMDROP,
  **check** GINGHAM→FLORAL, **forge** BELLOWS→TONGS, **break** RESPITE→BREATHER,
  **pen** CLINK→SLAMMER, **trunk** BOUGH/COFFER→BRANCH/LOCKER, **nail**
  BRAD→STAPLE, **date** TRYST→AFFAIR, **track** SLEEPER→SIGNAL, **fire**
  ARDOR→DRIVE.

The difficulty scorer's obscure-word set was pruned to match. `npm run validate`
and `npm run audit` are clean.

## Device / resolution pass (iteration 11)

Ran the full flow across eight viewports (tiny 320×568, 360×640, 390×844,
430×932, phone-landscape 844×390, tablet portrait/landscape, desktop 1440×900),
measuring vertical overflow per screen.

Findings & fixes:
- ✅ **Landscape phones were broken** (board/finale/home overflowed by 200–500px;
  the Play button sat below the fold). Added a CSS **rotate-to-portrait hint**
  shown only on short landscape viewports (`max-height: 500px`) — tablets and
  desktop (tall enough) never see it.
- ✅ **Short phones overflowed** the board/finale. Trimmed the game container's
  dead padding (`pb-16 pt-5` → `pb-8 pt-4`) and the home's top padding; the
  finale now fits on a 360-wide phone and the board fits to ~390.
- ◐ **Tiny 320×568** still scrolls a little on the board/finale, but every core
  control (tiles, submit, letter bank, buttons) is reachable and the page
  scrolls cleanly. Acceptable for the smallest legacy phones.
- ✅ **Tablet & desktop** render cleanly — content centred in a max-w-xl column,
  no overflow.
- Dropped the free-first-letter reveal in the finale (redundant with the bank).

## Persona playtest (iteration 10)

Played the game cold (cleared storage, ignored prior context) end-to-end, then
re-played through three distinct CrazyGames personas. Verbatim takeaways:

**1. "Tap-happy Tyler" — 13, hypercasual mobile gamer, ~50 games/week.**
- _Clear?_ Skipped the coach. Got "tap 3, submit" fast, but the **typed-link
  finale stalled him** — pulling up a keyboard to type a word feels like
  homework on mobile.
- _Engaging?_ Loved the confetti/stars, but every level gives the **same
  reward** — no score, no combo, no "+points" dopamine, nothing to beat.
- _Visual?_ "Looks sick." Gradients & juice land well.
- _Bored?_ **Yes, by level 3.** Identical loop, no escalation, bosses are
  locked far away (level 8).

**2. "Crossword Carol" — 55, NYT Connections/crossword devotee.**
- _Clear?_ Instantly — the "secret link" spin is clever and she liked it.
- _Engaging?_ Enjoyed the deduction; wants **more wordplay payoff** (definition
  / "used in a sentence" on reveal) and tighter fairness.
- _Visual?_ Good, a touch flashy; wishes for a **larger-text / calmer mode**.
- _Bored?_ Hit an early wall: **level 2 is sailing vessels (KETCH/SLOOP/YAWL)** —
  obscure words ranked "Easy". Felt unfair so soon. Difficulty curve is shaky.

**3. "Commuter Priya" — 30, casual, 5-minute phone sessions.**
- _Clear?_ Yes. But **186 stars + 8 locked chapters** reads as a big commitment
  for a quick game.
- _Engaging?_ Likes the Daily. Wants to **feel progress fast** and resume
  instantly.
- _Visual?_ Appealing. The **finale screen scrolls** on a small phone (link card
  + 4 banners + input + buttons).
- _Bored?_ Would drop without a fresh hook surfaced early; the interesting boss
  modes are hidden too deep.

### Backlog from the playtest (impact-ranked)

**Friction / clarity (do first):**
1. ✅ **Tap-to-build link finale (no keyboard)** — replaced the text input with a
   ~13-tile letter bank; tap letters to spell the word, each tile used once,
   Undo to take one back, auto-checks when full. The reveal-a-letter hint locks
   in the next correct letter. (Combines former items 1 + 2. The earlier
   free-first-letter reveal was dropped — the bank already removes blank-page
   paralysis, so the link now starts fully blank.)
3. **Difficulty re-tune** — ✅ obscurity weighting so rare short words
   (KETCH/SLOOP/YAWL, ARDOR, OBOE…) stop appearing in "Easy"; longer term, an
   LLM-judged ordering.
4. ✅ **Compact finale layout** — the four solved groups collapse into a
   two-column chip strip during the guess so the whole end-state fits one
   phone screen.
5. ✅ **Coach covers the whole loop** — the tutorial now tells you you'll *tap
   out* the link (no typing) so the finale isn't a surprise.
6. ✅ **Clarify the home affordances** — the redundant top-left trophy is now a
   ⚙️ Settings gear (Achievements still reachable from its own tile).

**Engagement / dopamine:**
7. ✅ **Score + combo system** — points per group, a consecutive-solve combo
   multiplier, floating "+N" popups, score on the win card + lifetime total.
8. ✅ **Win-card variety** — score/combo praise so the reward isn't identical
   every level.
9. ✅ **Escalating juice** — the confetti burst scales with the combo, so a
    streak of solves feels increasingly celebratory.
10. ✅ **Player level / rank meta** — lifetime score now feeds an XP ladder
    (Novice → Legend) with a progress bar on home and a "Rank up!" toast when
    you tick over.
D2. ✅ **Daily-first (success rework, part 2)** — the Daily is now the Home
    **hero**: a card with today's date, a **7-day streak strip** (🔥 for solved
    days, a dot for today), and a Solve CTA that flips to "✓ Solved! 🔥N · next
    in Xh Ym" once done. In-game it reads "📅 Daily · Today's challenge" (no
    level-number leak, no boss twist), exits to Home, and the win card nudges
    "come back tomorrow to keep your streak." Streak strip + countdown derive
    from `daily.lastDate`/`streak` (no new storage). Still shares the same puzzle
    for everyone each day. Next: a dedicated daily pool + more content so the
    daily never repeats a campaign level.

11. ✅ **Endless / Zen mode** — a 🧘 mode from Home: back-to-back random boards,
    **no fail** (no mistake cap, no loss), a running "Solved N · ✦ score"
    counter, a "Next puzzle" loop, and a best-run saved (`endlessBest`). Wins
    still feed lifetime score/rank. The "one more" session-extender CrazyGames
    rewards — first deliverable of the success rework.
12. ✅ **Surface a boss sooner** — front-loaded chapter sizes so the first boss
    now lands at level 6 (was 8) and the early map feels less like a wall.
13. ✅ **Rewarded continue** — running out of guesses now offers a one-time
    "second chance" (a rewarded ad via the SDK, instant in standalone play) that
    hands back two tries before the run ends.

**Word-fan depth:**
14. **"Did you know" reveal** — show the link word's meaning / in a sentence on
    the win card.
15. **Definition-on-tap** for solved words (educational hook).
16. **Harder ranked modes / no-hint challenge** for experts.

**Aesthetic / accessibility / retention:**
17. ◐ **Settings panel** — sound, music, **calm mode** (dial back confetti &
    motion), and reset-progress with a confirm. (Large-text still to come.)
18. ✅ **Animated home** — the logo gently floats over a soft pulsing aura so the
    landing screen isn't static.
19. ✅ **Resume CTA** — the home button reads "Continue · Level N" for returning
    players, pointing at their next level.
20. **De-intimidate progress** — focus the current chapter, collapse far ones,
    show "Chapter ⭐ x/24" rather than the scary 186.
21. ◐ **Achievement nudges** — stats now flag "🔥 N to Silver!" when you're close
    to the next tier (a post-win nudge toast is still to come).
22. **Daily streak calendar** + milestone rewards.
23. **Cosmetic unlocks** (tile skins / confetti) bought with stars or coins.
24. ✅ **Richer share card** — wins render a spoiler-free 1080×1080 image (stars,
    the coloured solve path, score, link ✓, time) shared via the Web Share API
    with the text caption, or saved + copied as a fallback.

(Implemented this iteration: 1, 3, 7, 8 — see below.)

## Visual/UX review (iteration 9)

Walked the whole game and compared it to the intended ideal. Issues found:

1. ✅ **Hint button far too subtle** — was a faint underlined text link; now a
   prominent amber pill with a count badge.
2. ✅ **No play history** — added a recorded history (wins & losses, newest
   first) with a modal reachable from Home (📜) and Stats.
3. ✅ **Home top-aligned with a dead void** — added a quick-action row (How to
   play · Achievements · History) and a stars/hints/streak chip.
4. ✅ **Level map monotony** — replaced the flat padlock wall with named
   **chapters** ("Your journey"), per-chapter star counts, 👑 **boss** nodes,
   and locked chapters teased as "Locked".
5. ✅ **Ghost-hint placeholders faint** — now clearer dashed boxes.
6. ✅ **Stats pill didn't read as a button** — added a `›` affordance + label.
7. ◐ **Bottom control cluster** — improved via the prominent hint pill; minor
   spacing tidy still possible.

## 20 reworks & features to make WordGrid more engaging

A. **Versus / async duel** — both players get the same board; compare time/stars.
B. **Endless / Zen mode** — back-to-back random boards, no fail, for flow.
C. **Time Attack** — solve as many as possible in 3 minutes; leaderboard.
D. **Lives/energy + comeback** — soft session cap that nudges return visits.
E. **Themed packs** — Movies, Science, Sports sets with their own art/colours.
F. **Weekly challenge** — a harder seeded board + a weekly leaderboard.
G. **Combo/score multiplier** — fast consecutive solves build a visible combo.
H. **Streak freeze / wildcard** — spend currency to protect a daily streak.
I. **Coins economy** — earn coins; spend on hints, shuffles, board themes.
J. **Cosmetic themes** — unlockable tile skins, backgrounds, confetti styles.
K. ✅ **Reveal-a-letter hint tier** — finale letter mask; spend a token to
   reveal the next letter of the link.
L. ✅ **"One away" radar** — wrong guesses with two correct picks show
   "🎯 So close — one away!" (engine-detected, unit-tested).
M. **Adaptive difficulty** — tune board difficulty to the player's win rate.
N. ✅ **Story/level-map progression** — chapters with flavor text + boss nodes.
   **Every boss now plays differently** — and these are real changes to how the
   game plays, not just cosmetics. One twist per chapter, no two adjacent alike:
   - **emoji** — a bespoke picture-only board (pivot BOLT, concrete-noun spokes,
     lightning emoji deliberately omitted so the link isn't spoiled); you read
     pictures instead of words.
   - **scramble** — every tile is an anagram you decode before grouping.
   - **the oracle** — the puzzle turned inside out. You're shown all twelve
     words *and* the four theme names up front, and must deduce + type the
     hidden link FIRST; only then do you group. No timer, free retries — a
     chill, lateral-thinking inversion (kept the game relaxed: no time pressure).
   - **impostors (decoy)** — three trap tiles belong to NO group; include one in
     a guess and the group busts, so you have to spot the fakes (15-tile board).
   - **blackout** — solved group names/words stay hidden until the final reveal,
     so you can't lean on what you've already found.
   On a **loss the secret link is no longer revealed** — it stays masked so you
   can still discover (and type) it on a replay; play history hides a lost
   level's title too, since the title spells the link.
O. **Player-created puzzles** — an authoring tool + community puzzle feed.
P. **Hint-from-a-friend** — share a board; a friend can send one theme hint.
Q. **Rich animated share card** — render a per-result image, not just text.
R. ✅ **Achievements 2.0** — Bronze/Silver/Gold tiers, progress bars, and hint
   rewards per tier (shown in the stats modal).
S. **Sound/track packs** — selectable music beds + a real volume slider.
T. **Localization** — finish i18n and ship 2–3 languages for reach.

## Growth pass (iteration 8)

Focused on the levers that actually drive a casual web game's reach & retention:

- **Spoiler-free share** (Wordle-style): level/daily, star rating, the solve
  path as coloured squares, link ✅/❌, time and mistakes, plus the play URL.
  Also fixed a leak — the old share printed the level title (which spells the
  link to recipients).
- **Rich link previews**: Open Graph + Twitter Card meta and a branded
  1200×630 `og-image.png` (generated by `scripts/gen-assets.mjs`).
- **PWA / installable / offline**: web manifest, app icons, apple-touch-icon,
  and a network-first service worker. "Add to home screen" + offline play.
- **Achievements** (9): unlock toasts on win + an earned/locked grid in the
  stats modal — concrete goals that pull players back.
- **Hidden-title leak** also fixed earlier this pass (title shown only on reveal).

## Done in the full backlog pass (iteration 7)

### P1 — correctness & fairness ✅
- Manual ambiguity review of all 62 levels; fixed 4 ambiguous spokes
  (ring BAND→HALO, mold SHAPE→SWAY, well BORE→OASIS, trunk LIMB→BOUGH) and added
  an `npm run audit` helper.
- A wrong "guess the link" now costs a star (engine-enforced, message on the card).

### P2 — depth, balance, progression ✅
- Difficulty tiers (Easy/Medium/Hard) via a word-length/rarity heuristic; levels
  ordered easiest-first (STAR pinned), tier dot on each node.
- Hint button: reveal a group for a star (also a rewarded-ad hook).
- Smarter link decoys (biased to the answer's length).
- Looser gating: a window of levels (lookahead 3) stays unlocked.

### P3 — polish & retention ✅
- Colourblind-safe groups (distinct ●▲■◆ shapes) + aria-live announcements.
- Daily Challenge (date-seeded) with its own streak, on the start screen.
- Stats modal: stars, levels cleared, completion %, links guessed, streaks.
- Background music: synthesized ambient loop with its own 🎵 toggle (default off).
- CrazyGames SDK shim (`src/sdk.ts`), wired for gameplay lifecycle, interstitials,
  rewarded ads, and happytime; commented script tag in `index.html`.

### Carried-over ✅
- Pure, unit-tested engine (`src/engine.ts`, `npm test`).
- Shuffle tiles; live timer + move counter; per-level best time on the win card.
- Keyboard shortcuts (Enter submits, Escape clears).
- i18n scaffold (`src/i18n.ts`) with a few strings wired.

---

## Still open / honest caveats

1. **[content, high] Ambiguity is hand-reviewed, not solver-proven.** With
   groups of four the risk is real; a word that fits two themes will feel unfair.
   `npm run audit` only flags generic/short spokes, not semantic overlap. Wants a
   real playtest or an LLM-judge pass over all 248 groups.
2. **[depth] The link finale is still 1-of-4 multiple choice.** Decoys are
   smarter but a typed-entry mode (with fuzzy match) would be a bigger challenge.
3. **[balance] Difficulty is a length heuristic**, not true semantic difficulty;
   the curve is approximate.
4. **[i18n] Only a handful of strings are externalized.** Most copy is still
   inline; full extraction + a second locale remains.
5. **[ads] CrazyGames integration is a shim.** Real ads/analytics only work once
   embedded on CrazyGames with their SDK script and an approved build.
6. **[music] Ambient loop is minimal** (random pentatonic pads); a richer,
   layered track with a real volume slider would feel more premium.
7. **[a11y] Not audited with a real screen reader / keyboard-only run**; tile
   selection works via Tab+Space but hasn't been formally tested.
8. **[mobile] Tall end-state layouts** (link card + 4 banners + grid) can scroll
   on small phones.

## Possible next ideas
- Leaderboards / cloud save (needs a backend).
- Achievements (perfect streaks, all-Easy 3-stars, daily streak milestones).
- Theme/colour settings; larger-text mode.
- A puzzle-authoring tool that runs the ambiguity check as you write.
