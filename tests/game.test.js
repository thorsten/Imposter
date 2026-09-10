import { describe, expect, it } from "vitest";

import { CATEGORIES, buildRound, maxImpostors, pick, pickDistinct } from "../src/game.js";

// Deterministischer Ersatz fuer Math.random: gibt die Werte der Reihe nach aus
// und wiederholt sie danach, damit while-Schleifen nicht ins Leere laufen.
const rngOf = (...values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("Wortlisten", () => {
  it("hat neun Kategorien mit eindeutigen ids", () => {
    expect(CATEGORIES).toHaveLength(9);
    expect(new Set(CATEGORIES.map((c) => c.id)).size).toBe(CATEGORIES.length);
  });

  it("reserviert 'mix' als Pseudo-id", () => {
    expect(CATEGORIES.map((c) => c.id)).not.toContain("mix");
  });

  it.each(CATEGORIES.map((c) => [c.id, c]))("%s: 24 eindeutige, nicht leere Woerter", (_id, cat) => {
    expect(cat.words).toHaveLength(24);
    expect(new Set(cat.words).size).toBe(24);
    expect(cat.words.every((w) => typeof w === "string" && w.trim() === w && w.length > 0)).toBe(true);
  });

  it("verteilt kein Wort ueber zwei Kategorien", () => {
    const all = CATEGORIES.flatMap((c) => c.words);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("maxImpostors", () => {
  it.each([
    [3, 1],
    [5, 1],
    [6, 2],
    [8, 2],
    [9, 3],
    [20, 3],
  ])("%i Spieler -> %i Impostor", (players, expected) => {
    expect(maxImpostors(players)).toBe(expected);
  });

  it("laesst den Impostoren nie die Mehrheit", () => {
    for (let n = 3; n <= 20; n++) expect(maxImpostors(n) * 2).toBeLessThan(n);
  });
});

describe("pick", () => {
  it("indiziert ueber die Laenge", () => {
    expect(pick(["a", "b", "c"], rngOf(0))).toBe("a");
    expect(pick(["a", "b", "c"], rngOf(0.99))).toBe("c");
  });
});

describe("pickDistinct", () => {
  it("liefert genau count verschiedene Indizes", () => {
    const out = pickDistinct(3, 5, rngOf(0, 0, 0.2, 0.2, 0.8));
    expect([...out].sort()).toEqual([0, 1, 4]);
  });

  it("bleibt im Bereich 0..max-1", () => {
    for (let run = 0; run < 200; run++) {
      for (const i of pickDistinct(2, 4)) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(4);
      }
    }
  });

  it("wirft statt endlos zu ziehen, wenn count > max", () => {
    expect(() => pickDistinct(4, 3)).toThrow(RangeError);
  });
});

describe("buildRound", () => {
  const names = ["Ada", "Bo", "Cem", "Dilan", "Eda", "Finn"];

  it("nimmt die angefragte Kategorie", () => {
    const round = buildRound({ names, categoryId: "tiere", impostorCount: 1 });
    const tiere = CATEGORIES.find((c) => c.id === "tiere");
    expect(round.category).toBe(tiere.name);
    expect(tiere.words).toContain(round.word);
  });

  it("zieht bei 'mix' aus irgendeiner Kategorie", () => {
    const round = buildRound({ names, categoryId: "mix", impostorCount: 1 });
    const cat = CATEGORIES.find((c) => c.name === round.category);
    expect(cat.words).toContain(round.word);
  });

  it("wirft bei unbekannter Kategorie", () => {
    expect(() => buildRound({ names, categoryId: "quatsch", impostorCount: 1 })).toThrow(/Unbekannte Kategorie/);
  });

  it("deckelt impostorCount auf das Maximum der Gruppengroesse", () => {
    const round = buildRound({ names: names.slice(0, 3), categoryId: "tiere", impostorCount: 3 });
    expect(round.impostors.size).toBe(1);
  });

  it("verteilt Impostor nur auf existierende Spieler", () => {
    for (let run = 0; run < 200; run++) {
      const round = buildRound({ names, categoryId: "mix", impostorCount: 2 });
      expect(round.impostors.size).toBe(2);
      for (const i of round.impostors) expect(names[i]).toBeDefined();
      expect(round.startIdx).toBeLessThan(names.length);
    }
  });

  it("ist bei gleichem rng reproduzierbar", () => {
    const seed = () => rngOf(0.1, 0.4, 0.6, 0.2);
    expect(buildRound({ names, categoryId: "mix", impostorCount: 2 }, seed())).toEqual(
      buildRound({ names, categoryId: "mix", impostorCount: 2 }, seed())
    );
  });
});
