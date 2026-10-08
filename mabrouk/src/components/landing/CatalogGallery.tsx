import { orderMessage } from "@/catalog/demo";
import { getPublishedTemplates } from "@/catalog/read";
import { TemplatePoster } from "@/components/catalog/TemplatePoster";
import { absoluteUrl, siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/links";
import type { Locale } from "@/lib/types";
import { copy } from "./copy";
import { ShareButton } from "./ShareButton";

/**
 * Template showcase. Swipeable carousel on phones, grid on larger screens.
 * Content comes from the catalog (edited in /admin) and is cached until the
 * admin saves a change.
 */
export async function CatalogGallery({ locale }: { locale: Locale }) {
  const c = copy(locale);
  const templates = await getPublishedTemplates();
  if (!templates.length) return <p className="f-body px-5 text-center text-[var(--ink-soft)]">{c.designs.empty[locale]}</p>;

  return (
    <ul className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
      {templates.map((t) => {
        const name = t.name[locale];
        const demo = `/demo/${t.id}`;
        const url = absoluteUrl(demo);
        return (
          <li key={t.id} className="w-[78vw] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none">
            <article className="group flex h-full flex-col">
              <a href={demo} className="block rounded-[26px] shadow-[0_30px_60px_-35px_rgba(0,0,0,0.5)] transition duration-300 group-hover:-translate-y-1" aria-label={`${c.designs.live[locale]}: ${name}`}>
                <TemplatePoster template={t} locale={locale} className="border border-[var(--line)]" />
              </a>
              <h3 className="f-display mt-4 text-[23px] leading-snug">{name}</h3>
              {t.description[locale] && <p className="f-body mt-1 line-clamp-2 text-[15px] text-[var(--ink-soft)]">{t.description[locale]}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a href={demo} className="f-body rounded-full bg-[var(--ink)] px-5 py-2.5 text-[15px] text-[var(--bg)] transition hover:opacity-90">
                  ▶ {c.designs.live[locale]}
                </a>
                <a
                  href={whatsappUrl(orderMessage(name, locale, url), siteConfig.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="f-body rounded-full bg-[#1f7a4d] px-4 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#19663f]"
                >
                  {t.ctaText[locale] || c.designs.order[locale]}
                </a>
                <ShareButton url={url} title={name} label={c.designs.share[locale]} copied={c.designs.copied[locale]} />
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

export function GallerySkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden px-5 md:grid md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="aspect-[3/4] w-[78vw] max-w-[320px] shrink-0 animate-pulse rounded-[26px] bg-[var(--accent-soft)] md:w-auto md:max-w-none" />
      ))}
    </div>
  );
}
