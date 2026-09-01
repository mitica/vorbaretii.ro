import type { Metadata } from "next";
import GameShell from "../components/game-shell";
import ProverbsGame from "../components/proverbs-game";
import { getGame } from "../games";

const game = getGame("proverbe-pereche");

export const metadata: Metadata = {
  title: "Proverbe pereche - joc cu proverbe românești pentru copii",
  description: "Potrivește proverbul românesc cu înțelesul lui. Joc gratuit pentru copii de la 8 ani, fără cont și fără instalare.",
  openGraph: {
    title: "Proverbe pereche - joc cu proverbe românești pentru copii",
    description: "Potrivește proverbul românesc cu înțelesul lui. Joc gratuit pentru copii de la 8 ani, fără cont și fără instalare.",
    siteName: "Vorbăreții.ro"
  }
};

export default function Page() {
  return (
    <GameShell game={game}>
      <ProverbsGame />
    </GameShell>
  );
}
