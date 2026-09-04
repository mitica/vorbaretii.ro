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
import { withRetry } from "./retry";

/**
 * Registrul stilurilor — UN singur loc: un stil nou = o intrare aici (cheia =
 * numele primit de CLI/skill). Niciun stil nu impune elemente culturale —
 * elementele românești apar doar când subiectul scenei le cere, modelul le
 * știe din context.
 */
export const STYLES: Record<string, string> = {
  "hartie-decupata":
    "Layered cut-paper illustration, bright and cheerful: crisp flat shapes cut from colorful textured paper, visible paper grain, gentle layered depth with soft shadows, no dark outlines. Sunny warm light and a vivid palette — fresh blues, spring greens, warm reds, golden yellows on a light cream ground. Faces simple and naturally proportioned, rendered in the same cut-paper language as the rest of the scene — no Disney-style big-eyed cartoon faces, no cute doll faces. Clearly readable for children — never gloomy, never washed-out.",
  plastilina:
    "Claymation stop-motion illustration, bright and cheerful: characters and scenery hand-modeled from colorful plasticine clay, soft clay texture with subtle fingerprints, gently rounded sculpted forms, a real miniature film-set depth with soft studio light and gentle shadows. Sunny warm mood and a vivid palette — fresh blues, spring greens, warm reds, golden yellows on a light cream ground. Faces simple and naturally proportioned, sculpted in the same clay language as the rest of the scene — no Disney-style big-eyed cartoon faces, no cute doll faces. Clearly readable for children — never gloomy, never washed-out.",
  "fire-de-nisip":
    "Sand-sculpture stop-motion illustration, bright and cheerful: characters and scenery shaped as distinct three-dimensional figures with clear crisp silhouettes, exactly like a claymation film set — but built entirely from packed colored sand and fine powder instead of clay: visibly granular surfaces, powdery crumbling edges, delicate trails of stray grains around every figure, the feeling that a single breath of air would scatter them. A real miniature film-set depth with soft studio light and gentle shadows. Sunny warm mood and a vivid palette — fresh blues, spring greens, warm reds, golden yellows on a light cream ground. Faces simple and naturally proportioned, shaped in the same sand language as the rest of the scene — no Disney-style big-eyed cartoon faces, no cute doll faces. Clearly readable for children — never gloomy, never washed-out.",
  "smalt-de-lut":
    "Glazed-pottery illustration, bright and cheerful: the entire scene painted in liquid ceramic glaze on a warm fired-clay surface — flowing slip-trailed lines, swirled wet-on-wet colour blends, a glossy kiln-fired shine with a faint fine crackle, the warm terracotta ground showing through at the edges of every shape. Vivid palette of cream, honey gold, spring green, deep blue and warm red over terracotta. Faces simple and naturally proportioned, painted in the same flowing glaze language as the rest of the scene — no Disney-style big-eyed cartoon faces, no cute doll faces. Clearly readable for children — never gloomy, never washed-out.",
  "vorbaretii":
    "Flat vector illustration in the Vorbăreții house style, bright and playful: every figure and object built from a few bold geometric shapes — thick chunky rounded forms, one continuous silhouette per character, zero texture, no outlines, solid colour fills with soft same-hue shading, silhouettes readable even at icon size; clean uncluttered background with generous negative space. Faces simple and calm: large round friendly eyes with tiny highlights, small brows, small mouths — never Disney-glossy, never doll-like. Palette of the house: deep Voroneț blue (#3E4394) as the dominant colour, sky blue (#81C5F4) for light areas and skies, a single magenta-pink accent (#FF66A6) used sparingly, golden yellow (#FFC526) for warm touches, all on a light cream ground (#FBF3E4) with soft blue shadows. Slightly mischievous mood. Clearly readable for children — never gloomy, never washed-out.",
  "vector-plat":
    "Flat vector illustration in a modern app style, bright and cheerful: bold simplified shapes with smooth clean edges, solid saturated colour fills with subtle same-hue shading, no outlines, generous rounded forms and chunky playful proportions, clean uncluttered background with plenty of negative space. Characters with simple minimal faces — small dot-like eyes, light simple expressions — no Disney-style big-eyed cartoon faces, no cute doll faces. Vivid palette — fresh blues, spring greens, warm reds, golden yellows on a light cream ground. Clearly readable for children — never gloomy, never washed-out.",
};

/** Stilul implicit când apelul nu numește unul. */
export const DEFAULT_STYLE = "vector-plat";
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
