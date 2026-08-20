# WordGrid

A bite-sized category-finding puzzle inspired by NYT Connections — but with a twist.

There are **9 words** hiding **4 categories**. Unlike Connections, the groups
overlap: **one secret "pivot" word belongs to every category**. Find that shared
word, then build all four groups of three around it.

![groups of three, one shared word](docs/index.html)

## How to play

1. A board shows **12 words** plus a **masked "secret link"** — one `?` per
   letter, so its length is a clue you can work with from the first move.
2. Tap **three words that share a theme**, then **Submit** — the hidden link
   joins them into a group of four. Its word stays concealed the whole game.
3. Find all **four groups** (you get **4 mistakes**), then **spell the secret
   word** that links them all. The reveal is the climax, not a giveaway.
4. Worked it out early? **Call the link** with groups still open — one shot per
   level, and it pays a bonus for every group you hadn't found yet.
5. Fewer mistakes earn more **stars** (3 max per level).
6. **Three daily quests** ride along on the home screen — "solve 2 puzzles",
   "hit a ×3 combo", "clear a Pairs board" — drawn fresh at midnight and paid
   in hints (1 each, +2 for all three).

There are **101 levels** across twelve chapters, each closing on a **boss** that
plays by its own rule — and says what that rule is: the door and the up-next
card carry it in a line, a **briefing** opens on any boss you haven't beaten,
and the rule stays on the board (tap it for the briefing again) for the whole
fight. The order isn't a straight climb: every chapter opens on a
breather, works up, and finishes on the hardest board it can find — one that
suits the twist that boss plays by. They're browsed from an **index** rather than a level
grid, and the two halves of it read differently on purpose: a level you've
solved gets an index line naming the board you beat (`Bank On It ··· ⭐⭐⭐`),
while the ones ahead are a strip of plain numbered tiles — a title hints at the
link, so an unplayed level never gets one. Whatever you play next is a card at
the top of the page.
One boss plays by no word rule at all: chapter 11 closes on the **Logic Grid** —
twelve blank tiles, four hidden groups of three, and clues that talk only about
the grid. It's pure deduction, it has a level of its own (no word board is spent
on it), and it's the only place in the game you'll meet one.

Clearing a level opens another: the index **shows** the lock come off it, once,
and says what it is — a plain level, a boss and its twist, or a new chapter.
Each chapter also hides a **key**: every level in it gives up one letter, and
spelling the word those letters make is what opens that chapter's boss door.
Chase the ⭐ total and your 🔥 streak.

## Languages

The interface is localized (`src/i18n/`): English and Spanish, picked up from
`navigator.language` and switchable in Settings. The **word puzzles stay
English** — a board of English words can't be translated, only rewritten — so
a translated UI fully unlocks the Logic Grid boss (pure deduction, no
vocabulary) and makes every menu, rule and result screen readable around the
rest. Adding
a language is one catalogue file plus a line in `LOCALES`; `npm test` fails on
a missing key or a dropped `{placeholder}`.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) for the animations

## Develop

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + build to /docs
npm test          # unit tests for the pure game engine (src/engine.ts)
npm run validate  # structurally check every puzzle (13 unique tiles, link fits)
npm run audit     # flag spokes that may be ambiguous, for human review
```

### Debug mode

For playtesting and QA. Turn it on by appending **`?debug`** to the URL (it's
remembered afterwards — `?debug=0` clears it) or with the **Debug mode** toggle
in **Settings → Developer**. It gives you:

- every level and every boss door **unlocked**, keys included;
- **free hints** — the bank reads ∞, nothing is spent, and no ad is offered;
- a **🛠 tool tray** in the bottom-left corner: *solve a group*, *auto-solve
  level* (which wins it outright, stars and all), *reveal all themes*, *peek at
  the link*, *+5 hints* and *force a loss*;
- on the level index, *clear next level* and *+10 hints*; on the Logic Grid
  boss, *auto-solve grid*.

Nothing about it leaks into a normal save: the tray is only mounted while debug
is on, and the switch lives in its own localStorage key (`wordgrid:debug`).

### Saving

Progress goes through [`src/storage.ts`](./src/storage.ts), not straight to
`localStorage`. Inside the CrazyGames iframe the game is third-party content,
and the browser can partition, empty or refuse that store — so every write also
goes to the **CrazyGames data module** when it's there, and on load the two are
reconciled: a save the platform still holds is adopted back, and a local-only
save is pushed up before the browser can lose it. When *nothing* durable is
available the session still plays out of memory, and says so in a banner rather
than pretending it saved.

### Automated playtest

`scripts/playtest.mjs` drives a headless Chrome through the solve / lose /
reduced-motion flows and asserts on the DOM (including that the pivot is never
distinguishable by colour mid-game). `scripts/pairs.test.mjs`,
`scripts/debug.playtest.mjs` and `scripts/iteration33.playtest.mjs` (quests,
the link mask, modal focus, storage-less play) cover the rest. See
[`BACKLOG.md`](./BACKLOG.md) for how to run them and the latest findings.

## Hosting on GitHub Pages

The production build is committed to [`/docs`](./docs). To publish:

1. Push to `main`.
2. In **Settings → Pages**, set **Source** to *Deploy from a branch*,
   branch **`main`**, folder **`/docs`**.
3. The game goes live at `https://<user>.github.io/wordgrid/`.

The Vite `base` is set to `./` so all asset paths are relative — the build works
from any subpath without further configuration.

## Adding puzzles

Puzzles live in [`src/puzzles.ts`](./src/puzzles.ts). Each puzzle declares a
`pivot` word plus four categories of two `words` each (the pivot is added to
every category automatically), giving the 9-word board. Add an entry, run
`npm run build`, and it appears in the puzzle picker.
