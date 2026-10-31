# AGENTS.md — vorbaretii.ro

Regulile pentru agenți în repo-ul ăsta. Se încarcă la fiecare sesiune: rămâne scurt. Harta
documentației: [docs/README.md](docs/README.md). Starea curentă și pasul următor: `docs/STATUS.md`.

## Ce e proiectul

Site-ul public al **Vorbăreții** — club de socializare în română pentru copiii din diaspora. Static
(Next.js `output: "export"` → GitHub Pages; push pe `main` = deploy). Produsul sunt **jocurile** care
fac copilul să vorbească, cu un al doilea om lângă el (ADR-039), și ritualul zilnic `/azi` (Vorbărici,
cu episoadele lui audio); articolele sunt suprafață moștenită. Legea: `docs/constitution.md`;
deciziile: `docs/decisions/`; direcția: `docs/directie.md`.

## Modelul de lucru

- Sesiunile pornesc de la zero. **Repo-ul e memoria**: ce nu e în `docs/` sau `specs/` se pierde.
- Sesiunea principală e **orchestrator**: citește, planifică, delegă și vorbește cu operatorul.
  **Nu editează fișiere.**
- **Operatorul lucrează de pe telefon.** Răspunsuri scurte; alegerile care sunt ale lui, cu opțiuni
  concrete și o recomandare (AskUserQuestion), nu presupuse; ce nu e urgent → `docs/open-questions.md`.

| Lucru | Agent (`.claude/agents/`) | Model |
|---|---|---|
| Cercetare read-only: cod, scripturi, docs, web | `investigator` | inherit |
| Specuri, cod, config, conținut, schimbări mari de docs | `builder` | inherit |
| Review-ul schimbărilor contra spec/task, legea site-ului, siguranță | `reviewer` | sonnet |
| Docs triviale: STATUS, un rând în Jurnalul confirmărilor, o întrebare, statusul unui spec | `scribe` | sonnet |

Lucrul independent rulează în paralel. Fiecare brief e de sine stătător (subagenții nu văd
conversația): scopul, căile, constrângerile, formatul raportului.

Skill-uri: `/spec <subiect>` (investigație + spec, fără implementare), `/build <spec|task>`
(implementare → review → verificare → docs → pe cuvântul operatorului, commit + PR), `/adr <titlu>`
(o decizie durabilă în `docs/decisions/`), `/voce-jocuri <joc|toate>` (manivelă de producție — doar la
apelul operatorului: costul tipărit și confirmat, apoi un PR pe care îl merge-uiește el).

## Fluxul sesiunii

- **Start:** `docs/STATUS.md`, apoi specurile pe care le citează (`docs/decisions/` dacă e o alegere în
  discuție). Confirmă pasul următor cu operatorul.
- **Lucru:** spec → operatorul aprobă → build → review → STATUS/decizii. Task-urile mici sar peste
  spec, niciodată peste review și peste lanțul verify.
- **Final:** înainte de oprire, `scribe` actualizează `docs/STATUS.md` (făcut, următorul, blocaje, rând
  datat).

## Fișierele de proces sunt LOCALE

Decizia operatorului (2026-10-31): `docs/STATUS.md`, `docs/constitution.md`, `docs/decisions/`,
`docs/personaj.md`, `docs/glossary.md`, `docs/concept-vizual.md`, `docs/directie.md`,
`docs/open-questions.md`, `docs/design/` și specurile (`specs/*`; publice rămân doar `specs/README.md`
și `specs/_template.md`) sunt în `.gitignore` — procesul de gândire al produsului nu se publică. Nu le
muta, nu le copia în fișiere publice; în cod, commituri și PR-uri se citează doar id-ul (`ADR-NNN`), niciodată textul. Lipsesc într-o
clonă proaspătă → cere-le operatorului. Arhiva harness-ului vechi: `../vorbaretii-harness` (local).

## Legea site-ului (nu se re-negociază; detaliile în `docs/`)

1. **Strategia și deciziile** sunt în constituție și în ADR-uri. Dacă ceva de pe pagini pare să
   contrazică o decizie, întreabă — nu presupune.
2. **Export static, fără server.** Fără API routes, Server Actions sau optimizare de imagini. Orice
   interacțiune se întâmplă în browser. Detalii și capcane: [docs/architecture.md](docs/architecture.md).
3. **Mesajul e blocat, nu improvizat.** Titlurile, categoria și **formulările interzise** (niciun
   registru de deficit sau vină față de părinte): [docs/positioning.md](docs/positioning.md).
