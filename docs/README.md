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
| [decisions.md](decisions.md) | Deciziile luate, cu data și motivul |
| [open-questions.md](open-questions.md) | Ce e nedecis și cine decide |

## Sursa de adevăr pentru business

Site-ul e doar vitrina. **Strategia, economia și planul de validare trăiesc în repo-ul
`fus`**, nu aici:

- Punct unic de intrare: `../fus/docs/ideas/research/0018-vorbaretii-brief-socializare.md`
- Ideea-mamă: `../fus/docs/ideas/0018-vorbaretii.md`
- Clienți & mesaj: `../fus/docs/ideas/research/0018-vorbaretii-customers.md` (§Pivot v2)
- Testul de cerere: `../fus/docs/ideas/research/0018-vorbaretii-demand-test.md`
- Landing de referință (HTML brut, v2): `../fus/docs/ideas/research/0018-vorbaretii-landing.html`

**Regulă:** dacă mesajul de pe site și brieful din `fus` se contrazic, brieful câștigă —
sau se actualizează brieful, explicit. Nu lăsa cele două să divergă în tăcere.

## Texte pentru publicare

`assets/texts/` ține textele trimise în afară (advertoriale, articole de presă).

- **[advertorial-club-de-socializare.md](../assets/texts/advertorial-club-de-socializare.md)** —
  varianta curentă, pe poziționarea v2. Are la final note redacționale care nu se publică.
- `despre-vorbaretiiro.md` — textul vechi, publicat pe news.ournet.ro în martie 2024, pe
  poziționarea „curs online". **Superseded, nu-l refolosi.**

## Convenții

- Conținutul (texte, docuri) — în română. Nume de fișiere, foldere și identificatori — în engleză.
- Textele vizibile pentru părinți se scriu după regulile din [positioning.md](positioning.md).
