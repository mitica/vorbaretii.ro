import type { ReactNode } from "react";
import { eyebrowMuted } from "@/app/components/ui";

/**
 * Rama unei foi de tipar (ADR-046 în harness-ul privat).
 *
 * Trei reguli stau aici, ca foile să nu le repete:
 *
 * 1. Ruperea de pagină vine DUPĂ fiecare foaie în afară de ultima. Un
 *    `break-after-page` pe ultima scoate o pagină albă în plus în Chrome și
 *    în Safari — de aceea `[&:not(:last-child)]`, nu clasa simplă.
 * 2. Milimetrii trăiesc doar în varianta `print:` (adică în `@media print`):
 *    hârtia are dimensiune fizică, scara `rem` a cititorului nu spune nimic
 *    acolo. Pe ecran foaia curge ca orice text, fără nicio înălțime fixată.
 * 3. Antetul stă sub ~8,7mm, fiindcă bugetul vertical al unei foi e 259mm —
 *    cât rămâne pe Letter cu marginile de 10mm — nu cei 277mm ai lui A4.
 *
 * La tipar nu se sprijină nimic pe fundal colorat: titlul și marca sunt
 * cerneală neagră, care iese și cu „background graphics" stins.
 */
type Props = {
  /** Titlul foii — se vede și pe ecran, și pe hârtie. */
  title: string;
  children?: ReactNode;
};

export default function PrintSheet({ title, children }: Props) {
  return (
    <section className="mt-8 [&:not(:last-child)]:break-after-page print:mt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-gray-200 pb-2 print:border-gray-400 print:pb-[1mm] print:leading-tight">
        <h2 className={eyebrowMuted + " text-xs print:text-[8pt] print:text-black"}>{title}</h2>
        <p className="text-xs text-gray-400 print:text-[8pt] print:text-black">vorbaretii.ro</p>
      </div>
      <div className="mt-4 print:mt-[3mm]">{children}</div>
    </section>
  );
}
