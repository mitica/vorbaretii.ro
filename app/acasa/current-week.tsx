"use client";

import { useEffect, useState } from "react";
import { cardWhite, linkTap } from "@/app/components/ui";
import AcasaHeader from "./acasa-header";
import { weekPath } from "./copy-week";
import { currentWeek, mondayOf } from "./dates";
import type { VoicedWeek } from "./items";
import WeekView from "./week-view";

const SKELETON_EMOJIS = ["🔮", "🎡", "👅", "🧩"];

/**
 * Ce se vede până se știe ce săptămână e. `animate-pulse` NU e decor: `yarn
 * check-ui` așteaptă dispariția lui ca barieră de hidratare.
 */
function WeekSkeleton() {
  return (
    <>
      <AcasaHeader label={null} />
      <ul className="mt-6 animate-pulse space-y-5" aria-hidden="true">
        {SKELETON_EMOJIS.map((emoji) => (
          <li key={emoji} className={cardWhite + " p-5 sm:p-6"}>
            <div className="flex min-h-[2.75rem] items-center">
              <span className="text-3xl leading-none opacity-30">{emoji}</span>
            </div>
            <div className="mt-2 space-y-2">
              <div className="min-h-[1.5rem] w-5/6 rounded bg-gray-100" />
              <div className="min-h-[1.5rem] w-2/3 rounded bg-gray-100" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Săptămâna locală nu e (încă) în registru: spus onest, cu ce se poate deschide. */
function NotYet({ previous }: { previous: VoicedWeek | null }) {
  return (
    <>
      <AcasaHeader label={null} />
      <section className={cardWhite + " mt-5 p-5 sm:p-6"}>
        <p className="text-pretty text-base leading-relaxed text-gray-900">
          Săptămâna asta n-a sosit încă.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-6">
          {previous ? (
            <a href={weekPath(previous.monday)} className={linkTap + " text-sm"}>
              Săptămâna {previous.label} &rarr;
            </a>
          ) : null}
          <a href="/jocuri" className={linkTap + " text-sm"}>
            Toate jocurile &rarr;
          </a>
        </div>
      </section>
    </>
  );
}

/**
 * `/acasa`: săptămâna CURENTĂ, după ceasul copilului. La export static nu
 * există „azi”, deci HTML-ul poartă scheletul, iar lunea locală se află după
 * montare — același registru, aceeași săptămână pe orice telefon.
 */
export default function CurrentWeek({ weeks }: { weeks: VoicedWeek[] }) {
  const [monday, setMonday] = useState<string | null>(null);
  useEffect(() => setMonday(mondayOf(new Date())), []);

  if (!monday) return <WeekSkeleton />;
  const { week, previous } = currentWeek(weeks, monday);
  return week ? <WeekView week={week} /> : <NotYet previous={previous} />;
}
