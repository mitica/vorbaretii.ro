import type { ReactNode } from "react";

/**
 * Grila de tăiat a unei foi (ADR-044 în harness-ul privat): cartonașele pe trei
 * coloane, bordura fiecăruia FIIND linia de tăiere — nu există marcaje separate
 * în colțuri.
 *
 * Trei reguli stau aici, ca fața și versoul să nu le repete:
 *
 * 1. Milimetrii trăiesc doar în varianta `print:`: hârtia are dimensiune
 *    fizică. Pe ecran, aceleași cartonașe curg într-o grilă fluidă — o coloană
 *    pe telefon, trei pe ecran larg — fără nicio înălțime fixată. Pe hârtie, un
 *    cartonaș nu se rupe niciodată între două pagini.
 * 2. `mirror` întoarce ordinea coloanelor pe fiecare rând. Hârtia se întoarce
 *    pe muchia lungă, deci spatele cartonașului N iese sub fața lui doar dacă
 *    rândul e citit invers. Astăzi toate spatele sunt identice și oglinda nu se
 *    vede; rămâne fiindcă un verso pe fiecare set ar avea nevoie de ea, iar
 *    redesenarea grilei atunci ar fi mai scumpă. `data-card` poartă numărul din
 *    set — singurul fel în care oglinda se poate măsura cât timp e invizibilă.
 * 3. Nicio umplere de fundal: la tipar rămân conturul gri și cerneala
 *    conținutului, care ies și cu „background graphics" stins.
 */

/** Coloanele grilei: trei, și pe hârtie, și pe ecranul larg. */
const COLUMNS = 3;

type Props = {
  /** Fețele cartonașelor, în ordinea din set. */
  cards: ReactNode[];
  /** Versoul: coloanele fiecărui rând se așază invers. */
  mirror?: boolean;
};

type PlacedCard = { card: ReactNode; number: number };

/** Cartonașele în ordinea de pe hârtie; numărul rămâne cel din set. */
function cutOrder(cards: ReactNode[], mirror: boolean): PlacedCard[] {
  const numbered: PlacedCard[] = cards.map((card, index) => ({ card, number: index + 1 }));
  if (!mirror) return numbered;
  const mirrored: PlacedCard[] = [];
  for (let start = 0; start < numbered.length; start += COLUMNS) {
    mirrored.push(...numbered.slice(start, start + COLUMNS).reverse());
  }
  return mirrored;
}

export default function CutGrid({ cards, mirror = false }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-0">
      {cutOrder(cards, mirror).map((placed) => (
        <div
          key={placed.number}
          data-card={placed.number}
          className="flex flex-col justify-between gap-3 rounded-xl border border-gray-400 p-4 print:min-h-[62mm] print:gap-0 print:break-inside-avoid print:rounded-none print:border-[0.4mm] print:p-[5mm]"
        >
          {placed.card}
        </div>
      ))}
    </div>
  );
}
