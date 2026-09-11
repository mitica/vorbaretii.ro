/**
 * Legea feed-ului Vorbărici (ADR-048, succesoarea ADR-032): canalul e al
 * RITUALULUI și e complet chiar fără niciun episod; episodul își POARTĂ
 * identitatea, iar randatorul nu compune nimic; `pubDate` la 04:00 UTC; textele
 * scăpate; ruta statică și auto-descoperirea în cap; coperta JPEG 3000×3000 sub
 * 512 KB. Rulează cu `yarn test`.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { COVER_MAX_BYTES, encodeUnderBudget } from "./generate-podcast-cover";
import { PODCAST, buildPodcastFeed, podcastGuid, pubDate, type Episode } from "../app/azi/podcast";
import { RITUAL } from "../app/azi/naming";

const BASE = "https://vorbaretii.ro";

const episode = (stamp: string, over: Partial<Episode> = {}): Episode => ({
  guid: `vorbaretii:vorbarici:${stamp}`,
  title: `Vorbărici · ${stamp} & co <b>`,
  link: `${BASE}/azi`,
  description: "Cartea zilei: o ghicitoare, o întrebare de povestit, o frământare de limbă.",
  pubDate: pubDate(stamp),
  enclosure: {
    url: `${BASE}/assets/audio/vorbarici/${stamp}/x.episode.mp3`,
    bytes: 2_160_000,
    seconds: 135,
  },
  ...over,
});

test("ADR-048: fără niciun episod → canal complet (Apple + Spotify), al RITUALULUI", () => {
  const xml = buildPodcastFeed(BASE, []);
  for (const tag of [
    `<title>${RITUAL.title}</title>`,
    `<link>${BASE}${RITUAL.page}</link>`,
    `<atom:link href="${BASE}${RITUAL.feed}" rel="self" type="application/rss+xml"/>`,
    `<itunes:image href="${BASE}/assets/podcast/cover-3000.jpg"/>`,
    "<language>ro</language>",
    '<itunes:category text="Kids &amp; Family">',
    '<itunes:category text="Education for Kids"/>',
    "<itunes:explicit>false</itunes:explicit>",
    "<itunes:type>episodic</itunes:type>",
    "<itunes:author>Vorbăreții</itunes:author>",
    "<itunes:email>salut@vorbaretii.ro</itunes:email>",
    "<podcast:guid>",
    "<podcast:locked>no</podcast:locked>",
    '<podcast:person role="host">',
  ])
    assert.ok(xml.includes(tag), `lipsește ${tag}`);
  assert.ok(xml.includes(RITUAL.description), "descrierea canalului e a ritualului");
  assert.equal((xml.match(/<item>/g) ?? []).length, 0, "fără episoade, zero item-uri");
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));

  // Rosu intai: canalul NU mai e al articolelor.
  assert.ok(!xml.includes("Gaița povestește"), "ADR-048 — titlul vechi, al articolelor");
  assert.ok(
    !xml.includes(`<link>${BASE}/articole</link>`),
    "ADR-048 — link-ul vechi, spre articole"
  );
});

test("ADR-048: episodul isi POARTA identitatea; randatorul nu compune nimic", () => {
  const xml = buildPodcastFeed(BASE, [episode("2026-09-18"), episode("2026-09-19")]);
  assert.equal((xml.match(/<item>/g) ?? []).length, 2);
  assert.ok(
    xml.includes('<guid isPermaLink="false">vorbaretii:vorbarici:2026-09-18</guid>'),
    "GUID-ul e cel dat, nu unul compus"
  );
  // Un episod cu ORICE alt guid iese cu exact acel guid: nimic nu se prefixeaza.
  const alien = buildPodcastFeed(BASE, [episode("2026-09-18", { guid: "orice:altceva" })]);
  assert.ok(alien.includes('<guid isPermaLink="false">orice:altceva</guid>'));
  assert.ok(!alien.includes("vorbaretii:"), "ADR-048 — randatorul a adaugat un prefix de la el");

  // Si in SURSA: linia GUID-ului nu are voie sa compuna NIMIC in jurul lui.
  const renderer = readFileSync(join(process.cwd(), "app/azi/podcast.ts"), "utf8");
  const guidLine = /<guid isPermaLink="false">([^<]*)<\/guid>/.exec(renderer)?.[1] ?? "";
  assert.equal(
    guidLine,
    "${escapeXml(episode.guid)}",
    "ADR-048 — randatorul compune ceva in jurul GUID-ului, in loc sa-l emita"
  );

  assert.ok(xml.includes(`<link>${BASE}/azi</link>`), "link-ul e cel dat de episod");
  assert.ok(
    xml.includes(
      `<enclosure url="${BASE}/assets/audio/vorbarici/2026-09-18/x.episode.mp3" length="2160000" type="audio/mpeg"/>`
    ),
    "enclosure cu bytes exacți și audio/mpeg"
  );
  assert.ok(xml.includes("<itunes:duration>135</itunes:duration>"));
  assert.ok(xml.includes("<itunes:episodeType>full</itunes:episodeType>"));
  assert.ok(
    xml.includes("2026-09-18 &amp; co &lt;b&gt;") && !xml.includes("<b>"),
    "textele sunt scăpate"
  );
});

test("ADR-048: pubDate e RFC 2822, la 04:00 UTC — un episod pe zi, fara index", () => {
  assert.equal(pubDate("2026-09-18"), "Fri, 18 Sep 2026 04:00:00 +0000");
  assert.equal(pubDate("2026-03-01"), "Sun, 01 Mar 2026 04:00:00 +0000");
});

test("ADR-048: podcast:guid e UUID v5 determinist, pe URL-ul fara schema si fara slash final", () => {
  const guid = podcastGuid(`${BASE}${RITUAL.feed}`);
  assert.match(guid, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(guid, podcastGuid("vorbaretii.ro/podcast.xml/"));
  assert.notEqual(guid, podcastGuid("alt.ro/podcast.xml"));
});

test("ADR-048: ruta e statica si nu mai atinge registrul articolelor; capul poarta auto-descoperirea", () => {
  const route = readFileSync(join(process.cwd(), "app/podcast.xml/route.ts"), "utf8");
  assert.ok(
    route.includes('dynamic = "force-static"'),
    "ruta trebuie să fie force-static (fișier la export, fără server)"
  );
  assert.ok(
    !/articole/.test(route),
    "ADR-048 — feed-ul nu mai are voie să treacă prin nimic al articolelor"
  );
  const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
  assert.ok(
    layout.includes('rel="alternate"') &&
      layout.includes('type="application/rss+xml"') &&
      layout.includes("RITUAL.feed"),
    "link-ul rel=alternate spre feed (constanta RITUAL.feed)"
  );
  assert.ok(
    !layout.includes("articole/podcast"),
    "ADR-048 — învelișul nu mai importă podcastul din casa articolelor"
  );
});

test("ADR-048: numele ritualului are o SINGURA casa", () => {
  const channel = buildPodcastFeed(BASE, []);
  assert.ok(channel.includes(RITUAL.title) && PODCAST.title === RITUAL.title);
  for (const file of ["app/azi/page.tsx", "app/azi/card.ts", "app/layout.tsx"]) {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    assert.ok(
      !source.includes(`"${RITUAL.name}"`) && !source.includes(`\`${RITUAL.name}`),
      `ADR-048 — ${file} scrie numele de mână în loc să-l ceară din RITUAL`
    );
  }
});

test("ADR-048: coperta e pe disc — JPEG 3000×3000, sub 512 KB", async () => {
  const file = join(process.cwd(), "public/assets/podcast/cover-3000.jpg");
  assert.ok(existsSync(file), "coperta lipsește — yarn generate-podcast-cover");
  const bytes = readFileSync(file);
  assert.ok(bytes[0] === 0xff && bytes[1] === 0xd8, "coperta nu e JPEG");
  assert.ok(
    statSync(file).size < COVER_MAX_BYTES,
    `coperta are ${statSync(file).size} bytes, plafonul e ${COVER_MAX_BYTES / 1024} KB`
  );
  const image = await loadImage(file);
  assert.equal(image.width, 3000);
  assert.equal(image.height, 3000);
});

test("ADR-048: totul trece prin escape XML; niciun & gol; fara namespace nefolosit", () => {
  const xml = buildPodcastFeed(BASE, [episode("2026-09-18", { guid: "a&b", link: `${BASE}/a&b` })]);
  assert.ok(xml.includes('<guid isPermaLink="false">a&amp;b</guid>'), "guid scăpat");
  assert.ok(xml.includes(`<link>${BASE}/a&amp;b</link>`), "link scăpat");
  assert.ok(!/&(?!amp;|lt;|gt;|quot;)/.test(xml), "un & gol face feed-ul neparsabil");
  assert.ok(!xml.includes("xmlns:content"), "namespace declarat și nefolosit");
});

test("coperta care nu incape sub plafon opreste, cu marimea si plafonul in mesaj", () => {
  // Zgomot pe 3000×3000: la orice calitate rămâne peste plafonul Apple.
  const canvas = createCanvas(3000, 3000);
  const ctx = canvas.getContext("2d");
  const noise = ctx.createImageData(3000, 3000);
  for (let i = 0; i < noise.data.length; i++) noise.data[i] = Math.floor(Math.random() * 256);
  ctx.putImageData(noise, 0, 0);

  assert.throws(() => encodeUnderBudget(canvas), /plafon/);
});
