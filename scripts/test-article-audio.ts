/**
 * Legea audio (ADR-013): un articol are audio COMPLET (titlu + fiecare
 * secțiune, fără bucăți străine) sau deloc; fiecare bucată ține bugetul;
 * player-ul încarcă doar la cerere și apare doar cu set complet. Corpusul
 * fără audio trece vid — audio-ul e opt-in per articol.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Article } from "../app/articole/content/schema";
import { articleAudioPieces } from "../app/articole/audio-naming";

const AUDIO_ROOT = join(process.cwd(), "public/assets/audio/articole");
const CONTENT_DIR = join(process.cwd(), "app/articole/content");
const MAX_PIECE_BYTES = 1.5 * 1024 * 1024;

function slugsWithAudio(): string[] {
  if (!existsSync(AUDIO_ROOT)) return [];
  return readdirSync(AUDIO_ROOT).filter((entry) => statSync(join(AUDIO_ROOT, entry)).isDirectory());
}

function expectedPieces(slug: string): string[] {
  const jsonPath = join(CONTENT_DIR, `${slug}.json`);
  assert.ok(
    existsSync(jsonPath),
    `ADR-013 — audio ORFAN: directorul "${slug}" există sub public/assets/audio/articole/, dar articolul nu — ștergerea trebuie să măture și audio-ul`
  );
  const raw = readFileSync(jsonPath, "utf8");
  const article = JSON.parse(raw) as Article;
  return articleAudioPieces(article).map((piece) => piece.file);
}

test("ADR-013: audio complet-sau-deloc — un slug cu director are exact bucățile articolului", () => {
  for (const slug of slugsWithAudio()) {
    const present = readdirSync(join(AUDIO_ROOT, slug))
      .filter((f) => f.endsWith(".mp3"))
      .sort();
    assert.deepEqual(
      present,
      expectedPieces(slug).sort(),
      `ADR-013 — articolul "${slug}": set incomplet sau bucăți străine`
    );
  }
});

test("ADR-013: fiecare bucată audio ține bugetul de 1,5MB", () => {
  for (const slug of slugsWithAudio())
    for (const f of readdirSync(join(AUDIO_ROOT, slug)))
      assert.ok(
        statSync(join(AUDIO_ROOT, slug, f)).size <= MAX_PIECE_BYTES,
        `ADR-013 — ${slug}/${f} peste bugetul de 1,5MB`
      );
});

test("ADR-013: service worker-ul nu atinge audio-ul și cererile Range", () => {
  const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
  assert.ok(
    sw.includes("/assets/audio/") && sw.includes("range"),
    "ADR-013 — sw.js fără bypass pe audio/Range: bucata regenerată n-ar mai ajunge la telefon, iar media pe iOS cere 206"
  );
});

test("ADR-013: player-ul încarcă doar la cerere și apare doar cu set complet", () => {
  const player = readFileSync(
    join(process.cwd(), "app/articole/components/article-audio.tsx"),
    "utf8"
  );
  assert.ok(player.includes('preload="none"'), "ADR-013 — player fără preload none");
  const shell = readFileSync(
    join(process.cwd(), "app/articole/components/article-shell.tsx"),
    "utf8"
  );
  assert.ok(
    shell.includes("ArticleAudio") && shell.includes("entry.audio"),
    "ADR-013 — rama nu randează player-ul condiționat de setul complet"
  );
});
