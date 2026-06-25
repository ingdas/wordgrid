# WordGrid — Critical Evaluation & Backlog

_Last updated: iteration 7 (full backlog pass)._

A casual word puzzle: **62 levels**, each a board of 12 words that sort into 4
themed groups of four, all joined by one **hidden link word** revealed only at
the end. Flow: **Start → Level Map → Game (group + guess the link)**.

Tooling: `npm run build` (type-check + build to `/docs`), `npm run validate`
(puzzle structure), `npm run audit` (ambiguity helper), `npm test` (engine unit
tests). A headless-Chrome runthrough (`scripts/playtest.mjs`) drives the whole
flow and passes with **zero console errors / zero issues**, including the check
that the link word never appears on screen mid-game.

---

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
