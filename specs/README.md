# Specs

Un spec per unitate de lucru. Create de `/spec`, implementate de `/build`. Specurile sunt locale,
negit-uite (`.gitignore`: `specs/*`) — sunt procesul de gândire al produsului și nu se publică;
README-ul și șablonul sunt publice.

- **Numele:** `NNNN-slug-scurt.md`, cu zerouri în față, secvențial (`0001-legile-audio.md`). Se ia
  următorul număr liber — un ÎNTREG (`0002`, nu `0001a`).
- **Specuri despărțite:** un spec prea mare pentru un singur build se poate rupe în părți cu sufix de
  literă, pe același număr (`0001a-…`, `0001b-…`). Fiecare parte e un spec întreg, cu `Status` propriu,
  aprobat și construit separat; fișierul nedespărțit se șterge.
- **Șablonul:** copiază [`_template.md`](_template.md).
- **Ciclul de viață** (rândul `Status` din antet):
  - `draft` — scris, așteaptă verdictul operatorului
  - `approved` — operatorul a zis „da”; gata pentru `/build`
  - `in-progress` — se construiește
  - `done` — criteriile de acceptanță verificate; task-urile bifate
- Doar operatorul mută un spec din `draft` în `approved`. Schimbările notabile de plan se scriu în spec
  și, dacă sunt decizii de arhitectură sau de produs, într-un ADR nou (`docs/decisions/`).
- Nu orice lucru are nevoie de spec: o reparație trivială sau o schimbare mică în arhitectura existentă
  merge direct la `/build` ca task scurt. Specul e pentru comportament nou sau alegeri care se vor
  plăti mai târziu.
