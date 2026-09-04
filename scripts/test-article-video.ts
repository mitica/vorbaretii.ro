/**
 * Legea derivării timpilor (ADR-015): Timeline-ul articolului iese determinist
 * din aliniere — segmentele (titlu + fiecare beat) acoperă tot textul vorbit,
 * fără goluri și fără suprapuneri, timpii sunt monotoni, iar fiecare cuvânt
 * cade în segmentul lui. Se probează pe un fixture construit de mână ȘI pe
 * corpusul real (articolele cu audio).
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Article } from "../app/articole/content/schema";
import { articleAudioSpec, spokenText } from "../app/articole/audio-naming";
import { articleTimeline, type Alignment, type TimedWord } from "../app/articole/beat-timing";
import { BAND, OUTRO } from "./video/config";
import { windowsFor, wrapLines } from "./video/text-band";
import { renderRange, segmentAnchors } from "./video/compose";

const AUDIO_ROOT = join(process.cwd(), "public/assets/audio/articole");
const CONTENT_DIR = join(process.cwd(), "app/articole/content");

/** Aliniere sintetică: fiecare caracter durează 0,1s — timpii sunt previzibili. */
function syntheticAlignment(text: string): Alignment {
  const characters = [...text];
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => i * 0.1),
    character_end_times_seconds: characters.map((_, i) => (i + 1) * 0.1),
  };
}

const FIXTURE = {
  title: "Un titlu de probă",
  sections: [
    {
      id: "unu",
      title: "S1",
      beats: [
        { text: "Primul beat spune ceva.", images: [] },
        {
          text: "Al doilea beat, cu voce.",
          images: [],
          voce: "[excited] Al doilea beat, cu voce.",
        },
      ],
      questions: [],
    },
    { id: "doi", title: "S2", beats: [{ text: "Beatul final.", images: [] }], questions: [] },
  ],
} as unknown as Article;

function fixtureSpoken(): string {
  const beats = FIXTURE.sections.flatMap((s) => s.beats.map((b) => spokenText(b.voce ?? b.text)));
  return [FIXTURE.title, ...beats].join(" ");
}

test("ADR-015: segmentele acoperă tot textul vorbit, în ordine, fără goluri", () => {
  const alignment = syntheticAlignment(fixtureSpoken());
  const timeline = articleTimeline(FIXTURE, alignment);
  assert.equal(timeline.length, 1 + 3, "titlu + 3 beat-uri");
  assert.equal(timeline[0]!.kind, "titlu");
  const joined = timeline.map((s) => s.text.replace(/\s+/g, "")).join("");
  assert.equal(joined, fixtureSpoken().replace(/\s+/g, ""));
  const last = timeline[timeline.length - 1]!;
  assert.equal(last.end, alignment.character_end_times_seconds.at(-1));
  for (let i = 1; i < timeline.length; i++)
    assert.ok(timeline[i]!.start >= timeline[i - 1]!.end - 1e-9, `suprapunere la segmentul ${i}`);
});

test("ADR-015: fiecare cuvânt cade în segmentul lui, cu timpi monotoni", () => {
  const timeline = articleTimeline(FIXTURE, syntheticAlignment(fixtureSpoken()));
  for (const segment of timeline) {
    assert.equal(segment.words.length, segment.text.split(/\s+/).filter(Boolean).length);
    let previous = segment.start;
    for (const word of segment.words satisfies TimedWord[]) {
      assert.ok(
        word.start >= previous - 1e-9,
        `cuvântul "${word.text}" începe înaintea celui dinainte`
      );
      assert.ok(word.end <= segment.end + 1e-9, `cuvântul "${word.text}" iese din segment`);
      previous = word.start;
    }
  }
});

test("ADR-015: caracter nepotrivit între articol și aliniere → respins cu poziția", () => {
  const alignment = syntheticAlignment(fixtureSpoken().replace("titlu", "tXtlu"));
  assert.throws(() => articleTimeline(FIXTURE, alignment), /nu se potrivește/);
});

