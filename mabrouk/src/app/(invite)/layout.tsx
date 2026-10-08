import type { Metadata } from "next";
import "../globals.css";
import { siteConfig } from "@/config/site";
import { fontVariables } from "../fonts";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  robots: { index: false, follow: false },
};

/**
 * Root layout for invitations and host dashboards. Arabic/RTL by default;
 * templates switch <html lang/dir> client-side when the guest toggles language.
 */
export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
