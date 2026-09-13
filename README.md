# Who Is the Impostor

Offline-capable web app for the party game "Impostor", designed for players
aged 10 to 14. A single device is passed around the group.

## Getting Started

The package manager is pnpm (version pinned in `packageManager`, Corepack
picks it up automatically). Node >= 20.19.

```bash
pnpm install
pnpm dev        # dev server
pnpm build      # static bundle into dist/
pnpm preview    # test the built app on the LAN (--host is set)
pnpm test       # run Vitest once
pnpm coverage   # same, with coverage report
```

`dist/` is purely static — Netlify, Vercel, GitHub Pages, S3, Apache, whatever.
For deployment under a subdirectory, adjust `base` in `vite.config.js`.

## Offline

`vite-plugin-pwa` generates a service worker at build time that precaches all
assets including font files and icons (currently ~296 KB). After the first
visit the app works without a network connection. `registerType: "autoUpdate"`
fetches new versions in the background.

Important: service workers require HTTPS or `localhost`. The easiest way to
test on a phone is via a tunnel or a certificate for the dev server.

## Structure

```
src/App.jsx     screens and UI state, CSS inline
src/game.js     word lists, role assignment — React-free
src/main.jsx    mount + font
assets/icon.svg icon source
scripts/        icon generator
tests/          Vitest
public/         generated icons (committed)
```

All of the round's randomness lives in `src/game.js`. `buildRound` takes an
`rng` as its second argument — that's why role assignment and word selection
are testable without the DOM and without mocking.

## Tests

`vitest` with jsdom and Testing Library. Two levels:

- `tests/game.test.js` — invariants of the word lists (24 unique words per
  category, no duplicates across categories) and the draw logic against a
  deterministic `rng`.
- `tests/app.test.jsx` — flows through the real screens: name validation,
  impostor cap, hold-to-reveal, resolution.

jsdom does not ship `PointerEvent`; `tests/setup.js` provides the bare
minimum, otherwise the hold-to-reveal screen can't be operated.

## Icons

`assets/icon.svg` is the source — a half yellow, half dark mask. The PNGs
are generated into `public/` and checked in so the build runs without
`sharp`:

```bash
pnpm icons   # public/icon-192.png, icon-512.png, apple-touch-icon.png
```

For maskable icons the safe zone is the circle with r=205 around the center —
the mask stays inside it; keep that in mind when changing the SVG.

## Design Decisions

- **Yellow means visible, dark blue means secret.** The hand-over screen is
  solid yellow and recognizable across a dark room as "you may look now".
  As soon as a word is in play, the screen is dark.
- **Hold instead of tap.** The word is only rendered while a finger rests on
  the field. No timeout, no accidentally leaving it open, and you can shield
  the screen with your hand. Keyboard: hold the space bar.
- **Category hint for the impostor** is on by default. Without the hint the
  round is often too hard for ten-year-olds; it can be turned off in the
  settings.
- **Voting stays analog.** The app only does the reveal. Pointing at each
  other simultaneously is the best part of the game — no UI needed for that.

## Word Lists

Nine categories of 24 words each, age-appropriate, no brand names. To extend:
add to the array in `CATEGORIES` in `src/game.js`, done. `tests/game.test.js`
verifies that there are still 24 unique words and that none appears in
another category as well. Rule of thumb for new words — a word must allow at
least five different obvious hint words, otherwise the impostor is exposed
immediately or nobody can say anything.

## Next Step: Multiple Devices

For multi-device play without a server: one device becomes the host and opens
a room, the others connect via WebRTC (PeerJS or similar) or — much simpler —
via a QR code that directly encodes name, word, and role. The game logic
already lives in `src/game.js`; the screen state in `App.jsx` would need to
move into a reducer that dispatches actions instead of screens.

## License

[MIT](LICENSE)
