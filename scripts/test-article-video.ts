/**
 * Legea derivării timpilor (ADR-015): Timeline-ul articolului iese determinist
 * din aliniere — segmentele (titlu + fiecare beat) acoperă tot textul vorbit,
 * fără goluri și fără suprapuneri, timpii sunt monotoni, iar fiecare cuvânt
 * cade în segmentul lui. Se probează pe un fixture construit de mână ȘI pe
 * corpusul real (articolele cu audio).
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Article } from "../app/articole/content/schema";
import { articleAudioSpec, speaksSectionTitle, spokenText } from "../app/articole/audio-naming";
import {
  articleTimeline,
  endsSentence,
  reactionsFor,
  shotWindows,
  type Alignment,
  type TimedWord,
  type TimelineSegment,
} from "../app/articole/beat-timing";
import {
  BAND_BY_BAND,
  BUBBLE,
  CHIP,
  MASCOT,
  OUTRO,
  PANEL,
  QUESTION,
  REACTION,
  STINGS,
  VIDEO,
} from "./video/config";
import * as config from "./video/config";
import { mascotBox, poseAt, spritePhase } from "./video/mascot-layer";
import { mascotSvg } from "../app/components/mascot/mascot-svg";
import { panelLayout, windowsFor } from "./video/text-band";
import { filmLength, filmPhase, filmRange, toAudioTime } from "./video/film";
import { audioArgs } from "./video/audio-track";
import { renderRange } from "./video/compose";
import { backgroundRect } from "./video/background";
import { bandFor, shotAnchors } from "./video/shots";
import { bubbleBox, bubbleHeight } from "./video/bubble-box";

const AUDIO_ROOT = join(process.cwd(), "public/assets/audio/articole");
const CONTENT_DIR = join(process.cwd(), "app/articole/content");

/** Aliniere sintetică: fiecare caracter durează 0,1s — timpii sunt previzibili. */
function syntheticAlignment(text: string): Alignment {
  const characters = [...text];
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => i * 0.1),
    character_end_times_seconds: characters.map((_, i) => (i + 1) * 0.1),
  };
}

const FIXTURE = {
  title: "Un titlu de probă",
  sections: [
    {
      id: "unu",
      title: "S1",
      beats: [
        { text: "Primul beat spune ceva.", images: ["casa"] },
        {
          text: "Al doilea beat, cu voce.",
          images: ["casa", "pom"],
          voce: "[excited] Al doilea beat, cu voce.",
        },
      ],
      questions: [],
    },
    { id: "doi", title: "S2", beats: [{ text: "Beatul final.", images: ["deal"] }], questions: [] },
  ],
} as unknown as Article;

/** Textul vorbit al fixturii: titlul, apoi per secțiune numele (când se rostește — ADR-028) și beat-urile. */
function fixtureSpoken(): string {
  const parts = FIXTURE.sections.flatMap((s) => [
    ...(speaksSectionTitle(s) ? [spokenText(s.title)] : []),
    ...s.beats.map((b) => spokenText(b.voce ?? b.text)),
  ]);
  return [FIXTURE.title, ...parts].join(" ");
}

test("ADR-015: segmentele acoperă tot textul vorbit, în ordine, fără goluri", () => {
  const alignment = syntheticAlignment(fixtureSpoken());
  const timeline = articleTimeline(FIXTURE, alignment);
  assert.equal(timeline.length, 1 + 2 + 3, "titlu + 2 nume de secțiune + 3 beat-uri (ADR-028)");
  assert.deepEqual(
    timeline.map((s) => s.kind),
    ["titlu", "sectiune", "beat", "beat", "sectiune", "beat"],
    "numele secțiunii precede beat-urile ei (ADR-028)"
  );
  const joined = timeline.map((s) => s.text.replace(/\s+/g, "")).join("");
  assert.equal(joined, fixtureSpoken().replace(/\s+/g, ""));
  const last = timeline[timeline.length - 1]!;
  assert.equal(last.end, alignment.character_end_times_seconds.at(-1));
  for (let i = 1; i < timeline.length; i++)
    assert.ok(timeline[i]!.start >= timeline[i - 1]!.end - 1e-9, `suprapunere la segmentul ${i}`);
});

