import { withIds } from "./ids";

/**
 * Regula întrebărilor (decizia istorică D14; regulile vii: docs/games.md): fiecare are **o scânteie** — un
 * twist imaginativ sau un detaliu concret care invită la poveste, nu la „un
 * răspuns corect". Nu scriem: întrebări care presupun contextul (o cameră
 * plină de oameni, bunici de față), întrebări de consiliere („ce faci când un
 * prieten e supărat?") sau clasicele de adult („ce te faci când vei fi mare?").
 * Și scurte: o singură întrebare, fără coadă („De ce?", „Cum ar fi?") — coada
 * e de prisos, copilul oricum povestește. Verificat în yarn test.
 * Și potrivite ORICĂRUI copil, nu doar celor din diaspora — nimic care
 * presupune unde locuiește sau ce limbă vorbesc colegii lui.
 */
export const wheelDecks = [
  {
    id: "despre-mine",
    label: "Despre mine",
    prompts: [
      "Povestește cea mai amuzantă întâmplare din săptămâna asta.",
      "Care e mâncarea pe care ai mânca-o și la micul dejun, și la prânz, și la cină?",
      "Descrie-ți cel mai bun prieten în trei cuvinte.",
      "Ce miros îți place atât de mult, încât l-ai păstra într-o sticluță?",
      "Ce joc îți place cel mai mult să joci cu prietenii?",
      "Care a fost cea mai frumoasă zi din vacanță?",
      "Ce te-a făcut să râzi ultima oară?",
      "Dacă ai preda o lecție despre ce te pricepi tu cel mai bine, despre ce ar fi?",
      "Ce meserie crezi că ar fi cea mai amuzantă din lume?",
      "Ce ai pune într-o cutie cu comori pe care o deschizi abia peste zece ani?",
      "Povestește un vis pe care ți-l amintești.",
      "Ce obiect din camera ta are o poveste?",
    ],
  },
  {
    id: "imaginatie",
    label: "Imaginație",
    prompts: [
      "Ce ai face dacă ai fi invizibil o zi întreagă?",
      "Dacă ai putea vorbi cu un animal, care ar fi și ce l-ai întreba?",
      "Ce superputere ți-ai dori și cum ai folosi-o?",
      "Unde ai vrea să călătorești și pe cine iei cu tine?",
      "Dacă ai avea o zi complet liberă, cum ar arăta?",
      "Inventează un aparat care nu există și spune la ce folosește.",
      "Dacă ai fi primar în orașul tău, ce-ai schimba mai întâi?",
      "Ce sport nou ai inventa și cum s-ar juca?",
      "Dacă mâncarea ta preferată ar vorbi, ce ți-ar spune?",
      "Ce ai lua cu tine pe o insulă pustie — trei lucruri.",
      "Începe o poveste cu „într-o dimineață, ușa s-a deschis singură”.",
      "Dacă ai fi mare o zi, ce-ai face cu ziua aia?",
    ],
  },
  {
    id: "prieteni",
    label: "Prieteni",
    prompts: [
      "Inventează un salut secret pentru tine și cel mai bun prieten.",
      "Cum ai putea face un prieten să râdă în mai puțin de un minut?",
      "Povestește cum ai cunoscut-o pe cea mai bună prietenă sau pe cel mai bun prieten.",
      "Ce aventură ai vrea să trăiești împreună cu prietenii tăi?",
      "Dacă ai deschide un club secret cu prietenii tăi, ce nume i-ai pune?",
      "Care a fost cea mai bună zi petrecută cu prietenii tăi?",
      "Cu cine din familie semeni cel mai mult și la ce?",
      "Ce reguli ai pune într-o casă în care locuiesc numai copii?",
      "Cum împarți ultima bucată de tort cu doi prieteni?",
      "Care e cel mai amuzant cuvânt pe care îl știi?",
      "Ce joc ați inventat tu și prietenii tăi, pe care nu-l știe nimeni altcineva?",
      "Dacă prietenii tăi ar fi o echipă de supereroi, ce putere ar avea fiecare?",
    ],
  },
  {
    id: "asa-sau-asa",
    label: "Așa sau așa?",
    prompts: [
      "Să poți zbura sau să te poți face invizibil?",
      "Vară tot anul sau iarnă tot anul?",
      "Să vorbești cu animalele sau să știi toate limbile din lume?",
      "Pizza la micul dejun sau clătite la cină?",
      "Să fii uriaș cât un bloc sau mic cât un deget?",
      "Să călătorești în trecut sau în viitor?",
      "Un dragon de companie sau un robot care îți face temele?",
      "Să locuiești într-un castel sau pe o corabie de pirați?",
      "Să cânți tot ce vrei să spui sau să dansezi oriunde mergi?",
      "Doar dulciuri sau doar mâncare sărată, un an întreg?",
      "Să ai mereu dreptate sau să câștigi mereu la jocuri?",
      "Munte sau mare?",
    ],
  },
  {
    id: "gusturi",
    label: "Gusturi",
    prompts: [
      "Ce gust îți place ție, deși prietenilor tăi nu prea le place?",
      "Ce sunet ai pune ca sonerie la ușa camerei tale?",
      "Ce culoare crezi că are numele tău?",
      "Ce miros te face să-ți fie foame imediat?",
      "Ce mâncare arată frumos, dar ție nu-ți place deloc?",
      "Ce lucru îți place să atingi doar pentru cum se simte?",
      "Ce cântec ai pune să răsune când intri tu pe ușă?",
      "Ce zgomot ai șterge din lume, dacă ai avea o radieră magică?",
      "Ce ai pune pe masă dacă ai găti tu prânzul pentru toți?",
      "Ce vreme îți place să asculți de la fereastră?",
      "Ce desert ți-ar plăcea să crească în copaci?",
      "Ce haină a ta îți place atât de mult, încât ai purta-o zilnic?",
    ],
  },
  {
    id: "cel-mai",
    label: "Cel mai…",
    prompts: [
      "Care e cel mai ciudat lucru pe care l-ai găsit pe jos?",
      "Care e cel mai amuzant lucru făcut de un animal de față cu tine?",
      "Care e cel mai bun cadou pe care l-ai făcut tu cuiva?",
      "Care e cea mai mare surpriză pe care ai avut-o anul acesta?",
      "Care e cel mai ciudat lucru pe care l-ai gustat vreodată?",
      "Care e cel mai înalt loc din care ai privit în jos?",
      "Care e cea mai lungă zi pe care ți-o amintești?",
      "Care e cel mai greu lucru pe care ai reușit să-l ridici?",
      "Care e cel mai bun ascunziș pe care l-ai găsit vreodată?",
      "Care e cea mai bună glumă pe care ai spus-o tu?",
      "Care e cel mai curajos lucru pe care l-ai făcut până acum?",
      "Care e cel mai frumos lucru văzut de tine pe geamul unei mașini?",
    ],
  },
  {
    id: "as-schimba",
    label: "Aș schimba",
    prompts: [
      "Ce ai schimba la camera ta, dacă ai avea o baghetă magică?",
      "Ce zi a săptămânii ai șterge din calendar?",
      "Ce regulă din casă ai schimba și cu ce ai înlocui-o?",
      "Ce ai lăsa exact cum e, chiar dacă ai putea schimba orice?",
      "Ce ai schimba la o zi de școală, dacă ai fi tu directorul?",
      "Ce ai schimba la vremea de afară, dacă ai avea un buton?",
      "Ce ai adăuga într-un parc, ca să vină toți copiii acolo?",
      "Ce nume nou ai da zilei de luni?",
      "Ce ai schimba la un ghiozdan, ca să nu mai fie greu?",
      "Ce obiect din bucătărie ai reinventa, ca să fie mai amuzant?",
      "Ce ai schimba la un autobuz, ca să-ți placă să mergi cu el?",
      "Ce ai păstra pentru totdeauna, exact așa cum e acum?",
    ],
  },
  {
    id: "doua-adevaruri",
    label: "Două adevăruri și-o minciună",
    prompts: [
      "Spune două adevăruri și-o minciună despre ultima ta vacanță.",
      "Două adevăruri și-o minciună despre ce ai mâncat azi.",
      "Spune două adevăruri și-o minciună despre animalul tău preferat.",
      "Două adevăruri și-o minciună despre un lucru pe care știi să-l faci.",
      "Spune două adevăruri și-o minciună despre camera ta.",
      "Două adevăruri și-o minciună despre cea mai ciudată zi a ta.",
      "Spune două adevăruri și-o minciună despre ce te sperie puțin.",
      "Două adevăruri și-o minciună despre prietenii tăi.",
      "Spune două adevăruri și-o minciună despre o zi de școală.",
      "Două adevăruri și-o minciună despre un vis pe care l-ai avut.",
      "Spune două adevăruri și-o minciună despre cel mai bun cadou primit.",
      "Două adevăruri și-o minciună despre un loc în care ai fost.",
    ],
  },
];

/** Întrebările fiecărui set, cu id-uri automate — forma pe care o joacă roata. */
export const wheelItems = wheelDecks.map((deck) =>
  withIds(
    deck.prompts.map((text) => ({ text })),
    (prompt) => prompt.text
  )
);
