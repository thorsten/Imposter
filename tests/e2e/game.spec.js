import { expect, test } from "@playwright/test";

/** Drei Namen eintragen und bis zum Einstellungs-Screen durchklicken. */
async function toSetup(page, names = ["Ada", "Bo", "Cem"]) {
  await page.getByRole("button", { name: "Neues Spiel" }).click();
  for (const [i, name] of names.entries()) {
    await page.getByLabel(`Spieler ${i + 1}`).fill(name);
  }
  await page.getByRole("button", { name: "Weiter" }).click();
}

/** Das Wort per gedrückt gehaltenem Zeiger aufdecken, Text merken, loslassen. */
async function peek(page) {
  const pad = page.getByRole("button", { name: "Zum Anzeigen gedrückt halten" });
  const box = await pad.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(pad).not.toContainText("Halten");
  const shown = await pad.textContent();
  await page.mouse.up();
  await expect(pad).toContainText("Halten");
  return shown;
}

test("eine komplette Runde auf einem Gerät", async ({ page }) => {
  await page.goto("/");
  await toSetup(page);
  await page.getByRole("button", { name: "Tiere" }).click();
  await page.getByRole("button", { name: "Wörter verteilen" }).click();

  const seen = [];
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: /^Ich bin / }).click();
    // Vor dem Anschauen geht es nicht weiter.
    await expect(page.getByRole("button", { name: "Erst anschauen" })).toBeDisabled();
    seen.push(await peek(page));
    await page.getByRole("button", { name: /Fertig – weitergeben|Alle haben geschaut/ }).click();
  }

  const impostors = seen.filter((t) => t.includes("Du bist der Impostor"));
  expect(impostors).toHaveLength(1);
  const words = seen.filter((t) => !t.includes("Du bist der Impostor"));
  expect(new Set(words).size).toBe(1);

  await expect(page.getByRole("heading", { name: "Los geht's" })).toBeVisible();
  await page.getByRole("button", { name: "Auflösen" }).click();
  await expect(page.getByText("Der Impostor war")).toBeVisible();
  await expect(page.getByText("Das geheime Wort")).toBeVisible();
});

test("registriert den Service Worker für den Offline-Betrieb", async ({ page }) => {
  await page.goto("/");
  const scope = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active?.scriptURL ?? "";
  });
  expect(scope).toContain("sw.js");
});
