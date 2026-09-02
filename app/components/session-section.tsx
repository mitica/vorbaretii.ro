import CourseItems from "./course-items";

export default function SessionSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          O oră la club.
        </h2>

        <CourseItems className="mt-10" />

        <p className="mt-12 max-w-[46ch] text-pretty font-serif text-xl italic leading-relaxed text-gray-600 sm:text-2xl">
          Semnele se văd acasă: pomenește prietenii pe nume, scapă vorbe românești neîntrebat — iar
          apelul cu bunica sună, deodată, altfel.
        </p>
      </div>
    </section>
  );
}
