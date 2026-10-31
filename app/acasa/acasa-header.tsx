import { ACASA } from "./copy-week";

/** Titlul paginii și subtitlul cu data săptămânii — data lipsește cât încă nu se știe. */
export default function AcasaHeader({ label }: { label: string | null }) {
  return (
    <header>
      <h1 className="text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {ACASA.name}
      </h1>
      <p className="mt-2 text-pretty text-base leading-relaxed text-gray-600">
        {ACASA.subtitle}
        {label ? (
          <>
            {" · "}
            {/* inline-block: data trece întreagă pe rândul următor, nu se rupe la liniuță („2–” / „8 noiembrie”). */}
            <span className="inline-block font-semibold text-gray-900">{label}</span>
          </>
        ) : null}
      </p>
    </header>
  );
}
