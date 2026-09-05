/**
 * Generatorul stingurilor de marcă (ADR-030): variantele fiecărui rol dintr-o
 * rulare — cel puțin două de întâmpinare, cel puțin două de încheiere — prin
 * efectele sonore ElevenLabs, nivelate la `STING_LOUDNESS` și scrise în
 * assets/audio/brand/sting-<rol>-<n>.mp3; operatorul alege câte una la poartă;
 * cele alese devin sting-intro.mp3 / sting-outro.mp3 (compoziția), celelalte se
 * șterg. Cheia din .env; lipsă → oprire onestă.
 *
 *   yarn generate-sting [<slug>] [--doar-previzualizari]
 *
 * Cu un slug: după variante, o previzualizare per variantă — fereastra de la
 * începutul filmului (salutul) sau de la sfârșit (rămas-bunul), randată de
 * compozitorul real cu varianta drept sting — în out-video/<slug>.sting-<rol>-<n>.mp4,
 * ca alegerea să se facă auzind-o în film (operatorul, 2026-09-05).
 * `--doar-previzualizari` sare generarea și folosește variantele de pe disc.
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { soundRequest } from "./lib/elevenlabs";
import { levelTo } from "./lib/loudness";
import { withRetry } from "./retry";
import { renderVideo } from "./video/compose";
import { STINGS, STING_LOUDNESS, STING_PREVIEW } from "./video/config";
import { filmLength } from "./video/film";
import { loadFilmSources } from "./video/sources";
import {
  STING_PROMPTS,
  previewName,
  previewWindow,
  stingRequestBody,
  variantFile,
  type StingRole,
} from "./video/sting";

const OUT_DIR = join(__dirname, "../assets/audio/brand");
const PREVIEW_DIR = join(__dirname, "../out-video");
const ONLY_PREVIEWS = "--doar-previzualizari";
const USAGE = `folosire: yarn generate-sting [<slug>] [${ONLY_PREVIEWS}]`;
const ROLES = Object.keys(STING_PROMPTS) as StingRole[];

async function generate(role: StingRole, index: number, prompt: string): Promise<string> {
  const body = stingRequestBody(prompt, STINGS[role].seconds);
  const response = await withRetry(() => soundRequest(body));
  const file = join(OUT_DIR, variantFile(role, index));
  writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  const gain = levelTo(file, STING_LOUDNESS.lufs);
  console.log(
    `nivelat ${file} la ${STING_LOUDNESS.lufs} LUFS (${gain > 0 ? "+" : ""}${gain.toFixed(1)} dB)`
  );
  return file;
}

async function generateAll(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const role of ROLES)
    for (const [i, prompt] of STING_PROMPTS[role].entries()) {
      const file = await generate(role, i + 1, prompt);
      console.log(`scris ${file} — „${prompt}”`);
    }
}

/** O previzualizare per variantă: fereastra rolului, cu varianta drept sting (celălalt rol nu se aude în fereastră). */
async function previewAll(slug: string): Promise<void> {
  const sources = loadFilmSources(slug);
  const seconds = filmLength(sources.timeline);
  mkdirSync(PREVIEW_DIR, { recursive: true });
  for (const role of ROLES)
    for (let index = 1; index <= STING_PROMPTS[role].length; index++) {
      const variant = join(OUT_DIR, variantFile(role, index));
      if (!existsSync(variant)) throw new Error(`varianta lipsește (${variant}) — generează întâi`);
      const outPath = join(PREVIEW_DIR, previewName(slug, role, index));
      const frames = await renderVideo({
        ...sources,
        slug,
        stingPaths: { intro: variant, outro: variant },
        outPath,
        window: previewWindow(role, seconds, STING_PREVIEW.seconds),
      });
      console.log(`previzualizare ${outPath} (${frames} cadre)`);
    }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => a.startsWith("--") && a !== ONLY_PREVIEWS);
  if (unknown.length > 0) throw new Error(`argument necunoscut ${unknown.join(" ")} — ${USAGE}`);
  const onlyPreviews = args.includes(ONLY_PREVIEWS);
  const slug = args.find((a) => !a.startsWith("--"));
  if (onlyPreviews && !slug) throw new Error(`${ONLY_PREVIEWS} cere slug-ul — ${USAGE}`);
  if (!onlyPreviews) await generateAll();
  if (slug) await previewAll(slug);
  else
    console.log(
      "previzualizări: dă slug-ul unui articol cu audio și mastere (yarn generate-sting <slug>)"
    );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
