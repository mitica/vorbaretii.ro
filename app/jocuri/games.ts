import { numeralDe } from "./components/format";
import { wheelDecks } from "./content";

export type Game = {
  slug: string;
  title: string;
  emoji: string;
  tagline: string;
  /** Cum se joacă — o singură frază scurtă, afișată deasupra jocului. */
  howTo: string;
  ages: string;
  /** Elementele jocului, la plural („ghicitori") — pentru mesajele de progres. */
  itemsLabel: string;
  /** Titlul și descrierea paginii, pentru căutări. Pagina se generează din ele. */
  seo: { title: string; description: string };
};

/** Numărul se calculează din conținut, ca descrierea să nu rămână în urmă. */
const wheelPromptCount = wheelDecks.reduce((sum, deck) => sum + deck.prompts.length, 0);

export const games: Game[] = [
  {
    slug: "roata-cuvintelor",
    title: "Roata cuvintelor",
    emoji: "🎡",
    tagline: "Învârte roata și povestește ce-ți iese.",
    howTo: "Învârte roata și răspunde cu voce tare la întrebarea care iese.",
    ages: "7",
    itemsLabel: "întrebări",
    seo: {
      title: "Roata cuvintelor - joc de conversație în română pentru copii",
      description: `Învârte roata și răspunde la întrebarea care iese. ${numeralDe(wheelPromptCount)} întrebări care pornesc conversația cu copilul tău, în limba română.`,
    },
  },
  {
    slug: "ghicitori",
    title: "Ghicitori",
    emoji: "🔮",
    tagline: "Ghicitori românești, ca la bunici.",
    howTo: "Spune cu voce tare ce crezi că este, apoi vezi răspunsul.",
    ages: "7",
    itemsLabel: "ghicitori",
    seo: {
      title: "Ghicitori românești pentru copii - joc online gratuit",
      description:
        "Ghicitori românești clasice pentru copii de la 7 ani. Citește, ghicește și verifică răspunsul.",
    },
  },
  {
    slug: "proverbe-pereche",
    title: "Proverbe pereche",
    emoji: "🧩",
    tagline: "Potrivește proverbul cu înțelesul lui.",
    howTo: "Apasă un proverb, apoi înțelesul lui. Dacă se potrivesc, rămân verzi.",
    ages: "8",
    itemsLabel: "proverbe",
    seo: {
      title: "Proverbe pereche - joc cu proverbe românești pentru copii",
      description:
        "Potrivește proverbul românesc cu înțelesul lui. Joc gratuit pentru copii de la 8 ani, fără cont și fără instalare.",
    },
  },
  {
    slug: "anagrame",
    title: "Anagrame",
    emoji: "🔤",
    tagline: "Literele s-au amestecat. Pune-le la loc.",
    howTo: "Apasă literele în ordinea corectă. Dacă te blochezi, cere un indiciu.",
    ages: "8",
    itemsLabel: "cuvinte",
    seo: {
      title: "Anagrame în limba română - joc de cuvinte pentru copii",
      description:
        "Literele s-au amestecat. Pune-le la loc și refă cuvântul românesc. Joc gratuit de vocabular pentru copii de la 8 ani.",
    },
  },
  {
    slug: "zarurile-de-poveste",
    title: "Zarurile de poveste",
    emoji: "🎲",
    tagline: "Aruncă zarurile și inventează povestea.",
    howTo: "Aruncă zarurile și spune o poveste în care apar toate trei imaginile.",
    ages: "7",
    itemsLabel: "imagini",
    seo: {
      title: "Zarurile de poveste - joc de imaginație în română pentru copii",
      description:
        "Aruncă trei zaruri cu imagini și inventează o poveste în care apar toate. Joc de povestit în română, singur sau în grup, pentru copii de la 7 ani.",
    },
  },
  {
    slug: "categorii",
    title: "Categorii",
    emoji: "⏱️",
    tagline: "Spune 5 lucruri din categorie, într-un minut.",
    howTo:
      "Pornește cronometrul, spune 5 lucruri din categorie și atinge câte o bulă pentru fiecare.",
    ages: "7",
    itemsLabel: "categorii",
    seo: {
      title: "Categorii - joc de vocabular contra cronometru pentru copii",
      description:
        "Spune 5 lucruri din categorie într-un minut: animale, cuvinte, mâncăruri. Joc de vocabular în română, singur sau în grup, de la 7 ani.",
    },
  },
  {
    slug: "framantari-de-limba",
    title: "Frământări de limbă",
    emoji: "👅",
    tagline: "Zi-o de trei ori, repede, fără să te încurci.",
    howTo: "Pornește cronometrul și spune frământarea de trei ori, cât de repede poți.",
    ages: "7",
    itemsLabel: "frământări",
    seo: {
      title: "Frământări de limbă românești - joc de dicție pentru copii",
      description:
        "Frământări de limbă românești, de spus de trei ori contra cronometru. Joc de dicție și râs, singur sau în grup, pentru copii de la 7 ani.",
    },
  },
  {
    slug: "cuvantul-ascuns",
    title: "Cuvântul ascuns",
    emoji: "🎈",
    tagline: "Ghicește literele până se arată cuvântul.",
    howTo: "Apasă litere pe tastatură; la greșeli, balonul se dezumflă.",
    ages: "7",
    itemsLabel: "cuvinte",
    seo: {
      title: "Cuvântul ascuns - joc de ghicit litere în română pentru copii",
      description:
        "Ghicește cuvântul românesc literă cu literă înainte să se dezumfle balonul. Joc de vocabular gratuit pentru copii de la 7 ani.",
    },
  },
  {
    slug: "poveste-din-emoji",
    title: "Poveste din emoji",
    emoji: "📖",
    tagline: "Ghicește povestea ascunsă în emoji.",
    howTo: "Uită-te la emoji, spune răspunsul cu voce tare, apoi verifică-l.",
    ages: "7",
    itemsLabel: "rebusuri",
    seo: {
      title: "Poveste din emoji - rebusuri pentru copii, în română",
      description:
        "Ghicește povestea, proverbul sau cuvântul ascuns într-o înșiruire de emoji. Joc gratuit de perspicacitate pentru copii de la 7 ani.",
    },
  },
  {
    slug: "vinde-mi-asta",
    title: "Vinde-mi asta!",
    emoji: "🧢",
    tagline: "Un obiect trăsnit, un minut să-l vinzi.",
    howTo: "Pornește cronometrul și convinge-ne, cu voce tare, să cumpărăm obiectul.",
    ages: "7",
    itemsLabel: "obiecte",
    seo: {
      title: "Vinde-mi asta! - joc de argumentare în română pentru copii",
      description:
        "Primești un obiect trăsnit și un minut să-l vinzi cu cele mai convingătoare argumente. Joc de vorbire și persuasiune pentru copii de la 7 ani.",
    },
  },
  {
    slug: "spune-o-altfel",
    title: "Spune-o altfel",
    emoji: "🙊",
    tagline: "Descrie cuvântul fără cuvintele interzise.",
    howTo:
      "Pornește cronometrul și descrie cuvântul fără cele trei cuvinte interzise, până îl ghicesc ceilalți.",
    ages: "8",
    itemsLabel: "cuvinte",
    seo: {
      title: "Spune-o altfel - joc de descris cuvinte în română pentru copii",
      description:
        "Descrie cuvântul fără cele trei cuvinte interzise, contra cronometru. Joc de vocabular și improvizație pentru copii de la 8 ani.",
    },
  },
  {
    slug: "memorie",
    title: "Joc de memorie",
    emoji: "🧠",
    tagline: "Găsește perechea: imaginea și cuvântul.",
    howTo: "Întoarce două cartonașe și găsește perechea: imaginea și cuvântul.",
    ages: "7",
    itemsLabel: "perechi",
    seo: {
      title: "Joc de memorie în limba română pentru copii",
      description:
        "Găsește perechea dintre imagine și cuvântul românesc. Joc de memorie gratuit pentru copii de la 7 ani.",
    },
  },
  {
    slug: "curiozitati",
    title: "Curiozități",
    emoji: "📜",
    tagline: "Întrebări adevărate din articolele noastre.",
    howTo: "Învârte roata, răspunde cu voce tare, apoi vezi răspunsul din articol.",
    ages: "7",
    itemsLabel: "întrebări",
    seo: {
      title: "Curiozități - joc în română din articolele pentru copii",
      description:
        "Învârte roata cu întrebări din articolele noastre despre România. Răspunzi, apoi verifici răspunsul în articol.",
    },
  },
];

export function getGame(slug: string): Game {
  const game = games.find((g) => g.slug === slug);
  if (!game) throw new Error(`Joc necunoscut: ${slug}`);
  return game;
}
