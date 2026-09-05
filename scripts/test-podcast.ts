/**
 * Legea feed-ului de podcast (ADR-032): canalul complet chiar cu corpus gol; un
 * item per episod, în ordinea registrului; GUID = slugul (stabil la regenerarea
 * audio); enclosure cu bytes exacți și audio/mpeg; pubDate RFC 2822 ordonat în
 * aceeași zi; textele scăpate; ruta statică și auto-descoperirea în cap;
 * coperta JPEG 3000×3000 sub 512 KB. Rulează cu `yarn test`.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadImage } from "@napi-rs/canvas";
import {
  PODCAST,
  buildPodcastFeed,
  podcastGuid,
  pubDate,
  type Episode,
} from "../app/articole/podcast";

const BASE = "https://vorbaretii.ro";

const episode = (slug: string, index: number, published = "2026-09-05"): Episode => ({
  slug,
  title: `Titlu ${slug} & co <b>`,
  summary: "Sumarul articolului.",
  age: 9,
  published,
  index,
  enclosure: {
    url: `${BASE}/assets/audio/articole/${slug}/x.episode.mp3`,
    bytes: 4570009,
    seconds: 286,
  },
});

test("ADR-032: corpusul gol → canal complet (Apple + Spotify), zero item-uri", () => {
  const xml = buildPodcastFeed(BASE, []);
  for (const tag of [
    `<title>${PODCAST.title.replace("—", "—")}</title>`,
    "<description>",
    `<itunes:image href="${BASE}/assets/podcast/cover-3000.jpg"/>`,
    "<language>ro</language>",
    '<itunes:category text="Kids &amp; Family">',
    '<itunes:category text="Education for Kids"/>',
    "<itunes:explicit>false</itunes:explicit>",
    "<itunes:type>episodic</itunes:type>",
    "<itunes:author>Vorbăreții</itunes:author>",
    `<link>${BASE}/articole</link>`,
    "<itunes:email>salut@vorbaretii.ro</itunes:email>",
    "<podcast:guid>",
    "<podcast:locked>no</podcast:locked>",
    '<podcast:person role="host">',
    `<atom:link href="${BASE}/podcast.xml" rel="self" type="application/rss+xml"/>`,
  ])
    assert.ok(xml.includes(tag), `lipsește ${tag}`);
  assert.equal((xml.match(/<item>/g) ?? []).length, 0, "corpusul gol n-are item-uri");
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
});

test("ADR-032: două episoade → item-uri în ordinea registrului, guid = slugul, enclosure exact, texte scăpate, pubDate ordonat", () => {
  const xml = buildPodcastFeed(BASE, [episode("a-slug", 0), episode("b-slug", 1)]);
  assert.equal((xml.match(/<item>/g) ?? []).length, 2);
  assert.ok(xml.indexOf("a-slug") < xml.indexOf("b-slug"), "ordinea registrului");
  assert.ok(
    xml.includes('<guid isPermaLink="false">vorbaretii:articol:a-slug</guid>'),
    "GUID = slugul"
  );
  assert.ok(
    xml.includes(
      `<enclosure url="${BASE}/assets/audio/articole/a-slug/x.episode.mp3" length="4570009" type="audio/mpeg"/>`
    ),
    "enclosure cu bytes exacți și audio/mpeg"
  );
  assert.ok(xml.includes("<itunes:duration>286</itunes:duration>"));
  assert.ok(xml.includes("<itunes:episodeType>full</itunes:episodeType>"));
  assert.ok(xml.includes(`<link>${BASE}/articole/a-slug</link>`));
  assert.ok(
    xml.includes("Titlu a-slug &amp; co &lt;b&gt;") && !xml.includes("<b>"),
    "textele sunt scăpate"
  );
  assert.ok(xml.includes("Sumarul articolului. De la 9 ani."), "descrierea poartă vârsta");
  assert.ok(xml.includes("<pubDate>Sat, 05 Sep 2026 06:00:00 +0000</pubDate>"));
  assert.ok(
    xml.includes("<pubDate>Sat, 05 Sep 2026 05:59:00 +0000</pubDate>"),
    "al doilea din aceeași zi, un minut mai devreme"
  );
});

test("ADR-032: pubDate e RFC 2822, la 06:00 UTC minus indexul în minute", () => {
  assert.equal(pubDate("2026-03-01", 0), "Sun, 01 Mar 2026 06:00:00 +0000");
  assert.equal(pubDate("2026-03-01", 7), "Sun, 01 Mar 2026 05:53:00 +0000");
});

test("ADR-032: podcast:guid e UUID v5 determinist, pe URL-ul fără schemă și fără slash final", () => {
  const guid = podcastGuid(`${BASE}/podcast.xml`);
  assert.match(guid, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(guid, podcastGuid("vorbaretii.ro/podcast.xml/"));
  assert.notEqual(guid, podcastGuid("alt.ro/podcast.xml"));
});

test("ADR-032: ruta feed-ului e statică și citește registrul; capul paginii poartă auto-descoperirea", () => {
  const route = readFileSync(join(process.cwd(), "app/podcast.xml/route.ts"), "utf8");
  assert.ok(
    route.includes('dynamic = "force-static"'),
    "ruta trebuie să fie force-static (fișier la export, fără server)"
  );
  assert.ok(route.includes("articles"), "ruta citește registrul");
  const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
  assert.ok(
    layout.includes('rel="alternate"') &&
      layout.includes('type="application/rss+xml"') &&
      layout.includes("PODCAST.feed"),
    "link-ul rel=alternate spre feed (constanta PODCAST.feed)"
  );
});

test("ADR-032: coperta e pe disc — JPEG 3000×3000, sub 512 KB", async () => {
  const file = join(process.cwd(), "public/assets/podcast/cover-3000.jpg");
  assert.ok(existsSync(file), "coperta lipsește — yarn generate-podcast-cover");
  const bytes = readFileSync(file);
  assert.ok(bytes[0] === 0xff && bytes[1] === 0xd8, "coperta nu e JPEG");
  assert.ok(
    statSync(file).size < 512 * 1024,
    `coperta are ${statSync(file).size} bytes, plafonul e 512 KB`
  );
  const image = await loadImage(file);
  assert.equal(image.width, 3000);
  assert.equal(image.height, 3000);
});
