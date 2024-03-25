import CourseItems from "./course-items";

export default function AboutCourse() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <a id="despre-curs" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 grid-cols-1">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Despre curs
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            <span className="font-medium">Curs online</span> de socializare
            pentru copii, cu accent pe comunicare și învățare. Acest curs este
            conceput pentru a-i ajuta pe copii să-și dezvolte abilitățile de
            ascultare activă și de exprimare clară a gândurilor și
            sentimentelor.
          </p>
        </div>
        <CourseItems />
      </div>
    </div>
  );
}
