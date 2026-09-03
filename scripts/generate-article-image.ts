/**
 * Generatorul imaginilor de articol — casa unică a stilului. Apelantul trimite
 * DOAR scena: subiectul numit pe numele lui real (persoană, clădire, loc — cu
 * vârsta/epoca din context), niciodată înfățișări inventate; modelul de imagini
 * cunoaște subiecții reali și le ține trăsăturile consecvente între imagini.
 * Stilul, paleta, gaița eroului și aspectul per rol sunt ale scriptului.
 *
 *   yarn generate-article-image <slug> <ancora> "<scena>"
 *
 * Scrie assets/images/articol-<slug>-<ancora>.jpg și tipărește promptul folosit
 * (intră în corpul PR-ului). După orice raster nou: yarn compress-images.
 */

import "dotenv/config";
import { writeFileSync } from "fs";
import { join } from "path";

const STYLE = "Flat playful children's-book illustration, warm light, soft rounded shapes.";
const IDENTITY =
  "Depict named real people, buildings and places with their known, historically documented appearance — recognizable and consistent across images, never generic invented characters.";
const PALETTE =
  "Palette: soft lavender-to-white background with pink (#db2777) and indigo (#4f46e5) accents.";
const JAY =
  "Hidden somewhere in the scene, tiny and easy to miss, a small cheeky Eurasian jay with a striped blue wing patch and a messy crest.";
const SUFFIX = "No text, no gore.";

export function aspectFor(anchor: string): "3:2" | "16:9" {
  return anchor === "erou" ? "3:2" : "16:9";
}

export function buildPrompt(anchor: string, scene: string): string {
  const jay = anchor === "erou" ? ` ${JAY}` : "";
  return `${STYLE} ${IDENTITY} Scene: ${scene} ${PALETTE}${jay} ${SUFFIX} Aspect ratio ${aspectFor(anchor)}.`;
}

async function callApi(prompt: string, aspect: string): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY lipsă din .env");
  const model = process.env.XAI_IMAGE_MODEL ?? "grok-imagine-image-2.0";
  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, response_format: "b64_json", aspect_ratio: aspect }),
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
  const [slug, anchor, scene] = process.argv.slice(2);
  if (!slug || !anchor || !scene)
    throw new Error('folosire: yarn generate-article-image <slug> <ancora> "<scena>"');
  const prompt = buildPrompt(anchor, scene);
  const image = await withRetry(() => callApi(prompt, aspectFor(anchor)));
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
