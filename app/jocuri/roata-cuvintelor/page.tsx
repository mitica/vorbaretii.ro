import type { Metadata } from "next";
import GameShell from "../components/game-shell";
import WheelGame from "../components/wheel-game";
import { getGame } from "../games";

const game = getGame("roata-cuvintelor");

export const metadata: Metadata = {
  title: "Roata cuvintelor - joc de conversație în română pentru copii",
  description: "Învârte roata și răspunde la întrebarea care iese. 24 de întrebări care pornesc conversația cu copilul tău, în limba română.",
  openGraph: {
    title: "Roata cuvintelor - joc de conversație în română pentru copii",
    description: "Învârte roata și răspunde la întrebarea care iese. 24 de întrebări care pornesc conversația cu copilul tău, în limba română.",
    siteName: "Vorbăreții.ro"
  }
};

export default function Page() {
  return (
    <GameShell game={game}>
      <WheelGame />
    </GameShell>
  );
}
