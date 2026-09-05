/**
 * Generatorul stingurilor de marcă (ADR-030): variantele fiecărui rol dintr-o
 * rulare — două de întâmpinare, două de încheiere — prin efectele sonore
 * ElevenLabs, nivelate la `STING_LOUDNESS` și scrise în
 * assets/audio/brand/sting-<rol>-<n>.mp3; operatorul alege câte una la poartă;
 * cele alese devin sting-intro.mp3 / sting-outro.mp3 (compoziția), celelalte se
 * șterg. Cheia din .env; lipsă → oprire onestă.
 *
 *   yarn generate-sting
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { soundRequest } from "./lib/elevenlabs";
import { withRetry } from "./retry";
import { STINGS, STING_LOUDNESS } from "./video/config";
import { levelTo } from "./lib/loudness";
import { STING_PROMPTS, stingRequestBody, type StingRole } from "./video/sting";

const OUT_DIR = join(__dirname, "../assets/audio/brand");

async function generate(role: StingRole, index: number, prompt: string): Promise<string> {
  const body = stingRequestBody(prompt, STINGS[role].seconds);
  const response = await withRetry(() => soundRequest(body));
  const file = join(OUT_DIR, `sting-${role}-${index}.mp3`);
  writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  const gain = levelTo(file, STING_LOUDNESS.lufs);
  console.log(
    `nivelat ${file} la ${STING_LOUDNESS.lufs} LUFS (${gain > 0 ? "+" : ""}${gain.toFixed(1)} dB)`
  );
  return file;
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const role of Object.keys(STING_PROMPTS) as StingRole[])
    for (const [i, prompt] of STING_PROMPTS[role].entries()) {
      const file = await generate(role, i + 1, prompt);
      console.log(`scris ${file} — „${prompt}”`);
    }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
