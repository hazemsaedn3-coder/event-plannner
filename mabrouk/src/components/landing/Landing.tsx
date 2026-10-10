import "./landing.css";
import { Suspense, type CSSProperties, type ReactNode } from "react";
import { t } from "@/lib/i18n";
import type { L10n, Locale } from "@/lib/types";
import { Divider, Star8 } from "@/templates/noor/v1/Ornaments";
import { noorThemes, themeStyle } from "@/templates/noor/v1/themes";
import { EmbossedPaper, WaxSeal } from "@/templates/layali/v1/Paper";
import { CatalogGallery, GallerySkeleton } from "./CatalogGallery";
import { FloatingWhatsApp } from "./FloatingWhatsApp";
import { copy, orderUrl } from "./copy";

/** The marketing site. Server-rendered and fully static; the only JS on the page is the iframe. */
export function Landing({ locale }: { locale: Locale }) {
  const c = copy(locale);
  const tr = (x: L10n) => t(x, locale);
  const home = locale === "ar" ? "/" : "/en";
  const other = locale === "ar" ? "/en" : "/";
  const orderPage = locale === "ar" ? "/order" : "/en/order";

  return (
    <div
      className="noor-bg min-h-[100svh] text-[var(--ink)]"
      style={themeStyle(noorThemes["ivory-gold"]) as CSSProperties}
    >
      <div className="noor-pattern pointer-events-none fixed inset-0" aria-hidden />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <a href={home} className="flex items-center gap-2">
            <Star8 size={18} className="text-[var(--accent)]" />
            <span className="f-display text-[26px] leading-none">{locale === "ar" ? "مبروك" : "Mabrouk"}</span>
          </a>
          <nav className="f-body hidden items-center gap-6 text-[15px] text-[var(--ink-soft)] md:flex">
            <a href="#designs">{tr(c.nav.designs)}</a>
            <a href="#pricing">{tr(c.nav.pricing)}</a>
            <a href="#faq">{tr(c.nav.faq)}</a>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href={other}
              hrefLang={locale === "ar" ? "en" : "ar"}
              lang={locale === "ar" ? "en" : "ar"}
              className="f-body rounded-full px-3 py-2 text-[14px] text-[var(--ink-soft)]"
            >
              {tr(c.nav.switchLang)}
            </a>
            <a
              href={orderUrl(locale)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tr(c.hero.chat)}
              className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#1f7a4d] text-white sm:flex"
            >
              <WhatsAppIcon size={16} />
            </a>
            <OrderButton href={orderPage} small>
              {tr(c.nav.order)}
            </OrderButton>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-12 pb-16 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div className="text-center md:text-start">
            <p className="f-display text-[16px] text-[var(--accent)] ltr:text-[14px] ltr:tracking-[0.25em] ltr:uppercase">{tr(c.hero.kicker)}</p>
            <h1 className="f-display mt-4 text-[42px] leading-[1.5] md:text-[58px] ltr:text-[44px] ltr:leading-[1.15] md:ltr:text-[60px]">{tr(c.hero.title)}</h1>
            <p className="f-body mx-auto mt-5 max-w-xl text-[18px] leading-relaxed text-[var(--ink-soft)] md:mx-0">
              {tr(c.hero.body)}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
              <OrderButton href={orderPage}>{tr(c.hero.cta)}</OrderButton>
              <WhatsAppButton href={orderUrl(locale)}>{tr(c.hero.chat)}</WhatsAppButton>
              <a
                href="/demo/noor-ivory-gold"
                target="_blank"
                className="f-body rounded-full border border-[var(--line)] px-6 py-3.5 text-[16px]"
              >
                {tr(c.hero.demo)}
              </a>
            </div>
            <p className="f-body mt-4 text-[15px] text-[var(--accent)]">{tr(c.hero.from)}</p>
          </div>

          <div className="relative flex flex-col items-center">
            {/* A sealed envelope floating beside the live invitation */}
            <div className="hero-float pointer-events-none absolute top-[14%] -start-2 z-0 hidden w-[190px] rotate-[-10deg] sm:block md:-start-10" aria-hidden>
              <MiniEnvelope />
            </div>
            <div className="absolute inset-x-6 top-[20%] bottom-[10%] -z-0 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(201,164,92,0.45), transparent)" }} aria-hidden />
            <div className="relative z-10">
              <PhoneFrame src="/demo/layali-velvet" title={tr(c.hero.demo)} />
            </div>
            <p className="f-body relative z-10 mt-4 text-[14px] text-[var(--ink-soft)]">{tr(c.hero.tryIt)}</p>
          </div>
        </section>

        {/* How it works */}
        <section className="reveal mx-auto max-w-6xl px-5 py-16">
          <SectionTitle>{tr(c.how.title)}</SectionTitle>
          <ol className="grid gap-5 md:grid-cols-3">
            {c.how.steps.map((s, i) => (
              <li key={i} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-7 text-center">
                <span className="f-display mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--accent)] text-[22px] text-[var(--accent)]">
                  {locale === "ar" ? (i + 1).toLocaleString("ar-EG") : i + 1}
                </span>
                <h3 className="f-display mt-4 text-[24px]">{tr(s.title)}</h3>
                <p className="f-body mt-2 text-[16px] leading-relaxed text-[var(--ink-soft)]">{tr(s.body)}</p>
              </li>
            ))}
          </ol>
          <div className="mt-16">
            <h3 className="f-display mb-8 text-center text-[30px] leading-tight">{tr(c.featureGrid.title)}</h3>
            <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3">
              {c.featureGrid.items.map((f, i) => (
                <li key={i} className="group rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 text-center transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-28px_rgba(58,46,34,0.6)]">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] transition group-hover:scale-110">
                    <FeatureIcon name={f.icon} />
                  </span>
                  <p className="f-display mt-3 text-[19px] leading-snug">{tr(f.t)}</p>
                  <p className="f-body mt-1 text-[14px] leading-relaxed text-[var(--ink-soft)]">{tr(f.d)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Designs (live catalog, managed in /admin) */}
        <section id="designs" className="reveal mx-auto max-w-6xl scroll-mt-20 py-16">
          <div className="px-5">
            <SectionTitle sub={tr(c.designs.body)}>{tr(c.designs.title)}</SectionTitle>
          </div>
          <Suspense fallback={<GallerySkeleton />}>
            <CatalogGallery locale={locale} />
          </Suspense>
        </section>

        {/* Two ways to order */}
        <section id="order" className="reveal mx-auto max-w-5xl scroll-mt-20 px-5 py-16">
          <SectionTitle>{tr(c.paths.title)}</SectionTitle>
          <div className="grid gap-5 md:grid-cols-2">
            <a href={orderPage} className="group relative overflow-hidden rounded-[26px] border border-[var(--accent)] bg-[var(--surface)] p-8 shadow-[0_24px_50px_-34px_rgba(58,46,34,0.6)] transition hover:-translate-y-1">
              <span className="absolute -end-12 -top-12 h-40 w-40 rounded-full bg-[var(--accent-soft)] blur-2xl transition duration-500 group-hover:scale-125" aria-hidden />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)]">
                <Star8 size={20} />
              </span>
              <h3 className="f-display relative mt-4 text-[28px]">{tr(c.paths.onlineTitle)}</h3>
              <p className="f-body relative mt-2 text-[16px] leading-relaxed text-[var(--ink-soft)]">{tr(c.paths.onlineBody)}</p>
              <span className="f-body relative mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#C9A45C] to-[#A9823C] px-6 py-3 text-[16px] font-semibold text-white">
                {tr(c.hero.cta)} <span aria-hidden className="rtl:rotate-180">→</span>
              </span>
            </a>
            <a href={orderUrl(locale)} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--surface)]/80 p-8 transition hover:-translate-y-1">
              <span className="absolute -end-12 -top-12 h-40 w-40 rounded-full bg-[#1f7a4d]/10 blur-2xl transition duration-500 group-hover:scale-125" aria-hidden />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#1f7a4d] text-white">
                <WhatsAppIcon size={22} />
              </span>
              <h3 className="f-display relative mt-4 text-[28px]">{tr(c.paths.chatTitle)}</h3>
              <p className="f-body relative mt-2 text-[16px] leading-relaxed text-[var(--ink-soft)]">{tr(c.paths.chatBody)}</p>
              <span className="f-body relative mt-6 inline-flex items-center gap-2 rounded-full bg-[#1f7a4d] px-6 py-3 text-[16px] font-semibold text-white">
                <WhatsAppIcon size={16} /> {tr(c.hero.chat)}
              </span>
            </a>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="reveal mx-auto max-w-4xl scroll-mt-20 px-5 py-16">
          <SectionTitle>{tr(c.pricing.title)}</SectionTitle>
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div className="rounded-[26px] border border-[var(--accent)] bg-[var(--surface)] p-8 text-center shadow-[0_20px_50px_-30px_rgba(58,46,34,0.45)]">
              <h3 className="f-display text-[26px]">{tr(c.pricing.plan)}</h3>
              <div className="mt-5 flex items-end justify-center gap-6">
                <div>
                  <p className="f-display text-[42px] leading-none">{c.pricing.base.egp}</p>
                  <p className="f-body mt-1 text-[14px] text-[var(--ink-soft)]">{tr(c.pricing.egypt)}</p>
                </div>
                <span className="mb-6 h-10 w-px bg-[var(--line)]" />
                <div>
                  <p className="f-display text-[42px] leading-none">{c.pricing.base.usd}</p>
                  <p className="f-body mt-1 text-[14px] text-[var(--ink-soft)]">{tr(c.pricing.abroad)}</p>
                </div>
              </div>
              <ul className="f-body mt-7 space-y-2.5 text-start text-[16px]">
                {c.pricing.includes.map((x, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Star8 size={12} className="mt-1.5 shrink-0 text-[var(--accent)]" />
                    {tr(x)}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <OrderButton href={orderPage}>{tr(c.hero.cta)}</OrderButton>
              </div>
            </div>
            <div className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)]/70 p-8">
              <h3 className="f-display text-[22px]">{tr(c.pricing.addOnsTitle)}</h3>
              <ul className="f-body mt-4 divide-y divide-[var(--line)] text-[16px]">
                {c.pricing.addOns.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-4 py-3">
                    <span>{tr(a.label)}</span>
                    <span className="shrink-0 text-end text-[14px] text-[var(--accent)]">
                      +{a.egp}
                      <br />
                      <span className="text-[var(--ink-soft)]">+{a.usd}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="f-body mt-5 text-[14px] leading-relaxed text-[var(--ink-soft)]">{tr(c.pricing.payment)}</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="reveal mx-auto max-w-3xl scroll-mt-20 px-5 py-16">
          <SectionTitle>{tr(c.faq.title)}</SectionTitle>
          <div className="flex flex-col gap-3">
            {c.faq.items.map((item, i) => (
              <details key={i} className="group rounded-[18px] border border-[var(--line)] bg-[var(--surface)] px-6 py-4">
                <summary className="f-display flex cursor-pointer list-none items-center justify-between gap-4 text-[20px] [&::-webkit-details-marker]:hidden">
                  {tr(item.q)}
                  <span className="text-[var(--accent)] transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="f-body mt-3 text-[16px] leading-relaxed text-[var(--ink-soft)]">{tr(item.a)}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 py-20 text-center">
          <Divider />
          <h2 className="f-display mt-6 text-[38px]">{tr(c.final.title)}</h2>
          <p className="f-body mt-2 text-[18px] text-[var(--ink-soft)]">{tr(c.final.body)}</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <OrderButton href={orderPage}>{tr(c.hero.cta)}</OrderButton>
            <WhatsAppButton href={orderUrl(locale)}>{tr(c.hero.chat)}</WhatsAppButton>
          </div>
        </section>
      </main>

      <FloatingWhatsApp href={orderUrl(locale)} label={tr(c.hero.chat)} />

      <footer className="relative border-t border-[var(--line)] px-5 py-8 pb-24 text-center">
        <p className="f-body text-[14px] text-[var(--ink-soft)]">
          © {/* static year keeps the page fully prerendered */}2026 {tr(c.footer.rights)}
        </p>
      </footer>
    </div>
  );
}

function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="f-display text-[38px] leading-tight">{children}</h2>
      <Divider className="mt-3" />
      {sub && <p className="f-body mx-auto mt-4 max-w-xl text-[17px] text-[var(--ink-soft)]">{sub}</p>}
    </div>
  );
}

function OrderButton({ href, children, small }: { href: string; children: ReactNode; small?: boolean }) {
  return (
    <a
      href={href}
      className={`f-body inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#C9A45C] to-[#A9823C] font-semibold text-white shadow-[0_12px_26px_-12px_rgba(169,130,60,0.9)] transition hover:brightness-105 ${
        small ? "px-4 py-2 text-[14px]" : "px-7 py-3.5 text-[17px]"
      }`}
    >
      {!small && <Star8 size={14} />}
      {children}
    </a>
  );
}

function WhatsAppIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z" />
    </svg>
  );
}

