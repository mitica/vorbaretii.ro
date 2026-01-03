import CourseItems from "./course-items";

export default function AboutCourseSection() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <a id="despre-curs" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 grid-cols-1">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ce facem împreună?
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            <span className="font-medium">Întâlniri online săptămânale</span>{" "}
            unde copiii vorbesc, ascultă și învață româna într-un mod natural și
            distractiv. Fiecare copil are ocazia să povestească despre
            săptămâna lui, să descopere frumusețea limbii române prin proverbe,
            ghicitori și poezii.
          </p>
        </div>
        <CourseItems />
      </div>
    </div>
  );
}
