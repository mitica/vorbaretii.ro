import Link from "next/link";
import config from "@/lib/config";
import { DEMO_MESSAGE } from "@/lib/contact";
import TrackLink from "@/app/components/track-link";
import { btn, cardBand, pillAge } from "@/app/components/ui";
import { taxonomy } from "../taxonomy";
import type { ArticleEntry } from "../articles";
import MoreBox from "./more-box";
import SourcesBlock from "./sources-block";

function Chips({ entry }: { entry: ArticleEntry }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className={pillAge}>de la {entry.data.age} ani</span>
      <span className="rounded-full border border-pink-100 bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-600">
        🕰️ ~{entry.readingMinutes} min
      </span>
      {entry.data.tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
        >
          {taxonomy.tags[tag] ?? tag}
        </span>
      ))}
    </div>
  );
}

function BeatImages({ entry, anchors }: { entry: ArticleEntry; anchors: string[] }) {
  if (anchors.length === 0) return null;
  return (
    <div className={"my-4 grid gap-3 " + (anchors.length > 1 ? "sm:grid-cols-2" : "")}>
      {anchors.map((anchor) => {
        const image = entry.images[anchor];
        if (!image) return null;
        return (
          <img
            key={anchor}
            src={image.src}
            alt={image.alt}
            className="w-full rounded-2xl border border-pink-100"
          />
        );
      })}
    </div>
  );
}

function QuestionsBlock({ entry }: { entry: ArticleEntry }) {
  const questions = entry.data.sections.flatMap((s) => s.questions);
  return (
    <section className="mt-8 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-indigo-50 px-5 py-4">
      <h2 className="text-lg font-extrabold text-gray-900">💬 Întrebările poveștii.</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 font-semibold text-gray-900">
        {questions.map((q) => (
          <li key={q.question}>{q.question}</li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-gray-600">Le știi? Răspunsurile sunt toate în poveste.</p>
      <p className="mt-2 text-sm font-bold text-indigo-600">
        🎲 Le găsești și în jocul{" "}
        <Link
          href="/jocuri/curiozitati"
          className="inline-flex min-h-[44px] items-center underline hover:text-indigo-500"
        >
          Curiozități
        </Link>
        {" — categoria "}
        {taxonomy.categories[entry.data.category] ?? entry.data.category}.
      </p>
    </section>
  );
}

function ClubBand() {
  const text = encodeURIComponent(DEMO_MESSAGE);
  return (
    <div className={cardBand + " mt-8 flex flex-wrap items-center justify-between gap-4 px-5 py-4"}>
      <div>
        <p className="font-extrabold text-gray-900">
          Ți-a plăcut povestea? La club le spunem cu vocea.
        </p>
        <p className="text-sm text-gray-600">
          O oră pe săptămână, cu copii care vorbesc românește ca tine.
        </p>
      </div>
      <TrackLink
        href={`https://wa.me/${config.phoneNumber.replace(/\D/g, "")}?text=${text}`}
        event="demo_articol"
        className={btn("primary")}
      >
        Rezervă o lecție demo gratuită
      </TrackLink>
    </div>
  );
}

function ArticleHead({ data }: { data: ArticleEntry["data"] }) {
  const crumb =
    "inline-flex min-h-[44px] items-center font-semibold text-indigo-600 hover:underline";
  return (
    <>
      <nav className="text-sm text-gray-500">
        <Link href="/" className={crumb}>
          Vorbăreții
        </Link>
        {" · "}
        <Link href="/articole" className={crumb}>
          Articole
        </Link>
      </nav>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 sm:text-sm">
        {taxonomy.categories[data.category] ?? data.category}
        {data.series ? ` · seria „${taxonomy.seriesTitles[data.series] ?? data.series}”` : ""}
      </p>
    </>
  );
}

/** Rama articolului: antet, corp pe secțiuni cu imaginile beat-urilor, cozile. */
export default function ArticleShell({ entry }: { entry: ArticleEntry }) {
  const { data } = entry;
  return (
    <article className="mx-auto max-w-2xl px-6 pb-16 pt-6">
      <ArticleHead data={data} />
      <h1 className="mt-1 text-balance text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
        {data.title}
      </h1>
      <p className="mt-3 text-pretty text-lg leading-8 text-gray-600">{data.summary}</p>
      <Chips entry={entry} />

      <img
        src={entry.images.erou?.src}
        alt={entry.images.erou?.alt ?? ""}
        className="mt-6 w-full rounded-2xl shadow-md"
      />

      {data.sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2 className="mt-10 text-balance text-xl font-extrabold text-gray-900 sm:text-2xl">
            {section.title}
          </h2>
          {section.beats.map((beat, index) => (
            <div key={index}>
              <p className="mt-3 leading-7 text-gray-800">{beat.text}</p>
              <BeatImages entry={entry} anchors={beat.images} />
            </div>
          ))}
          {section.more ? <MoreBox text={section.more} /> : null}
        </section>
      ))}

      <QuestionsBlock entry={entry} />
      <SourcesBlock sources={data.sources} />
      <ClubBand />
    </article>
  );
}
