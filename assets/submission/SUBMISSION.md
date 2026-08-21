# WordGrid — CrazyGames submission pack

Everything the developer portal asks for in one place: the copy to paste into
each field, the art that goes with it, and the technical answers a reviewer
tends to ask. The images and the clip beside this file are generated —
`npm run submission` and `npm run clip` rebuild them from the live game, so
they never drift from what a player actually sees.

Field names below follow the portal's own labels where they are stable. Where a
platform limit is not published, the copy is written short enough to survive a
tighter one: each block is given at three lengths, longest first, and any of
them can be pasted on its own.

---

## Title

**WordGrid**

Alternates, if the name is already taken on the platform:
*WordGrid: The Secret Link* · *WordGrid — Four Groups, One Word*

## Short description

**~190 characters**

> Twelve words hide four groups of three — and one secret word belongs to every
> group at once. Find the groups, then spell the link. 100 levels, 12 bosses
> that break the rules, and a new puzzle daily.

**~140 characters**

> Twelve words, four hidden groups, and one secret word that belongs to all of
> them. Find the groups, then name the link. New puzzle daily.

**~80 characters**

> Four hidden groups. One secret word links them all. Can you find it?

## Long description

> **WordGrid is a word puzzle about the one word you can't see.**
>
> Every board deals twelve words that split into four groups of three — and a
> masked secret link at the top, one **?** per letter, so you know its length
> from the first move. That hidden word belongs to all four groups at once.
>
> Pick three words that share a theme and hit Submit; the secret link joins them
> to make a group of four. Clear all four groups without spending your four
> mistakes, then spell the link to win. Spotted it early? Call it with groups
> still open — one shot per level, and it pays a bonus for every group you
> hadn't found yet.
>
> **100 levels across twelve chapters**, and the difficulty isn't a straight
> climb: every chapter opens on a breather, works up, and finishes on a **boss**
> that changes the rules and tells you exactly how. One scrambles every tile
> into an anagram. One takes the vowels out. One turns the board face-down and
> makes you group from memory. One replaces all twelve words with pictures,
> where the first name you think of is rarely the right one. One salts in
> impostor tiles that belong to no group at all. One boards up each group you
> solve so you can't read your own progress back.
>
> Every chapter also hides a **key**: each level in it gives up one letter, and
> spelling the word those letters make is what opens that chapter's boss door.
>
> Come back tomorrow for the **Daily Challenge** — its own pool of puzzles, its
> own streak — plus three quests drawn fresh at midnight and paid in hints.
> When you want a different kind of thinking there's **Pairs**, a memory mode
> played on the same boards, and the **Logic Grid**: thirty pure-deduction
> puzzles with no vocabulary in them at all. Clear the campaign and **Endless**
> opens up.
>
> No account, no install. Chase the stars, keep the streak alive, and find out
> what links them all.

**Short version** (if the field is tight)

> Twelve words hide four groups of three, and one secret word belongs to all
> four. Pick three words that share a theme; the hidden link joins them into a
> group. Clear four groups on four mistakes, then spell the link to win.
>
> 100 levels across twelve chapters, each closing on a boss that rewrites the
> rules — scrambled tiles, missing vowels, a board played from memory, twelve
> pictures instead of words, impostor tiles, a blackout. Plus a Daily Challenge
> with its own streak, daily quests, a memory mode, and thirty logic-grid
> puzzles. No account needed.

## Instructions / controls

> **Mouse or touch is all you need.**
>
> - Tap or click **three words that share a theme**, then press **Submit group**.
> - Four groups to find, four mistakes to spend. **Shuffle** re-deals the board;
>   a **hint** names one group's theme.
> - Once all four groups are out, **tap the letter tiles** to spell the secret
>   word — or just type it.
> - Think you know the link early? Use **Call it** for a one-shot bonus.
>
> Keyboard shortcuts: **Enter** submits the three selected words, **Esc** clears
> the selection, and in the final spelling step you can **type the word** and use
> **Backspace** to undo.

## Suggested categories and tags

- **Primary category:** Puzzle
- **Also fits:** Casual · Brain / Thinking · Word
- **Tags:** word game, words, puzzle, brain, logic, deduction, daily, vocabulary,
  connections, casual, singleplayer, 1 player, mouse, touch, mobile friendly,
  no download, offline
