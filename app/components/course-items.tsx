import classNames from "classnames";

/** Cele patru momente ale unei ședințe. Folosite pe pagina principală și în /ads. */
export const sessionMoments = [
  {
    title: "Povestim",
    emoji: "💬",
    description:
      "Fiecare își spune povestea săptămânii — și e ascultat până la capăt."
  },
  {
    title: "Ne jucăm",
    emoji: "🎲",
    description:
      "Jocuri de vorbire și improvizație. Curajul de a vorbi vine prin joacă."
  },
  {
    title: "Ne spunem părerea",
    emoji: "🙋",
    description:
      "Fiecare își susține ideea în fața celorlalți. Gândire și cuvinte, împreună."
  },
  {
    title: "Ne împrietenim",
    emoji: "🤝",
    description:
      "Același grup, în fiecare săptămână — de aici pornesc prieteniile."
  }
];

type Props = {
  className?: string;
};

export default function CourseItems({ className }: Props) {
  return (
    <ul
      role="list"
      className={classNames(
        "grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {sessionMoments.map((item) => (
        <li
          key={item.title}
          className="rounded-2xl bg-gradient-to-br from-pink-50 to-indigo-50 p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-4">
            <span className="text-4xl" aria-hidden="true">
              {item.emoji}
            </span>
          </div>
          <h3 className="text-xl font-semibold leading-7 tracking-tight text-gray-900">
            {item.title}
          </h3>
          <p className="pt-4 text-sm text-gray-600">
            {item.description}
          </p>
        </li>
      ))}
    </ul>
  );
}