function WhatsAppButton({ href, children, small }: { href: string; children: ReactNode; small?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`f-body inline-flex items-center justify-center gap-2 rounded-full bg-[#1f7a4d] font-semibold text-white shadow-sm transition hover:bg-[#19663f] ${
        small ? "px-4 py-2 text-[14px]" : "px-7 py-3.5 text-[17px]"
      }`}
    >
      <svg width={small ? 16 : 20} height={small ? 16 : 20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z" />
      </svg>
      {children}
    </a>
  );
}

/** A phone mock with the live demo invitation running inside. */
function PhoneFrame({ src, title }: { src: string; title: string }) {
  // The invitation is designed at 375×812; scale it into the frame.
  const scale = 0.74;
  return (
    <div
      className="relative rounded-[46px] border border-black/10 bg-[#1b1714] p-[10px] shadow-[0_40px_80px_-30px_rgba(58,46,34,0.6)]"
      style={{ width: 375 * scale + 20, height: 812 * scale + 20 }}
    >
      <div className="absolute top-[14px] left-1/2 z-10 h-[22px] w-[90px] -translate-x-1/2 rounded-full bg-[#1b1714]" />
      <div className="h-full w-full overflow-hidden rounded-[36px] bg-[#f8f2e7]">
        <iframe
          src={src}
          title={title}
          loading="lazy"
          width={375}
          height={812}
          className="origin-top-left border-0 rtl:origin-top-right"
          style={{ transform: `scale(${scale})`, width: 375, height: 812 }}
        />
      </div>
    </div>
  );
}

