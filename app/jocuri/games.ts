export type Game = {
  slug: string;
  title: string;
  emoji: string;
  tagline: string;
  /** Cum se joacă — o singură frază scurtă, afișată deasupra jocului. */
  howTo: string;
  ages: string;
};

export const games: Game[] = [
  {
    slug: "roata-cuvintelor",
    title: "Roata cuvintelor",
    emoji: "🎡",
    tagline: "Învârte roata și povestește ce-ți iese.",
    howTo: "Învârte roata și răspunde cu voce tare la întrebarea care iese.",
    ages: "7"
  },
  {
    slug: "ghicitori",
    title: "Ghicitori",
    emoji: "🔮",
    tagline: "Ghicitori românești, ca la bunici.",
    howTo: "Spune cu voce tare ce crezi că este, apoi vezi răspunsul.",
    ages: "7"
  },
  {
    slug: "proverbe-pereche",
    title: "Proverbe pereche",
    emoji: "🧩",
    tagline: "Potrivește proverbul cu înțelesul lui.",
    howTo: "Apasă un proverb, apoi înțelesul lui. Dacă se potrivesc, rămân verzi.",
    ages: "8"
  },
  {
    slug: "anagrame",
    title: "Anagrame",
    emoji: "🔤",
    tagline: "Literele s-au amestecat. Pune-le la loc.",
    howTo: "Apasă literele în ordinea corectă. Dacă te blochezi, cere un indiciu.",
    ages: "8"
  },
  {
    slug: "memorie",
    title: "Joc de memorie",
    emoji: "🧠",
    tagline: "Găsește perechea: imaginea și cuvântul.",
    howTo: "Întoarce două cartonașe și găsește perechea: imaginea și cuvântul.",
    ages: "7"
  }
];

export function getGame(slug: string): Game {
  const game = games.find((g) => g.slug === slug);
  if (!game) throw new Error(`Joc necunoscut: ${slug}`);
  return game;
}
