import SectionContainer from "./section-container";

export default function ScopeSection() {
  const benefits = [
    {
      emoji: "🗣️",
      title: "Nu uită limba română",
      description:
        "Practica regulată și conversațiile naturale ajută copiii să-și mențină și îmbunătățească vocabularul."
    },
    {
      emoji: "🎭",
      title: "Exprimare liberă",
      description:
        "Fiecare copil are ocazia să vorbească, să povestească și să fie ascultat într-un mediu prietenos."
    },
    {
      emoji: "🌍",
      title: "Conexiune cu rădăcinile",
      description:
        "Descoperă cultura, tradițiile și frumusețea limbii române prin activități interactive."
    },
    {
      emoji: "👫",
      title: "Prieteni noi",
      description:
        "Întâlnește alți copii din diaspora care împărtășesc aceeași dorință de a păstra limba română."
    },
    {
      emoji: "🎯",
      title: "Învățare prin joc",
      description:
        "Ghicitori, proverbe, poezii și jocuri interactive care fac învățarea o plăcere."
    },
    {
      emoji: "💪",
      title: "Încredere în sine",
      description:
        "Copiii devin mai încrezători în abilitățile lor de comunicare în limba română."
    }
  ];

  return (
    <SectionContainer className="bg-white">
      <a id="scop"></a>
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            De ce Vorbăreții?
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Un spațiu special pentru copiii din diaspora care vor să păstreze
            legătura cu limba română
          </p>
        </div>
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="relative bg-gradient-to-br from-white to-pink-50 rounded-2xl p-6 shadow-sm border border-pink-100 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{benefit.emoji}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600 text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
