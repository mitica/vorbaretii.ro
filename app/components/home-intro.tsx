import SectionBgEffect from "./section-bg-effect";

export default function HomeIntro() {
  return (
    <div className="relative isolate px-8 pt-14">
      <SectionBgEffect />
      <div className="mx-auto max-w-2xl py-16 sm:py-32 lg:py-48">
        <div className="mb-4 sm:mb-8 sm:flex sm:justify-center">
          <div className="text-lg leading-6 font-semibold text-indigo-600">
            Curs online pentru copii
          </div>
        </div>
        <div className="text-center pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Comunicare, învățare și multe{" "}
            <span className="text-effect">jocuri inteligente</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Oferim un mediu prietenos și distractiv pentru copii, unde aceștia
            pot comunica, învăța subiecte noi și dezvolta abilități sociale.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/#contact"
              className="rounded-md bg-pink-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Contactează-ne
            </a>
            <a
              href="/#despre-curs"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Despre curs <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
      <div
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
          }}
        />
      </div>
    </div>
  );
}
