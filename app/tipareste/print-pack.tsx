"use client";

import { Fragment, useState, type ReactNode } from "react";
import Mascot from "@/app/components/mascot/mascot";
import { btn, eyebrowMuted } from "@/app/components/ui";
import Tabs from "@/app/jocuri/components/tabs";
import { wheelDecks } from "@/app/jocuri/content";
import CutGrid from "./cut-grid";
import PrintSheet from "./print-sheet";

type Deck = (typeof wheelDecks)[number];

/**
 * Fața cartonașului: întrebarea sus, iar jos eticheta care spune din ce set e
 * și al câtelea — cine adună cartonașe de la mai multe familii le poate pune
 * înapoi în teancul lor.
 */
function questionCards(deck: Deck): ReactNode[] {
  return deck.prompts.map((prompt, index) => (
    <Fragment key={prompt}>
      <p className="font-serif text-sm leading-relaxed text-gray-900 sm:text-base print:text-[11.5pt] print:leading-snug print:text-black">
        {prompt}
      </p>
      <p className={eyebrowMuted + " text-xs print:text-[7pt] print:text-gray-700"}>
        {deck.label} · {index + 1}/{deck.prompts.length}
      </p>
    </Fragment>
  ));
}

/**
 * Versoul cartonașului: mascota, compusă din randatorul ei (ADR-017 în
 * harness-ul privat — un al doilea desen ar diverge), în paleta ei, plus marca.
 * Umplerile ei SVG sunt cerneală de prim-plan, deci ies la tipar și cu
 * „background graphics" stins (ADR-046).
 *
 * Mărimile componentei sunt în pixeli, fiindcă ecranul le vrea așa; hârtia le
 * vrea în milimetri, de-aia foaia rescrie mărimea învelișului ei DOAR în
 * varianta `print:`.
 */
function BackCard() {
  return (
    <div className="m-auto flex flex-col items-center gap-2 print:gap-[3mm]">
      <div className="print:[&>span]:h-[26mm] print:[&>span]:w-[26mm]">
        <Mascot pose="liniste" size={64} />
      </div>
      <p className="text-xs text-gray-500 print:text-[8pt] print:text-black">vorbaretii.ro</p>
    </div>
  );
}

/**
 * Cele două foi ale roții: fața cu cele 12 întrebări ale setului ales și
 * versoul, oglindit pe coloane. Stau aici, lângă starea taburilor, fiindcă
 * setul ales e stare de client, iar pagina e randată pe server; în DOM rămân
 * frați cu foaia zarurilor, ca ruperile de pagină să iasă corect.
 */
function WheelSheets({ deck }: { deck: Deck }) {
  return (
    <>
      <PrintSheet title={"Cartonașele roții · " + deck.label}>
        <CutGrid cards={questionCards(deck)} />
      </PrintSheet>
      <PrintSheet title="Versoul cartonașelor">
        <CutGrid
          cards={deck.prompts.map((prompt) => (
            <BackCard key={prompt} />
          ))}
          mirror
        />
      </PrintSheet>
    </>
  );
}

/**
 * Pachetul de tipărit al roții: comenzile de ecran (setul ales din taburi,
 * butonul de tipar, fraza care spune ce iese pe hârtie) și cele două foi pe
 * care le umple setul ales. Comenzile dispar la tipar; foile rămân, iar pe ecran
 * sunt previzualizarea hârtiei.
 *
 * Niciun milimetru în comenzi: taburile derulează în containerul lor, butonul
 * și fraza se rup pe rânduri, înălțimea o dă textul (CLAUDE.md, regulile 2 și 4).
 */
export default function PrintPack() {
  const [deckId, setDeckId] = useState(wheelDecks[0]?.id ?? "");
  const deck = wheelDecks.find((item) => item.id === deckId);

  return (
    <>
      <div className="print:hidden">
        <Tabs
          items={wheelDecks.map((item) => ({ id: item.id, label: item.label }))}
          activeId={deckId}
          onChange={setDeckId}
          label="Setul de întrebări"
        />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => window.print()} className={btn("primary")}>
            Tipărește foaia
          </button>
          <p className="max-w-[52ch] text-pretty text-sm leading-relaxed text-gray-600">
            Ies trei pagini: fața cartonașelor, versoul și foaia zarurilor. Ca versoul să iasă pe
            spatele cartonașelor: tipărește doar pagina 1, întoarce foaia pe muchia lungă, pune-o
            înapoi în imprimantă, apoi tipărește doar pagina 2 — alegi paginile din dialogul de
            tipărire. Foaia zarurilor iese pe urmă, pe o foaie nouă.
          </p>
        </div>
      </div>

      {deck ? <WheelSheets deck={deck} /> : null}
    </>
  );
}
