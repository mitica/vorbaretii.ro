/**
 * Banda de lectură (ADR-015): textul beat-ului curge în FERESTRE de cel mult
 * două rânduri, pe ritmul vocii — niciodată un zid de text peste ilustrație.
 * Panglică grafică de poveste: crem cu liseré auriu și cozi de rândunică
 * cărămizii, lățime fixă jos-centrată; cuvintele se aprind CALM din
 * gri-albastru (nerostit) în albastru adânc (rostit) — fără nicio evidențiere
 * a cuvântului curent. Totul determinist din timp — aceleași intrări, același
 * film.
 */

import type { TimedWord } from "../../app/articole/beat-timing";
import { BAND, OUTRO, PALETTE, VIDEO } from "./config";
import type { CanvasCtx } from "./background";

/** Măsurătorul de text e injectabil — legea se testează fără canvas. */
export type Measure = (text: string) => number;
export type Line = { words: TimedWord[]; width: number };
export type TextWindow = { lines: Line[]; start: number };

type TagSize = { font: number; padX: number; height: number };
type Box = { x: number; y: number; width: number; height: number };

function bandFont(): string {
  return `${BAND.font}px Inter Bold`;
}

function ctxMeasure(ctx: CanvasCtx): Measure {
  return (text) => ctx.measureText(text).width;
}

/** Spațiul dintre cuvinte, ușor aerisit — lectura cere cuvinte bine separate. */
function wordSpace(measure: Measure): number {
  return measure(" ") * BAND.spaceFactor;
}

/** Rupe cuvintele în rânduri după lățimea măsurată. */
export function wrapLines(measure: Measure, words: TimedWord[], maxWidth: number): Line[] {
  const space = wordSpace(measure);
  const lines: Line[] = [];
  let current: Line = { words: [], width: 0 };
  for (const word of words) {
    const width = measure(word.text);
    const next = current.width === 0 ? width : current.width + space + width;
    if (next > maxWidth && current.words.length > 0) {
      lines.push(current);
      current = { words: [word], width };
    } else {
      current = { words: [...current.words, word], width: next };
    }
  }
  if (current.words.length > 0) lines.push(current);
  return lines;
}

/** Grupează rândurile în ferestre de câte `maxLines`; fereastra începe cu primul ei cuvânt. */
export function windowsFor(lines: Line[]): TextWindow[] {
  const windows: TextWindow[] = [];
  for (let i = 0; i < lines.length; i += BAND.maxLines) {
    const group = lines.slice(i, i + BAND.maxLines);
    windows.push({ lines: group, start: group[0]!.words[0]!.start });
  }
  return windows;
}

function windowAt(windows: TextWindow[], time: number): number {
  let index = 0;
  for (let i = 0; i < windows.length; i++) if (windows[i]!.start <= time) index = i;
  return index;
}

/** Cuvintele se aprind calm pe măsură ce vocea le atinge. */
function wordColor(word: TimedWord, time: number): string {
  return time >= word.start ? PALETTE.spoken : PALETTE.unspoken;
}

function drawWindowLines(
  ctx: CanvasCtx,
  window: TextWindow,
  at: { top: number; time: number }
): void {
  const space = wordSpace(ctxMeasure(ctx));
  const lineHeight = BAND.font * BAND.lineHeight;
  const offset = window.lines.length === 1 ? lineHeight / 2 : 0;
  window.lines.forEach((line, index) => {
    let x = (VIDEO.width - line.width) / 2;
    const y = at.top + offset + index * lineHeight + BAND.font;
    for (const word of line.words) {
      ctx.fillStyle = wordColor(word, at.time);
      ctx.fillText(word.text, x, y);
      x += ctx.measureText(word.text).width + space;
    }
  });
}

/** Coada de rândunică a panglicii: dreptunghi cu crestătură pe muchia din afară. */
function drawTail(ctx: CanvasCtx, box: Box, side: 1 | -1): void {
  const edge = side === 1 ? box.x + box.width : box.x;
  const out = edge + side * BAND.tailOut;
  const top = box.y + BAND.tailInsetY;
  const bottom = box.y + box.height - BAND.tailInsetY;
  ctx.fillStyle = PALETTE.accent;
  ctx.beginPath();
  ctx.moveTo(edge - side * BAND.tailStub, top);
  ctx.lineTo(out, top);
  ctx.lineTo(out - side * BAND.tailNotch, (top + bottom) / 2);
  ctx.lineTo(out, bottom);
  ctx.lineTo(edge - side * BAND.tailStub, bottom);
  ctx.closePath();
  ctx.fill();
}

