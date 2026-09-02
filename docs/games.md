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

- **Jocul potrivit te face să VORBEȘTI.** Testul oricărui joc nou: te convinge să spui, să
  explici, să participi, să te entuziasmezi — nu doar să apeși și să afli. *(De-asta au fost
  respinse, gata construite, un „Intrusul" și un „Adevărat sau fals?" — erau de apăsat, nu
  de vorbit.)*
- **Fără conturi și fără date de la copii.** Business cu minori: colectăm zero. Singura stare e
  în `localStorage`, în browserul copilului, și nu pleacă nicăieri — vezi
  tabelul cheilor de mai jos (decizia istorică D8).
- **Fără biblioteci externe de jocuri.** React + Tailwind + SVG, atât.
- **Layout natural.** Jocul e compact, ca să încapă pe un ecran de telefon obișnuit — dar nimic
  nu se strânge cu forța. Dacă textul e mai mare (font mărit, ecran mic), pagina derulează.
  Decizia istorică D10: o înălțime fixă face textele să se suprapună.
- **Mobil întâi.** Ținte de atins cu degetul (min. 44px **verificat**, nu presupus), fără
  drag-and-drop obligatoriu — potrivirile se fac prin apăsare, nu prin tras.
- **Nu repetăm.** Niciun joc nu scoate de două ori același element până nu le-a arătat pe toate.
- **Fără sunet care pornește singur.**
- **Fiecare joc se termină cu invitația la club** (blocul din `GameShell`).

## Structura

```
app/jocuri/
  page.tsx                # indexul: antet + DailyRiddle (prima) + GamesIndex + CTA
  games.ts                # REGISTRUL: slug, titlu, emoji, tagline, instrucțiune,
                          #   vârstă, itemsLabel (pentru mesaje) și seo (pentru pagină)
  content.ts              # TOT conținutul în română (întrebări, ghicitori, proverbe, cuvinte)
  progress.ts             # citirea progresului salvat + ultima vizită (index, salut)
  [slug]/page.tsx         # SINGURA pagină de joc: metadata din registru,
                          #   harta slug → componentă, generateStaticParams
  components/
    game-shell.tsx        # rama comună: antet + salutul de revenire + CTA-ul de sub joc
    tabs.tsx              # taburi pe un rând, cu derulare orizontală (roata)
    ui.tsx                # butoane (compuse din app/components/ui.ts), rama albă, DeckBar, scheletul
    storage.ts            # citit/scris în localStorage, fără să arunce vreodată
    rotation.ts           # „nu-mi da de două ori același lucru" + coerceRotation (logica pură)
    use-deck.ts           # hook-ul: dă jocului ELEMENTE întregi, nu id-uri
    shuffle.ts            # Fisher-Yates + scrambleIndexes + shuffleApart
    format.ts             # acordul numeralelor („20 de încercări")
    welcome-back.tsx      # „Bine ai revenit! Te așteaptă N noi." (după ≥1 oră)
    games-index.tsx       # cardurile jocurilor + bara de progres + „continuă"
    daily-riddle.tsx      # ghicitoarea zilei, aleasă determinist din dată
    story-dice-game.tsx   # 🎲 Zarurile de poveste
    categories-game.tsx   # ⏱️ Categorii
    tongue-twisters-game.tsx # 👅 Frământări de limbă
    hidden-word-game.tsx  # 🎈 Cuvântul ascuns
    emoji-rebus-game.tsx  # 📖 Poveste din emoji
    sell-it-game.tsx      # 🧢 Vinde-mi asta!
    taboo-game.tsx        # 🙊 Spune-o altfel
    use-countdown.ts      # cronometrul comun al jocurilor contra timp
    wheel-game.tsx        # 🎡 Roata cuvintelor
    riddles-game.tsx      # 🔮 Ghicitori
    proverbs-game.tsx     # 🧩 Proverbe pereche
    anagrams-game.tsx     # 🔤 Anagrame
    memory-game.tsx       # 🧠 Joc de memorie
```

