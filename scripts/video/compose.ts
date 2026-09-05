/**
 * Asamblarea straturilor (ADR-015): fundal Ken Burns + panglica de lectură →
 * cadre RGBA trimise DIRECT în ffmpeg (rawvideo pe stdin, integrala drept
 * coloană sonoră). Toată logica de compoziție e aici, în TypeScript testabil —
 * ffmpeg primește doar pixeli și audio, zero filtergraph-uri de unică
 * folosință.
 */

import { spawn } from "child_process";
import { createCanvas, GlobalFonts, type Image } from "@napi-rs/canvas";
import { join } from "path";
import type { Article } from "../../app/articole/content/schema";
import type { Band } from "../../app/articole/content/budgets";
import type { TimelineSegment } from "../../app/articole/beat-timing";
import { drawBackground, loadAnchorImage, type CanvasCtx } from "./background";
import { drawBeatBand, drawEndingRibbon } from "./text-band";
import { bandFor, shotAnchors, type Shot } from "./shots";
import { BAND_BY_BAND, ENCODE, FONTS, FONT_DIR, OUTRO, TRANSITION, VIDEO } from "./config";

export type SegmentRange = { from: number; to: number };

export type RenderJob = {
  slug: string;
  article: Article;
  timeline: TimelineSegment[];
  audioPath: string;
  outPath: string;
  /** Doar segmentele astea (probe): indici în timeline, inclusiv; outro-ul intră doar când `to` e ultimul. */
  range?: SegmentRange;
};

/** Cadrul unui moment: tot ce au nevoie straturile ca să-l deseneze. */
type FrameScene = {
  job: RenderJob;
  ctx: CanvasCtx;
  images: Map<string, Image>;
  shots: Shot[];
  band: Band;
};

function registerFonts(): void {
  for (const font of FONTS) GlobalFonts.registerFromPath(join(FONT_DIR, font.file), font.family);
}

/** Intervalul de timp al randării; outro-ul intră doar când ținta e ultimul segment. */
export function renderRange(
  timeline: TimelineSegment[],
  range?: SegmentRange
): { start: number; end: number } {
  const last = timeline.length - 1;
  const to = range ? range.to : last;
  const start = range ? timeline[range.from]!.start : 0;
  const end = timeline[to]!.end + (to === last ? OUTRO.seconds : 0);
  return { start, end };
}

function ffmpegArgs(job: RenderJob, audioStart: number, duration: number): string[] {
  return [
    "-y",
    ...["-f", "rawvideo", "-pix_fmt", "rgba"],
    ...["-s", `${VIDEO.width}x${VIDEO.height}`, "-r", String(VIDEO.fps)],
    ...["-i", "-"],
    ...["-ss", audioStart.toFixed(3), "-t", duration.toFixed(3), "-i", job.audioPath],
    ...["-c:v", "libx264", "-preset", ENCODE.preset, "-crf", String(ENCODE.crf)],
    ...["-pix_fmt", "yuv420p"],
    ...["-c:a", "aac", "-b:a", ENCODE.audioBitrate],
    job.outPath,
  ];
}

/** Închiderea: crossfade din ultima scenă înapoi pe erou, apoi panglica „Sfârșit". */
function drawEnding(scene: FrameScene, time: number): void {
  const { job, ctx, images, shots } = scene;
  const last = job.timeline.length - 1;
  const since = time - job.timeline[last]!.end;
  const progress = Math.min(1, since / OUTRO.seconds);
  const fade = Math.min(1, since / TRANSITION.seconds);
  const hero = images.get("erou")!;
  const lastShot = shots[shots.length - 1]!;
  if (lastShot.anchor !== "erou" && fade < 1) {
    drawBackground(ctx, {
      image: images.get(lastShot.anchor)!,
      segmentIndex: shots.length - 1,
      progress: 1,
    });
    ctx.save();
    ctx.globalAlpha = fade;
    drawBackground(ctx, { image: hero, segmentIndex: shots.length, progress });
    ctx.restore();
  } else {
    drawBackground(ctx, { image: hero, segmentIndex: shots.length, progress });
  }
  drawEndingRibbon(ctx, fade);
}

