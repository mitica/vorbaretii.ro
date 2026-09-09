/**
 * Legea vocii jocurilor (ADR-043, succesoarea ADR-020): fiecare joc cu voce
 * poartă audio-ul textelor ei curente, într-o singură key de voce; orfanii nu
 * se servesc; fiecare fișier ține bugetul. NOU (ADR-043): rostirea fără
 * fișier e legală — element mut — pentru ORICE joc, nu doar curiozitățile.
 * Jocurile fără dir trec — vocea e opt-in per joc, ca audio-ul per articol.
 *
 * Nucleul e pur (`checkVoice`) și se vede roșu pe fixturi; apoi rulează pe
 * discul real. `availableUtterances` (mulțimea servită paginii la build) are
 * propriile fixturi, pe disc temporar.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  FILE_BUDGET,
  VOICE_DIR,
  VOICED_GAMES,
  audioPath,
  voiceKey,
} from "../app/jocuri/voice/settings";
import { gameUtterances } from "../app/jocuri/voice/utterances";
import { availableUtterances } from "../app/jocuri/voice/available";
import { hashId } from "../app/jocuri/content/ids";
import { readVoiceDir, checkVoice, type VoiceDir } from "./lib/voice-law";

const KEY = "key-current";
const A = hashId("Am un butoiaș cu două feluri de vin.");
const B = hashId("Oul");

function dir(files: { name: string; bytes?: number }[], keys = [KEY]): VoiceDir {
  return { keys, files: files.map((f) => ({ name: f.name, bytes: f.bytes ?? 30_000 })) };
}

test("ADR-043: set exact → verde; dir absent → verde (opt-in per joc)", () => {
  const ok = checkVoice({
    slug: "ghicitori",
    expected: [A, B],
    key: KEY,
    dir: dir([{ name: `${A}.mp3` }, { name: `${B}.mp3` }]),
  });
  assert.deepEqual(ok, []);
  assert.deepEqual(
    checkVoice({
      slug: "ghicitori",
      expected: [A],
      key: KEY,
      dir: null,
    }),
    []
  );
});

test("ADR-043: orphan → roșu; rostirea fără fișier e legală, pentru orice joc (element mut)", () => {
  const orphan = checkVoice({
    slug: "ghicitori",
    expected: [A],
    key: KEY,
    dir: dir([{ name: `${A}.mp3` }, { name: "zzz.mp3" }]),
  });
  assert.equal(orphan.length, 1);
  assert.match(orphan[0]!, /ADR-043/);
  assert.match(orphan[0]!, /orphan/);
  assert.match(orphan[0]!, /voce-jocuri ghicitori/);
  // ADR-043: un joc „normal" (nu doar curiozitățile) tolerează lipsa —
  // elementul rămâne mut, nu roșu.
  const missing = checkVoice({
    slug: "ghicitori",
    expected: [A, B],
    key: KEY,
    dir: dir([{ name: `${A}.mp3` }]),
  });
  assert.deepEqual(missing, []);
});

test("ADR-043: a doua key pe disc → roșu; fișier peste buget → roșu", () => {
  const oldKey = checkVoice({
    slug: "ghicitori",
    expected: [A],
    key: KEY,
    dir: dir([{ name: `${A}.mp3` }], [KEY, "key-veche"]),
  });
  assert.equal(oldKey.length, 1);
  assert.match(oldKey[0]!, /ADR-043/);
  assert.match(oldKey[0]!, /key-veche/);
  const heavy = checkVoice({
    slug: "ghicitori",
    expected: [A],
    key: KEY,
    dir: dir([{ name: `${A}.mp3`, bytes: FILE_BUDGET + 1 }]),
  });
  assert.equal(heavy.length, 1);
  assert.match(heavy[0]!, /ADR-043/);
  assert.match(heavy[0]!, /buget/);
});

test("ADR-043: rostirile fiecărui joc cu voce sunt nevide, fără dubluri, fără text gol", () => {
  for (const slug of Object.keys(VOICED_GAMES)) {
    const utterances = gameUtterances(slug);
    if (slug === "curiozitati" && utterances.length === 0) continue; // corpus gol = stare legală
    assert.ok(utterances.length > 0, `ADR-043 — ${slug}: niciun text de rostit`);
    assert.equal(
      new Set(utterances).size,
      utterances.length,
      `ADR-043 — ${slug}: utterances duplicate`
    );
    for (const r of utterances)
      assert.ok(r.trim().length > 0, `ADR-043 — ${slug}: utterance goală`);
    const hashes = utterances.map(hashId);
    assert.equal(
      new Set(hashes).size,
      hashes.length,
      `ADR-043 — ${slug}: două rostiri cu același hash`
    );
  }
});

test("ADR-043: URL-ul servit și directorul de pe disc sunt același loc", () => {
  const url = audioPath("ghicitori", "Oul");
  assert.ok(
    url.startsWith("/assets/audio/jocuri/ghicitori/"),
    "ADR-043 — URL-ul nu e sub /assets/audio/jocuri"
  );
  assert.ok(
    VOICE_DIR.endsWith("public/assets/audio/jocuri"),
    "ADR-043 — directorul nu e sub public/assets/audio/jocuri"
  );
});

test("ADR-043: citirea discului vede cheile și fișierele cheii cerute", () => {
  const root = mkdtempSync(join(tmpdir(), "voce-"));
  const slug = "proba-disc";
  mkdirSync(join(root, VOICE_DIR, slug, "cheie-noua"), { recursive: true });
  mkdirSync(join(root, VOICE_DIR, slug, "cheie-veche"), { recursive: true });
  writeFileSync(join(root, VOICE_DIR, slug, "cheie-noua", `${A}.mp3`), Buffer.alloc(10));
  const before = process.cwd();
  process.chdir(root);
  try {
    assert.equal(readVoiceDir("altul"), null, "fără director = null");
    const dir = readVoiceDir(slug, "cheie-noua");
    assert.deepEqual(dir?.keys.sort(), ["cheie-noua", "cheie-veche"]);
    assert.deepEqual(dir?.files, [{ name: `${A}.mp3`, bytes: 10 }]);
  } finally {
    process.chdir(before);
    rmSync(root, { recursive: true, force: true });
  }
});

test("ADR-043: discul real — niciun joc cu voce n-are orfan sau key veche", () => {
  const problems: string[] = [];
  for (const slug of Object.keys(VOICED_GAMES)) {
    problems.push(
      ...checkVoice({
        slug,
        expected: gameUtterances(slug).map(hashId),
        key: voiceKey(slug),
        dir: readVoiceDir(slug, voiceKey(slug)),
      })
    );
  }
  assert.deepEqual(problems, []);
});

test("ADR-043: availableUtterances — fișierul de pe disc intră în mulțime, cel lipsă nu", () => {
  const root = mkdtempSync(join(tmpdir(), "voce-disponibile-"));
  const slug = "proba-disponibile";
  const keyDir = join(root, VOICE_DIR, slug, voiceKey(slug));
  mkdirSync(keyDir, { recursive: true });
  writeFileSync(join(keyDir, `${A}.mp3`), Buffer.alloc(10));
  const before = process.cwd();
  process.chdir(root);
  try {
    const available = availableUtterances(slug);
    assert.deepEqual([...available], [A]);
    assert.equal(available.has(B), false, "ADR-043 — rostirea fără fișier nu intră în mulțime");
  } finally {
    process.chdir(before);
    rmSync(root, { recursive: true, force: true });
  }
});

test("ADR-043: availableUtterances — joc fără director → mulțime goală", () => {
  const root = mkdtempSync(join(tmpdir(), "voce-disponibile-"));
  const before = process.cwd();
  process.chdir(root);
  try {
    assert.deepEqual([...availableUtterances("altul")], []);
  } finally {
    process.chdir(before);
    rmSync(root, { recursive: true, force: true });
  }
});

/* ------------------------------------------- prezența (aserțiuni pe sursă) */

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

