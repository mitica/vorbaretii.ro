/**
 * Copia servită a imaginilor de articol: assets/images/articol-*.jpg →
 * public/assets/images/, optimizată (jpeg progresiv), la mărimea originală.
 * Variantele de mărime nu se mai generează — nimic nu le citea; iconițele
 * au pipeline-ul lor separat (generate-icons.ts). Imaginile de marketing
 * din assets/ au copiile publice comise static și nu se reprocesează.
 */

import sharp from "sharp";
import { join } from "path";
import { readdir } from "fs/promises";

const SOURCE_DIR = join(__dirname, "../assets/images");
const OUTPUT_DIR = join(__dirname, "../public/assets/images");
const ARTICLE_PREFIX = "articol-";

const compressImage = async (name: string) => {
  const input = join(SOURCE_DIR, name);
  console.log(`Generating ${input}`);
  await sharp(input)
    .jpeg({ progressive: true, force: false })
    .png({ progressive: true, force: false })
    .toFile(join(OUTPUT_DIR, name));
};

async function generate() {
  const images = await readdir(SOURCE_DIR);
  for (const name of images.filter((n) => n.startsWith(ARTICLE_PREFIX))) {
    await compressImage(name);
  }
}

generate();
