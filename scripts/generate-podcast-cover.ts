/**
 * Coperta de podcast (ADR-032): compoziția casei, randată determinist în canvas
 * la 3000×3000 și scrisă ca JPEG (RGB, fără alpha — cerința Apple) sub 512 KB în
 * public/assets/podcast/cover-3000.jpg, comisă. Paleta conceptului vizual
 * (ADR-018): albastru de Voroneț, disc crem cu inel cer, mascota „salut",
 * Inter Bold (fontul site-ului și al filmului), chip galben, accent roz.
 *
 *   yarn generate-podcast-cover
 */

import {
  createCanvas,
  GlobalFonts,
  loadImage,
  type Canvas,
  type SKRSContext2D,
} from "@napi-rs/canvas";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { mascotSvg } from "../app/components/mascot/mascot-svg";
import { RITUAL } from "../app/azi/naming";
import { FONTS, FONT_DIR } from "./video/config";

const SIZE = 3000;
const OUT = join(__dirname, "../public/assets/podcast/cover-3000.jpg");
/** Plafonul Apple pentru copertă (ADR-032): aici se coboară calitatea sub el, legea îl verifică pe disc. */
export const COVER_MAX_BYTES = 512 * 1024;
const PALETTE = {
  voronet: "#3E4394",
  sky: "#81C5F4",
  cream: "#FBF3E4",
  yellow: "#FFC526",
  pink: "#FF66A6",
  ink: "#2B2A33",
} as const;

/** Axa compoziției: numele, chip-ul și mascota stau toate pe ea. */
const CENTER_X = SIZE / 2;
/** Chip-ul galben de sub nume, din compoziția v2 — înălțimea și linia de bază rămân ale ei. */
const CHIP_TOP = 2530;
const CHIP_HEIGHT = 230;
const CHIP_BASELINE = 2690;
const CHIP_FONT = '140px "Inter Bold"';
/**
 * Aerul de o parte și de alta a textului din chip. Nu e un număr ales acum: e
 * exact cât avea compoziția v2 — cutia ei fixă (1290) minus textul de atunci,
 * măsurat la 140px (1150), împărțit în două părți. Așa orice nume primește
 * aceeași respirație, iar unul scurt nu mai plutește în cutia altui text.
 */
const CHIP_PADDING_X = 70;
/** Numele din chip vine din casa lui (ADR-048): aici doar se citește, nu se rescrie. */
const CHIP_LABEL = RITUAL.name;

type Dot = { center: [number, number]; radius: number; fill: string };

function circle(ctx: SKRSContext2D, dot: Dot): void {
  ctx.fillStyle = dot.fill;
  ctx.beginPath();
  ctx.arc(dot.center[0], dot.center[1], dot.radius, 0, Math.PI * 2);
  ctx.fill();
}

function chip(ctx: SKRSContext2D, box: [number, number, number, number], fill: string): void {
  const [x, y, width, height] = box;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, height / 2);
  ctx.fill();
}

/**
 * Cutia chip-ului în jurul textului MĂSURAT: lățimea lui plus aerul de o parte
 * și de alta, centrată pe axa copertei. Cutia fixă de dinainte era a unui text
 * anume — la orice alt nume rămânea pe jumătate goală.
 */
export function chipBox(labelWidth: number): [number, number, number, number] {
  const width = labelWidth + 2 * CHIP_PADDING_X;
  return [CENTER_X - width / 2, CHIP_TOP, width, CHIP_HEIGHT];
}

/**
 * JPEG sub plafon: calitatea coboară în trepte de 5 până încape (de la 85).
 * Dacă nici la 60 nu încape, se OPREȘTE — o copertă scrisă peste plafonul Apple
 * ieșea altfel „cu succes" și cădea abia mai târziu, cu alt mesaj.
 */
export function encodeUnderBudget(canvas: Canvas): {
  jpeg: Buffer;
  quality: number;
} {
  let quality = 85;
  let jpeg = canvas.toBuffer("image/jpeg", quality);
  while (jpeg.length > COVER_MAX_BYTES && quality > 60) {
    quality -= 5;
    jpeg = canvas.toBuffer("image/jpeg", quality);
  }
  if (jpeg.length > COVER_MAX_BYTES) {
    throw new Error(
      `coperta nu încape sub plafon: ${Math.round(jpeg.length / 1024)} KB la calitatea ${quality}, plafonul e ${Math.round(COVER_MAX_BYTES / 1024)} KB`
    );
  }
  return { jpeg, quality };
}

async function main(): Promise<void> {
  for (const font of FONTS) GlobalFonts.registerFromPath(join(FONT_DIR, font.file), font.family);
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = PALETTE.voronet;
  ctx.fillRect(0, 0, SIZE, SIZE);
  circle(ctx, { center: [1500, 1110], radius: 960, fill: PALETTE.sky });
  circle(ctx, { center: [1500, 1110], radius: 880, fill: PALETTE.cream });
  circle(ctx, { center: [2330, 470], radius: 70, fill: PALETTE.yellow });
  circle(ctx, { center: [560, 1720], radius: 46, fill: PALETTE.pink });
  ctx.globalAlpha = 0.8;
  circle(ctx, { center: [2520, 1560], radius: 34, fill: PALETTE.cream });
  ctx.globalAlpha = 1;
  const mascot = await loadImage(Buffer.from(mascotSvg("salut", 0.5)));
  ctx.drawImage(mascot, 720, 330, 1560, 1560);
  ctx.textAlign = "center";
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '400px "Inter Bold"';
  ctx.fillText("Vorbăreții", CENTER_X, 2420);
  ctx.font = CHIP_FONT;
  chip(ctx, chipBox(ctx.measureText(CHIP_LABEL).width), PALETTE.yellow);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(CHIP_LABEL, CENTER_X, CHIP_BASELINE);
  const { jpeg, quality } = encodeUnderBudget(canvas);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, jpeg);
  console.log(`scris ${OUT} (${Math.round(jpeg.length / 1024)} KB, calitate ${quality})`);
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
