import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/header";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export const metadata: Metadata = {
  title: "Curs de socializare pentru copii - Vorbăreții.ro",
  description:
    "Curs online de socializare, învățare și jocuri inteligente pentru copii",
  openGraph: {
    title: "Curs de socializare pentru copii - Vorbăreții.ro",
    description:
      "Curs online de socializare, învățare și jocuri inteligente pentru copii",
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
      </head>
      <body className={inter.className}>
        <Header />
        <main className="mx-auto">{children}</main>
      </body>
    </html>
  );
}