test("ADR-015: fiecare cuvânt cade în segmentul lui, cu timpi monotoni", () => {
  const timeline = articleTimeline(FIXTURE, syntheticAlignment(fixtureSpoken()));
  for (const segment of timeline) {
    assert.equal(segment.words.length, segment.text.split(/\s+/).filter(Boolean).length);
    let previous = segment.start;
    for (const word of segment.words satisfies TimedWord[]) {
      assert.ok(
        word.start >= previous - 1e-9,
        `cuvântul "${word.text}" începe înaintea celui dinainte`
      );
      assert.ok(word.end <= segment.end + 1e-9, `cuvântul "${word.text}" iese din segment`);
      previous = word.start;
    }
  }
});

test("ADR-015: caracter nepotrivit între articol și aliniere → respins cu poziția", () => {
  const alignment = syntheticAlignment(fixtureSpoken().replace("titlu", "tXtlu"));
  assert.throws(() => articleTimeline(FIXTURE, alignment), /nu se potrivește/);
});

/** Măsurător injectabil: lățime fixă per caracter — geometria e previzibilă. */
const measure = (text: string): number => text.length * 10;

function timedWords(text: string): TimedWord[] {
  let at = 0;
  return text.split(/\s+/).map((word) => {
    const start = at;
    at += word.length * 0.1;
    return { text: word, start, end: at };
  });
}

test("ADR-015: ferestrele benzii — cel mult maxLines rânduri, fiecare cuvânt exact o dată, starturi monotone", () => {
  const words = timedWords(
    "O poveste destul de lungă încât să se rupă în mai multe rânduri și în mai multe ferestre succesive pe voce."
  );
  const limits = { ...BAND_BY_BAND["9-11"], minSeconds: 0 };
  const windows = windowsFor(words, { measure, maxWidth: 300, limits });
  assert.ok(windows.length >= 2, "fixture-ul trebuie să producă mai multe ferestre");
  const seen = windows.flatMap((w) => w.lines.flatMap((line) => line.words.map((x) => x.text)));
  assert.deepEqual(
    seen,
    words.map((w) => w.text),
    "fiecare cuvânt, exact o dată, în ordine"
  );
  for (const w of windows)
    assert.ok(w.lines.length <= limits.maxLines, "fereastră peste maxLines rânduri");
  for (let i = 1; i < windows.length; i++)
    assert.ok(windows[i]!.start > windows[i - 1]!.start, "starturile ferestrelor nu cresc");
  for (const w of windows)
    for (const line of w.lines)
      assert.ok(line.width <= 300, `rând peste lățimea maximă: ${line.width}`);
});

/** Cuvinte la 2 pe secundă — ritmul benzii 7–8. */
function pacedWords(text: string, secondsPerWord: number): TimedWord[] {
  return text.split(/\s+/).map((word, i) => ({
    text: word,
    start: i * secondsPerWord,
    end: (i + 1) * secondsPerWord,
  }));
}

test("ADR-030: la 7–8 fereastra ține un rând și cel puțin 3 secunde — durata bate ținta de cuvinte", () => {
  const words = pacedWords(
    "Mărțișorul: un fir alb și un fir roșu, răsucite împreună, și de ele atârnă ceva mic, un bănuț sau o floare. Ți-l prinde cineva drag în piept, pe 1 martie.",
    0.5
  );
  const limits = BAND_BY_BAND["7-8"];
  const windows = windowsFor(words, { measure, maxWidth: 2000, limits });
  assert.ok(windows.length >= 3);
  for (const w of windows) assert.equal(w.lines.length, 1, "un singur rând la 7–8");
  for (let i = 1; i < windows.length; i++)
    assert.ok(
      windows[i]!.start - windows[i - 1]!.start >= limits.minSeconds - 1e-9,
      `fereastra ${i - 1} a stat sub ${limits.minSeconds} s`
    );
});

