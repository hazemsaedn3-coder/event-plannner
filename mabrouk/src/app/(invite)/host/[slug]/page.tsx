import type { Metadata } from "next";
import { Suspense } from "react";
import { absoluteUrl } from "@/config/site";
import { HostResults } from "@/components/host/HostResults";
import { authorizeHost, guestLink, guestWhatsappUrl, loadHostData } from "@/lib/host";
import { listLiveInvitations } from "@/lib/invitations";
import { subEventKindLabel, t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "نتائج الدعوة · Mabrouk",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export async function generateStaticParams() {
  return listLiveInvitations().map((inv) => ({ slug: inv.slug }));
}

const DENIED = {
  ar: "الرابط غير صالح. تأكد من استخدام رابط صفحة النتائج الكامل.",
  en: "Invalid link. Use the full results-page link you received.",
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

  const inv = await authorizeHost(slug, key);
  if (!inv) {
    return (
      <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="f-body flex min-h-[100svh] items-center justify-center p-8 text-center">
        <p className="max-w-sm text-[17px]">{t(DENIED, locale)}</p>
      </main>
    );
  }

  const data = await loadHostData(inv);
  const replyByGuest = new Map(data.rsvps.filter((r) => r.guestCode).map((r) => [r.guestCode!, r]));
  const sep = locale === "ar" ? "، " : ", ";

  return (
    <HostResults
      data={{
        locale,
        couple: `${t(inv.partner1.name, locale)} ${locale === "ar" ? "و" : "&"} ${t(inv.partner2.name, locale)}`,
        stats: {
          attendingPeople: data.totals.attendingHeadcount,
          replies: data.totals.replies,
          declined: data.totals.declinedReplies,
          pending: data.totals.guestsPending,
          opens: data.views.total,
          invitedSeats: data.totals.invitedSeats,
        },
        replies: data.rsvps.map((r) => {
          const guest = r.guestCode ? inv.guests.find((g) => g.code === r.guestCode) : undefined;
          return {
            id: r.id,
            name: guest ? t(guest.displayName, locale) : r.name,
            attending: r.attending,
            headcount: r.headcount,
            message: r.message,
            updatedAt: r.updatedAt,
            guestCode: r.guestCode,
          };
        }),
        guests: inv.guests.map((g) => {
          const reply = replyByGuest.get(g.code);
          const events = g.subEventIds ? inv.subEvents.filter((e) => g.subEventIds!.includes(e.id)) : inv.subEvents.filter((e) => e.visibility === "public");
          return {
            code: g.code,
            name: t(g.displayName, locale),
            seats: g.seats,
            events: events.map((e) => t(e.title ?? subEventKindLabel[e.kind], locale)).join(sep),
            note: g.hostNote,
            views: data.views.byGuest[g.code] ?? 0,
            reply: reply ? { attending: reply.attending, headcount: reply.headcount } : undefined,
            link: guestLink(inv, g),
            whatsappHref: guestWhatsappUrl(inv, g),
          };
        }),
        csvHref: `/api/host/${inv.slug}/rsvps?key=${encodeURIComponent(key)}`,
        inviteUrl: absoluteUrl(`/i/${inv.slug}`),
        otherLangHref: `/host/${inv.slug}?key=${encodeURIComponent(key)}${locale === "ar" ? "&lang=en" : ""}`,
        localStorageNote: data.storageKind === "local" && process.env.NODE_ENV === "production",
      }}
    />
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
