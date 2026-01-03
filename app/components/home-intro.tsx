import ContactButton from "./contact-btn";
import SectionContainer from "./section-container";

export default function HomeIntro() {
  return (
    <SectionContainer>
      <div className="mx-auto max-w-2xl py-16 sm:py-32 lg:py-48">
        <div className="mb-4 sm:mb-8 sm:flex sm:justify-center">
          <div className="text-lg leading-6 font-semibold text-indigo-600">
            Curs online pentru copiii din <u>diaspora</u>
          </div>
        </div>
        <div className="text-center pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Păstrează legătura cu{" "}
            <span className="text-effect">limba română</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Ajutăm copiii din afara României și Moldovei să nu uite limba
            română. Activități interactive, povești, proverbe, ghicitori și
            jocuri care fac învățarea o bucurie.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <ContactButton />
            <a
              href="/#despre-curs"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Descoperă <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
