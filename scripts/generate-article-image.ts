/**
 * Generatorul imaginilor de articol — casa unică a stilului. Apelantul trimite
 * DOAR scena: subiectul numit pe numele lui real (persoană, clădire, loc — cu
 * vârsta/epoca din context), niciodată înfățișări inventate; modelul de imagini
 * cunoaște subiecții reali și le ține trăsăturile consecvente între imagini.
 * Stilul, paleta și aspectul unic (16:9, cadrul video — toate imaginile au
 * aceeași mărime) sunt ale scriptului; mascota NU apare în ilustrații
 * (element animat separat, la etapa video).
 *
 *   yarn generate-article-image <slug> <ancora> "<scena>" [stil]
 *
 * `stil` e opțional: numele unei intrări din registrul STYLES (absent =
 * DEFAULT_STYLE). Un stil nou = O intrare în STYLES, atât.
 * Scrie assets/images/articol-<slug>-<ancora>.jpg și tipărește promptul folosit
 * (intră în corpul PR-ului). După orice raster nou: yarn compress-images.
 */

import "dotenv/config";
import { writeFileSync } from "fs";
import { join } from "path";

/**
 * Registrul stilurilor — UN singur loc: un stil nou = o intrare aici (cheia =
 * numele primit de CLI/skill). Niciun stil nu impune elemente culturale —
 * elementele românești apar doar când subiectul scenei le cere, modelul le
 * știe din context.
 */
export const STYLES: Record<string, string> = {
  "hartie-decupata":
    "Layered cut-paper illustration, bright and cheerful: crisp flat shapes cut from colorful textured paper, visible paper grain, gentle layered depth with soft shadows, no dark outlines. Sunny warm light and a vivid palette — fresh blues, spring greens, warm reds, golden yellows on a light cream ground. Faces simple and naturally proportioned, rendered in the same cut-paper language as the rest of the scene — no Disney-style big-eyed cartoon faces, no cute doll faces. Clearly readable for children — never gloomy, never washed-out.",
};

/** Stilul implicit când apelul nu numește unul. */
export const DEFAULT_STYLE = "hartie-decupata";
const IDENTITY =
  "Depict named real people, buildings and places faithful to their historically documented appearance and canonical portraits — recognizable and consistent across images, never generic invented characters. When the scene lists documented appearance details (face, hair, beard, dress), follow them exactly.";
const SUFFIX = "No text, no gore.";

/**
 * Mărimea și aspectul sunt PARAMETRI API, nu proză în prompt: toate imaginile
 * ies identice — 16:9 la rezoluția 2k (2816×1584, peste cadrul YouTube Full HD
 * 1920×1080). API-ul acceptă doar `1k`/`2k`; `4k` și `size` nu există.
 */
export const ASPECT = "16:9";
export const RESOLUTION = "2k";

// Personajul-mascotă NU apare în ilustrații — element animat separat, la etapa
// video (decizia operatorului); testul de respingere veghează.
export function buildPrompt(scene: string, style: string = DEFAULT_STYLE): string {
  const styleText = STYLES[style];
  if (!styleText)
    throw new Error(`stil necunoscut "${style}" — stiluri: ${Object.keys(STYLES).join(", ")}`);
  return `${styleText} ${IDENTITY} Scene: ${scene} ${SUFFIX}`;
}

async function callApi(prompt: string): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY lipsă din .env");
  const model = process.env.XAI_IMAGE_MODEL ?? "grok-imagine-image-2.0";
  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      response_format: "b64_json",
      aspect_ratio: ASPECT,
      resolution: RESOLUTION,
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`xAI HTTP ${response.status}: ${text.slice(0, 300)}`);
  const image: unknown = JSON.parse(text).data?.[0]?.b64_json;
  if (typeof image !== "string") throw new Error("răspuns xAI fără b64_json");
  return image;
}

/** Retry per imagine (nu per articol): 3 încercări, apoi eroarea ultimei. */
async function withRetry(attempt: () => Promise<string>): Promise<string> {
  let lastError: unknown;
  for (let round = 1; round <= 3; round++) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      console.error(`încercarea ${round} a eșuat: ${String(error)}`);
    }
  }
  throw lastError;
}

async function main(): Promise<void> {
  const [slug, anchor, scene, style] = process.argv.slice(2);
  if (!slug || !anchor || !scene)
    throw new Error('folosire: yarn generate-article-image <slug> <ancora> "<scena>" [stil]');
  const prompt = buildPrompt(scene, style);
  const image = await withRetry(() => callApi(prompt));
  const file = join(__dirname, "..", "assets", "images", `articol-${slug}-${anchor}.jpg`);
  writeFileSync(file, Buffer.from(image, "base64"));
  console.log(`prompt: ${prompt}`);
  console.log(`scris ${file}`);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(String(error));
    process.exit(1);
  });
}
