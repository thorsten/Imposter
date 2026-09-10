import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../src/App.jsx";
import { CATEGORIES } from "../src/game.js";

afterEach(cleanup);

/** Namen eintragen und bis zum Einstellungs-Screen durchklicken. */
async function toSetup(user, names = ["Ada", "Bo", "Cem"]) {
  await user.click(screen.getByRole("button", { name: "Neues Spiel" }));
  for (let i = 3; i < names.length; i++) {
    await user.click(screen.getByRole("button", { name: "Spieler hinzufügen" }));
  }
  for (const [i, name] of names.entries()) {
    await user.type(screen.getByLabelText(`Spieler ${i + 1}`), name);
  }
  await user.click(screen.getByRole("button", { name: "Weiter" }));
}

/** Das Wort auf dem Reveal-Screen aufdecken und wieder loslassen. */
async function peek(user) {
  const holdPad = screen.getByRole("button", { name: "Zum Anzeigen gedrückt halten" });
  await user.pointer({ keys: "[MouseLeft>]", target: holdPad });
  const shown = holdPad.textContent;
  await user.pointer({ keys: "[/MouseLeft]", target: holdPad });
  return shown;
}

describe("Spielerverwaltung", () => {
  it("blockiert Weiter, bis drei Namen stehen", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Neues Spiel" }));

    expect(screen.getByRole("button", { name: "Weiter" })).toBeDisabled();

    await user.type(screen.getByLabelText("Spieler 1"), "Ada");
    await user.type(screen.getByLabelText("Spieler 2"), "Bo");
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDisabled();

    await user.type(screen.getByLabelText("Spieler 3"), "Cem");
    expect(screen.getByRole("button", { name: "Weiter" })).toBeEnabled();
  });

  it("blockiert doppelte Namen und sagt warum", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Neues Spiel" }));

    for (const [i, name] of ["Ada", "Bo", "Ada"].entries()) {
      await user.type(screen.getByLabelText(`Spieler ${i + 1}`), name);
    }

    expect(screen.getByText(/denselben Namen/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDisabled();
  });

  it("legt Spieler an und entfernt sie wieder", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Neues Spiel" }));

    // Unter vier Spielern gibt es nichts zu entfernen — sonst faellt man unter drei.
    expect(screen.queryByRole("button", { name: /entfernen/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Spieler hinzufügen" }));
    expect(screen.getByLabelText("Spieler 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Spieler 4 entfernen" }));
    expect(screen.queryByLabelText("Spieler 4")).not.toBeInTheDocument();
  });

  it("deckelt die Runde bei 14 Spielern", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Neues Spiel" }));

    for (let i = 3; i < 14; i++) {
      await user.click(screen.getByRole("button", { name: "Spieler hinzufügen" }));
    }

    expect(screen.getByLabelText("Spieler 14")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Spieler hinzufügen" })).not.toBeInTheDocument();
  });
});

describe("Einstellungen", () => {
  it("bietet bei drei Spielern nur einen Impostor an", async () => {
    const user = userEvent.setup();
    render(<App />);
    await toSetup(user);

    expect(screen.getByText(/Ab sechs Spielern/)).toBeInTheDocument();
    const segment = screen.getByRole("heading", { name: "Wie viele Impostor?" }).nextElementSibling;
    expect(within(segment).getAllByRole("button").map((b) => b.textContent)).toEqual(["1"]);
  });

  it("erlaubt ab sechs Spielern zwei Impostor", async () => {
    const user = userEvent.setup();
    render(<App />);
    await toSetup(user, ["Ada", "Bo", "Cem", "Dilan", "Eda", "Finn"]);

    const segment = screen.getByRole("heading", { name: "Wie viele Impostor?" }).nextElementSibling;
    expect(within(segment).getAllByRole("button").map((b) => b.textContent)).toEqual(["1", "2"]);
  });

  it("hat den Kategorie-Hinweis standardmaessig an", async () => {
    const user = userEvent.setup();
    render(<App />);
    await toSetup(user);

    const toggle = screen.getByRole("button", { name: /Impostor bekommt die Kategorie/ });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("listet jede Kategorie als Chip", async () => {
    const user = userEvent.setup();
    render(<App />);
    await toSetup(user);

    for (const cat of CATEGORIES) {
      expect(screen.getByRole("button", { name: cat.name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Bunt gemischt" })).toBeInTheDocument();
  });
});

describe("Runde", () => {
  beforeEach(() => {
    // Feste Ziehung: Kategorie/Wort/Impostor/Startspieler werden reproduzierbar.
    vi.spyOn(Math, "random").mockReturnValue(0);
  });
  afterEach(() => vi.restoreAllMocks());

  it("zeigt genau einem Spieler die Impostor-Rolle, allen anderen das Wort", async () => {
    const user = userEvent.setup();
    render(<App />);
    await toSetup(user);
    await user.click(screen.getByRole("button", { name: "Tiere" }));
    await user.click(screen.getByRole("button", { name: "Wörter verteilen" }));

    const seen = [];
    for (const name of ["Ada", "Bo", "Cem"]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: `Ich bin ${name}` }));

      // Vor dem Anschauen gibt es kein Weiter.
      expect(screen.getByRole("button", { name: "Erst anschauen" })).toBeDisabled();
      seen.push(await peek(user));

      await user.click(screen.getByRole("button", { name: /Fertig – weitergeben|Alle haben geschaut/ }));
    }

    const impostors = seen.filter((t) => t.includes("Du bist der Impostor"));
    expect(impostors).toHaveLength(1);
    expect(impostors[0]).toMatch(/Kategorie: Tiere/);

    const words = seen.filter((t) => !t.includes("Du bist der Impostor"));
    expect(words).toHaveLength(2);
    expect(new Set(words).size).toBe(1); // alle Nicht-Impostor sehen dasselbe Wort
  });

  it("haelt das Wort nur solange der Finger liegt", async () => {
    const user = userEvent.setup();
    render(<App />);
    await toSetup(user);
    await user.click(screen.getByRole("button", { name: "Wörter verteilen" }));
    await user.click(screen.getByRole("button", { name: /^Ich bin / }));

    const holdPad = screen.getByRole("button", { name: "Zum Anzeigen gedrückt halten" });
    expect(holdPad).toHaveTextContent("Halten");

    await user.pointer({ keys: "[MouseLeft>]", target: holdPad });
    expect(holdPad).not.toHaveTextContent("Halten");

    await user.pointer({ keys: "[/MouseLeft]", target: holdPad });
    expect(holdPad).toHaveTextContent("Halten");
  });

  it("verrät dem Impostor ohne Hinweis die Kategorie nicht", async () => {
    const user = userEvent.setup();
    render(<App />);
    await toSetup(user);
    await user.click(screen.getByRole("button", { name: /Impostor bekommt die Kategorie/ }));
    await user.click(screen.getByRole("button", { name: "Wörter verteilen" }));

    const seen = [];
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("button", { name: /^Ich bin / }));
      seen.push(await peek(user));
      await user.click(screen.getByRole("button", { name: /Fertig – weitergeben|Alle haben geschaut/ }));
    }

    const impostor = seen.find((t) => t.includes("Du bist der Impostor"));
    expect(impostor).not.toMatch(/Kategorie:/);
    expect(impostor).toMatch(/Tu so, als wüsstest du Bescheid/);
  });

  it("loest auf und nennt Impostor plus Wort", async () => {
    const user = userEvent.setup();
    render(<App />);
    await toSetup(user);
    await user.click(screen.getByRole("button", { name: "Tiere" }));
    await user.click(screen.getByRole("button", { name: "Wörter verteilen" }));

    let word;
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("button", { name: /^Ich bin / }));
      const shown = await peek(user);
      if (!shown.includes("Du bist der Impostor")) word = shown.replace("Merk es dir.", "");
      await user.click(screen.getByRole("button", { name: /Fertig – weitergeben|Alle haben geschaut/ }));
    }

    expect(screen.getByRole("heading", { name: "Los geht's" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Auflösen" }));

    expect(screen.getByText("Der Impostor war")).toBeInTheDocument();
    expect(screen.getByText(word)).toBeInTheDocument();
    expect(screen.getByText("Tiere")).toBeInTheDocument();
  });

  it("führt vom Ergebnis zurück ins Menü", async () => {
    const user = userEvent.setup();
    render(<App />);
    await toSetup(user);
    await user.click(screen.getByRole("button", { name: "Wörter verteilen" }));
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("button", { name: /^Ich bin / }));
      await peek(user);
      await user.click(screen.getByRole("button", { name: /Fertig – weitergeben|Alle haben geschaut/ }));
    }
    await user.click(screen.getByRole("button", { name: "Auflösen" }));
    await user.click(screen.getByRole("button", { name: "Spiel beenden" }));

    expect(screen.getByRole("button", { name: "Neues Spiel" })).toBeInTheDocument();
  });
});
