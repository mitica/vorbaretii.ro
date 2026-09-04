/**
 * Generatorul vocii jocurilor (ADR-020): un fișier mp3 per rostire, numit
 * hashId(text), în directorul cheii de voce curente. Generează DOAR ce
 * lipsește, mătură orfanii și cheile vechi, tipărește costul înainte.
 *
 *   yarn generate-game-audio <slug|toate> [--tot] [--doar-matura]
 *
 *   --tot          șterge tot directorul jocului întâi (schimbarea vocii din .env)
 *   --doar-matura  fără apeluri API: doar orfanii și cheile vechi (ștergeri de articole)
 */
import { existsSync, mkdirSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AUDIO_MODEL, AUDIO_OUTPUT_FORMAT, VOICE_SETTINGS } from "../app/articole/audio-setari";
import { hashId } from "../app/jocuri/content/ids";
import { rostirileJocului } from "../app/jocuri/voce/rostiri";
import {
  DIRECTOR_VOCE,
  VITEZA,
  VOCE_JOCURI,
  cheiaVocii,
  textTrimis,
} from "../app/jocuri/voce/setari";
import { apelTts } from "./lib/elevenlabs";
import { withRetry } from "./retry";

type Optiuni = { tot: boolean; doarMatura: boolean };

function argumente(): { sluguri: string[]; optiuni: Optiuni } {
  const args = process.argv.slice(2);
  const tinta = args.find((a) => !a.startsWith("--"));
  if (!tinta)
    throw new Error("folosire: yarn generate-game-audio <slug|toate> [--tot] [--doar-matura]");
  const sluguri = tinta === "toate" ? Object.keys(VOCE_JOCURI) : [tinta];
  for (const s of sluguri)
    if (!(s in VOCE_JOCURI))
      throw new Error(`ADR-020 — „${s}” nu e joc cu voce (vezi app/jocuri/voce/setari.ts)`);
  return {
    sluguri,
    optiuni: { tot: args.includes("--tot"), doarMatura: args.includes("--doar-matura") },
  };
}

async function sintetizeaza(text: string): Promise<Buffer> {
  const response = await apelTts(`?output_format=${AUDIO_OUTPUT_FORMAT}`, {
    text,
    model_id: AUDIO_MODEL,
    voice_settings: { ...VOICE_SETTINGS, speed: VITEZA },
  });
  return Buffer.from(await response.arrayBuffer());
}

/** Șterge cheile vechi și, în cheia curentă, fișierele care nu mai corespund niciunei rostiri. */
function matura(radacina: string, cheie: string, asteptate: Set<string>): void {
  for (const intrare of readdirSync(radacina)) {
    const cale = join(radacina, intrare);
    if (intrare !== cheie) {
      rmSync(cale, { recursive: true, force: true });
      console.log(`șters (cheie veche): ${intrare}`);
    }
  }
  const dir = join(radacina, cheie);
  if (!existsSync(dir)) return;
  for (const nume of readdirSync(dir))
    if (!asteptate.has(nume)) {
      unlinkSync(join(dir, nume));
      console.log(`șters (orfan): ${nume}`);
    }
}

async function genereaza(slug: string, optiuni: Optiuni): Promise<void> {
  const rostiri = rostirileJocului(slug);
  const cheie = cheiaVocii(slug);
  const radacina = join(process.cwd(), DIRECTOR_VOCE, slug);
  if (optiuni.tot) rmSync(radacina, { recursive: true, force: true });
  if (optiuni.doarMatura && !existsSync(radacina)) {
    console.log(`${slug}: fără director de voce — nimic de măturat`);
    return;
  }
  const dir = join(radacina, cheie);
  mkdirSync(dir, { recursive: true });
  const lipsa = rostiri.filter((r) => !existsSync(join(dir, `${hashId(r)}.mp3`)));
  const caractere = lipsa.reduce((s, r) => s + textTrimis(slug, r).length, 0);
  console.log(
    `${slug}: ${rostiri.length} rostiri, ${lipsa.length} de generat (${caractere} caractere), cheia ${cheie}`
  );
  if (!optiuni.doarMatura)
    for (const rostire of lipsa) {
      const audio = await withRetry(() => sintetizeaza(textTrimis(slug, rostire)));
      writeFileSync(join(dir, `${hashId(rostire)}.mp3`), audio);
      console.log(
        `scris ${hashId(rostire)}.mp3 (${Math.round(audio.length / 1024)}KB): ${rostire.slice(0, 60)}`
      );
    }
  matura(radacina, cheie, new Set(rostiri.map((r) => `${hashId(r)}.mp3`)));
}

async function main(): Promise<void> {
  const { sluguri, optiuni } = argumente();
  for (const slug of sluguri) await genereaza(slug, optiuni);
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
