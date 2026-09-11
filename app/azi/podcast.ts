/**
 * Feed-ul Vorbărici (ADR-048): un fișier XML static la build — canalul ritualului
 * și un item per episod. Canalul e al RITUALULUI, nu al articolelor: episodul de
 * articol a ieșit din feed, iar fișierele lui rămân pe disc și în registru.
 *
 * Episodul își POARTĂ identitatea: `guid`, `link`, `description` și `pubDate` vin
 * gata făcute, iar randatorul doar le scapă și le emite. Înainte, prefixul de
 * articol era bătut chiar aici — de-aia un al doilea tip de episod n-avea cum să
 * existe.
 *
 * Pur în date (string in, string out), în afara UUID-ului v5 al canalului
 * (`node:crypto`) — de-aia numele ritualului stă separat, în `naming.ts`, pe care
 * îl poate importa și învelișul. Fără `lastBuildDate`, deliberat: același registru
 * plus aceeași zi = același XML.
 */

import { createHash } from "node:crypto";
import { dateLabel } from "./card";
// Tipul registrului, nu registrul: `import type` se șterge la compilare, deci
// feed-ul rămâne pur — discul îl citește `episodes.ts`, o dată, la build.
import type { RitualEpisode } from "./episodes";
import { RITUAL, dateFromStamp, todayStamp } from "./naming";

export const PODCAST = {
  title: RITUAL.title,
  description: RITUAL.description,
  author: "Vorbăreții",
  owner: { name: "Vorbăreții", email: "salut@vorbaretii.ro" },
  category: ["Kids & Family", "Education for Kids"],
  language: "ro",
  link: RITUAL.page,
  image: "/assets/podcast/cover-3000.jpg",
  feed: RITUAL.feed,
  /** Suprafață de brand: numele personajului e legal aici, nu în gura lui. */
  host: "Gaița",
} as const;

/**
 * Un episod, cu identitatea LUI. Nimic de aici nu se compune în randator: un tip
 * nou de episod se adaugă dându-i alt `guid`, nu atingând `itemXml`.
 */
export type Episode = {
  /** Identitatea pentru aplicații; nu se schimbă niciodată la regenerarea audio. */
  guid: string;
  title: string;
  /** Pagina episodului, absolută. */
  link: string;
  description: string;
  /** RFC 2822, gata formatat — vezi `pubDate`. */
  pubDate: string;
  enclosure: { url: string; bytes: number; seconds: number };
};

/** Namespace-ul UUID v5 al Podcast Index pentru `podcast:guid`. */
const PODCAST_NAMESPACE = "ead4c236-bf58-58c6-a2c6-a6b28d128cb6";

