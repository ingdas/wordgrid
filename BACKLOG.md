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
   Undo to take one back, auto-checks when full. The first letter is pre-placed
   for free, and the reveal-a-letter hint locks in the next correct letter.
   (Combines former items 1 + 2.)
3. **Difficulty re-tune** — ✅ obscurity weighting so rare short words
   (KETCH/SLOOP/YAWL, ARDOR, OBOE…) stop appearing in "Easy"; longer term, an
   LLM-judged ordering.
4. **Compact finale layout** — fit the end-state on one phone screen (collapse
   solved banners to chips during the guess).
5. **Coach covers the whole loop** — show the typed finale + hints up front so
   the keyboard step isn't a surprise.
6. **Clarify the home ◆/🏆 affordances** — the top-left trophy and the
   "Achievements" tile both open stats (redundant); make one a Settings gear.

**Engagement / dopamine:**
7. ✅ **Score + combo system** — points per group, a consecutive-solve combo
   multiplier, floating "+N" popups, score on the win card + lifetime total.
8. ✅ **Win-card variety** — score/combo praise so the reward isn't identical
   every level.
9. **Escalating juice** — bigger burst/sound as the combo climbs.
10. **Player level / rank meta** — an XP bar that fills across levels for a
    sense of growth beyond stars.
11. **Endless / Zen mode** — back-to-back boards, no fail, pure flow (commuters).
12. **Surface a boss sooner** — shrink early chapters so the first boss lands
    ~level 5, or add a boss "teaser".
13. **Rewarded continue** — after 4 mistakes, watch-ad / spend coins to keep
    going (retention + CrazyGames monetization).

**Word-fan depth:**
14. **"Did you know" reveal** — show the link word's meaning / in a sentence on
    the win card.
15. **Definition-on-tap** for solved words (educational hook).
16. **Harder ranked modes / no-hint challenge** for experts.

**Aesthetic / accessibility / retention:**
17. **Settings panel** — sound, music, **large-text**, colourblind, reset.
18. **Animated home** — a looping tile/preview so the landing isn't static.
19. **Resume CTA** — "Continue · Level N" with the next node teased on home.
20. **De-intimidate progress** — focus the current chapter, collapse far ones,
    show "Chapter ⭐ x/24" rather than the scary 186.
21. **Achievement nudges** — "1 away from Silver!" prompts in stats/after wins.
22. **Daily streak calendar** + milestone rewards.
23. **Cosmetic unlocks** (tile skins / confetti) bought with stars or coins.
24. **Richer share card** — a rendered image, not just text.

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
