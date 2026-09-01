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
function hashId(text: string): string {
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

export const wheelDecks = [
  {
    id: "despre-mine",
    label: "Despre mine",
    prompts: [
      "Povestește cea mai amuzantă întâmplare din săptămâna asta.",
      "Care e mâncarea ta preferată de la bunici?",
      "Descrie-ți cel mai bun prieten în trei cuvinte.",
      "Spune trei lucruri care te fac fericit.",
      "Ce joc îți place cel mai mult să joci cu prietenii?",
      "Care a fost cea mai frumoasă zi din vacanță?",
      "Ce te-a făcut să râzi ultima oară?",
      "La ce te pricepi cel mai bine?",
      "Ce ai vrea să te faci când vei fi mare și de ce?",
      "Ce cadou ți-ar plăcea să primești și de la cine?",
      "Povestește un vis pe care ți-l amintești.",
      "Ce faci prima dată când ajungi acasă de la școală?"
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
      "Cum se face un prieten nou în prima zi de școală?",
      "Ce faci când un prieten e supărat pe tine?",
      "Povestește cum ai cunoscut-o pe cea mai bună prietenă sau pe cel mai bun prieten.",
      "Ce înseamnă, pentru tine, un prieten adevărat?",
      "Ce i-ai spune cuiva care stă singur în pauză?",
      "Care a fost cea mai bună zi petrecută cu prietenii tăi?",
      "Cu cine din familie semeni cel mai mult și la ce?",
      "Ce reguli ai pune într-o casă în care locuiesc numai copii?",
      "Cum împarți ultima bucată de tort cu doi prieteni?",
      "Ce l-ai învăța pe un copil care abia începe să vorbească românește?",
      "Ce faci când doi prieteni se ceartă între ei?",
      "Spune un lucru bun despre fiecare om din camera asta."
    ]
  }
];

/** Id-urile întrebărilor, în ordinea din fiecare set. Le folosește roata ca să
 *  țină minte ce a ieșit deja, fără ca setul să aibă nevoie de id-uri scrise de mână. */
export const wheelPromptIds = wheelDecks.map((deck) =>
  deck.prompts.map((prompt) => hashId(prompt))
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

export const riddleIds = riddles.map((item) => item.id);

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

export const proverbIds = proverbs.map((item) => item.id);

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

export const anagramIds = anagrams.map((item) => item.id);

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

export const memoryPairIds = memoryPairs.map((item) => item.id);
