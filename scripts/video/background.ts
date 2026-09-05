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

/** Calea masterului 2k al unei ancore — o casă, folosită și de garda de existență a CLI-ului. */
export function masterImagePath(slug: string, anchor: string): string {
  return join(MASTERS_DIR, `articol-${slug}-${anchor}.jpg`);
}

export async function loadAnchorImage(slug: string, anchor: string): Promise<Image> {
  return loadImage(masterImagePath(slug, anchor));
}

/**
 * Zoom/pan-ul segmentului: direcțiile alternează determinist pe paritatea
 * indexului — zoom-ul și pan-ul deopotrivă — ca să țină legea continuității:
 * capătul unui cadru (progress 1) = începutul următorului (progress 0), la orice
 * index; altfel un cadru care își păstrează ancora (segmentul „sectiune" → primul
 * beat) ar sări cu tot pan-ul pe o imagine neschimbată, fără crossfade care să-l
 * ascundă (TASK-0078).
 */
function kenBurnsAt(segmentIndex: number, progress: number) {
  const forward = segmentIndex % 2 === 0;
  const from = forward ? KEN_BURNS.zoomFrom : KEN_BURNS.zoomTo;
  const to = forward ? KEN_BURNS.zoomTo : KEN_BURNS.zoomFrom;
  const zoom = from + (to - from) * progress;
  const panDirection = forward ? 1 : -1;
  const pan = (progress - 0.5) * KEN_BURNS.panFraction * panDirection;
  return { zoom, pan };
}

export type BackgroundShot = { image: Image; segmentIndex: number; progress: number };
export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Geometria pură a cadrului: unde aterizează imaginea la momentul dat.
 * Legea acoperirii o ține testată: dreptunghiul acoperă TOT cadrul la orice
 * (index, progress) — zoomFrom poartă marja pan-ului (config).
 */
export function backgroundRect(
  size: { width: number; height: number },
  segmentIndex: number,
  progress: number
): Rect {
  const { zoom, pan } = kenBurnsAt(segmentIndex, progress);
  const cover = Math.max(VIDEO.width / size.width, VIDEO.height / size.height);
  const scale = cover * zoom;
  const width = size.width * scale;
  const height = size.height * scale;
  return {
    x: (VIDEO.width - width) / 2 + pan * VIDEO.width,
    y: (VIDEO.height - height) / 2,
    width,
    height,
  };
}

/** Desenează imaginea cover-fit cu transformarea Ken Burns a momentului. */
export function drawBackground(ctx: CanvasCtx, shot: BackgroundShot): void {
  const rect = backgroundRect(shot.image, shot.segmentIndex, shot.progress);
  ctx.drawImage(shot.image, rect.x, rect.y, rect.width, rect.height);
}
