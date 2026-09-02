# Claude Code — instrucțiuni pentru vorbaretii.ro

Site-ul public al **Vorbăreții** — club de socializare în română pentru copiii din diaspora.

**Citește întâi [docs/README.md](docs/README.md).** Acolo e harta: scopul lui v0, mesajul,
arhitectura, jocurile, paleta și întrebările încă deschise.

## Ce trebuie să știi înainte de prima modificare

1. **Strategia și deciziile nu locuiesc aici.** Ele se iau în procesul privat al
   proiectului; repo-ul ăsta ține site-ul și documentația lui tehnică vie (`docs/`).
   Dacă ceva de pe pagini pare să contrazică o decizie, întreabă — nu presupune.
2. **Export static, fără server.** `output: "export"` → GitHub Pages. Fără API routes, fără
   Server Actions, fără optimizare de imagini. Orice interacțiune se întâmplă în browser.
   Detalii și capcane: [docs/architecture.md](docs/architecture.md).
3. **Mesajul e blocat, nu improvizat.** Titlurile, categoria și **formulările interzise**
   (niciun registru de deficit sau vină față de părinte) sunt în
   [docs/positioning.md](docs/positioning.md). Nu rescrie textele de pe pagină fără să le citești.
4. **Fiecare fapt apare o singură dată pe pagina principală.** Fără secțiuni care repetă în
   alte cuvinte ce s-a spus deja.
5. **Paleta e a mărcii, nu a ta.** Roz (`pink-600`) pentru butoane, indigo (`indigo-600`) pentru
   etichete, gri pentru text, fundalul lavandă→alb, `.text-effect` roz→bleu→galben. Tabelul complet
   e în [docs/paleta.md](docs/paleta.md). **Nu schimba culorile ca efect secundar al unei
   modificări de conținut** — e o decizie separată, care se cere explicit.
6. **Jocurile din `/jocuri` nu colectează nimic de la copii** — fără conturi, fără date trimise
   nicăieri. Progresul stă doar în `localStorage` (D8). Regulile: [docs/games.md](docs/games.md).

## Reguli de UI

Fiecare regulă de aici vine dintr-un bug care a ajuns pe telefonul cuiva. Nu sunt preferințe.

1. **Doar clase Tailwind.** `app/globals.css` rămâne cât mai gol; `@keyframes` și tema stau în
   `tailwind.config.ts`. `style={}` doar pentru valori calculate la rulare (unghiul roții), niciodată
   pentru layout. Numele de clase se scriu **întregi** — Tailwind citește sursa ca text, deci
   `grid-cols-${n}` nu există în CSS; folosește o hartă cu șiruri complete.
2. **Înălțimea o dă conținutul.** Niciun `h-*`, `max-h-*`, `aspect-*` sau `auto-rows-fr` pe o cutie
   care conține text. Doar `min-h-*`. *(Înălțimea se strânge, textul nu: la fontul mărit al unui
   telefon, cardurile au ieșit peste textul de dedesubt.)*
3. **`flex-1` doar pe orizontală.** Niciodată într-o coloană. *(Pe desktop, roata plutea singură
   în mijlocul paginii, la 400px de butonul ei.)*
4. **Ce nu încape se rupe pe rânduri** (`flex-wrap`). Niciodată `truncate` pe conținut real,
   niciodată lăsat să împingă pagina în lateral. *(Numele mărcii ajunsese „Vo.".)*
5. **Centrarea se face din părinte** (`flex justify-center`). `mx-auto` pe un buton nu face nimic —
   butoanele sunt `inline-flex` — și nu dă nicio eroare. *(Butonul roții a stat necentrat cu o
   clasă care arăta corect în cod.)*
6. **O singură lățime maximă pe pagină**, într-un singur loc. Componentele nu-și pun `max-w-*`.
   *(Antet 848, joc 672, card 848 — trei blocuri nealiniate.)*
7. **Fără px arbitrari pentru text sau spațiere.** Doar scara Tailwind, care e în `rem`, ca totul
   să crească odată cu fontul utilizatorului. *(`text-[13px]` nu se scala.)*
8. **Ținte de apăsat: minimum 44px.** Măsurat, nu presupus.
9. **O singură aliniere pe pagină: la stânga.** Titlurile de secțiune, textul din carduri,
   citatele — toate pornesc de la aceeași margine, pe aceeași coloană (`max-w-6xl px-6`).
   *(Aveam două grile de carduri lipite, una la stânga și una centrată, și titluri când
   centrate, când la stânga, fără nicio regulă.)*
10. **Butoanele, pastilele și etichetele se îmbracă din `app/components/ui.ts`** (`btn`,
   `eyebrow`, `pillAge`…), nu din clase scrise de mână. *(Butonul roz ajunsese la șase
   variante — trei raze de colț, patru înălțimi, focus vizibil doar pe unele.)*

## Verificarea vizuală — `yarn check-ui`, un script la nevoie

```
yarn build
yarn check-ui
```

**Se rulează la nevoie, nu la fiecare commit**: după o schimbare de layout sau de UI și înainte
de o publicare mai mare. Nu e legat de lint, de commit sau de CI — deployul rămâne o singură
treabă, build + upload. Dacă scoate ceva, se repară atunci, nu se lasă pe altă dată.

Verifică toate rutele din ROUTES (azi 14 pagini) × 10 combinații de lățime și mărime de font (320–1440px, font rădăcină
16/18/20/24px) — 140 de verificări, pe trei axe: **suprapuneri**, **derulare laterală**,
**ținte sub 44px**. Durează ~30s. Codul: [scripts/check-ui.ts](scripts/check-ui.ts).

De ce există: regula 8 era scrisă în `docs/games.md` din prima zi și n-a fost măsurată niciodată.
De acolo au venit jumătate din bug-uri. Verificarea la „dimensiunile pe care le aleg eu, cu fontul
meu" nu e verificare.

Când adaugi o pagină, adaugă-i ruta în `ROUTES`. Jocurile intră singure — se citesc din
`app/jocuri/games.ts`.

## Convenții

- Conținut în română; nume de fișiere, foldere și identificatori în engleză.
- Deciziile de proiect se iau în procesul privat; aici trăiește doar documentația tehnică vie (istoricul vechilor decizii D1–D17: `git log -- docs/decisions.md`).
- Ce nu e decis se scrie în [docs/open-questions.md](docs/open-questions.md) și **se întreabă**,
  nu se presupune.

## Verificare

```
yarn build     # trebuie să treacă; toate rutele se exportă static
yarn lint
yarn test      # logica pură a jocurilor: rotația, amestecările, invariantele conținutului
```
