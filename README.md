# Wer ist der Impostor

Offline-fähige Web-App für das Partyspiel "Impostor", ausgelegt auf Spieler
zwischen 10 und 14 Jahren. Ein Gerät wird in der Runde weitergereicht.

## Loslegen

Paketmanager ist pnpm (Version in `packageManager` gepinnt, Corepack zieht sie
automatisch). Node >= 20.19.

```bash
pnpm install
pnpm dev        # Dev-Server
pnpm build      # statisches Bundle nach dist/
pnpm preview    # gebaute App im LAN testen (--host ist gesetzt)
pnpm test       # Vitest einmal durch
pnpm coverage   # dito mit Coverage-Report
```

`dist/` ist rein statisch — Netlify, Vercel, GitHub Pages, S3, Apache, egal.
Für ein Unterverzeichnis `base` in `vite.config.js` anpassen.

## Offline

`vite-plugin-pwa` erzeugt beim Build einen Service Worker, der sämtliche
Assets inklusive Schriftdateien und Icons precacht (aktuell ~296 KB). Nach dem ersten
Aufruf läuft die App ohne Netz. `registerType: "autoUpdate"` zieht neue
Versionen im Hintergrund nach.

Wichtig: Service Worker brauchen HTTPS oder `localhost`. Auf dem Handy testen
geht am einfachsten über einen Tunnel oder ein Zertifikat für den Dev-Server.

## Aufbau

```
src/App.jsx     Screens und UI-State, CSS inline
src/game.js     Wortlisten, Rollenverteilung — React-frei
src/main.jsx    Mount + Schrift
assets/icon.svg Icon-Quelle
scripts/        Icon-Generator
tests/          Vitest
public/         generierte Icons (mitcommittet)
```

Der Zufall der Runde steckt vollständig in `src/game.js`. `buildRound` nimmt
als zweites Argument ein `rng` — deshalb sind Rollenverteilung und Wortwahl
ohne DOM und ohne Mocking testbar.

## Tests

`vitest` mit jsdom und Testing Library. Zwei Ebenen:

- `tests/game.test.js` — Invarianten der Wortlisten (24 eindeutige Wörter je
  Kategorie, keine Dubletten über Kategorien hinweg) und die Ziehlogik gegen
  ein deterministisches `rng`.
- `tests/app.test.jsx` — Flows durch die echten Screens: Namensvalidierung,
  Impostor-Deckelung, Halten-zum-Anzeigen, Auflösung.

jsdom bringt kein `PointerEvent` mit; `tests/setup.js` reicht das Minimum
nach, sonst lässt sich der Halten-Screen nicht bedienen.

## Icons

`assets/icon.svg` ist die Quelle — halb gelbe, halb dunkle Maske. Die PNGs
liegen generiert unter `public/` und sind eingecheckt, damit der Build ohne
`sharp` läuft:

```bash
pnpm icons   # public/icon-192.png, icon-512.png, apple-touch-icon.png
```

Bei maskable Icons liegt die Safe Zone im Kreis mit r=205 um die Mitte — die
Maske bleibt darin, beim Ändern des SVG darauf achten.

## Designentscheidungen

- **Gelb heißt sichtbar, Dunkelblau heißt geheim.** Der Übergabe-Screen ist
  vollflächig gelb und quer durch einen dunklen Raum als "jetzt darf man
  gucken" erkennbar. Sobald ein Wort im Spiel ist, ist der Screen dunkel.
- **Halten statt tippen.** Das Wort wird nur gerendert, solange der Finger
  auf dem Feld liegt. Kein Timeout, kein versehentliches Offenlassen, und
  man kann den Screen mit der Hand abschirmen. Tastatur: Leertaste halten.
- **Kategorie-Hinweis für den Impostor** ist standardmäßig an. Ohne Hinweis
  ist die Runde für Zehnjährige oft zu hart; abschaltbar in den
  Einstellungen.
- **Abstimmung bleibt analog.** Die App löst nur auf. Gleichzeitiges Zeigen
  ist der beste Teil des Spiels, dafür braucht es kein UI.

## Wortlisten

Neun Kategorien à 24 Wörtern, altersgerecht, ohne Markennamen. Erweitern:
Array in `CATEGORIES` in `src/game.js` ergänzen, fertig. `tests/game.test.js`
prüft dabei mit, dass es 24 eindeutige Wörter bleiben und keins doppelt in
einer anderen Kategorie steht. Faustregel bei neuen Wörtern — das
Wort muss mindestens fünf verschiedene naheliegende Hinweiswörter zulassen,
sonst fliegt der Impostor sofort auf oder niemand kann etwas sagen.

## Nächster Schritt: mehrere Geräte

Für Mehrgeräte-Betrieb ohne Server: ein Gerät wird Host und öffnet einen
Raum, die anderen verbinden sich per WebRTC (PeerJS o. ä.) oder — deutlich
simpler — per QR-Code, der Name, Wort und Rolle direkt kodiert. Die
Spiellogik liegt schon in `src/game.js`, der Screen-State in `App.jsx` und müsste dafür
in einen Reducer wandern, der Aktionen statt Screens verschickt.
