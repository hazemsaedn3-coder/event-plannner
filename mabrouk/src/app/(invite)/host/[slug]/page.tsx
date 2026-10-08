import type { Metadata } from "next";
import { Suspense } from "react";
import { absoluteUrl } from "@/config/site";
import { CopyLink } from "@/components/invite/CopyLink";
import { authorizeHost, guestLink, guestWhatsappUrl, loadHostData } from "@/lib/host";
import { listLiveInvitations } from "@/lib/invitations";
import { subEventKindLabel, t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "Host dashboard · Mabrouk",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export async function generateStaticParams() {
  return listLiveInvitations().map((inv) => ({ slug: inv.slug }));
}

const L = {
  title: { ar: "لوحة أصحاب الدعوة", en: "Host dashboard" },
  denied: { ar: "الرابط غير صالح. تأكد من استخدام رابط لوحة التحكم الكامل.", en: "Invalid link. Use the full dashboard link you received." },
  attending: { ar: "حضور مؤكد (أشخاص)", en: "Confirmed guests (people)" },
  replies: { ar: "ردود", en: "Replies" },
  declined: { ar: "اعتذارات", en: "Declined" },
  pending: { ar: "ضيوف لم يردّوا", en: "Guests yet to reply" },
  opens: { ar: "مرات فتح الدعوة", en: "Invitation opens" },
  seats: { ar: "من أصل مقاعد", en: "of seats" },
  csv: { ar: "تحميل الردود (CSV)", en: "Download replies (CSV)" },
  view: { ar: "عرض الدعوة", en: "View invitation" },
  rsvps: { ar: "الردود", en: "Replies" },
  noRsvps: { ar: "لا توجد ردود بعد.", en: "No replies yet." },
  guests: { ar: "قائمة الضيوف", en: "Guest list" },
  noGuests: { ar: "لا توجد روابط شخصية لهذه الدعوة.", en: "This invitation has no personal guest links." },
  yes: { ar: "سيحضر", en: "Attending" },
  no: { ar: "معتذر", en: "Declined" },
  waiting: { ar: "بانتظار الرد", en: "No reply yet" },
  seatCount: { ar: "المقاعد:", en: "Seats:" },
  send: { ar: "إرسال واتساب", en: "Send on WhatsApp" },
  copy: { ar: "نسخ الرابط", en: "Copy link" },
  copied: { ar: "تم النسخ", en: "Copied" },
  generalLink: { ar: "الرابط العام", en: "General link" },
  devStorage: {
    ar: "تنبيه: التخزين المحلي مفعّل (بدون Supabase). البيانات قد لا تُحفظ على الخادم.",
    en: "Note: local storage mode (no Supabase). Data may not persist on the server.",
  },
  langSwitch: { ar: "English", en: "عربي" },
};

async function Dashboard({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const key = typeof sp.key === "string" ? sp.key : "";
  const locale: Locale = sp.lang === "en" ? "en" : "ar";
  const tr = (x: { ar: string; en: string }) => t(x, locale);
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US");
  const df = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  const inv = authorizeHost(slug, key);
  if (!inv) {
    return (
      <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="f-body flex min-h-[100svh] items-center justify-center p-8 text-center">
        <p className="max-w-sm text-[17px]">{tr(L.denied)}</p>
      </main>
    );
  }

  const data = await loadHostData(inv);
  const replyByGuest = new Map(data.rsvps.filter((r) => r.guestCode).map((r) => [r.guestCode!, r]));
  const csvHref = `/api/host/${inv.slug}/rsvps?key=${encodeURIComponent(key)}`;
  const otherLang = `/host/${inv.slug}?key=${encodeURIComponent(key)}${locale === "ar" ? "&lang=en" : ""}`;
  const stats = [
    { label: L.attending, value: data.totals.attendingHeadcount, sub: inv.guests.length ? `${tr(L.seats)} ${nf.format(data.totals.invitedSeats)}` : "" },
    { label: L.replies, value: data.totals.replies },
    { label: L.declined, value: data.totals.declinedReplies },
    { label: L.pending, value: data.totals.guestsPending },
    { label: L.opens, value: data.views.total },
  ];

  return (
    <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="f-body mx-auto min-h-[100svh] max-w-3xl px-4 pt-6 pb-16 text-[#3a2e22]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] tracking-wide text-[#b08a45]">{tr(L.title)}</p>
          <h1 className="f-display mt-1 text-[32px] leading-tight">
            {t(inv.partner1.name, locale)} {locale === "ar" ? "و" : "&"} {t(inv.partner2.name, locale)}
          </h1>
        </div>
        <a href={otherLang} className="shrink-0 rounded-full border border-[#d9c9a8] px-4 py-2 text-[14px]">
          {tr(L.langSwitch)}
        </a>
      </header>

      {data.storageKind === "local" && process.env.NODE_ENV === "production" && (
        <p className="mt-4 rounded-xl bg-amber-100 p-3 text-[13px] text-amber-900">{tr(L.devStorage)}</p>
      )}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-2xl border border-[#e7dcc6] bg-white/70 p-4 ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`}>
            <p className="f-display text-[30px] leading-none">{nf.format(s.value)}</p>
            <p className="mt-2 text-[13px] text-[#7a6a55]">{tr(s.label)}</p>
            {s.sub && <p className="text-[12px] text-[#b08a45]">{s.sub}</p>}
          </div>
        ))}
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        <a href={csvHref} className="rounded-full bg-[#3a2e22] px-5 py-2.5 text-[14px] text-[#f8f2e7]">
          {tr(L.csv)}
        </a>
        <a href={`/i/${inv.slug}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#d9c9a8] px-5 py-2.5 text-[14px]">
          {tr(L.view)}
        </a>
        <CopyLink value={absoluteUrl(`/i/${inv.slug}`)} label={`${tr(L.copy)} (${tr(L.generalLink)})`} done={tr(L.copied)} />
      </div>

      <section className="mt-10">
        <h2 className="f-display text-[24px]">{tr(L.guests)}</h2>
        {inv.guests.length === 0 ? (
          <p className="mt-3 text-[15px] text-[#7a6a55]">{tr(L.noGuests)}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {inv.guests.map((g) => {
              const reply = replyByGuest.get(g.code);
              const events = g.subEventIds
                ? inv.subEvents.filter((e) => g.subEventIds!.includes(e.id))
                : inv.subEvents.filter((e) => e.visibility === "public");
              return (
                <li key={g.code} className="rounded-2xl border border-[#e7dcc6] bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[17px] font-semibold">{t(g.displayName, locale)}</p>
                      <p className="mt-0.5 text-[13px] text-[#7a6a55]">
                        {tr(L.seatCount)} {nf.format(g.seats)} — {events.map((e) => t(e.title ?? subEventKindLabel[e.kind], locale)).join(locale === "ar" ? "، " : ", ")}
                      </p>
                      {g.hostNote && <p className="mt-1 text-[12px] text-[#b08a45]">{g.hostNote}</p>}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[12px] ${
                        !reply ? "bg-stone-100 text-stone-600" : reply.attending ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {!reply ? tr(L.waiting) : reply.attending ? `${tr(L.yes)}: ${nf.format(reply.headcount)}` : tr(L.no)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={guestWhatsappUrl(inv, g)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-[#25D366] px-4 py-2 text-[13px] font-semibold text-white"
                    >
                      {tr(L.send)}
                    </a>
                    <CopyLink value={guestLink(inv, g)} label={tr(L.copy)} done={tr(L.copied)} />
                    <span className="text-[12px] text-[#7a6a55]">
                      👁 {nf.format(data.views.byGuest[g.code] ?? 0)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="f-display text-[24px]">{tr(L.rsvps)}</h2>
        {data.rsvps.length === 0 ? (
          <p className="mt-3 text-[15px] text-[#7a6a55]">{tr(L.noRsvps)}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {data.rsvps.map((r) => {
              const guest = r.guestCode ? inv.guests.find((g) => g.code === r.guestCode) : undefined;
              return (
                <li key={r.id} className="rounded-2xl border border-[#e7dcc6] bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[16px] font-semibold">{guest ? t(guest.displayName, locale) : r.name}</p>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[12px] ${r.attending ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {r.attending ? `${tr(L.yes)}: ${nf.format(r.headcount)}` : tr(L.no)}
                    </span>
                  </div>
                  {r.message && <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line">“{r.message}”</p>}
                  <p className="mt-2 text-[12px] text-[#7a6a55]">{df.format(new Date(r.updatedAt))}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

export default function HostPage(props: PageProps<"/host/[slug]">) {
  return (
    <div className="min-h-[100svh] bg-[#f8f2e7]">
      <Suspense fallback={<div className="min-h-[100svh]" />}>
        <Dashboard params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
