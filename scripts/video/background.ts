/**
 * Stratul de fundal (ADR-015): masterul 2k al beat-ului umple cadrul cu
 * mișcare lentă Ken Burns — zoom și pan DETERMINISTE din indexul segmentului
 * (aceleași intrări = același film). Fără imagine proprie, beat-ul rămâne pe
 * imaginea dinainte; primul cadru și titlul stau pe erou.
 */

import { loadImage, type Image, type SKRSContext2D } from "@napi-rs/canvas";
import { join } from "path";
import { KEN_BURNS, VIDEO } from "./config";

export type CanvasCtx = SKRSContext2D;

const MASTERS_DIR = join(__dirname, "../../assets/images");

export async function loadAnchorImage(slug: string, anchor: string): Promise<Image> {
  return loadImage(join(MASTERS_DIR, `articol-${slug}-${anchor}.jpg`));
}

/** Zoom/pan-ul segmentului: direcțiile alternează determinist după index. */
function kenBurnsAt(segmentIndex: number, progress: number) {
  const zoomIn = segmentIndex % 2 === 0;
  const from = zoomIn ? KEN_BURNS.zoomFrom : KEN_BURNS.zoomTo;
  const to = zoomIn ? KEN_BURNS.zoomTo : KEN_BURNS.zoomFrom;
  const zoom = from + (to - from) * progress;
  const panDirection = segmentIndex % 4 < 2 ? 1 : -1;
  const pan = (progress - 0.5) * KEN_BURNS.panFraction * panDirection;
  return { zoom, pan };
}

/** Desenează imaginea cover-fit cu transformarea Ken Burns a momentului. */
export function drawBackground(
  ctx: CanvasCtx,
  image: Image,
  segmentIndex: number,
  progress: number
): void {
  const { zoom, pan } = kenBurnsAt(segmentIndex, progress);
  const cover = Math.max(VIDEO.width / image.width, VIDEO.height / image.height);
  const scale = cover * zoom;
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const x = (VIDEO.width - drawWidth) / 2 + pan * VIDEO.width;
  const y = (VIDEO.height - drawHeight) / 2;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}
