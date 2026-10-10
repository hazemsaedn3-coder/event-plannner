import { getPublishedTemplates } from "@/catalog/read";
import { DeviceCard } from "./DeviceCard";
import { FilterableGrid } from "./FilterableGrid";
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

  const groups = [
    { id: "layali", label: c.designs.groups.layali[locale] },
    { id: "khaliji", label: c.designs.groups.khaliji[locale] },
    { id: "saeedi", label: c.designs.groups.saeedi[locale] },
    { id: "duo", label: c.designs.groups.duo[locale] },
    { id: "noor", label: c.designs.groups.noor[locale] },
    { id: "html", label: c.designs.groups.html[locale] },
  ];

  return (
    <FilterableGrid
      allLabel={c.designs.groups.all[locale]}
      groups={groups}
      items={templates.map((t) => {
        const name = t.name[locale];
        const demo = `/demo/${t.id}`;
        const url = absoluteUrl(demo);
        return {
          key: t.id,
          group: t.kind === "layali" && (t.layali?.look === "khaliji" || t.layali?.look === "saeedi") ? t.layali.look : t.kind,
          node: (
            <article className="group flex h-full flex-col">
              <a href={demo} className="block transition duration-300 group-hover:-translate-y-1" aria-label={`${c.designs.live[locale]}: ${name}`}>
                <DeviceCard template={t} locale={locale} liveLabel={c.designs.live[locale]} />
              </a>
              <h3 className="f-display mt-4 text-[23px] leading-snug">{name}</h3>
              {t.description[locale] && <p className="f-body mt-1 line-clamp-2 text-[15px] text-[var(--ink-soft)]">{t.description[locale]}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a href={demo} className="f-body rounded-full bg-[var(--ink)] px-5 py-2.5 text-[15px] text-[var(--bg)] transition hover:opacity-90">
                  ▶ {c.designs.live[locale]}
                </a>
                <a
                  href={`${locale === "ar" ? "" : "/en"}/order?template=${t.id}`}
                  className="f-body rounded-full bg-gradient-to-b from-[#C9A45C] to-[#A9823C] px-4 py-2.5 text-[15px] font-semibold text-white transition hover:brightness-105"
                >
                  {t.ctaText[locale] || c.designs.order[locale]}
                </a>
                <a
                  href={whatsappUrl(
                    locale === "ar" ? `مرحباً مبروك 👋\nعندي سؤال عن تصميم «${name}»\n${url}` : `Hi Mabrouk 👋\nI have a question about the “${name}” design\n${url}`,
                    siteConfig.whatsappNumber,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={c.designs.chat[locale]}
                  title={c.designs.chat[locale]}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f7a4d] text-white transition hover:bg-[#19663f]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z" />
                  </svg>
                </a>
                <ShareButton url={url} title={name} label={c.designs.share[locale]} copied={c.designs.copied[locale]} />
              </div>
            </article>
          ),
        };
      })}
    />
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
