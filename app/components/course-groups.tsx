import SectionBgEffect from "./section-bg-effect";

/* eslint-disable @next/next/no-img-element */
export default function CourseGroups() {
  const items = [
    {
      title: "7 - 9 ani",
      description: "Pentru a prinde curaj",
      image:
        "https://tailwindui.com/img/ecommerce-images/home-page-02-edition-01.jpg"
    },
    {
      title: "10 - 14 ani",
      description: "Pentru dezvoltare",
      image:
        "https://tailwindui.com/img/ecommerce-images/home-page-02-edition-01.jpg"
    }
  ];

  return (
    <div className="relative py-16 sm:py-24">
      <a id="grupe" />
      <SectionBgEffect />
      <div className="mx-auto grid gap-10 px-6 grid-cols-1">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Grupe
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            2 grupe de vârstă pentru a prinde curaj și pentru dezvoltare.
          </p>
        </div>
        <div className="mx-auto px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-10 gap-y-8 text-center lg:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.title}
                className="mx-auto flex max-w-xs flex-col gap-y-2"
              >
                <dt className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                  {item.title}
                </dt>
                <dd className="text-sm font-semibold leading-6 text-indigo-600">
                  {item.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-2 text-lg text-gray-600 text-center max-w-7xl mx-auto">
          Orele se desfășoară de luni până vineri, 15:00 - 19:00, în grupuri de
          maxim 10 copii.
          <br />
          Fiecare grupă participă la o sesiune săptămânală de o oră.
        </p>
      </div>
    </div>
  );
}
