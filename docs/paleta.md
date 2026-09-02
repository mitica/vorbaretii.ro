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
