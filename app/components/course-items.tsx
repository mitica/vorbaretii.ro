/* eslint-disable @next/next/no-img-element */

import classNames from "classnames";

type Props = {
  className?: string;
};

export default function CourseItems({ className }: Props) {
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
    <ul
      role="list"
      className={classNames(
        "grid gap-x-8 gap-y-12 md:grid-cols-3 sm:gap-y-16 xl:col-span-2",
        className
      )}
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
  );
}
