import type { Metadata } from "next";
import { eyebrow } from "@/app/components/ui";
import DailyCard from "./daily-card";

const pageTitle = "Cartea de azi — cinci minute în română, cu copilul";
const pageDescription =
  "O ghicitoare, o întrebare de povestit și o frământare de limbă, în fiecare zi. De făcut împreună, în cinci minute. Fără cont, fără instalare.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/azi" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    siteName: "Vorbăreții.ro",
    type: "website",
    locale: "ro_RO",
    url: "/azi",
  },
};

/**
 * Casa ritualului zilnic: cartea de azi și butonul care o dă mai departe.
 * Pagina e server-side goală de „azi" — ziua o află clientul (export static).
 */
export default function TodayPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-12 pt-5 sm:px-6 sm:pt-10">
      <header>
        <p className={eyebrow}>Cinci minute, în fiecare zi</p>
        <h1 className="mt-1 text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Cartea de azi
        </h1>
        <p className="mt-2 max-w-[46ch] text-pretty text-sm leading-relaxed text-gray-600 sm:mt-3 sm:text-base">
          Trei lucruri de făcut împreună — copilul și un om mare. Aceeași carte pentru toți, azi;
          mâine, alta.
        </p>
      </header>

      <DailyCard />

      <p className="mt-4 text-pretty text-sm leading-relaxed text-gray-500">
        Nimic nu se salvează: fără cont, fără serii, fără «ai sărit trei zile».
      </p>
    </div>
  );
}
