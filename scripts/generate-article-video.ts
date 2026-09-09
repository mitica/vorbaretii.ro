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

import { mkdirSync } from "fs";
import { join } from "path";
import type { TimelineSegment } from "../app/articole/beat-timing";
import { stingPath } from "./lib/episode";
import { REPO_ROOT } from "./lib/paths";
import { renderVideo } from "./video/compose";
import type { SegmentRange } from "./video/film";
import { loadFilmSources } from "./video/sources";

const OUT_DIR = join(REPO_ROOT, "out-video");
const USAGE =
  "folosire: yarn generate-article-video <slug> [--proba (intro + titlu + 2 beat-uri) | --final (ultimele 2 + închiderea) | --beat <sectionId>:<index>|titlu]";

type Timeline = TimelineSegment[];

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

async function main(): Promise<void> {
  const [slug, flag, beatSpec] = process.argv.slice(2);
  if (!slug) throw new Error(USAGE);
  const { article, timeline, audioPath } = loadFilmSources(slug);
  const stingPaths = { intro: stingPath("intro"), outro: stingPath("outro") };

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
    audioPath,
    stingPaths,
    outPath,
    range,
  });
  console.log(`scris ${outPath} (${frames} cadre)`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
