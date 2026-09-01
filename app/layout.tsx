import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Footer from "./components/footer";
import Header from "./components/header";
import config from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export const metadata: Metadata = {
  metadataBase: new URL(config.ROOT_PATH),
  title: "Club de socializare în română pentru copiii din diaspora - Vorbăreții.ro",
  description:
    "Grupul stabil de prieteni de aceeași vârstă — o oră pe săptămână, live, cu un mentor care face conversația joacă. Nu curs. Prieteni. Prima lecție demo e gratuită.",
  openGraph: {
    title: "Club de socializare în română pentru copiii din diaspora - Vorbăreții.ro",
    description:
      "Grupul stabil de prieteni de aceeași vârstă — o oră pe săptămână, live, cu un mentor care face conversația joacă. Nu curs. Prieteni. Prima lecție demo e gratuită.",
    images: [
      { url: "/assets/images/vorbaretii-home-page.png", alt: "Vorbăreții.ro" }
    ],
    siteName: "Vorbăreții.ro"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className="scroll-smooth focus:scroll-auto">
      <head>
        <link
          rel="apple-touch-icon"
          href="/assets/icons/icon-180.png"
          sizes="180x180"
        />
        <link
          rel="icon"
          href="/assets/icons/icon-512.png"
          type="image/png"
          sizes="512x512"
        />
        <link
          rel="icon"
          href="/assets/icons/icon-96.png"
          type="image/png"
          sizes="96x96"
        />
        <link
          rel="icon"
          href="/assets/icons/icon-32.png"
          type="image/png"
          sizes="32x32"
        />
<Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-1054161076"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-1054161076');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />

        <script async src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
      </body>
    </html>
  );
}
