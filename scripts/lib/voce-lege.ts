/**
 * Nucleul legii vocii jocurilor (ADR-020) — pur: primește ce e pe disc și ce
 * ar trebui să fie, întoarce problemele. Citirea discului e separată, ca
 * testul să vadă roșu pe fixturi înainte de orice fișier real.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { BUGET_FISIER, DIRECTOR_VOCE } from "../../app/jocuri/voce/setari";

export type DirectorVoce = {
  /** Subdirectoarele (cheile de voce) găsite sub jocul respectiv. */
  chei: string[];
  /** Fișierele din cheia curentă. */
  fisiere: { nume: string; bytes: number }[];
};

export type VerificareVoce = {
  slug: string;
  /** Hash-urile rostirilor curente. */
  asteptate: string[];
  cheie: string;
  /** Curiozități: lipsa e tolerată (întrebările vin și pleacă), orfanul nu. */
  submultime: boolean;
  /** `null` = jocul n-are director: vocea e opt-in, trece. */
  director: DirectorVoce | null;
};

function numeFisier(hash: string): string {
  return `${hash}.mp3`;
}

export function verificaVoce(v: VerificareVoce): string[] {
  if (!v.director) return [];
  const probleme: string[] = [];
  const comanda = `rulează /voce-jocuri ${v.slug}`;
  for (const cheie of v.director.chei)
    if (cheie !== v.cheie)
      probleme.push(`ADR-020 — ${v.slug}: cheie veche pe disc „${cheie}” — ${comanda}`);
  const asteptate = new Set(v.asteptate.map(numeFisier));
  const peDisc = new Set(v.director.fisiere.map((f) => f.nume));
  for (const f of v.director.fisiere) {
    if (!asteptate.has(f.nume))
      probleme.push(
        `ADR-020 — ${v.slug}: fișier orfan „${f.nume}” (text șters sau schimbat) — ${comanda}`
      );
    if (f.bytes > BUGET_FISIER)
      probleme.push(`ADR-020 — ${v.slug}: „${f.nume}” peste bugetul de ${BUGET_FISIER / 1024}KB`);
  }
  if (!v.submultime)
    for (const nume of asteptate)
      if (!peDisc.has(nume))
        probleme.push(`ADR-020 — ${v.slug}: rostire fără audio „${nume}” — ${comanda}`);
  return probleme;
}

/** Ce e pe disc pentru un joc: cheile și fișierele cheii cerute; `null` fără director. */
export function citesteDirector(slug: string, cheie?: string): DirectorVoce | null {
  const radacina = join(process.cwd(), DIRECTOR_VOCE, slug);
  if (!existsSync(radacina)) return null;
  const chei = readdirSync(radacina).filter((d) => statSync(join(radacina, d)).isDirectory());
  const curenta = cheie ?? chei[0];
  const dir = curenta ? join(radacina, curenta) : null;
  const fisiere =
    dir && existsSync(dir)
      ? readdirSync(dir).map((nume) => ({ nume, bytes: statSync(join(dir, nume)).size }))
      : [];
  return { chei, fisiere };
}
