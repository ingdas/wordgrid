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

There are **100 levels** across twelve chapters, each closing on a **boss** that
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
Clearing a level opens another: the index **shows** the lock come off it, once,
and says what it is — a plain level, a boss and its twist, or a new chapter.
Each chapter also hides a **key**: every level in it gives up one letter, and
spelling the word those letters make is what opens that chapter's boss door.
Chase the ⭐ total and your 🔥 streak.

## Languages

The interface is localized (`src/i18n/`): English and Spanish, picked up from
`navigator.language` and switchable in Settings. The **word puzzles stay
English** — a board of English words can't be translated, only rewritten — so
a translated UI fully unlocks the Logic Grid (pure deduction, no vocabulary)
and makes every menu, rule and result screen readable around the rest. Adding
a language is one catalogue file plus a line in `LOCALES`; `npm test` fails on
a missing key or a dropped `{placeholder}`.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [GSAP](https://gsap.com/) for the beats, [Framer Motion](https://www.framer.com/motion/)
  for presence and layout — see [Motion](#motion)

## Motion

The animation is split down one line, and it isn't arbitrary. **Framer Motion**
keeps what it is good at: things entering and leaving (`AnimatePresence` — the
toast, the reward popups, the second-chance offer) and layout that has to
reflow. **GSAP** owns the *beats* — the moments the game reacts to something you
did — because those want timelines, staggers and to be fired from an event
handler, which is awkward in a declarative animation library and native to an
imperative one. Nothing animates a property that a `motion.*` component is also
driving on the same node, or the two would take turns writing the same
transform.

All of it lives in [`src/anim.ts`](./src/anim.ts), and it animates the identity
rather than in spite of it: this is a print shop, so things are **stamped** onto
the page (a hand-authored `CustomEase` that hits hard and rocks twice, like a
rubber stamp on paper), a rejected guess **rattles** the board like a shoved
sheet, and the confetti is punched-paper chads that flutter edge-on as they
fall. The beats worth knowing about:

- **A solved group** is one move, not two. The three tiles you picked are
  photocopied where they stand, the banner is stamped onto the page, and the
  copies are flown into it — so the group visibly *becomes* the banner instead
  of one thing vanishing while another appears somewhere else. The paper is
  then thrown from the banner, which is where the good news happened.
- **A shuffle** slides every tile from where it was to where it now is
  (GSAP Flip), with a few degrees of spin so it reads as a hand of cards being
  cut rather than a spreadsheet re-sorting.
- **The score** counts up to its new total instead of jumping to it, written
  straight to the DOM — sixty renders a second of a whole game screen to
  animate one label is not a trade worth making.
- **The link reveal** — the climax — sets the word letter by letter, as if it
  were being assembled in a composing stick.
- **A spent guess** doesn't fade out. It takes a hit: a hard flick out and back
  down to a grey nub.

One module-level flag turns every one of them into a cut, kept in step with the
system's reduced-motion preference and the in-game **Calm** switch by `App`.
A beat fired from a handler five components deep can't forget to check it,
which is the failure mode that setting exists to prevent.

## Develop

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + build to /docs
npm test          # unit tests for the pure game engine (src/engine.ts)
npm run validate  # structurally check every puzzle (13 unique tiles, link fits)
npm run audit     # flag spokes that may be ambiguous, for human review
```

### Submission pack

Everything a store listing needs lives in [`public/art/`](./public/art) and ships
with the build, so the whole pack is browsable at **`<site>/art/`** next to the
game — [wordgrid on GitHub Pages](https://ingdas.github.io/wordgrid/art/).
[`public/art/index.html`](./public/art/index.html) is the page: every field the
portal asks for with a copy-to-clipboard button (title, descriptions at several
lengths, instructions, tags, technical answers, and the Spanish versions), plus
the gallery — seven covers, twelve screenshots and a 26-second gameplay clip.
The images are generated, not hand-made, so they can't drift from the game they
advertise.

```bash
npm run build && npm run preview  # the pack is captured from the real build
npm run submission                # covers + screenshots (COVERS=1 for art only)
npm run clip                      # gameplay.webm
```

The covers are rendered from branded HTML in `scripts/submission-art.mjs`. Every
one of them shows the same picture: four words, one from each group of a real
board, all pointing at the masked link they share — a riddle the viewer can
solve before they click, and an honest diagram of the mechanic. No tagline, no
badge; the only text is the game's own words and the title. The screenshots and
the clip are a scripted playthrough of the built app against a seeded save.
Boards, words and solutions all come straight from `src/puzzles.ts`, so
re-ordering the campaign can't leave the art quietly lying or the capture
clicking words that have moved.

### Debug mode

For playtesting and QA. Turn it on by appending **`?debug`** to the URL (it's
remembered afterwards — `?debug=0` clears it) or with the **Debug mode** toggle
in **Settings → Developer**. It gives you:

- every level and every boss door **unlocked**, keys included;
- **free hints** — the bank reads ∞, nothing is spent, and no ad is offered;
- a **🛠 tool tray** in the bottom-left corner: *solve a group*, *auto-solve
  level* (which wins it outright, stars and all), *reveal all themes*, *peek at
  the link*, *+5 hints* and *force a loss*;
- on the level index, *clear next level* and *+10 hints*; on the Logic Grid,
  *auto-solve grid*.

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

### Level tracking

How many people have solved a level, and how often an attempt on it ends in a
win. Off by default and inert until an endpoint is configured — the game is a
static bundle, so the counting happens somewhere else:

- the client is [`src/stats.ts`](./src/stats.ts): one small event when a board
  is dealt and one when it ends, plus the aggregate read back for display;
- the server is [`server/stats-server.mjs`](./server/stats-server.mjs) — a
  dependency-free Node + SQLite reference implementation of the two endpoints
  (`POST /events`, `GET /levels`, plus `/levels.csv` for a spreadsheet).

Switch it on either way round:

```bash
node server/stats-server.mjs                      # :8787, ./stats.db
VITE_STATS_URL=https://stats.example.com npm run build
```

or, without rebuilding, point the `<meta name="wordgrid:stats">` tag in
`index.html` / `docs/index.html` at the same URL.

Where it shows up: the **up-next card** on the level index carries "62% of
players clear this one" once enough people have finished a board, and
**Settings → Developer → Level tracking** is the author's view — solve counts
and win rates for every level, sorted by level or hardest-first, with the state
of the queue and the last sync.

What is collected is one random per-install id (so the counts are people rather
than plays), the level, the outcome, the mistakes and the clock. No account, no
IP kept by the reference server, nothing a player typed. Debug play and Endless
are never counted — a board that auto-solves or can't be lost isn't evidence.

**Offline is a first-class case.** With no network the game plays exactly as it
does with one: events queue in the same storage the save uses and go out on the
next connection, the last aggregate stays on the device (dated, so it can say
how stale it is), and a missing, dead or nonsense server is never shown to the
player. `scripts/stats.playtest.mjs` plays a whole level in a browser with the
network cut to prove it.

### Automated playtest

`scripts/playtest.mjs` drives a headless Chrome through the solve / lose /
reduced-motion flows and asserts on the DOM (including that the pivot is never
distinguishable by colour mid-game). `scripts/pairs.test.mjs`,
`scripts/debug.playtest.mjs`, `scripts/iteration33.playtest.mjs` (quests,
the link mask, modal focus, storage-less play) and `scripts/stats.playtest.mjs`
(level tracking against a live server, played offline) cover the rest. See
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