test("ADR-030: cutia bulei = cardul ∪ coada spre mascotă; înălțimea urmează rândurile", () => {
  const one = bubbleBox(1);
  assert.equal(one.x, BUBBLE.rightEdge - BUBBLE.width);
  assert.equal(one.width, BUBBLE.width + BUBBLE.tailOut);
  assert.equal(one.y, VIDEO.height - BUBBLE.bottom - bubbleHeight(1));
  assert.ok(bubbleBox(2).height > one.height, "două rânduri = bulă mai înaltă");
  assert.equal(CHIP.fill, "#FFC526", "chip-ul secțiunii e galben (decizia operatorului)");
});

test("ADR-030: panoul static încape pe cel mult două rânduri coborând fontul", () => {
  const question =
    "Care e semnul că poți da mărțișorul jos, când vin berzele sau când înflorește pomul?";
  assert.ok(question.length <= 85 && question.length >= 80, "întrebare la limita schemei");
  const measureFor = (font: number) => (text: string) => text.length * font * 0.55;
  const layout = panelLayout(question, measureFor);
  assert.ok(layout.lines.length <= PANEL.maxLines);
  assert.equal(layout.font, 44, "85 de caractere nu încap la 54, încap la 44");
  assert.equal(panelLayout("Un titlu scurt", measureFor).font, PANEL.fonts[0]);
});

test("ADR-030: ferestrele cadrelor — la granița de propoziție, cât mai egale; o propoziție → cuvântul median", () => {
  const timeline = articleTimeline(FIXTURE, syntheticAlignment(fixtureSpoken()));
  const second = timeline.find((s) => s.kind === "beat" && s.beatIndex === 1)!;
  const windows = shotWindows(second, 2, 0.5);
  assert.equal(windows.length, 2);
  assert.equal(windows[0]!.start, second.start);
  assert.equal(windows[1]!.end, second.end);
  assert.equal(windows[0]!.end, windows[1]!.start, "fără gol între cadre");
  assert.equal(
    windows[1]!.start,
    second.words[Math.round(second.words.length / 2)]!.start,
    "o singură propoziție → tăiere la mijloc"
  );
  assert.equal(shotWindows(second, 2, 5).length, 1, "beat scurt → un singur cadru");
  assert.equal(shotWindows(second, 0, 0.5).length, 1, "fără imagini → un cadru");
});

test("ADR-030: pe beat-ul real cu patru propoziții, două cadre se taie după „proaspătă.”", () => {
  const beat =
    "Și bănuțul? Nu se păstra. Când dădeai șnurul jos, te duceai cu bănuțul și cumpărai caș, brânză albă și proaspătă. Bătrânii ziceau că cine mănâncă din el rămâne alb la față și sănătos tot anul.";
  const article = {
    title: "T",
    sections: [{ id: "a", title: "S", beats: [{ text: beat, images: ["x", "y"] }], questions: [] }],
  } as unknown as Article;
  const timeline = articleTimeline(article, syntheticAlignment(`T S ${beat}`));
  const segment = timeline.find((seg) => seg.kind === "beat")!;
  const windows = shotWindows(segment, 2, 0.5);
  assert.equal(segment.words[20]!.text, "Bătrânii");
  assert.equal(windows[1]!.start, segment.words[20]!.start);
});

test("ADR-030: cadrele acoperă exact timeline-ul — titlul pe erou, numele secțiunii pe prima imagine, beat-ul pe imaginile lui", () => {
  const timeline = articleTimeline(FIXTURE, syntheticAlignment(fixtureSpoken()));
  const shots = shotAnchors(FIXTURE, timeline, bandFor(FIXTURE));
  assert.deepEqual(
    shots.map((s) => s.anchor),
    ["erou", "casa", "casa", "casa", "deal", "deal"],
    "beat-ul scurt cu două imagini rămâne pe un cadru (sub cadrul minim al benzii)"
  );
  let cursor = 0;
  for (const segment of timeline) {
    const own = shots.filter((s) => s.start >= segment.start - 1e-9 && s.end <= segment.end + 1e-9);
    assert.ok(own.length >= 1, `segmentul ${segment.kind} fără cadru`);
    assert.equal(own[0]!.start, segment.start);
    assert.equal(own[own.length - 1]!.end, segment.end);
    for (const s of own) {
      assert.equal(shots[cursor], s, "cadrele sunt în ordine");
      cursor++;
    }
  }
  assert.equal(cursor, shots.length, "niciun cadru în afara segmentelor");
});

