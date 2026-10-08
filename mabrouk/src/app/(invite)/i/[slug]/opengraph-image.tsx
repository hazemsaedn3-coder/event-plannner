import { invitationOgImage, ogSize } from "@/components/invite/og";
import { listLiveInvitations } from "@/lib/invitations";

export const alt = "Wedding invitation";
export const size = ogSize;
export const contentType = "image/png";

export async function generateStaticParams() {
  return listLiveInvitations().map((inv) => ({ slug: inv.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return invitationOgImage(slug, null);
}