4. **Fiecare fapt apare o singură dată pe pagina principală.**
5. **Paleta e a mărcii, nu a ta.** Roz (`pink-600`) butoane, indigo (`indigo-600`) etichete, gri text,
   fundal lavandă→alb: [docs/paleta.md](docs/paleta.md). **Culorile nu se schimbă ca efect secundar** —
   e decizie separată, cerută explicit, arătată ca imagine înainte de commit.
6. **Jocurile nu colectează nimic de la copii** — fără conturi, fără date trimise nicăieri; progresul
   stă doar în `localStorage`. Regulile jocurilor: [docs/games.md](docs/games.md).
7. **Tot ce aude sau citește copilul e în vocea personajului** — `docs/personaj.md`, cu regula de aur
   (fără specie, gen sau nume în text; fără morală de profesor).

## Reguli de UI

Fiecare regulă vine dintr-un bug care a ajuns pe telefonul cuiva. Nu sunt preferințe.

1. **Doar clase Tailwind.** `app/globals.css` rămâne cât mai gol; `@keyframes` și tema stau în
   `tailwind.config.ts`. `style={}` doar pentru valori calculate la rulare (unghiul roții), niciodată
   pentru layout. Numele de clase se scriu **întregi** — Tailwind citește sursa ca text, deci
   `grid-cols-${n}` nu există în CSS; folosește o hartă cu șiruri complete.
2. **Înălțimea o dă conținutul.** Niciun `h-*`, `max-h-*`, `aspect-*` sau `auto-rows-fr` pe o cutie
   care conține text. Doar `min-h-*`. *(La fontul mărit al unui telefon, cardurile au ieșit peste text.)*
3. **`flex-1` doar pe orizontală.** Niciodată într-o coloană. *(Roata plutea la 400px de butonul ei.)*
4. **Ce nu încape se rupe pe rânduri** (`flex-wrap`). Niciodată `truncate` pe conținut real, niciodată
   lăsat să împingă pagina în lateral. *(Numele mărcii ajunsese „Vo.”.)*
5. **Centrarea se face din părinte** (`flex justify-center`). `mx-auto` pe un buton nu face nimic —
   butoanele sunt `inline-flex` — și nu dă nicio eroare.
6. **O singură lățime maximă pe pagină**, într-un singur loc. Componentele nu-și pun `max-w-*`.
7. **Fără px arbitrari pentru text sau spațiere.** Doar scara Tailwind (`rem`), ca totul să crească
   odată cu fontul utilizatorului.
8. **Ținte de apăsat: minimum 44px.** Măsurat, nu presupus.
9. **O singură aliniere pe pagină: la stânga.** Titluri, carduri, citate — aceeași margine, aceeași
   coloană (`max-w-6xl px-6`).
10. **Butoanele, pastilele și etichetele se îmbracă din `app/components/ui.ts`** (`btn`, `eyebrow`,
    `pillLabel`…), nu din clase scrise de mână.

**Rută nouă** = inventarul complet: pagina → `app/sitemap.ts` → card OG (`yarn generate-og`) → `ROUTES`
în `scripts/check-ui.ts` → navigația → `public/sw.js` (`CORE` + bump `VERSION`). Jocurile și articolele
intră singure în `ROUTES` (din registrul lor). **Joc nou** poartă `data-game-action` pe controlul cu care
faci o tură — altfel pică legea plutirii.

## Verificarea

```
yarn lint          # eslint (capuri: funcții ≤50 linii, complexitate ≤10, adâncime ≤4, ≤3 parametri,
                   #   fișiere ≤300) + jscpd (duplicate) + knip (cod mort) + naming (ADR-021)
yarn typecheck
yarn format:check  # prettier — a mușcat deja o dată lipsa lui
yarn test          # jocurile, articolele, prompturile, servirea imaginilor, audio-ul articolelor,
                   #   video-ul, mascota, vocea jocurilor, stingul, podcastul, tiparul, episoadele /azi
yarn build         # trebuie să treacă; toate rutele se exportă static
```

**Tot verde înainte de orice push; roșu nu se urcă niciodată.** Fără suppressions, fără praguri
umflate (constituția N5). Comportament nou = test care pică întâi; „trece” înseamnă rulat în sesiunea
asta, cu ieșirea citită.