/** Panglica momentului: cuvintele segmentului rostit, tab-ul secțiunii, limitele benzii. */
function drawBand(scene: FrameScene, time: number): void {
  const segment = scene.job.timeline.find((s) => time < s.end);
  if (!segment) return;
  const section =
    segment.kind !== "titlu"
      ? scene.job.article.sections.find((s) => s.id === segment.sectionId)
      : undefined;
  drawBeatBand(scene.ctx, segment.words, {
    time,
    tag: section?.title,
    limits: BAND_BY_BAND[scene.band],
  });
}

/** Fundalul momentului: cadrul curent, cu crossfade de la cel dinainte când ancora se schimbă. */
function drawShot(scene: FrameScene, index: number, time: number): void {
  const { ctx, images, shots } = scene;
  const shot = shots[index]!;
  const progress = Math.min(1, Math.max(0, (time - shot.start) / (shot.end - shot.start)));
  const previous = index > 0 ? shots[index - 1]! : null;
  const visibleSince = previous ? time - previous.end : Infinity;
  const current = { image: images.get(shot.anchor)!, segmentIndex: index, progress };
  if (previous && previous.anchor !== shot.anchor && visibleSince < TRANSITION.seconds) {
    drawBackground(ctx, {
      image: images.get(previous.anchor)!,
      segmentIndex: index - 1,
      progress: 1,
    });
    ctx.save();
    ctx.globalAlpha = visibleSince / TRANSITION.seconds;
    drawBackground(ctx, current);
    ctx.restore();
  } else {
    drawBackground(ctx, current);
  }
}

function drawFrame(scene: FrameScene, time: number): void {
  const index = scene.shots.findIndex((s) => time < s.end);
  if (index === -1) {
    drawEnding(scene, time);
    return;
  }
  drawShot(scene, index, time);
  drawBand(scene, time);
}

function spawnFfmpeg(job: RenderJob, start: number, duration: number) {
  const ffmpeg = spawn("ffmpeg", ffmpegArgs(job, start, duration), {
    stdio: ["pipe", "ignore", "pipe"],
  });
  let stderr = "";
  ffmpeg.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
    if (stderr.length > 8192) stderr = stderr.slice(-4096);
  });
  // EPIPE pe stdin după ce ffmpeg a murit — cauza reală vine din `done`.
  ffmpeg.stdin.on("error", () => {});
  const done = new Promise<void>((resolve, reject) => {
    ffmpeg.on("error", () =>
      reject(new Error("ffmpeg lipsește — instalează-l (brew install ffmpeg)"))
    );
    ffmpeg.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg a ieșit cu ${code}: ${stderr.slice(-500)}`))
    );
  });
  // `failure` NU aruncă niciodată: ține eșecul ca valoare, ca bucla de scriere
  // să se poată opri fără unhandled rejection; `done` rămâne judecata finală.
  const failure: Promise<Error | null> = done.then(
    () => null,
    (error: Error) => error
  );
  return { ffmpeg, done, failure };
}

/** Randarea: întoarce numărul de cadre scrise; aruncă onest dacă ffmpeg lipsește sau moare. */
export async function renderVideo(job: RenderJob): Promise<number> {
  registerFonts();
  const band = bandFor(job.article);
  const shots = shotAnchors(job.article, job.timeline, band);
  const images = new Map<string, Image>();
  for (const anchor of new Set([...shots.map((s) => s.anchor), "erou"]))
    images.set(anchor, await loadAnchorImage(job.slug, anchor));

  const { start, end } = renderRange(job.timeline, job.range);
  const frames = Math.ceil((end - start) * VIDEO.fps);
  const { ffmpeg, done, failure } = spawnFfmpeg(job, start, end - start);

  const canvas = createCanvas(VIDEO.width, VIDEO.height);
  const scene: FrameScene = { job, ctx: canvas.getContext("2d"), images, shots, band };
  for (let frame = 0; frame < frames; frame++) {
    if (ffmpeg.stdin.destroyed) break;
    drawFrame(scene, start + frame / VIDEO.fps);
    const data = scene.ctx.getImageData(0, 0, VIDEO.width, VIDEO.height).data;
    if (!ffmpeg.stdin.write(Buffer.from(data.buffer, data.byteOffset, data.byteLength))) {
      const drained = new Promise((resolve) => ffmpeg.stdin.once("drain", resolve)).then(
        () => null
      );
      if (await Promise.race([drained, failure])) break;
    }
  }
  ffmpeg.stdin.end();
  await done;
  return frames;
}
