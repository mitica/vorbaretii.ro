const pillars = [
  {
    emoji: "👫",
    title: "Aceiași copii, în fiecare săptămână",
    description: "Grupul e stabil — prieteniile au nevoie de revedere.",
  },
  {
    emoji: "🎯",
    title: "De aceeași vârstă și nivel",
    description: "Îl plasăm unde se simte în largul lui, din prima zi.",
  },
  {
    emoji: "🎭",
    title: "Mentorul face conversația joacă",
    description: "Povești, jocuri, păreri — nu gramatică, nu teme.",
  },
  {
    emoji: "💬",
    title: "Româna, de bunăvoie",
    description: "O vorbește pentru că vrea — asta o ține vie.",
  },
];

export default function SolutionSection() {
  return (
    <section id="club" className="scroll-mt-20 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Grupul lui de prieteni, în română.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-8 text-gray-600">
            Nu-l trimitem la ore. Îi dăm ce nu-i poți fabrica acasă: copii de vârsta lui, cu care
            româna e limba dintre prieteni.
          </p>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="relative rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50 p-6 shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 text-4xl" aria-hidden="true">
                {pillar.emoji}
              </div>
              <h3 className="mb-2 text-lg font-semibold leading-snug text-gray-900">
                {pillar.title}
              </h3>
              <p className="text-sm text-gray-600">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