/** Măsurător injectabil: lățime fixă per caracter — geometria e previzibilă. */
const measure = (text: string): number => text.length * 10;

function timedWords(text: string): TimedWord[] {
  let at = 0;
  return text.split(/\s+/).map((word) => {
    const start = at;
    at += word.length * 0.1;
    return { text: word, start, end: at };
  });
}

test("ADR-015: ferestrele benzii — cel mult maxLines rânduri, fiecare cuvânt exact o dată, starturi monotone", () => {
  const words = timedWords(
    "O poveste destul de lungă încât să se rupă în mai multe rânduri și în mai multe ferestre succesive pe voce."
  );
  const windows = windowsFor(wrapLines(measure, words, 300));
  assert.ok(windows.length >= 2, "fixture-ul trebuie să producă mai multe ferestre");
  const seen = windows.flatMap((w) => w.lines.flatMap((line) => line.words.map((x) => x.text)));
  assert.deepEqual(
    seen,
    words.map((w) => w.text),
    "fiecare cuvânt, exact o dată, în ordine"
  );
  for (const w of windows)
    assert.ok(w.lines.length <= BAND.maxLines, "fereastră peste maxLines rânduri");
  for (let i = 1; i < windows.length; i++)
    assert.ok(windows[i]!.start > windows[i - 1]!.start, "starturile ferestrelor nu cresc");
  for (const w of windows)
    for (const line of w.lines)
      assert.ok(line.width <= 300, `rând peste lățimea maximă: ${line.width}`);
});

test("ADR-015: ancorele de fundal — titlul pe erou, beat-ul fără imagine moștenește", () => {
  const timeline = articleTimeline(FIXTURE, syntheticAlignment(fixtureSpoken()));
  const withImages = JSON.parse(JSON.stringify(FIXTURE)) as Article;
  withImages.sections[0]!.beats[1]!.images = ["casa"];
  const anchors = segmentAnchors(withImages, timeline);
  assert.deepEqual(anchors, ["erou", "erou", "casa", "casa"]);
});

test("ADR-015: intervalul randării — outro doar când ținta e ultimul segment", () => {
  const timeline = articleTimeline(FIXTURE, syntheticAlignment(fixtureSpoken()));
  const last = timeline.length - 1;
  const full = renderRange(timeline, undefined);
  assert.equal(full.start, 0);
  assert.equal(full.end, timeline[last]!.end + OUTRO.seconds, "filmul întreg se închide cu outro");
  const probe = renderRange(timeline, { from: 0, to: 1 });
  assert.equal(probe.start, timeline[0]!.start);
  assert.equal(probe.end, timeline[1]!.end, "proba fără outro");
  const ending = renderRange(timeline, { from: last - 1, to: last });
  assert.equal(ending.end, timeline[last]!.end + OUTRO.seconds, "finalul include outro");
});

test("ADR-015: derivarea merge pe corpusul real (articolele cu audio)", () => {
  if (!existsSync(AUDIO_ROOT)) return;
  for (const slug of readdirSync(AUDIO_ROOT)) {
    if (!statSync(join(AUDIO_ROOT, slug)).isDirectory()) continue;
    const article = JSON.parse(readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8")) as Article;
    const spec = articleAudioSpec(article);
    const alignment = JSON.parse(
      readFileSync(join(AUDIO_ROOT, slug, spec.alignmentFile), "utf8")
    ) as Alignment;
    const timeline = articleTimeline(article, alignment);
    assert.ok(timeline.length >= 3, `${slug}: timeline suspect de scurt`);
    assert.equal(
      timeline[timeline.length - 1]!.end,
      alignment.character_end_times_seconds.at(-1),
      `${slug}: timeline-ul nu ajunge la capătul alinierii`
    );
  }
});
