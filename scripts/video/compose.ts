/**
 * Asamblarea straturilor (ADR-015): fundal Ken Burns + bula gaiței + mascota →
 * cadre RGBA trimise DIRECT în ffmpeg (rawvideo pe stdin, integrala drept
 * coloană sonoră). Toată logica de compoziție e aici, în TypeScript testabil —
 * ffmpeg primește doar pixeli și audio, zero filtergraph-uri de unică
 * folosință.
 */

import { spawn } from "child_process";
import { createCanvas, GlobalFonts, type Image } from "@napi-rs/canvas";
import { join } from "path";
import type { Article } from "../../app/articole/content/schema";
import { reactionsFor, type Reaction, type TimelineSegment } from "../../app/articole/beat-timing";
import { lastQuestion } from "../../app/articole/audio-naming";
import { drawBackground, loadAnchorImage, type CanvasCtx } from "./background";
import {
  drawBubble,
  drawPanel,
  measureChip,
  measureEndingCard,
  measurePanel,
  measureWindows,
  type Chip,
  type EndingCard,
  type PanelLayout,
  type TextWindow,
} from "./text-band";
import { bandFor, shotAnchors, type Shot } from "./shots";
import {
  drawMascot,
  loadMascotLayer,
  poseAt,
  speechIndex,
  type MascotLayer,
  type SpeechIndex,
} from "./mascot-layer";
import { filmPhase, filmRange, toAudioTime, type SegmentRange, type TimeRange } from "./film";
import type { StingRole } from "./sting";
import { audioArgs } from "./audio-track";
import { drawEnding, drawQuestion, type EndingScene } from "./ending";
import {
  BAND_BY_BAND,
  ENCODE,
  FONTS,
  FONT_DIR,
  QUESTION,
  REACTION,
  STINGS,
  TRANSITION,
  VIDEO,
  type WindowLimits,
} from "./config";

export type RenderJob = {
  slug: string;
  article: Article;
  timeline: TimelineSegment[];
  audioPath: string;
  stingPaths: Record<StingRole, string>;
  outPath: string;
  /** Doar segmentele astea (probe): indici în timeline, inclusiv; intro-ul intră la primul, închiderea la ultimul. */
  range?: SegmentRange;
  /** O fereastră de timp de film (previzualizările stingurilor) — bate `range`. */
  window?: TimeRange;
};

/** Intervalul randat: fereastra, dacă e; altfel segmentele; fără nimic, tot filmul. */
export function renderRange(job: Pick<RenderJob, "timeline" | "range" | "window">): TimeRange {
  return job.window ?? filmRange(job.timeline, job.range);
}

/** Textul unui segment, măsurat o dată: ferestrele lui și chip-ul secțiunii. */
type SegmentText = { windows: TextWindow[]; chip?: Chip };
/** Tot textul filmului, măsurat o dată (TASK-0096) — bucla de cadre nu mai măsoară. */
type FilmText = {
  segments: SegmentText[];
  title: PanelLayout;
  question: PanelLayout;
  card: EndingCard;
};

/** Cadrul unui moment: tot ce au nevoie straturile ca să-l deseneze. */
type FrameScene = {
  job: RenderJob;
  ctx: CanvasCtx;
  images: Map<string, Image>;
  shots: Shot[];
  limits: WindowLimits;
  mascot: MascotLayer;
  reactions: Reaction[];
  speech: SpeechIndex;
  text: FilmText;
};

function registerFonts(): void {
  for (const font of FONTS) GlobalFonts.registerFromPath(join(FONT_DIR, font.file), font.family);
}

function ffmpegArgs(job: RenderJob, range: TimeRange): string[] {
  return [
    "-y",
    ...["-f", "rawvideo", "-pix_fmt", "rgba"],
    ...["-s", `${VIDEO.width}x${VIDEO.height}`, "-r", String(VIDEO.fps)],
    ...["-i", "-"],
    ...audioArgs({ audioPath: job.audioPath, stingPaths: job.stingPaths }, range),
    ...["-c:v", "libx264", "-preset", ENCODE.preset, "-crf", String(ENCODE.crf)],
    ...["-pix_fmt", "yuv420p"],
    ...["-c:a", "aac", "-b:a", ENCODE.audioBitrate],
    job.outPath,
  ];
}

/** Bula momentului: titlul pe panou static; altfel ferestrele segmentului, chip-ul secțiunii, limitele benzii. */
function drawBand(scene: FrameScene, time: number): void {
  const index = scene.job.timeline.findIndex((s) => time < s.end);
  if (index === -1) return;
  if (scene.job.timeline[index]!.kind === "titlu") {
    drawPanel(scene.ctx, scene.text.title);
    return;
  }
  const text = scene.text.segments[index]!;
  drawBubble(scene.ctx, text.windows, { time, limits: scene.limits, chip: text.chip });
}

