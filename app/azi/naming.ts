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
} as const;
