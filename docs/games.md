# `/jocuri` — cum funcționează și cum se extinde

## De ce există

Trei motive, în ordinea importanței:

1. **Cârlig gratuit.** Ceva de valoare pe care părintele îl poate da copilului imediat, fără să
   plătească și fără să se înscrie. Deschide relația înainte de vânzare.
2. **Trafic organic.** „Jocuri în română pentru copii", „ghicitori românești", „proverbe pentru
   copii" — căutări reale, pe care le poate prinde un site static.
3. **Dovadă de produs.** Jocurile astea *sunt* ce se întâmplă la club. Părintele vede formatul
   înainte de demo.

Referința de format e wordwall.net — mecanici scurte, repetabile, jucabile de pe telefon.
Diferența: **la noi jocurile sunt construite în casă și trăiesc pe domeniul nostru**, nu linkuri
în afară.

## Reguli (nu se încalcă fără motiv nou)

- **Fără conturi și fără date de la copii.** Business cu minori: colectăm zero. Singura stare e
  în `localStorage`, în browserul copilului, și nu pleacă nicăieri — vezi
  [decisions.md](decisions.md) D8.
- **Fără biblioteci externe de jocuri.** React + Tailwind + SVG, atât.
- **Jocul încape pe un ecran.** Nici pe telefon, nici pe calculator nu se derulează ca să vezi
  tabla sau butonul principal. Rama (`GameShell`) dă exact un ecran; jocul se strânge în el.
- **Mobil întâi.** Ținte de atins cu degetul (min. 44px), fără drag-and-drop obligatoriu —
  potrivirile se fac prin apăsare, nu prin tras.
- **Nu repetăm.** Niciun joc nu scoate de două ori același element până nu le-a arătat pe toate.
- **Fără sunet care pornește singur.**
- **Fiecare joc se termină cu invitația la club** (blocul din `GameShell`).

## Structura

```
app/jocuri/
  page.tsx                # indexul: cardurile tuturor jocurilor, toate pe un ecran
  games.ts                # REGISTRUL: slug, titlu, emoji, tagline, instrucțiune, vârstă
  content.ts              # TOT conținutul în română (întrebări, ghicitori, proverbe, cuvinte)
  components/
    game-shell.tsx        # rama comună: un ecran pentru joc + CTA-ul de sub el
    ui.tsx                # butoanele, rama albă, rândul de progres, scheletul de încărcare
    storage.ts            # citit/scris în localStorage, fără să arunce vreodată
    rotation.ts           # „nu-mi da de două ori același lucru" (logica pură)
    use-rotation.ts       # hook-ul care leagă rotation.ts de un joc
    shuffle.ts            # Fisher-Yates
    wheel-game.tsx        # 🎡 Roata cuvintelor
    riddles-game.tsx      # 🔮 Ghicitori
    proverbs-game.tsx     # 🧩 Proverbe pereche
    anagrams-game.tsx     # 🔤 Anagrame
    memory-game.tsx       # 🧠 Joc de memorie
  <slug>/page.tsx         # câte un folder per joc: metadata + GameShell + componenta
```

`app/components/games-teaser.tsx` citește din același `games.ts` ca să arate primele trei
jocuri pe pagina principală. Adaugi un joc în registru → apare și acolo.

## Cum încape jocul pe un ecran

`.game-viewport` (în `app/globals.css`) dă blocului de joc **exact** `100svh - --header-h`.
E `height`, nu `min-height` — numai o înălțime fixă face ca `flex-1` dinăuntru să se *strângă*.
Cu `min-height`, tabla ar crește peste ecran și butonul principal ar cădea sub linia de plutire.

De aici vin trei obiceiuri pe care le respectă toate jocurile:

- Componenta de joc e `flex min-h-0 flex-1 flex-col`; tabla ia `flex-1`, restul are înălțime fixă.
- Ce are proporții proprii (roata, tabla de memorie) se măsoară **și după înălțime**, nu doar
  după lățime: `h-full w-auto` la SVG, `aspect-square max-h-full` la tabla 4×4.
