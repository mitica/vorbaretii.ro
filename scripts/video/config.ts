/**
 * Casa configurației video (ADR-015): TOATE constantele compoziției, într-un
 * loc — nimic magic împrăștiat prin straturi. Grafica e în cald (cerneală, gri
 * cald, hârtie translucidă, chip galben) — singurul albastru e mascota, în
 * colțul din dreapta-jos, cu semnătura sub picioare.
 */

import { join } from "path";
import type { Band } from "../../app/articole/content/budgets";

export const VIDEO = { width: 1920, height: 1080, fps: 30 } as const;

/** Grafica filmului, în cald (decizia operatorului, 2026-09-05): singurul albastru e mascota. */
export const PALETTE = {
  ink: "#2B2A33",
  unspoken: "#A39E96",
  paper: "rgba(255, 255, 255, 0.86)",
  shadow: "rgba(40, 30, 20, 0.20)",
} as const;

/**
 * Bula gaiței: cardul alb translucid, cu colțuri mari și coada spre mascotă —
 * textul e ce spune ea. Niciodată mai mult de `maxLines` rânduri deodată
 * (limitele benzii de vârstă); beat-ul curge în ferestre succesive, pe voce.
 */
export const BUBBLE = {
  width: 1220,
  rightEdge: 1570,
  bottom: 60,
  radius: 36,
  padX: 40,
  padY: 40,
  font: 56,
  lineHeight: 1.32,
  spaceFactor: 1.25,
  fadeSeconds: 0.22,
  slideIn: 14,
  shadowBlur: 44,
  shadowOffsetY: 10,
  tailOut: 40,
  tailTop: 70,
  tailBottom: 24,
} as const;

/** Chip-ul secțiunii, pe marginea de sus a bulei: galben, cu numele ramei. */
export const CHIP = {
  font: 28,
  height: 52,
  padX: 24,
  offsetX: 32,
  raise: 26,
  fill: "#FFC526",
  text: "#2B2A33",
} as const;

/** Cadrul minim per bandă (ghidul pe vârste §Video, pragurile de jos): beat scurt = mai puține cadre decât imagini. */
export const SHOT_BY_BAND: Record<Band, { minShotSeconds: number }> = {
  "7-8": { minShotSeconds: 6 },
  "9-11": { minShotSeconds: 5 },
  "12-14": { minShotSeconds: 4 },
};

/** Ferestrele textului per bandă: rândurile (dur), durata minimă pe ecran (bate ținta), ținta de cuvinte. */
export type WindowLimits = { maxLines: number; minSeconds: number; targetWords: number };
export const BAND_BY_BAND: Record<Band, WindowLimits> = {
  "7-8": { maxLines: 1, minSeconds: 3, targetWords: 5 },
  "9-11": { maxLines: 2, minSeconds: 3, targetWords: 8 },
  "12-14": { maxLines: 2, minSeconds: 3, targetWords: 10 },
};

/** Colțul mascotei (dreapta-jos), în afara bulei — legea o verifică; sub ea, semnătura. */
export const MASCOT = { size: 280, right: 20, bottom: 72 } as const;

/** Mascota în timp: plafonul unei reacții, pauza care o taie, ritmul ciocului, al respirației, fazele rasterizate. */
export const REACTION = {
  maxSeconds: 1.2,
  pauseSeconds: 0.35,
  talkHz: 6,
  idleHz: 0.5,
  phases: 8,
} as const;

/** Panourile statice (titlul la intro, ultima întrebare): ≤2 rânduri, fontul coboară până încape. */
export const PANEL = { maxLines: 2, fonts: [54, 44, 36] } as const;

/** Stingul de marcă (asset comis, ales de operator): durata din pistă e FIXATĂ aici (atrim/apad), nu citită din fișier. */
export const STING = { file: "assets/audio/brand/sting.mp3", seconds: 1.8 } as const;

/** Ultima întrebare a articolului, pe ecran înainte de „Sfârșit". */
export const QUESTION = { seconds: 3 } as const;

/** Închiderea: filmul revine pe erou, cardul spune „Sfârșit"; semnătura stă sub mascotă. */
export const OUTRO = {
  seconds: 5,
  word: "Sfârșit",
  wordFont: 96,
  padY: 44,
  padX: 110,
  minWidth: 720,
  baselineFactor: 0.35,
  url: "vorbaretii.ro",
} as const;

/** Semnătura de sub picioarele mascotei, în fiecare cadru. */
export const SIGNATURE = { font: 26, gap: 8 } as const;

/** Parametrii de codare ffmpeg — o casă, ca tot restul compoziției. */
export const ENCODE = { preset: "medium", crf: 19, audioBitrate: "128k" } as const;
/** zoomFrom poartă marja pan-ului (≥ 1 + panFraction) — legea acoperirii o ține. */
export const KEN_BURNS = { zoomFrom: 1.04, zoomTo: 1.13, panFraction: 0.035 } as const;

/** Crossfade-ul dintre imagini la schimbarea de scenă. */
export const TRANSITION = { seconds: 0.7 } as const;

export const FONT_DIR = join(__dirname, "../../assets/fonts");
export const FONTS = [
  { file: "Inter-Bold.otf", family: "Inter Bold" },
  { file: "Inter-ExtraBold.otf", family: "Inter ExtraBold" },
] as const;
