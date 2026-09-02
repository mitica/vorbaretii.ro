import { withIds } from "./ids";

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
    { word: "FANFARĂ", hint: "Orchestra care cântă în marș, cu trompete." },
  ],
  (item) => item.word
);

/* ------------------------------------------------------------------- rebus */
