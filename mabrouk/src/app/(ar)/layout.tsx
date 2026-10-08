import type { Metadata, Viewport } from "next";
import "../globals.css";
import { siteConfig } from "@/config/site";
import { fontVariables } from "../fonts";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "مبروك · دعوات زفاف رقمية فاخرة",
  description: "دعوة زفاف رقمية فاخرة بحركة وموسيقى، بالعربي والإنجليزي، برابط واحد على واتساب. جاهزة خلال ٧٢ ساعة.",
  alternates: { canonical: "/", languages: { ar: "/", en: "/en" } },
  openGraph: { siteName: "Mabrouk · مبروك", locale: "ar_EG", type: "website" },
};

export const viewport: Viewport = { themeColor: "#F8F2E7", width: "device-width", initialScale: 1 };

export default function ArabicRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
