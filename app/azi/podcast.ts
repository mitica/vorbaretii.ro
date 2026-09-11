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
import { RITUAL } from "./naming";

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
