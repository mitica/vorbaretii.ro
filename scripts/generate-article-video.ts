/**
 * Manivela video (ADR-015): compune filmul articolului din masterele 2k,
 * integrala audio și alinierea ei — local, determinist. Straturile și
 * configurația: `scripts/video/`.
 *
 *   yarn generate-article-video <slug> [--proba | --final | --beat <sectionId>:<index>|titlu]
 *
 * `--proba` = titlul + primele 2 beat-uri; `--final` = ultimele 2 + închiderea;
 * `--beat` = un singur segment. Ieșirea: out-video/<slug>[.<sufix>].mp4 — NU se
 * comite (destinația e a operatorului).
 */

import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import type { Article } from "../app/articole/content/schema";
import { articleAudioSpec } from "../app/articole/audio-naming";
import { articleTimeline, type Alignment } from "../app/articole/beat-timing";
import { renderVideo, segmentAnchors, type SegmentRange } from "./video/compose";
import { masterImagePath } from "./video/background";

const CONTENT_DIR = join(__dirname, "../app/articole/content");
const AUDIO_ROOT = join(__dirname, "../public/assets/audio/articole");
const OUT_DIR = join(__dirname, "../out-video");
const USAGE =
  "folosire: yarn generate-article-video <slug> [--proba | --final | --beat <sectionId>:<index>|titlu]";

type Timeline = ReturnType<typeof articleTimeline>;

function findSegment(timeline: Timeline, spec: string): number {
  if (spec === "titlu") return 0;
  const [sectionId, indexRaw] = spec.split(":");
  const index = Number(indexRaw ?? 0);
  const found = timeline.findIndex(
    (s) => s.kind === "beat" && s.sectionId === sectionId && s.beatIndex === index
  );
  if (found === -1) throw new Error(`segment necunoscut "${spec}" — ${USAGE}`);
  return found;
}

/** Proba scurtă: titlul + primele 2 beat-uri. */
function probeRange(timeline: Timeline): SegmentRange {
  let beats = 0;
  for (const [i, segment] of timeline.entries()) {
    if (segment.kind === "beat") beats++;
    if (beats === 2) return { from: 0, to: i };
  }
  return { from: 0, to: timeline.length - 1 };
}

/** Flagurile sunt stricte: orice necunoscut sau incomplet oprește rularea, nu randează tot. */
function parseRange(timeline: Timeline, flag?: string, spec?: string): SegmentRange | undefined {
  if (flag === undefined) return undefined;
  if (flag === "--proba") return probeRange(timeline);
  if (flag === "--final")
    return { from: Math.max(0, timeline.length - 2), to: timeline.length - 1 };
  if (flag === "--beat" && spec) {
    const index = findSegment(timeline, spec);
    return { from: index, to: index };
  }
  throw new Error(`argument necunoscut sau incomplet "${flag}" — ${USAGE}`);
}

/** Garda izvoarelor: fiecare ancoră trebuie să aibă masterul 2k pe disc. */
function assertMastersExist(slug: string, article: Article, timeline: Timeline): void {
  const anchors = new Set([...segmentAnchors(article, timeline), "erou"]);
  const missing = [...anchors].filter((anchor) => !existsSync(masterImagePath(slug, anchor)));
  if (missing.length > 0)
    throw new Error(
      `lipsesc masterele 2k: ${missing.map((a) => masterImagePath(slug, a)).join(", ")} — generează-le întâi (manivela de imagini)`
    );
}

async function main(): Promise<void> {
  const [slug, flag, beatSpec] = process.argv.slice(2);
  if (!slug) throw new Error(USAGE);
  const articlePath = join(CONTENT_DIR, `${slug}.json`);
  if (!existsSync(articlePath)) throw new Error(`articolul "${slug}" nu există (${articlePath})`);
  const article = JSON.parse(readFileSync(articlePath, "utf8")) as Article;
  const audioSpec = articleAudioSpec(article);
  const audioDir = join(AUDIO_ROOT, slug);
  if (!existsSync(join(audioDir, audioSpec.file)))
    throw new Error(`articolul "${slug}" n-are integrala audio — fă-i întâi audio (ADR-014)`);
  const alignment = JSON.parse(
    readFileSync(join(audioDir, audioSpec.alignmentFile), "utf8")
  ) as Alignment;
  const timeline = articleTimeline(article, alignment);
  assertMastersExist(slug, article, timeline);

  const range = parseRange(timeline, flag, beatSpec);
  mkdirSync(OUT_DIR, { recursive: true });
  const suffix =
    range === undefined
      ? ""
      : flag === "--beat"
        ? `.${beatSpec!.replace(":", "-")}`
        : `.${flag!.slice(2)}`;
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
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
