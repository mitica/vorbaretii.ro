/* eslint-disable @next/next/no-img-element */
export default function TeamSection() {
  const people = [
    {
      name: "Lia Cantea",
      role: "Jurnalism și Comunicare Publică, ULIM",
      imageUrl: "/assets/images/lia-face-2-256.jpg",
      info: "Mentor dedicat. Pasionată de lucrul cu copiii și de păstrarea limbii române în diaspora."
    }
  ];

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-x-8 gap-y-20 px-6 lg:px-8 xl:grid-cols-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Mentorul tău
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Cu experiență în comunicare și o pasiune deosebită pentru lucrul cu
            copiii, Lia creează un mediu cald și prietenos unde fiecare copil
            se simte înțeles și apreciat.
          </p>
        </div>
        <ul
          role="list"
          className="grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16 xl:col-span-2"
        >
          {people.map((person) => (
            <li key={person.name}>
              <div className="flex gap-x-6">
                <div className="w-24 h-24 shrink-0 text-center mb-2 rounded-full overflow-hidden">
                  <img
                    className="min-h-full min-w-full object-cover object-center group-hover:opacity-75"
                    src={person.imageUrl}
                    alt=""
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-2xl tracking-tight text-gray-900">
                    {person.name}
                  </h3>
                  <p className="text-sm font-semibold leading-6 text-indigo-600">
                    {person.role}
                  </p>
                  <p className="mt-3 text-sm text-gray-500">{person.info}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
