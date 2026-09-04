/**
 * Rostirile fiecărui joc cu voce (designul FEAT-011, decizia 2): ce citește
 * mascota = ce e pe ecran. SERVER/SCRIPT — citește conținutul jocurilor și
 * întrebările derivate ale articolelor (`questionDecks`, cu `fs`); NU se
 * importă în componente client. Aceeași listă hrănește generatorul și legea.
 */
import { questionDecks } from "../../articole/articles";
import {
  categories,
  proverbs,
  riddles,
  sellItems,
  tabooWords,
  tongueTwisters,
  wheelDecks,
} from "../content";
import { rostireAltfel, rostireBonus, rostireCategorie } from "./setari";

const ROSTIRI: Readonly<Record<string, () => string[]>> = {
  ghicitori: () => riddles.flatMap((r) => [r.question, r.answer]),
  "roata-cuvintelor": () => wheelDecks.flatMap((deck) => deck.prompts),
  curiozitati: () => questionDecks().flatMap((d) => d.items.flatMap((i) => [i.question, i.answer])),
  "proverbe-pereche": () => proverbs.flatMap((p) => [p.proverb, p.meaning]),
  "framantari-de-limba": () => tongueTwisters.map((t) => t.text),
  categorii: () => categories.map((c) => rostireCategorie(c.prompt)),
  "spune-o-altfel": () => tabooWords.map((t) => rostireAltfel(t.word, t.forbidden)),
  "vinde-mi-asta": () => sellItems.flatMap((s) => [s.item, rostireBonus(s.bonus)]),
};

/** Toate rostirile unui joc, fără dubluri (aceeași rostire = același fișier). */
export function rostirileJocului(slug: string): string[] {
  const sursa = ROSTIRI[slug];
  if (!sursa) throw new Error(`ADR-020 — jocul „${slug}” nu are rostiri definite`);
  return [...new Set(sursa())];
}
