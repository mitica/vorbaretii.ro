/**
 * Variantele SERVITE ale imaginilor de articol: assets/images/articol-*.jpg →
 * public/assets/images/<nume>-{768,1536}.jpg (jpeg progresiv). Masterul 2k
 * (cadrul viitorului video) nu părăsește assets/ — paginile nu servesc
 * niciodată imaginea brută (legea operatorului; test-image-serving o respinge).
 * Iconițele au pipeline separat (generate-icons.ts); imaginile de marketing
 * au copiile publice comise static și nu se reprocesează.
 */

import sharp from "sharp";
import { join } from "path";
import { readdir, stat } from "fs/promises";

const SOURCE_DIR = join(__dirname, "../assets/images");
const OUTPUT_DIR = join(__dirname, "../public/assets/images");
const ARTICLE_PREFIX = "articol-";
const SERVED_WIDTHS = [768, 1536];
const MAX_SERVED_BYTES = 300 * 1024;

/** Bugetul e lege (test-image-serving): calitatea coboară până fișierul intră. */
const compressImage = async (name: string, width: number) => {
  const output = join(OUTPUT_DIR, `${name.replace(/\.jpg$/, "")}-${width}.jpg`);
  for (let quality = width === 1536 ? 70 : 80; quality >= 46; quality -= 8) {
    await sharp(join(SOURCE_DIR, name))
      .resize({ width, fit: "inside" })
      .jpeg({ progressive: true, quality })
      .toFile(output);
    const { size } = await stat(output);
    if (size <= MAX_SERVED_BYTES) {
      console.log(`Generating ${output} (q${quality}, ${Math.round(size / 1024)}KB)`);
      return;
    }
  }
  throw new Error(`${output}: nu intră în ${MAX_SERVED_BYTES / 1024}KB nici la calitate minimă`);
};

async function generate() {
  const images = await readdir(SOURCE_DIR);
  for (const name of images.filter((n) => n.startsWith(ARTICLE_PREFIX) && n.endsWith(".jpg"))) {
    for (const width of SERVED_WIDTHS) {
      await compressImage(name, width);
    }
  }
}

generate();
