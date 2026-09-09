"use client";

import { useState } from "react";
import { linkTap } from "@/app/components/ui";
import type { RitualItem } from "./card";

/**
 * Al doilea rând, cu un singur cuvânt îngroșat când elementul cere („Apoi TU.").
 * Îngroșarea e doar ținută vizuală: textul copiat rămâne simplu, fără markdown.
 */
function secondLine(text: string, stress?: string) {
  const at = stress ? text.indexOf(stress) : -1;
  if (!stress || at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className="font-semibold text-gray-900">{stress}</span>
      {text.slice(at + stress.length)}
    </>
  );
}

/**
 * Un rând din cartea zilei: emoji, textul de citit cu voce tare și al doilea
 * rând — cel care cere un om mare. Ghicitoarea are, în plus, dezvăluirea
 * răspunsului; celelalte două n-au ce dezvălui.
 */
export default function RitualItemRow({ item }: { item: RitualItem }) {
  const [shown, setShown] = useState(false);

  return (
    <li className="flex gap-3 border-t border-gray-100 py-4 first:border-t-0 first:pt-3">
      <span className="text-2xl leading-tight" aria-hidden="true">
        {item.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-pretty font-serif text-lg italic leading-snug text-gray-900 sm:text-xl">
          {item.prompt}
        </p>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-gray-600">
          {secondLine(item.second, item.stress)}
        </p>
        {item.answer && shown ? (
          <p className="motion-safe:animate-pop inline-flex min-h-[44px] items-center text-base font-bold text-indigo-600">
            {item.answer}
          </p>
        ) : null}
        {item.answer && !shown ? (
          <button
            type="button"
            onClick={() => setShown(true)}
            className={
              linkTap +
              " touch-manipulation -ml-2 rounded-lg px-2 text-sm transition hover:text-indigo-800 " +
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            }
          >
            Arată răspunsul
          </button>
        ) : null}
      </div>
    </li>
  );
}
