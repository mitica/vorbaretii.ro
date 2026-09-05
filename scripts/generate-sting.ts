/**
 * Generatorul stingului de marcă (ADR-030): trei variante dintr-o rulare, prin
 * efectele sonore ElevenLabs, scrise în assets/audio/brand/sting-<n>.mp3 —
 * operatorul alege una la poartă; cea aleasă devine sting.mp3 (compoziția),
 * celelalte se șterg. Cheia din .env; lipsă → oprire onestă.
 *
 *   yarn generate-sting
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { soundRequest } from "./lib/elevenlabs";
import { withRetry } from "./retry";
import { STING_PROMPTS, stingRequestBody } from "./video/sting";

const OUT_DIR = join(__dirname, "../assets/audio/brand");

async function generate(index: number, prompt: string): Promise<string> {
  const response = await withRetry(() => soundRequest(stingRequestBody(prompt)));
  const file = join(OUT_DIR, `sting-${index}.mp3`);
  writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  return file;
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [i, prompt] of STING_PROMPTS.entries()) {
    const file = await generate(i + 1, prompt);
    console.log(`scris ${file} — „${prompt}”`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
