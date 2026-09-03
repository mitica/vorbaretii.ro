import type { Metadata } from "next";
import Link from "next/link";
import ArticleShell from "../components/article-shell";
import { articles, getArticle } from "../articles";

type Props = { params: { slug: string } };

/**
 * Export static: fiecare JSON din content/ devine o pagină la build. Corpusul GOL e
 * stare legală (ștergerea poate goli site-ul), dar exportul Next refuză o rută
 * dinamică fără nicio cale — santinela ține ruta în viață cu o pagină de stare goală.
 */
const EMPTY_SLUG = "inca-nimic";

export function generateStaticParams() {
  if (articles.length === 0) return [{ slug: EMPTY_SLUG }];
  return articles.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: Props): Metadata {
  if (articles.length === 0) {
    return { title: "Articole - Vorbăreții", robots: { index: false } };
  }
  const entry = getArticle(params.slug);
  return {
    title: `${entry.data.title} - articol în română pentru copii`,
    description: entry.data.summary,
    alternates: { canonical: `/articole/${entry.slug}` },
    openGraph: {
      title: entry.data.title,
      description: entry.data.summary,
      images: [{ url: `/assets/og/${entry.slug}.png`, width: 1200, height: 630 }],
      siteName: "Vorbăreții",
      locale: "ro_RO",
      type: "article",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function Page({ params }: Props) {
  if (articles.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Încă niciun articol</h1>
        <p className="mt-4">
          Primul e pe drum. Între timp,{" "}
          <Link href="/jocuri" className="underline">
            jocurile te așteaptă
          </Link>
          .
        </p>
      </main>
    );
  }
  return <ArticleShell entry={getArticle(params.slug)} />;
}
