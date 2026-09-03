/**
 * Manivela video (ADR-015): compune filmul articolului din masterele 2k,
 * integrala audio și alinierea ei — local, determinist. Straturile și
 * configurația: `scripts/video/`.
 *
 *   yarn generate-article-video <slug> [--proba | --beat <sectionId>:<index>|titlu]
 *
 * `--proba` randează începutul + primele 2 beat-uri (clipul scurt de review);
 * `--beat` randează DOAR segmentul numit. Ieșirea:
 * out-video/<slug>[.<sufix>].mp4 — NU se comite (destinația e a operatorului).
 */

import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import type { Article } from "../app/articole/content/schema";
import { articleAudioSpec } from "../app/articole/audio-naming";
import { articleTimeline, type Alignment } from "../app/articole/beat-timing";
import { renderVideo } from "./video/compose";

const CONTENT_DIR = join(__dirname, "../app/articole/content");
const AUDIO_ROOT = join(__dirname, "../public/assets/audio/articole");
const OUT_DIR = join(__dirname, "../out-video");

type Timeline = ReturnType<typeof articleTimeline>;
type Range = { from: number; to: number };

function findSegment(timeline: Timeline, spec: string): number {
  if (spec === "titlu") return 0;
  const [sectionId, indexRaw] = spec.split(":");
  const index = Number(indexRaw ?? 0);
  const found = timeline.findIndex(
    (s) => s.kind === "beat" && s.sectionId === sectionId && s.beatIndex === index
  );
  if (found === -1)
    throw new Error(`segment necunoscut "${spec}" — folosește titlu sau <sectionId>:<index>`);
  return found;
}

/** Proba scurtă: titlul + primele 2 beat-uri. */
function probeRange(timeline: Timeline): Range {
  let beats = 0;
  for (const [i, segment] of timeline.entries()) {
    if (segment.kind === "beat") beats++;
    if (beats === 2) return { from: 0, to: i };
  }
  return { from: 0, to: timeline.length - 1 };
}

function parseRange(timeline: Timeline, flag?: string, spec?: string): Range | undefined {
  if (flag === "--proba") return probeRange(timeline);
  if (flag === "--beat" && spec) {
    const index = findSegment(timeline, spec);
    return { from: index, to: index };
  }
  return undefined;
}

async function main(): Promise<void> {
  const [slug, flag, beatSpec] = process.argv.slice(2);
  if (!slug)
    throw new Error(
      "folosire: yarn generate-article-video <slug> [--proba | --beat <sectionId>:<index>]"
    );
  const article = JSON.parse(readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8")) as Article;
  const audioSpec = articleAudioSpec(article);
  const audioDir = join(AUDIO_ROOT, slug);
  if (!existsSync(join(audioDir, audioSpec.file)))
    throw new Error(`articolul "${slug}" n-are integrala audio — fă-i întâi audio (ADR-014)`);
  const alignment = JSON.parse(
    readFileSync(join(audioDir, audioSpec.alignmentFile), "utf8")
  ) as Alignment;
  const timeline = articleTimeline(article, alignment);

  const range = parseRange(timeline, flag, beatSpec);
  mkdirSync(OUT_DIR, { recursive: true });
  const suffix =
    range === undefined ? "" : flag === "--proba" ? ".proba" : `.${beatSpec!.replace(":", "-")}`;
  const outPath = join(OUT_DIR, `${slug}${suffix}.mp4`);

  const frames = await renderVideo({
    slug,
    article,
    timeline,
    audioPath: join(audioDir, audioSpec.file),
    outPath,
    range,
  });
  console.log(`scris ${outPath} (${frames} cadre)`);
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
