import { withIds } from "./ids";

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
    { emoji: "🔔", word: "clopoțel" },
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
  "Chiar înainte de culcare…",
];

/* -------------------------------------------------------------- categorii */
