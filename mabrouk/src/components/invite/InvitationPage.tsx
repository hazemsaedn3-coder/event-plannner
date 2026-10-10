import { cacheLife } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { DemoView } from "@/components/demo/DemoView";
import { getLivePage } from "@/live/read";
import { liveState } from "@/live/types";
import { LiveStatus } from "./LiveStatus";
import { TrackOpen } from "./TrackOpen";
import { buildInvitationView, getGuest, getInvitation } from "@/lib/invitations";
import { t } from "@/lib/i18n";
import { pinCookieName, pinToken, safeEqual } from "@/lib/security";
import type { InvitationView } from "@/lib/view";
import { resolveTemplate } from "@/templates/registry";
import { Ended } from "./Ended";
import { PinGate } from "./PinGate";

/**
 * Cached, pre-formatted view of an invitation. Re-evaluated hourly so
 * expiry and RSVP deadlines take effect without a redeploy.
 */
async function loadView(slug: string, guestCode: string | null): Promise<InvitationView | null> {
  "use cache";
  cacheLife("hours");
  const inv = getInvitation(slug);
  if (!inv) return null;
  const guest = guestCode ? getGuest(inv, guestCode) : null;
  if (guestCode && !guest) return null;
  return buildInvitationView(inv, guest, new Date());
}

function Render({ view }: { view: InvitationView }) {
  if (view.expired) return <Ended view={view} />;
  const { Component } = resolveTemplate(view.templateId, view.templateVersion);
  return <Component view={view} />;
}

/** PIN-protected invitations render per request: content is only sent after the PIN cookie checks out. */
async function PinProtected({ slug, guestCode, pin }: { slug: string; guestCode: string | null; pin: string }) {
  const jar = await cookies();
  const token = jar.get(pinCookieName(slug))?.value ?? "";
  const view = await loadView(slug, guestCode);
  if (!view) notFound();
  if (!safeEqual(token, pinToken(slug, pin))) {
    return <PinGate slug={slug} themeId={view.themeId} initialLocale={view.initialLocale} />;
  }
  return <Render view={view} />;
}

/** Production invitation made in the admin: rendered only inside its active period. */
async function LiveResolved({ slug }: { slug: string }) {
  const page = await getLivePage(slug);
  if (!page) notFound();
  await connection();
  const state = liveState(page, new Date());
  if (state !== "live") {
    return <LiveStatus state={state} opensAt={page.validFrom} timeZone={page.timeZone} />;
  }
  const kind = page.payload.template.kind;
  return (
    <>
      <DemoView payload={page.payload} />
      {/* Noor counts the envelope opening itself. */}
      {kind !== "noor" && <TrackOpen slug={slug} locale={page.payload.locale} />}
    </>
  );
}

async function Resolved({ params }: { params: Promise<{ slug: string; guestCode?: string }> }) {
  const { slug, guestCode = null } = await params;
  const inv = getInvitation(slug);
  if (!inv) {
    if (guestCode) notFound();
    return <LiveResolved slug={slug} />;
  }
  if (inv.pin) {
    return (
      <Suspense fallback={<Shell />}>
        <PinProtected slug={slug} guestCode={guestCode} pin={inv.pin} />
      </Suspense>
    );
  }
  const view = await loadView(slug, guestCode);
  if (!view) notFound();
  return <Render view={view} />;
}

/** Neutral first paint while an unlisted invitation streams in. */
function Shell() {
  return <div className="min-h-[100svh] bg-[#f8f2e7]" />;
}

export function InvitationPage({ params }: { params: Promise<{ slug: string; guestCode?: string }> }) {
  return (
    <Suspense fallback={<Shell />}>
      <Resolved params={params} />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/* Metadata: WhatsApp link previews                                    */
/* ------------------------------------------------------------------ */

export async function invitationMetadata(slug: string, guestCode: string | null): Promise<Metadata> {
  const inv = getInvitation(slug);
  if (!inv && !guestCode) {
    const live = await getLivePage(slug);
    if (!live) return { robots: { index: false, follow: false } };
    return {
      title: live.title,
      description: live.description,
      robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
      referrer: "no-referrer",
      openGraph: { title: live.title, description: live.description, type: "website", locale: "ar_EG", siteName: "Mabrouk · مبروك" },
      twitter: { card: "summary_large_image", title: live.title, description: live.description },
    };
  }
  const guest = inv && guestCode ? getGuest(inv, guestCode) : null;
  if (!inv || (guestCode && !guest)) return { robots: { index: false, follow: false } };

  const names = `${inv.partner1.name.ar} و${inv.partner2.name.ar}`;
  const title = guest ? `${t(guest.displayName, "ar")}، دعوة زفاف ${names}` : `دعوة زفاف ${names}`;
  const description = inv.pin
    ? "دعوة خاصة. افتحها بالرمز المرسل إليك 💌"
    : `${t(inv.inviteLine, "ar")} 💌 ${inv.partner1.latinName} & ${inv.partner2.latinName}`;

  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    referrer: "no-referrer",
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ar_EG",
      siteName: "Mabrouk · مبروك",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function invitationViewport(slug: string): Promise<Viewport> {
  const inv = getInvitation(slug);
  const theme = inv ? resolveTemplate(inv.templateId, inv.templateVersion).themes[inv.themeId] : null;
  const live = inv ? null : await getLivePage(slug);
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: theme?.colors.bg ?? live?.payload.template.colors.background ?? "#F8F2E7",
  };
}
