---
name: spec
description: Investighează un subiect sau o întrebare despre vorbaretii.ro (un joc nou, o schimbare de ritual, o unealtă, o lege) cu subagenți read-only și scrie un spec cu dovezi în specs/NNNN-slug.md, pentru aprobarea operatorului. Rulat cu /spec. Nu implementează nimic.
argument-hint: <subiect sau întrebare>
disable-model-invocation: true
---

# /spec: investighează și scrie un spec

Intrarea: `$ARGUMENTS` (un subiect sau o întrebare). Goală → întreabă operatorul ce vrea specificat.

Ești orchestratorul: delegi tot. Nu editezi fișiere. **Nu implementezi nimic.**

## Pașii
1. **Încarcă contextul.** Citește `AGENTS.md`, `docs/STATUS.md`, `docs/constitution.md`,
   `docs/decisions/README.md` (și ADR-urile pe care subiectul le atinge), `docs/directie.md` dacă e lucru
   de produs, și docurile tehnice relevante (`docs/games.md`, `docs/architecture.md`, `docs/paleta.md`,
   `docs/positioning.md`, `docs/personaj.md`), plus specurile înrudite din `specs/`. Alege următorul
   număr liber de spec: următorul ÎNTREG nefolosit (`0002`, nu `0001a`); sufixele de literă sunt doar
   pentru despărțirea unui spec în părți.
2. **Planifică investigația.** Împarte-o în întrebări independente (ce există deja de refolosit în cod,
   ce lege se aplică — constituție, ADR-uri, reguli de UI —, costul, ce cere al doilea om, ce spune
   `check-ui`).
3. **Investighează.** Lansează subagenți `investigator`, **în paralel** pentru întrebări independente.
   Fiecare brief e de sine stătător: întrebarea, constrângerile (read-only, lista secretelor din
   `AGENTS.md`, fără apeluri plătite), fișierele și căile de citit, formatul raportului aşteptat.
4. **Scrie specul.** Delegă la `builder` cu un brief doar-de-docs: creează `specs/NNNN-slug.md` din
   `specs/_template.md`, `Status: draft`, cu dovezile investigatorilor în Context/constatări (comenzi, căi,
   URL-uri, date). Task-urile ca listă de bifat; criteriile de acceptanță verificabile prin comenzi sau
   observații (lanțul verify + `check-ui` unde se atinge layout-ul); Cost (apeluri plătite, plafon);
   Riscuri (ce ajunge la copii, legea site-ului, cost). În același brief: actualizează `docs/STATUS.md`
   (următorul, întrebări deschise, rând datat). Nicio altă schimbare.
5. **Verificare de bun-simț.** Opțional, `reviewer` pe spec pentru acuratețe, scop și scurgeri de
   secrete/privat; `builder` repară ce e Critical/Major.
6. **Prezintă operatorului.** Calea specului, rezumat scurt (scopul, abordarea, constatările-cheie),
   costul, riscurile, întrebările deschise — **scurt, se citește de pe telefon**; alegerile care sunt ale
   lui, cu opțiuni concrete și o recomandare (AskUserQuestion). Cere aprobarea. Doar pe „da”-ul lui
   explicit `scribe` pune `Status: approved`.

Nu comiți nimic: specurile și STATUS sunt fișiere locale, negit-uite. Dacă investigația a atins cod
(nu ar trebui), spune-o.
