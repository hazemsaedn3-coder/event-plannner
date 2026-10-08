import type { CSSProperties, ReactNode } from "react";
import { t } from "@/lib/i18n";
import type { L10n, Locale, ThemeId } from "@/lib/types";
import { ArchFrame, Divider, Star8 } from "@/templates/noor/v1/Ornaments";
import { noorThemes, themeStyle } from "@/templates/noor/v1/themes";
import { copy, DEMO_SLUGS, orderUrl } from "./copy";

/** The marketing site. Server-rendered and fully static; the only JS on the page is the iframe. */
export function Landing({ locale }: { locale: Locale }) {
  const c = copy(locale);
  const tr = (x: L10n) => t(x, locale);
  const home = locale === "ar" ? "/" : "/en";
  const other = locale === "ar" ? "/en" : "/";

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
            <WhatsAppButton href={orderUrl(locale)} small>
              {tr(c.nav.order)}
            </WhatsAppButton>
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
              <WhatsAppButton href={orderUrl(locale)}>{tr(c.hero.cta)}</WhatsAppButton>
              <a
                href={`/i/${DEMO_SLUGS["ivory-gold"]}`}
                target="_blank"
                className="f-body rounded-full border border-[var(--line)] px-6 py-3.5 text-[16px]"
              >
                {tr(c.hero.demo)}
              </a>
            </div>
            <p className="f-body mt-4 text-[15px] text-[var(--accent)]">{tr(c.hero.from)}</p>
          </div>

          <div className="flex flex-col items-center">
            <PhoneFrame src={`/i/${DEMO_SLUGS["ivory-gold"]}`} title={tr(c.hero.demo)} />
            <p className="f-body mt-4 text-[14px] text-[var(--ink-soft)]">{tr(c.hero.tryIt)}</p>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-5 py-16">
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
          <ul className="f-body mx-auto mt-10 grid max-w-4xl gap-x-8 gap-y-3 text-[16px] sm:grid-cols-2 md:grid-cols-3">
            {c.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <Star8 size={12} className="mt-1.5 shrink-0 text-[var(--accent)]" />
                {tr(f)}
              </li>
            ))}
          </ul>
        </section>

        {/* Designs */}
        <section id="designs" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <SectionTitle sub={tr(c.designs.body)}>{tr(c.designs.title)}</SectionTitle>
          <div className="grid gap-6 md:grid-cols-3">
            {(Object.keys(DEMO_SLUGS) as ThemeId[]).map((id) => {
              const theme = noorThemes[id];
              const designName = `${tr(c.designs.templateName)} — ${tr(theme.name)}`;
              return (
                <article key={id} className="flex flex-col items-center">
                  <a href={`/i/${DEMO_SLUGS[id]}`} target="_blank" className="block w-full max-w-[320px]" aria-label={`${tr(c.designs.live)}: ${designName}`}>
                    <ThemePoster themeId={id} locale={locale} />
                  </a>
                  <h3 className="f-display mt-5 text-[24px]">{designName}</h3>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <a
                      href={`/i/${DEMO_SLUGS[id]}`}
                      target="_blank"
                      className="f-body rounded-full border border-[var(--line)] px-5 py-2.5 text-[15px]"
                    >
                      {tr(c.designs.live)}
                    </a>
                    <WhatsAppButton href={orderUrl(locale, designName)} small>
                      {tr(c.designs.order)}
                    </WhatsAppButton>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-4xl scroll-mt-20 px-5 py-16">
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
                <WhatsAppButton href={orderUrl(locale)}>{tr(c.hero.cta)}</WhatsAppButton>
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
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-16">
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
          <div className="mt-7">
            <WhatsAppButton href={orderUrl(locale)}>{tr(c.hero.cta)}</WhatsAppButton>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-[var(--line)] px-5 py-8 text-center">
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

/** Static mini poster of a theme (no iframe, so the gallery stays light). */
function ThemePoster({ themeId, locale }: { themeId: ThemeId; locale: Locale }) {
  const theme = noorThemes[themeId];
  return (
    <div
      lang={locale}
      className="noor-bg relative aspect-[3/4] overflow-hidden rounded-[28px] border border-[var(--line)] text-[var(--ink)] shadow-[0_30px_60px_-35px_rgba(0,0,0,0.5)] transition hover:-translate-y-1"
      style={themeStyle(theme) as CSSProperties}
    >
      <div className="noor-pattern absolute inset-0" aria-hidden />
      <ArchFrame className="absolute inset-x-6 top-6 bottom-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)]" />
      <div className="relative flex h-full flex-col items-center justify-center px-10 text-center">
        <Star8 size={16} className="text-[var(--accent)]" />
        <p className="f-names mt-4 text-[44px] leading-[1.1]">{locale === "ar" ? "عمر" : "Omar"}</p>
        <p className="f-names text-[26px] leading-none text-[var(--accent)]">{locale === "ar" ? "و" : "&"}</p>
        <p className="f-names text-[44px] leading-[1.1]">{locale === "ar" ? "ليلى" : "Laila"}</p>
        <Divider className="mt-5" />
        <p className="f-display mt-3 text-[18px] tracking-[0.15em]" dir="ltr">
          17 · 06 · 2027
        </p>
        {/* wax seal accent */}
        <span
          className="mt-6 block h-10 w-10 rounded-full shadow-md"
          style={{ background: `radial-gradient(circle at 35% 30%, ${theme.colors.seal}, ${theme.colors.sealDark})` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
