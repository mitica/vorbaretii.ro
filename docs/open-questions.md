# Întrebări deschise

Ce nu e decis, cine decide și de ce contează. **Întreabă înainte de a presupune.**

---

### Î1 · Facem testul de cerere complet, cu preț?
**Decide: Dumitru.**

Azi site-ul duce spre demo, fără preț (decizia istorică D2). Poarta de validare din
brieful istoric cere însă: landing cu **€59** → rezervare demo → demo live → înscriere plătită, cu prag
**GO = ≥1 grup plin (6–8 plătitori) la €59, CAC < €60**.

Întrebarea: rămânem pe „umplem demo-urile întâi" sau punem prețul înapoi și măsurăm
demo→plată? A doua variantă cere și un mod de a încasa — iar **decizia de entitate + procesator
e redeschisă** (istoric, în fus: Paddle infirmat; alegerea vie: SRL RO + Stripe/SEPA vs. SRL MD +
maib/SEPA cu OSS).

---

### Î2 · ~~Cum măsurăm apăsările pe CTA?~~ — REZOLVAT 2026-09-01

Vezi decizia istorică D7. Fiecare clic spre WhatsApp/Messenger emite un eveniment
Simple Analytics. Nimic de decis.

### Î3 · Ce facem cu pagina `/ads/limba-romana`?
**Decide: Dumitru.**

E o pagină de generat imagini pentru reclame, nu pentru public. A rămas după ștergerea
reclamelor Proactiv (commit `ec94fd8`) și e singurul consumator rămas al componentei
`CourseItems` în afara paginii principale. Titlul ei mai vorbește despre „limba română".
De păstrat, de actualizat sau de șters?

---

### Î4 · Numele umbrelă
**Amânat în brief, fără cost.**

Brieful pomenește Chirpy / Yap Club / Unmute ca posibile branduri-umbrelă pentru varianta
multi-limbă. Testul rulează pe „Vorbăreții" — deci nimic de făcut pe site acum. De reținut doar
că nu e blocat nimic de asta.

---

### Î5 · Conținut care lipsește de pe site
**Decide: Dumitru + Lia.**

Nu blochează v0, dar sunt cele mai ieftine îmbunătățiri de conversie:
- **FAQ** cu obiecțiile reale din brief: vârste, nivel („de la începători"), orar/fus orar,
  „dacă e timid", ce dispozitiv trebuie.
- **Dovezi**: câți copii sunt acum în club, din ce țări, ce spun părinții. Site-ul n-are azi
  nicio dovadă socială — la un serviciu pentru minori, recomandarea domină decizia.
- **Fotografii** de la ședințe reale (cu acordul părinților) — `assets/images/` are doar stoc
  și portretele Liei.

---

### Î6 · ~~Scoatem scriptul Google Ads din `app/layout.tsx`?~~ — REZOLVAT 2026-09-01

**Comentat, nu șters** (decizia lui Dumitru: „acum nu folosesc ads"). Cele două blocuri `<Script>`
și importul lui `Script` stau comentate în `app/layout.tsx`, cu instrucțiunea de reactivare
alături. La prima campanie Google Ads se decomentează amândouă locurile — nu trebuie recuperat
nimic din istoric.

Verificat: `googletagmanager` nu mai apare în niciun fișier din `out/`; Simple Analytics rămâne.
