/**
 * Bula gaiței (ADR-030, amendamentul din 2026-09-05): textul beat-ului curge în
 * FERESTRE pe limitele benzii de vârstă, într-un card alb translucid cu coada
 * spre mascotă — cine povestește se vede. Cuvintele se colorează CALM din gri
 * cald în cerneală pe măsură ce vocea le atinge, fără niciun efect pe cuvântul
 * curent. Chip-ul galben poartă numele secțiunii. Totul determinist din timp.
 *
 * Măsurarea textului stă în afara buclei de cadre (TASK-0096): ferestrele,
 * panourile și chip-urile se măsoară O DATĂ (`measure*`), iar desenul doar
 * așază lățimile deja știute — niciun `measureText` per cadru.
 */

import type { TimedWord } from "../../app/articole/beat-timing";
import type { CanvasCtx } from "./background";
import { bubbleHeight, bubbleTop } from "./bubble-box";
import { BUBBLE, CHIP, OUTRO, PALETTE, PANEL, VIDEO, type WindowLimits } from "./config";

/** Măsurătorul de text e injectabil — legea se testează fără canvas. */
export type Measure = (text: string) => number;
/** Un rând măsurat: cuvintele lui, lățimea fiecăruia și lățimea rândului. */
type Line = { words: TimedWord[]; widths: number[]; width: number };
/** O fereastră măsurată: rândurile, spațiul dintre cuvinte și momentul de la care se vede. */
export type TextWindow = { lines: Line[]; space: number; start: number };
type Box = { x: number; y: number; width: number; height: number };
/** Un chip măsurat: textul afișat, lățimea lui și fontul la care s-a măsurat. */
export type Chip = { text: string; width: number; size: number };
/** Cardul de închidere, măsurat: lățimea cuvântului și chip-ul semnăturii. */
export type EndingCard = { wordWidth: number; url: Chip };

const font = (size: number): string => `${size}px Inter ExtraBold`;
const TEXT_WIDTH = BUBBLE.width - 2 * BUBBLE.padX;

function ctxMeasure(ctx: CanvasCtx): Measure {
  return (text) => ctx.measureText(text).width;
}

/** Spațiul dintre cuvinte, ușor aerisit — lectura cere cuvinte bine separate. */
function wordSpace(measure: Measure): number {
  return measure(" ") * BUBBLE.spaceFactor;
}

/** Rupe cuvintele în rânduri după lățimea măsurată. */
function wrapLines(measure: Measure, words: TimedWord[], maxWidth: number): Line[] {
  const space = wordSpace(measure);
  const lines: Line[] = [];
  let current: Line = { words: [], widths: [], width: 0 };
  for (const word of words) {
    const width = measure(word.text);
    const next = current.width === 0 ? width : current.width + space + width;
    if (next > maxWidth && current.words.length > 0) {
      lines.push(current);
      current = { words: [word], widths: [width], width };
    } else {
      current = {
        words: [...current.words, word],
        widths: [...current.widths, width],
        width: next,
      };
    }
  }
  if (current.words.length > 0) lines.push(current);
  return lines;
}

export type WindowOptions = { measure: Measure; maxWidth: number; limits: WindowLimits };

/**
 * Ferestrele textului (ADR-030): o fereastră se închide când următorul cuvânt n-ar mai
 * încăpea în `maxLines` (dur) sau când au trecut ≥ `minSeconds` de la primul ei cuvânt
 * și a atins `targetWords`; fereastra începe cu primul ei cuvânt.
 */
export function windowsFor(words: TimedWord[], opts: WindowOptions): TextWindow[] {
  const space = wordSpace(opts.measure);
  const windows: TextWindow[] = [];
  let current: TimedWord[] = [];
  const close = () => {
    if (current.length > 0)
      windows.push({
        lines: wrapLines(opts.measure, current, opts.maxWidth),
        space,
        start: current[0]!.start,
      });
    current = [];
  };
  for (const word of words) {
    if (current.length > 0) {
      const overflow =
        wrapLines(opts.measure, [...current, word], opts.maxWidth).length > opts.limits.maxLines;
      const ripe =
        word.start - current[0]!.start >= opts.limits.minSeconds &&
        current.length >= opts.limits.targetWords;
      if (overflow || ripe) close();
    }
    current.push(word);
  }
  close();
  return windows;
}

