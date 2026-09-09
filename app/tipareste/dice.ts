import { storyDice } from "@/app/jocuri/content";

/**
 * Cele trei zaruri de tipărit (FEAT-018 în harness-ul privat).
 *
 * Un cub pe categorie — CINE · CE · UNDE — deci fiecare aruncare dă un
 * personaj, un obiect și un loc. Nu sunt „primele 18 din 36": alegerea e a
 * designului, ca povestea să aibă din prima cele trei cârlige.
 *
 * Cuvintele se scriu aici ca text, nu ca id: fișierul rămâne citibil, iar un
 * cuvânt rescris în `storyDice` pică zgomotos la căutare, la build, nu tăcut
 * pe hârtie. Emoji-ul nu se copiază — vine tot din `storyDice`, ca zarul și
 * jocul de pe ecran să arate același personaj.
 */

export type DiceFace = { emoji: string; word: string };
export type DiceCube = { label: string; faces: DiceFace[] };

/** Un zar are șase fețe; un cub cu cinci cuvinte e o foaie greșită, nu un zar. */
const FACES_PER_CUBE = 6;

/**
 * Ordinea celor șase cuvinte E ordinea fețelor din desfășurată, așa cum le
 * așază `dice-net.tsx`: coloana din mijloc de sus în jos (sus · față · jos ·
 * fund), apoi aripa stângă și aripa dreaptă.
 */
const CUBE_WORDS: { label: string; words: string[] }[] = [
  { label: "Cine", words: ["balaur", "vrăjitor", "prințesă", "robot", "bunica", "supererou"] },
  { label: "Ce", words: ["cheie", "hartă", "cutie", "baghetă", "lanternă", "balon"] },
  { label: "Unde", words: ["castel", "pădure", "insulă", "munte", "circ", "pod"] },
];

function faceOf(word: string): DiceFace {
  const item = storyDice.find((entry) => entry.word === word);
  if (!item) {
    throw new Error(`Zarul de tipărit cere „${word}”, care nu mai există în storyDice.`);
  }
  return { emoji: item.emoji, word: item.word };
}

function cubeOf(entry: { label: string; words: string[] }): DiceCube {
  if (entry.words.length !== FACES_PER_CUBE) {
    throw new Error(
      `Cubul „${entry.label}” are ${entry.words.length} cuvinte, nu ${FACES_PER_CUBE}.`
    );
  }
  return { label: entry.label, faces: entry.words.map((word) => faceOf(word)) };
}

export const DICE_CUBES: DiceCube[] = CUBE_WORDS.map((cube) => cubeOf(cube));
