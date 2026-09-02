import type { Article } from "../content/schema";

const LANG_LABEL: Record<string, string> = {
  ro: "română",
  en: "engleză",
  de: "germană",
  fr: "franceză",
};

/** Blocul „Vrei mai mult?” — sursele, ca invitație de explorat, nu bibliografie. */
export default function SourcesBlock({ sources }: { sources: Article["sources"] }) {
  return (
    <section className="mt-8 rounded-2xl border border-pink-100 bg-white px-5 py-4">
      <h2 className="text-base font-bold text-gray-900">Vrei mai mult? De aici am luat faptele.</h2>
      <ul className="mt-2 flex flex-col">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              className="block min-h-[44px] py-2.5 font-semibold text-indigo-600 [overflow-wrap:anywhere] hover:underline"
            >
              {decodeURIComponent(source.url).replace(/^https?:\/\//, "")}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {LANG_LABEL[source.lang] ?? source.lang}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
