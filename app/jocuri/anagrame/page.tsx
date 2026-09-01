import type { Metadata } from "next";
import GameShell from "../components/game-shell";
import AnagramsGame from "../components/anagrams-game";
import { getGame } from "../games";

const game = getGame("anagrame");

export const metadata: Metadata = {
  title: "Anagrame în limba română - joc de cuvinte pentru copii",
  description: "Literele s-au amestecat. Pune-le la loc și refă cuvântul românesc. Joc gratuit de vocabular pentru copii de la 8 ani.",
  openGraph: {
    title: "Anagrame în limba română - joc de cuvinte pentru copii",
    description: "Literele s-au amestecat. Pune-le la loc și refă cuvântul românesc. Joc gratuit de vocabular pentru copii de la 8 ani.",
    siteName: "Vorbăreții.ro"
  }
};

export default function Page() {
  return (
    <GameShell game={game}>
      <AnagramsGame />
    </GameShell>
  );
}
