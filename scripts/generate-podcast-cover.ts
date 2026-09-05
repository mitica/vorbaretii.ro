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
import { FONTS, FONT_DIR } from "./video/config";

const SIZE = 3000;
const OUT = join(__dirname, "../public/assets/podcast/cover-3000.jpg");
const MAX_BYTES = 512 * 1024;
const PALETTE = {
  voronet: "#3E4394",
  sky: "#81C5F4",
  cream: "#FBF3E4",
  yellow: "#FFC526",
  pink: "#FF66A6",
  ink: "#2B2A33",
} as const;

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

/** JPEG sub plafon: calitatea coboară în trepte de 5 până încape (de la 85). */
function encodeUnderBudget(canvas: Canvas): {
  jpeg: Buffer;
  quality: number;
} {
  let quality = 85;
  let jpeg = canvas.toBuffer("image/jpeg", quality);
  while (jpeg.length > MAX_BYTES && quality > 60) {
    quality -= 5;
    jpeg = canvas.toBuffer("image/jpeg", quality);
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
  ctx.fillText("Vorbăreții", 1500, 2420);
  chip(ctx, [855, 2530, 1290, 230], PALETTE.yellow);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '140px "Inter Bold"';
  ctx.fillText("Gaița povestește", 1500, 2690);
  const { jpeg, quality } = encodeUnderBudget(canvas);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, jpeg);
  console.log(`scris ${OUT} (${Math.round(jpeg.length / 1024)} KB, calitate ${quality})`);
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
