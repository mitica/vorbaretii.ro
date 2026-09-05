/**
 * Stratul mascotei (ADR-030): Gaița povestește în colțul rezervat — ipostaza
 * derivă determinist din timp (vorbește cât se rostește un cuvânt, tace în
 * pauze), din reacțiile pe taguri și din faza filmului (intro/outro = salut,
 * întrebarea = gândește). Rasterele ies o singură dată din `mascotSvg`
 * (ADR-017: sursa unică), pe faze, și se refolosesc la fiecare cadru.
 */

import { loadImage, type Image } from "@napi-rs/canvas";
import { POSES, mascotSvg, type Pose } from "../../app/components/mascot/mascot-svg";
import type { Reaction, TimelineSegment } from "../../app/articole/beat-timing";
import type { CanvasCtx, Rect } from "./background";
import { MASCOT, OUTRO, PALETTE, REACTION, SIGNATURE, VIDEO } from "./config";
import type { FilmPhase } from "./film";
export type MascotAt = { pose: Pose; phase: number };
export type MascotSprites = Map<string, Image>;

/** Cutia mascotei în cadru. */
export function mascotBox(): Rect {
  return {
    x: VIDEO.width - MASCOT.right - MASCOT.size,
    y: VIDEO.height - MASCOT.bottom - MASCOT.size,
    width: MASCOT.size,
    height: MASCOT.size,
  };
}

const cycle = (time: number, hz: number): number => (((time * hz) % 1) + 1) % 1;

/** Capătul ultimului cuvânt rostit până la `time` (sau -∞) și dacă un cuvânt se rostește chiar acum. */
function speech(time: number, timeline: TimelineSegment[]): { speaking: boolean; lastEnd: number } {
  let lastEnd = -Infinity;
  for (const segment of timeline) {
    if (segment.start > time) break;
    for (const word of segment.words) {
      if (word.start <= time && time < word.end) return { speaking: true, lastEnd: word.end };
      if (word.end <= time) lastEnd = Math.max(lastEnd, word.end);
    }
  }
  return { speaking: false, lastEnd };
}

/** Ipostaza momentului: intro/outro > reacție > vorbește > liniște (ADR-030). */
export type MascotScene = {
  timeline: TimelineSegment[];
  reactions: Reaction[];
  filmPhase: FilmPhase;
};

export function poseAt(time: number, scene: MascotScene): MascotAt {
  const { filmPhase, reactions, timeline } = scene;
  if (filmPhase === "intro" || filmPhase === "outro")
    return { pose: "salut", phase: cycle(time, 1) };
  if (filmPhase === "question") return { pose: "gandeste", phase: cycle(time, 1) };
  const reaction = reactions.find((r) => r.start <= time && time < r.end);
  if (reaction)
    return {
      pose: reaction.pose,
      phase: (time - reaction.start) / (reaction.end - reaction.start),
    };
  const { speaking, lastEnd } = speech(time, timeline);
  if (speaking || time - lastEnd < REACTION.pauseSeconds)
    return { pose: "vorbeste", phase: cycle(time, REACTION.talkHz) };
  return { pose: "liniste", phase: cycle(time, REACTION.idleHz) };
}

const key = (pose: Pose, index: number): string => `${pose}:${index}`;

/** Rasterele: fiecare ipostază la fiecare fază, din sursa unică, o singură dată. */
export async function loadMascotSprites(): Promise<MascotSprites> {
  const sprites: MascotSprites = new Map();
  for (const pose of POSES)
    for (let index = 0; index < REACTION.phases; index++) {
      const svg = mascotSvg(pose, index / REACTION.phases).replace(
        'viewBox="0 0 240 240"',
        `viewBox="0 0 240 240" width="${MASCOT.size}" height="${MASCOT.size}"`
      );
      sprites.set(key(pose, index), await loadImage(Buffer.from(svg)));
    }
  return sprites;
}

/** Semnătura de sub picioarele mascotei — în fiecare cadru, în locul tab-ului de final. */
function drawSignature(ctx: CanvasCtx, box: Rect): void {
  ctx.font = `${SIGNATURE.font}px Inter ExtraBold`;
  ctx.fillStyle = PALETTE.ink;
  const width = ctx.measureText(OUTRO.url).width;
  ctx.fillText(
    OUTRO.url,
    box.x + (box.width - width) / 2,
    box.y + box.height + SIGNATURE.gap + SIGNATURE.font
  );
}

export function drawMascot(ctx: CanvasCtx, sprites: MascotSprites, at: MascotAt): void {
  const index = Math.floor(at.phase * REACTION.phases) % REACTION.phases;
  const image = sprites.get(key(at.pose, index));
  if (!image) return;
  const box = mascotBox();
  ctx.drawImage(image, box.x, box.y, box.width, box.height);
  drawSignature(ctx, box);
}
