export type Game = {
  slug: string;
  title: string;
  emoji: string;
  tagline: string;
  /** Cum se joacă — o frază, afișată deasupra jocului. */
  howTo: string;
  ages: string;
};

export const games: Game[] = [
  {
    slug: "roata-cuvintelor",
    title: "Roata cuvintelor",
    emoji: "🎡",
    tagline: "Învârte roata și povestește ce-ți iese.",
    howTo:
      "Apasă butonul și învârte roata. Unde se oprește, acolo e întrebarea — răspunde cu voce tare, cât mai pe larg.",
    ages: "7"
  },
  {
    slug: "ghicitori",
    title: "Ghicitori",
    emoji: "🔮",
    tagline: "Ghicitori românești, ca la bunici.",
    howTo:
      "Citește ghicitoarea, spune cu voce tare ce crezi, apoi cere răspunsul ca să vezi dacă ai nimerit.",
    ages: "7"
  },
  {
    slug: "proverbe-pereche",
    title: "Proverbe pereche",
    emoji: "🧩",
    tagline: "Potrivește proverbul cu înțelesul lui.",
    howTo:
      "Apasă un proverb din stânga, apoi înțelesul lui din dreapta. Dacă se potrivesc, rămân verzi.",
    ages: "8"
  },
  {
    slug: "anagrame",
    title: "Anagrame",
    emoji: "🔤",
    tagline: "Literele s-au amestecat. Pune-le la loc.",
    howTo:
      "Apasă literele în ordinea corectă ca să refaci cuvântul. Dacă te blochezi, cere un indiciu.",
    ages: "8"
  },
  {
    slug: "memorie",
    title: "Joc de memorie",
    emoji: "🧠",
    tagline: "Găsește perechea: imaginea și cuvântul.",
    howTo:
      "Întoarce două cartonașe. Dacă imaginea și cuvântul se potrivesc, rămân descoperite.",
    ages: "7"
  }
];

export function getGame(slug: string): Game {
  const game = games.find((g) => g.slug === slug);
  if (!game) throw new Error(`Joc necunoscut: ${slug}`);
  return game;
}