- **Players:** 1 · **Input:** mouse, touch, keyboard (optional)
- **Age rating:** suitable for everyone — no violence, no chat, no
  user-generated content, no purchases.

## Languages

Interface in **English** and **Spanish**, picked up from the browser and
switchable in Settings. The word puzzles themselves stay English — a board of
English words can only be rewritten, not translated — but a translated interface
makes every menu, boss rule and result screen readable, and it fully unlocks the
Logic Grid, which is pure deduction with no vocabulary in it.

Spanish store copy is at the bottom of this file.

---

## The art

All of it is generated by `npm run submission` (see `scripts/gen-submission.mjs`
and `scripts/submission-art.mjs`). Covers are rendered from branded HTML in the
game's own type and colours; screenshots are captured from the built app, mid-play,
against a seeded save — nothing here is a mock-up.

### Covers

| File | Size | Use |
| --- | --- | --- |
| `cover-1920x1080.png` | 1920×1080 (16:9) | hero / large placements |
| `cover-1280x720.png` | 1280×720 (16:9) | main thumbnail |
| `cover-800x450.png` | 800×450 (16:9) | small thumbnail |
| `cover-1080x1080.png` | 1080×1080 (1:1) | square placements, social |
| `cover-512x512.png` | 512×512 (1:1) | app icon / small square |
| `thumbnail-400x300.png` | 400×300 (4:3) | 4:3 thumbnail slot |
| `cover-1080x1920.png` | 1080×1920 (9:16) | portrait / story placements |

Each shape is composed for itself rather than scaled from one master: the 16:9
covers set the masthead against a live board, and the two small formats drop the
board entirely, because twelve words are unreadable at 400px wide.

### Screenshots

Landscape shots are 1280×720 — the embed size most desktop players get. Portrait
shots are a 390×844 phone viewport captured at 2×.

| File | What it shows |
| --- | --- |
| `screen-1-home-1280x720.png` | home: daily challenge and streak, modes, today's quests |
| `screen-2-collection-1280x720.png` | the level index: chapters, stars, a chapter key, a beaten boss |
| `screen-3-board-1280x720.png` | mid-board — one group solved, three words picked, Submit live |
| `screen-4-finale-1280x720.png` | all four groups out, spelling the secret link from the letter bank |
| `screen-5-win-1280x720.png` | the win card: stars, streak, score, the link revealed |
| `screen-6-boss-briefing-1280x720.png` | a boss briefing — the rule stated in full before the board is live |
| `screen-7-boss-board-1280x720.png` | the emoji boss: twelve pictures, no words |
| `screen-8-logic-1280x720.png` | the Logic Grid, part-deduced |
| `screen-9-pairs-1280x720.png` | Pairs, part-matched |
| `screen-10-home-780x1688.png` | home, on a phone |
| `screen-11-board-780x1688.png` | mid-board, on a phone |
| `screen-12-finale-780x1688.png` | the spelling finale, on a phone |

**If only five slots are available**, use 3 · 4 · 2 · 7 · 5 — the loop, its
payoff, the map that shows how much game there is, a boss that proves the rules
move, and the reward screen.

### Clip

`gameplay.webm` — 26 seconds, 1280×720, VP8/WebM, no audio: home → the level
index → a board solved group by group → spelling the secret link → the win.
Rebuild it with `npm run clip`.

If the portal requires H.264, transcode on any machine with an x264-enabled
ffmpeg (the one bundled here is a stripped VP8-only build):

```bash
ffmpeg -i gameplay.webm -c:v libx264 -pix_fmt yuv420p -crf 20 gameplay.mp4
```

---

## Technical answers

- **Build:** HTML5, no plugins. React 19 + TypeScript, bundled by Vite to a
  static folder. ~600 KB of JS (187 KB gzipped) plus fonts; no server needed.
- **Embedding:** designed for the iframe. At a 1280×720 landscape embed the whole
  game sits above the fold with no page scrolling, and the layout reflows to a
  single column on phones.