`app/components/games-teaser.tsx` citește din același `games.ts` ca să arate primele trei
jocuri pe pagina principală. Adaugi un joc în registru → apare și acolo.

## Cum stă jocul în pagină

**Regulile de layout sunt în [CLAUDE.md](../CLAUDE.md), secțiunea „Reguli de UI".** Se aplică
întregului site, nu doar jocurilor, iar fiecare a apărut dintr-un bug ajuns pe telefonul cuiva.
Nu le duplic aici. Ce e specific jocurilor:

- Jocul e un **bloc compact, de înălțimea lui**. Nu se întinde ca să umple ecranul și nu se
  strânge ca să încapă în el. Pe telefoanele obișnuite se vede tot fără derulare — nu pentru că
  îl forțăm, ci pentru că e mic: titlu de un rând, instrucțiune de o frază, 4 perechi pe rundă
  la proverbe.
- Antetul, tabla și invitația la club stau pe aceeași coloană (`max-w-2xl`, dată de `GameShell`).
- Ce trebuie aliniat pe două coloane (proverbele) stă într-**o singură grilă** cu două coloane,
  nu în două liste paralele: rândul crește după cel mai înalt card din el.
- Ce are proporții proprii (roata, tabla de memorie) se măsoară **după lățime**, ca o imagine.

După schimbări de layout sau de UI: `yarn build && yarn check-ui` — script la nevoie, nu
poartă de commit (vezi CLAUDE.md). Logica pură (rotația, amestecările, invariantele
conținutului) are teste: `yarn test`.

## Cum ținem minte progresul

Fiecare element de conținut primește automat un `id` (hash din propriul text, în `content.ts`).
`useDeck(cheie, elemente, câte)` extrage doar din ce n-a ieșit încă, salvează în `localStorage`
sub `vorbaretii.jocuri.<cheie>` și, când lista se termină, începe o rundă nouă fără să repete
imediat ce tocmai a ieșit. Hook-ul primește și întoarce **elemente întregi** — jocurile nu mai
țin propriile hărți id → element. Ce vine din `localStorage` trece prin `coerceRotation`:
orice formă veche sau stricată devine starea goală, nu o eroare.

```
vorbaretii.jocuri.ghicitori          { seen, last, round }
vorbaretii.jocuri.proverbe           { seen, last, round }
vorbaretii.jocuri.anagrame           { seen, last, round }
vorbaretii.jocuri.memorie            { seen, last, round }
vorbaretii.jocuri.zaruri             { seen, last, round }
vorbaretii.jocuri.categorii          { seen, last, round }
vorbaretii.jocuri.framantari         { seen, last, round }
vorbaretii.jocuri.ascuns             { seen, last, round }
vorbaretii.jocuri.rebus              { seen, last, round }
vorbaretii.jocuri.vinde              { seen, last, round }
vorbaretii.jocuri.altfel             { seen, last, round }
vorbaretii.jocuri.memorie.record     cel mai mic număr de încercări
vorbaretii.jocuri.roata.<set>        câte un set de întrebări, socotit separat
vorbaretii.jocuri.curiozitati.<cat>  { seen, last, round } — întrebările articolelor, per categorie
vorbaretii.jocuri.ultima-vizita      { slug, at } — ultimul joc deschis și când
```

Progresul se și **vede** (decizia istorică D13): pe cardurile din `/jocuri` (bara + „N din M",
prin `progress.ts`), în salutul de revenire de pe pagina jocului (după ≥1 oră) și în
ghicitoarea zilei de pe index.

Dacă rescrii un text, id-ul lui se schimbă și elementul redevine „nevăzut". E în regulă: e text nou.

⚠️ **Amestecarea nu se face la randare.** Export static + hidratare: dacă apelezi `Math.random()`
în corpul componentei, serverul și browserul desenează altceva și React se plânge. Tiparul:
prima extragere se face în `useEffect`, după montare, iar până atunci jocul arată `<GameSkeleton />`.

## Cum adaugi conținut nou (cazul obișnuit)