- Instrucțiunea din `games.ts` e **o singură frază scurtă** — două rânduri pe telefon, nu patru.

Verificarea: la 320×568, 360×640, 390×664, 1280×800 și 1024×1366, marginea de jos a lui
`.game-viewport` trebuie să fie ≤ înălțimea ferestrei, iar pagina să nu se lățească lateral.

## Cum ținem minte progresul

Fiecare element de conținut primește automat un `id` (hash din propriul text, în `content.ts`).
`useRotation(cheie, ids, câte)` extrage doar din ce n-a ieșit încă, salvează în `localStorage`
sub `vorbaretii.jocuri.<cheie>` și, când lista se termină, începe o rundă nouă fără să repete
imediat ce tocmai a ieșit.

```
vorbaretii.jocuri.ghicitori          { seen, last, round }
vorbaretii.jocuri.proverbe           { seen, last, round }
vorbaretii.jocuri.anagrame           { seen, last, round }
vorbaretii.jocuri.memorie            { seen, last, round }
vorbaretii.jocuri.memorie.record     cel mai mic număr de încercări
vorbaretii.jocuri.roata.<set>        câte un set de întrebări, socotit separat
```

Dacă rescrii un text, id-ul lui se schimbă și elementul redevine „nevăzut". E în regulă: e text nou.

⚠️ **Amestecarea nu se face la randare.** Export static + hidratare: dacă apelezi `Math.random()`
în corpul componentei, serverul și browserul desenează altceva și React se plânge. Tiparul:
prima extragere se face în `useEffect`, după montare, iar până atunci jocul arată `<GameSkeleton />`.

## Cum adaugi conținut nou (cazul obișnuit)

Editezi **doar** `app/jocuri/content.ts`. Jocurile n-au text propriu și nu trebuie să scrii id-uri.

- `wheelDecks` — trei seturi de câte 12 întrebări de conversație („Despre mine", „Imaginație",
  „Prieteni"). Poți adăuga un set; roata se desenează din lungimea listei.
- `riddles` — `{ question, answer }`. Răspunsul e **un singur cuvânt** (jocul oferă ca indiciu
  prima literă și numărul de litere).
- `proverbs` — `{ proverb, meaning }`. O rundă ia 4. Ambele texte stau pe două coloane pe telefon,
  deci ține proverbul sub ~50 de caractere și înțelesul sub ~40.
- `anagrams` — `{ word, hint }`. **Cuvântul se scrie cu MAJUSCULE și cu diacritice.**
  Maximum 9 litere, altfel nu încap pe telefon.
- `memoryPairs` — `{ emoji, word }`. Un joc ia 8 perechi; restul intră la jocurile următoare.
  Cuvântul sub 9 litere, ca să încapă pe cartonaș.

## Cum adaugi un joc nou

1. Adaugă o intrare în `app/jocuri/games.ts` (slug în română, fără diacritice, cu cratime;
   `howTo` = o singură frază).
2. Pune conținutul lui în `app/jocuri/content.ts`, printr-un `withIds(...)`.
3. Scrie componenta în `app/jocuri/components/<nume>-game.tsx`, cu `"use client"`:
   rădăcină `flex min-h-0 flex-1 flex-col`, butoane din `ui.tsx`, extragere prin `useRotation`.
4. Creează `app/jocuri/<slug>/page.tsx` — copiază unul existent; are `metadata` proprie
   (titlu + descriere pentru căutări) și randează `<GameShell game={getGame("<slug>")}>`.

## Idei de jocuri următoare

Fazan · Cuvântul ascuns (spânzurătoarea, fără spânzurătoare) · Frământări de limbă cronometrate ·
Ce lipsește din imagine · Categorii („spune 5 lucruri care...") · Povestea în lanț (o propoziție
de fiecare).
