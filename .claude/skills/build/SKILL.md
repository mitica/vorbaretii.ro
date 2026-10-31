---
name: build
description: Implementează un spec aprobat (cale sau număr) sau un task scurt ad-hoc pentru vorbaretii.ro printr-un subagent builder, apoi review cu reviewer, reparații, verificarea criteriilor de acceptanță și a lanțului verify, actualizarea STATUS/spec/docs — și, pe cuvântul operatorului, commit + PR. Rulat cu /build.
argument-hint: <cale spec | număr spec | descriere scurtă de task>
disable-model-invocation: true
---

# /build: implementează, revizuiește, verifică

Intrarea: `$ARGUMENTS`: o cale de spec (`specs/0001-legile-audio.md`), un număr (`1`, `0001`, sau cu
sufix `1a`/`0001a`), sau o descriere scurtă de task. Goală → întreabă.

**Numărul → fișier:** completează la 4 cifre și păstrează sufixul (`1a` → `specs/0001a-*.md`). Un număr
gol care se potrivește cu mai multe părți (`3` → `0003a`, `0003b`): construiește **prima care nu e
`Status: done`**, în ordinea literelor, și spune care și de ce.

Ești orchestratorul: delegi tot. Nu editezi fișiere.

## Pașii
1. **Încarcă contextul.** `AGENTS.md`, `docs/STATUS.md` și specul, dacă există.
2. **Poarta.**
   - Spec: trebuie să fie `Status: approved` (sau `in-progress` la reluare). `draft` → rezumă-l și cere
     aprobarea operatorului întâi.
   - Task scurt: fără spec. Dacă se dovedește mare, riscant, atinge o lege (constituție, ADR, regulă de UI)
     sau cere o alegere pe care niciun spec aprobat n-a făcut-o, propune `/spec` întâi.
3. **Confirmări.** Dacă lucrul face **apeluri plătite** (ElevenLabs, xAI) sau **publică** ceva (ce ajunge
   la copii), cere confirmarea explicită a operatorului pentru acțiunea ANUME: tipărește costul întâi
   (`yarn generate-game-audio <joc> --sweep-only`, dry-run) și propune un plafon. `scribe` consemnează
   fiecare confirmare ca rând datat în **Jurnalul confirmărilor** din `docs/decisions/README.md`
   **înainte** de build. Fără consemnare, fără acțiune.
4. **Construiește.** Lansează `builder` cu un brief de sine stătător: specul sau task-ul (textul, nu doar
   calea — subagentul nu vede conversația), limitele de scop, confirmările citate (dacă există), branch-ul
   (`feat/<slug>` din `main`, creat de builder), instrucțiunea să pună specul `in-progress`, să bifeze
   task-urile terminate și să ruleze verificările de acceptanță. Fără commit.
5. **Bucla de review.** Lansează `reviewer` cu specul/task-ul și raportul builder-ului (inclusiv fiecare
   acțiune externă). `CHANGES NEEDED` → trimite constatările la `builder`, apoi re-review. Total: **review
   inițial + cel mult 2 runde de reparație/re-review**. Tot neaprobat → oprește-te și raportează
   constatările deschise operatorului.
6. **Verifică.** Fiecare criteriu de acceptanță bifat cu dovadă. Lanțul complet, în sesiune, cu ieșirea
   citită: `yarn lint && yarn typecheck && yarn format:check && yarn test && yarn build`; `yarn check-ui`
   dacă s-a atins layout-ul sau UI-ul. Roșu = înapoi la pasul 4, nu se urcă niciodată roșu. Notează
   criteriile pe care doar operatorul le poate judeca (se vede bine pe telefon? sună bine?).
7. **Actualizează docs** (prin `builder`, sau `scribe` dacă e trivial): specul `Status: done` doar dacă
   toate criteriile trec, altfel rămâne `in-progress` cu ce a picat; `docs/STATUS.md` (făcut, următorul,
   blocaje, rând datat); ADR nou în `docs/decisions/` dacă s-a luat o decizie (`Decision / Because / Not`,
   rând în index). Schimbare vizuală → captură trimisă operatorului (SendUserFile) înainte de orice commit.
8. **Raportează operatorului**, scurt: ce s-a schimbat, cum s-a verificat, verdictul reviewer-ului, ce a
   rămas deschis. **Întreabă înainte de commit** — regula lui (2026-09-02).
9. **Commit + PR, pe cuvântul lui.** Delegă la `builder` cu instrucțiune explicită: `git status --short`
   întâi (fișierele locale negit-uite NU apar, și nici n-au ce căuta în stage), fișierele de comis, mesaj
   scurt imperativ în română, fără atribuire, fără linkuri de sesiune; push pe branch; `gh pr create` cu
   un corp care spune ce și cum s-a verificat. Merge-ul: pe cuvântul operatorului; ce ajunge la copii
   (conținut, voce, episoade) e DOAR merge-ul lui (ADR-004). Push pe `main` = deploy în producție.