/** A small sealed Layali envelope, used as decoration next to the hero phone. */
function MiniEnvelope() {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] shadow-[0_30px_50px_-20px_rgba(58,30,20,0.6)]">
      <EmbossedPaper uid="hero-env" motif="lace" color="#C6A15A" scale={0.55} />
      <div className="absolute inset-x-0 top-0 h-[62%]" style={{ clipPath: "polygon(0 0,100% 0,50% 100%)", filter: "drop-shadow(0 6px 8px rgba(0,0,0,.35))" }}>
        <EmbossedPaper uid="hero-env-f" motif="lace" color="#CFAB63" scale={0.55} relief={4} />
      </div>
      <div className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ filter: "drop-shadow(0 5px 6px rgba(0,0,0,.4))" }}>
        <WaxSeal uid="hero-env-s" colors={["#F3B6BE", "#9E2A3E", "#5A1020"]} monogram="م" size={58} />
      </div>
    </div>
  );
}

function FeatureIcon({ name }: { name: string }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "envelope":
      return (
        <svg {...p}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 7l9 6 9-6" />
          <circle cx="12" cy="13" r="2" fill="currentColor" />
        </svg>
      );
    case "clock":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      );
    case "pin":
      return (
        <svg {...p}>
          <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
      );
    case "photos":
      return (
        <svg {...p}>
          <rect x="3" y="5" width="14" height="14" rx="2" />
          <path d="M7 19V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8" />
          <path d="M3 15l4-4 4 4 3-3 3 3" />
        </svg>
      );
    case "check":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8 12.5l2.7 2.7L16.5 9" />
        </svg>
      );
    case "music":
      return (
        <svg {...p}>
          <path d="M9 18V5l11-2v13" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="17.5" cy="16" r="2.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...p}>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4M8 14h3M8 17h6" />
        </svg>
      );
    case "share":
      return (
        <svg {...p}>
          <circle cx="18" cy="5.5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="18.5" r="2.5" />
          <path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5z" />
        </svg>
      );
  }
}
