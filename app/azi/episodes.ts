/**
 * Registrul episoadelor Vorbărici — DOAR pe server (fs la build), ca registrul
 * articolelor. Sursa e DISCUL COMIS (ADR-047): un director per zi, exact un
 * episod în el. Niciun manifest pe lângă fișiere — ar fi un al doilea adevăr,
 * care poate să nu fie de acord cu primul.
 *
 * Feed-ul și pagina primesc lista ca ARGUMENT: citirea discului se face aici și
 * o dată, iar ce se compune din ea rămâne pur (`podcast.ts`).
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { RITUAL } from "./naming";

/** Rădăcina de pe disc, derivată din calea SERVITĂ: un singur adevăr despre unde stau zilele. */
const EPISODES_DIR = join("public", RITUAL.audio);
/** 128 kbps CBR (ADR-047): secundele se derivă din bytes, nu se măsoară cu ffprobe la fiecare build. */
const BYTES_PER_SECOND = 16_000;
/** Un director de zi e o ȘTAMPILĂ, nimic altceva; restul nu e episod. */
const STAMP = /^\d{4}-\d{2}-\d{2}$/;

export type RitualEpisode = {
  /** Ziua a cărei carte o rostește — identitatea episodului (ADR-047). */
  date: string;
  /** Fișierul comis, `<hash>.episode.mp3`; hash-ul e amprenta cărții acelei zile. */
  file: string;
  /** Bytes-urile exacte, pentru `enclosure`. */
  bytes: number;
  /** Durata derivată din bytes, rotunjită — `<itunes:duration>` e un întreg. */
  seconds: number;
};

/** Exact un `*.episode.mp3` per zi: două fișiere ar pune feed-ul să aleagă între două adevăruri. */
function episodeOf(root: string, date: string): RitualEpisode {
  const dir = join(root, date);
  const files = readdirSync(dir).filter((f) => f.endsWith(".episode.mp3"));
  if (files.length !== 1)
    throw new Error(
      `ADR-047 — ziua „${date}”: ${files.length} episoade în ${dir}, trebuie exact unul — ` +
        `rulează yarn generate-azi-episodes --from ${date} --days 1`
    );
  const bytes = statSync(join(dir, files[0]!)).size;
  return { date, file: files[0]!, bytes, seconds: Math.round(bytes / BYTES_PER_SECOND) };
}

/** Episoadele comise, crescător după zi; rădăcină absentă = listă goală (nicio zi generată încă). */
export function readEpisodes(): RitualEpisode[] {
  const root = join(process.cwd(), EPISODES_DIR);
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((entry) => STAMP.test(entry))
    .sort()
    .map((date) => episodeOf(root, date));
}

/** Registrul la build: discul citit o dată, ca `articles`. */
export const ritualEpisodes: RitualEpisode[] = readEpisodes();
