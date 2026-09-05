/**
 * Legea audio (ADR-033): un articol are audio COMPLET (titlu + fiecare
 * secțiune, fără bucăți străine) sau deloc; fiecare bucată ține bugetul;
 * player-ul încarcă doar la cerere și apare doar cu set complet. Corpusul
 * fără audio trece vid — audio-ul e opt-in per articol.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Article } from "../app/articole/content/schema";
import {
  MAX_REQUEST_CHARS,
  SLICE_SEPARATOR,
  articleAudioSpec,
  mergeSpokenAlignments,
  requestSlices,
  speaksSectionTitle,
  spokenText,
  toSpokenBasis,
  type Alignment,
  EPISODE_TAIL,
  episodeTailText,
  lastQuestion,
} from "../app/articole/audio-naming";
import { EPISODE_MASTER, episodeSpec } from "./lib/episode";
import { measureLoudness, measureTruePeak } from "./lib/loudness";

const AUDIO_ROOT = join(process.cwd(), "public/assets/audio/articole");
const CONTENT_DIR = join(process.cwd(), "app/articole/content");
const MAX_FILE_BYTES = 8 * 1024 * 1024;

function slugsWithAudio(): string[] {
  if (!existsSync(AUDIO_ROOT)) return [];
  return readdirSync(AUDIO_ROOT).filter((entry) => statSync(join(AUDIO_ROOT, entry)).isDirectory());
}

function expectedFiles(slug: string): string[] {
  const jsonPath = join(CONTENT_DIR, `${slug}.json`);
  assert.ok(
    existsSync(jsonPath),
    `ADR-033 — audio ORFAN: directorul "${slug}" există sub public/assets/audio/articole/, dar articolul nu — ștergerea trebuie să măture și audio-ul`
  );
  const raw = readFileSync(jsonPath, "utf8");
  const article = JSON.parse(raw) as Article;
  const spec = articleAudioSpec(article);
  return [spec.file, spec.alignmentFile, episodeSpec(article, spec.file).file];
}

test("ADR-033/ADR-032: un slug cu director audio are exact integrala curentă + alinierea ei + episodul curent", () => {
  for (const slug of slugsWithAudio()) {
    const present = readdirSync(join(AUDIO_ROOT, slug)).sort();
    assert.deepEqual(
      present,
      expectedFiles(slug).sort(),
      `ADR-033 — articolul "${slug}": integrala lipsă sau fișiere care nu-i mai corespund`
    );
  }
});

test("ADR-033: fiecare fișier audio ține bugetul de 8MB", () => {
  for (const slug of slugsWithAudio())
    for (const f of readdirSync(join(AUDIO_ROOT, slug)))
      assert.ok(
        statSync(join(AUDIO_ROOT, slug, f)).size <= MAX_FILE_BYTES,
        `ADR-033 — ${slug}/${f} peste bugetul de 8MB`
      );
});

test("ADR-033: alinierea e legată de textul vorbit al integralei", () => {
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
    assert.ok(n > 0, `ADR-033 — ${slug}: aliniere goală`);
    assert.ok(
      alignment.character_start_times_seconds.length === n &&
        alignment.character_end_times_seconds.length === n,
      `ADR-033 — ${slug}: lungimi de aliniere inegale`
    );
    for (let i = 1; i < n; i++)
      assert.ok(
        alignment.character_start_times_seconds[i]! >=
          alignment.character_start_times_seconds[i - 1]!,
        `ADR-033 — ${slug}: timpii alinierii nu sunt monotoni la ${i}`
      );
    const joined = alignment.characters.join("").replace(/\s+/g, " ").trim();
    const spoken = spokenText(spec.text).replace(/\s+/g, " ").trim();
    assert.equal(
      joined,
      spoken,
      `ADR-033 — ${slug}: alinierea nu adresează textul vorbit al integralei`
    );
  }
});

test("ADR-033: service worker-ul nu atinge audio-ul și cererile Range", () => {
  const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
  assert.ok(
    sw.includes("/assets/audio/") && sw.includes("range"),
    "ADR-033 — sw.js fără bypass pe audio/Range: bucata regenerată n-ar mai ajunge la telefon, iar media pe iOS cere 206"
  );
});

function componentSource(name: string): string {
  return readFileSync(join(process.cwd(), "app/articole/components", name), "utf8");
}

test("ADR-033: player-ul încarcă doar la cerere și apare doar cu set complet — lanțul ArticleShell → Narator → ArticleAudio", () => {
  assert.ok(
    componentSource("article-audio.tsx").includes('preload="none"'),
    "ADR-033 — player fără preload none"
  );
  const shell = componentSource("article-shell.tsx");
  assert.ok(
    shell.includes("Narrator") && shell.includes("entry.audio"),
    "ADR-033 — rama nu montează Naratorul cu integrala din setul complet"
  );
  const narrator = componentSource("narrator.tsx");
  assert.ok(
    narrator.includes("ArticleAudio") && narrator.includes("src ?"),
    "ADR-033 — Naratorul nu randează player-ul condiționat de integrală"
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

test("ADR-033: lipirea feliilor păstrează separatorul — alinierea multi-felie adresează textul vorbit", () => {
  const long = "Prima secțiune spune ceva destul de lung încât să nu încapă. ".repeat(80).trim();
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

test("ADR-028: numele secțiunii se rostește doar dacă primul beat nu începe cu cuvintele lui", () => {
  const sec = (title: string, first: string) => ({ title, beats: [{ text: first, images: [] }] });
  assert.equal(
    speaksSectionTitle(sec("Stai să-ți zic!", "Și stai să-ți zic: nu stă în sertar.")),
    true
  );
  assert.equal(
    speaksSectionTitle(sec("Stai să-ți zic!", "Stai să-ți zic: azi e 1 martie.")),
    false
  );
  const taggedBeat: { text: string; images: string[]; voce?: string } = {
    text: "Și azi, pe 1 martie…",
    images: [],
  };
  taggedBeat.voce = "[curious] Și azi, pe 1 martie…";
  const tagged = { title: "Și azi?", beats: [taggedBeat] };
  assert.equal(speaksSectionTitle(tagged), false, "tagul, virgula și majuscula nu contează");
  assert.equal(speaksSectionTitle(sec("Pana strâmbă", "Acum partea ciudată.")), true);
  assert.equal(speaksSectionTitle({ title: "Pana strâmbă", beats: [] }), true);
});

test("ADR-028: integrala = titlul + [numele, când se rostește] + beat-urile, blocuri separate", () => {
  const article = {
    title: "Titlu",
    sections: [
      {
        id: "a",
        title: "S1",
        beats: [
          { text: "b1", images: [] },
          { text: "b2", images: [] },
        ],
        questions: [],
      },
      { id: "b", title: "S2", beats: [{ text: "S2 și b3", images: [] }], questions: [] },
    ],
  } as unknown as Article;
  assert.equal(articleAudioSpec(article).text, "Titlu\n\nS1\n\nb1 b2\n\nS2 și b3");
});

test("ADR-033: pragul feliei e 4500 (limita v3 e 5000); identitatea are forma <hash16>.mp3 + alinierea ei", () => {
  assert.equal(MAX_REQUEST_CHARS, 4500);
  const article = {
    title: "T",
    sections: [
      { id: "a", title: "S", beats: [{ text: "La masă ai zeamă.", images: [] }], questions: [] },
    ],
  } as unknown as Article;
  const spec = articleAudioSpec(article);
  assert.match(spec.file, /^[0-9a-f]{16}\.mp3$/);
  assert.equal(spec.alignmentFile, spec.file.replace(/\.mp3$/, ".alignment.json"));
});

/** Fluxurile fișierului, prin ffprobe (dependență a legii, ca ffmpeg la stinguri). */
function probeStream(file: string): Record<string, string> {
  const run = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_name,channels,sample_rate,bit_rate",
      "-of",
      "default=nw=1",
      file,
    ],
    { encoding: "utf8" }
  );
  assert.equal(run.status, 0, `ffprobe a eșuat pe ${file}: ${run.stderr}`);
  return Object.fromEntries(
    run.stdout
      .trim()
      .split("\n")
      .map((line) => line.split("=") as [string, string])
  );
}

