import { Suspense, type CSSProperties, type ReactNode } from "react";
import { getPublishedTemplates } from "@/catalog/read";
import { TemplatePoster } from "@/components/catalog/TemplatePoster";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/links";
import { Star8 } from "@/templates/noor/v1/Ornaments";
import { noorThemes, themeStyle } from "@/templates/noor/v1/themes";
import { OT } from "./copy";
import { OrderFlow, WhatsIcon } from "./OrderFlow";

export function chatUrl(locale: "ar" | "en", extra = "") {
  const base = locale === "ar" ? "مرحباً مبروك 👋\nحابب أطلب دعوة فرح." : "Hi Mabrouk 👋\nI'd like to order a wedding invitation.";
  return whatsappUrl(extra ? `${base}\n${extra}` : base, siteConfig.whatsappNumber);
}

/** Shared frame for the order pages: the brand's ivory-gold look and a slim header. */
export function OrderShell({ locale, children, switchHref }: { locale: "ar" | "en"; children: ReactNode; switchHref: string }) {
  const home = locale === "ar" ? "/" : "/en";
  return (
    <div className="noor-bg min-h-[100svh] text-[var(--ink)]" style={themeStyle(noorThemes["ivory-gold"]) as CSSProperties}>
      <div className="noor-pattern pointer-events-none fixed inset-0" aria-hidden />
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <a href={home} className="flex items-center gap-2">
            <Star8 size={18} className="text-[var(--accent)]" />
            <span className="f-display text-[26px] leading-none">{locale === "ar" ? "مبروك" : "Mabrouk"}</span>
          </a>
          <div className="flex items-center gap-1.5">
            <a href={`${home}#designs`} className="f-body hidden rounded-full px-3 py-2 text-[14px] text-[var(--ink-soft)] sm:block">
              {locale === "ar" ? "التصاميم" : "Designs"}
            </a>
            <a href={switchHref} className="f-body rounded-full px-3 py-2 text-[14px] text-[var(--ink-soft)]" lang={locale === "ar" ? "en" : "ar"}>
              {locale === "ar" ? "English" : "عربي"}
            </a>
            <a
              href={chatUrl(locale)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={OT[locale].chatCta}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f7a4d] text-white"
            >
              <WhatsIcon size={18} />
            </a>
          </div>
        </div>
      </header>
      <main className="relative">{children}</main>
    </div>
  );
}

async function Flow({ locale, searchParams }: { locale: "ar" | "en"; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [templates, sp] = await Promise.all([getPublishedTemplates(), searchParams]);
  const wanted = typeof sp.template === "string" ? sp.template : null;
  const initial = wanted && templates.some((t) => t.id === wanted) ? wanted : null;
  return (
    <OrderFlow
      locale={locale}
      initialTemplate={initial}
      whatsappHref={chatUrl(locale)}
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name[locale],
        description: t.description[locale],
        demoHref: `/demo/${t.id}`,
        poster: <TemplatePoster template={t} locale={locale} className="border border-[var(--line)]" />,
      }))}
    />
  );
}

export function OrderPage({ locale, searchParams }: { locale: "ar" | "en"; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <OrderShell locale={locale} switchHref={locale === "ar" ? "/en/order" : "/order"}>
      <Suspense fallback={<div className="mx-auto mt-24 h-40 max-w-3xl animate-pulse rounded-[28px] bg-[var(--accent-soft)]" />}>
        <Flow locale={locale} searchParams={searchParams} />
      </Suspense>
    </OrderShell>
  );
}
