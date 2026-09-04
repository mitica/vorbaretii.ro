import { gaitaSvg, type Stare } from "./gaita";

const MARIMI = { 56: "h-14 w-14", 64: "h-16 w-16" } as const;

type Props = {
  stare: Stare;
  marime: keyof typeof MARIMI;
};

/**
 * Mascota (harnessul privat: ADR-017): SVG-ul inline din sursa unică
 * `gaitaSvg`, decorativ (`aria-hidden`) — sensul îl poartă textul de lângă ea.
 * `data-stare` pe wrapper armează animațiile Tailwind de pe părți
 * (`group-data-[stare=…]`); markup-ul e constantă proprie, generată la build,
 * fără nicio intrare externă — de-aia `dangerouslySetInnerHTML` e sigur aici.
 */
export default function Mascota({ stare, marime }: Props) {
  return (
    <span
      aria-hidden="true"
      data-stare={stare}
      className={"group inline-block shrink-0 " + MARIMI[marime]}
      dangerouslySetInnerHTML={{ __html: gaitaSvg(stare) }}
    />
  );
}
