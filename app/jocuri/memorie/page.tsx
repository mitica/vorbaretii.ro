import type { Metadata } from "next";
import GameShell from "../components/game-shell";
import MemoryGame from "../components/memory-game";
import { getGame } from "../games";

const game = getGame("memorie");

export const metadata: Metadata = {
  title: "Joc de memorie în limba română pentru copii",
  description: "Găsește perechea dintre imagine și cuvântul românesc. Joc de memorie gratuit pentru copii de la 7 ani.",
  openGraph: {
    title: "Joc de memorie în limba română pentru copii",
    description: "Găsește perechea dintre imagine și cuvântul românesc. Joc de memorie gratuit pentru copii de la 7 ani.",
    siteName: "Vorbăreții.ro"
  }
};

export default function Page() {
  return (
    <GameShell game={game}>
      <MemoryGame />
    </GameShell>
  );
}
