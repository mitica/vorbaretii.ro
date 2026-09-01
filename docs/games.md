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

- **Fără conturi, fără date de la copii, fără scoruri salvate.** Business cu minori: colectăm
  zero. Nicio stare nu părăsește browserul.
- **Fără biblioteci externe de jocuri.** React + Tailwind + SVG, atât.
- **Mobil întâi.** Ținte de atins cu degetul (min. 44px), fără drag-and-drop obligatoriu —
  potrivirile se fac prin apăsare, nu prin tras.
- **Fără sunet care pornește singur.**
- **Fiecare joc se termină cu invitația la club** (blocul din `GameShell`).

## Structura

```
app/jocuri/
  page.tsx                # indexul: cardurile tuturor jocurilor
  games.ts                # REGISTRUL: slug, titlu, emoji, tagline, instrucțiuni, vârstă
  content.ts              # TOT conținutul în română (întrebări, ghicitori, proverbe, cuvinte)
  components/
    game-shell.tsx        # rama comună: titlu, instrucțiuni, CTA-ul de la final
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

## Cum adaugi conținut nou (cazul obișnuit)

Editezi **doar** `app/jocuri/content.ts`. Jocurile n-au text propriu.

- `wheelDecks` — două seturi de 12 întrebări de conversație („Despre mine", „Imaginație").
  Poți adăuga un set al treilea; roata se desenează din lungimea listei.
- `riddles` — `{ question, answer }`.
- `proverbs` — `{ proverb, meaning }`. Jocul ia 5 la întâmplare pe rundă.
- `anagrams` — `{ word, hint }`. **Cuvântul se scrie cu MAJUSCULE și cu diacritice.**
  Sub ~10 litere, altfel nu încap pe telefon.
- `memoryPairs` — `{ emoji, word }`. 8 perechi = 16 cartonașe; dacă adaugi, tabla crește.

## Cum adaugi un joc nou

1. Adaugă o intrare în `app/jocuri/games.ts` (slug în română, fără diacritice, cu cratime).
2. Pune conținutul lui în `app/jocuri/content.ts`.
3. Scrie componenta în `app/jocuri/components/<nume>-game.tsx`, cu `"use client"`.
4. Creează `app/jocuri/<slug>/page.tsx` — copiază unul existent; are `metadata` proprie
   (titlu + descriere pentru căutări) și randează `<GameShell game={getGame("<slug>")}>`.

⚠️ **Amestecarea nu se face la randare.** Export static + hidratare: dacă apelezi `Math.random()`
în corpul componentei, serverul și browserul desenează altceva și React se plânge. Tiparul folosit
peste tot: stare inițială deterministă, apoi `shuffle` într-un `useEffect` după montare.

## Idei de jocuri următoare

Fazan · Cuvântul ascuns (spânzurătoarea, fără spânzurătoare) · Frământări de limbă cronometrate ·
Ce lipsește din imagine · Categorii („spune 5 lucruri care...") · Povestea în lanț (o propoziție
de fiecare).
