import type { Metadata } from "next";
import { Barlow_Condensed, Source_Sans_3 } from "next/font/google";
import { AudioProvider } from "@/contexts/audio-context";
import { TransportBackground } from "@/components/layout/transport-background";
import { Navbar } from "@/components/layout/navbar";
import { RadioPlayer } from "@/components/audio/radio-player";
import { AnnouncementOverlay } from "@/components/audio/announcement-overlay";
import "./globals.css";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source",
});

export const metadata: Metadata = {
  title: "Cross Track Bus — Réseau transport RP",
  description:
    "Portail officiel Cross Track Bus pour le serveur Arma 3 RP. Radio, annonces, billets et contrôle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${barlow.variable} ${sourceSans.variable}`}>
      <body className="antialiased">
        <AudioProvider>
          <TransportBackground />
          <Navbar />
          <main className="relative z-10 min-h-screen pb-28 pt-[4.5rem]">
            {children}
          </main>
          <RadioPlayer />
          <AnnouncementOverlay />
        </AudioProvider>
      </body>
    </html>
  );
}
