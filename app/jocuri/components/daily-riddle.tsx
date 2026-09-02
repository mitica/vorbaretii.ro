"use client";

import { useEffect, useState } from "react";
import { hashId, riddles } from "../content";

type Riddle = (typeof riddles)[number];

/**
 * Ghicitoarea zilei: aceeași pentru toți în aceeași zi, aleasă determinist din
 * dată — fără server, fără nimic salvat. Se calculează după montare, pentru că
 * la export-ul static nu există „azi"; până atunci cutia își ține locul
 * (min-h), ca pagina să nu salte.
 */
export default function DailyRiddle() {
  const [riddle, setRiddle] = useState<Riddle | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const now = new Date();
    const stamp = `ziua-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const index = parseInt(hashId(stamp), 36) % riddles.length;
    setRiddle(riddles[index]);
  }, []);

  return (
    <section className="mt-4 rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm sm:mt-6 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
        🔮 Ghicitoarea zilei
      </p>
      <p className="mt-2 min-h-[3.5rem] text-pretty font-serif text-lg italic leading-snug text-gray-900 sm:text-xl">
        {riddle ? riddle.question : "…"}
      </p>
      <div className="flex flex-wrap items-center gap-x-5">
        {shown && riddle ? (
          <p className="motion-safe:animate-pop inline-flex min-h-[44px] items-center text-base font-bold text-indigo-600">
            {riddle.answer}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setShown(true)}
            disabled={riddle === null}
            className="touch-manipulation -ml-2 inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            Arată răspunsul
          </button>
        )}
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
