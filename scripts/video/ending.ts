/**
 * Închiderea filmului (ADR-030): după ultimul beat, crossfade pe erou cu ultima
 * întrebare a articolului în bulă (QUESTION.seconds), apoi cardul „Sfârșit" —
 * aceeași familie grafică; semnătura stă sub mascotă, în fiecare cadru. Timpii sunt secunde de la sfârșitul
 * integralei (întrebarea) sau de la începutul outro-ului.
 */

import type { Image } from "@napi-rs/canvas";
import { drawBackground, type CanvasCtx } from "./background";
import { OUTRO, QUESTION, TRANSITION } from "./config";
import { drawEndingCard, drawPanel } from "./text-band";

export type EndingScene = {
  ctx: CanvasCtx;
  images: Map<string, Image>;
  lastAnchor: string;
  shotCount: number;
};

const fadeAt = (since: number): number => Math.min(1, since / TRANSITION.seconds);

/** Fundalul închiderii: crossfade din ultimul cadru pe erou, apoi eroul cu mișcare lentă. */
function drawHero(scene: EndingScene, since: number): void {
  const { ctx, images } = scene;
  const hero = images.get("erou")!;
  const fade = fadeAt(since);
  const progress = Math.min(1, since / (QUESTION.seconds + OUTRO.seconds));
  if (scene.lastAnchor !== "erou" && fade < 1) {
    drawBackground(ctx, {
      image: images.get(scene.lastAnchor)!,
      segmentIndex: scene.shotCount - 1,
      progress: 1,
    });
    ctx.save();
    ctx.globalAlpha = fade;
    drawBackground(ctx, { image: hero, segmentIndex: scene.shotCount, progress });
    ctx.restore();
  } else {
    drawBackground(ctx, { image: hero, segmentIndex: scene.shotCount, progress });
  }
}

/** Ultima întrebare: eroul + panoul static, `since` = de la sfârșitul integralei. */
export function drawQuestion(scene: EndingScene, question: string, since: number): void {
  drawHero(scene, since);
  drawPanel(scene.ctx, question, fadeAt(since));
}

/** „Sfârșit" + semnătura, `since` = de la începutul outro-ului. */
export function drawEnding(scene: EndingScene, since: number): void {
  drawHero(scene, since + QUESTION.seconds);
  drawEndingCard(scene.ctx, fadeAt(since));
}
