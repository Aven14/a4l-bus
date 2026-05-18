import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AudioProvider } from "@/contexts/audio-context";
import { TransportBackground } from "@/components/layout/transport-background";
import { Navbar } from "@/components/layout/navbar";
import { getCurrentUser, ensureBootstrapAdmin } from "@/lib/session";
import { RadioPlayer } from "@/components/audio/radio-player";
import { AnnouncementOverlay } from "@/components/audio/announcement-overlay";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Cross Track Bus — Réseau transport RP",
  description:
    "Portail officiel Cross Track Bus pour le serveur Arma 3 RP. Radio, annonces, billets et contrôle.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureBootstrapAdmin();
  const user = await getCurrentUser();

  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="antialiased">
        <AudioProvider>
          <TransportBackground />
          <Navbar user={user} />
          <main className="relative z-10 min-h-screen pb-28 pt-[7.25rem] md:pt-24">
            {children}
          </main>
          <RadioPlayer />
          <AnnouncementOverlay />
        </AudioProvider>
      </body>
    </html>
  );
}
