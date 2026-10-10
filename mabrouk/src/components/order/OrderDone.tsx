import { notFound } from "next/navigation";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { getOrderStore } from "@/orders/store";
import { EVENT_TYPES, MUSIC_CHOICES, ORDER_SECTIONS } from "@/orders/types";
import { Divider, Star8 } from "@/templates/noor/v1/Ornaments";
import { OT } from "./copy";
import { WhatsIcon } from "./OrderFlow";
import { chatUrl, OrderShell } from "./OrderPage";

async function Details({ locale, params }: { locale: "ar" | "en"; params: Promise<{ id: string }> }) {
  const t = OT[locale];
  const { id } = await params;
  if (!/^[a-z0-9]{8,40}$/.test(id)) notFound();
  const order = await getOrderStore()
    .get(id)
    .catch(() => null);
  if (!order) notFound();

  const msg = locale === "ar" ? `بخصوص طلبي رقم ${order.ref}` : `About my order ${order.ref}`;
  const rows: [string, string][] = [
    [t.design, order.templateName[locale]],
    [t.groom, order.groomName],
    [t.bride, order.brideName],
    [t.whatsapp, `\u200E+${order.whatsapp}`],
    ...(order.email ? ([[t.email, order.email]] as [string, string][]) : []),
    [t.eventType, EVENT_TYPES.find((x) => x.id === order.event.type)?.[locale] ?? ""],
    [t.date, `\u200E${[order.event.date, order.event.time].filter(Boolean).join(" · ")}`],
    [t.city, order.event.city],
    ...(order.event.venueName ? ([[t.venue, order.event.venueName]] as [string, string][]) : []),
    ...(order.event.venueAddress ? ([[t.address, order.event.venueAddress]] as [string, string][]) : []),
    [t.language, t.langs[order.preferences.language]],
    [t.music, MUSIC_CHOICES.find((x) => x.id === order.preferences.music)?.[locale] ?? ""],
    [t.sections, order.preferences.sections.map((s) => ORDER_SECTIONS.find((x) => x.id === s)?.[locale]).join(locale === "ar" ? "، " : ", ")],
    ...(order.files.length ? ([[t.photos, `${order.files.length} ${t.photosCount}`]] as [string, string][]) : []),
    ...(order.notes ? ([[t.notes, order.notes]] as [string, string][]) : []),
  ];

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:py-16">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-[28px] text-[var(--bg)] shadow-[0_16px_34px_-14px_rgba(176,138,69,0.9)]">✓</span>
        <h1 className="f-display mt-5 text-[36px] leading-snug">{t.thanks}</h1>
        <p className="f-body mt-3 text-[14px] text-[var(--ink-soft)]">{t.refLabel}</p>
        <p className="f-display mt-1 inline-block rounded-full border border-[var(--accent)] bg-[var(--surface)] px-6 py-2 text-[26px] tracking-[0.12em]" dir="ltr">
          {order.ref}
        </p>
      </div>

      <section className="mt-10 rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
        <h2 className="f-display text-[24px]">{t.nextTitle}</h2>
        <ol className="f-body mt-4 space-y-3 text-[16px]">
          {[t.next1, t.next2, t.next3].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="f-display flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] text-[14px] text-[var(--accent)]">
                {locale === "ar" ? (i + 1).toLocaleString("ar-EG") : i + 1}
              </span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-5 rounded-[26px] border border-[#1f7a4d]/30 bg-[#1f7a4d]/[0.06] p-6 text-center sm:p-8">
        <h2 className="f-display text-[22px]">{t.contactUs}</h2>
        <p className="f-body mt-1 text-[14px] text-[var(--ink-soft)]">{t.ourNumber}</p>
        <p className="f-display mt-1 text-[24px]" dir="ltr">
          +{siteConfig.whatsappNumber.replace(/^(\d{2})(\d{2})(\d{4})(\d+)$/, "$1 $2 $3 $4")}
        </p>
        <a
          href={chatUrl(locale, msg)}
          target="_blank"
          rel="noopener noreferrer"
          className="f-body mt-4 inline-flex items-center gap-2 rounded-full bg-[#1f7a4d] px-6 py-3 text-[16px] font-semibold text-white transition hover:bg-[#19663f]"
        >
          <WhatsIcon /> {t.chatNow}
        </a>
      </section>

      <section className="mt-5 rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
        <h2 className="f-display text-[24px]">{t.yourDetails}</h2>
        <Divider className="mt-2 mb-4 !justify-start" />
        <dl className="f-body divide-y divide-[var(--line)] text-[15px]">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[minmax(0,40%)_1fr] gap-3 py-2.5">
              <dt className="text-[var(--ink-soft)]">{k}</dt>
              <dd className="min-w-0 break-words whitespace-pre-line">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-8 text-center">
        <a href={`${locale === "ar" ? "/" : "/en"}#designs`} className="f-body inline-flex items-center gap-2 text-[15px] text-[var(--accent)] underline underline-offset-4">
          <Star8 size={10} /> {t.backHome}
        </a>
      </p>
    </div>
  );
}

/** /order/done/<id>: the confirmation, reachable only through the unguessable id. */
export function OrderDone({ locale, params }: { locale: "ar" | "en"; params: Promise<{ id: string }> }) {
  return (
    <OrderShell locale={locale} switchHref={locale === "ar" ? "/en" : "/"}>
      <Suspense fallback={<div className="mx-auto mt-24 h-40 max-w-2xl animate-pulse rounded-[28px] bg-[var(--accent-soft)]" />}>
        <Details locale={locale} params={params} />
      </Suspense>
    </OrderShell>
  );
}
