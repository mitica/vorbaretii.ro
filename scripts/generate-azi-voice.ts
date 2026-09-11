/**
 * Generatorul rostirilor de MARCĂ ale ritualului (ADR-047): cele zece punți fixe
 * ale episodului — salutul, invitația, rămas-bunul — rostite O DATĂ și comise ca
 * asset. De-aia ziua nu costă niciun apel: episodul de mâine lipește punțile
 * comise de rostirile jocurilor, la fel de comise.
 *
 *   yarn generate-azi-voice
 *
 * Generează DOAR ce lipsește, tipărește costul înainte de primul apel și mătură
 * la final cheile vechi și orfanii din cheia curentă: o voce re-acordată își ia
 * cheie nouă, iar punțile vechi pleacă de pe disc în aceeași rulare — altfel
 * episodul ar suna din două guri.
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AUDIO_MODEL, VOICE_SETTINGS } from "../app/articole/audio-settings";
import { RITUAL_LINES } from "../app/azi/episode";
import { hashId } from "../app/jocuri/content/ids";
import {
  BRAND_VOICE_DIR,
  SPEED,
  VOICE_SOURCE_FORMAT,
  baseVoiceKey,
} from "../app/jocuri/voice/settings";
import { polish } from "./lib/audio-quality";
import { ttsRequest } from "./lib/elevenlabs";
import { withRetry } from "./retry";

/** Fișierul unei rostiri: identitatea ei e TEXTUL, deci un rând editat cere fișier nou. */
const fileOf = (line: string): string => `${hashId(line)}.mp3`;

/**
 * Sursa cerută vocii, la formatul de sursă (192), nu la cel servit: lanțul are
 * exact două generații cu pierderi, iar a doua o face lustruirea.
 */
async function requestVoice(line: string): Promise<Buffer> {
  const response = await ttsRequest(`?output_format=${VOICE_SOURCE_FORMAT}`, {
    text: line,
    model_id: AUDIO_MODEL,
    voice_settings: { ...VOICE_SETTINGS, speed: SPEED },
  });
  return Buffer.from(await response.arrayBuffer());
}

/**
 * O rostire, de la cerere la fișierul servit. Sursa la 192 nu ajunge niciodată pe
 * disc lângă fișierele bune: stă într-un temporar șters la ieșire, fiindcă
 * directorul întreg se comite cu `git add`.
 */
async function writeUtterance(line: string, out: string): Promise<void> {
  const raw = await withRetry(() => requestVoice(line));
  const work = mkdtempSync(join(tmpdir(), "vorbaretii-marca-"));
  try {
    const source = join(work, "sursa.mp3");
    writeFileSync(source, raw);
    await polish(source, out);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/** Curăță rădăcina: cheile de voce vechi întregi, apoi fișierele fără rând fix din cheia curentă. */
function sweep(root: string, key: string, expected: Set<string>): void {
  for (const entry of readdirSync(root))
    if (entry !== key) {
      rmSync(join(root, entry), { recursive: true, force: true });
      console.log(`șters (cheie veche): ${entry}`);
    }
  for (const name of readdirSync(join(root, key)))
    if (!expected.has(name)) {
      unlinkSync(join(root, key, name));
      console.log(`șters (orfan): ${name}`);
    }
}

async function main(): Promise<void> {
  const key = baseVoiceKey();
  const root = join(process.cwd(), BRAND_VOICE_DIR);
  const dir = join(root, key);
  const lines = Object.values(RITUAL_LINES);
  const missing = lines.filter((line) => !existsSync(join(dir, fileOf(line))));
  const chars = missing.reduce((sum, line) => sum + line.length, 0);
  console.log(
    `rostiri de marcă: ${lines.length}, de generat ${missing.length} (${chars} caractere), cheia ${key}`
  );
  mkdirSync(dir, { recursive: true });
  for (const line of missing) {
    const out = join(dir, fileOf(line));
    await writeUtterance(line, out);
    console.log(
      `scris ${fileOf(line)} (${Math.round(statSync(out).size / 1024)}KB): ${line.slice(0, 60)}`
    );
  }
  sweep(root, key, new Set(lines.map(fileOf)));
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
