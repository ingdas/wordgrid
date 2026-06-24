# WordGrid — Backlog & Playtest Notes

A running log of playtest findings and the feature backlog. Findings come from
both manual review and an automated Puppeteer playtest (`scripts/playtest.mjs`),
which drives a real headless Chrome through solve / lose / reduced-motion flows
and asserts on the DOM.

## How to run the playtest

```bash
npm run build && npm run preview        # serve the build on :4173
npm i -D puppeteer                       # one-time (kept out of deps to stay lean)
BASE=http://localhost:4173/ node scripts/playtest.mjs
```

It writes screenshots and prints `=== ISSUES FOUND ===` at the end.

---

## Iteration 3 — Puppeteer playtest results

### Verified working (assertions passing)
- How-to-play auto-opens on first visit only.
- Board renders 9 uniform tiles, no text overflow (incl. SCISSORS, PASSION…).
- **Pivot concealment:** mid-play, every board tile shares one identical
  background — asserted by reading computed styles. The pivot cannot be picked
  out by colour. Solved spokes leave the board into their banner; the pivot
  stays as a plain neutral tile until the end.
- Banners mask the pivot as `◆ SHARED` during play; the word `STAR` never
  leaks into a banner before the reveal.
- Final group auto-solves; win card reveals "The shared word was STAR".
- Wrong guess costs one life; an identical repeated wrong guess costs none.
- 4 mistakes → loss; all four categories revealed.
- Confetti fires normally but is suppressed under `prefers-reduced-motion`.

### Fixed this iteration
- **[P0] Pivot derivable from colouring.** Previously solved spokes were
  coloured in place, leaving the pivot as the lone un-coloured tile. Now nothing
  on the board is ever colour-coded during play. *(addresses the explicit
  requirement: cannot derive the pivot because others are coloured and it isn't)*
- **[P2] Loss board inconsistency** — moot now that the board is never coloured
  mid-game; the loss state reveals everything through the banners + end card.
- **[P3] No favicon / blank tab** — added an inline SVG ◆ favicon.
- **[P2] Picker didn't scale** — with 31 puzzles the wrap-row was unwieldy;
  replaced with a horizontally-scrollable strip + ‹ › steppers + 🎲 random,
  auto-scrolling the active chip into view.

### Known test-harness artifacts (not product bugs)
- "pivot-hint shown: false" in Test B — the assertion samples the toast after a
  *repeated* wrong guess, which shows the dedupe toast instead. The pivot hint
  does fire on a first pivot-less guess.
- Earlier "5 banners on loss" — the selector also matched the gradient "Next
  puzzle" button; fixed by scoping to `.rounded-2xl.bg-gradient-to-r`.

---

## Feature backlog (ranked)

### Implemented (iterations 1–3)
1. ✅ Conceal the pivot (no colour tell; masked banners; end reveal)
2. ✅ Clear "used" memory via banners
3. ✅ End card reveals the shared word
4. ✅ Long-word tile sizing
5. ✅ Accessibility: `aria-pressed`, live region, labels, focus rings
6. ✅ `prefers-reduced-motion`
7. ✅ Repeated wrong guess doesn't cost a life
8. ✅ Share result (emoji grid; Web Share API → clipboard)
9. ✅ Completed-puzzle ✓ ticks in the picker
10. ✅ First-visit onboarding
11. ✅ Scalable puzzle navigation (scroll strip + steppers + random)
12. ✅ Puzzle-data validator (`npm run validate`)
13. ✅ Automated browser playtest harness

### Open — previously listed #11–#15, now reprioritised
- **[#11] Shuffle / rearrange remaining tiles.** A button to reshuffle the
  on-board tiles for a fresh look without losing progress. *(small)*
- **[#12] Move counter / optional timer.** Surface guesses-used and an
  opt-in timer for speed-runners; feed into the share string. *(small)*
- **[#13] Haptic feedback.** `navigator.vibrate` on correct/incorrect for
  mobile. Guard behind a settings toggle and reduced-motion. *(small)*
- **[#14] Guess-history strip.** Show past guesses as rows of coloured dots,
  like Connections, so players can see their path. *(medium)*
- **[#15] Daily puzzle mode.** Date-seeded puzzle of the day + streak tracking,
  shareable as "WordGrid #123". *(medium)*

### Additional ideas (newer)
- **[#16] Difficulty signalling.** Tag puzzles easy/medium/hard; let the picker
  filter. Some pivots (e.g. SCALE) are harder than others. *(medium)*
- **[#17] Hint system.** Optional "reveal one tile's group" at the cost of a
  life or a star, for stuck players. *(medium)*
- **[#18] Settings panel.** Persisted toggles: reduce motion override, sound,
  haptics, colourblind-friendly palette. *(medium)*
- **[#19] Colourblind-safe palette / patterns.** The four banner colours should
  stay distinguishable for deuteranopia/protanopia (add icons or patterns).
  *(medium, accessibility)*
- **[#20] Self-host fonts.** Currently Fraunces/Inter load from Google Fonts;
  bundle them via `@fontsource` so the build is fully self-contained and works
  offline / on strict-CSP hosting. *(small)*
- **[#21] Win/score persistence & stats.** Track per-puzzle best (fewest
  mistakes) and an overall completion %. *(medium)*
- **[#22] Keyboard shortcuts.** Enter to submit, Esc to clear, digit keys to
  toggle tiles. *(small)*
- **[#23] Puzzle-authoring docs / generator.** A short guide + maybe a helper
  to sanity-check that a pivot genuinely fits all four senses. *(medium)*
- **[#24] i18n scaffolding.** Externalise strings to support other languages.
  *(large)*
- **[#25] Unit tests for game logic.** Extract the solve/mistake reducer and
  cover it with Vitest, independent of the DOM. *(medium)*
