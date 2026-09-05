/**
 * Feed-ul de podcast (ADR-032): un fișier XML static la build, din registrul
 * articolelor cu episod — canalul (constantele casei) și un item per episod.
 * GUID-ul episodului = slugul (stabil la regenerarea audio); enclosure-ul =
 * fișierul episodului cu bytes exacți și `audio/mpeg`. Pur în date (string in,
 * string out), în afara UUID-ului v5 al canalului (node:crypto) — server-only,
 * ca registrul. Toate textele trec prin escape XML.
 */

import { createHash } from "node:crypto";

export const PODCAST = {
  title: "Vorbăreții — Gaița povestește",
  description:
    "Curiozități în română pentru copiii din diaspora, citite de Gaița: trei-patru minute, lucruri adevărate, cu surse, și o întrebare la sfârșit — de răspuns celui de lângă tine. De la 7 ani.",
  author: "Vorbăreții",
  owner: { name: "Vorbăreții", email: "salut@vorbaretii.ro" },
  category: ["Kids & Family", "Education for Kids"],
  language: "ro",
  link: "/articole",
  image: "/assets/podcast/cover-3000.jpg",
  feed: "/podcast.xml",
  host: "Gaița",
} as const;

export type Episode = {
  slug: string;
  title: string;
  summary: string;
  age: number;
  published: string;
  /** Poziția în registru — două articole din aceeași zi păstrează ordinea prin pubDate. */
  index: number;
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

/** RFC 2822: ziua publicării la 06:00:00 UTC minus indexul din registru, în minute. */
export function pubDate(published: string, index: number): string {
  const date = new Date(`${published}T06:00:00Z`);
  date.setUTCMinutes(date.getUTCMinutes() - index);
  const day = `${DAYS[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  return `${day} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} +0000`;
}

function itemXml(base: string, episode: Episode): string {
  return [
    "<item>",
    `<title>${escapeXml(episode.title)}</title>`,
    `<guid isPermaLink="false">vorbaretii:articol:${episode.slug}</guid>`,
    `<link>${base}/articole/${episode.slug}</link>`,
    `<pubDate>${pubDate(episode.published, episode.index)}</pubDate>`,
    `<description>${escapeXml(`${episode.summary} De la ${episode.age} ani.`)}</description>`,
    `<enclosure url="${escapeXml(episode.enclosure.url)}" length="${episode.enclosure.bytes}" type="audio/mpeg"/>`,
    `<itunes:duration>${episode.enclosure.seconds}</itunes:duration>`,
    "<itunes:episodeType>full</itunes:episodeType>",
    "<itunes:explicit>false</itunes:explicit>",
    "</item>",
  ].join("\n");
}

const NAMESPACES =
  'xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/"';

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
    ...episodes.map((episode) => itemXml(base, episode)),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" ${NAMESPACES}>\n<channel>\n${channel.join("\n")}\n</channel>\n</rss>\n`;
}
