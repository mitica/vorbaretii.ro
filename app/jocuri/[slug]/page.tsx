import type { Metadata } from "next";
import type { ComponentType } from "react";
import AnagramsGame from "../components/anagrams-game";
import CategoriesGame from "../components/categories-game";
import EmojiRebusGame from "../components/emoji-rebus-game";
import GameShell from "../components/game-shell";
import HiddenWordGame from "../components/hidden-word-game";
import MemoryGame from "../components/memory-game";
import ProverbsGame from "../components/proverbs-game";
import RiddlesGame from "../components/riddles-game";
import StoryDiceGame from "../components/story-dice-game";
import TongueTwistersGame from "../components/tongue-twisters-game";
import WheelGame from "../components/wheel-game";
import { games, getGame } from "../games";

/**
 * O singură pagină pentru toate jocurile. Registrul (games.ts) dă lista și
 * textele pentru căutări; aici se leagă doar slug-ul de componenta lui.
 * Un joc nou = intrare în registru + conținut + componentă — fără încă un
 * page.tsx copiat, fără metadata scrisă de două ori.
 */
const boards: Record<string, ComponentType> = {
  "roata-cuvintelor": WheelGame,
  ghicitori: RiddlesGame,
  "proverbe-pereche": ProverbsGame,
  anagrame: AnagramsGame,
  "zarurile-de-poveste": StoryDiceGame,
  categorii: CategoriesGame,
  "framantari-de-limba": TongueTwistersGame,
  "cuvantul-ascuns": HiddenWordGame,
  "poveste-din-emoji": EmojiRebusGame,
  memorie: MemoryGame
};

type Props = { params: { slug: string } };

/** Export static: fiecare slug din registru devine o pagină HTML la build. */
export function generateStaticParams() {
  for (const game of games) {
    if (!boards[game.slug]) {
      throw new Error(`Jocul „${game.slug}” nu are componentă în boards.`);
    }
  }
  return games.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: Props): Metadata {
  const game = getGame(params.slug);
  const { seo } = game;
  const image = {
    url: `/assets/og/${game.slug}.png`,
    width: 1200,
    height: 630,
    alt: `${game.title} — Vorbăreții.ro`
  };
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/jocuri/${game.slug}` },
    openGraph: {
      title: seo.title,
      description: seo.description,
      siteName: "Vorbăreții.ro",
      type: "website",
      locale: "ro_RO",
      url: `/jocuri/${game.slug}`,
      images: [image]
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [image.url]
    }
  };
}

export default function Page({ params }: Props) {
  const game = getGame(params.slug);
  const Board = boards[game.slug];
  return (
    <GameShell game={game}>
      <Board />
    </GameShell>
  );
}
