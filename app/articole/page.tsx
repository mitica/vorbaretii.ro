import type { Metadata } from "next";
import Link from "next/link";
import { eyebrow } from "@/app/components/ui";
import { articles, type ArticleEntry } from "./articles";
import { taxonomy } from "./taxonomy";

const pageTitle = "Articole în română pentru copii - povești adevărate despre România";
const pageDescription =
  "Povești adevărate despre România, scrise pentru copii: istorie, tradiții, locuri. " +
  "Cu întrebări de joc la final și surse la fiecare poveste.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/articole" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    images: [{ url: "/assets/og/articole.png", width: 1200, height: 630 }],
    siteName: "Vorbăreții",
    locale: "ro_RO",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

function ArticleCard({ entry }: { entry: ArticleEntry }) {
  const hero = entry.images.erou;
  return (
    <Link
      href={`/articole/${entry.slug}`}
      className="touch-manipulation block overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50 shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
    >
      {hero ? <img src={hero.src} alt={hero.alt} className="h-40 w-full object-cover" /> : null}
      <span className="block px-5 py-4">
        <span className="block text-xs font-semibold uppercase tracking-[0.05em] text-indigo-600">
          {taxonomy.categories[entry.data.category] ?? entry.data.category}
          {entry.data.series
            ? ` · ${taxonomy.seriesTitles[entry.data.series] ?? entry.data.series}`
            : ""}
        </span>
        <span className="mt-1 block text-lg font-extrabold leading-snug text-gray-900">
          {entry.data.title}
        </span>
        <span className="mt-1 block text-sm text-gray-600">{entry.data.summary}</span>
        <span className="mt-3 flex gap-3 text-xs text-gray-500">
          <span>🕰️ ~{entry.readingMinutes} min</span>
          <span>de la {entry.data.age} ani</span>
        </span>
      </span>
    </Link>
  );
}

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-16 pt-8">
      <p className={eyebrow}>Vorbăreții · Articole</p>
      <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Povești adevărate despre țara ta.
      </h1>
      <p className="mt-3 text-pretty leading-7 text-gray-600">
        Am 700 de ani și am văzut cu ochii mei aproape tot ce e aici. Alege o poveste.
      </p>

      {articles.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-pink-100 px-5 py-6 text-gray-500">
          <p className="font-semibold text-gray-600">Primele povești sunt pe drum.</p>
          <p className="mt-1 text-sm">
            Până sosesc, sunt{" "}
            <Link
              href="/jocuri"
              className="inline-flex min-h-[44px] items-center font-semibold text-indigo-600 hover:underline"
            >
              jocurile în română
            </Link>
            {" — gata de jucat chiar acum."}
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4">
          {articles.map((entry) => (
            <li key={entry.slug}>
              <ArticleCard entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
