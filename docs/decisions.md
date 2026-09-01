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
