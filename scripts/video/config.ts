/**
 * Casa configurației video (ADR-015): TOATE constantele compoziției, într-un
 * loc — nimic magic împrăștiat prin straturi. Paleta = biblia ilustrațiilor
 * (crem cald, albastru profund, accente cărămiziu/auriu-pai); colțul din
 * dreapta-jos e REZERVAT stratului mascotei (v2) — niciun strat nu desenează
 * în el.
 */

import { join } from "path";
import type { Band } from "../../app/articole/content/budgets";

export const VIDEO = { width: 1920, height: 1080, fps: 30 } as const;

export const PALETTE = {
  cream: "#FBF3E4",
  deepBlue: "#1F3A5F",
  spoken: "#27476E",
  unspoken: "#8AA0B8",
  accent: "#C0563B",
  gold: "#D9A441",
  shadow: "rgba(31, 58, 95, 0.28)",
} as const;

/**
 * Panglica de lectură: element grafic de poveste — bandă crem cu liseré auriu
 * și cozi de rândunică cărămizii, jos-centrată, lățime fixă (ca banda de la
 * TV). Niciodată mai mult de `maxLines` rânduri deodată — beat-ul curge în
 * ferestre succesive, pe vocea naratorului. Tab-ul auriu poartă secțiunea.
 */
export const BAND = {
  width: 1280,
  radius: 18,
  padX: 64,
  padY: 36,
  bottom: 72,
  font: 54,
  lineHeight: 1.35,
  tagFont: 26,
  tagPadX: 26,
  tagHeight: 48,
  fadeSeconds: 0.22,
  spaceFactor: 1.25,
  slideIn: 14,
  tailOut: 96,
  tailNotch: 38,
  tailInsetY: 24,
  tailStub: 8,
  pinstripeInset: 12,
  pinstripeWidth: 3,
  shadowBlur: 28,
  shadowOffsetY: 8,
  tagCorner: 14,
  tagBaselineTweak: 4,
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

/** Colțul mascotei (dreapta-jos), în afara panglicii cu cozi — legea o verifică. */
export const MASCOT = { size: 200, right: 20, bottom: 44 } as const;

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

/** Închiderea: filmul revine pe erou, panglica spune „Sfârșit", tab-ul auriu semnează mare. */
export const OUTRO = {
  seconds: 5,
  word: "Sfârșit",
  wordFont: 96,
  padY: 44,
  padX: 110,
  minWidth: 720,
  baselineFactor: 0.35,
  url: "vorbaretii.ro",
  tagFont: 44,
  tagPadX: 40,
  tagHeight: 82,
} as const;

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
