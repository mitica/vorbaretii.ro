/**
 * Banda de lectură (ADR-015): textul beat-ului curge în FERESTRE de cel mult
 * două rânduri, pe ritmul vocii — niciodată un zid de text peste ilustrație.
 * Banda e opacă, crem, îmbracă exact rândurile momentului; tab-ul auriu de
 * deasupra spune secțiunea. Karaoke pe cuvinte: albastru adânc = rostit,
 * gri-albastru = urmează, cărămiziu cu un mic „pop" = cuvântul de ACUM.
 * Totul determinist din timp — aceleași intrări, același film.
 */

import type { TimedWord } from "../../app/articole/beat-timing";
import { BAND, OUTRO, PALETTE, TITLE_PLAQUE, VIDEO } from "./config";
import type { CanvasCtx } from "./background";

type Line = { words: TimedWord[]; width: number };
type TextWindow = { lines: Line[]; start: number };

function bandFont(): string {
  return `${BAND.font}px Inter Bold`;
}

/** Spațiul dintre cuvinte, ușor aerisit — karaoke-ul cere cuvinte bine separate. */
function wordSpace(ctx: CanvasCtx): number {
  return ctx.measureText(" ").width * BAND.spaceFactor;
}

/** Rupe cuvintele în rânduri după lățimea reală măsurată cu fontul curent. */
function wrapLines(ctx: CanvasCtx, words: TimedWord[], maxWidth: number): Line[] {
  const space = wordSpace(ctx);
  const lines: Line[] = [];
  let current: Line = { words: [], width: 0 };
  for (const word of words) {
    const width = ctx.measureText(word.text).width;
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
function windowsFor(lines: Line[]): TextWindow[] {
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

/** Cuvintele se aprind calm din gri-albastru în albastru pe măsură ce vocea le atinge. */
function wordColor(word: TimedWord, time: number): string {
  return time >= word.start ? PALETTE.spoken : PALETTE.unspoken;
}

function drawWindowLines(ctx: CanvasCtx, lines: Line[], top: number, time: number): void {
  const space = wordSpace(ctx);
  const lineHeight = BAND.font * BAND.lineHeight;
  const offset = lines.length === 1 ? lineHeight / 2 : 0;
  lines.forEach((line, index) => {
    let x = (VIDEO.width - line.width) / 2;
    const y = top + offset + index * lineHeight + BAND.font;
    for (const word of line.words) {
      ctx.fillStyle = wordColor(word, time);
      ctx.fillText(word.text, x, y);
      x += ctx.measureText(word.text).width + space;
    }
  });
}

/** Coada de rândunică a panglicii: dreptunghi cu crestătură triunghiulară pe muchia din afară. */
function drawTail(ctx: CanvasCtx, bandX: number, bandWidth: number, y: number, side: 1 | -1): void {
  const edge = side === 1 ? bandX + bandWidth : bandX;
  const out = edge + side * BAND.tailOut;
  const top = y + BAND.tailInsetY;
  const bottom = y + bandHeight() - BAND.tailInsetY;
  ctx.fillStyle = PALETTE.accent;
  ctx.beginPath();
  ctx.moveTo(edge - side * 8, top);
  ctx.lineTo(out, top);
  ctx.lineTo(out - side * BAND.tailNotch, (top + bottom) / 2);
  ctx.lineTo(out, bottom);
  ctx.lineTo(edge - side * 8, bottom);
  ctx.closePath();
  ctx.fill();
}

function bandHeight(): number {
  return 2 * BAND.padY + BAND.maxLines * BAND.font * BAND.lineHeight;
}

/** Panglica: cozile cărămizii în spate, banda crem cu liseré auriu deasupra. */
function drawRibbon(ctx: CanvasCtx, x: number, y: number, width: number, height: number): void {
  drawTail(ctx, x, width, y, -1);
  drawTail(ctx, x, width, y, 1);
  ctx.save();
  ctx.shadowColor = PALETTE.shadow;
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, BAND.radius);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(
    x + BAND.pinstripeInset,
    y + BAND.pinstripeInset,
    width - 2 * BAND.pinstripeInset,
    height - 2 * BAND.pinstripeInset,
    BAND.radius - BAND.pinstripeInset / 2
  );
  ctx.stroke();
}

function drawSectionTag(ctx: CanvasCtx, label: string, bandY: number): void {
  ctx.font = `${BAND.tagFont}px Inter ExtraBold`;
  const text = label.toUpperCase();
  const width = ctx.measureText(text).width + 2 * BAND.tagPadX;
  const x = (VIDEO.width - width) / 2;
  const y = bandY - BAND.tagHeight;
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.roundRect(x, y, width, BAND.tagHeight + BAND.radius, [14, 14, 0, 0]);
  ctx.fill();
  ctx.fillStyle = PALETTE.deepBlue;
  ctx.fillText(text, x + BAND.tagPadX, y + BAND.tagFont + (BAND.tagHeight - BAND.tagFont) / 2 - 4);
}

/** Panglica beat-ului: fereastra momentului, cu fade-in la fiecare schimbare. */
export function drawBeatBand(ctx: CanvasCtx, words: TimedWord[], time: number, tag?: string): void {
  ctx.font = bandFont();
  const windows = windowsFor(wrapLines(ctx, words, BAND.width - 2 * BAND.padX));
  const index = windowAt(windows, time);
  const window = windows[index]!;

  const height = bandHeight();
  const width = BAND.width;
  const x = (VIDEO.width - width) / 2;
  const y = VIDEO.height - BAND.bottom - height;

  if (tag) drawSectionTag(ctx, tag, y);
  drawRibbon(ctx, x, y, width, height);

  const fade = index === 0 ? 1 : Math.min(1, (time - window.start) / BAND.fadeSeconds);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.font = bandFont();
  drawWindowLines(ctx, window.lines, y + BAND.padY + (1 - fade) * 14, time);
  ctx.restore();
}

/** Plăcuța titlului: coperta filmului — jos-centrată, ca să nu acopere eroul. */
export function drawTitlePlaque(ctx: CanvasCtx, words: TimedWord[]): void {
  ctx.font = `${TITLE_PLAQUE.font}px Inter ExtraBold`;
  const lines = wrapLines(ctx, words, TITLE_PLAQUE.maxWidth - 2 * TITLE_PLAQUE.padX);
  const space = wordSpace(ctx);
  const lineHeight = TITLE_PLAQUE.font * 1.22;
  const height = 2 * TITLE_PLAQUE.padY + lines.length * lineHeight;
  const widest = Math.max(...lines.map((line) => line.width));
  const width = widest + 2 * TITLE_PLAQUE.padX;
  const x = (VIDEO.width - width) / 2;
  const y = VIDEO.height - TITLE_PLAQUE.bottom - height;

  ctx.save();
  ctx.shadowColor = PALETTE.shadow;
  ctx.shadowBlur = 44;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, TITLE_PLAQUE.radius);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(
    x + TITLE_PLAQUE.inset,
    y + TITLE_PLAQUE.inset,
    width - 2 * TITLE_PLAQUE.inset,
    height - 2 * TITLE_PLAQUE.inset,
    TITLE_PLAQUE.radius - TITLE_PLAQUE.inset
  );
  ctx.stroke();

  ctx.font = `${TITLE_PLAQUE.font}px Inter ExtraBold`;
  ctx.fillStyle = PALETTE.deepBlue;
  lines.forEach((line, lineIndex) => {
    let wx = (VIDEO.width - line.width) / 2;
    const wy = y + TITLE_PLAQUE.padY + lineIndex * lineHeight + TITLE_PLAQUE.font * 0.82;
    for (const word of line.words) {
      ctx.fillText(word.text, wx, wy);
      wx += ctx.measureText(word.text).width + space;
    }
  });
}

/** Finalul: întrebările articolului + adresa — invitația de după film. */
export function drawOutroCard(ctx: CanvasCtx, questions: string[], url: string): void {
  ctx.fillStyle = PALETTE.deepBlue;
  ctx.fillRect(0, 0, VIDEO.width, VIDEO.height);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(
    OUTRO.frameInset,
    OUTRO.frameInset,
    VIDEO.width - 2 * OUTRO.frameInset,
    VIDEO.height - 2 * OUTRO.frameInset,
    32
  );
  ctx.stroke();

  ctx.font = `${OUTRO.questionFont}px Inter Bold`;
  const lineHeight = OUTRO.questionFont * 1.7;
  const texts = questions.map((question) => `•  ${question}`);
  const blockLeft = (VIDEO.width - Math.max(...texts.map((t) => ctx.measureText(t).width))) / 2;
  const startY = (VIDEO.height - texts.length * lineHeight) / 2 - 40;
  ctx.fillStyle = PALETTE.cream;
  texts.forEach((text, index) => ctx.fillText(text, blockLeft, startY + index * lineHeight));
  ctx.font = `${OUTRO.urlFont}px Inter ExtraBold`;
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(url, (VIDEO.width - ctx.measureText(url).width) / 2, VIDEO.height - 140);
}
