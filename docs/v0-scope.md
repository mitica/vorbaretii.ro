# v0 — ce construim și când e gata

Construit: 2026-09-01. Contextul strategic: `../fus/docs/ideas/research/0018-vorbaretii-brief-socializare.md`.

## Ce e v0

**Vitrina aliniată la poziționarea v2, plus un cârlig gratuit.** Atât. v0 nu e platforma din
brief (cele 10 componente) — e pagina care primește traficul din grupurile de Facebook și îl
transformă în conversații pe WhatsApp, plus o pagină de jocuri care aduce trafic și dă un motiv
de revenire.

Nucleul generic multi-limbă din brief (§4) se construiește **în paralel** cu testul, altundeva.
Repo-ul ăsta rămâne site static.

## Ce intră în v0 (livrat)

1. **Pagina principală, rescrisă pe poziționarea v2.** Șapte secțiuni, în ordinea asta:
   hero (titlu-categorie + ilustrație + pastilele de format) → problema fără vină → grupul stabil
   ca produs (4 carduri) → o oră la club (4 momente) → mentorul → jocuri → prima lecție e gratuită
   (3 pași + CTA). Vezi [positioning.md](positioning.md).

   **Regulă de conținut:** fiecare fapt apare **o singură dată** pe pagină. Prima variantă avea
   „max 8 copii" și „seara, pe fusul vostru" în două secțiuni diferite — de asta au dispărut
   două secțiuni întregi.
2. **CTA unic: lecția demo gratuită**, prin WhatsApp și Messenger, cu mesaj pre-completat
   (`lib/contact.ts`).
3. **`/jocuri`** — cinci jocuri jucabile, în română, construite în casă: fiecare încape pe un
   ecran și ține minte ce s-a jucat deja. Vezi [games.md](games.md).
4. **Documentația asta.**

## Ce NU intră în v0 (deliberat)

- **Preț pe site** — decis să lipsească ([decisions.md](decisions.md) D2).
- **Formular de rezervare / listă de emailuri** — leadurile vin pe WhatsApp și Messenger (D3).
- **Cont, login, dashboard, plăți, orar** — sunt platforma, nu site-ul.
- **Multi-limbă / i18n** — site-ul e monolingv românesc. Genericitatea din brief privește
  platforma, nu vitrina.
- **Blog, testimoniale, FAQ** — utile, dar nu blochează testul. Vezi
  [open-questions.md](open-questions.md).
- **Scor / clasament / conturi la jocuri** — fără conturi și fără date de la copii.
  Progresul se ține doar în browserul copilului, ca să nu se repete conținutul ([decisions.md](decisions.md) D8).

## Cum arată „gata" pentru v0

- [x] Pagina principală spune categoria din brief, nu „curs online de română".
- [x] Nicio formulare de deficit/rușine pe site.
- [x] Grup ≤8 peste tot (nu 10).
- [x] Un singur CTA, repetat: lecția demo gratuită.
- [x] `/jocuri` cu jocuri care merg pe telefon, fără cont și fără instalare.
- [x] `yarn build` trece; toate rutele exportate static.
- [ ] Prima postare în grupuri de Facebook, cu link către site. ← **următorul pas real**

## După v0

Ordinea din brief §4 pentru platformă: 01 Core → 02 Language Pack → 04 Class Ops →
09 Growth Kit → 05 Curriculum → 07 CRM → 06 Mentor Ops → 08 → 10.

Pentru **site**, următoarele lucruri în ordinea valorii:
1. Măsoară apăsările pe CTA (azi nu se măsoară — [open-questions.md](open-questions.md) Î2).
2. Pagină/secțiune de FAQ (vârste, nivel, fus orar, „dacă e timid") — obiecțiile din brief.
3. Reintroducerea prețului + formular real, **dacă** se face testul de cerere complet (Î1).
4. Jocuri noi și conținut nou, pe măsură ce Lia le folosește la club.
