/* eslint-disable @next/next/no-img-element */
import DemoCta from "./demo-cta";
import SectionTopBgEffect from "./section-top-bg-effect";
import { eyebrow, pillFact } from "./ui";

const facts = [
  "o oră pe săptămână",
  "grup de maximum 8 copii",
  "seara, pe ora ta locală"
];

export default function HomeIntro() {
  return (
    <section className="relative isolate overflow-hidden pb-14 pt-12 sm:pb-20 sm:pt-16">
      <SectionTopBgEffect />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <p className={eyebrow}>
            Online, de la 7 ani
          </p>
          <h1 className="mt-4 max-w-[20ch] text-balance text-4xl font-bold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.35rem]">
            Club de socializare în{" "}
            <span className="text-effect">română</span> pentru copiii din
            diaspora.
          </h1>
          <p className="mt-5 max-w-[46ch] text-pretty text-lg leading-8 text-gray-600">
            Grupul lui stabil de prieteni de aceeași vârstă — o oră pe
            săptămână, live, cu un mentor care face conversația joacă.{" "}
            <span className="font-serif italic text-gray-900">
              Nu curs. Prieteni.
            </span>
          </p>

          <DemoCta className="mt-8" />
          <p className="mt-3.5 text-sm text-gray-500">
            Prima lecție e gratuită, fără nicio obligație.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2">
            {facts.map((fact) => (
              <li
                key={fact}
                className={pillFact}
              >
                {fact}
              </li>
            ))}
          </ul>
        </div>

        {/* Pe telefon ilustrația vine DUPĂ mesaj: primul ecran trebuie să spună
            ce e clubul și să arate butonul, nu doar să fie frumos. Pe ecran lat
            grila o pune oricum în dreapta. */}
        <div>
          <div className="relative mx-auto w-fit">
            <img
              src="/assets/images/girl-video-call-friends-896.jpg"
              alt="Fetiță care râde în fața laptopului, la întâlnirea video cu prietenii ei din club"
              width={896}
              height={896}
              className="w-[19rem] rounded-2xl sm:w-[24rem] lg:w-full"
            />
            <div className="motion-safe:animate-rise absolute -left-2 bottom-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-md sm:-left-3 sm:bottom-8 sm:px-4 sm:py-2.5">
              <span className="block text-[0.68rem] font-semibold uppercase tracking-wider text-gray-500">
                Sofia, 8 ani
              </span>
              <span className="font-medium text-gray-900">
                Când ne mai vedem?
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
