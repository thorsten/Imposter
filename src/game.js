/* ------------------------------------------------------------------ */
/*  Wortlisten und Spiellogik                                          */
/*                                                                     */
/*  Bewusst frei von React: der ganze Zufall der Runde steckt hier und */
/*  laesst sich mit einem eigenen rng deterministisch testen.          */
/* ------------------------------------------------------------------ */

export const CATEGORIES = [
  {
    id: "tiere",
    name: "Tiere",
    words: ["Elefant", "Pinguin", "Hamster", "Waschbär", "Delfin", "Adler", "Krokodil", "Igel",
      "Fledermaus", "Qualle", "Kamel", "Eichhörnchen", "Wolf", "Papagei", "Schildkröte", "Biene",
      "Hai", "Giraffe", "Frosch", "Maulwurf", "Chamäleon", "Ameise", "Eisbär", "Esel"],
  },
  {
    id: "essen",
    name: "Essen",
    words: ["Pizza", "Döner", "Spaghetti", "Popcorn", "Gummibärchen", "Wassermelone", "Pfannkuchen",
      "Brezel", "Currywurst", "Erdnussbutter", "Milchreis", "Sushi", "Pommes", "Zimtschnecke",
      "Käsebrot", "Eiswaffel", "Kürbissuppe", "Müsli", "Schokolade", "Salzstangen", "Lasagne",
      "Apfelschorle", "Kaugummi", "Nussnougatcreme"],
  },
  {
    id: "schule",
    name: "Schule",
    words: ["Tafel", "Pausenhof", "Hausaufgaben", "Zeugnis", "Radiergummi", "Turnhalle", "Schulbus",
      "Klassenfahrt", "Mathearbeit", "Lehrerzimmer", "Schulranzen", "Vertretungsstunde",
      "Federmäppchen", "Sitzplan", "Klassensprecher", "Kreide", "Beamer", "Schwimmunterricht",
      "Mensa", "Elternabend", "Spickzettel", "Sommerferien", "Schulchor", "Nachsitzen"],
  },
  {
    id: "sport",
    name: "Sport",
    words: ["Fußball", "Trampolin", "Klettern", "Basketball", "Torwart", "Fahrradfahren",
      "Skateboard", "Tischtennis", "Schiedsrichter", "Marathon", "Turnen", "Reiten", "Handball",
      "Schlittschuh", "Volleyball", "Boxen", "Federball", "Elfmeter", "Trikot", "Schwimmflossen",
      "Judo", "Seilspringen", "Stadion", "Startblock"],
  },
  {
    id: "zuhause",
    name: "Zuhause",
    words: ["Kühlschrank", "Sofa", "Waschmaschine", "Zahnbürste", "Staubsauger", "Bettdecke",
      "Wecker", "Dusche", "Balkon", "Spülmaschine", "Kleiderschrank", "Fernbedienung", "Mülleimer",
      "Heizung", "Wäscheklammer", "Teppich", "Fensterbank", "Spiegel", "Keller", "Türklingel",
      "Steckdose", "Kopfkissen", "Backofen", "Gartenschlauch"],
  },
  {
    id: "natur",
    name: "Draußen",
    words: ["Gewitter", "Regenbogen", "Schneeball", "Pfütze", "Lagerfeuer", "Wald", "Bergsee",
      "Sandstrand", "Nebel", "Ameisenhaufen", "Sonnenuntergang", "Baumhaus", "Fluss", "Höhle",
      "Wiese", "Sturm", "Vulkan", "Wüste", "Wasserfall", "Mondlicht", "Hagel", "Sternenhimmel",
      "Fliegenpilz", "Eiszapfen"],
  },
  {
    id: "orte",
    name: "Orte",
    words: ["Aquarium", "Zoo", "Flughafen", "Supermarkt", "Kino", "Bahnhof", "Krankenhaus",
      "Zeltplatz", "Museum", "Friseursalon", "Bäckerei", "Feuerwache", "Freizeitpark", "Rathaus",
      "Tankstelle", "Bushaltestelle", "Eisdiele", "Sporthalle", "Baustelle", "Leuchtturm",
      "Bauernhof", "Hotel", "Parkhaus", "Jugendherberge"],
  },
  {
    id: "berufe",
    name: "Berufe",
    words: ["Feuerwehrmann", "Tierärztin", "Pilot", "Bäcker", "Lehrerin", "Polizist", "Koch",
      "Gärtnerin", "Zahnarzt", "Busfahrer", "Fußballprofi", "Musikerin", "Astronaut", "Friseurin",
      "Schreiner", "Krankenpfleger", "Fotografin", "Bauarbeiter", "Programmiererin", "Briefträger",
      "Schauspielerin", "Bibliothekar", "Imker", "Rettungsschwimmerin"],
  },
  {
    id: "freizeit",
    name: "Freizeit",
    words: ["Kopfhörer", "Fahrradtour", "Geburtstagsparty", "Videospiel", "Comic", "Puzzle",
      "Kartenspiel", "Trampolinpark", "Schnitzeljagd", "Übernachtungsparty", "Escape Room",
      "Gitarre", "Malen", "Tanzen", "Brettspiel", "Zauberwürfel", "Karaoke", "Papierflieger",
      "Wasserbombe", "Achterbahn", "Freundschaftsarmband", "Stockbrot", "Verstecken", "Hörspiel"],
  },
];

export const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];

export function pickDistinct(count, max, rng = Math.random) {
  if (count > max) throw new RangeError(`${count} aus ${max} lassen sich nicht ziehen`);
  const out = new Set();
  while (out.size < count) out.add(Math.floor(rng() * max));
  return out;
}

// Ab 6 Spielern zwei, ab 9 drei Impostor — sonst kippt die Mehrheit.
export const maxImpostors = (n) => (n >= 9 ? 3 : n >= 6 ? 2 : 1);

export function buildRound({ names, categoryId, impostorCount }, rng = Math.random) {
  const cat = categoryId === "mix" ? pick(CATEGORIES, rng) : CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) throw new Error(`Unbekannte Kategorie: ${categoryId}`);

  return {
    word: pick(cat.words, rng),
    category: cat.name,
    impostors: pickDistinct(Math.min(impostorCount, maxImpostors(names.length)), names.length, rng),
    names,
    startIdx: Math.floor(rng() * names.length),
  };
}
