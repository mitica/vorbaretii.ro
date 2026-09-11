/**
 * Legea feed-ului Vorbărici (ADR-048, succesoarea ADR-032): canalul e al
 * RITUALULUI și e complet chiar fără niciun episod; episodul își POARTĂ
 * identitatea, iar randatorul nu compune nimic; `pubDate` la 04:00 UTC; textele
 * scăpate; ruta statică și auto-descoperirea în cap; coperta JPEG 3000×3000 sub
 * 512 KB. Plus fereastra de ZI (ADR-047): un lot generat odată apare câte un
 * episod pe zi, iar item-ul se derivă DOAR din dată. Rulează cu `yarn test`.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { COVER_MAX_BYTES, chipBox, encodeUnderBudget } from "./generate-podcast-cover";
import {
  PODCAST,
  buildPodcastFeed,
  episodeFor,
  feedEpisodes,
  podcastGuid,
  pubDate,
  type Episode,
} from "../app/azi/podcast";
import type { RitualEpisode } from "../app/azi/episodes";
import { RITUAL, dateFromStamp, todayStamp } from "../app/azi/naming";

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

/* ------------------------- fereastra de zi si item-ul zilei (ADR-047) */

/** Un episod de pe disc: registrul întreg e forma asta, o dată per zi. */
const committed = (
  date: string,
  file = `${date.replace(/-/g, "")}.episode.mp3`
): RitualEpisode => ({
  date,
  file,
  bytes: 2_160_000,
  seconds: 135,
});

const WEEK = ["2026-09-19", "2026-09-20", "2026-09-21", "2026-09-22"].map((date) =>
  committed(date)
);

test("ADR-047: feed-ul taie la ZIUA dată — lotul de mâine e pe disc, dar nu în feed", () => {
  const today = feedEpisodes(BASE, WEEK, "2026-09-21");
  assert.deepEqual(
    today.map((item) => item.guid),
    [
      "vorbaretii:vorbarici:2026-09-21",
      "vorbaretii:vorbarici:2026-09-20",
      "vorbaretii:vorbarici:2026-09-19",
    ],
    "ADR-047 — fereastra taie la zi, iar ordinea e descrescătoare"
  );

  // O zi mai devreme = un item mai puțin: exact ce face un lot de 14 zile.
  assert.equal(feedEpisodes(BASE, WEEK, "2026-09-20").length, today.length - 1);
  assert.deepEqual(feedEpisodes(BASE, WEEK, "2026-09-18"), [], "înainte de prima zi, feed gol");

  // Același (registru, zi) = același XML, oricum ar veni registrul de pe disc:
  // fără asta, un build de rutină ar rescrie feed-ul sub abonați.
  assert.equal(
    buildPodcastFeed(BASE, feedEpisodes(BASE, [...WEEK].reverse(), "2026-09-21")),
    buildPodcastFeed(BASE, today),
    "ADR-047 — feed-ul nu e reproductibil"
  );
});

test("ADR-047: item-ul se derivă DOAR din dată — niciun câmp nu vine din cartea zilei", () => {
  const [item] = feedEpisodes(BASE, [committed("2026-09-21", "abc.episode.mp3")], "2026-09-21");
  assert.equal(item?.guid, "vorbaretii:vorbarici:2026-09-21");
  assert.equal(item?.title, "Vorbărici · luni, 21 septembrie");
  assert.equal(item?.link, `${BASE}/azi`);
  assert.equal(
    item?.description,
    "Cartea de luni, 21 septembrie: o ghicitoare, o întrebare de povestit, o frământare de limbă." +
      " Ascultați împreună — liniștea din episod e a copilului. De la 7 ani."
  );
  assert.equal(item?.pubDate, pubDate("2026-09-21"));
  assert.deepEqual(item?.enclosure, {
    url: `${BASE}/assets/audio/vorbarici/2026-09-21/abc.episode.mp3`,
    bytes: 2_160_000,
    seconds: 135,
  });

  // Sursa: `pickForDay` are `n` și în ciclu, și în poziție, deci cartea oricărei
  // zile se re-derivă la orice ghicitoare nouă — trecutul inclusiv. Un titlu luat
  // din carte ar schimba XML-ul deja publicat la fiecare creștere de corpus.
  const source = readFileSync(join(process.cwd(), "app/azi/podcast.ts"), "utf8");
  assert.ok(
    !/todayCard|riddles|tongueTwisters|wheelItems/.test(source),
    "ADR-047 — feed-ul atinge cartea zilei; XML-ul publicat s-ar schimba sub abonați"
  );
});

test("ADR-047: episodeFor — calea servită cu intrare, `null` fără ea", () => {
  const registry = [committed("2026-09-20", "aaa.episode.mp3"), committed("2026-09-21")];
  assert.equal(
    episodeFor(registry, "2026-09-20"),
    "/assets/audio/vorbarici/2026-09-20/aaa.episode.mp3"
  );
  assert.equal(episodeFor(registry, "2026-09-22"), null, "zi fără episod = rândul tace");
  assert.equal(episodeFor([], "2026-09-20"), null, "registru gol = rândul tace");
});