/** Marginile unui cadru în timp de film: primul cadru începe la 0 (intro-ul stă pe erou), restul la întâmpinare + start. */
function shotBounds(shots: Shot[], index: number): TimeRange {
  const shot = shots[index]!;
  return {
    start: index === 0 ? 0 : STINGS.intro.seconds + shot.start,
    end: STINGS.intro.seconds + shot.end,
  };
}

/** Fundalul momentului: cadrul curent, cu crossfade de la cel dinainte când ancora se schimbă. */
function drawShot(scene: FrameScene, index: number, filmTime: number): void {
  const { ctx, images, shots } = scene;
  const shot = shots[index]!;
  const bounds = shotBounds(shots, index);
  const progress = Math.min(
    1,
    Math.max(0, (filmTime - bounds.start) / (bounds.end - bounds.start))
  );
  const previous = index > 0 ? shots[index - 1]! : null;
  const visibleSince = previous ? filmTime - shotBounds(shots, index - 1).end : Infinity;
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

/** Închiderea: întrebarea (3 s) apoi „Sfârșit"; `since` = de la sfârșitul integralei. */
function drawClosing(scene: FrameScene, phase: "question" | "outro", since: number): void {
  const { shots } = scene;
  const ending: EndingScene = {
    ctx: scene.ctx,
    images: scene.images,
    lastAnchor: shots[shots.length - 1]!.anchor,
    shotCount: shots.length,
    question: scene.text.question,
    card: scene.text.card,
  };
  if (phase === "question") drawQuestion(ending, since);
  else drawEnding(ending, since - QUESTION.seconds);
}

function drawFrame(scene: FrameScene, filmTime: number): void {
  const { job, shots } = scene;
  const phase = filmPhase(filmTime, job.timeline);
  const audioTime = toAudioTime(filmTime);
  if (phase === "intro" || phase === "body") {
    const index = shots.findIndex((s) => filmTime < STINGS.intro.seconds + s.end);
    drawShot(scene, Math.max(0, index), filmTime);
    if (phase === "intro") drawPanel(scene.ctx, scene.text.title);
    else drawBand(scene, audioTime);
  } else {
    drawClosing(scene, phase, audioTime - job.timeline[job.timeline.length - 1]!.end);
  }
  drawMascot(
    scene.ctx,
    scene.mascot,
    poseAt(audioTime, { speech: scene.speech, reactions: scene.reactions, filmPhase: phase })
  );
}

function spawnFfmpeg(job: RenderJob, range: TimeRange) {
  const ffmpeg = spawn("ffmpeg", ffmpegArgs(job, range), {
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

/** Textul unui segment: ferestrele lui pe limitele benzii și chip-ul secțiunii. */
function segmentText(
  ctx: CanvasCtx,
  segment: TimelineSegment,
  film: { article: Article; limits: WindowLimits }
): SegmentText {
  if (segment.kind === "titlu") return { windows: [] };
  const title = film.article.sections.find((s) => s.id === segment.sectionId)?.title;
  return {
    windows: measureWindows(ctx, segment.words, film.limits),
    chip: title ? measureChip(ctx, title.toUpperCase()) : undefined,
  };
}

/** Măsurarea, o dată per film: ferestrele fiecărui segment, panourile statice, cardul de închidere. */
function measureFilm(ctx: CanvasCtx, job: RenderJob, limits: WindowLimits): FilmText {
  const film = { article: job.article, limits };
  return {
    segments: job.timeline.map((segment) => segmentText(ctx, segment, film)),
    title: measurePanel(ctx, job.article.title),
    question: measurePanel(ctx, lastQuestion(job.article)),
    card: measureEndingCard(ctx),
  };
}

/** Scena filmului: tot ce se derivă O DATĂ — cadrele, imaginile, stratul mascotei, reacțiile, textul măsurat. */
async function buildScene(job: RenderJob, ctx: CanvasCtx): Promise<FrameScene> {
  const band = bandFor(job.article);
  const shots = shotAnchors(job.article, job.timeline, band);
  const images = new Map<string, Image>();
  for (const anchor of new Set([...shots.map((s) => s.anchor), "erou"]))
    images.set(anchor, await loadAnchorImage(job.slug, anchor));
  return {
    job,
    ctx,
    images,
    shots,
    limits: BAND_BY_BAND[band],
    mascot: await loadMascotLayer(ctx),
    reactions: reactionsFor(job.article, job.timeline, { band, maxSeconds: REACTION.maxSeconds }),
    speech: speechIndex(job.timeline),
    text: measureFilm(ctx, job, BAND_BY_BAND[band]),
  };
}

/** Randarea: întoarce numărul de cadre scrise; aruncă onest dacă ffmpeg lipsește sau moare. */
export async function renderVideo(job: RenderJob): Promise<number> {
  registerFonts();
  const canvas = createCanvas(VIDEO.width, VIDEO.height);
  const scene = await buildScene(job, canvas.getContext("2d"));

  const range = renderRange(job);
  const { start, end } = range;
  const frames = Math.ceil((end - start) * VIDEO.fps);
  const { ffmpeg, done, failure } = spawnFfmpeg(job, range);

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
