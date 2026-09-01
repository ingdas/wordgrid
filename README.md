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
   "hit a ×3 combo", "name a secret link" — drawn fresh at midnight and paid
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

The game is wired for the 25 languages CrazyGames serves (`src/i18n/locales.ts`,
scraped from the platform's own list) and currently ships six of them —
English, Spanish, German, French, Italian and Brazilian Portuguese
(`SHIPPED_LOCALES`); the rest have their rails in place and are switched on
one by one as their boards land. And it isn't just the menus: **every shipped
language has its own boards.** A board of English words can't be translated,
only rewritten (PITCH is a throw, a sales talk, a musical height and a playing
field in English and nothing of the kind anywhere else), so each language
fills the same 100 campaign slots, the emoji boss and the 80-board daily pool
with link words of its own, plus its own chapter keys and decoy tiles
(`src/i18n/content/<xx>.ts`; the rules are in `src/i18n/content/README.md`).
The campaign's *shape* — chapters, boss twists, hand grades, slot ids — is
shared, so progress carries across a language switch.

"Letter" is per script too (`src/i18n/script.ts`): the finale bank, the key
rail and the scramble boss work in kana, Hangul syllable blocks and Thai
clusters, and the "no vowels" boss has a cipher per writing system (vowels;
Arabic long vowels; the Thai consonant frame; Korean 초성; every second kana
blanked). The language is picked from `?lang=`, then the player's saved
choice, then the browser, and on CrazyGames from the SDK's `systemInfo.locale`;
it's switchable in Settings and each language loads as its own chunk. `npm
test` fails on a missing key or a dropped `{placeholder}`; `npm run validate`
checks every language's boards against the same rules as English.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [GSAP](https://gsap.com/) for the animation — see [Motion](#motion)

## Motion

All of it is **GSAP**, in [`src/anim.ts`](./src/anim.ts). It replaced Framer
Motion, which the game was carrying almost entirely for one feature: 37 exit
animations, 10 of them a bare opacity fade. One `layout` prop, two `whileTap`,
no drag, no shared-element transitions. Dropping it took **41 kB gzip off the
bundle**, about 18% of the JavaScript.

The thing that made Framer load-bearing is real, and worth knowing about before
touching any of this. React tears an element out of the DOM the moment its
condition goes false, so an imperative library gets nothing to animate.
`usePresence` closes that in about forty lines: it holds the node mounted past
its own condition and runs an exit before letting go.

The half that is easy to miss is that it also has to hold the state the node was
rendered *from*. A leaving element is drawn from a game that has already moved
on — the toast whose text is now null would blank out mid-slide, the win card
whose status is now "playing" would flip to the loss card on the way out, the
coach whose step is now -1 would return null and never animate at all. So the
hook carries a payload frozen at its last present value, and callers render the
leaving element from that.

Two habits the conversion turned into rules:

- **Never park a hidden face in the DOM.** A rail slot that keeps its letter at
  `opacity: 0` until the level is cleared is a chapter key anyone can read
  straight out of the page. Both faces mounted is the easy way to animate a
  swap, and it's wrong here — the face that isn't showing stays only as long as
  it takes to turn away.
- **`immediateRender: false` on any delayed `fromTo`.** GSAP writes a tween's
  start values the moment it is built, so through a delay the element sits in
  its "from" pose — which for the index's unlock banner meant a `fixed`
  element parked 24px low, and 6px of scroll height on a page that has to fit a
  720p embed exactly.

All of it lives in [`src/anim.ts`](./src/anim.ts), and it animates the identity
rather than in spite of it: this is a print shop, so things are **stamped** onto
the page (a hand-authored `CustomEase` that hits hard and rocks twice, like a
rubber stamp on paper), a rejected guess **rattles** the board like a shoved
sheet, and the confetti is punched-paper chads that flutter edge-on as they
fall. The beats worth knowing about:

- **The opening** is the press run: four blank word tiles in the four group
  colours are dealt onto the page, pulled together into one point, and the
  press's mark comes down on it — four groups, one link, with no copy. The
  title is then set letter by letter and the plate lifts off the first screen,
  which stamps itself in underneath. It runs once per visit (a tap or key
  fast-forwards it), in front of the tutorial board on a first launch and in
  front of Home after; coming back to the menu never replays it. About four
  seconds, the last one and a half of them a hold so the pitch gets read, and
  cut entirely under Calm or a reduced-motion preference.
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
- **Every dialog** — how-to-play, settings, stats, history, a boss briefing,
  a chapter key — shares one
  entrance: the scrim fades, the card is stamped up under it, its mark spins
  into place and the rules deal in one at a time. Callers mark the parts with
  `data-panel` / `data-dialog-mark` / `data-dialog-row` / `data-dialog-cta`, so
  a dialog with no mark simply doesn't get that beat rather than opting out.

One module-level flag turns every one of them into a cut, kept in step with the
system's reduced-motion preference and the in-game **Calm** switch by `App`.
A beat fired from a handler five components deep can't forget to check it,
which is the failure mode that setting exists to prevent.

## Develop

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + build to /docs (+ the CrazyGames upload zip in /docs/art)
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

The game build is in the pack too. `npm run build` ends by zipping what it just
built — minus the pack itself, the GitHub Pages files, the share-preview image
and the service worker — into `docs/art/wordgrid-crazygames.zip`, with a
`dist.json` beside it (size, listing, SHA-256) that the page's **Build**
section reads and links. That is the file for the CrazyGames upload form:
`index.html` at the root, every path relative, the SDK loaded from its CDN and
nothing fetched from anywhere else. It is written by
[`scripts/dist-zip.mts`](./scripts/dist-zip.mts) rather than the `zip` CLI so
that the same sources always give the same bytes — otherwise every build would
churn a half-megabyte binary in the committed `docs/`.

```bash
npm run build && node scripts/dist.playtest.mjs   # check the zip the build wrote
```

The check unpacks the zip, serves it from a nested path and loads it inside an
iframe on a different origin — the way the portal does — and fails on an
absolute path, a file `index.html` asks for that isn't in the archive, a request
to any host that isn't the SDK's, a service-worker registration, or a page
error. (The worker is for the standalone site: `main.tsx` only registers it when
the game is the top-level page, so inside the embed nothing is asked for.)

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

For playtesting and QA. Turn it on by appending **`?debug`** to the URL. It is
on for exactly that page — drop the query and the game is a player's again —
and while it's there, **Settings → Developer** has a **Debug mode** toggle to
turn it off and back on for the session. It gives you:

- every level and every boss door **unlocked**, keys included;
- **free hints** — the bank reads ∞, nothing is spent, and no ad is offered;
- a **🛠 tool tray** in the bottom-left corner: *solve a group*, *auto-solve
  level* (which wins it outright, stars and all), *reveal all themes*, *peek at
  the link*, *+5 hints* and *force a loss*;
- on the level index, *clear next level* and *+10 hints*.

Nothing about it leaks into a normal save: the tray is only mounted while debug
is on, the Settings switch only on a page opened with `?debug`, and nothing
about it is written to storage.

### Saving

Progress goes through [`src/storage.ts`](./src/storage.ts), not straight to
`localStorage`. Inside the CrazyGames iframe the game is third-party content,
and the browser can partition, empty or refuse that store — so every write also
goes to the **CrazyGames data module** when it's there, and on load the two are
reconciled: a save the platform still holds is adopted back, and a local-only
save is pushed up before the browser can lose it. When *nothing* durable is
available the session still plays out of memory, and says so in a banner rather
than pretending it saved.

### CrazyGames SDK

Everything the platform hears goes through [`src/sdk.ts`](./src/sdk.ts), and
nothing else touches `window.CrazyGames`. The v3 SDK **must be initialised
before any call** — until `init()` resolves every method throws
`sdkNotInitialized` — and its script is `async`, so it may land before or after
React mounts. The wrapper waits for the script, runs `init()` once, and
*queues* anything asked of it in the meantime (loading, the first launch's
`gameplayStart`), replaying it in order the moment init settles. Off-platform
the SDK loads but reports `environment: "disabled"`; that latches once and the
game plays as if there were no SDK. On `localhost` it runs in `"local"` mode
with fake ads, which is how the flows below are tested by hand.

What is sent, and when — the platform's requirements, not ours:

- `gameplayStart` / `gameplayStop` around every board, **transitions only**,
  and never on a tab switch (the docs say a focus change is not a break).
- `happytime` when a **boss** falls — sparingly, as asked.
- An interstitial between boards, through `adBreak` in `App`: the page is held,
  the game mutes **while the ad is on screen** (not on the request), and the
  next board — and its `gameplayStart` — waits until the ad is gone.
- Rewarded ads for the hint refill and the second chance. An ad that finished
  pays; an ad that failed, went unfilled or is blocked pays **nothing**; and
  where there is **no ad system at all** — no SDK, a disabled domain, or the
  platform answering `adsDisabledBasicLaunch` — the reward is simply given,
  because a dead "watch" button is what QA rejects. `adsMode()` tells the
  buttons which world they are in, so they only promise a video (🎬) where one
  plays, and under an ad blocker they say why there's no refill instead of
  doing nothing.
- The share card links to the game's CrazyGames page (`inviteLink`) on the
  platform, and to the page without its query elsewhere — never `?debug`.

`scripts/sdk.test.mts` pins all of it against a double that behaves like the
real object (throws before init, `"uninitialized"` → `"crazygames"`).

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

### Analytics

Where players go and what they do there — screens, wins and losses per mode,
hints spent, offers taken, where the tutorial loses people, settings changed —
in a self-hosted [Umami](https://umami.is). Off by default and inert until
configured, exactly like level tracking. The two are different pipes for
different questions: level tracking is the one number the game reads *back*
(the clear rate on the up-next card); analytics is everything else, one way,
into a dashboard.

- the client is [`src/analytics.ts`](./src/analytics.ts): it puts Umami's
  tracker on the page after the game has mounted, on an idle slot, with
  auto-tracking off. Screens go out as virtual pageviews (`/home`, `/game`, …)
  and everything else as named events with a small property bag — the
  vocabulary is listed at the top of the file. Events raised before the tracker
  lands wait in a capped in-memory buffer; a blocked or unreachable tracker is
  retried, and again when the connection comes back; nothing throws into the
  game.
- the server is your Umami. On Coolify that is the one-click Umami template
  (Node + Postgres); in its environment set `TRACKER_SCRIPT_NAME` (renames
  `script.js` — filter lists know the default), `COLLECT_API_ENDPOINT` (same
  for `/api/send`) and `DISABLE_TELEMETRY=1`. Add one website in the dashboard;
  both hosts (`ingdas.github.io` and the CrazyGames embed) report into it, and
  `hostname` is a filter.

Switch it on either way round:

```bash
VITE_UMAMI_SCRIPT=https://umami.example.com/<tracker>.js \
VITE_UMAMI_WEBSITE=<website id> npm run build
```

or, without rebuilding, fill the `<meta name="wordgrid:umami-script">` and
`<meta name="wordgrid:umami-website">` tags in `index.html` / `docs/index.html`.

**Settings → Developer → Analytics** says whether it is configured, whether the
tracker arrived, and how many events went through this session.

What is collected: the same random per-install id level tracking uses (handed
to Umami's `identify`, so one player stays one player across its salt rotation
and inside the partitioned iframe), the screen, the event name and its
properties — ids, numbers and enums, never copy, never a word the player typed.
Umami itself sets no cookie and stores nothing in the browser: a visitor is a
server-side hash of IP + user agent + a rotating salt. Debug play is never
tracked, Do Not Track is honoured. Unlike level tracking, Endless *is* counted —
mode adoption is the point. `scripts/analytics.test.mts` pins all of it.

### Automated playtest

`scripts/playtest.mjs` drives a headless Chrome through the solve / lose /
reduced-motion flows and asserts on the DOM (including that the pivot is never
distinguishable by colour mid-game). `scripts/debug.playtest.mjs`,
`scripts/iteration33.playtest.mjs` (quests,
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
