import Link from "next/link";
import ClubInvite from "@/app/components/club-invite";
import Disclosure from "@/app/components/disclosure";
import { eyebrow, pillAge, pillFact, pillTag } from "@/app/components/ui";
import { taxonomy } from "../taxonomy";
import { srcsetFor } from "../image-srcset";
import type { ArticleEntry } from "../articles";
import SourcesBlock from "./sources-block";

function Chips({ entry }: { entry: ArticleEntry }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className={pillAge}>de la {entry.data.age} ani</span>
      <span className={pillFact}>🕰️ ~{entry.readingMinutes} min</span>
      {entry.data.tags.map((tag) => (
        <span key={tag} className={pillTag}>
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
        const srcSet = srcsetFor(image.src);
        return (
          <img
            key={anchor}
            src={image.src}
            srcSet={srcSet}
            sizes={srcSet ? "(max-width: 672px) 100vw, 672px" : undefined}
            width={srcSet ? 1536 : undefined}
            height={srcSet ? 864 : undefined}
            loading="lazy"
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
      <h2 className="text-lg font-extrabold text-gray-900">💬 Întrebările articolului.</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 font-semibold text-gray-900">
        {questions.map((q) => (
          <li key={q.question}>{q.question}</li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-gray-600">Le știi? Răspunsurile sunt toate în articol.</p>
      <Link
        href="/jocuri/curiozitati"
        className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold leading-snug text-indigo-600 hover:text-indigo-500"
      >
        🎲 Joacă-le în Curiozități — categoria{" "}
        {taxonomy.categories[entry.data.category] ?? entry.data.category} →
      </Link>
    </section>
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

      <p className={"mt-4 " + eyebrow}>
        {taxonomy.categories[data.category] ?? data.category}
        {data.series ? ` · seria „${taxonomy.seriesTitles[data.series] ?? data.series}”` : ""}
      </p>
    </>
  );
}

function HeroImage({ hero }: { hero?: { src: string; alt: string } }) {
  const set = hero ? srcsetFor(hero.src) : undefined;
  return (
    <img
      src={hero?.src}
      srcSet={set}
      sizes={set ? "(max-width: 672px) 100vw, 672px" : undefined}
      width={set ? 1536 : undefined}
      height={set ? 864 : undefined}
      alt={hero?.alt ?? ""}
      className="mt-6 w-full rounded-2xl shadow-md"
    />
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

      <HeroImage hero={entry.images.erou} />

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
          {section.more ? (
            <Disclosure summary="Mai mult, pentru curioși">
              <p>{section.more}</p>
            </Disclosure>
          ) : null}
        </section>
      ))}

      <QuestionsBlock entry={entry} />
      <SourcesBlock sources={data.sources} />
      <div className="mt-8">
        <ClubInvite
          title="Ți-a plăcut articolul? La club le povestim cu vocea."
          body="O oră pe săptămână, cu copii care vorbesc românește ca tine."
          event="demo_articol"
        />
      </div>
    </article>
  );
}
