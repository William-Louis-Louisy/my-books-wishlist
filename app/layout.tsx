import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AppLifecycle } from "@/components/AppLifecycle";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { PwaInstallProvider } from "@/components/PwaInstallProvider";
import { IBM_Plex_Mono, Inter, Literata } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

const themeInitScript = `(function(){try{var t=localStorage.getItem("book-wishlist:theme");if(t==="light"||t==="dark"||t==="system"){document.documentElement.dataset.theme=t}}catch(_){}})();`;

export const metadata: Metadata = {
  title: "Book Wishlist",
  description:
    "A personal wishlist for tracking upcoming, available and purchased books.",
  applicationName: "Book Wishlist",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Book Wishlist",
  },
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

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${literata.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <LocaleProvider>
          <ThemeProvider>
            <PwaInstallProvider>
              <AppLifecycle />
              {children}
            </PwaInstallProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
