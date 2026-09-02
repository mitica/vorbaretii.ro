import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
// Reactivează odată cu blocul Google Ads din <head>, la prima campanie.
// import Script from "next/script";
import "./globals.css";
import Footer from "./components/footer";
import Header from "./components/header";
import SwRegister from "./components/sw-register";
import config from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d6dbdc",
};

export const metadata: Metadata = {
  metadataBase: new URL(config.ROOT_PATH),
  title: "Club de socializare în română pentru copiii din diaspora - Vorbăreții.ro",
  description:
    "Grupul stabil de prieteni de aceeași vârstă — o oră pe săptămână, live, cu un mentor care face conversația joacă. Nu curs. Prieteni. Prima lecție demo e gratuită.",
  alternates: { canonical: "/" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Vorbăreții" },
  openGraph: {
    title: "Club de socializare în română pentru copiii din diaspora - Vorbăreții.ro",
    description:
      "Grupul stabil de prieteni de aceeași vârstă — o oră pe săptămână, live, cu un mentor care face conversația joacă. Nu curs. Prieteni. Prima lecție demo e gratuită.",
    images: [
      {
        url: "/assets/og/home.png",
        width: 1200,
        height: 630,
        alt: "Club de socializare în română pentru copiii din diaspora — Vorbăreții.ro",
      },
    ],
    siteName: "Vorbăreții.ro",
    type: "website",
    locale: "ro_RO",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Club de socializare în română pentru copiii din diaspora - Vorbăreții.ro",
    description:
      "Grupul stabil de prieteni de aceeași vârstă — o oră pe săptămână, live, cu un mentor care face conversația joacă.",
    images: ["/assets/og/home.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className="scroll-smooth focus:scroll-auto">
      <head>
        <link rel="apple-touch-icon" href="/assets/icons/icon-180.png" sizes="180x180" />
        <link rel="icon" href="/assets/icons/icon-512.png" type="image/png" sizes="512x512" />
        <link rel="icon" href="/assets/icons/icon-96.png" type="image/png" sizes="96x96" />
        <link rel="icon" href="/assets/icons/icon-32.png" type="image/png" sizes="32x32" />
        {/*
          Google Ads (AW-1054161076) — DEZACTIVAT 2026-09-01, până la prima campanie.

          Nu rulează campanii Ads acum, iar scriptul făcea o cerere către Google
          la fiecare încărcare de pagină și seta cookie-uri de publicitate
          degeaba — pe un site pentru părinți din UE, cu servicii pentru minori,
          exact genul de tracker care cere banner de consimțământ fără să aducă
          nimic. Singurul sistem de analiză folosit e Simple Analytics, mai jos
          în <body>.

          Ca să-l reactivezi: decomentează blocul ăsta ȘI importul lui Script
          din capul fișierului.

          <Script
            async
            src="https://www.googletagmanager.com/gtag/js?id=AW-1054161076"
            strategy="afterInteractive"
          />
          <Script id="google-ads" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-1054161076');
            `}
          </Script>
        */}
      </head>
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <SwRegister />

        <script async src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
      </body>
    </html>
  );
}
