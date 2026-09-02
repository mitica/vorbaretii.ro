import { withIds } from "./ids";

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
    { item: "șosete pentru mâini", bonus: "Mănuși? Nu. Modă." },
  ],
  (item) => item.item
);

/* ------------------------------------------------------------------ altfel */
