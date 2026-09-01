# Imaginea din hero — brief și prompturi

**În uz acum:** `public/assets/images/girl-video-call-friends-896.jpg` (sursa mare:
`assets/images/girl-video-call-friends.jpg`), referit în `app/components/home-intro.tsx`.
Generată din **Promptul A** de mai jos, 2026-09-01. Prima imagine
(`happy-children-playing`) a fost scoasă: arăta copii care se joacă *fizic* împreună, ceea ce
promitea alt produs.

## Ce trebuie să facă imaginea

1. **Să arate celălalt copil.** Produsul e grupul de prieteni, nu lecția. Dacă în imagine nu se
   văd alți copii, imaginea nu vinde produsul.
2. **Să arate că e online.** Copiii sunt împrăștiați prin Europa; o imagine cu copii care se
   joacă fizic împreună promite altceva decât livrăm.
3. **Să arate bucurie zgomotoasă.** Copil care râde, gesticulează, povestește. Semnul promis
   părintelui e „cere să revină".
4. **Să nu semene a timp pierdut pe ecran.** Capcana principală: un copil singur, cu privirea
   goală în ecran. Prietenii trebuie să fie vizibili și animați, copilul aplecat spre ei.
5. **Să nu conțină text.** Modelele stâlcesc diacriticele românești.

## Constrângeri tehnice

- **Pătrată (1:1)**, minimum 1200×1200 (o reducem la 896). Alt raport se poate, dar cere o
  ajustare în `home-intro.tsx` — cere-o.
- **Fundal alb sau aproape alb** — imaginea stă pe fundalul lavandă al paginii, într-un
  dreptunghi cu colțuri rotunjite.
- **Colțul din stânga-jos să rămână simplu** — acolo cade bula „Sofia, 8 ani — Când ne mai vedem?".
- Paleta mărcii: roz/magenta, bleu, indigo, galben. Vezi [decisions.md](decisions.md) D6.

## Prompt A — «Prietenii sunt în ecran» (recomandat)

> Children's book style digital illustration, soft watercolor and gouache textures with clean,
> light linework. A cheerful 8-year-old girl sits at a wooden table at home, shown from a
> three-quarter front angle so her laughing face is fully visible. She leans forward toward an
> open laptop, one hand raised mid-gesture as if telling a story. On the laptop screen, a bright
> video-call grid of five other children the same age — different hair colours and skin tones —
> all laughing, waving and talking at once, plus one warm, smiling young woman in a corner tile.
> Soft daylight from a window on the left. The mood is loud, joyful and social: a group of friends
> mid-conversation, not a lesson. No text or lettering anywhere. Colour palette of pink, magenta,
> sky blue, indigo violet and sunny yellow on a clean white background. Flat, vector-adjacent
> illustration with subtle watercolour washes, no harsh outlines, generous white space around the
> subject. Square composition, subject centred slightly to the right, bottom-left corner kept
> simple and uncluttered.

**Negativ:** `text, letters, words, logos, watermark, photorealism, 3d render, dark background,
sad or bored child, child alone staring blankly at a phone, cluttered background, heavy shadows,
uncanny faces, deformed hands, extra fingers`

**Parametri:** Midjourney `--ar 1:1 --style raw`; în rest, cere „square, 1:1".

## Prompt B — «Grila clubului»

Mai direct despre format, fără copil în prim-plan.

> Children's book style digital illustration of a video call grid seen straight on: six tiles with
> six different children aged 7 to 10, diverse hair colours and skin tones, each in a cosy corner
> of their own home, all mid-laugh — one waving, one covering her mouth laughing, one talking with
> both hands, one holding up a drawing. A seventh tile shows a warm, smiling young woman listening.
> Rounded tiles with soft shadows, floating on a clean white background. No text or lettering.
> Palette of pink, magenta, sky blue, indigo violet and sunny yellow. Flat illustration with subtle
> watercolour texture, cheerful and warm. Square composition, generous white space.

## Prompt C — «Povestitorul»

Fără ecran deloc — ocolește complet capcana „timp pe ecran", dar pierde semnalul „online".

> Children's book style digital illustration of a lively 9-year-old boy telling a story, mouth open
> mid-sentence, both hands up in an excited gesture, eyes bright. Around him float small hand-drawn
> doodles of what he is describing — a dragon, a football, a grandmother's house, a rainbow — like
> thoughts escaping into the air. Clean white background, no text or lettering. Palette of pink,
> magenta, sky blue, indigo violet and sunny yellow. Soft watercolour washes over light linework,
> warm and joyful. Square composition, generous white space, bottom-left corner uncluttered.

## Cum alegi dintre variante

- Copiii de pe ecran râd **și se uită unii la alții**, nu la cameră? (grup, nu clasă)
- Copilul din prim-plan e **activ** — gesticulează, vorbește — nu pasiv?
- Fundalul e destul de deschis ca să stea bine pe pagina lavandă?
- Mâinile și fețele sunt curate? (locul unde modelele cedează cel mai des)
- Zero text, zero litere aleatorii pe ecranul laptopului?

## Cum o pui în site

Salveaz-o în `assets/images/` (sursa, mare) și spune-mi — o comprim și o leg în hero. Sau direct:

```
node -e "require('sharp')('assets/images/NUME.jpg').resize({width:896}).jpeg({quality:82,progressive:true}).toFile('public/assets/images/NUME-896.jpg')"
```
apoi schimbi `src` în `app/components/home-intro.tsx`.
