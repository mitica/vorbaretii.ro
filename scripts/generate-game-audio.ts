/**
 * Generatorul vocii jocurilor (ADR-020): un fișier mp3 per utterance, numit
 * hashId(text), în directorul cheii de voce curente. Generează DOAR ce
 * lipsește, mătură orfanii și cheile vechi, tipărește costul înainte.
 *
 *   yarn generate-game-audio <slug|toate> [--all] [--sweep-only]
 *
 *   --all          șterge tot directorul jocului întâi (schimbarea vocii din .env)
 *   --sweep-only  fără apeluri API: doar orfanii și cheile vechi (ștergeri de articole)
 */
import { existsSync, mkdirSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AUDIO_MODEL, AUDIO_OUTPUT_FORMAT, VOICE_SETTINGS } from "../app/articole/audio-settings";
import { hashId } from "../app/jocuri/content/ids";
import { gameUtterances } from "../app/jocuri/voice/utterances";
import {
  VOICE_DIR,
  SPEED,
  VOICED_GAMES,
  voiceKey,
  requestText,
} from "../app/jocuri/voice/settings";
import { ttsRequest } from "./lib/elevenlabs";
import { withRetry } from "./retry";

type Options = { all: boolean; sweepOnly: boolean };

function parseArgs(): { slugs: string[]; options: Options } {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith("--"));
  if (!target)
    throw new Error("folosire: yarn generate-game-audio <slug|toate> [--all] [--sweep-only]");
  const slugs = target === "toate" ? Object.keys(VOICED_GAMES) : [target];
  for (const s of slugs)
    if (!(s in VOICED_GAMES))
      throw new Error(`ADR-020 — „${s}” nu e joc cu voce (vezi app/jocuri/voice/settings.ts)`);
  return {
    slugs,
    options: { all: args.includes("--all"), sweepOnly: args.includes("--sweep-only") },
  };
}

async function synthesize(text: string): Promise<Buffer> {
  const response = await ttsRequest(`?output_format=${AUDIO_OUTPUT_FORMAT}`, {
    text,
    model_id: AUDIO_MODEL,
    voice_settings: { ...VOICE_SETTINGS, speed: SPEED },
  });
  return Buffer.from(await response.arrayBuffer());
}

/** Șterge cheile vechi și, în cheia curentă, fișierele care nu mai corespund niciunei utterances. */
function sweep(root: string, key: string, expected: Set<string>): void {
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    if (entry !== key) {
      rmSync(path, { recursive: true, force: true });
      console.log(`șters (key veche): ${entry}`);
    }
  }
  const dir = join(root, key);
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir))
    if (!expected.has(name)) {
      unlinkSync(join(dir, name));
      console.log(`șters (orphan): ${name}`);
    }
}

async function generate(slug: string, options: Options): Promise<void> {
  const utterances = gameUtterances(slug);
  const key = voiceKey(slug);
  const root = join(process.cwd(), VOICE_DIR, slug);
  if (options.all) rmSync(root, { recursive: true, force: true });
  if (options.sweepOnly && !existsSync(root)) {
    console.log(`${slug}: fără dir de voce — nimic de măturat`);
    return;
  }
  const dir = join(root, key);
  mkdirSync(dir, { recursive: true });
  const missing = utterances.filter((r) => !existsSync(join(dir, `${hashId(r)}.mp3`)));
  const chars = missing.reduce((s, r) => s + requestText(slug, r).length, 0);
  console.log(
    `${slug}: ${utterances.length} utterances, ${missing.length} de generat (${chars} chars), cheia ${key}`
  );
  if (!options.sweepOnly)
    for (const utterance of missing) {
      const audio = await withRetry(() => synthesize(requestText(slug, utterance)));
      writeFileSync(join(dir, `${hashId(utterance)}.mp3`), audio);
      console.log(
        `scris ${hashId(utterance)}.mp3 (${Math.round(audio.length / 1024)}KB): ${utterance.slice(0, 60)}`
      );
    }
  sweep(root, key, new Set(utterances.map((r) => `${hashId(r)}.mp3`)));
}

async function main(): Promise<void> {
  const { slugs, options } = parseArgs();
  for (const slug of slugs) await generate(slug, options);
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
