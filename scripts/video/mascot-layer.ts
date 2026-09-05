/**
 * Stratul mascotei (ADR-030): Gaița povestește în colțul rezervat — ipostaza
 * derivă determinist din timp (vorbește cât se rostește un cuvânt, tace în
 * pauze), din reacțiile pe taguri și din faza filmului (intro/outro = salut,
 * întrebarea = gândește). Rasterele ies o singură dată din `mascotSvg`
 * (ADR-017: sursa unică), pe faze, și se refolosesc la fiecare cadru.
 */

import { loadImage, type Image } from "@napi-rs/canvas";
import { POSES, mascotSvg, type Pose } from "../../app/components/mascot/mascot-svg";
import { endsSentence, type Reaction, type TimelineSegment } from "../../app/articole/beat-timing";
import type { CanvasCtx, Rect } from "./background";
import { MASCOT, OUTRO, REACTION, SIGNATURE, VIDEO } from "./config";
import { chipWidth, drawChip } from "./text-band";
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

/** Rostirea la `time`: un cuvânt chiar acum?, capătul ultimului cuvânt încheiat și al ultimei propoziții încheiate (−∞ dacă nu-s). */
type Speech = { speaking: boolean; lastEnd: number; sentenceEnd: number };

function speech(time: number, timeline: TimelineSegment[]): Speech {
  let lastEnd = -Infinity;
  let sentenceEnd = -Infinity;
  for (const segment of timeline) {
    if (segment.start > time) break;
    for (const word of segment.words) {
      if (word.start > time) break;
      if (time < word.end) return { speaking: true, lastEnd, sentenceEnd };
      lastEnd = word.end;
      if (endsSentence(word)) sentenceEnd = word.end;
    }
  }
  return { speaking: false, lastEnd, sentenceEnd };
}

/** Vorbește sau tace: la capăt de propoziție tace `sentencePauseSeconds` chiar dacă vocea a pornit; între cuvinte, vorbește doar sub `pauseSeconds`. */
function talkingAt(time: number, timeline: TimelineSegment[]): boolean {
  const { speaking, lastEnd, sentenceEnd } = speech(time, timeline);
  if (time - sentenceEnd < REACTION.sentencePauseSeconds) return false;
  return speaking || time - lastEnd < REACTION.pauseSeconds;
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
  if (talkingAt(time, timeline)) return { pose: "vorbeste", phase: cycle(time, REACTION.talkHz) };
  return { pose: "liniste", phase: cycle(time, REACTION.idleHz) };
}

const key = (pose: Pose, index: number): string => `${pose}:${index}`;

/** Rasterele: fiecare ipostază la fiecare fază, din sursa unică, o singură dată — faza eșantionată la mijlocul treptei ei. */
export async function loadMascotSprites(): Promise<MascotSprites> {
  const sprites: MascotSprites = new Map();
  for (const pose of POSES)
    for (let index = 0; index < REACTION.phases; index++) {
      const svg = mascotSvg(pose, (index + 0.5) / REACTION.phases).replace(
        'viewBox="0 0 240 240"',
        `viewBox="0 0 240 240" width="${MASCOT.size}" height="${MASCOT.size}"`
      );
      sprites.set(key(pose, index), await loadImage(Buffer.from(svg)));
    }
  return sprites;
}

/** Semnătura de sub picioarele mascotei — chip galben, în fiecare cadru, citibil pe orice fundal. */
function drawSignature(ctx: CanvasCtx, box: Rect): void {
  const width = chipWidth(ctx, OUTRO.url, SIGNATURE.font);
  drawChip(ctx, OUTRO.url, {
    x: box.x + (box.width - width) / 2,
    y: box.y + box.height + SIGNATURE.gap,
    size: SIGNATURE.font,
  });
}

export function drawMascot(ctx: CanvasCtx, sprites: MascotSprites, at: MascotAt): void {
  const index = Math.floor(at.phase * REACTION.phases) % REACTION.phases;
  const image = sprites.get(key(at.pose, index));
  if (!image) return;
  const box = mascotBox();
  ctx.drawImage(image, box.x, box.y, box.width, box.height);
  drawSignature(ctx, box);
}
