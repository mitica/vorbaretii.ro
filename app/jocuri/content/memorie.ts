import { withIds } from "./ids";

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
    { emoji: "⛰️", word: "MUNTE" },
  ],
  (item) => item.word
);

/* ----------------------------------------------------------------- zaruri */
