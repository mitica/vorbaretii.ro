/**
 * Geometria panglicii (ADR-030), pură: înălțimea benzii după rândurile ei și
 * cutia DESENATĂ — dreptunghiul crem plus cozile de rândunică, care ies cu
 * `BAND.tailOut` de fiecare parte. Legea colțului mascotei o compară cu asta,
 * nu cu dreptunghiul gol.
 */

import type { Rect } from "./background";
import { BAND, VIDEO } from "./config";

export function bandHeight(lines: number, font: number = BAND.font): number {
  return 2 * BAND.padY + lines * font * BAND.lineHeight;
}

export function bandTop(lines: number, font: number = BAND.font): number {
  return VIDEO.height - BAND.bottom - bandHeight(lines, font);
}

/** Cutia panglicii cu cozi, pentru o bandă de `lines` rânduri. */
export function ribbonBox(lines: number): Rect {
  const height = bandHeight(lines);
  return {
    x: (VIDEO.width - BAND.width) / 2 - BAND.tailOut,
    y: VIDEO.height - BAND.bottom - height,
    width: BAND.width + 2 * BAND.tailOut,
    height,
  };
}
