# Întrebări deschise

Ce nu e decis, cine decide și de ce contează. **Întreabă înainte de a presupune.**

---

### Î1 · Facem testul de cerere complet, cu preț?
**Decide: Dumitru.**

Azi site-ul duce spre demo, fără preț ([decisions.md](decisions.md) D2). Poarta de validare din
brief cere însă: landing cu **€59** → rezervare demo → demo live → înscriere plătită, cu prag
**GO = ≥1 grup plin (6–8 plătitori) la €59, CAC < €60**.

Întrebarea: rămânem pe „umplem demo-urile întâi" sau punem prețul înapoi și măsurăm
demo→plată? A doua variantă cere și un mod de a încasa — iar **decizia de entitate + procesator
e redeschisă** în `fus` (Paddle infirmat; alegerea vie: SRL RO + Stripe/SEPA vs. SRL MD +
maib/SEPA cu OSS).

---

### Î2 · Cum măsurăm apăsările pe CTA?
**Decide: Dumitru. Recomandare: da, merită făcut înainte de prima postare pe Facebook.**

În `app/layout.tsx` rulează gtag (Google Ads `AW-1054161076`) și Simple Analytics, dar **nicio
apăsare pe „Rezervă o lecție demo gratuită" nu e marcată ca eveniment**. Fără asta nu știm
câți vizitatori au deschis conversația — adică nu știm nimic despre pâlnie.

Minimul: un `onClick` care trimite un eveniment (gtag conversion + `sa_event`) din `DemoCta`.
Costă puțin; componenta ar trebui să devină `"use client"`.

---

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
