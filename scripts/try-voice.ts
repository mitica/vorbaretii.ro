/**
 * Proba vocii (ADR-033): același text, N take-uri cu corpul cererii articolelor,
 * scrise în out-audio/ (negit-uit) pentru urechea operatorului — v3 nu e
 * determinist, o pronunție greșită e aleatoare; proba arată variația înainte de
 * un re-take pe integrală (ștergere, apoi regenerare). Nicio scriere în repo.
 *
 *   yarn try-voice "<text>" [take-uri, implicit 3]
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ARTICLE_AUDIO_FORMAT } from "../app/articole/audio-naming";
import { articleRequestBody, ttsRequest } from "./lib/elevenlabs";

const OUT_DIR = join(__dirname, "../out-audio");

async function main(): Promise<void> {
  const [text, takesRaw] = process.argv.slice(2);
  if (!text) throw new Error('folosire: yarn try-voice "<text>" [take-uri]');
  const takes = Math.max(1, Number(takesRaw ?? 3));
  mkdirSync(OUT_DIR, { recursive: true });
  const stem = createHash("sha256").update(text).digest("hex").slice(0, 8);
  for (let take = 1; take <= takes; take += 1) {
    const response = await ttsRequest(
      `?output_format=${ARTICLE_AUDIO_FORMAT}`,
      articleRequestBody(text)
    );
    const file = join(OUT_DIR, `take-${stem}-${take}.mp3`);
    writeFileSync(file, Buffer.from(await response.arrayBuffer()));
    console.log(file);
  }
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