test("ADR-032: episodul e masterizat la nivelul podcasturilor — −16 LUFS ±1, vârf ≤ −1 dBTP, mono 44,1 kHz mp3 128k", () => {
  for (const slug of slugsWithAudio()) {
    const article = JSON.parse(readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8")) as Article;
    const file = join(AUDIO_ROOT, slug, episodeSpec(article, articleAudioSpec(article).file).file);
    assert.ok(existsSync(file), `ADR-032 — ${slug}: episodul lipsește (${file})`);
    const lufs = measureLoudness(file);
    assert.ok(
      Math.abs(lufs - EPISODE_MASTER.lufs) <= 1,
      `ADR-032 — ${slug}: episodul măsoară ${lufs} LUFS, ținta e ${EPISODE_MASTER.lufs} ± 1`
    );
    const peak = measureTruePeak(file);
    assert.ok(
      peak <= EPISODE_MASTER.truePeak,
      `ADR-032 — ${slug}: vârful e ${peak} dBTP, plafonul e ${EPISODE_MASTER.truePeak}`
    );
    const stream = probeStream(file);
    assert.equal(stream.codec_name, "mp3");
    assert.equal(stream.channels, "1", "episodul e mono");
    assert.equal(stream.sample_rate, "44100");
    assert.ok(
      Math.abs(Number(stream.bit_rate) - 128000) < 2000,
      `bitrate ${stream.bit_rate}, așteptat 128k`
    );
  }
});

test("ADR-032: coada episodului = introducerea + ultima întrebare a articolului + invitația + replica de închidere", () => {
  const article = {
    title: "T",
    sections: [
      {
        id: "a",
        title: "S1",
        beats: [{ text: "b1", images: [] }],
        questions: [{ question: "Prima?", answer: "x" }],
      },
      {
        id: "b",
        title: "S2",
        beats: [{ text: "b2", images: [] }],
        questions: [
          { question: "Penultima?", answer: "y" },
          { question: "Ce face râul Răut?", answer: "o buclă" },
        ],
      },
    ],
  } as unknown as Article;
  assert.equal(lastQuestion(article), "Ce face râul Răut?");
  assert.equal(
    episodeTailText(article),
    `${EPISODE_TAIL.intro} Ce face râul Răut? … ${EPISODE_TAIL.invite} ${EPISODE_TAIL.closing}`
  );
});

test("ADR-032: lastQuestion are o singură casă — compoziția video o importă, nu o redefinește", () => {
  const compose = readFileSync(join(process.cwd(), "scripts/video/compose.ts"), "utf8");
  assert.ok(!compose.includes("function lastQuestion"), "compose.ts redefinește lastQuestion");
  assert.ok(
    compose.includes("lastQuestion"),
    "compose.ts nu folosește lastQuestion din audio-naming"
  );
});
