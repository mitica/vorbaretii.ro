# Cum e construit site-ul

## Stivă

- **Next.js 14**, App Router, TypeScript, React 18.
- **Tailwind CSS** (fără plugin-uri). Font: Inter, via `next/font/google`.
- Iconuri: SVG-uri proprii în `app/components/icons/`; `@heroicons/react` e instalat, dar nefolosit.

## Constrângerea care decide totul: export static

`next.config.js` are `output: "export"` și `distDir: "out"`. Site-ul se publică pe
**GitHub Pages** prin `.github/workflows/nextjs.yml`, la fiecare push pe `main`.
Domeniul e în `CNAME` (`www.vorbaretii.ro`).

Consecințe, de reținut înainte de a propune orice:

- **Nu există server.** Fără API routes, fără Server Actions, fără middleware, fără
  revalidare. Tot ce e dinamic se întâmplă în browser (`"use client"`).
- **Nu există optimizare de imagini** (`next/image` cu loader implicit nu merge la export).
  Imaginile se pre-comprimă cu `yarn compress-images` și se servesc din `public/assets/images/`.
- **Orice formular are nevoie de un serviciu extern.** Azi nu avem niciun formular —
  vezi [decisions.md](decisions.md) D3.
- Toate rutele sunt statice. Un joc nou = un folder nou cu `page.tsx`, nu o rută dinamică.

## Comenzi

```
yarn dev              # server local, http://localhost:3000
yarn build            # export static în ./out
yarn lint
yarn compress-images  # assets/images/ -> public/assets/images/ (mai multe dimensiuni)
yarn generate-icons   # iconuri PWA/favicon
```

## Hartă de fișiere

```
app/
  layout.tsx              # <html>, metadata, Header, Footer, gtag + Simple Analytics
  page.tsx                # pagina principală = lista de secțiuni, în ordine
  globals.css             # variabile de culoare, .text-effect, animația .rise
  components/             # secțiunile paginii principale, câte un fișier fiecare
                          #   home-intro · problem · solution · session
                          #   team · games-teaser · contact + header/footer/demo-cta
  jocuri/                 # vezi games.md
  ads/limba-romana/       # pagină de generat imagini pentru reclame (nu e pentru public)
lib/
  config.ts               # config din env (telefon, domeniu, dimensiuni de imagini…)
  contact.ts              # linkurile WhatsApp/Messenger cu mesajul pre-completat
assets/                   # surse (imagini mari, texte); NU se servesc direct
public/assets/            # ce ajunge efectiv pe site
docs/                     # documentul ăsta și frații lui
```

## Analytics

În `app/layout.tsx` rulează două lucruri: **Google Ads / gtag** (`AW-1054161076`) și
**Simple Analytics**. ⚠️ Niciunul nu marchează încă un eveniment când cineva apasă
butoanele de demo — vezi [open-questions.md](open-questions.md) Î2.