Editezi **doar** `app/jocuri/content.ts`. Jocurile n-au text propriu și nu trebuie să scrii
id-uri. După editare: `yarn test` — invariantele de mai jos sunt verificate automat.

- `wheelDecks` — patru seturi de câte 12 întrebări de conversație („Despre mine", „Imaginație",
  „Prieteni", „Așa sau așa?"). Poți adăuga un set; roata se desenează din lungimea listei.
  **Regula întrebărilor (decizia istorică D14):** fiecare are o scânteie — un twist imaginativ sau
  un detaliu concret care invită la poveste. Fără întrebări care presupun contextul (o cameră
  plină, bunici de față), fără registru de consiliere, fără clasicele de adult („ce te faci
  când vei fi mare?"). Și scurte: o singură întrebare, fără coadă („De ce?", „Cum ar fi?") —
  `yarn test` verifică automat. Și potrivite oricărui copil, nu doar celor din diaspora —
  nimic care presupune unde locuiește sau ce limbă vorbesc colegii lui.
- `riddles` — `{ question, answer }`. Răspunsul e **un singur cuvânt** (jocul oferă ca indiciu
  prima literă și numărul de litere).
- `proverbs` — `{ proverb, meaning }`. O rundă ia 4. Ambele texte stau pe două coloane pe telefon,
  deci ține proverbul sub ~50 de caractere și înțelesul sub ~40.
- `anagrams` — `{ word, hint }`. **Cuvântul se scrie cu MAJUSCULE și cu diacritice.**
  Maximum 9 litere, altfel nu încap pe telefon.
- `memoryPairs` — `{ emoji, word }`. Un joc ia 8 perechi; restul intră la jocurile următoare.
  Cuvântul sub 9 litere, ca să încapă pe cartonaș.
- `storyDice` — `{ emoji, word }`. O aruncare ia 3; un singur cuvânt, sub 10 litere, ca să
  încapă pe zar. `storyStarters` — începuturile de poveste, se rotesc cu aruncarea.
- `categories` — `{ prompt }`. Toate încep cu „5 " (se citesc cu „Spune" în față) și stau
  sub 60 de caractere.
- `tongueTwisters` — `{ text }`. Sub 95 de caractere, ca fraza să stea mare pe ecran.
- `hiddenWords` — `{ word, hint }`. MAJUSCULE cu diacritice, sub 11 litere, doar litere
  de pe tastatura jocului (verificat în teste).
- `emojiRebus` — `{ emojis, answer, category, hint }`. Categoria: poveste / proverb / cuvant.
- `sellItems` — `{ item, bonus }`. Obiectul trăsnit + argumentul-scânteie de rezervă.
- `tabooWords` — `{ word, forbidden: [3] }`. Cuvântul MARE, interzisele mici.

## Cum adaugi un joc nou

1. Adaugă o intrare în `app/jocuri/games.ts` (slug în română, fără diacritice, cu cratime;
   `howTo` = o singură frază; `itemsLabel` = elementele la plural; `seo` = titlul și descrierea
   paginii).
2. Pune conținutul lui în `app/jocuri/content.ts`, printr-un `withIds(...)`.
3. Scrie componenta în `app/jocuri/components/<nume>-game.tsx`, cu `"use client"`:
   butoane din `ui.tsx`, extragere prin `useDeck`.
4. Leagă slug-ul de componentă în harta `boards` din `app/jocuri/[slug]/page.tsx`.
   Pagina, metadata și ruta statică ies singure din registru — nu se mai copiază un `page.tsx`.
5. `yarn generate-og` — regenerează imaginile sociale (`public/assets/og/<slug>.png`,
   se comit). Sitemap-ul iese singur din registru (`app/sitemap.ts`).

Pentru progresul de pe index, adaugă și sursa jocului în `sources` din `app/jocuri/progress.ts`.

## Idei de jocuri următoare

Fazan · Ce lipsește din imagine · Povestea în lanț (o propoziție de fiecare).
