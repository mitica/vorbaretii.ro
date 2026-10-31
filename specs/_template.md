# NNNN: Titlul

**Status:** draft  <!-- draft | approved | in-progress | done -->
**Creat:** AAAA-LL-ZZ

## Scopul
O propoziție sau două: ce va fi adevărat când e gata.

## Context / constatări
Ce știm, cu dovezi. Per constatare: comanda rulată, sau URL-ul sursei și data, și ce a arătat. Fără
secrete sau date de cont. Legile care se aplică: `docs/constitution.md`, ADR-urile atinse
(`docs/decisions/`), regulile de UI din `AGENTS.md`, `docs/games.md`, `docs/positioning.md`.

## Ce NU intră
Ce lasă specul deliberat pe dinafară.

## Abordarea
Cum facem și de ce așa, față de alternative. Deciziile noi pe care le implică (viitoare ADR-uri).

## Task-uri
- [ ] Task 1
- [ ] Task 2

## Criterii de acceptanță
Fiecare verificabil printr-o comandă sau o observație.
- [ ] `comandă` → rezultatul așteptat
- [ ] Operatorul observă …
- [ ] `yarn lint && yarn typecheck && yarn format:check && yarn test && yarn build` verde; `yarn check-ui`
  curat dacă s-a atins layout-ul

## Cost
Apeluri plătite (ElevenLabs — caractere; xAI — imagini), plafonul sub care rulează build-ul, ce merge
gratuit. Costul se tipărește ÎNAINTE: `generate-game-audio --sweep-only` (fără apeluri, dar mătură
orfanii); scripturile fără dry-run (`generate-azi-voice`, `generate-article-image`, `generate-sting`) →
costul se estimează din text și se confirmă de operator înainte de rulare.

## Riscuri / siguranță
Ce ajunge la copii (publicare = merge-ul operatorului), legea site-ului (static, zero date, paleta,
fiecare fapt o dată), cost; ce cere confirmarea operatorului întâi; cum se dă înapoi.

## Întrebări deschise
- …