/** Panglica: cozile cărămizii în spate, banda crem cu liseré auriu deasupra. */
function drawRibbon(ctx: CanvasCtx, box: Box): void {
  drawTail(ctx, box, -1);
  drawTail(ctx, box, 1);
  ctx.save();
  ctx.shadowColor = PALETTE.shadow;
  ctx.shadowBlur = BAND.shadowBlur;
  ctx.shadowOffsetY = BAND.shadowOffsetY;
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.width, box.height, BAND.radius);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = BAND.pinstripeWidth;
  ctx.beginPath();
  ctx.roundRect(
    box.x + BAND.pinstripeInset,
    box.y + BAND.pinstripeInset,
    box.width - 2 * BAND.pinstripeInset,
    box.height - 2 * BAND.pinstripeInset,
    BAND.radius - BAND.pinstripeInset / 2
  );
  ctx.stroke();
}

/** Tab-ul auriu lipit deasupra unei panglici: secțiunea la beat-uri, semnătura la final. */
function drawTag(ctx: CanvasCtx, text: string, size: TagSize & { bandY: number }): void {
  ctx.font = `${size.font}px Inter ExtraBold`;
  const width = ctx.measureText(text).width + 2 * size.padX;
  const x = (VIDEO.width - width) / 2;
  const y = size.bandY - size.height;
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.roundRect(x, y, width, size.height + BAND.radius, [BAND.tagCorner, BAND.tagCorner, 0, 0]);
  ctx.fill();
  ctx.fillStyle = PALETTE.deepBlue;
  ctx.fillText(
    text,
    x + size.padX,
    y + size.font + (size.height - size.font) / 2 - BAND.tagBaselineTweak
  );
}

function drawSectionTag(ctx: CanvasCtx, text: string, bandY: number): void {
  drawTag(ctx, text, { bandY, font: BAND.tagFont, padX: BAND.tagPadX, height: BAND.tagHeight });
}

function bandHeight(): number {
  return 2 * BAND.padY + BAND.maxLines * BAND.font * BAND.lineHeight;
}

/** Panglica beat-ului: fereastra momentului, cu fade-in la fiecare schimbare. */
export function drawBeatBand(
  ctx: CanvasCtx,
  words: TimedWord[],
  at: { time: number; tag?: string }
): void {
  ctx.font = bandFont();
  const windows = windowsFor(wrapLines(ctxMeasure(ctx), words, BAND.width - 2 * BAND.padX));
  const index = windowAt(windows, at.time);
  const window = windows[index]!;

  const height = bandHeight();
  const x = (VIDEO.width - BAND.width) / 2;
  const y = VIDEO.height - BAND.bottom - height;

  if (at.tag) drawSectionTag(ctx, at.tag.toUpperCase(), y);
  drawRibbon(ctx, { x, y, width: BAND.width, height });

  const fade = index === 0 ? 1 : Math.min(1, (at.time - window.start) / BAND.fadeSeconds);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.font = bandFont();
  drawWindowLines(ctx, window, { top: y + BAND.padY + (1 - fade) * BAND.slideIn, time: at.time });
  ctx.restore();
}

/**
 * Închiderea poveștii: panglica spune „Sfârșit" peste imaginea eroului, cu
 * semnătura pe tab-ul auriu mărit — aceeași familie grafică cu banda de
 * lectură. `alpha` o aduce cu fade-ul dintre imagini.
 */
export function drawEndingRibbon(ctx: CanvasCtx, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.font = `${OUTRO.wordFont}px Inter ExtraBold`;
  const wordWidth = ctx.measureText(OUTRO.word).width;
  const height = OUTRO.wordFont + 2 * OUTRO.padY;
  const width = Math.max(OUTRO.minWidth, wordWidth + 2 * OUTRO.padX);
  const x = (VIDEO.width - width) / 2;
  const y = VIDEO.height - BAND.bottom - height;

  drawTag(ctx, OUTRO.url, {
    bandY: y,
    font: OUTRO.tagFont,
    padX: OUTRO.tagPadX,
    height: OUTRO.tagHeight,
  });
  drawRibbon(ctx, { x, y, width, height });
  ctx.font = `${OUTRO.wordFont}px Inter ExtraBold`;
  ctx.fillStyle = PALETTE.deepBlue;
  ctx.fillText(
    OUTRO.word,
    (VIDEO.width - wordWidth) / 2,
    y + height / 2 + OUTRO.wordFont * OUTRO.baselineFactor
  );

  ctx.restore();
}
