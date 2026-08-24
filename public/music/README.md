# Music

Drop mp3 files here and they become the game's music. Nothing else to change —
no import, no build step, no code edit.

| File       | Plays on                          |
| ---------- | --------------------------------- |
| `menu.mp3` | home, level select, results       |
| `play.mp3` | any board (game, Pairs, Deduction)|
| `boss.mp3` | boss doors                        |

Anything absent falls back to the synthesized loop in `src/audio.ts`, so the
game is never silent and the files can land one at a time.

## What makes a good file here

- **Loopable.** It plays on `loop` forever; the end has to run into the start
  without a bump. Trim to a whole number of bars and let any reverb tail wrap
  around, rather than fading out.
- **Short.** Two minutes at 128 kbps is ~2 MB downloaded and ~20 MB decoded in
  memory, and the decoded number is the one that hurts on a phone. One to two
  minutes is plenty for a bed nobody is meant to notice.
- **Quiet and un-busy.** It sits under the sound effects for a long session.
  Mixed a few dB under where a track would normally sit is right; stings duck
  it automatically, but they can't rescue a loud mix.
- **Mono or stereo, any sample rate.** The browser resamples on decode.

## Tuning without touching the audio engine

`TRACKS` in `src/audio.ts` (see the *recorded music* section) has one entry per
scene:

```ts
menu: { file: "music/menu.mp3", gain: 0.9 },
```

- `gain` — per-track trim, 0…1. Match a track to the mix here instead of
  re-exporting it.
- `loopStart` / `loopEnd` — optional, in seconds. Set them to play a one-shot
  intro before an inner loop, or to trim a decay tail off the loop point.

Renaming a file means changing `file` there; the three names above are only the
defaults.

## Notes

- Nothing is fetched until the player turns music on (it defaults to off), so a
  player who never turns it on downloads none of this.
- A file is fetched once per session and remembered — a missing one costs a
  single 404, not one per screen.
- The service worker serves these from cache first, so they don't come down the
  wire on every visit.
- mp3 is the safe bet everywhere. `.ogg`/`.m4a` work too if you set `file`
  accordingly, but mp3 is the one format every target browser decodes.
