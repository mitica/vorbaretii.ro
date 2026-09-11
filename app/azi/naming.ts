/**
 * Numele ritualului, într-o singură casă (ADR-048). Îl cer patru consumatori —
 * pagina, învelișul, cartea copiată și canalul de podcast — iar înainte era scris
 * de mână în fiecare.
 *
 * PUR, fără nicio dependență de Node: `app/layout.tsx` îl importă pentru
 * `rel="alternate"`, iar dacă ar trage după el randatorul XML (care folosește
 * `node:crypto`), ar ajunge `node:crypto` în graful rădăcinii.
 */
export const RITUAL = {
  name: "Vorbărici",
  /** Titlul paginii ȘI al canalului: același lucru, spus o dată. */
  title: "Vorbărici — cinci minute în română, cu copilul",
  /** Descrierea CANALULUI — a paginii e a ei, în `page.tsx`. */
  description:
    "O ghicitoare, o întrebare de povestit și o frământare de limbă, în fiecare zi — de făcut împreună, în cinci minute. Cu liniște adevărată, cât să apuce copilul să răspundă cu voce tare. De la 7 ani.",
  page: "/azi",
  feed: "/podcast.xml",
  /** Rădăcina SERVITĂ a episoadelor: `<audio>/<AAAA-LL-ZZ>/<hash>.episode.mp3` (ADR-047). */
  audio: "/assets/audio/vorbarici",
} as const;

const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * Data LOCALĂ a unei ștampile, prin constructorul cu CÂMPURI. `new Date("2026-09-21")`
 * ar fi altceva: parsează ca instant UTC, iar getterii locali îl citesc înapoi cu o
 * zi mai puțin în orice fus negativ — adică altă carte pentru aceeași ștampilă
 * (ADR-041: ziua e o dată de calendar, nu un moment).
 */
export function dateFromStamp(stamp: string): Date {
  const year = Number(stamp.slice(0, 4));
  const month = Number(stamp.slice(5, 7));
  return new Date(year, month - 1, Number(stamp.slice(8, 10)));
}

/**
 * Ziua build-ului ca ștampilă, în UTC: fereastra feed-ului nu are voie să depindă
 * de fusul mașinii care face build-ul — două build-uri ale aceluiași commit ar da
 * feed-uri diferite (ADR-048).
 */
export function todayStamp(now: Date): string {
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

/**
 * Ziua LOCALĂ a cititorului ca ștampilă — perechea lui `todayStamp`, pe ceasul
 * lui. Pagina e HTML static: ziua build-ului decide ce se livrează (`todayStamp`),
 * dar ce se arată e ziua copilului, care poate fi alta (ADR-041).
 */
export function localStamp(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
