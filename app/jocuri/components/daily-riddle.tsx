"use client";

import { useEffect, useState } from "react";
import { todayCard, type RitualItem } from "@/app/azi/card";
import RitualItemRow from "@/app/azi/ritual-item";
import { eyebrow, linkTap } from "@/app/components/ui";

/**
 * Placeholder-ul cât timp ziua nu se știe încă (export static, fără server):
 * aceeași formă randată prin `RitualItemRow` ca și ghicitoarea reală, ca
 * înălțimea cutiei să nu sară la montare.
 */
const LOADING_ROW: RitualItem = { kind: "ghicitoare", emoji: "🔮", prompt: "…", second: "…" };

/** Butonul „Arată răspunsul", sau — odată apăsat — răspunsul însuși. */
function RevealAction({
  riddle,
  shown,
  onShow,
}: {
  riddle: RitualItem | null;
  shown: boolean;
  onShow: () => void;
}) {
  if (shown && riddle) {
    return (
      <p className="motion-safe:animate-pop inline-flex min-h-[44px] items-center text-base font-bold text-indigo-600">
        {riddle.answer}
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onShow}
      disabled={riddle === null}
      className="touch-manipulation -ml-2 inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
    >
      Arată răspunsul
    </button>
  );
}

/**
 * Ghicitoarea zilei: cârligul zilnic — prima pe /jocuri și prezentă și pe
 * pagina principală. Vine din prima carte a zilei (`todayCard`), aceeași
 * alegere ca pe /azi — fără server, fără nimic salvat, fără calcul propriu.
 * Rândul (emoji, ghicitoare, al doilea rând) se randează cu `RitualItemRow`,
 * componenta partajată cu /azi; dezvăluirea răspunsului rămâne locală, ca să
 * stea lângă celelalte două acțiuni pe același rând.
 */
export default function DailyRiddle({ className = "" }: { className?: string }) {
  const [riddle, setRiddle] = useState<RitualItem | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // După `kind`, nu după poziție: cu lista de ghicitori goală, cartea începe
    // cu întrebarea roții, iar cutia asta ar arăta-o sub titlul ei și ar
    // dezvălui un răspuns inexistent. Fără ghicitoare, rândul rămâne mut.
    setRiddle(todayCard(new Date()).items.find((item) => item.kind === "ghicitoare") ?? null);
  }, []);

  return (
    <section
      className={
        "max-w-2xl rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm sm:p-5 " +
        className
      }
    >
      <p className={eyebrow}>🔮 Ghicitoarea zilei</p>
      <ul className="mt-2 min-h-[3.5rem]">
        <RitualItemRow item={{ ...(riddle ?? LOADING_ROW), answer: undefined }} />
      </ul>
      <div className="flex flex-wrap items-center gap-x-5">
        <RevealAction riddle={riddle} shown={shown} onShow={() => setShown(true)} />
        <a
          href="/azi"
          className={
            linkTap +
            " touch-manipulation -ml-2 rounded-lg px-2 text-sm transition hover:text-indigo-800 " +
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          }
        >
          Cartea de azi &rarr;
        </a>
        <a
          href="/jocuri/ghicitori"
          className="touch-manipulation inline-flex min-h-[44px] items-center rounded-lg text-sm font-semibold text-gray-500 transition hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Toate ghicitorile &rarr;
        </a>
      </div>
    </section>
  );
}