**`yarn check-ui`** (după `yarn build`; ~70s) — la nevoie, nu la fiecare commit: după o schimbare de
layout sau de UI și înainte de o publicare mai mare. Verifică toate rutele × 10 combinații de lățime
(320–1440px) și font rădăcină (16/18/20/24px), pe patru axe: **suprapuneri**, **derulare laterală**,
**ținte sub 44px** și **legea plutirii** — pe o pagină de joc, controlul `data-game-action` e întreg
deasupra liniei de plutire la scroll 0 (ADR-038; domeniul legii: lățime ≥360px, font ≤18px). Ce nu
încape pe un ecran scund se strânge prin varianta Tailwind `short`, nu prin slăbirea legii. Dacă scoate
ceva, se repară atunci. Codul: [scripts/check-ui.ts](scripts/check-ui.ts).

## Convenții

- **Română** în conținut, docs, commituri; **engleză** în nume de fișiere, foldere și identificatori
  (ADR-021, `yarn naming`). Diacritice și ghilimele „ ” în texte.
- **Deciziile**: `docs/decisions/ADR-NNN.md` — `Decision / Because / Not`, imutabile odată acceptate;
  schimbarea de părere = ADR nou care le supersedează. Cum: `docs/decisions/README.md`.
- **Specurile**: `specs/NNNN-slug.md` din `specs/_template.md`; `draft → approved` doar pe cuvântul
  operatorului. Cum: `specs/README.md`.
- Ce nu e decis se scrie în `docs/open-questions.md` (local) și **se întreabă**.
- Excepție scrisă: numele skill-urilor de producție (`voce-jocuri`) și ale docurilor de proces locale
  (`personaj.md`, `concept-vizual.md`, `directie.md`) sunt în română — comanda e o valoare pe care o
  tastează operatorul, iar docurile sunt citate pe nume în ADR-uri.

## Git și publicare

- Branch per lucrare (`feat/<slug>`; `voce/<slug>` pentru `/voce-jocuri`); `main` rămâne verde. **Push pe `main` = deploy în producție.**
- **Înainte de commit se confirmă cu operatorul** (regula lui, 2026-09-02). Schimbările vizuale se arată
  ca imagine (SendUserFile) înainte.
- PR cu un corp care spune ce și cum s-a verificat. Merge-ul: pe cuvântul operatorului; **ce ajunge la
  copii — conținut, voce, episoade — se publică DOAR prin merge-ul lui** (ADR-004).
- Mesaje scurte, imperative, în română. **FĂRĂ linkuri de sesiune, FĂRĂ atribuire de agent** — repo-ul
  e public (ordinul operatorului, 2026-09-02).
- Niciodată `push --force`, `push` direct pe `main`, `reset --hard`, `--no-verify`, `commit --amend` pe
  `main`, `git restore` / `checkout --` peste lucru necomis, `git clean -x`, `git stash clear/drop`,
  `curl | sh`, citirea `.env` — blocate de lista deny din
  `.claude/settings.json` și de hook-ul `.claude/hooks/guard.sh` (PreToolUse pe Bash). Hook-ul citește
  TEXTUL comenzii: o editare de doc care conține acele cuvinte se face cu Edit/Write, nu cu heredoc în
  Bash.

## Siguranță

Publicarea și cheltuielile sunt greu de dat înapoi. Agenții pregătesc; operatorul publică și plătește.

- **Apeluri plătite** (ElevenLabs — voce; xAI — imagini) rulează doar cu confirmarea explicită a
  operatorului pentru acel lot, cu costul tipărit ÎNAINTE: `generate-game-audio --sweep-only` (fără
  apeluri, dar mătură orfanii); scripturile fără dry-run (`generate-azi-voice`, `generate-article-image`,
  `generate-sting`) → costul se estimează din text și se confirmă înainte de rulare; și un plafon;
  confirmarea se consemnează în jurnalul din `docs/decisions/README.md` înainte de apel. Niciodată
  abonamente, cumpărături, promovare.
- **Secrete**: nu se comit niciodată chei, tokeni, date de cont. Trăiesc în `.env` (ignorat).

### Lista secretelor: nu se citesc, nu se tipăresc, nu se copiază

`ls -l` (existența și mărimea) e în regulă; conținutul nu.
- `.env` și orice `.env.*`
- chei API, tokeni, cookie-uri, profile de browser sau de sesiune
- dump-uri de mediu: `env`, `printenv`, `set`
- **Doar runtime-ul scripturilor încarcă `.env`** (dotenv). Niciun agent nu-l citește, nu-l
  `source`-uiește, nu-l grep-uiește și nu-i trece valorile într-o comandă, nici fără să le afișeze.
