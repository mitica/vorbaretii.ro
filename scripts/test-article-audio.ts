/**
 * Legea audio (ADR-014): un articol are audio COMPLET (titlu + fiecare
 * secțiune, fără bucăți străine) sau deloc; fiecare bucată ține bugetul;
 * player-ul încarcă doar la cerere și apare doar cu set complet. Corpusul
 * fără audio trece vid — audio-ul e opt-in per articol.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Article } from "../app/articole/content/schema";
import {
  SLICE_SEPARATOR,
  articleAudioSpec,
  mergeSpokenAlignments,
  requestSlices,
  spokenText,
  toSpokenBasis,
  type Alignment,
} from "../app/articole/audio-naming";

const AUDIO_ROOT = join(process.cwd(), "public/assets/audio/articole");
const CONTENT_DIR = join(process.cwd(), "app/articole/content");
const MAX_FILE_BYTES = 2.5 * 1024 * 1024;

function slugsWithAudio(): string[] {
  if (!existsSync(AUDIO_ROOT)) return [];
  return readdirSync(AUDIO_ROOT).filter((entry) => statSync(join(AUDIO_ROOT, entry)).isDirectory());
}

function expectedFiles(slug: string): string[] {
  const jsonPath = join(CONTENT_DIR, `${slug}.json`);
  assert.ok(
    existsSync(jsonPath),
    `ADR-014 — audio ORFAN: directorul "${slug}" există sub public/assets/audio/articole/, dar articolul nu — ștergerea trebuie să măture și audio-ul`
  );
  const raw = readFileSync(jsonPath, "utf8");
  const article = JSON.parse(raw) as Article;
  const spec = articleAudioSpec(article);
  return [spec.file, spec.alignmentFile];
}

test("ADR-014: un slug cu director audio are exact integrala curentă + alinierea ei (hash pe text+setări)", () => {
  for (const slug of slugsWithAudio()) {
    const present = readdirSync(join(AUDIO_ROOT, slug)).sort();
    assert.deepEqual(
      present,
      expectedFiles(slug).sort(),
      `ADR-014 — articolul "${slug}": integrala lipsă sau fișiere care nu-i mai corespund`
    );
  }
});

test("ADR-014: integrala ține bugetul de 2,5MB", () => {
  for (const slug of slugsWithAudio())
    for (const f of readdirSync(join(AUDIO_ROOT, slug)))
      assert.ok(
        statSync(join(AUDIO_ROOT, slug, f)).size <= MAX_FILE_BYTES,
        `ADR-014 — ${slug}/${f} peste bugetul de 2,5MB`
      );
});

test("ADR-014: alinierea e legată de textul vorbit al integralei", () => {
  for (const slug of slugsWithAudio()) {
    const jsonPath = join(CONTENT_DIR, `${slug}.json`);
    const article = JSON.parse(readFileSync(jsonPath, "utf8")) as Article;
    const spec = articleAudioSpec(article);
    const alignment = JSON.parse(
      readFileSync(join(AUDIO_ROOT, slug, spec.alignmentFile), "utf8")
    ) as {
      characters: string[];
      character_start_times_seconds: number[];
      character_end_times_seconds: number[];
    };
    const n = alignment.characters.length;
    assert.ok(n > 0, `ADR-014 — ${slug}: aliniere goală`);
    assert.ok(
      alignment.character_start_times_seconds.length === n &&
        alignment.character_end_times_seconds.length === n,
      `ADR-014 — ${slug}: lungimi de aliniere inegale`
    );
    for (let i = 1; i < n; i++)
      assert.ok(
        alignment.character_start_times_seconds[i]! >=
          alignment.character_start_times_seconds[i - 1]!,
        `ADR-014 — ${slug}: timpii alinierii nu sunt monotoni la ${i}`
      );
    const joined = alignment.characters.join("").replace(/\s+/g, " ").trim();
    const spoken = spokenText(spec.text).replace(/\s+/g, " ").trim();
    assert.equal(
      joined,
      spoken,
      `ADR-014 — ${slug}: alinierea nu adresează textul vorbit al integralei`
    );
  }
});

test("ADR-014: service worker-ul nu atinge audio-ul și cererile Range", () => {
  const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
  assert.ok(
    sw.includes("/assets/audio/") && sw.includes("range"),
    "ADR-014 — sw.js fără bypass pe audio/Range: bucata regenerată n-ar mai ajunge la telefon, iar media pe iOS cere 206"
  );
});

function componentSource(name: string): string {
  return readFileSync(join(process.cwd(), "app/articole/components", name), "utf8");
}

test("ADR-014: player-ul încarcă doar la cerere și apare doar cu set complet — lanțul ArticleShell → Narator → ArticleAudio", () => {
  assert.ok(
    componentSource("article-audio.tsx").includes('preload="none"'),
    "ADR-014 — player fără preload none"
  );
  const shell = componentSource("article-shell.tsx");
  assert.ok(
    shell.includes("Narator") && shell.includes("entry.audio"),
    "ADR-014 — rama nu montează Naratorul cu integrala din setul complet"
  );
  const narator = componentSource("narator.tsx");
  assert.ok(
    narator.includes("ArticleAudio") && narator.includes("src ?"),
    "ADR-014 — Naratorul nu randează player-ul condiționat de integrală"
  );
});

/** Aliniere sintetică pe textul TRIMIS al unei felii: 0,1s per caracter. */
function sliceAlignment(sent: string, from = 0): Alignment {
  const characters = [...sent];
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => from + i * 0.1),
    character_end_times_seconds: characters.map((_, i) => from + (i + 1) * 0.1),
  };
}

test("ADR-014: lipirea feliilor păstrează separatorul — alinierea multi-felie adresează textul vorbit", () => {
  const long = "Prima secțiune spune ceva destul de lung încât să nu încapă. ".repeat(55).trim();
  const text = `Titlul articolului.${SLICE_SEPARATOR}${long}${SLICE_SEPARATOR}[whispers] A doua secțiune, cu tag în felia a doua.`;
  const slices = requestSlices(text);
  assert.ok(slices.length >= 2, "fixture-ul trebuie să producă mai multe felii");
  assert.equal(slices.join(SLICE_SEPARATOR), text, "feliile lipite reconstruiesc exact textul");

  const merged = mergeSpokenAlignments(slices.map((s) => toSpokenBasis(s, sliceAlignment(s))));
  const joined = merged.characters.join("").replace(/\s+/g, " ").trim();
  const spoken = spokenText(text).replace(/\s+/g, " ").trim();
  assert.equal(joined.length, spoken.length, "lungimea basis-ului lipit diverge de textul vorbit");
  for (let i = 0; i < joined.length; i++)
    assert.equal(joined[i], spoken[i], `primul caracter divergent la poziția ${i}`);
  for (let i = 1; i < merged.character_start_times_seconds.length; i++)
    assert.ok(
      merged.character_start_times_seconds[i]! >=
        merged.character_start_times_seconds[i - 1]! - 1e-9,
      `timpii nu sunt monotoni la caracterul ${i}`
    );
});