test("ADR-047: ștampila nu e un instant UTC — aceeași carte în ORICE fus", () => {
  const before = process.env.TZ;
  try {
    // Kiritimati e +14, Midway −11: între ele încap toate fusurile locuite.
    for (const zone of ["Pacific/Midway", "America/Los_Angeles", "UTC", "Pacific/Kiritimati"]) {
      process.env.TZ = zone;
      const date = dateFromStamp("2026-09-21");
      assert.equal(date.getFullYear(), 2026, zone);
      assert.equal(date.getMonth(), 8, zone);
      assert.equal(date.getDate(), 21, `ADR-047 — ${zone}: ștampila a alunecat cu o zi`);
      assert.equal(
        feedEpisodes(BASE, [committed("2026-09-21")], "2026-09-21")[0]?.title,
        "Vorbărici · luni, 21 septembrie",
        `ADR-047 — ${zone}: item-ul zilei poartă altă zi`
      );
      // Ziua build-ului e UTC: fereastra nu depinde de mașina care face build-ul.
      assert.equal(todayStamp(new Date("2026-09-21T23:30:00Z")), "2026-09-21", zone);
      assert.equal(todayStamp(new Date("2026-09-22T00:30:00Z")), "2026-09-22", zone);
    }

    // Fusul de probă chiar mută ziua la parse-ul UTC — altfel bucla de sus n-ar
    // dovedi nimic: ar trece și cu `new Date(stamp)` în `dateFromStamp`.
    process.env.TZ = "America/Los_Angeles";
    assert.equal(new Date("2026-09-21").getDate(), 20, "fusul de probă nu mai mută ziua");
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
});

test("ADR-048: registrul articolelor GOL — feed-ul rămâne valid și păstrează episoadele", () => {
  const xml = buildPodcastFeed(BASE, feedEpisodes(BASE, WEEK, "2026-09-21"));
  assert.equal((xml.match(/<item>/g) ?? []).length, 3, "episoadele Vorbărici rămân");
  assert.ok(xml.includes(RITUAL.title) && xml.includes("<podcast:guid>"), "canalul e întreg");
  assert.ok(!/articole/.test(xml), "ADR-048 — nimic al articolelor în feed");

  // Fără aserțiunea asta, „registru gol" ar fi neobservabil: un import rămas ar
  // ține feed-ul legat de articole fără ca vreun XML să arate diferit.
  for (const file of ["app/azi/podcast.ts", "app/azi/episodes.ts"]) {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    assert.ok(
      !/from\s+["'][^"']*articole/.test(source),
      `ADR-048 — ${file} importă din casa articolelor`
    );
  }
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
  assert.ok(
    route.includes("todayStamp(new Date())"),
    "ADR-047 — ruta nu citește ziua build-ului, deci fereastra n-are la ce tăia"
  );
  assert.equal(
    (route.match(/new Date\(/g) ?? []).length,
    1,
    "ADR-047 — ziua se citește O DATĂ: două citiri pot cădea de părți diferite ale miezului nopții"
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

/* ------------------------- coperta si re-publicarea zilnica (ADR-049) */

test("ADR-048: textul chip-ului de pe coperta vine din RITUAL.name", () => {
  const generator = readFileSync(join(process.cwd(), "scripts/generate-podcast-cover.ts"), "utf8");
  assert.equal(
    /const CHIP_LABEL = ([^;]+);/.exec(generator)?.[1] ?? "",
    "RITUAL.name",
    "ADR-048 — coperta scrie numele de mână în loc să-l ceară din RITUAL"
  );
  assert.match(
    generator,
    /fillText\(CHIP_LABEL,/,
    "ADR-048 — chip-ul desenează altceva decât CHIP_LABEL"
  );
  assert.ok(
    !generator.includes("Gaița povestește"),
    "ADR-048 — numele vechi, al podcastului de articole, e înapoi pe copertă"
  );
});

test("ADR-048: cutia chip-ului imbraca textul masurat, centrata pe axa copertei", () => {
  const [narrowX, top, narrowWidth, height] = chipBox(400);
  const [wideX, wideTop, wideWidth, wideHeight] = chipBox(900);
  assert.equal(
    wideWidth - narrowWidth,
    500,
    "cutia nu urmează lățimea textului — a rămas fixă, de la alt nume"
  );
  assert.equal(narrowWidth - 400, wideWidth - 900, "aerul nu e același la orice lungime de text");
  assert.ok(narrowWidth > 400, "textul n-are aer de o parte și de alta");
  assert.equal(narrowX + narrowWidth / 2, 1500, "chip-ul a ieșit de pe axa copertei");
  assert.equal(wideX + wideWidth / 2, 1500, "chip-ul a ieșit de pe axa copertei");
  assert.deepEqual([top, height], [wideTop, wideHeight], "chip-ul și-a schimbat înălțimea");
});

test("ADR-049: workflow-ul are un declansator zilnic", () => {
  const workflow = readFileSync(join(process.cwd(), ".github/workflows/nextjs.yml"), "utf8");
  assert.match(workflow, /^ {2}schedule:$/m, "ADR-049 — nu există declanșator `schedule`");
  assert.match(
    workflow,
    /^ {4}- cron: "0 3 \* \* \*"$/m,
    "ADR-049 — fără cron zilnic, un lot generat odată ar apărea tot deodată în feed"
  );
});

test("ADR-049: pasul de cache e sarit pe rularile de cron", () => {
  const workflow = readFileSync(join(process.cwd(), ".github/workflows/nextjs.yml"), "utf8");
  const step = /^ {6}- name: Restore cache$\n([\s\S]*?)(?=^ {6}- name: )/m.exec(workflow)?.[1];
  assert.ok(step, "pasul de restaurare a cache-ului nu mai poartă numele „Restore cache”");
  assert.match(
    step ?? "",
    /^ {8}if: github\.event_name != 'schedule'$/m,
    "ADR-049 — pe cron nimic din arbore nu s-a schimbat, iar cache-ul reluat ar reda XML-ul de ieri"
  );
});
