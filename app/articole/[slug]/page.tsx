import type { Metadata } from "next";
import ArticleShell from "../components/article-shell";
import { articles, getArticle } from "../articles";

type Props = { params: { slug: string } };

/** Export static: fiecare JSON din content/ devine o pagină la build. */
export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: Props): Metadata {
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
  return <ArticleShell entry={getArticle(params.slug)} />;
}
