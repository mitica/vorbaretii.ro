# Claude Code — instrucțiuni pentru vorbaretii.ro

Site-ul public al **Vorbăreții** — club de socializare în română pentru copiii din diaspora.

**Citește întâi [docs/README.md](docs/README.md).** Acolo e harta: scopul lui v0, mesajul,
arhitectura, jocurile, deciziile luate și întrebările încă deschise.

## Ce trebuie să știi înainte de prima modificare

1. **Strategia nu locuiește aici.** Sursa de adevăr pentru business e repo-ul `fus`:
   `../fus/docs/ideas/research/0018-vorbaretii-brief-socializare.md`. Site-ul e vitrina ei.
   Dacă cele două se contrazic, brieful câștigă — sau se actualizează explicit.
2. **Export static, fără server.** `output: "export"` → GitHub Pages. Fără API routes, fără
   Server Actions, fără optimizare de imagini. Orice interacțiune se întâmplă în browser.
   Detalii și capcane: [docs/architecture.md](docs/architecture.md).
3. **Mesajul e blocat, nu improvizat.** Titlurile, categoria și **formulările interzise**
   (niciun registru de deficit sau vină față de părinte) sunt în
   [docs/positioning.md](docs/positioning.md). Nu rescrie textele de pe pagină fără să le citești.
4. **Fiecare fapt apare o singură dată pe pagina principală.** Fără secțiuni care repetă în
   alte cuvinte ce s-a spus deja.
5. **Paleta e a mărcii, nu a ta.** Roz (`pink-600`) pentru butoane, indigo (`indigo-600`) pentru
   etichete, gri pentru text, fundalul lavandă→alb, `.text-effect` roz→bleu→galben. Tabelul complet
   e în [docs/decisions.md](docs/decisions.md) D6. **Nu schimba culorile ca efect secundar al unei
   modificări de conținut** — e o decizie separată, care se cere explicit.
6. **Jocurile din `/jocuri` nu colectează nimic de la copii** — fără conturi, fără scoruri
   salvate, fără date. Regulile: [docs/games.md](docs/games.md).

## Convenții

- Conținut în română; nume de fișiere, foldere și identificatori în engleză.
- Deciziile de proiect se scriu în [docs/decisions.md](docs/decisions.md) — imutabile, se supersedă.
- Ce nu e decis se scrie în [docs/open-questions.md](docs/open-questions.md) și **se întreabă**,
  nu se presupune.

## Verificare

```
yarn build     # trebuie să treacă; toate rutele se exportă static
yarn lint
```
