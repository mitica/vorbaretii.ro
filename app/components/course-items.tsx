import classNames from "classnames";

type Props = {
  className?: string;
};

export default function CourseItems({ className }: Props) {
  const items = [
    {
      title: "📖 Povestim",
      emoji: "💬",
      tags: ["Săptămâna mea", "Întâmplări", "Experiențe", "Emoții"],
      description:
        "Fiecare copil povestește cum i-a trecut săptămâna, ce a învățat și ce momente frumoase a trăit."
    },
    {
      title: "🎭 Descoperim",
      emoji: "🔮",
      tags: ["Proverbe", "Ghicitori", "Cimilituri", "Poezii"],
      description:
        "Învățăm împreună proverbe înțelepte, ghicitori amuzante, frământări de limbă și poezii frumoase."
    },
    {
      title: "📚 Cunoaștem",
      emoji: "✨",
      tags: ["Scriitori", "Poeți", "Tradiții", "Cultură"],
      description:
        "Descoperim scriitori și poeți români, tradiții și povești care ne conectează cu rădăcinile noastre."
    },
    {
      title: "🎮 Ne jucăm",
      emoji: "🎯",
      tags: ["Jocuri interactive", "Cooperare", "Echipă", "Distracție"],
      description:
        "Jocuri distractive de cooperare și cunoaștere care fac învățarea limbii o aventură."
    }
  ];

  return (
    <ul
      role="list"
      className={classNames(
        "grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4 sm:gap-y-12",
        className
      )}
    >
      {items.map((item) => (
        <li
          key={item.title}
          className="bg-gradient-to-br from-pink-50 to-indigo-50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-center mb-4">
            <span className="text-4xl">{item.emoji}</span>
          </div>
          <h3 className="text-xl font-semibold leading-7 tracking-tight text-gray-900 text-center">
            {item.title}
          </h3>
          <p className="text-sm font-medium leading-6 text-indigo-600 text-center mt-2">
            {item.tags.join(" • ")}
          </p>
          <p className="pt-4 text-gray-600 text-center text-sm">
            {item.description}
          </p>
        </li>
      ))}
    </ul>
  );
}
