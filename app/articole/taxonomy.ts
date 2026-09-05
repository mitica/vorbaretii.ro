/**
 * Taxonomia articolelor — numele de afișare, într-o singură casă. Articolul
 * poartă doar slug-uri (category, tags, series); orice slug fără intrare aici
 * pică validarea. Diacriticele nu se pot recupera din slug („martisor” →
 * „Mărțișorul”), de-asta numele trăiesc aici, nu per articol. Un tag / o
 * serie / o categorie nouă intră în ACELAȘI PR cu articolul care o introduce.
 */

export type Taxonomy = {
  categories: Record<string, string>;
  tags: Record<string, string>;
  seriesTitles: Record<string, string>;
};

/** Slug → nume de afișare. Intrările sosesc cu articolele care le folosesc. */
export const taxonomy: Taxonomy = {
  categories: { traditii: "Tradiții", locuri: "Locuri" },
  tags: {
    martisor: "Mărțișorul",
    primavara: "Primăvara",
    "1-martie": "1 Martie",
    obiceiuri: "Obiceiuri",
    "orheiul-vechi": "Orheiul Vechi",
    "manastiri-rupestre": "Mănăstiri rupestre",
    raut: "Răutul",
    "hoarda-de-aur": "Hoarda de Aur",
    "stefan-cel-mare": "Ștefan cel Mare",
  },
  seriesTitles: { "de-sarbatori": "De sărbători", "locuri-de-vazut": "Locuri de văzut" },
};
