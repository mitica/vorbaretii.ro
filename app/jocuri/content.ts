/**
 * Conținutul jocurilor. Un singur loc de editat când adăugăm întrebări noi —
 * jocurile nu au text propriu.
 *
 * Fiecare element primește automat un `id` derivat din text (vezi `withIds`).
 * Id-ul e cel după care ținem minte, în browserul copilului, ce s-a jucat deja,
 * ca să nu se repete. Dacă rescrii un text, id-ul lui se schimbă și elementul
 * redevine „nevăzut" — asta e în regulă, e text nou.
 */

/** djb2, în base36. Scurt, stabil și suficient pentru câteva sute de texte. */
export function hashId(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

function withIds<T extends object>(
  items: readonly T[],
  key: (item: T) => string
): (T & { id: string })[] {
  return items.map((item) => ({ ...item, id: hashId(key(item)) }));
}

/* ------------------------------------------------------------------ roata */

/**
 * Regula întrebărilor (decisions.md D14): fiecare are **o scânteie** — un
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
      "Ce obiect din camera ta are o poveste?"
    ]
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
      "Dacă ai fi mare o zi, ce-ai face cu ziua aia?"
    ]
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
      "Dacă prietenii tăi ar fi o echipă de supereroi, ce putere ar avea fiecare?"
    ]
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
      "Munte sau mare?"
    ]
  }
];

/** Întrebările fiecărui set, cu id-uri automate — forma pe care o joacă roata. */
export const wheelItems = wheelDecks.map((deck) =>
  withIds(
    deck.prompts.map((text) => ({ text })),
    (prompt) => prompt.text
  )
);

/* ------------------------------------------------------------- ghicitori */

export const riddles = withIds(
  [
    {
      question:
        "Am un butoiaș cu două feluri de vin, care niciodată nu se amestecă.",
      answer: "Oul"
    },
    { question: "Ce trece peste apă și nu se udă?", answer: "Umbra" },
    { question: "Are dinți, dar nu mușcă pe nimeni.", answer: "Pieptenele" },
    { question: "Are ochi, dar nu vede nimic.", answer: "Cartoful" },
    {
      question: "Urcă și coboară toată ziua, dar nu se mișcă din loc.",
      answer: "Scara"
    },
    { question: "Vara se îmbracă, iarna se dezbracă.", answer: "Copacul" },
    { question: "Are gât, dar n-are cap.", answer: "Sticla" },
    { question: "E plin de găuri și totuși ține apa.", answer: "Buretele" },
    { question: "Are frunze, dar nu e copac.", answer: "Cartea" },
    {
      question: "Bate toată ziua și toată noaptea, dar nu supără pe nimeni.",
      answer: "Inima"
    },
    {
      question: "Cu cât iei mai mult din ea, cu atât e mai mare.",
      answer: "Groapa"
    },
    { question: "Merge fără picioare, plânge fără ochi.", answer: "Norul" },
    {
      question: "Cu cât șterge mai mult, cu atât e mai ud.",
      answer: "Prosopul"
    },
    { question: "Are patru picioare și nu merge nicăieri.", answer: "Masa" },
    { question: "Are ace, dar nu coase niciodată.", answer: "Bradul" },
    { question: "Are două limbi și nu spune niciun cuvânt.", answer: "Ceasul" },
    {
      question: "Umblă toată ziua prin oraș, iar seara stă sub pat.",
      answer: "Pantofii"
    },
    { question: "Curge mereu și nu se oprește niciodată.", answer: "Râul" },
    {
      question: "E al tău, dar îl folosesc alții mai des decât tine.",
      answer: "Numele"
    },
    { question: "Cade mereu și nu se lovește niciodată.", answer: "Ploaia" },
    {
      question: "Cu cât e mai mult, cu atât vezi mai puțin.",
      answer: "Întunericul"
    },
    {
      question: "Alb ca zăpada, dulce ca mierea; în ceai dispare.",
      answer: "Zahărul"
    },
    { question: "Îl tai și nu plânge el, ci tu.", answer: "Ceapa" },
    { question: "Are clape, dar nu descuie nicio ușă.", answer: "Pianul" },
    {
      question: "Are orașe, dar nicio casă; are păduri, dar niciun copac.",
      answer: "Harta"
    },
    { question: "Cu cât arde mai mult, cu atât e mai mică.", answer: "Lumânarea" },
    {
      question: "Repetă tot ce spui, dar n-a învățat nicio limbă.",
      answer: "Ecoul"
    },
    { question: "Îl auzi și îl simți, dar nu-l vezi niciodată.", answer: "Vântul" },
    {
      question: "Vara stă la umbră, iarna te ține de cald pe umeri.",
      answer: "Fularul"
    },
    {
      question: "Are coadă, dar nu e animal; zboară, dar n-are aripi.",
      answer: "Zmeul"
    }
  ],
  (item) => item.question
);

/* --------------------------------------------------------------- proverbe */

export const proverbs = withIds(
  [
    {
      proverb: "Cine se scoală de dimineață, departe ajunge.",
      meaning: "Cine începe devreme, izbutește."
    },
    {
      proverb: "Buturuga mică răstoarnă carul mare.",
      meaning: "Un lucru mic poate avea urmări mari."
    },
    {
      proverb: "Apa trece, pietrele rămân.",
      meaning: "Ce e trecător dispare, ce e important rămâne."
    },
    {
      proverb: "Prietenul la nevoie se cunoaște.",
      meaning: "Prietenul adevărat se vede la greu."
    },
    {
      proverb: "Vorba dulce mult aduce.",
      meaning: "Cu blândețe obții mai mult."
    },
    { proverb: "Graba strică treaba.", meaning: "Când te grăbești, greșești." },
    {
      proverb: "Unde-s doi, puterea crește.",
      meaning: "Împreună reușim mai ușor."
    },
    { proverb: "Ai carte, ai parte.", meaning: "Cine învață ajunge departe." },
    {
      proverb: "Meseria e brățară de aur.",
      meaning: "Cine știe o meserie nu duce lipsă."
    },
    {
      proverb: "Nu lăsa pe mâine ce poți face azi.",
      meaning: "Nu amâna ce poți termina acum."
    },
    {
      proverb: "Bine faci, bine găsești.",
      meaning: "Fapta bună se întoarce la tine."
    },
    {
      proverb: "Ochii care nu se văd se uită.",
      meaning: "Departe unul de altul, oamenii se înstrăinează."
    },
    {
      proverb: "Lupul își schimbă părul, dar năravul ba.",
      meaning: "Obiceiurile vechi se schimbă greu."
    },
    {
      proverb: "Cine sapă groapa altuia cade singur în ea.",
      meaning: "Răul făcut altuia se întoarce la tine."
    },
    {
      proverb: "Ziua bună se cunoaște de dimineață.",
      meaning: "Un început bun se vede din primele semne."
    },
    {
      proverb: "Câinele care latră nu mușcă.",
      meaning: "Cine amenință tare rar face ceva."
    },
    {
      proverb: "Picătură cu picătură se face lac.",
      meaning: "Puțin câte puțin se adună mult."
    },
    {
      proverb: "Ce ție nu-ți place, altuia nu-i face.",
      meaning: "Poartă-te cum ai vrea să se poarte cu tine."
    },
    {
      proverb: "Omul cât trăiește învață.",
      meaning: "Înveți lucruri noi la orice vârstă."
    },
    {
      proverb: "Nu tot ce zboară se mănâncă.",
      meaning: "Nu tot ce pare bun chiar este."
    },
    {
      proverb: "Bate fierul cât e cald.",
      meaning: "Folosește momentul potrivit, nu-l amâna."
    },
    {
      proverb: "Minciuna are picioare scurte.",
      meaning: "Minciuna se descoperă repede."
    },
    {
      proverb: "Pomul se cunoaște după roade.",
      meaning: "Pe om îl arată faptele, nu vorbele."
    },
    {
      proverb: "După faptă și răsplată.",
      meaning: "Primești pe măsura a ceea ce faci."
    }
  ],
  (item) => item.proverb
);

/* --------------------------------------------------------------- anagrame */

export const anagrams = withIds(
  [
    { word: "PRIETEN", hint: "Cel cu care împarți și bucuria, și necazul." },
    { word: "BUNICA", hint: "Te sună duminica și te întreabă dacă ai mâncat." },
    { word: "POVESTE", hint: "Începe cu „a fost odată”." },
    { word: "VACANȚĂ", hint: "Timpul acela lung, fără școală." },
    { word: "ZÂMBET", hint: "Se lățește pe față când ești bucuros." },
    { word: "FURTUNĂ", hint: "Vine cu tunete, fulgere și vânt." },
    { word: "CURCUBEU", hint: "Apare după ploaie, cu șapte culori." },
    { word: "FEREASTRĂ", hint: "Prin ea intră lumina în casă." },
    { word: "ÎNGHEȚATĂ", hint: "Rece, dulce și se topește repede." },
    { word: "PRIMĂVARĂ", hint: "Anotimpul în care înfloresc pomii." },
    { word: "PĂDURE", hint: "Loc plin de copaci, unde e răcoare vara." },
    { word: "FLUTURE", hint: "Are aripi colorate și stă pe flori." },
    { word: "ALBINĂ", hint: "Zboară din floare în floare și face miere." },
    { word: "MUNTE", hint: "Îl urci și vezi departe de tot." },
    { word: "CORABIE", hint: "Plutește pe mare, cu pânze mari și albe." },
    { word: "SCRISOARE", hint: "O pui în plic și o trimiți prin poștă." },
    { word: "DUMINICĂ", hint: "Ultima zi a săptămânii." },
    { word: "TOAMNĂ", hint: "Anotimpul frunzelor galbene." },
    { word: "ZĂPADĂ", hint: "Albă și rece, cade iarna din cer." },
    { word: "CÂNTEC", hint: "Îl asculți sau îl fredonezi singur." },
    { word: "CASTEL", hint: "Casă mare, cu turnuri, din povești." },
    { word: "ȘCOALĂ", hint: "Acolo mergi în fiecare dimineață." },
    { word: "VECIN", hint: "Locuiește în casa de alături." },
    { word: "BUCĂTAR", hint: "Gătește pentru toată lumea." },
    { word: "CULOARE", hint: "Roșu, albastru și verde sunt fiecare câte una." },
    { word: "FLOARE", hint: "Crește în grădină și miroase frumos." }
  ],
  (item) => item.word
);

/* ---------------------------------------------------------------- memorie */

/** 8 perechi pe joc; restul intră la jocurile următoare, ca să nu se repete. */
export const memoryPairs = withIds(
  [
    { emoji: "🐻", word: "URS" },
    { emoji: "🦊", word: "VULPE" },
    { emoji: "🌳", word: "COPAC" },
    { emoji: "🏠", word: "CASĂ" },
    { emoji: "☀️", word: "SOARE" },
    { emoji: "🌧️", word: "PLOAIE" },
    { emoji: "📚", word: "CARTE" },
    { emoji: "🎈", word: "BALON" },
    { emoji: "🐝", word: "ALBINĂ" },
    { emoji: "🦋", word: "FLUTURE" },
    { emoji: "🍎", word: "MĂR" },
    { emoji: "🐟", word: "PEȘTE" },
    { emoji: "🌙", word: "LUNĂ" },
    { emoji: "⭐", word: "STEA" },
    { emoji: "🎂", word: "TORT" },
    { emoji: "🐈", word: "PISICĂ" },
    { emoji: "🐕", word: "CÂINE" },
    { emoji: "🌸", word: "FLOARE" },
    { emoji: "🚗", word: "MAȘINĂ" },
    { emoji: "🥕", word: "MORCOV" },
    { emoji: "🐴", word: "CAL" },
    { emoji: "🦉", word: "BUFNIȚĂ" },
    { emoji: "🍇", word: "STRUGURI" },
    { emoji: "⛰️", word: "MUNTE" }
  ],
  (item) => item.word
);

/* ----------------------------------------------------------------- zaruri */

/** Trei zaruri pe aruncare; povestea trebuie să le cuprindă pe toate.
 *  Cuvântul sub 10 litere, un singur cuvânt — încape pe zar. */
export const storyDice = withIds(
  [
    { emoji: "🐉", word: "balaur" },
    { emoji: "🧙", word: "vrăjitor" },
    { emoji: "👸", word: "prințesă" },
    { emoji: "🤖", word: "robot" },
    { emoji: "🐈", word: "pisică" },
    { emoji: "👵", word: "bunica" },
    { emoji: "🧜‍♀️", word: "sirenă" },
    { emoji: "🦸", word: "supererou" },
    { emoji: "🐺", word: "lup" },
    { emoji: "👻", word: "fantomă" },
    { emoji: "🐢", word: "țestoasă" },
    { emoji: "🦜", word: "papagal" },
    { emoji: "🗝️", word: "cheie" },
    { emoji: "🎈", word: "balon" },
    { emoji: "📦", word: "cutie" },
    { emoji: "🧭", word: "busolă" },
    { emoji: "🕯️", word: "lumânare" },
    { emoji: "🗺️", word: "hartă" },
    { emoji: "☂️", word: "umbrelă" },
    { emoji: "🎁", word: "cadou" },
    { emoji: "🪄", word: "baghetă" },
    { emoji: "📱", word: "telefon" },
    { emoji: "🧸", word: "ursuleț" },
    { emoji: "🔦", word: "lanternă" },
    { emoji: "🏰", word: "castel" },
    { emoji: "🌲", word: "pădure" },
    { emoji: "🏝️", word: "insulă" },
    { emoji: "🚀", word: "rachetă" },
    { emoji: "🎪", word: "circ" },
    { emoji: "🏔️", word: "munte" },
    { emoji: "🌋", word: "vulcan" },
    { emoji: "🌉", word: "pod" },
    { emoji: "🌧️", word: "furtună" },
    { emoji: "🌈", word: "curcubeu" },
    { emoji: "⭐", word: "stea" },
    { emoji: "🔔", word: "clopoțel" }
  ],
  (item) => item.word
);

/** Începuturi de poveste; se rotesc cu fiecare aruncare. */
export const storyStarters = [
  "Într-o seară, la bunici…",
  "Departe, pe o insulă…",
  "În prima zi de vacanță…",
  "Sub patul meu, azi-noapte…",
  "În curtea școlii, deodată…",
  "Pe vârful muntelui…",
  "Într-un oraș unde ploua mereu…",
  "Chiar înainte de culcare…"
];

/* -------------------------------------------------------------- categorii */

/** Se afișează cu „Spune” în față, deci toate încep cu „5 ”. */
export const categories = withIds(
  [
    { prompt: "5 animale care trăiesc în apă" },
    { prompt: "5 lucruri care se topesc" },
    { prompt: "5 lucruri roșii" },
    { prompt: "5 cuvinte care încep cu M" },
    { prompt: "5 lucruri din bucătărie" },
    { prompt: "5 animale mai mici decât o pisică" },
    { prompt: "5 lucruri care zboară" },
    { prompt: "5 mâncăruri românești" },
    { prompt: "5 lucruri rotunde" },
    { prompt: "5 meserii" },
    { prompt: "5 lucruri care fac zgomot" },
    { prompt: "5 fructe care nu sunt roșii" },
    { prompt: "5 lucruri dintr-un ghiozdan" },
    { prompt: "5 animale care sar" },
    { prompt: "5 lucruri reci" },
    { prompt: "5 cuvinte care rimează cu «floare»" },
    { prompt: "5 lucruri care luminează" },
    { prompt: "5 jucării" },
    { prompt: "5 lucruri moi" },
    { prompt: "5 orașe sau țări" },
    { prompt: "5 lucruri din baie" },
    { prompt: "5 personaje din povești" },
    { prompt: "5 lucruri dulci" },
    { prompt: "5 sporturi" }
  ],
  (item) => item.prompt
);

/* ------------------------------------------------------------- frământări */

/** De spus de trei ori, repede. Fraza sub ~95 de caractere, ca să stea mare pe ecran. */
export const tongueTwisters = withIds(
  [
    { text: "Capra calcă piatra, piatra crapă-n patru." },
    { text: "Un vultur stă pe pisc c-un pix în plisc." },
    { text: "Șase sași în șase saci." },
    { text: "Știu că știu că știuca-i știucă și mai știu că știuca-i pește." },
    { text: "Un cocostârc s-a dus să se descocostârcărească." },
    { text: "Am o prepeliță pestriță cu paisprezece pui de prepeliță pestriți." },
    { text: "Domnule Dudău, dă-mi două dude din dudul dumitale." },
    { text: "Rică nu știa să zică râu, rățușcă, rămurică." },
    { text: "Stanca stă-n castan ca Stan." },
    { text: "Pe cap un capac, pe capac un ac." },
    { text: "Bucură-te cum s-a bucurat Bucuroaia de Bucurel bucuros." },
    { text: "Când am zis c-am zis c-oi zice, tot zic eu c-am zis c-oi zice." },
    { text: "Papagalul Panait poartă pălărie portocalie." },
    { text: "Fluturele flutură ușor prin flori de fluturaș." }
  ],
  (item) => item.text
);

/* ------------------------------------------------------------------ ascuns */

/** Cuvântul de ghicit literă cu literă. MAJUSCULE, diacritice, sub 11 litere. */
export const hiddenWords = withIds(
  [
    { word: "VEVERIȚĂ", hint: "Roșcată, cu coadă stufoasă, sare prin copaci." },
    { word: "CIOCOLATĂ", hint: "Dulce, maro, se topește în gură." },
    { word: "BICICLETĂ", hint: "Are două roți și pedale." },
    { word: "BIBLIOTECĂ", hint: "Casa cărților." },
    { word: "SUBMARIN", hint: "Navă care merge pe sub apă." },
    { word: "DINOZAUR", hint: "Uriaș dispărut acum milioane de ani." },
    { word: "ELICOPTER", hint: "Zboară cu elice și decolează de pe loc." },
    { word: "PIRAMIDĂ", hint: "Construcție uriașă din Egipt." },
    { word: "VULCAN", hint: "Munte care scuipă foc." },
    { word: "OGLINDĂ", hint: "Te uiți în ea și te vezi." },
    { word: "FRIGIDER", hint: "Ține mâncarea rece." },
    { word: "GHIOZDAN", hint: "Îl porți în spate, plin de cărți." },
    { word: "SEMAFOR", hint: "Roșu, galben, verde." },
    { word: "BALENĂ", hint: "Cel mai mare animal din lume." },
    { word: "PĂIANJEN", hint: "Țese pânză în colțul camerei." },
    { word: "TROTINETĂ", hint: "O împingi cu piciorul și zbori pe trotuar." },
    { word: "AVENTURĂ", hint: "O întâmplare palpitantă." },
    { word: "COMOARĂ", hint: "O ladă plină de galbeni." },
    { word: "LABIRINT", hint: "Te rătăcești ușor în el." },
    { word: "TELESCOP", hint: "Prin el vezi stelele de aproape." },
    { word: "CASTRAVETE", hint: "Verde, lung, bun la salată." },
    { word: "PORTOCALĂ", hint: "Fruct rotund, plin de felii." },
    { word: "ZMEURĂ", hint: "Fruct roșu, mărunt, dulce-acrișor." },
    { word: "FANFARĂ", hint: "Orchestra care cântă în marș, cu trompete." }
  ],
  (item) => item.word
);

/* ------------------------------------------------------------------- rebus */

/** Ghicești povestea, proverbul sau cuvântul compus din emoji. */
export const emojiRebus = withIds(
  [
    { emojis: "🐺 👧 🔴 🧺", answer: "Scufița Roșie", category: "poveste", hint: "Bunica e în pericol." },
    { emojis: "🐐 🐐 🐐 🐺", answer: "Capra cu trei iezi", category: "poveste", hint: "Doar cel mic scapă." },
    { emojis: "🐓 👛 💰", answer: "Punguța cu doi bani", category: "poveste", hint: "„Cucurigu, boieri mari!”" },
    { emojis: "🐻 🎣 ❄️", answer: "Ursul păcălit de vulpe", category: "poveste", hint: "Coada rămâne în baltă." },
    { emojis: "🐷 🐷 🐷 🏠 💨", answer: "Cei trei purceluși", category: "poveste", hint: "Doar casa de cărămidă rezistă." },
    { emojis: "👠 🎃 ✨", answer: "Cenușăreasa", category: "poveste", hint: "Pantofiorul pierdut la miezul nopții." },
    { emojis: "🍎 👧 😴 7️⃣", answer: "Albă-ca-Zăpada", category: "poveste", hint: "Mărul era otrăvit." },
    { emojis: "🤥 👃 🪵", answer: "Pinocchio", category: "poveste", hint: "Nasul crește la fiecare minciună." },
    { emojis: "🐈 👢 🎩", answer: "Motanul încălțat", category: "poveste", hint: "Slujește un fecior sărac." },
    { emojis: "🪵 🛒 💥", answer: "Buturuga mică răstoarnă carul mare", category: "proverb", hint: "Îl știi de la Proverbe pereche." },
    { emojis: "🤥 🦵 📏", answer: "Minciuna are picioare scurte", category: "proverb", hint: "Se descoperă repede." },
    { emojis: "🏃 💥 🔧", answer: "Graba strică treaba", category: "proverb", hint: "Când te grăbești…" },
    { emojis: "💧 💧 🌊", answer: "Picătură cu picătură se face lac", category: "proverb", hint: "Puțin câte puțin." },
    { emojis: "🔨 🔥 ⏰", answer: "Bate fierul cât e cald", category: "proverb", hint: "Folosește momentul potrivit." },
    { emojis: "🌸 ☀️", answer: "floarea-soarelui", category: "cuvant", hint: "Se întoarce mereu după lumină." },
    { emojis: "👓 ☀️", answer: "ochelari de soare", category: "cuvant", hint: "Îi porți vara, pe plajă." },
    { emojis: "👨 ❄️", answer: "om de zăpadă", category: "cuvant", hint: "Are morcov în loc de nas." },
    { emojis: "🦔 🌊", answer: "arici-de-mare", category: "cuvant", hint: "Țepos, dar nu prin pădure." },
    { emojis: "🧜‍♀️ 🌊 🎶", answer: "Mica Sirenă", category: "poveste", hint: "Și-a dat glasul pentru picioare." },
    { emojis: "👧 🐻 🐻 🐻 🥣", answer: "Bucle-Aurii și cei trei urși", category: "poveste", hint: "Ciorba cuiva era numai bună." },
    { emojis: "🦆 😢 🦢", answer: "Rățușca cea urâtă", category: "poveste", hint: "Nu era deloc rățușcă." },
    { emojis: "👦 🌱 ☁️ 🏰", answer: "Jack și vrejul de fasole", category: "poveste", hint: "Vrejul crește până la nori." },
    { emojis: "🧒 👧 🍬 🏠", answer: "Hansel și Gretel", category: "poveste", hint: "Casa era bună de ronțăit." },
    { emojis: "🐺 🐑 🤥 📢", answer: "Băiatul care striga «Lupul!»", category: "poveste", hint: "A strigat degeaba de prea multe ori." },
    { emojis: "🐢 🐇 🏁", answer: "Iepurele și țestoasa", category: "poveste", hint: "Cel încet câștigă cursa." },
    { emojis: "👸 🌹 🦁 🏰", answer: "Frumoasa și Bestia", category: "poveste", hint: "Trandafirul stă sub clopot de sticlă." },
    { emojis: "🧞 🪔 3️⃣", answer: "Aladdin", category: "poveste", hint: "Trei dorințe dintr-o lampă." },
    { emojis: "🗼 👸 💇‍♀️", answer: "Rapunzel", category: "poveste", hint: "„Coboară-ți părul!”" },
    { emojis: "⏰ 🌅 🏃", answer: "Cine se scoală de dimineață, departe ajunge", category: "proverb", hint: "Începutul devreme se răsplătește." },
    { emojis: "👬 💪", answer: "Unde-s doi, puterea crește", category: "proverb", hint: "Împreună e mai ușor." },
    { emojis: "🐕 📢 🚫", answer: "Câinele care latră nu mușcă", category: "proverb", hint: "Amenințarea zgomotoasă rar face ceva." },
    { emojis: "🌳 🍎 👀", answer: "Pomul se cunoaște după roade", category: "proverb", hint: "Faptele spun totul." },
    { emojis: "🦋 🍴 ❌", answer: "Nu tot ce zboară se mănâncă", category: "proverb", hint: "Nu tot ce pare bun chiar este." },
    { emojis: "📚 🍀", answer: "Ai carte, ai parte", category: "proverb", hint: "Cine învață ajunge departe." },
    { emojis: "🏢 ☁️", answer: "zgârie-nori", category: "cuvant", hint: "Clădirea care ajunge la nori." },
    { emojis: "🐟 ⚔️", answer: "pește-spadă", category: "cuvant", hint: "Înoată înarmat." },
    { emojis: "⭐ 🌊", answer: "stea-de-mare", category: "cuvant", hint: "Strălucește pe fundul apei." },
    { emojis: "🌼 🏔️", answer: "floare-de-colț", category: "cuvant", hint: "Crește sus pe stânci — e ocrotită." },
    { emojis: "👄 😮", answer: "gură-cască", category: "cuvant", hint: "Se holbează și uită de tot." }
  ],
  (item) => item.emojis + item.answer
);

/* ------------------------------------------------------------------- vinde */

/** Obiectul trăsnit de vândut într-un minut + un argument-scânteie de rezervă. */
export const sellItems = withIds(
  [
    { item: "o umbrelă găurită", bonus: "Vara soarele intră, iar ploaia… aproape că nu!" },
    { item: "papuci invizibili", bonus: "Nimeni nu-ți mai spune că umbli desculț." },
    { item: "un balaur de companie", bonus: "Grătarul e gata în trei secunde." },
    { item: "o bicicletă cu roți pătrate", bonus: "N-o fură nimeni, garantat." },
    { item: "un ceas care merge înapoi", bonus: "Ajungi peste tot „mai devreme”." },
    { item: "o pernă care sforăie", bonus: "Nu mai adormi niciodată singur." },
    { item: "un pix fără cerneală", bonus: "Zero greșeli de scris, pe viață." },
    { item: "o oglindă care te laudă", bonus: "Fiecare dimineață începe cu un compliment." },
    { item: "un robot care face temele greșit", bonus: "Măcar ai mereu ce corecta." },
    { item: "o înghețată care nu se topește", bonus: "O lingi un an întreg." },
    { item: "un frigider care cântă", bonus: "Gustarea de la miezul nopții devine concert." },
    { item: "o hartă către nicăieri", bonus: "Nu te rătăcești: oriunde ajungi, ai ajuns." },
    { item: "un papagal care spune doar „nu”", bonus: "Îți antrenează răbdarea zilnic." },
    { item: "o săniuță de vară", bonus: "Zero coadă la derdeluș." },
    { item: "un ghiozdan care râde", bonus: "Temele par dintr-odată mai vesele." },
    { item: "o lanternă care luminează doar ziua", bonus: "Economisește bateriile toată noaptea." },
    { item: "un nor de companie", bonus: "Umbră personală, oriunde, la orice plajă." },
    { item: "șosete pentru mâini", bonus: "Mănuși? Nu. Modă." }
  ],
  (item) => item.item
);

/* ------------------------------------------------------------------ altfel */

/** Cuvântul de descris FĂRĂ cele trei cuvinte interzise. */
export const tabooWords = withIds(
  [
    { word: "PISICĂ", forbidden: ["miau", "animal", "blană"] },
    { word: "SOARE", forbidden: ["cald", "cer", "galben"] },
    { word: "ÎNGHEȚATĂ", forbidden: ["rece", "dulce", "vară"] },
    { word: "ȘCOALĂ", forbidden: ["elevi", "teme", "carte"] },
    { word: "FOTBAL", forbidden: ["minge", "poartă", "gol"] },
    { word: "IARNĂ", forbidden: ["zăpadă", "frig", "sanie"] },
    { word: "BUNICA", forbidden: ["plăcinte", "bătrână", "mama"] },
    { word: "TELEFON", forbidden: ["suni", "ecran", "jocuri"] },
    { word: "CÂINE", forbidden: ["ham", "latră", "coadă"] },
    { word: "MARE", forbidden: ["apă", "plajă", "valuri"] },
    { word: "TORT", forbidden: ["lumânări", "dulce", "aniversare"] },
    { word: "PLOAIE", forbidden: ["apă", "umbrelă", "nori"] },
    { word: "SOMN", forbidden: ["noapte", "pat", "ochi"] },
    { word: "AVION", forbidden: ["zboară", "aripi", "cer"] },
    { word: "BIBLIOTECĂ", forbidden: ["cărți", "citit", "liniște"] },
    { word: "CIRC", forbidden: ["clovn", "cort", "acrobați"] },
    { word: "MUZICĂ", forbidden: ["cânți", "sunete", "dans"] },
    { word: "FURNICĂ", forbidden: ["mică", "insectă", "harnică"] },
    { word: "LUNĂ", forbidden: ["noapte", "cer", "rotundă"] },
    { word: "PIZZA", forbidden: ["brânză", "felii", "rotundă"] }
  ],
  (item) => item.word
);

