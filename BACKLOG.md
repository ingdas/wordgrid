# WordGrid — Critical Evaluation & Backlog

_Last updated: iteration 5._

The game is a casual word puzzle: **62 levels**, each a board of 8 words that
pair into 4 themed groups, all joined by one **hidden link word** revealed only
at the end. Flow: **Start → Level Map → Game (pair up + guess the link)**.

An automated headless-Chrome runthrough (`scripts/playtest.mjs`) drives the full
flow and currently passes with **zero console errors and zero issues**,
including the assertion that the link word never appears on screen mid-game.

---

## Critical evaluation (honest pass)

### What works well
- **Concealment is now airtight.** The link is a masked tile (`◆ ? ? ?`); its
  word is never rendered until the reveal, and it's never a board tile you could
  deduce by elimination. This fully resolves the long-running leak.
- **Strong loop:** pair matching → "guess the secret word" climax → stars →
  next level. The guess restores the original "find the shared word" challenge
  as a payoff instead of a giveaway.
- **Onboarding:** an in-context coached tutorial (not a wall of text) that waits
  for the player to actually make their first pair.
- **Game feel:** synthesized SFX, per-solve confetti, haptics, star animations.
- **Self-contained:** fonts bundled, audio synthesized, builds to `/docs`.

### Weaknesses / risks (ranked)
1. **[content] Pair ambiguity risk.** With pick-2, a level is only fair if each
   themed pair is unambiguous and no spoke plausibly pairs across groups. The 62
   puzzles are hand-checked for structure (unique tiles, pivot fits) but **not**
   for cross-pair ambiguity. A human pass / playtest of each is needed. *High.*
2. **[depth] The link guess is multiple-choice (1 of 4)** and the distractors
   are random other-puzzle pivots, often easy to eliminate by theme. Low
   challenge; no penalty for a wrong guess. *Medium.*
3. **[balance] Pairing can be easier than the old pick-3** — 8 tiles into 4
   pairs is gentle. Difficulty curve across 62 levels is undifferentiated. *Med.*
4. **[progression] Hard sequential gating** of 62 levels may frustrate players
   who want to jump around or who get stuck on an ambiguous one. *Medium.*
5. **[replay] Replaying a cleared level is trivial** — you already know the link,
   so the finale is a freebie; stars are easy to farm. *Low.*
6. **[a11y] The guess/reveal isn't announced** to screen readers; banner colours
   aren't colourblind-differentiated (no icons/patterns). *Medium.*
7. **[mobile] Tall layouts** (link card + 4 banners + grid + controls) can
   require scrolling on small phones near the end. *Low.*
8. **[audio] No background music / no master volume** beyond mute. *Low.*
9. **[meta] Streak only lives in localStorage**; no daily challenge, no
   leaderboard, nothing social beyond the share string. *Medium.*

### Fixed this iteration
- New masked-link mechanic (the core concealment fix).
- Interactive coached tutorial on first level.
- Doubled content: 31 → **62 levels** (all validated).
- **Loss now reveals all four groups** (previously only solved ones showed).
- Coach disappears on win/loss and records completion once the first pair lands.
- Tutorial/help copy rewritten to match the pair-and-link mechanic.

---

## Backlog (prioritised)

### P1 — correctness & fairness
- **Audit all 62 puzzles for pair ambiguity.** Write a checker that flags any
  spoke which could plausibly belong to another group's theme; human-review the
  flags. Consider a small playtest where solvers report "unfair" pairs.
- **Make the link guess matter.** Options: cost a star (or a "perfect" badge) on
  a wrong guess; or replace MC with typed entry + fuzzy match for a star bonus;
  or escalate options (6 instead of 4) on later levels.

### P2 — depth, balance, progression
- **Difficulty tiers.** Tag levels easy/medium/hard (e.g. by abstractness of the
  link); order the map as a curve and show the tier on each node.
- **Smarter distractors.** Pick link decoys that are thematically near the real
  link, not random, so the guess takes thought.
- **Looser gating / level jump.** Unlock in small batches, or allow replaying any
  cleared level and jumping ahead a few.
- **Hint system** (natural rewarded-ad hook): reveal one pair, or one decoy is
  removed from the link guess, at the cost of a star.

### P3 — polish & retention
- **Colourblind-safe banners** (icons/patterns per group) + screen-reader
  announcements for solves and the reveal.
- **Daily challenge** (date-seeded level) with a streak and a shareable
  "WordGrid #N — ★★☆" result.
- **CrazyGames SDK**: rewarded video for hints, interstitial between levels,
  analytics. Level boundaries are already clean ad breaks.
- **Background music** loop with its own volume control.
- **Stats screen**: best stars per level, total %, links guessed, best streak.

### Carried-over ideas (not yet done)
- Shuffle remaining tiles; move counter/timer; keyboard shortcuts; i18n;
  unit tests for the reducer; per-level best-time.