test("ADR-043: nimic la încărcare — elementul audio se creează la prima atingere, fără preload/autoPlay", () => {
  const context = readFileSync(join(VOICE, "context.tsx"), "utf8");
  const button = readFileSync(join(VOICE, "mascot-voice.tsx"), "utf8");
  for (const source of [context, button]) {
    assert.ok(!/autoPlay|preload/.test(source), "ADR-043 — preload/autoPlay în componentele vocii");
  }
  assert.equal(
    context.match(/new Audio\(/g)?.length,
    1,
    "ADR-043 — exact un `new Audio(`, în deblocare"
  );
  const unlock = context.slice(
    context.indexOf("const unlock"),
    context.indexOf("useEffect(() => {\n    window.addEventListener")
  );
  assert.ok(unlock.includes("new Audio("), "ADR-043 — `new Audio(` trăiește în `unlock`");
  assert.ok(
    context.includes('"pointerdown", unlock, { once: true'),
    "ADR-043 — deblocarea e legată de prima atingere"
  );
  assert.ok(
    context.includes("loadJson<unknown>(SETTING_KEY, true)"),
    "ADR-043 — vocea e pornită implicit, setarea în memoria locală"
  );
  assert.ok(
    context.includes('typeof stored === "boolean"'),
    "ADR-043 — setarea citită din memoria locală se coerce, nu se crede pe cuvânt"
  );
});

test("ADR-043: cele 8 jocuri cu voce raportează rostirea; cele 5 fără voce nu ating vocea", () => {
  for (const name of VOICED) {
    const source = readFileSync(join(COMPONENTS, `${name}.tsx`), "utf8");
    assert.ok(
      source.includes('from "../voice/context"') && source.includes("useUtterance("),
      `ADR-043 — ${name} nu raportează rostirea curentă`
    );
  }
  for (const name of VOICELESS) {
    const source = readFileSync(join(COMPONENTS, `${name}.tsx`), "utf8");
    assert.ok(
      !source.includes("../voice/"),
      `ADR-043 — ${name} n-are voce în design, dar atinge vocea`
    );
  }
});
