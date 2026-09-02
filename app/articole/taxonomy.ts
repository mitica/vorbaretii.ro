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
  categories: { istorie: "Istorie" },
  tags: { domnitori: "Domnitori", "evul-mediu": "Evul Mediu" },
  seriesTitles: { domnitorii: "Domnitorii" },
};
