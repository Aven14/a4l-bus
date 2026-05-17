import type { Metadata } from "next";
import { AudioProvider } from "@/contexts/audio-context";
import { TransportBackground } from "@/components/layout/transport-background";
import { Navbar } from "@/components/layout/navbar";
import { RadioPlayer } from "@/components/audio/radio-player";
import { AnnouncementOverlay } from "@/components/audio/announcement-overlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrossBus — Réseau de transport RP",
  description:
    "Portail officiel CrossBus pour le serveur Arma 3 RP. Radio, annonces, billets et contrôle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AudioProvider>
          <TransportBackground />
          <Navbar />
          <main className="relative z-10 min-h-screen pb-24 pt-20">
            {children}
          </main>
          <RadioPlayer />
          <AnnouncementOverlay />
        </AudioProvider>
      </body>
    </html>
  );
}
