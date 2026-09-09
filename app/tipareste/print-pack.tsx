"use client";

import { useState } from "react";
import { btn } from "@/app/components/ui";
import Tabs from "@/app/jocuri/components/tabs";
import { wheelDecks } from "@/app/jocuri/content";

/**
 * Partea de ECRAN a paginii de tipar: setul de întrebări ales din taburi,
 * butonul care deschide dialogul de tipar al browserului și fraza care spune
 * ce iese pe hârtie. Tot ce e aici dispare la tipar — pe foi ies doar foile.
 *
 * Niciun milimetru: taburile derulează în containerul lor, butonul și fraza
 * se rup pe rânduri, înălțimea o dă textul (CLAUDE.md, regulile 2 și 4).
 */
export default function PrintPack() {
  const [deckId, setDeckId] = useState(wheelDecks[0]?.id ?? "");

  return (
    <div className="print:hidden">
      <div className="mt-5 sm:mt-6">
        <Tabs
          items={wheelDecks.map((deck) => ({ id: deck.id, label: deck.label }))}
          activeId={deckId}
          onChange={setDeckId}
          label="Setul de întrebări"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => window.print()} className={btn("primary")}>
          Tipărește foaia
        </button>
        <p className="max-w-[46ch] text-pretty text-sm leading-relaxed text-gray-600">
          Ies două pagini: cele 12 cartonașe și versoul. Pune hârtia înapoi în imprimantă ca să se
          tipărească pe spate.
        </p>
      </div>
    </div>
  );
}
