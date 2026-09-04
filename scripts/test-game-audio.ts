/**
 * Legea vocii jocurilor (ADR-020): fiecare utterance a unui joc cu voce are exact
 * audio-ul textului ei curent, într-o singură key de voce; orfanii nu se
 * servesc; fiecare fișier ține bugetul. Curiozități = submulțime (întrebările
 * vin și pleacă prin manivelele articolelor). Jocurile fără dir trec —
 * vocea e opt-in per joc, ca audio-ul per articol.
 *
 * Nucleul e pur (`checkVoice`) și se vede roșu pe fixturi; apoi rulează pe
 * discul real.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { FILE_BUDGET, VOICED_GAMES, voiceKey } from "../app/jocuri/voice/settings";
import { gameUtterances } from "../app/jocuri/voice/utterances";
import { hashId } from "../app/jocuri/content/ids";
import { readVoiceDir, checkVoice, type VoiceDir } from "./lib/voice-law";

const KEY = "key-current";
const A = hashId("Am un butoiaș cu două feluri de vin.");
const B = hashId("Oul");

function dir(files: { name: string; bytes?: number }[], keys = [KEY]): VoiceDir {
  return { keys, files: files.map((f) => ({ name: f.name, bytes: f.bytes ?? 30_000 })) };
}

test("ADR-020: set exact → verde; dir absent → verde (opt-in per joc)", () => {
  const ok = checkVoice({
    slug: "ghicitori",
    expected: [A, B],
    key: KEY,
    subset: false,
    dir: dir([{ name: `${A}.mp3` }, { name: `${B}.mp3` }]),
  });
  assert.deepEqual(ok, []);
  assert.deepEqual(
    checkVoice({
      slug: "ghicitori",
      expected: [A],
      key: KEY,
      subset: false,
      dir: null,
    }),
    []
  );
});

test("ADR-020: orphan → roșu; lipsă → roșu la jocurile normale, tolerată la submulțime", () => {
  const orphan = checkVoice({
    slug: "ghicitori",
    expected: [A],
    key: KEY,
    subset: false,
    dir: dir([{ name: `${A}.mp3` }, { name: "zzz.mp3" }]),
  });
  assert.equal(orphan.length, 1);
  assert.match(orphan[0]!, /ADR-020/);
  assert.match(orphan[0]!, /orphan/);
  const missing = checkVoice({
    slug: "ghicitori",
    expected: [A, B],
    key: KEY,
    subset: false,
    dir: dir([{ name: `${A}.mp3` }]),
  });
  assert.equal(missing.length, 1);
  assert.match(missing[0]!, /voce-jocuri ghicitori/);
  const tolerated = checkVoice({
    slug: "curiozitati",
    expected: [A, B],
    key: KEY,
    subset: true,
    dir: dir([{ name: `${A}.mp3` }]),
  });
  assert.deepEqual(tolerated, []);
});

test("ADR-020: a doua key pe disc → roșu; fișier peste buget → roșu", () => {
  const oldKey = checkVoice({
    slug: "ghicitori",
    expected: [A],
    key: KEY,
    subset: false,
    dir: dir([{ name: `${A}.mp3` }], [KEY, "key-veche"]),
  });
  assert.equal(oldKey.length, 1);
  assert.match(oldKey[0]!, /key-veche/);
  const heavy = checkVoice({
    slug: "ghicitori",
    expected: [A],
    key: KEY,
    subset: false,
    dir: dir([{ name: `${A}.mp3`, bytes: FILE_BUDGET + 1 }]),
  });
  assert.equal(heavy.length, 1);
  assert.match(heavy[0]!, /buget/);
});

test("ADR-020: rostirile fiecărui joc cu voce sunt nevide, fără dubluri, fără text gol", () => {
  for (const slug of Object.keys(VOICED_GAMES)) {
    const utterances = gameUtterances(slug);
    if (slug === "curiozitati" && utterances.length === 0) continue; // corpus gol = stare legală
    assert.ok(utterances.length > 0, `ADR-020 — ${slug}: niciun text de rostit`);
    assert.equal(
      new Set(utterances).size,
      utterances.length,
      `ADR-020 — ${slug}: utterances duplicate`
    );
    for (const r of utterances)
      assert.ok(r.trim().length > 0, `ADR-020 — ${slug}: utterance goală`);
  }
});

test("ADR-020: discul real — fiecare joc cu voce poartă exact rostirile curente, într-o singură key", () => {
  const problems: string[] = [];
  for (const slug of Object.keys(VOICED_GAMES)) {
    problems.push(
      ...checkVoice({
        slug,
        expected: gameUtterances(slug).map(hashId),
        key: voiceKey(slug),
        subset: slug === "curiozitati",
        dir: readVoiceDir(slug),
      })
    );
  }
  assert.deepEqual(problems, []);
});

/* ------------------------------------------- prezența (aserțiuni pe sursă) */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const COMPONENTS = join(process.cwd(), "app/jocuri/components");
const VOICE = join(process.cwd(), "app/jocuri/voice");
const VOICED = [
  "riddles-game",
  "wheel-game",
  "story-questions-game",
  "proverbs-game",
  "tongue-twisters-game",
  "categories-game",
  "taboo-game",
  "sell-it-game",
];
const VOICELESS = [
  "anagrams-game",
  "hidden-word-game",
  "emoji-rebus-game",
  "memory-game",
  "story-dice-game",
];

test("ADR-020: nimic nu pornește singur — Audio creat doar în handler, fără preload/autoPlay", () => {
  const context = readFileSync(join(VOICE, "context.tsx"), "utf8");
  const button = readFileSync(join(VOICE, "mascot-voice.tsx"), "utf8");
  for (const source of [context, button]) {
    assert.ok(!/autoPlay|preload/.test(source), "ADR-020 — preload/autoPlay în componentele vocii");
  }
  assert.equal(
    context.match(/new Audio\(/g)?.length,
    1,
    "ADR-020 — exact un `new Audio(`, în handler"
  );
  const handler = context.slice(context.indexOf("function startPlayback"));
  assert.ok(handler.includes("new Audio("), "ADR-020 — `new Audio(` trăiește în `startPlayback`");
  assert.ok(
    !/useEffect\([^]*?\.play\(/.test(context.slice(0, context.indexOf("function startPlayback"))),
    "ADR-020 — niciun play() în efecte"
  );
});

test("ADR-020: cele 8 jocuri cu voce raportează rostirea; cele 5 fără voce nu ating vocea", () => {
  for (const name of VOICED) {
    const source = readFileSync(join(COMPONENTS, `${name}.tsx`), "utf8");
    assert.ok(
      source.includes('from "../voice/context"'),
      `ADR-020 — ${name} nu raportează rostirea curentă`
    );
  }
  for (const name of VOICELESS) {
    const source = readFileSync(join(COMPONENTS, `${name}.tsx`), "utf8");
    assert.ok(
      !source.includes("../voice/"),
      `ADR-020 — ${name} n-are voce în design, dar atinge vocea`
    );
  }
});
