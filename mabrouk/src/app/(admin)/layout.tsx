import type { Metadata, Viewport } from "next";
import "../globals.css";
import { fontVariables } from "../fonts";

export const metadata: Metadata = {
  title: "Mabrouk Admin",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const viewport: Viewport = { themeColor: "#F8F2E7", width: "device-width", initialScale: 1 };

/** Root layout for the admin panel (English, left-to-right). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={fontVariables}>
      <body className="admin min-h-[100svh] bg-[#F6F3EE] font-sans text-[#2A2420] antialiased">{children}</body>
    </html>
  );
}
