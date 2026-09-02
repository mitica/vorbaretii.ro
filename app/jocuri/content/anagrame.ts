import { withIds } from "./ids";

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
    { word: "FLOARE", hint: "Crește în grădină și miroase frumos." },
  ],
  (item) => item.word
);

/* ---------------------------------------------------------------- memorie */
