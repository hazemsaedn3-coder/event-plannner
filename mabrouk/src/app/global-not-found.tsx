import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { fontVariables } from "./fonts";

export const metadata: Metadata = {
  title: "404 · Mabrouk",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ar" dir="rtl" className={fontVariables}>
      <body>
        <NotFoundBody />
      </body>
    </html>
  );
}

export function NotFoundBody() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center gap-3 bg-[#f8f2e7] px-8 text-center text-[#3a2e22]">
      <p lang="ar" className="f-display text-[34px]">الصفحة غير موجودة</p>
      <p lang="en" className="f-body text-[18px] text-[#7a6a55]">This page doesn&apos;t exist.</p>
      <Link href="/" className="f-body mt-6 rounded-full border border-[#d9c9a8] px-5 py-2.5 text-[15px]">
        مبروك · Mabrouk
      </Link>
    </main>
  );
}
