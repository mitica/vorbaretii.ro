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
  Imaginile de articol se servesc DOAR ca variante dimensionate (`yarn compress-images` →
  `-768/-1536` în `public/assets/images/`; masterul 2k rămâne în `assets/` — paginile nu
  servesc niciodată imaginea brută, testul o respinge).
- **Orice formular are nevoie de un serviciu extern.** Azi nu avem niciun formular —
  vezi decizia istorică D3 (`git log -- docs/decisions.md`).
- Toate rutele sunt statice. Un joc nou = un folder nou cu `page.tsx`, nu o rută dinamică.

## Comenzi

```
yarn dev              # server local, http://localhost:3000
yarn build            # export static în ./out
yarn lint
yarn validate-article <slug>         # respinge devreme un articol pe contractul real
yarn generate-article-image <slug> <ancora> "<scena>" [stil]  # imagine prin API-ul xAI
yarn generate-og      # cardurile og:image (PNG), comise
yarn generate-article-audio <slug> [titlu|<sectionId>]  # bucatile audio prin ElevenLabs, comise
yarn compress-images  # assets/images/articol-* -> public/assets/images/ (variantele servite -768/-1536)
yarn generate-icons   # iconuri PWA/favicon
```

## Hartă de fișiere

```
app/
  layout.tsx              # <html>, metadata, Header, Footer, Simple Analytics (gtag comentat)
  page.tsx                # pagina principală = lista de secțiuni, în ordine
  globals.css             # variabile de culoare, .text-effect, animația .rise
  components/             # secțiunile paginii principale, câte un fișier fiecare
                          #   home-intro · problem · solution · session
                          #   team · games-teaser · contact + header/footer/demo-cta
  jocuri/                 # vezi games.md
  ads/limba-romana/       # pagină de generat imagini pentru reclame (nu e pentru public)
lib/
  config.ts               # config din env (telefon, domeniu…)
  contact.ts              # linkurile WhatsApp/Messenger cu mesajul pre-completat
assets/                   # surse (imagini mari, texte); NU se servesc direct
public/assets/            # ce ajunge efectiv pe site (imagini servite, audio/articole/<slug>/, og)
docs/                     # documentul ăsta și frații lui
```

## PWA (manifest + service worker)

Site-ul e instalabil; paginile vizitate merg offline. `app/manifest.ts` → manifestul;
`public/sw.js` (scris de mână): navigările network-first cu copie în cache, asset-urile
cu hash cache-first, **orice cerere către alte origini nu e atinsă**.

Reguli vii (fosta decizie D17):
- **Secțiune nouă de site** (ex. `/articole`) → intră în lista `CORE` din `sw.js` **și**
  se face bump la `VERSION` (golește cache-ul vechi la activare).
- Un articol/joc nou NU cere nimic — doar secțiunile noi.
- Fallback-ul offline pentru pagini nevizitate: indexul jocurilor.

## Analytics

**Simple Analytics e singurul sistem folosit** (scriptul gtag/Google Ads stă COMENTAT în
`app/layout.tsx`, cu instrucțiunea de reactivare alături — se decomentează doar la o
campanie reală). Se măsoară DOAR apăsările care duc în afara site-ului (WhatsApp,
Messenger) — navigările interne se văd în pageviews. Regulile vii (fosta decizie D7),
implementate în `lib/track.ts` + `app/components/track-link.tsx`:

- evenimentele au tipul `CtaEvent` (fără nume scrise greșit care s-ar raporta separat);
- clicurile timpurii intră în coada `sa_event.q` (scriptul se încarcă `async`);
- funcția **nu aruncă niciodată** (un blocant de reclame nu strică un clic);
- legăturile urmărite se deschid în filă nouă, ca evenimentul să apuce să plece.
