import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ClubInvite from "@/app/components/club-invite";
import { ACASA, weekPath, weekTitle } from "../copy-week";
import CurrentWeek from "../current-week";
import { weekLabel } from "../dates";
import { weeks, type Week } from "../registry";
import { voicedWeek } from "../voiced";
import WeekView from "../week-view";

type Props = { params: { week?: string[] } };

/**
 * O singură rută pentru `/acasa` (săptămâna curentă) și `/acasa/<luni>` (linkul
 * pe grup): catch-all opțional, fiindcă la `output: export` Next refuză o rută
 * dinamică fără niciun parametru — iar registrul poate fi gol. Intrarea `[]`
 * e `/acasa`, deci lista nu e niciodată goală.
 */
export function generateStaticParams() {
  return [{ week: [] }, ...weeks.map((week) => ({ week: [week.monday] }))];
}

/** Orice altă dată = `out/404.html`: 404 onest, nu o săptămână inventată. */
export const dynamicParams = false;

function weekOf(params: Props["params"]): Week | null {
  const monday = params.week?.[0];
  if (!monday) return null;
  const week = weeks.find((candidate) => candidate.monday === monday);
  if (!week || params.week?.length !== 1) notFound();
  return week;
}

export function generateMetadata({ params }: Props): Metadata {
  const week = weekOf(params);
  const title = week ? weekTitle({ label: weekLabel(week.monday) }) : ACASA.name;
  const url = week ? weekPath(week.monday) : ACASA.page;
  const image = { url: "/assets/og/acasa.png", width: 1200, height: 630, alt: ACASA.name };
  return {
    title,
    description: ACASA.description,
    alternates: { canonical: url },
    // Paginile pe dată sunt linkuri de grup, nu intrări de căutare.
    robots: week ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description: ACASA.description,
      siteName: "Vorbăreții.ro",
      type: "website",
      locale: "ro_RO",
      url,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ACASA.description,
      images: [image.url],
    },
  };
}

export default function AcasaPage({ params }: Props) {
  const week = weekOf(params);
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-5 sm:pt-10">
      {week ? <WeekView week={voicedWeek(week)} /> : <CurrentWeek weeks={weeks.map(voicedWeek)} />}
      <div className="mt-10">
        <ClubInvite
          title="Acasă, în doi. La club, cu prietenii."
          body="Aceiași copii în fiecare săptămână, o oră în care româna e limba dintre prieteni."
          event="demo_acasa"
        />
      </div>
    </div>
  );
}