/** UUID v5 (sha1) al feed-ului, pe URL fără schemă și fără slash final — `podcast:guid`. */
export function podcastGuid(feedUrl: string): string {
  const name = feedUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const namespace = Buffer.from(PODCAST_NAMESPACE.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(namespace).update(name).digest();
  hash[6] = (hash[6]! & 0x0f) | 0x50;
  hash[8] = (hash[8]! & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const ESCAPES: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
const escapeXml = (text: string): string => text.replace(/[<>&"]/g, (c) => ESCAPES[c]!);

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * RFC 2822: ziua la 04:00 UTC — dimineața în Europa, seara dinainte în America,
 * acceptat explicit. Un episod pe zi, deci indexul în minute al articolelor a
 * dispărut odată cu ele.
 */
export function pubDate(stamp: string): string {
  const date = new Date(`${stamp}T04:00:00Z`);
  const day = `${DAYS[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  return `${day} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} +0000`;
}

/** Calea servită a unui episod: ziua și fișierul ei, sub rădăcina audio a ritualului. */
const servedPath = (episode: RitualEpisode): string =>
  `${RITUAL.audio}/${episode.date}/${episode.file}`;

/**
 * Item-ul unei zile, derivat DOAR din dată — niciun câmp nu vine din cartea ei.
 *
 * Motivul: cartea unei zile se re-derivă la orice creștere de corpus, ȘI ÎN
 * TRECUT. `pickForDay` (`daily-pick.ts`) are `n` și în `cycle = ⌊day/n⌋`, și în
 * `position = day % n`, deci o ghicitoare nouă mută alegerea tuturor zilelor. Dacă
 * titlul sau descrierea ar veni din carte, XML-ul deja publicat s-ar schimba sub
 * abonați la fiecare ghicitoare nouă — iar aplicațiile de podcast ar reafișa
 * episoade vechi ca fiind schimbate.
 */
function feedEpisode(base: string, episode: RitualEpisode): Episode {
  const label = dateLabel(dateFromStamp(episode.date));
  return {
    guid: `vorbaretii:vorbarici:${episode.date}`,
    title: `${RITUAL.name} · ${label}`,
    link: `${base}${RITUAL.page}`,
    description:
      `Cartea de ${label}: o ghicitoare, o întrebare de povestit, o frământare de limbă.` +
      " Ascultați împreună — liniștea din episod e a copilului. De la 7 ani.",
    pubDate: pubDate(episode.date),
    enclosure: {
      url: `${base}${servedPath(episode)}`,
      bytes: episode.bytes,
      seconds: episode.seconds,
    },
  };
}

/**
 * Fereastra de ZI: din registrul comis intră în feed doar zilele până la `today`
 * inclusiv, cele mai noi întâi. Așa un lot de paisprezece zile, generat o dată,
 * apare câte un episod pe zi. `today` vine ca ARGUMENT — ruta îl citește o
 * singură dată —, deci același (registru, zi) dă mereu același XML.
 */
export function feedEpisodes(
  base: string,
  episodes: readonly RitualEpisode[],
  today: string
): Episode[] {
  return episodes
    .filter((episode) => episode.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((episode) => feedEpisode(base, episode));
}

/** Episodul unei zile, ca pe pagină: calea servită sau `null` — ziua fără episod tace. */
export function episodeFor(episodes: readonly RitualEpisode[], date: string): string | null {
  const found = episodes.find((episode) => episode.date === date);
  return found ? servedPath(found) : null;
}

const DAY_MS = 86_400_000;

/** Ziua vecină a unei ștampile, la ±1: aritmetică în UTC, ca rezultatul să nu depindă de fusul mașinii de build. */
const neighbourDay = (stamp: string, days: number): string =>
  todayStamp(new Date(Date.parse(`${stamp}T00:00:00Z`) + days * DAY_MS));

/**
 * Ce episoade poate cere PAGINA: ziua build-ului, cea dinainte și cea de după —
 * atât, niciodată arhiva. De ce exact trei: pagina e HTML static, iar ziua o
 * află ceasul copilului, nu build-ul; data locală a oricărui copil, de la UTC−12
 * la UTC+14, cade într-una din cele trei. Restul zilelor sunt ale feed-ului.
 *
 * Zilele fără episod lipsesc din rezultat: cine nu găsește ziua nu arată rândul.
 */
export function episodeWindow(
  episodes: readonly RitualEpisode[],
  today: string
): Record<string, string> {
  const found: Record<string, string> = {};
  for (const days of [-1, 0, 1]) {
    const date = neighbourDay(today, days);
    const path = episodeFor(episodes, date);
    if (path) found[date] = path;
  }
  return found;
}

function itemXml(episode: Episode): string {
  return [
    "<item>",
    `<title>${escapeXml(episode.title)}</title>`,
    `<guid isPermaLink="false">${escapeXml(episode.guid)}</guid>`,
    `<link>${escapeXml(episode.link)}</link>`,
    `<pubDate>${episode.pubDate}</pubDate>`,
    `<description>${escapeXml(episode.description)}</description>`,
    `<enclosure url="${escapeXml(episode.enclosure.url)}" length="${episode.enclosure.bytes}" type="audio/mpeg"/>`,
    `<itunes:duration>${episode.enclosure.seconds}</itunes:duration>`,
    "<itunes:episodeType>full</itunes:episodeType>",
    "<itunes:explicit>false</itunes:explicit>",
    "</item>",
  ].join("\n");
}

const NAMESPACES =
  'xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:atom="http://www.w3.org/2005/Atom"';

/** Feed-ul întreg: canalul casei + item-urile, în ordinea dată (a registrului). */
export function buildPodcastFeed(base: string, episodes: readonly Episode[]): string {
  const url = (path: string): string => `${base}${path}`;
  const channel = [
    `<title>${escapeXml(PODCAST.title)}</title>`,
    `<link>${url(PODCAST.link)}</link>`,
    `<atom:link href="${url(PODCAST.feed)}" rel="self" type="application/rss+xml"/>`,
    `<language>${PODCAST.language}</language>`,
    `<description>${escapeXml(PODCAST.description)}</description>`,
    `<itunes:author>${escapeXml(PODCAST.author)}</itunes:author>`,
    `<itunes:owner><itunes:name>${escapeXml(PODCAST.owner.name)}</itunes:name><itunes:email>${PODCAST.owner.email}</itunes:email></itunes:owner>`,
    `<itunes:image href="${url(PODCAST.image)}"/>`,
    `<itunes:category text="${escapeXml(PODCAST.category[0])}"><itunes:category text="${escapeXml(PODCAST.category[1])}"/></itunes:category>`,
    "<itunes:explicit>false</itunes:explicit>",
    "<itunes:type>episodic</itunes:type>",
    `<podcast:guid>${podcastGuid(url(PODCAST.feed))}</podcast:guid>`,
    "<podcast:locked>no</podcast:locked>",
    `<podcast:person role="host">${escapeXml(PODCAST.host)}</podcast:person>`,
    "<generator>vorbaretii.ro</generator>",
    ...episodes.map(itemXml),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" ${NAMESPACES}>\n<channel>\n${channel.join("\n")}\n</channel>\n</rss>\n`;
}
