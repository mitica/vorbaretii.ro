---
name: adr
description: Scrie un ADR nou în docs/decisions/ (local, negit-uit) — o decizie de arhitectură sau de produs cu forma impusă (Decision ≤60 / Because ≤40 / Not ≤40), rândul în index și consecințele propagate (glosar, constituție, spec). Imutabil odată acceptat; schimbarea de părere = ADR nou care îl supersedează. Rulat cu /adr.
argument-hint: <titlul deciziei> [supersedes ADR-NNN]
disable-model-invocation: true
---

# /adr <titlu> — o decizie, durabilă

Intrarea: `$ARGUMENTS` — titlul deciziei (≤7 cuvinte, formulat ca decizie), opțional `supersedes
ADR-NNN[,ADR-MMM]`. Goală → întreabă ce s-a decis.

Ești orchestratorul: delegi scrierea la `builder` (ADR-ul e judecată, nu copiere) și indexul la
`scribe`. Fișierele sunt LOCALE, negit-uite: nimic de comis; în cod, commituri și PR-uri se citează
doar id-ul.

## Pașii
1. **E o DECIZIE?** Cum/de ce, nu un task (→ `/build`), nu o definiție de vocabular (→
   `docs/glossary.md`), nu design (dacă redenumirea unei funcții ar face textul fals, e design — stă în
   spec). Dacă nu e decizie, spune-o și oprește-te.
2. **Contextul.** Citește `docs/decisions/README.md` (forma, indexul), ADR-urile pe care subiectul le
   atinge, `docs/constitution.md` (principiul atins, dacă e cazul). Următorul id = ultimul din index plus
   unu.
3. **Scrie.** `builder`, brief de sine stătător (textul deciziei așa cum l-a spus operatorul, ADR-urile
   înrudite, id-ul): creează `docs/decisions/ADR-NNN.md` cu frontmatter (`title`, `status: proposed`,
   `id`, `supersedes: [...]`, `superseded_by: null`, `enforcement` — `kind: rule|test|none` cu `ref:`
   calea din repo sau `reason:`) și TREI secțiuni, atât: **Decision** (≤60 de cuvinte, ce e acum
   adevărat, ca lege) · **Because** (≤40, ce a forțat-o — fără ea judecata nu se mai poate reface peste
   șase luni) · **Not** (≤40, alternativele respinse, un rând fiecare). Fără cod, fără mecanism.
   Ancorat în ce s-a verificat, niciodată inventat.
4. **Acceptarea — pe cuvântul operatorului.** Prezintă-i textul (scurt, de pe telefon) și întreabă:
   acceptat / de schimbat / respins. Pe „acceptat”: `enforcement` completat ÎNAINTE (regula sau testul
   există și citează id-ul în mesajul de eroare; altfel `kind: none` cu motivul); `scribe` pune
   `status: accepted`, iar la fiecare ADR din `supersedes` pune `superseded_by: ADR-NNN` și
   `status: superseded` — singura editare permisă pe un ADR acceptat e frontmatter-ul lui de status.
5. **Indexul.** `scribe`: rândul nou în tabelul din `docs/decisions/README.md` (și statusul celor
   supersedate).
6. **Consecințele.** Derivă din Decision ce devine adevărat altundeva și acționează: termen nou →
   `docs/glossary.md` · principiu atins → amendament datat în `docs/constitution.md`, în același pas ·
   lucru de livrat → `/spec` sau task pentru `/build` · regula mecanică → testul/regula din `ref`,
   livrată prin `/build` (codul citează `ADR-NNN`). Ce sari deliberat, spui explicit — o consecință fără
   artefact și fără „sărit, pentru că…” e eșecul pasului.
7. **Raportul.** Id, titlu, status, calea, consecințele făcute și cele lăsate. `scribe`: rând în
   `docs/STATUS.md` dacă decizia schimbă pasul următor.
