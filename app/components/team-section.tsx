/* eslint-disable @next/next/no-img-element */

export default function TeamSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Mentorul
        </p>

        <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border border-gray-200">
            <img
              className="h-full w-full object-cover object-center"
              src="/assets/images/lia-face-2-256.jpg"
              alt="Lia Cantea, fondatoare și mentor la Vorbăreții"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Lia Cantea
            </h2>
            <p className="mt-1.5 font-semibold text-indigo-600">
              Fondatoare și mentor
            </p>
            <p className="mt-4 max-w-[54ch] text-pretty text-lg leading-8 text-gray-600">
              Absolventă de jurnalism și comunicare publică (ULIM), Lia știe cum
              să facă orice copil să vorbească — și să-i placă. La ea, până și
              cel mai retras copil găsește, în câteva ședințe, curajul să spună
              o poveste.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
