import type { Metadata } from "next";
import GameShell from "../components/game-shell";
import RiddlesGame from "../components/riddles-game";
import { getGame } from "../games";

const game = getGame("ghicitori");

export const metadata: Metadata = {
  title: "Ghicitori românești pentru copii - joc online gratuit",
  description: "Ghicitori românești clasice pentru copii de la 7 ani. Citește, ghicește și verifică răspunsul.",
  openGraph: {
    title: "Ghicitori românești pentru copii - joc online gratuit",
    description: "Ghicitori românești clasice pentru copii de la 7 ani. Citește, ghicește și verifică răspunsul.",
    siteName: "Vorbăreții.ro"
  }
};

export default function Page() {
  return (
    <GameShell game={game}>
      <RiddlesGame />
    </GameShell>
  );
}
