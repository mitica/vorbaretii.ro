import ContactSection from "./components/contact-section";
import GamesTeaser from "./components/games-teaser";
import HomeIntro from "./components/home-intro";
import ProblemSection from "./components/problem-section";
import SessionSection from "./components/session-section";
import SolutionSection from "./components/solution-section";
import TeamSection from "./components/team-section";

export default function Home() {
  return (
    <>
      <HomeIntro />
      <ProblemSection />
      <SolutionSection />
      <SessionSection />
      <TeamSection />
      <GamesTeaser />
      <ContactSection />
    </>
  );
}
