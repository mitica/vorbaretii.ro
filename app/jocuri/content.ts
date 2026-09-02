/**
 * Conținutul jocurilor. Un singur loc de editat când adăugăm întrebări noi —
 * jocurile nu au text propriu.
 *
 * Fiecare element primește automat un `id` derivat din text (vezi `withIds`).
 * Id-ul e cel după care ținem minte, în browserul copilului, ce s-a jucat deja,
 * ca să nu se repete. Dacă rescrii un text, id-ul lui se schimbă și elementul
 * redevine „nevăzut" — asta e în regulă, e text nou.
 */

// Conținutul stă pe module, un joc pe fișier (capul de 300 de rânduri per fișier,
// ADR-005); fișierul ăsta rămâne UȘA unică prin care jocurile îl importă.
export { hashId } from "./content/ids";
export { wheelDecks, wheelItems } from "./content/roata";
export { riddles } from "./content/ghicitori";
export { proverbs } from "./content/proverbe";
export { anagrams } from "./content/anagrame";
export { memoryPairs } from "./content/memorie";
export { storyDice, storyStarters } from "./content/zaruri";
export { categories } from "./content/categorii";
export { tongueTwisters } from "./content/framantari";
export { hiddenWords } from "./content/ascuns";
export { emojiRebus } from "./content/rebus";
export { sellItems } from "./content/vinde";
export { tabooWords } from "./content/altfel";
