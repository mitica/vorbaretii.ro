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
