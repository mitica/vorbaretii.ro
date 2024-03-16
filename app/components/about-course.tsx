/* eslint-disable @next/next/no-img-element */
export default function AboutCourse() {
  const items = [
    {
      title: "Comunicare",
      tags: ["Prieteni", "Cărți", "Proiecte", "Scopuri", "Hobby-uri"],
      imageUrl: "/assets/images/happy-girl-face-smiling-256.jpg",
      description:
        "Copiii sunt ascultați și încurajați să povestească despre ei și despre ce îi interesează."
    },
    {
      title: "Învățare",
      tags: ["AI", "Descoperiri", "Inovații", "Bitcoin", "Profesii", "Știință"],
      imageUrl: "/assets/images/happy-boy-learning-256.jpg",
      description:
        "Copiii vor învăța lucruri noi și interesante despre tehnologie, știință și lumea înconjurătoare."
    },
    {
      title: "Jocuri de socializare",
      tags: ["Provocări", "Imaginație", "Concursuri", "Jocuri de rol"],
      imageUrl: "/assets/images/happy-children-playing-256.jpg",
      description:
        "Prin joc și distracție, copiii vor învăța să socializeze și să colaboreze cu ceilalți."
    }
  ];

  return (
    <div className="bg-white py-16 sm:py-24">
      <a id="despre-curs" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 grid-cols-1">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Despre curs
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            <span className="font-medium">Curs online</span> de socializare
            pentru copii, cu accent pe comunicare și învățare. Acest curs este
            conceput pentru a-i ajuta pe copii să-și dezvolte abilitățile de
            ascultare activă și de exprimare clară a gândurilor și
            sentimentelor.
          </p>
        </div>
        <ul
          role="list"
          className="grid gap-x-8 gap-y-12 md:grid-cols-3 sm:gap-y-16 xl:col-span-2"
        >
          {items.map((item) => (
            <li key={item.title}>
              <div className="flex items-center gap-x-6">
                <img
                  className="h-24 w-24 rounded-full"
                  src={item.imageUrl}
                  alt=""
                />
                <div>
                  <h3 className="text-base text-xl font-semibold leading-7 tracking-tight text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-sm font-semibold leading-6 text-indigo-600">
                    {item.tags.join(", ")}
                  </p>
                </div>
              </div>
              <p className="pt-4 text-gray-600">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