/** Ferestrele unui beat, măsurate o dată pe fontul bulei (TASK-0096). */
export function measureWindows(
  ctx: CanvasCtx,
  words: TimedWord[],
  limits: WindowLimits
): TextWindow[] {
  ctx.font = font(BUBBLE.font);
  return windowsFor(words, { measure: ctxMeasure(ctx), maxWidth: TEXT_WIDTH, limits });
}

function windowAt(windows: TextWindow[], time: number): number {
  let index = 0;
  for (let i = 0; i < windows.length; i++) if (windows[i]!.start <= time) index = i;
  return index;
}

/** Cuvintele se aprind calm pe măsură ce vocea le atinge — fără efect pe cel curent. */
function wordColor(word: TimedWord, time: number): string {
  return time >= word.start ? PALETTE.ink : PALETTE.unspoken;
}

type LinesAt = { top: number; time: number; maxLines: number; font: number };

function drawWindowLines(ctx: CanvasCtx, window: TextWindow, at: LinesAt): void {
  const lineHeight = at.font * BUBBLE.lineHeight;
  const offset = ((at.maxLines - window.lines.length) * lineHeight) / 2;
  window.lines.forEach((line, index) => {
    let x = BUBBLE.rightEdge - BUBBLE.width / 2 - line.width / 2;
    const y = at.top + offset + index * lineHeight + at.font;
    line.words.forEach((word, k) => {
      ctx.fillStyle = wordColor(word, at.time);
      ctx.fillText(word.text, x, y);
      x += line.widths[k]! + window.space;
    });
  });
}

