import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans-hebrew/hebrew-400.css";
import "@fontsource/ibm-plex-sans-hebrew/hebrew-500.css";
import "@fontsource/ibm-plex-sans-hebrew/hebrew-600.css";
import "@fontsource/ibm-plex-sans-hebrew/latin-400.css";
import "@fontsource/ibm-plex-sans-hebrew/latin-500.css";
import "@fontsource/ibm-plex-sans-hebrew/latin-600.css";
import "@fontsource/frank-ruhl-libre/400.css";
import "@fontsource/frank-ruhl-libre/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "דשבורד פיננסי | העסק שלי",
  description: "סיכום הפעילות הפיננסית של העסק",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0c1724" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
