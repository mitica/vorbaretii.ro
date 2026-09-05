/**
 * Geometria bulei (ADR-030, amendamentul din 2026-09-05), pură: înălțimea după
 * rândurile ei și cutia DESENATĂ — cardul plus coada spre mascotă. Legea colțului
 * mascotei o compară cu asta.
 */

import type { Rect } from "./background";
import { BUBBLE, VIDEO } from "./config";

export function bubbleHeight(lines: number, font: number = BUBBLE.font): number {
  return 2 * BUBBLE.padY + lines * font * BUBBLE.lineHeight;
}

export function bubbleTop(lines: number, font: number = BUBBLE.font): number {
  return VIDEO.height - BUBBLE.bottom - bubbleHeight(lines, font);
}

/** Cutia bulei cu coadă, pentru `lines` rânduri. */
export function bubbleBox(lines: number): Rect {
  const height = bubbleHeight(lines);
  return {
    x: BUBBLE.rightEdge - BUBBLE.width,
    y: VIDEO.height - BUBBLE.bottom - height,
    width: BUBBLE.width + BUBBLE.tailOut,
    height,
  };
}
