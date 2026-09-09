/**
 * Iconițele site-ului: componenta V randată în SVG și trecută prin sharp în
 * PNG-urile din public/assets/icons, o mărime per intrare de manifest.
 * Imaginile de articol au pipeline separat (compress-images.ts).
 */

import sharp from "sharp";
import { join } from "path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import VIcon, { VIconProps } from "../app/components/icons/v-icon";

/** Mărimile cerute de manifest și de `<link rel="icon">`. */
const SIZES = [16, 32, 96, 120, 144, 152, 180, 192, 384, 228, 230, 512, 1024];
const NAME = "icon";
const LINE_COLOR = "#be185d";

const generateIcon = async (size: number) => {
  const file = `${NAME}-${size}.png`;
  const props: VIconProps = { w: size, h: size, lineColor: LINE_COLOR };
  const input = renderToStaticMarkup(createElement(VIcon, props));
  const output = join(__dirname, `../public/assets/icons/${file}`);

  console.log(`Generating ${file}...`);

  await sharp(Buffer.from(input)).toFormat("png").toFile(output);
};

async function generate() {
  for (const size of SIZES) {
    await generateIcon(size);
  }
}

generate().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
