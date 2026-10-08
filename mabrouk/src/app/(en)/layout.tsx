import type { Metadata, Viewport } from "next";
import "../globals.css";
import { siteConfig } from "@/config/site";
import { fontVariables } from "../fonts";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "Mabrouk · Premium digital wedding invitations",
  description:
    "Elegant animated wedding invitation websites with music, in Arabic and English, shared as one WhatsApp link. Ready in 72 hours.",
  alternates: { canonical: "/en", languages: { ar: "/", en: "/en" } },
  openGraph: { siteName: "Mabrouk · مبروك", locale: "en_US", type: "website" },
};

export const viewport: Viewport = { themeColor: "#F8F2E7", width: "device-width", initialScale: 1 };

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
