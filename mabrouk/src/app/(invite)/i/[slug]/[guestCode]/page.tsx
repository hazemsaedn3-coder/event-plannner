import type { Metadata, Viewport } from "next";
import { InvitationPage, invitationMetadata, invitationViewport } from "@/components/invite/InvitationPage";
import { listLiveInvitations } from "@/lib/invitations";

/** Personal invitation: "Dear Ahmed & Family", their own events and seat limit. */
export async function generateStaticParams() {
  return listLiveInvitations().flatMap((inv) => inv.guests.map((g) => ({ slug: inv.slug, guestCode: g.code })));
}

export async function generateMetadata({ params }: PageProps<"/i/[slug]/[guestCode]">): Promise<Metadata> {
  const { slug, guestCode } = await params;
  return invitationMetadata(slug, guestCode);
}

export async function generateViewport({ params }: PageProps<"/i/[slug]/[guestCode]">): Promise<Viewport> {
  const { slug } = await params;
  return invitationViewport(slug);
}

export default function Page({ params }: PageProps<"/i/[slug]/[guestCode]">) {
  return <InvitationPage params={params} />;
}