/** Cardul bulei: hârtie translucidă cu umbră neutră; coada spre mascotă când `tail`. */
function drawCard(ctx: CanvasCtx, box: Box, tail: boolean): void {
  ctx.save();
  ctx.shadowColor = PALETTE.shadow;
  ctx.shadowBlur = BUBBLE.shadowBlur;
  ctx.shadowOffsetY = BUBBLE.shadowOffsetY;
  ctx.fillStyle = PALETTE.paper;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.width, box.height, BUBBLE.radius);
  ctx.fill();
  if (tail) {
    const edge = box.x + box.width;
    const bottom = box.y + box.height;
    ctx.beginPath();
    ctx.moveTo(edge - 6, bottom - BUBBLE.tailTop);
    ctx.lineTo(edge + BUBBLE.tailOut, bottom - 30);
    ctx.lineTo(edge - 6, bottom - BUBBLE.tailBottom);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Un chip măsurat o dată: lățimea textului la fontul cerut, plus pernele lui. */
export function measureChip(ctx: CanvasCtx, text: string, size: number = CHIP.font): Chip {
  ctx.font = font(size);
  return { text, width: ctx.measureText(text).width + 2 * CHIP.padX, size };
}

/** Chip galben cu text: numele secțiunii pe marginea de sus a bulei, semnătura sub mascotă. */
export function drawChip(ctx: CanvasCtx, chip: Chip, at: { x: number; y: number }): void {
  const height = CHIP.height + (chip.size - CHIP.font);
  ctx.font = font(chip.size);
  ctx.fillStyle = CHIP.fill;
  ctx.beginPath();
  ctx.roundRect(at.x, at.y, chip.width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = CHIP.text;
  ctx.fillText(chip.text, at.x + CHIP.padX, at.y + chip.size + (height - chip.size) / 2 - 4);
}

/** Bula beat-ului: fereastra momentului pe limitele benzii, chip-ul secțiunii, fade-in la schimbare. */
export function drawBubble(
  ctx: CanvasCtx,
  windows: TextWindow[],
  at: { time: number; limits: WindowLimits; chip?: Chip }
): void {
  const index = windowAt(windows, at.time);
  const window = windows[index]!;
  const height = bubbleHeight(at.limits.maxLines);
  const x = BUBBLE.rightEdge - BUBBLE.width;
  const y = bubbleTop(at.limits.maxLines);
  drawCard(ctx, { x, y, width: BUBBLE.width, height }, true);
  if (at.chip) drawChip(ctx, at.chip, { x: x + CHIP.offsetX, y: y - CHIP.raise });
  const fade = index === 0 ? 1 : Math.min(1, (at.time - window.start) / BUBBLE.fadeSeconds);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.font = font(BUBBLE.font);
  drawWindowLines(ctx, window, {
    top: y + BUBBLE.padY + (1 - fade) * BUBBLE.slideIn,
    time: at.time,
    maxLines: at.limits.maxLines,
    font: BUBBLE.font,
  });
  ctx.restore();
}

export type PanelLayout = { font: number; lines: Line[]; space: number };

/** Așezarea unui text static (ADR-030): ≤ PANEL.maxLines rânduri la primul font din listă care încape. */
export function panelLayout(text: string, measureFor: (font: number) => Measure): PanelLayout {
  const words: TimedWord[] = text
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => ({ text: t, start: 0, end: 0 }));
  let layout: PanelLayout = { font: PANEL.fonts[0], lines: [], space: 0 };
  for (const size of PANEL.fonts) {
    const measure = measureFor(size);
    layout = {
      font: size,
      lines: wrapLines(measure, words, TEXT_WIDTH),
      space: wordSpace(measure),
    };
    if (layout.lines.length <= PANEL.maxLines) return layout;
  }
  return layout;
}

/** Panoul unui text static, măsurat o dată pe canvas (TASK-0096). */
export function measurePanel(ctx: CanvasCtx, text: string): PanelLayout {
  return panelLayout(text, (size) => {
    ctx.font = font(size);
    return ctxMeasure(ctx);
  });
}

/** Panoul static — titlul la intro, ultima întrebare la outro: aceeași bulă, tot textul „rostit". */
export function drawPanel(ctx: CanvasCtx, panel: PanelLayout, alpha = 1): void {
  const lines = panel.lines.length;
  const height = bubbleHeight(lines, panel.font);
  const x = BUBBLE.rightEdge - BUBBLE.width;
  const y = bubbleTop(lines, panel.font);
  ctx.save();
  ctx.globalAlpha = alpha;
  drawCard(ctx, { x, y, width: BUBBLE.width, height }, true);
  ctx.font = font(panel.font);
  drawWindowLines(
    ctx,
    { lines: panel.lines, space: panel.space, start: 0 },
    { top: y + BUBBLE.padY, time: Infinity, maxLines: lines, font: panel.font }
  );
  ctx.restore();
}

/** Cardul de închidere, măsurat o dată: cuvântul „Sfârșit" și chip-ul vorbaretii.ro. */
export function measureEndingCard(ctx: CanvasCtx): EndingCard {
  ctx.font = font(OUTRO.wordFont);
  return { wordWidth: ctx.measureText(OUTRO.word).width, url: measureChip(ctx, OUTRO.url) };
}

/** Închiderea: cardul centrat, fără coadă, spune „Sfârșit", cu chip-ul vorbaretii.ro deasupra. */
export function drawEndingCard(ctx: CanvasCtx, card: EndingCard, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  const height = OUTRO.wordFont + 2 * OUTRO.padY;
  const width = Math.max(OUTRO.minWidth, card.wordWidth + 2 * OUTRO.padX);
  const x = (VIDEO.width - width) / 2;
  const y = VIDEO.height - BUBBLE.bottom - height;
  drawCard(ctx, { x, y, width, height }, false);
  drawChip(ctx, card.url, { x: (VIDEO.width - card.url.width) / 2, y: y - CHIP.raise });
  ctx.font = font(OUTRO.wordFont);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(
    OUTRO.word,
    (VIDEO.width - card.wordWidth) / 2,
    y + height / 2 + OUTRO.wordFont * OUTRO.baselineFactor
  );
  ctx.restore();
}
