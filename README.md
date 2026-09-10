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
```

`dist/` ist rein statisch — Netlify, Vercel, GitHub Pages, S3, Apache, egal.
Für ein Unterverzeichnis `base` in `vite.config.js` anpassen.

## Offline

`vite-plugin-pwa` erzeugt beim Build einen Service Worker, der sämtliche
Assets inklusive Schriftdateien precacht (aktuell ~235 KB). Nach dem ersten
Aufruf läuft die App ohne Netz. `registerType: "autoUpdate"` zieht neue
Versionen im Hintergrund nach.

Wichtig: Service Worker brauchen HTTPS oder `localhost`. Auf dem Handy testen
geht am einfachsten über einen Tunnel oder ein Zertifikat für den Dev-Server.

## Aufbau

```
src/App.jsx     komplette App: Wortlisten, Spiellogik, Screens, CSS
src/main.jsx    Mount + Schrift
public/         Icons
```

`App.jsx` ist bewusst eine Datei ohne Abhängigkeiten außer React. Beim
Aufteilen zuerst die `CATEGORIES` nach `src/words.js` ziehen — das ist der
Teil, der wächst.

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
Array in `CATEGORIES` ergänzen, fertig. Faustregel bei neuen Wörtern — das
Wort muss mindestens fünf verschiedene naheliegende Hinweiswörter zulassen,
sonst fliegt der Impostor sofort auf oder niemand kann etwas sagen.

## Nächster Schritt: mehrere Geräte

Für Mehrgeräte-Betrieb ohne Server: ein Gerät wird Host und öffnet einen
Raum, die anderen verbinden sich per WebRTC (PeerJS o. ä.) oder — deutlich
simpler — per QR-Code, der Name, Wort und Rolle direkt kodiert. Die
Spiellogik liegt schon vollständig im State von `App.jsx` und müsste dafür
in einen Reducer wandern, der Aktionen statt Screens verschickt.
