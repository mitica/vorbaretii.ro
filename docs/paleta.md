# Paleta mărcii

Legea vie a culorilor (fosta decizie D6, mutată aici; istoria completă:
`git log -- docs/decisions.md`). **Culorile nu se schimbă ca efect secundar al unei
modificări de conținut** — o schimbare de paletă e o decizie separată, cerută explicit.

| Rol | Culoare |
|---|---|
| Fundalul paginii | `linear-gradient(to bottom, transparent, white) rgb(214,219,220)` — lavandă sus, alb jos |
| Accent primar (butoane, CTA) | `pink-600`, hover `pink-500`; iconul V `pink-700` |
| Accent secundar (eyebrow, etichete, numere, linkuri-acțiune) | `indigo-600` |
| Text | `gray-900` / `gray-600` / `gray-500` |
| Carduri „beneficii" | `bg-gradient-to-br from-white to-pink-50` + `border-pink-100` |
| Carduri „ce facem" | `bg-gradient-to-br from-pink-50 to-indigo-50` |
| Benzi de accent | `bg-gradient-to-r from-pink-100 to-indigo-100` cu `border-pink-200` (banda de club); înainte de footer `from-white via-white to-pink-100` |
| Cuvântul evidențiat (`.text-effect`) | `from-pink-500 via-sky-500 to-yellow-500` |
| WhatsApp / Messenger | `green-600` / `blue-600` (culorile lor, recognoscibile) |
| Petele de fundal | `from-[#ff80b5] to-[#9089fc]`, `opacity-30` |

**Orice schimbare de culoare se arată ca imagine și se confirmă înainte de commit**
(lecția istorică D16: un gradient aprobat pe vorbe a ieșit „radioactiv” pe ecran).

Limbajul vizual comun (butoane, carduri, pastile) se compune din
`app/components/ui.ts` — nu din clase scrise de mână.

## Paleta la tipar

Foaia de hârtie nu e ecranul: gradientul de fundal costă cerneală și nu adaugă
nimic pe alb. Antetul și subsolul site-ului (`print:hidden`) nu se tipăresc pe
NICIO pagină — regula e globală, nu doar a `/tipareste`. Restul tabelului de
mai jos guvernează ce iese la imprimantă din `/tipareste`, aprobat de operator
la poarta de design.

| Rol | La tipar |
|---|---|
| Fundalul paginii | nu se tipărește — foaia rămâne albă |
| Text | negru; nimic sub `gray-700` |
| Bordura cartonașelor | `gray-400`, 0,4mm — bordura ESTE linia de tăiere |
| Plierile zarului | `gray-500`, 0,35mm, punctat |
| Antetul și subsolul site-ului | nu se tipăresc (regulă globală, orice pagină) |
| Taburi, butoane, titluri de ecran din `/tipareste` | nu se tipăresc |
| Marca din colț | `vorbaretii.ro`, negru, 8pt |
| Mascota de pe verso | rămâne în paleta ei: `#3E4394` + moț `#FF66A6` (ADR-040) |