test("ADR-030: ceasul filmului — sting + integrala + întrebarea + outro; probele includ intro-ul", () => {
  const timeline = articleTimeline(FIXTURE, syntheticAlignment(fixtureSpoken()));
  const last = timeline.length - 1;
  const length = filmLength(timeline);
  assert.equal(
    length,
    STINGS.intro.seconds + timeline[last]!.end + QUESTION.seconds + OUTRO.seconds
  );
  assert.deepEqual(filmRange(timeline, undefined), { start: 0, end: length });
  const probe = filmRange(timeline, { from: 0, to: 1 });
  assert.equal(probe.start, 0, "proba începe cu intro-ul");
  assert.equal(probe.end, STINGS.intro.seconds + timeline[1]!.end);
  const ending = filmRange(timeline, { from: last - 1, to: last });
  assert.equal(ending.start, STINGS.intro.seconds + timeline[last - 1]!.start);
  assert.equal(ending.end, length, "finalul include întrebarea și outro-ul");
  assert.equal(filmPhase(0, timeline), "intro");
  assert.equal(filmPhase(STINGS.intro.seconds + timeline[0]!.start + 0.01, timeline), "body");
  assert.equal(filmPhase(STINGS.intro.seconds + timeline[last]!.end + 1, timeline), "question");
  assert.equal(
    filmPhase(STINGS.intro.seconds + timeline[last]!.end + QUESTION.seconds + 0.5, timeline),
    "outro"
  );
  assert.equal(toAudioTime(STINGS.intro.seconds), 0);
});

test("ADR-030: pista pe două stinguri — intro-ul și încheierea fixate la duratele lor, trei intrări, cinci bucăți, coada = outro − încheiere, fără -ss", () => {
  const paths = { intro: "i.mp3", outro: "o.mp3" };
  const args = audioArgs({ audioPath: "a.mp3", stingPaths: paths }, { start: 0, end: 10 });
  const inputs = args.filter((_, i) => args[i - 1] === "-i");
  assert.deepEqual(inputs, ["i.mp3", "a.mp3", "o.mp3"], "intrările: intro, integrala, încheierea");
  const filter = args[args.indexOf("-filter_complex") + 1]!;
  for (const { seconds } of [STINGS.intro, STINGS.outro]) {
    const fixed = seconds.toFixed(3);
    assert.ok(filter.includes(`atrim=0:${fixed},apad=whole_dur=${fixed}`), `fixat la ${fixed}`);
  }
  assert.ok(filter.includes(`atrim=0:${(OUTRO.seconds - STINGS.outro.seconds).toFixed(3)}[t]`));
  assert.ok(filter.includes("[s1][a][q][s2][t]concat=n=5:v=0:a=1"));
  assert.ok(filter.includes("atrim=0.000:10.000"));
  assert.ok(!args.includes("-ss"), "probele taie din pista întreagă, nu cu -ss");
  for (const { file } of [STINGS.intro, STINGS.outro])
    assert.ok(existsSync(join(process.cwd(), file)), `${file} e comis`);
  assert.ok(!("STING" in config), "STING singular nu mai există — două stinguri, o casă");
});
test("ADR-030: intervalul randat — o fereastră de timp (previzualizarea unui sting) bate segmentele; fără ea, segmentele", () => {
  const timeline = articleTimeline(FIXTURE, syntheticAlignment(fixtureSpoken()));
  const window = { start: 2.5, end: 9 };
  assert.deepEqual(renderRange({ timeline, window }), window, "fereastra, ca atare");
  assert.deepEqual(
    renderRange({ timeline, range: { from: 0, to: 1 } }),
    filmRange(timeline, { from: 0, to: 1 })
  );
  assert.deepEqual(renderRange({ timeline }), filmRange(timeline, undefined), "nimic → tot filmul");
});