- **SDK:** CrazyGames SDK v3 is wired up — `loadingStart` / `loadingStop` around
  boot, `gameplayStart` / `gameplayStop` around every level (including on tab
  blur, which also suspends audio), `happytime` on a win, a midgame interstitial
  between levels, and `requestAd("rewarded")` behind two opt-in offers: refilling
  an empty hint bank, and a second chance after a loss. Every call is guarded, so
  the game plays identically off-platform where the SDK never loads.
- **Saving:** progress is written to `localStorage` **and** mirrored through the
  CrazyGames data module, and the two are reconciled on load — so a save survives
  a browser that partitions or clears third-party storage inside the iframe. When
  neither store is available the session still plays, out of memory, and says so
  in a banner rather than pretending it saved.
- **Offline:** a service worker caches the shell, so the game keeps playing after
  the first load with no network.
- **Accounts / data:** none. No login, no third-party analytics, no personal data
  collected, nothing a player types leaves the device. (There is an optional,
  off-by-default level-tracking endpoint for the developer's own difficulty
  tuning; it is inert unless a URL is configured, and never records anything a
  player typed.)
- **Accessibility:** full keyboard play, ARIA labels throughout, and a Calm mode
  that dials back motion and confetti (`prefers-reduced-motion` is honoured
  automatically).
- **Content:** no violence, no gambling, no chat, no user-generated content, no
  external links out of the game.

---

## Spanish copy

**Título:** WordGrid

**Descripción corta**

> Doce palabras esconden cuatro grupos de tres, y una palabra secreta pertenece a
> todos los grupos a la vez. Encuentra los grupos y escribe la palabra. 100
> niveles, 12 jefes que rompen las reglas y un puzle nuevo cada día.

**Descripción larga**

> **WordGrid es un juego de palabras sobre la palabra que no puedes ver.**
>
> Cada tablero reparte doce palabras que se dividen en cuatro grupos de tres, y
> arriba queda una palabra secreta oculta: una **?** por letra, así que conoces su
> longitud desde el primer movimiento. Esa palabra pertenece a los cuatro grupos.
>
> Elige tres palabras que compartan un tema y pulsa Enviar: la palabra secreta se
> une a ellas y completa el grupo. Encuentra los cuatro grupos sin gastar tus
> cuatro fallos y escribe la palabra secreta para ganar. ¿La has visto pronto?
> Anúnciala con grupos aún abiertos: un solo intento por nivel, con bonificación
> por cada grupo que te quedaba.
>
> **100 niveles en doce capítulos**, y la dificultad no sube en línea recta: cada
> capítulo empieza suave, aprieta y termina en un **jefe** que cambia las reglas y
> te dice exactamente cómo. Uno mezcla las letras de cada ficha. Otro quita todas
> las vocales. Otro pone el tablero boca abajo y te hace agrupar de memoria. Otro
> sustituye las doce palabras por imágenes, donde el primer nombre que se te ocurre
> casi nunca es el bueno. Otro cuela fichas impostoras que no son de ningún grupo.
> Otro tapa cada grupo que resuelves para que no puedas repasar tu propio avance.
>
> Cada capítulo esconde además una **llave**: cada nivel entrega una letra, y
> ordenarlas es lo que abre la puerta del jefe.
>
> Vuelve mañana por el **Reto diario**, con su propia racha, y por las tres
> misiones que se sortean a medianoche y se pagan en pistas. Si te apetece otro
> tipo de reto están **Parejas**, un modo de memoria sobre los mismos tableros, y
> la **Cuadrícula lógica**: treinta puzles de pura deducción, sin vocabulario.
> Termina la campaña y se abre el modo **Sin fin**.
>
> Sin cuenta y sin instalar. Persigue las estrellas, mantén viva la racha y
> descubre qué las une a todas.

**Instrucciones**

> Solo necesitas el ratón o el dedo: toca **tres palabras que compartan un tema** y
> pulsa **Enviar grupo**. Cuatro grupos por encontrar y cuatro fallos disponibles.
> Cuando salgan los cuatro grupos, toca las letras para escribir la palabra
> secreta — o escríbela con el teclado. **Enter** envía el grupo seleccionado,
> **Esc** lo borra.
