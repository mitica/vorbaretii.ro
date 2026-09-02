# Decizii

Imutabile. Dacă una se schimbă, se adaugă o intrare nouă care o supersedă — nu se rescrie.

---

## D1 · Site-ul trece pe poziționarea v2 „club de socializare"
**2026-09-01 · decis de Dumitru**

Pagina principală se rescrie complet pe categoria din brief („Club de socializare în română
pentru copiii din diaspora"), nu se cârpește vechiul mesaj „curs online de română".

**De ce:** site-ul rămăsese cu poziționarea v0 („Păstrează legătura cu limba română"), în timp
ce în `fus` proiectul trecuse prin două pivoturi. Un site care contrazice brieful nu poate testa
brieful. Conținutul vechi (curs, proverbe/ghicitori ca materie, „max 10 copii") a fost înlocuit.

**Ce s-a schimbat concret:** grup 10 → **8**; „curs" → **club**; secțiunile
`about-course-section`, `scope-section`, `course-groups-section` au fost înlocuite cu
`problem-section`, `solution-section`, `session-section`.

**Rafinare, aceeași zi (feedback Dumitru):** prima variantă a ieșit prea lungă și prea rece —
șase secțiuni „titlu + grilă de carduri" care se repetau („max 8 copii" și „seara, pe fusul
vostru" apăreau de două ori), totul în tonuri de gri, copiat prea fidel după landingul brut din
`fus` (care e un test de cerere, nu un site de brand). Au fost **șterse** secțiunile
`for-parents-section` și `how-it-works-section`; faptele lor au intrat în pastilele din hero și
în cei 3 pași din secțiunea de contact. Cardurile au primit culoare (roz/chihlimbar/verde/albastru),
iar hero-ul a primit ilustrația cu copii. **Regula rămasă: fiecare fapt apare o singură dată pe
pagină.**

---

## D2 · Prețul NU apare pe site
**2026-09-01 · decis de Dumitru**

CTA-ul e lecția demo gratuită. Despre abonament se discută după demo, în conversație.

**⚠️ Consecință de știut:** brieful (§8) și planul testului de cerere cer **€59 pe landing**,
pentru că numărul care decide totul e conversia **demo → plată**. Fără preț afișat, pâlnia
măsoară *rezervări de demo*, nu *disponibilitate de plată* — poarta de validare din `fus`
rămâne deschisă. Asta e o alegere conștientă de secvențiere (întâi umplem demo-urile), nu o
scăpare. Când se trece la testul de cerere propriu-zis, prețul trebuie pus înapoi.

---

## D3 · Leadurile vin prin WhatsApp și Messenger, fără formular
**2026-09-01 · decis de Dumitru**

Butoanele deschid o conversație cu mesaj pre-completat (`lib/contact.ts`). Fără Formspree,
fără Tally, fără iframe.

**De ce:** site-ul e export static, deci orice formular ar cere un serviciu extern; diaspora
oricum scrie pe WhatsApp; zero setup, zero GDPR pe formular.

**Ce pierdem, conștient:** nu se formează lista de emailuri („lista-sămânță" din planul de test,
care era unul din câștigurile secundare), iar conversia e mai greu de măsurat decât la un formular.

---

## D4 · Jocurile se construiesc în casă, nu se linkuiesc
**2026-09-01 · decis de Dumitru**

`/jocuri` conține jocuri React proprii, nu o listă de linkuri către Wordwall.

**De ce:** traficul rămâne la noi, conținutul e al nostru, jocurile devin dovada formatului de la
club și nu depindem de un serviciu terț. Regulile de construcție: [games.md](games.md).

---

## D5 · Documentația site-ului trăiește în `docs/`, strategia rămâne în `fus`
**2026-09-01**

Repo-ul ăsta documentează **cum e făcut site-ul și de ce arată așa**. Nu duplică brieful, nu
duplică economia, nu duplică planul de validare — trimite la ele.

---

## D6 · Paleta rămâne cea existentă a mărcii — roz + indigo + gri
**2026-09-01 · corecție cerută de Dumitru**

Prima variantă a schimbat paleta pe cont propriu (crem cald, teracota, tonuri „stone"). Greșit:
cererea era **conținut**, nu rebranding, iar culorile existente sunt deja o alegere de marcă —
iconul V e `pink-700`, sunt reclame și materiale în aceleași culori, iar look-ul jucăuș se
potrivește unui produs pentru copii mai bine decât editorialul rece pe care-l pusesem.

**Paleta, așa cum se folosește (revenită la original):**

| Rol | Culoare |
|---|---|
| Fundalul paginii | `linear-gradient(to bottom, transparent, white) rgb(214,219,220)` — lavandă sus, alb jos |
| Accent primar (butoane, CTA) | `pink-600`, hover `pink-500`; iconul V `pink-700` |
| Accent secundar (eyebrow, etichete, numere, linkuri-acțiune) | `indigo-600` |
| Text | `gray-900` / `gray-600` / `gray-500` |
| Carduri „beneficii" | `bg-gradient-to-br from-white to-pink-50` + `border-pink-100` |
| Carduri „ce facem" | `bg-gradient-to-br from-pink-50 to-indigo-50` |
| Benzi de accent | `bg-gradient-to-r from-pink-50 to-indigo-50`; înainte de footer `from-white via-white to-pink-100` |
| Cuvântul evidențiat (`.text-effect`) | `from-pink-500 via-sky-500 to-yellow-500` |
| WhatsApp / Messenger | `green-600` / `blue-600` (culorile lor, recognoscibile) |
| Petele de fundal | `from-[#ff80b5] to-[#9089fc]`, `opacity-30` |

**Regulă:** culorile nu se schimbă ca efect secundar al unei modificări de conținut. O schimbare
de paletă e o decizie separată, cerută explicit.

---

## D7 · Se măsoară doar apăsările care duc ÎN AFARA site-ului
**2026-09-01**

Fiecare legătură către WhatsApp sau Messenger trimite un eveniment către **Simple Analytics**
(`sa_event`), cu un nume care spune și de unde s-a apăsat: `demo_hero_whatsapp`, `demo_header`,
`demo_contact_messenger`, `demo_jocuri`, `demo_joc`, `demo_footer_*`.

**Simple Analytics e singurul sistem de analiză folosit** (confirmat de Dumitru, 2026-09-01).
Nu Google Analytics, nu Google Ads — vezi `open-questions.md` Î6 pentru scriptul gtag rămas în
`app/layout.tsx`.

**De ce doar clicurile spre exterior.** Navigările interne se văd oricum în pageviews — un
eveniment în plus ar dubla aceeași informație. Clicurile spre WhatsApp pleacă însă de pe site
fără nicio urmă, și tocmai ele sunt singurul indicator de conversie pe care-l avem cât timp nu
există formular (cf. D3) și nici preț (cf. D2).

**Reguli de implementare** (`lib/track.ts`, `app/components/track-link.tsx`):
- **Coadă pentru clicurile timpurii.** Scriptul Simple Analytics se încarcă `async`; un clic în
  prima secundă l-ar găsi neîncărcat, iar evenimentul s-ar pierde. Folosim tiparul recomandat de
  ei: evenimentul se adună în `sa_event.q`, pe care scriptul îl golește la pornire.
- Funcția nu aruncă **niciodată**. Un blocant de reclame nu are voie să strice un clic.
- Legăturile urmărite se deschid în filă nouă, ca evenimentul să apuce să plece.
- Numele evenimentelor sunt un tip TypeScript (`CtaEvent`), ca să nu apară variante scrise greșit
  care s-ar raporta separat în panou.

**Verificat** în browser: cu `sa_event` șters din `window`, clicul ajunge în coadă și e trimis
când scriptul pornește; toate cele 7 legături externe de pe pagina principală și cele 4 de pe o
pagină de joc emit evenimentul; niciun clic nu aruncă.

---

## D8 · Jocurile țin minte progresul, dar numai în browserul copilului
**2026-09-01 · cerut de Dumitru**

Fiecare joc salvează în `localStorage` ce a ieșit deja (ghicitori, proverbe, cuvinte, întrebările
roții) și, la memorie, cel mai bun rezultat. La deschiderea următoare continuă de acolo: nu repetă
nimic până nu a arătat tot, apoi începe o rundă nouă.

**Ce supersedă:** regula din [games.md](games.md) „fără scoruri salvate" și rândul din
[v0-scope.md](v0-scope.md) „jocurile rămân fără stare". Motivul din spatele lor —
**nu colectăm nimic de la copii** — rămâne întreg și e respectat: fără cont, fără server, fără
cerere de rețea. Starea nu părăsește browserul și nu ajunge niciodată la noi.

**De ce merita schimbat:** un joc care, la a treia deschidere, dă a treia oară aceeași ghicitoare
nu mai e un cârlig. Cârligul e motivul pentru care există `/jocuri` ([games.md](games.md)) —
iar el trăiește din reveniri.

**Reguli de implementare** (`components/storage.ts`, `rotation.ts`, `use-rotation.ts`):
- Toate cheile sub prefixul `vorbaretii.jocuri.`, ca să se poată șterge dintr-o mișcare.
- Citirea și scrierea **nu aruncă niciodată**: în navigare privată `localStorage` aruncă la
  scriere, iar un joc nu are voie să se strice din asta — pur și simplu nu ține minte.
- Id-urile elementelor sunt hash-uri din propriul text, calculate în `content.ts`. Nimeni nu scrie
  id-uri de mână, iar un text editat redevine „nevăzut".
- Prima extragere se face după montare (`useEffect`), nu la randare — altfel export static +
  hidratare = două desene diferite.

**Verificat** în browser: 30 de ghicitori ies toate, fără repetare, în 30 de deschideri
consecutive; a 31-a începe runda 2 și nu o repetă pe a 30-a. Cele 24 de proverbe ies exact o dată
în 6 runde. Recordul de la memorie se scrie la sfârșitul jocului. Fiecare set al roții se
socotește separat.

---

## D9 · Un joc încape pe un ecran, fără derulare
**2026-09-01 · cerut de Dumitru**

Pe telefon și pe calculator, tabla de joc și butonul principal se văd fără să derulezi. Invitația
la club rămâne imediat sub ecran.

**Ce s-a schimbat concret:** rama (`GameShell`) are titlul și instrucțiunea pe două rânduri, nu pe
cinci; instrucțiunile din `games.ts` s-au scurtat la o frază; `.game-viewport` fixează exact un
ecran (`height`, nu `min-height`); proverbele stau pe două coloane la orice lățime, câte 4 perechi
pe rundă, nu 5 pe două liste una sub alta; tabla de memorie și roata se măsoară și după înălțime.

**De ce:** varianta veche a proverbelor era, pe telefon, imposibil de jucat — lista de proverbe
și lista de înțelesuri nu încăpeau niciodată pe același ecran, deci nu puteai compara ce potrivești.

---

## D10 · Layout natural. Jocul nu se strânge într-o înălțime fixă
**2026-09-01 · corecție cerută de Dumitru**

**Supersedă D9.** D9 cerea „un joc încape pe un ecran, fără derulare" și a fost implementat cu
`.game-viewport { height: calc(100svh - bară) }` plus `flex-1` și `auto-rows-fr` înăuntru, ca
tabla să se strângă la cât a rămas.

**De ce a fost greșit:** înălțimea se strânge, textul nu. Pe un telefon cu fontul mai mare decât
al meu, cele patru proverbe nu mai încăpeau în rândurile lor egale și **ieșeau peste textul de
dedesubt** — cardurile se suprapuneau peste „Apasă întâi un proverb din stânga". Verificasem la
cinci lățimi, dar toate cu fontul implicit. O regulă care ține doar cât timp textul are exact
mărimea pe care am presupus-o nu e o regulă, e o coincidență.

**Ce se face în loc:** layout obișnuit, în flux normal. Nimic nu se strânge sub conținutul lui.

- `.screen-min` dă **cel puțin** un ecran (`min-height`), ca invitația la club să rămână sub el.
  Dacă jocul are nevoie de mai mult, pagina derulează — normal, ca orice pagină.
- Proverbele stau într-o **singură grilă cu două coloane**, nu în două liste paralele: rândul
  crește după cel mai înalt dintre cele două carduri, deci nimic nu iese din rândul lui.
- Tabla de memorie și roata se măsoară după lățime, ca orice grilă și ca orice imagine.
- **Toate mărimile de text sunt în `rem`**, niciuna în `px` fix, ca să crească împreună când
  cineva are fontul mărit.
- Bara de sus lasă numele mărcii să se scurteze (`truncate`) în loc să împingă pagina lateral.

**Ce rămâne din D9:** compactarea, care nu se ceartă cu nimic — titlu și instrucțiune scurte
(o frază), carduri strânse în index. Pe telefoanele obișnuite jocul se vede tot fără derulare;
diferența e că acum, când nu se vede, pagina derulează în loc să calce textele unele peste altele.

**Verificat** pe build-ul de producție, la 7 combinații de lățime × mărime de font (320–1280px,
font rădăcină 16/20/24px), pe toate cele 6 pagini din `/jocuri`: niciun element nu iese din
containerul lui și nicio pagină nu derulează lateral.

---

## D11 · Jocul e un bloc compact; pe telefon, hero-ul începe cu mesajul
**2026-09-01 · cerut de Dumitru**

Două corecții văzute pe ecrane reale, amândouă din aceeași greșeală: am lăsat lucrurile să se
întindă ca să umple ecranul.

**Jocul nu se mai întinde.** D10 scosese înălțimea fixă, dar lăsase `.screen-min` pe rama jocului
și `flex-1` pe tablă. Pe un monitor înalt, tot spațiul rămas intra *în* joc: roata plutea singură
în mijlocul paginii, la sute de pixeli de butonul „Învârte roata", iar cartonașul cu întrebarea
era departe, jos. Acum jocul are înălțimea lui, iar spațiul rămâne în jurul lui. În plus, fiecare
joc se limitează la `max-w-2xl`, ca textul și butoanele să nu se lățească pe tot ecranul.
`.screen-min` rămâne doar pe indexul `/jocuri`.

**Hero-ul, pe telefon, începe cu mesajul.** Ilustrația era prima (`order-first`) și umplea singură
tot primul ecran: pe un telefon obișnuit, titlul se tăia la fold, iar butonul „Rezervă lecția
demo" era complet dedesubt. Un părinte venit din grupurile de Facebook vedea o poză drăguță și
atât. Acum, pe telefon, ordinea e eyebrow → titlu → subtitlu → cele două butoane → pastilele, cu
ilustrația imediat sub ele. **Pe ecran lat nu se schimbă nimic** — grila o pune oricum în dreapta.

Ce rămâne din D1: ilustrația face în continuare parte din hero, nu s-a scos. S-a mutat numai
ordinea pe telefon.

**Verificat** pe build-ul de producție: 10 combinații de lățime × mărime de font
(320–1440px, font rădăcină 16/18/20/24px) × 7 pagini = 70 de verificări, toate curate.

---

## D12 · Pagina principală se aliniază la stânga, pe o singură coloană
**2026-09-01 · cerut de Dumitru**

Toate secțiunile pornesc de la aceeași margine, pe același container (`max-w-6xl px-6`):
titluri, text din carduri, citate. Nimic centrat.

**Ce era înainte:** `problem-section` și `contact-section` erau centrate, pe `max-w-3xl`; restul,
la stânga, pe `max-w-6xl`. Cardurile din „O oră la club" aveau conținutul centrat, iar cele din
„Grupul lui de prieteni" — la stânga, deși stau una sub alta. Nu era o alegere, era ce a ieșit
din faptul că secțiunile s-au scris în momente diferite.

**Ce s-a schimbat concret:** `course-items` — emoji, titlu și descriere la stânga;
`problem-section` și `contact-section` — la stânga, pe containerul comun; citatul din
`session-section` — la stânga; butoanele de la contact — o pereche compactă (`max-w-md`), ca
perechea din hero, nu două butoane cât secțiunea.

**Punctuație:** titlurile de secțiune se termină cu punct, ca cele blocate din
[positioning.md](positioning.md). „O oră la club." și „Jocuri în română, de jucat chiar acum."
au primit punctul care le lipsea. Titlurile blocate n-au fost atinse.

**Regula rămasă**, în [CLAUDE.md](../CLAUDE.md) § Reguli de UI: o singură aliniere pe pagină,
la stânga.

---

## D13 · Revenirea copilului se vede: progres pe index, salut, ghicitoarea zilei
**2026-09-02 · aprobat de Dumitru**

D8 a dat jocurilor memorie, dar nimic nu o **arăta**: un copil care revenea după o oră sau o zi
nu vedea nicăieri că site-ul l-a ținut minte. Cârligul trăiește din reveniri, deci revenirea
trebuie să fie plăcută, nu mută.

**Ce s-a adăugat, toate doar din `localStorage` (D8 rămâne întreg — fără cont, fără server):**

- **Progres pe cardurile din `/jocuri`** (`games-index.tsx` + `progress.ts`): bară discretă +
  „N din M" (+ „runda R" după prima trecere), doar la jocurile cu progres. Ultimul joc deschis
  primește conturul roz și „· continuă". Serverul randează cardurile la fel pentru toți;
  progresul apare după montare.
- **Salutul de revenire** (`welcome-back.tsx`, randat de `GameShell`): după ≥1 oră de la ultima
  vizită, un rând sub antet — „👋 Bine ai revenit! Te așteaptă 22 de ghicitori noi." sau, după
  o trecere completă, „Le-ai văzut pe toate — acum e runda 2." Doar sărbătorește; nu există
  mesaje de vină sau de serie pierdută.
- **Ghicitoarea zilei** (`daily-riddle.tsx`, pe index): aceeași pentru toți în aceeași zi,
  aleasă determinist din dată (hash pe data locală, fără server) — un motiv concret de revenit
  mâine. Cheia nouă: `vorbaretii.jocuri.ultima-vizita` `{ slug, at }`.

**Respins, conștient:** serii de zile cu penalizare („ai pierdut seria") — presiune, nu joacă.
O „colecție" de răsfoit rămâne idee deschisă.

**Rafinare (2026-09-02, feedback Dumitru):** progresul se vede și **în timpul jocului**, nu doar
pe index — era o scăpare. Bară subțire (`DeckBar`, în `ui.tsx`, cu datele live din `useDeck`)
sub rândul de progres al fiecărui joc; la roată, sub selectorul de seturi, pe setul curent.
Proverbele și memoria arată acum și totalul („8 din 24"), nu doar runda curentă.

**Rafinare (2026-09-02, feedback Dumitru):** ghicitoarea zilei stătea uitată la coada indexului.
Primește loc de cinste: **prima** pe `/jocuri`, înaintea cardurilor, și apare și pe pagina
principală, în secțiunea de jocuri — e cârligul zilnic, nu o notă de subsol.

---

## D14 · Întrebările roții: registru de joacă, nu de interogatoriu
**2026-09-02 · aprobat de Dumitru**

Multe întrebări din prima versiune sunau a consiliere școlară („Ce faci când un prieten e
supărat pe tine?", „Ce i-ai spune cuiva care stă singur în pauză?"), a interviu de adult
(„Ce ai vrea să te faci când vei fi mare?") sau presupuneau un context care nu există când
copilul joacă singur pe telefon („Spune un lucru bun despre fiecare om din camera asta.").
Un copil interogat se plictisește; unul provocat povestește.

**Regula, scrisă și în `content.ts`:** fiecare întrebare are **o scânteie** — un twist
imaginativ sau un detaliu concret care invită la poveste, nu la „răspunsul corect". Nu scriem:
întrebări care presupun contextul (cameră plină, bunici de față), întrebări de consiliere,
clasicele de adult.

**Ce s-a schimbat concret:** 14 din 36 de întrebări rescrise (setul „Prieteni" aproape integral);
s-a adăugat al patrulea set, **„Așa sau așa?"** — 12 alegeri amuzante de argumentat („Un dragon
de companie sau un robot care îți face temele?"). Total: 48 de întrebări, iar descrierea paginii
se calculează din conținut, ca numărul să nu mai rămână în urmă. Întrebările rescrise au id-uri
noi, deci redevin „nevăzute" — corect, sunt texte noi.

**Rafinare (2026-09-02, feedback Dumitru):** întrebările se țin **cât mai scurte** — o singură
întrebare, fără coadă („De ce?", „Cum ar fi?", „Unde te-ai opri?"). Coada e de prisos: copilul
oricum povestește. Regula e verificată automat în `yarn test` (nimic după semnul întrebării,
maximum 85 de caractere).
