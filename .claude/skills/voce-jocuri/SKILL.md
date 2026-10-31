---
name: voce-jocuri
description: Manivela vocii jocurilor — „fă voce la jocul X” / „voce la toate jocurile” → un PR cu audio-ul rostirilor jocului (un mp3 per rostire, vocea Gaiței), doar diferențele; orfanii măturați, legea verde. Skill de producție — îl apelează OPERATORUL; costul se tipărește și se confirmă înainte de orice apel plătit; un apel = un PR; merge-ul operatorului = publicarea.
argument-hint: <slug|toate> [--all]
disable-model-invocation: true
---

# /voce-jocuri <slug|toate> [--all] — manivela vocii jocurilor

Un apel pe un joc cu voce → un PR cu fișierele audio ale rostirilor lui
(`public/assets/audio/jocuri/<slug>/<cheia-vocii>/<hash(text)>.mp3` — legea vocii jocurilor,
ADR-050), generate DOAR pentru ce lipsește, orfanii și cheile vechi măturate, legea verde. Merge-ul
operatorului = publicarea (ADR-004). Skill de producție — îl apelează OPERATORUL; sesiunea nu-l
pornește din proprie inițiativă.

Ești orchestratorul: citești și întrebi; `builder` rulează comenzile și deschide PR-ul; `scribe`
consemnează confirmarea. Fără checkpoint de text: rostirile sunt conținutul jocurilor deja publicat;
verdictul = urechea operatorului la PR (sau pe site, după merge — Gaița cu 🔊 în antetul jocului).
Preferința operatorului (2026-09-11): alunecările rare și mici sunt OK — voce copilărească, sună
natural; se raportează doar ce schimbă ÎNȚELESUL sau se repetă pe multe rostiri.

## Contractele (citite la fiecare rulare)

- `app/jocuri/voice/settings.ts` — `VOICED_GAMES` (jocurile cu voce, tagul per joc), `SPEED`,
  formatul sursei și cel servit, `voiceKey`, `VOICE_DIR`, `FILE_BUDGET`.
- `app/jocuri/voice/utterances.ts` — ce se rostește per joc.
- `scripts/generate-game-audio.ts` — mecanica (`<slug|toate> [--all] [--sweep-only]`).
- `scripts/test-game-audio.ts` — legea: setul exact per joc, Curiozități submulțime, ≤120 KB per
  fișier, nivel și capete curate (ADR-050), orfanul roșu.
- `docs/personaj.md` §Vocea audio — regula de aur ține și aici: tagul, dacă există, e al JOCULUI
  (setare), nu conținut nou.

## Procedura

0. **E joc cu voce?** `<slug>` trebuie să fie cheie în `VOICED_GAMES`; altfel STOP onest: „jocul n-are
   voce în design — se adaugă prin spec, nu la apel”. `toate` = toate cheile din `VOICED_GAMES` — atenție
   la risipă: operatorul a prins o dată (2026-09-11) că „toate” ar fi dat voce unor jocuri pe care nimeni
   nu decisese să le vocalizeze; numește jocurile pe care le acoperă și cere confirmarea listei.
   Branch `voce/<slug>` (sau `voce/toate`) din `main`; branch vechi cu PR merged → șters și recreat; PR
   DESCHIS pe el → STOP, raportează.
1. **Costul, întâi.** `builder`: `yarn generate-game-audio <slug|toate> --sweep-only` — fără apeluri API:
   tipărește rostirile și caracterele de generat și mătură orfanii/cheile vechi. Raportează operatorului
   numărul de rostiri și de caractere și cere confirmarea explicită (AskUserQuestion: da / nu / doar
   unele jocuri). Chei lipsă din `.env` (`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`) → scriptul se
   oprește singur; relaiază-i cererea operatorului — nimeni nu citește `.env`.
2. **Consemnarea.** Pe „da”, `scribe` scrie rândul în Jurnalul confirmărilor din
   `docs/decisions/README.md`: data, `voce <slug|toate>`, rostiri și caractere, cuvintele operatorului.
   Fără rând, fără generare.
3. **Generarea.** `builder`: `yarn generate-game-audio <slug|toate>` (cu `--all` DOAR când operatorul a
   schimbat vocea din `.env` — vocea nu intră în cheie; `--all` șterge directorul jocului și regenerează
   tot). Hash existent = refolosit, zero apeluri.
4. **Verify — pasul skill-ului**: lanțul complet (`yarn lint && yarn typecheck && yarn format:check &&
   yarn test && yarn build`) — TOT verde înainte de push; legea roșie = repari aici (de regulă: re-rulezi
   generatorul). Opțional, operatorului i se trimit 2–3 fișiere (SendUserFile) ca să le audă înainte de PR.
5. **PR-ul.** `builder`: commit TOT ce a mișcat rularea (`git add -A public/assets/audio/jocuri/<slug>`),
   push, `gh pr create` cu: jocul, câte rostiri, câte generate, câte măturate, cheia vocii. FĂRĂ linkuri
   de sesiune, fără atribuire de agent (repo public). Confirmarea costului de la pasul 1 e și
   confirmarea commit-ului pe branch-ul de producție; review-ul = PR-ul.
6. **Raportul.** URL-ul PR-ului, pe rândul lui. `scribe`: rând în `docs/STATUS.md`. **Skill-ul NU
   merge-uiește niciodată**: merge-ul e actul de publicare și e al operatorului — fiecare push în `main`
   pleacă în producție și rostirile se aud.

## Când textele jocului se schimbă

Legea devine roșie la următoarea rulare a suitei (rostire fără audio → rulează `/voce-jocuri <slug>`) —
intenționat: operatorul știe exact ce se regenerează. Curiozități face excepție (întrebările vin și
pleacă cu articolele): lipsa e tolerată, butonul se ascunde pe întrebările fără fișier; orfanii se
mătură cu `--sweep-only`.
