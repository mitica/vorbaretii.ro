import SectionTopBgEffect from "./section-top-bg-effect";

export default function CourseGroupsSection() {
  return (
    <div className="relative py-16 sm:py-24">
      <a id="grupe" />
      <SectionTopBgEffect />
      <div className="mx-auto grid gap-10 px-6 grid-cols-1 max-w-4xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Cum funcționează?
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Întâlniri online simple și eficiente pentru copiii din toată lumea
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">📅</div>
            <div className="text-2xl font-bold text-indigo-600">1×</div>
            <div className="text-gray-600 mt-1">pe săptămână</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">⏱️</div>
            <div className="text-2xl font-bold text-indigo-600">~1 oră</div>
            <div className="text-gray-600 mt-1">per sesiune</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">👧👦</div>
            <div className="text-2xl font-bold text-indigo-600">max 10</div>
            <div className="text-gray-600 mt-1">copii în grup</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-50 to-indigo-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            🎯 Pentru copii de la 7 ani
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Întâlnirile se desfășoară <span className="font-medium">seara</span>
            , pentru a fi accesibile copiilor din diferite fusuri orare.
            <br />
            <span className="text-indigo-600 font-medium">
              Orele exacte le stabilim împreună
            </span>
            , în funcție de disponibilitatea copiilor înscriși.
          </p>
        </div>

        <div className="text-center text-gray-500 text-sm">
          💡 Cursurile se desfășoară online prin Zoom sau Google Meet
        </div>
      </div>
    </div>
  );
}
