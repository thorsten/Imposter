import { useState, useEffect, useRef } from "react";

import { CATEGORIES, buildRound, maxImpostors } from "./game.js";

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const [screen, setScreen] = useState("start");
  const [players, setPlayers] = useState(["", "", ""]);
  const [categoryId, setCategoryId] = useState("mix");
  const [impostorCount, setImpostorCount] = useState(1);
  const [giveHint, setGiveHint] = useState(true);
  const [round, setRound] = useState(null);
  const [turn, setTurn] = useState(0);

  const names = players.map((p) => p.trim()).filter(Boolean);
  const canStart = names.length >= 3 && new Set(names).size === names.length;

  // Nach dem Entfernen von Spielern kann der gemerkte Wert über dem Deckel
  // liegen — abgeleitet clampen statt per Effekt zurückzusetzen.
  const impostors = Math.min(impostorCount, maxImpostors(names.length));

  function startRound() {
    setRound(buildRound({ names, categoryId, impostorCount: impostors }));
    setTurn(0);
    setScreen("pass");
  }

  function nextPlayer() {
    if (turn + 1 >= round.names.length) setScreen("round");
    else {
      setTurn(turn + 1);
      setScreen("pass");
    }
  }

  return (
    <div className="shell" data-screen={screen}>
      <Styles />
      {screen === "start" && <StartScreen onNew={() => setScreen("players")} />}

      {screen === "players" && (
        <PlayersScreen
          players={players}
          setPlayers={setPlayers}
          canStart={canStart}
          onBack={() => setScreen("start")}
          onNext={() => setScreen("setup")}
        />
      )}

      {screen === "setup" && (
        <SetupScreen
          count={names.length}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          impostorCount={impostors}
          setImpostorCount={setImpostorCount}
          giveHint={giveHint}
          setGiveHint={setGiveHint}
          onBack={() => setScreen("players")}
          onStart={startRound}
        />
      )}

      {screen === "pass" && (
        <PassScreen name={round.names[turn]} onReady={() => setScreen("reveal")} />
      )}

      {screen === "reveal" && (
        <RevealScreen
          name={round.names[turn]}
          isImpostor={round.impostors.has(turn)}
          word={round.word}
          hint={giveHint ? round.category : null}
          last={turn + 1 >= round.names.length}
          onDone={nextPlayer}
        />
      )}

      {screen === "round" && <RoundScreen round={round} onResolve={() => setScreen("result")} />}

      {screen === "result" && (
        <ResultScreen round={round} onAgain={startRound} onHome={() => setScreen("start")} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screens                                                            */
/* ------------------------------------------------------------------ */

function StartScreen({ onNew }) {
  return (
    <main className="pad center">
      <div className="mark">
        <span className="mark-line">WER IST</span>
        <span className="mark-big">
          DER
          <br />
          IMPOSTOR
        </span>
      </div>
      <p className="lede">
        Alle kennen das geheime Wort. Einer nicht. Reihum sagt jeder ein Hinweiswort — und dann wird
        geraten.
      </p>
      <button className="btn btn-torch btn-big" onClick={onNew}>
        Neues Spiel
      </button>
      <details className="rules">
        <summary>So läuft eine Runde</summary>
        <ol>
          <li>Namen eintragen, Handy reihum weitergeben.</li>
          <li>Jeder schaut sich sein Wort heimlich an.</li>
          <li>
            Reihum sagt jeder <em>ein</em> Wort, das zum geheimen Wort passt — aber nicht zu genau.
          </li>
          <li>Diskutieren, dann auf drei alle gleichzeitig auf einen zeigen.</li>
          <li>Auflösen. Der Impostor gewinnt, wenn er durchkommt oder das Wort errät.</li>
        </ol>
      </details>
    </main>
  );
}

function PlayersScreen({ players, setPlayers, canStart, onBack, onNext }) {
  const lastRef = useRef(null);

  const update = (i, v) => setPlayers(players.map((p, j) => (j === i ? v : p)));
  const remove = (i) => setPlayers(players.filter((_, j) => j !== i));
  const add = () => {
    setPlayers([...players, ""]);
    requestAnimationFrame(() => lastRef.current?.focus());
  };

  const filled = players.map((p) => p.trim()).filter(Boolean);
  const dupe = new Set(filled).size !== filled.length;

  return (
    <main className="pad">
      <Head onBack={onBack} title="Wer spielt mit?" />
      <ul className="players">
        {players.map((p, i) => (
          // Sitze sind über die Position identifiziert, es wird nie umsortiert.
          // oxlint-disable-next-line react/no-array-index-key
          <li key={i}>
            <span className="seat">{i + 1}</span>
            <input
              ref={i === players.length - 1 ? lastRef : null}
              value={p}
              onChange={(e) => update(i, e.target.value)}
              placeholder="Name"
              maxLength={14}
              autoComplete="off"
              aria-label={`Spieler ${i + 1}`}
            />
            {players.length > 3 && (
              <button
                className="icon"
                onClick={() => remove(i)}
                aria-label={`Spieler ${i + 1} entfernen`}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {players.length < 14 && (
        <button className="btn btn-ghost" onClick={add}>
          Spieler hinzufügen
        </button>
      )}

      <div className="foot">
        {dupe && (
          <p className="note">Zwei Spieler haben denselben Namen. Mach sie unterscheidbar.</p>
        )}
        {!dupe && filled.length < 3 && <p className="note">Ab drei Namen kann es losgehen.</p>}
        <button className="btn btn-torch btn-big" disabled={!canStart} onClick={onNext}>
          Weiter
        </button>
      </div>
    </main>
  );
}

function SetupScreen({
  count,
  categoryId,
  setCategoryId,
  impostorCount,
  setImpostorCount,
  giveHint,
  setGiveHint,
  onBack,
  onStart,
}) {
  const cap = maxImpostors(count);
  return (
    <main className="pad">
      <Head onBack={onBack} title="Einstellungen" />

      <section className="group">
        <h2>Kategorie</h2>
        <div className="chips">
          <button
            className={"chip" + (categoryId === "mix" ? " on" : "")}
            onClick={() => setCategoryId("mix")}
          >
            Bunt gemischt
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={"chip" + (categoryId === c.id ? " on" : "")}
              onClick={() => setCategoryId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="group">
        <h2>Wie viele Impostor?</h2>
        <div className="segment">
          {Array.from({ length: cap }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={"seg" + (impostorCount === n ? " on" : "")}
              onClick={() => setImpostorCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
        {cap === 1 && <p className="note">Ab sechs Spielern kannst du zwei Impostor einsetzen.</p>}
      </section>

      <section className="group">
        <button
          className={"toggle" + (giveHint ? " on" : "")}
          onClick={() => setGiveHint(!giveHint)}
          aria-pressed={giveHint}
        >
          <span>
            <strong>Impostor bekommt die Kategorie</strong>
            <small>Leichter für jüngere Runden. Aus = knallhart.</small>
          </span>
          <span className="knob" aria-hidden="true" />
        </button>
      </section>

      <div className="foot">
        <button className="btn btn-torch btn-big" onClick={onStart}>
          Wörter verteilen
        </button>
      </div>
    </main>
  );
}

function PassScreen({ name, onReady }) {
  return (
    <main className="pad center bright">
      <p className="pass-kicker">Handy weitergeben an</p>
      <h1 className="pass-name">{name}</h1>
      <button className="btn btn-dark btn-big" onClick={onReady}>
        Ich bin {name}
      </button>
      <p className="pass-warn">Alle anderen: wegschauen.</p>
    </main>
  );
}

function RevealScreen({ name, isImpostor, word, hint, last, onDone }) {
  const [held, setHeld] = useState(false);
  const [seen, setSeen] = useState(false);

  const show = () => {
    setHeld(true);
    setSeen(true);
  };
  const hide = () => setHeld(false);

  return (
    <main className="pad center">
      <p className="reveal-name">{name}</p>

      <button
        type="button"
        className={"pad-hold" + (held ? " open" : "") + (held && isImpostor ? " danger" : "")}
        aria-label="Zum Anzeigen gedrückt halten"
        onPointerDown={show}
        onPointerUp={hide}
        onPointerLeave={hide}
        onPointerCancel={hide}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            show();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") hide();
        }}
      >
        {held ? (
          isImpostor ? (
            <>
              <span className="word danger-word">Du bist der Impostor</span>
              {hint && <span className="sub">Kategorie: {hint}</span>}
              {!hint && <span className="sub">Tu so, als wüsstest du Bescheid.</span>}
            </>
          ) : (
            <>
              <span className="word">{word}</span>
              <span className="sub">Merk es dir.</span>
            </>
          )
        ) : (
          <>
            <span className="hold-label">Halten</span>
            <span className="sub">Finger drauf lassen</span>
          </>
        )}
      </button>

      <button className="btn btn-torch btn-big" disabled={!seen} onClick={onDone}>
        {seen ? (last ? "Alle haben geschaut" : "Fertig – weitergeben") : "Erst anschauen"}
      </button>
    </main>
  );
}

function RoundScreen({ round, onResolve }) {
  const { names, startIdx } = round;
  const order = names.map((_, i) => names[(startIdx + i) % names.length]);

  return (
    <main className="pad">
      <h1 className="h1">Los geht's</h1>
      <p className="lede">
        <strong>{order[0]}</strong> fängt an. Reihum sagt jeder ein einziges Wort.
      </p>

      <ol className="order">
        {order.map((n, i) => (
          <li key={n}>
            <span className="seat">{i + 1}</span>
            {n}
          </li>
        ))}
      </ol>

      <Timer />

      <div className="foot">
        <p className="note">Erst abstimmen — alle zeigen gleichzeitig auf einen.</p>
        <button className="btn btn-torch btn-big" onClick={onResolve}>
          Auflösen
        </button>
      </div>
    </main>
  );
}

function ResultScreen({ round, onAgain, onHome }) {
  const impostors = [...round.impostors].map((i) => round.names[i]);
  return (
    <main className="pad center">
      <p className="pass-kicker">Der Impostor war</p>
      <h1 className="result-names">{impostors.join(" & ")}</h1>
      <div className="word-card">
        <span className="pass-kicker">Das geheime Wort</span>
        <strong>{round.word}</strong>
        <small>{round.category}</small>
      </div>
      <button className="btn btn-torch btn-big" onClick={onAgain}>
        Nächste Runde
      </button>
      <button className="btn btn-ghost" onClick={onHome}>
        Spiel beenden
      </button>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Bausteine                                                          */
/* ------------------------------------------------------------------ */

function Head({ onBack, title }) {
  return (
    <header className="head">
      <button className="icon" onClick={onBack} aria-label="Zurück">
        ←
      </button>
      <h1 className="h1">{title}</h1>
    </header>
  );
}

function Timer() {
  const [left, setLeft] = useState(180);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => (s <= 1 ? (setRunning(false), 0) : s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className={"timer" + (left === 0 ? " done" : "")}>
      <span className="clock">
        {mm}:{ss}
      </span>
      <div className="timer-btns">
        <button className="btn btn-ghost btn-sm" onClick={() => setRunning(!running)}>
          {running ? "Pause" : left === 0 ? "Abgelaufen" : "Start"}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setRunning(false);
            setLeft(180);
          }}
        >
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

function Styles() {
  return (
    <style>{`
:root {
  --ink:      #141A2E;
  --ink-2:    #1E2842;
  --ink-3:    #2C3A5C;
  --paper:    #E9ECF6;
  --muted:    #8E9AB8;
  --torch:    #FFC53D;
  --danger:   #FF4D6D;
  --font: "Bricolage Grotesque", ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
}

.shell * { box-sizing: border-box; margin: 0; }
.shell {
  font-family: var(--font);
  background: var(--ink);
  color: var(--paper);
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.shell[data-screen="pass"] { background: var(--torch); }

.pad {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px 22px calc(28px + env(safe-area-inset-bottom));
  max-width: 520px;
  width: 100%;
  margin: 0 auto;
}
.center { align-items: center; justify-content: center; text-align: center; }

/* ---- Typografie ---- */
.h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
.lede { color: var(--muted); font-size: 16px; line-height: 1.5; max-width: 34ch; }
.center .lede { margin-inline: auto; }
.note { color: var(--muted); font-size: 14px; line-height: 1.45; }

.mark { display: grid; gap: 4px; }
.mark-line { font-size: 15px; font-weight: 700; letter-spacing: 0.18em; color: var(--torch); }
.mark-big {
  font-size: clamp(44px, 15vw, 64px);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.045em;
}

/* ---- Buttons ---- */
.btn {
  font: inherit; font-weight: 700; font-size: 17px;
  border: 0; border-radius: 16px; padding: 17px 22px;
  cursor: pointer; width: 100%; max-width: 380px;
  transition: transform .12s ease, background-color .12s ease, opacity .12s ease;
}
.btn:active { transform: scale(.975); }
.btn:focus-visible { outline: 3px solid var(--torch); outline-offset: 3px; }
.btn-big { padding: 20px 22px; font-size: 19px; }
.btn-sm { padding: 11px 16px; font-size: 15px; width: auto; }
.btn-torch { background: var(--torch); color: var(--ink); }
.btn-dark { background: var(--ink); color: var(--paper); }
.btn-dark:focus-visible { outline-color: var(--ink); }
.btn-ghost { background: transparent; color: var(--paper); box-shadow: inset 0 0 0 2px var(--ink-3); }
.btn:disabled { opacity: .32; cursor: default; transform: none; }

.icon {
  font: inherit; font-size: 20px; line-height: 1;
  background: var(--ink-2); color: var(--paper);
  border: 0; border-radius: 12px; width: 42px; height: 42px;
  flex: 0 0 42px; cursor: pointer;
}
.icon:focus-visible { outline: 3px solid var(--torch); outline-offset: 2px; }

/* ---- Kopf ---- */
.head { display: flex; align-items: center; gap: 14px; }

/* ---- Spielerliste ---- */
.players { list-style: none; padding: 0; display: grid; gap: 10px; }
.players li { display: flex; align-items: center; gap: 10px; }
.players input {
  flex: 1; min-width: 0; font: inherit; font-size: 18px; font-weight: 600;
  background: var(--ink-2); color: var(--paper);
  border: 0; border-radius: 12px; padding: 14px 16px;
}
.players input::placeholder { color: var(--muted); font-weight: 500; }
.players input:focus-visible { outline: 3px solid var(--torch); outline-offset: 2px; }
.seat {
  flex: 0 0 28px; text-align: center; font-size: 15px; font-weight: 700;
  color: var(--torch); font-variant-numeric: tabular-nums;
}

/* ---- Einstellungen ---- */
.group { display: grid; gap: 12px; }
.group h2 { font-size: 15px; font-weight: 700; letter-spacing: 0.04em; color: var(--muted); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  font: inherit; font-size: 15px; font-weight: 600; cursor: pointer;
  background: var(--ink-2); color: var(--paper);
  border: 0; border-radius: 999px; padding: 11px 16px;
}
.chip.on { background: var(--torch); color: var(--ink); }
.chip:focus-visible, .seg:focus-visible { outline: 3px solid var(--torch); outline-offset: 2px; }

.segment { display: flex; gap: 8px; }
.seg {
  font: inherit; font-size: 20px; font-weight: 800; cursor: pointer;
  background: var(--ink-2); color: var(--paper);
  border: 0; border-radius: 14px; padding: 14px 0; flex: 1;
}
.seg.on { background: var(--torch); color: var(--ink); }

.toggle {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  width: 100%; text-align: left; cursor: pointer; font: inherit;
  background: var(--ink-2); color: var(--paper);
  border: 0; border-radius: 16px; padding: 16px 18px;
}
.toggle span:first-child { display: grid; gap: 3px; }
.toggle strong { font-size: 16px; font-weight: 700; }
.toggle small { font-size: 13px; color: var(--muted); line-height: 1.35; }
.toggle:focus-visible { outline: 3px solid var(--torch); outline-offset: 2px; }
.knob {
  flex: 0 0 52px; height: 30px; border-radius: 999px; background: var(--ink-3);
  position: relative; transition: background-color .15s ease;
}
.knob::after {
  content: ""; position: absolute; top: 4px; left: 4px;
  width: 22px; height: 22px; border-radius: 50%; background: var(--paper);
  transition: transform .15s ease;
}
.toggle.on .knob { background: var(--torch); }
.toggle.on .knob::after { transform: translateX(22px); background: var(--ink); }

/* ---- Übergabe ---- */
.bright { color: var(--ink); }
.pass-kicker { font-size: 15px; font-weight: 700; letter-spacing: 0.14em; opacity: .65; }
.pass-name {
  font-size: clamp(44px, 16vw, 68px); font-weight: 800;
  letter-spacing: -0.04em; line-height: 1; margin: 6px 0 10px;
  overflow-wrap: anywhere;
}
.pass-warn { font-size: 15px; font-weight: 600; opacity: .6; }

/* ---- Reveal ---- */
.reveal-name { font-size: 18px; font-weight: 700; color: var(--torch); }
.pad-hold {
  font: inherit; color: inherit; border: 0;
  width: 100%; max-width: 380px; min-height: 260px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 28px 22px; border-radius: 28px;
  background: var(--ink-2); box-shadow: inset 0 0 0 2px var(--ink-3);
  cursor: pointer;
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  touch-action: none;
  transition: background-color .1s ease, box-shadow .1s ease;
}
.pad-hold:focus-visible { outline: 3px solid var(--torch); outline-offset: 3px; }
.pad-hold.open { background: var(--paper); box-shadow: none; color: var(--ink); }
.pad-hold.danger { background: var(--danger); color: #fff; }
.hold-label { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
.word {
  font-size: clamp(34px, 11vw, 46px); font-weight: 800;
  letter-spacing: -0.035em; line-height: 1.02; overflow-wrap: anywhere;
}
.danger-word { font-size: clamp(28px, 9vw, 38px); }
.sub { font-size: 15px; font-weight: 600; opacity: .6; }

/* ---- Runde ---- */
.order { list-style: none; padding: 0; display: grid; gap: 8px; }
.order li {
  display: flex; align-items: center; gap: 12px;
  background: var(--ink-2); border-radius: 12px; padding: 13px 16px;
  font-size: 17px; font-weight: 600;
}
.order li:first-child { box-shadow: inset 0 0 0 2px var(--torch); }

.timer {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  flex-wrap: wrap;
  background: var(--ink-2); border-radius: 16px; padding: 16px 18px;
}
.timer.done { background: var(--danger); }
.clock { font-size: 34px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.timer-btns { display: flex; gap: 8px; }

/* ---- Ergebnis ---- */
.result-names {
  font-size: clamp(38px, 13vw, 56px); font-weight: 800;
  letter-spacing: -0.04em; line-height: 1; color: var(--danger);
  margin: 6px 0 4px; overflow-wrap: anywhere;
}
.word-card {
  display: grid; gap: 4px; justify-items: center;
  background: var(--ink-2); border-radius: 20px; padding: 22px 26px;
  width: 100%; max-width: 380px; margin: 8px 0;
}
.word-card strong { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; overflow-wrap: anywhere; }
.word-card small { font-size: 14px; color: var(--muted); }

/* ---- Regeln ---- */
.rules { max-width: 380px; width: 100%; text-align: left; }
.rules summary {
  cursor: pointer; font-size: 15px; font-weight: 700; color: var(--torch);
  padding: 12px 0; list-style-position: inside;
}
.rules ol { color: var(--muted); font-size: 15px; line-height: 1.55; padding-left: 20px; display: grid; gap: 7px; }

.foot { margin-top: auto; display: grid; gap: 12px; justify-items: center; padding-top: 12px; }
.foot .btn { justify-self: stretch; max-width: none; }

@media (prefers-reduced-motion: reduce) {
  .shell *, .shell *::after { transition: none !important; }
}
`}</style>
  );
}
