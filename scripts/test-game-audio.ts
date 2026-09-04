/**
 * Legea vocii jocurilor (ADR-020): fiecare rostire a unui joc cu voce are exact
 * audio-ul textului ei curent, într-o singură cheie de voce; orfanii nu se
 * servesc; fiecare fișier ține bugetul. Curiozități = submulțime (întrebările
 * vin și pleacă prin manivelele articolelor). Jocurile fără director trec —
 * vocea e opt-in per joc, ca audio-ul per articol.
 *
 * Nucleul e pur (`verificaVoce`) și se vede roșu pe fixturi; apoi rulează pe
 * discul real.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { BUGET_FISIER, VOCE_JOCURI, cheiaVocii } from "../app/jocuri/voce/setari";
import { rostirileJocului } from "../app/jocuri/voce/rostiri";
import { hashId } from "../app/jocuri/content/ids";
import { citesteDirector, verificaVoce, type DirectorVoce } from "./lib/voce-lege";

const CHEIE = "cheie-curenta";
const A = hashId("Am un butoiaș cu două feluri de vin.");
const B = hashId("Oul");

function director(fisiere: { nume: string; bytes?: number }[], chei = [CHEIE]): DirectorVoce {
  return { chei, fisiere: fisiere.map((f) => ({ nume: f.nume, bytes: f.bytes ?? 30_000 })) };
}

test("ADR-020: set exact → verde; director absent → verde (opt-in per joc)", () => {
  const ok = verificaVoce({
    slug: "ghicitori",
    asteptate: [A, B],
    cheie: CHEIE,
    submultime: false,
    director: director([{ nume: `${A}.mp3` }, { nume: `${B}.mp3` }]),
  });
  assert.deepEqual(ok, []);
  assert.deepEqual(
    verificaVoce({
      slug: "ghicitori",
      asteptate: [A],
      cheie: CHEIE,
      submultime: false,
      director: null,
    }),
    []
  );
});

test("ADR-020: orfan → roșu; lipsă → roșu la jocurile normale, tolerată la submulțime", () => {
  const orfan = verificaVoce({
    slug: "ghicitori",
    asteptate: [A],
    cheie: CHEIE,
    submultime: false,
    director: director([{ nume: `${A}.mp3` }, { nume: "zzz.mp3" }]),
  });
  assert.equal(orfan.length, 1);
  assert.match(orfan[0]!, /ADR-020/);
  assert.match(orfan[0]!, /orfan/);
  const lipsa = verificaVoce({
    slug: "ghicitori",
    asteptate: [A, B],
    cheie: CHEIE,
    submultime: false,
    director: director([{ nume: `${A}.mp3` }]),
  });
  assert.equal(lipsa.length, 1);
  assert.match(lipsa[0]!, /voce-jocuri ghicitori/);
  const tolerat = verificaVoce({
    slug: "curiozitati",
    asteptate: [A, B],
    cheie: CHEIE,
    submultime: true,
    director: director([{ nume: `${A}.mp3` }]),
  });
  assert.deepEqual(tolerat, []);
});

test("ADR-020: a doua cheie pe disc → roșu; fișier peste buget → roșu", () => {
  const cheieVeche = verificaVoce({
    slug: "ghicitori",
    asteptate: [A],
    cheie: CHEIE,
    submultime: false,
    director: director([{ nume: `${A}.mp3` }], [CHEIE, "cheie-veche"]),
  });
  assert.equal(cheieVeche.length, 1);
  assert.match(cheieVeche[0]!, /cheie-veche/);
  const greu = verificaVoce({
    slug: "ghicitori",
    asteptate: [A],
    cheie: CHEIE,
    submultime: false,
    director: director([{ nume: `${A}.mp3`, bytes: BUGET_FISIER + 1 }]),
  });
  assert.equal(greu.length, 1);
  assert.match(greu[0]!, /buget/);
});

test("ADR-020: rostirile fiecărui joc cu voce sunt nevide, fără dubluri, fără text gol", () => {
  for (const slug of Object.keys(VOCE_JOCURI)) {
    const rostiri = rostirileJocului(slug);
    if (slug === "curiozitati" && rostiri.length === 0) continue; // corpus gol = stare legală
    assert.ok(rostiri.length > 0, `ADR-020 — ${slug}: niciun text de rostit`);
    assert.equal(new Set(rostiri).size, rostiri.length, `ADR-020 — ${slug}: rostiri duplicate`);
    for (const r of rostiri) assert.ok(r.trim().length > 0, `ADR-020 — ${slug}: rostire goală`);
  }
});

test("ADR-020: discul real — fiecare joc cu voce poartă exact rostirile curente, într-o singură cheie", () => {
  const probleme: string[] = [];
  for (const slug of Object.keys(VOCE_JOCURI)) {
    probleme.push(
      ...verificaVoce({
        slug,
        asteptate: rostirileJocului(slug).map(hashId),
        cheie: cheiaVocii(slug),
        submultime: slug === "curiozitati",
        director: citesteDirector(slug),
      })
    );
  }
  assert.deepEqual(probleme, []);
});
