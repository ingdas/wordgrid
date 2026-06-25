# WordGrid

A bite-sized category-finding puzzle inspired by NYT Connections — but with a twist.

There are **9 words** hiding **4 categories**. Unlike Connections, the groups
overlap: **one secret "pivot" word belongs to every category**. Find that shared
word, then build all four groups of three around it.

![groups of three, one shared word](docs/index.html)

## How to play

1. A board shows **12 words** plus a **masked "secret link"** (`◆ ? ? ?`).
2. Tap **three words that share a theme**, then **Submit** — the hidden link
   joins them into a group of four. Its word stays concealed the whole game.
3. Find all **four groups** (you get **4 mistakes**), then **guess the secret
   word** that links them all. The reveal is the climax, not a giveaway.
4. Fewer mistakes earn more **stars** (3 max per level).

There are **62 levels** on a hypercasual level map — clear one to unlock the
next, and chase the ⭐ total and your 🔥 streak.

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

### Automated playtest

`scripts/playtest.mjs` drives a headless Chrome through the solve / lose /
reduced-motion flows and asserts on the DOM (including that the pivot is never
distinguishable by colour mid-game). See [`BACKLOG.md`](./BACKLOG.md) for how to
run it and the latest findings.

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
