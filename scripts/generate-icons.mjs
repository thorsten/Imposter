// PNG-Icons aus assets/icon.svg bauen. Vite kopiert public/ unveraendert ins
// Bundle, deshalb landen die Ergebnisse dort und werden mitcommittet — der
// Build soll ohne sharp durchlaufen.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = await readFile(resolve(root, "assets/icon.svg"));
const out = resolve(root, "public");

await mkdir(out, { recursive: true });

for (const size of [192, 512]) {
  const png = await sharp(svg, { density: 512 }).resize(size, size).png().toBuffer();
  await writeFile(resolve(out, `icon-${size}.png`), png);
  console.log(`icon-${size}.png  ${(png.length / 1024).toFixed(1)} KB`);
}

// Apple ignoriert das Manifest und zieht sich das Touch-Icon aus dem <head>.
const apple = await sharp(svg, { density: 512 }).resize(180, 180).png().toBuffer();
await writeFile(resolve(out, "apple-touch-icon.png"), apple);
console.log(`apple-touch-icon.png  ${(apple.length / 1024).toFixed(1)} KB`);
