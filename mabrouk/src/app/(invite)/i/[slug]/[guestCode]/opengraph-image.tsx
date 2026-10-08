import { invitationOgImage, ogSize } from "@/components/invite/og";
import { listLiveInvitations } from "@/lib/invitations";

export const alt = "Personal wedding invitation";
export const size = ogSize;
export const contentType = "image/png";

export async function generateStaticParams() {
  return listLiveInvitations().flatMap((inv) => inv.guests.map((g) => ({ slug: inv.slug, guestCode: g.code })));
}

export default async function Image({ params }: { params: Promise<{ slug: string; guestCode: string }> }) {
  const { slug, guestCode } = await params;
  return invitationOgImage(slug, guestCode);
}
