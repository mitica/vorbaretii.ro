/**
 * Asamblarea straturilor (ADR-015): fundal Ken Burns + cardul de text (+ slotul
 * mascotei, gol în v1) → cadre RGBA trimise DIRECT în ffmpeg (rawvideo pe
 * stdin, integrala drept coloană sonoră). Toată logica de compoziție e aici,
 * în TypeScript testabil — ffmpeg primește doar pixeli și audio, zero
 * filtergraph-uri de unică folosință.
 */

import { spawn } from "child_process";
import { createCanvas, GlobalFonts, type Image } from "@napi-rs/canvas";
import { join } from "path";
import type { Article } from "../../app/articole/content/schema";
import type { TimelineSegment } from "../../app/articole/beat-timing";
import { drawBackground, loadAnchorImage } from "./background";
import { drawBeatBand, drawOutroCard } from "./text-band";
import { FONTS, FONT_DIR, OUTRO, TRANSITION, VIDEO } from "./config";

export type RenderJob = {
  slug: string;
  article: Article;
  timeline: TimelineSegment[];
  audioPath: string;
  outPath: string;
  /** Doar segmentele astea (probe): indici în timeline, inclusiv; fără outro. */
  range?: { from: number; to: number };
};

function registerFonts(): void {
  for (const font of FONTS) GlobalFonts.registerFromPath(join(FONT_DIR, font.file), font.family);
}

/** Ancora de fundal a fiecărui segment: beat-ul cu imagine, altfel cea dinainte. */
function segmentAnchors(article: Article, timeline: TimelineSegment[]): string[] {
  let current = "erou";
  return timeline.map((segment) => {
    if (segment.kind === "beat") {
      const section = article.sections.find((s) => s.id === segment.sectionId);
      const anchor = section?.beats[segment.beatIndex!]?.images[0];
      if (anchor) current = anchor;
    }
    return current;
  });
}

function ffmpegArgs(job: RenderJob, audioStart: number, duration: number): string[] {
  return [
    "-y",
    ...["-f", "rawvideo", "-pix_fmt", "rgba"],
    ...["-s", `${VIDEO.width}x${VIDEO.height}`, "-r", String(VIDEO.fps)],
    ...["-i", "-"],
    ...["-ss", audioStart.toFixed(3), "-t", duration.toFixed(3), "-i", job.audioPath],
    ...["-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p"],
    ...["-c:a", "aac", "-b:a", "128k"],
    job.outPath,
  ];
}

function drawFrame(
  job: RenderJob,
  ctx: Parameters<typeof drawBackground>[0],
  images: Map<string, Image>,
  anchors: string[],
  time: number
): void {
  const index = job.timeline.findIndex((s) => time < s.end);
  const segment = index === -1 ? null : job.timeline[index]!;
  if (segment === null) {
    drawOutroCard(ctx, "vorbaretii.ro");
    return;
  }
  const progress = Math.min(1, Math.max(0, (time - segment.start) / (segment.end - segment.start)));
  const visibleSince = index > 0 ? time - job.timeline[index - 1]!.end : Infinity;
  const changed = index > 0 && anchors[index] !== anchors[index - 1];
  if (changed && visibleSince < TRANSITION.seconds) {
    drawBackground(ctx, images.get(anchors[index - 1]!)!, index - 1, 1);
    ctx.save();
    ctx.globalAlpha = visibleSince / TRANSITION.seconds;
    drawBackground(ctx, images.get(anchors[index]!)!, index, progress);
    ctx.restore();
  } else {
    drawBackground(ctx, images.get(anchors[index]!)!, index, progress);
  }
  const section =
    segment.kind === "beat"
      ? job.article.sections.find((s) => s.id === segment.sectionId)
      : undefined;
  drawBeatBand(ctx, segment.words, time, section?.title);
}

/** Randarea: întoarce numărul de cadre scrise; aruncă onest dacă ffmpeg lipsește. */
export async function renderVideo(job: RenderJob): Promise<number> {
  registerFonts();
  const anchors = segmentAnchors(job.article, job.timeline);
  const images = new Map<string, Image>();
  for (const anchor of new Set(anchors))
    images.set(anchor, await loadAnchorImage(job.slug, anchor));

  const start = job.range ? job.timeline[job.range.from]!.start : 0;
  const end = job.range
    ? job.timeline[job.range.to]!.end
    : job.timeline[job.timeline.length - 1]!.end + OUTRO.seconds;
  const frames = Math.ceil((end - start) * VIDEO.fps);

  const ffmpeg = spawn("ffmpeg", ffmpegArgs(job, start, end - start), {
    stdio: ["pipe", "ignore", "pipe"],
  });
  let stderrTail = "";
  ffmpeg.stderr.on("data", (chunk: Buffer) => (stderrTail = chunk.toString().slice(-500)));
  const done = new Promise<void>((resolve, reject) => {
    ffmpeg.on("error", () =>
      reject(new Error("ffmpeg lipsește — instalează-l (brew install ffmpeg)"))
    );
    ffmpeg.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg a ieșit cu ${code}: ${stderrTail}`))
    );
  });

  const canvas = createCanvas(VIDEO.width, VIDEO.height);
  const ctx = canvas.getContext("2d");
  for (let frame = 0; frame < frames; frame++) {
    drawFrame(job, ctx, images, anchors, start + frame / VIDEO.fps);
    const data = ctx.getImageData(0, 0, VIDEO.width, VIDEO.height).data;
    if (!ffmpeg.stdin.write(Buffer.from(data.buffer, data.byteOffset, data.byteLength)))
      await new Promise((resolve) => ffmpeg.stdin.once("drain", resolve));
  }
  ffmpeg.stdin.end();
  await done;
  return frames;
}
