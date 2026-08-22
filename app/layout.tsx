import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Inter, Literata } from "next/font/google";
import { AppLifecycle } from "@/components/AppLifecycle";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const literata = Literata({ subsets: ["latin"], variable: "--font-literata", display: "swap" });
const plexMono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Livres à paraître",
  description: "Une liste personnelle pour suivre les livres à paraître et déjà disponibles.",
  applicationName: "Livres à paraître",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Mes livres" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F6F2" },
    { media: "(prefers-color-scheme: dark)", color: "#10181C" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${literata.variable} ${plexMono.variable}`}>
      <body>
        <AppLifecycle />
        {children}
      </body>
    </html>
  );
}