test("ADR-015: legea acoperirii — Ken Burns nu expune niciodată marginea cadrului", () => {
  const master = { width: 2816, height: 1584 };
  for (let index = 0; index < 8; index++) {
    for (let step = 0; step <= 20; step++) {
      const rect = backgroundRect(master, index, step / 20);
      const at = `index ${index}, progress ${step / 20}`;
      assert.ok(rect.x <= 1e-6, `margine stângă expusă la ${at}: x=${rect.x}`);
      assert.ok(rect.y <= 1e-6, `margine sus expusă la ${at}: y=${rect.y}`);
      assert.ok(
        rect.x + rect.width >= VIDEO.width - 1e-6,
        `margine dreaptă expusă la ${at}: ${rect.x + rect.width}`
      );
      assert.ok(
        rect.y + rect.height >= VIDEO.height - 1e-6,
        `margine jos expusă la ${at}: ${rect.y + rect.height}`
      );
    }
  }
});

test("ADR-015: derivarea merge pe corpusul real (articolele cu audio)", () => {
  if (!existsSync(AUDIO_ROOT)) return;
  for (const slug of readdirSync(AUDIO_ROOT)) {
    if (!statSync(join(AUDIO_ROOT, slug)).isDirectory()) continue;
    const article = JSON.parse(readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8")) as Article;
    const spec = articleAudioSpec(article);
    const alignment = JSON.parse(
      readFileSync(join(AUDIO_ROOT, slug, spec.alignmentFile), "utf8")
    ) as Alignment;
    const timeline = articleTimeline(article, alignment);
    assert.ok(timeline.length >= 3, `${slug}: timeline suspect de scurt`);
    assert.equal(
      timeline[timeline.length - 1]!.end,
      alignment.character_end_times_seconds.at(-1),
      `${slug}: timeline-ul nu ajunge la capătul alinierii`
    );
  }
});

/** Nu se ating: dreptunghiurile au un gol pe cel puțin o axă. */
function apart(a: { x: number; y: number; width: number; height: number }, b: typeof a): boolean {
  return (
    a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y
  );
}

const SIGNATURE_ROOM = 56;

test("ADR-030: colțul mascotei nu atinge bula, pe un rând și pe două", () => {
  const box = mascotBox();
  assert.ok(apart(box, bubbleBox(1)), "mascota peste bula de un rând");
  assert.ok(apart(box, bubbleBox(2)), "mascota peste bula de două rânduri");
  assert.equal(box.width, MASCOT.size);
  assert.ok(box.width >= 280, "mascota mai mare (decizia operatorului)");
  assert.ok(
    box.x + box.width <= VIDEO.width && box.y + box.height + SIGNATURE_ROOM <= VIDEO.height,
    "în cadru, cu loc pentru semnătura de sub picioare"
  );
});

const TAGGED = {
  title: "Titlu",
  sections: [
    {
      id: "unu",
      title: "S1",
      beats: [
        {
          text: "Primul beat spune ceva.",
          images: ["casa"],
          voce: "[excited] Primul beat spune ceva.",
        },
        {
          text: "Al doilea beat, cu voce.",
          images: ["pom"],
          voce: "[curious] Al doilea beat, cu voce.",
        },
      ],
      questions: [],
    },
    {
      id: "doi",
      title: "S2",
      beats: [
        {
          text: "Beatul final. Chiar ultimul.",
          images: ["deal"],
          voce: "[sarcastic] Beatul final. [excited] Chiar ultimul.",
        },
      ],
      questions: [],
    },
  ],
} as unknown as Article;

function taggedSpoken(): string {
  const parts = TAGGED.sections.flatMap((s) => [
    ...(speaksSectionTitle(s) ? [spokenText(s.title)] : []),
    ...s.beats.map((b) => spokenText(b.voce ?? b.text)),
  ]);
  return [TAGGED.title, ...parts].join(" ");
}

test("ADR-030: reacțiile din taguri — familia, cuvântul tagat, plafonul, doza pe bandă", () => {
  const timeline = articleTimeline(TAGGED, syntheticAlignment(taggedSpoken()));
  const all = reactionsFor(TAGGED, timeline, { band: "7-8", maxSeconds: REACTION.maxSeconds });
  assert.deepEqual(
    all.map((r) => r.pose),
    ["bucurie", "gandeste", "bucurie"],
    "sarcastic nu reacționează; excited → bucurie, curious → gandeste"
  );
  const firstBeat = timeline.find((s) => s.kind === "beat")!;
  assert.equal(all[0]!.start, firstBeat.words[0]!.start, "reacția începe la cuvântul tagat");
  const last = timeline[timeline.length - 1]!;
  assert.equal(all[2]!.start, last.words[2]!.start, "al doilea tag al beat-ului → „Chiar”");
  for (const r of all) assert.ok(r.end - r.start <= REACTION.maxSeconds + 1e-9 && r.end > r.start);
  assert.equal(
    reactionsFor(TAGGED, timeline, { band: "9-11", maxSeconds: REACTION.maxSeconds }).length,
    3
  );
  const teen = reactionsFor(TAGGED, timeline, { band: "12-14", maxSeconds: REACTION.maxSeconds });
  assert.deepEqual(
    teen.map((r) => r.pose),
    ["bucurie"],
    "12–14: cel mult o reacție, din familia bucurie"
  );
});

test("ADR-030: ipostaza din timp — precedența intro/outro > reacție > vorbește > liniște", () => {
  const timeline = articleTimeline(TAGGED, syntheticAlignment(taggedSpoken()));
  const reactions = reactionsFor(TAGGED, timeline, {
    band: "7-8",
    maxSeconds: REACTION.maxSeconds,
  });
  const word = timeline[0]!.words[0]!;
  const mid = (word.start + word.end) / 2;
  assert.equal(poseAt(mid, { timeline, reactions: [], filmPhase: "body" }).pose, "vorbeste");
  assert.equal(poseAt(mid, { timeline, reactions: [], filmPhase: "intro" }).pose, "salut");
  assert.equal(poseAt(mid, { timeline, reactions: [], filmPhase: "question" }).pose, "gandeste");
  assert.equal(poseAt(mid, { timeline, reactions: [], filmPhase: "outro" }).pose, "salut");
  const reaction = reactions[0]!;
  const inside = poseAt(reaction.start + 0.05, { timeline, reactions, filmPhase: "body" });
  assert.equal(inside.pose, "bucurie", "reacția bate vorbirea");
  assert.ok(inside.phase >= 0 && inside.phase < 1);
  const after = timeline[timeline.length - 1]!.end + 1;
  assert.equal(
    poseAt(after, { timeline, reactions, filmPhase: "body" }).pose,
    "liniste",
    "pauză lungă → liniște"
  );
  const talking = poseAt(mid, { timeline, reactions: [], filmPhase: "body" });
  assert.ok(talking.phase >= 0 && talking.phase < 1);
});

test("ADR-030: legea ritmului — ciocul bate lent, fazele fine se văd toate, respirația e lentă", () => {
  assert.ok(REACTION.talkHz <= 3, "ciocul: cel mult 3 bătăi pe secundă");
  assert.ok(REACTION.phases >= 12, "cel puțin 12 faze rasterizate");
  assert.ok(REACTION.talkHz * REACTION.phases <= VIDEO.fps, "nicio fază sărită între două cadre");
  assert.ok(REACTION.idleHz <= 0.4, "respirația: o dată la cel puțin 2,5 s");
  assert.ok(
    REACTION.sentencePauseSeconds > REACTION.pauseSeconds,
    "capătul de propoziție tace mai mult decât golul dintre cuvinte"
  );
});

/** Pleoapele închise în markup-ul sursei: grupul `pleoape` cu opacity="1". */
const closedLids = (phase: number): boolean =>
  /<g class="pleoape[^"]*" fill="[^"]*" opacity="1"/.test(mascotSvg("liniste", phase));

test("ADR-030: clipirea sursei apare în liniște — fazele rasterizate se eșantionează la mijlocul treptei, altfel s-ar pierde", () => {
  const indexes = Array.from({ length: REACTION.phases }, (_, i) => i);
  assert.ok(
    indexes.some((i) => closedLids(spritePhase(i))),
    "cel puțin o fază rasterizată clipește"
  );
  assert.ok(
    !indexes.some((i) => closedLids(i / REACTION.phases)),
    "la începutul treptei nicio fază n-ar clipi — de-aia mijlocul"
  );
});

test("ADR-030: pauza de propoziție — după terminator mascota tace cât sentencePauseSeconds chiar dacă vocea a pornit; între cuvinte apropiate vorbește; într-un gol lung tace", () => {
  const words: TimedWord[] = [
    { text: "Primul", start: 0, end: 0.4 },
    { text: "beat.", start: 0.5, end: 0.9 },
    { text: "Al", start: 1.1, end: 1.4 },
    { text: "doilea", start: 1.45, end: 1.9 },
    { text: "final", start: 2.5, end: 2.9 },
  ];
  const timeline: TimelineSegment[] = [{ kind: "beat", text: "", start: 0, end: 2.9, words }];
  const at = (time: number): string =>
    poseAt(time, { timeline, reactions: [], filmPhase: "body" }).pose;
  assert.equal(at(0.45), "vorbeste", "gol de 0,1 s între două cuvinte → vorbește");
  assert.equal(at(1.3), "liniste", "la +0,4 s după „beat.” tace, deși „Al” se rostește");
  assert.equal(at(1.6), "vorbeste", "după pauza de propoziție vorbește din nou");
  assert.equal(at(2.0), "vorbeste", "la 0,1 s după un cuvânt fără terminator → încă vorbește");
  assert.equal(at(2.3), "liniste", "gol de 0,4 s fără terminator → liniște");
});

test("ADR-030: endsSentence — o casă pentru terminatorul de propoziție (ghilimele/paranteză după el)", () => {
  const word = (text: string): TimedWord => ({ text, start: 0, end: 0.1 });
  for (const text of ["ceva.", "ce?", "da!", "așa…", "adică:", "„gata.”", "(nu.)"])
    assert.ok(endsSentence(word(text)), `${text} închide propoziția`);
  for (const text of ["ceva", "3.5", "„nu", "și,"])
    assert.ok(!endsSentence(word(text)), `${text} nu închide`);
});

test("ADR-030: un beat destul de lung primește DOUĂ cadre — ancorele în ordinea imaginilor, contigue, fără gol", () => {
  const first =
    "Prima propoziție a beat-ului lung spune ceva despre mărțișor și despre firul lui alb și roșu.";
  const second =
    "A doua propoziție continuă la fel de lung, ca fereastra să treacă de cadrul minim al benzii.";
  const article = {
    title: "Titlu",
    age: 7,
    sections: [
      {
        id: "unu",
        title: "S1",
        beats: [{ text: `${first} ${second}`, images: ["casa", "pom"] }],
        questions: [],
      },
    ],
  } as unknown as Article;
  const timeline = articleTimeline(article, syntheticAlignment(`Titlu S1 ${first} ${second}`));
  const beat = timeline.find((s) => s.kind === "beat")!;
  assert.ok(beat.end - beat.start >= 12, "fixtura trece de două cadre minime la 7–8");
  const shots = shotAnchors(article, timeline, bandFor(article));
  const own = shots.filter((s) => s.start >= beat.start && s.end <= beat.end);
  assert.deepEqual(
    own.map((s) => s.anchor),
    ["casa", "pom"],
    "două cadre, în ordinea imaginilor"
  );
  assert.equal(own[0]!.start, beat.start);
  assert.equal(own[0]!.end, own[1]!.start, "fără gol între cadre");
  assert.equal(own[1]!.end, beat.end);
  const cutWord = beat.words.find((w) => w.start === own[1]!.start)!;
  assert.equal(
    cutWord.text,
    "A",
    "tăierea cade la granița de propoziție — al doilea cadru începe cu „A doua…”"
  );
});
