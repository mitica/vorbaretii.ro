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
export { wheelDecks, wheelItems } from "./content/wheel";
export { riddles } from "./content/riddles";
export { proverbs } from "./content/proverbs";
export { anagrams } from "./content/anagrams";
export { memoryPairs } from "./content/memory";
export { storyDice, storyStarters } from "./content/story-dice";
export { categories } from "./content/categories";
export { tongueTwisters } from "./content/tongue-twisters";
export { hiddenWords } from "./content/hidden-words";
export { emojiRebus } from "./content/rebus";
export { sellItems } from "./content/sell-it";
export { tabooWords } from "./content/taboo";
