import type { Article } from "../content/schema";

const LANG_LABEL: Record<string, string> = {
  ro: "română",
  en: "engleză",
  de: "germană",
  fr: "franceză",
};

/** Sursele — listă simplă de referințe la finalul articolului, fără card. */
export default function SourcesBlock({ sources }: { sources: Article["sources"] }) {
  return (
    <section className="mt-10">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Surse</h2>
      <ul className="mt-1">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              className="block min-h-[44px] py-2.5 text-sm font-medium text-indigo-600 [overflow-wrap:anywhere] hover:underline"
            >
              {decodeURIComponent(source.url).replace(/^https?:\/\//, "")}
              <span className="ml-2 font-normal text-gray-500">
                {LANG_LABEL[source.lang] ?? source.lang}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
