/**
 * Stratul mascotei (ADR-030): Gaița povestește în colțul rezervat — ipostaza
 * derivă determinist din timp (vorbește cât se rostește un cuvânt, tace în
 * pauze), din reacțiile pe taguri și din faza filmului (intro/outro = salut,
 * întrebarea = gândește). Rasterele ies o singură dată din `mascotSvg`
 * (ADR-017: sursa unică), pe faze, și se refolosesc la fiecare cadru.
 *
 * Rostirea se INDEXEAZĂ o dată, nu se re-scanează la fiecare cadru (TASK-0096):
 * timeline-ul se aplatizează în cuvinte, cu capetele de dinaintea fiecăruia, iar
 * cadrul găsește cuvântul momentului prin căutare binară. Judecata rămâne
 * literal aceeași — aceleași scăderi, deci aceiași pixeli.
 */

import { loadImage, type Image } from "@napi-rs/canvas";
import { POSES, mascotSvg, type Pose } from "../../app/components/mascot/mascot-svg";
import {
  endsSentence,
  type Reaction,
  type TimedWord,
  type TimelineSegment,
} from "../../app/articole/beat-timing";
import type { CanvasCtx, Rect } from "./background";
import { MASCOT, OUTRO, REACTION, SIGNATURE, VIDEO } from "./config";
import { drawChip, measureChip, type Chip } from "./text-band";
import type { FilmPhase } from "./film";
export type MascotAt = { pose: Pose; phase: number };
type MascotSprites = Map<string, Image>;
/** Stratul pregătit o dată: rasterele ipostazelor și chip-ul semnăturii, măsurat. */
export type MascotLayer = { sprites: MascotSprites; signature: Chip };
/**
 * Rostirea indexată o dată: cuvintele filmului în ordine și, pe aceeași poziție,
 * capătul cuvântului dinainte și al ultimei propoziții încheiate înaintea lui.
 * Ambele liste au o intrare în plus, pentru timpul de după ultimul cuvânt.
 */
export type SpeechIndex = { words: TimedWord[]; lastEnds: number[]; sentenceEnds: number[] };

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

/** Indexarea rostirii: cuvintele filmului, cu capetele de dinaintea fiecăruia — o singură parcurgere. */
export function speechIndex(timeline: TimelineSegment[]): SpeechIndex {
  const words = timeline.flatMap((segment) => segment.words);
  const lastEnds: number[] = [];
  const sentenceEnds: number[] = [];
  let lastEnd = -Infinity;
  let sentenceEnd = -Infinity;
  for (const word of words) {
    lastEnds.push(lastEnd);
    sentenceEnds.push(sentenceEnd);
    lastEnd = word.end;
    if (endsSentence(word)) sentenceEnd = word.end;
  }
  lastEnds.push(lastEnd);
  sentenceEnds.push(sentenceEnd);
  return { words, lastEnds, sentenceEnds };
}

/** Ultimul cuvânt început până la `time` (−1 dacă niciunul) — căutare binară, timpii sunt monotoni. */
function wordAt(words: TimedWord[], time: number): number {
  let low = 0;
  let high = words.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (words[middle]!.start <= time) {
      found = middle;
      low = middle + 1;
    } else high = middle - 1;
  }
  return found;
}

/** Rostirea la `time`: un cuvânt chiar acum?, capătul ultimului cuvânt încheiat și al ultimei propoziții încheiate (−∞ dacă nu-s). */
type Speech = { speaking: boolean; lastEnd: number; sentenceEnd: number };

function speechAt(time: number, index: SpeechIndex): Speech {
  const at = wordAt(index.words, time);
  const speaking = at >= 0 && time < index.words[at]!.end;
  const slot = speaking ? at : at + 1;
  return { speaking, lastEnd: index.lastEnds[slot]!, sentenceEnd: index.sentenceEnds[slot]! };
}

/** Vorbește sau tace: la capăt de propoziție tace `sentencePauseSeconds` chiar dacă vocea a pornit; între cuvinte, vorbește doar sub `pauseSeconds`. */
function talkingAt(time: number, index: SpeechIndex): boolean {
  const { speaking, lastEnd, sentenceEnd } = speechAt(time, index);
  if (time - sentenceEnd < REACTION.sentencePauseSeconds) return false;
  return speaking || time - lastEnd < REACTION.pauseSeconds;
}

/** Ipostaza momentului: intro/outro > reacție > vorbește > liniște (ADR-030). */
export type MascotScene = {
  speech: SpeechIndex;
  reactions: Reaction[];
  filmPhase: FilmPhase;
};

export function poseAt(time: number, scene: MascotScene): MascotAt {
  const { filmPhase, reactions, speech } = scene;
  if (filmPhase === "intro" || filmPhase === "outro")
    return { pose: "salut", phase: cycle(time, 1) };
  if (filmPhase === "question") return { pose: "gandeste", phase: cycle(time, 1) };
  const reaction = reactions.find((r) => r.start <= time && time < r.end);
  if (reaction)
    return {
      pose: reaction.pose,
      phase: (time - reaction.start) / (reaction.end - reaction.start),
    };
  if (talkingAt(time, speech)) return { pose: "vorbeste", phase: cycle(time, REACTION.talkHz) };
  return { pose: "liniste", phase: cycle(time, REACTION.idleHz) };
}

const key = (pose: Pose, index: number): string => `${pose}:${index}`;

/** Faza cu care se rasterizează treapta `index`: MIJLOCUL ei — la începutul treptei clipirea sursei (o fereastră îngustă de fază) s-ar pierde; legea o ține. */
export const spritePhase = (index: number): number => (index + 0.5) / REACTION.phases;

/** Rasterele: fiecare ipostază la fiecare fază, din sursa unică, o singură dată — faza eșantionată la mijlocul treptei ei. */
async function loadMascotSprites(): Promise<MascotSprites> {
  const sprites: MascotSprites = new Map();
  for (const pose of POSES)
    for (let index = 0; index < REACTION.phases; index++) {
      const svg = mascotSvg(pose, spritePhase(index)).replace(
        'viewBox="0 0 240 240"',
        `viewBox="0 0 240 240" width="${MASCOT.size}" height="${MASCOT.size}"`
      );
      sprites.set(key(pose, index), await loadImage(Buffer.from(svg)));
    }
  return sprites;
}

/** Stratul gata de cadre: rasterele și semnătura măsurată — o singură dată per film. */
export async function loadMascotLayer(ctx: CanvasCtx): Promise<MascotLayer> {
  return {
    sprites: await loadMascotSprites(),
    signature: measureChip(ctx, OUTRO.url, SIGNATURE.font),
  };
}

/** Semnătura de sub picioarele mascotei — chip galben, în fiecare cadru, citibil pe orice fundal. */
function drawSignature(ctx: CanvasCtx, signature: Chip, box: Rect): void {
  drawChip(ctx, signature, {
    x: box.x + (box.width - signature.width) / 2,
    y: box.y + box.height + SIGNATURE.gap,
  });
}

export function drawMascot(ctx: CanvasCtx, layer: MascotLayer, at: MascotAt): void {
  const index = Math.floor(at.phase * REACTION.phases) % REACTION.phases;
  const image = layer.sprites.get(key(at.pose, index));
  if (!image) return;
  const box = mascotBox();
  ctx.drawImage(image, box.x, box.y, box.width, box.height);
  drawSignature(ctx, layer.signature, box);
}
