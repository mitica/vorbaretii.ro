# Documentația site-ului vorbaretii.ro

Aici trăiește tot ce trebuie să știe cineva (om sau agent) ca să continue lucrul la
site fără să redescopere deciziile.

| Doc | Ce conține |
|---|---|
| [v0-scope.md](v0-scope.md) | Ce e v0, ce intră, ce **nu** intră, cum arată terminat |
| [positioning.md](positioning.md) | Mesajul: categoria, titlurile, formulările interzise |
| [architecture.md](architecture.md) | Cum e construit site-ul și ce constrângeri impune hostingul |
| [hero-image-prompt.md](hero-image-prompt.md) | Briefu-l imaginii din hero + prompturi pentru un model de imagini |
| [games.md](games.md) | Cum funcționează `/jocuri` și cum se adaugă un joc sau conținut nou |
| [paleta.md](paleta.md) | Paleta mărcii — legea vie a culorilor |

Regulile pentru agenți (modelul de lucru, legea site-ului, regulile de UI, verificarea, git,
siguranța) sunt în [`AGENTS.md`](../AGENTS.md), încărcat la fiecare sesiune (`CLAUDE.md` trimite la el).
Uneltele: `.claude/` — skill-urile `/spec`, `/build`, `/adr` și `/voce-jocuri`, agenții `investigator`,
`builder`, `reviewer`, `scribe`, `settings.json` și hook-ul `hooks/guard.sh`.

## Documentele locale (negit-uite)

Procesul de dezvoltare a produsului trăiește în repo, dar **nu se publică** (`.gitignore`, decizia
operatorului din 2026-10-31): `STATUS.md` (starea și pasul următor), `constitution.md` (legea),
`decisions/` (ADR-urile, cu index și jurnalul confirmărilor), `personaj.md` (fișa Gaiței),
`glossary.md`, `concept-vizual.md` (paleta mascotei), `directie.md` (direcția produsului),
`open-questions.md` (ce e nedecis și cine decide), `design/` (designurile ratificate ale feature-urilor
MS-07, referință) și `specs/`.
Lipsesc într-o clonă proaspătă — se cer operatorului.

## Unde trăiesc deciziile

În `docs/decisions/` (local, negit-uit): ADR-001…051, mutate la 2026-10-31 din fostul harness privat,
plus cele noi. Vechile decizii ale site-ului (D1–D17) au fost retrase; ce era LEGE VIE în ele s-a mutat
la ea acasă ([paleta.md](paleta.md), secțiunea PWA din [architecture.md](architecture.md), cheile din
[games.md](games.md)); istoria completă: `git log -- docs/decisions.md`.

## Texte pentru publicare

`assets/texts/` ține textele trimise în afară (advertoriale, articole de presă).

- **[advertorial-club-de-socializare.md](../assets/texts/advertorial-club-de-socializare.md)** —
  varianta curentă, pe poziționarea v2. Are la final note redacționale care nu se publică.
- `despre-vorbaretiiro.md` — textul vechi, publicat pe news.ournet.ro în martie 2024, pe
  poziționarea „curs online". **Superseded, nu-l refolosi.**

## Convenții

- Conținutul (texte, docuri) — în română. Nume de fișiere, foldere și identificatori — în engleză.
- Textele vizibile pentru părinți se scriu după regulile din [positioning.md](positioning.md).
