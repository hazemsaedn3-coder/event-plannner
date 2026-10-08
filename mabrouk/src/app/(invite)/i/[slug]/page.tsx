import type { Metadata, Viewport } from "next";
import { InvitationPage, invitationMetadata, invitationViewport } from "@/components/invite/InvitationPage";
import { listLiveInvitations } from "@/lib/invitations";

export async function generateStaticParams() {
  return listLiveInvitations().map((inv) => ({ slug: inv.slug }));
}

export async function generateMetadata({ params }: PageProps<"/i/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return invitationMetadata(slug, null);
}

export async function generateViewport({ params }: PageProps<"/i/[slug]">): Promise<Viewport> {
  const { slug } = await params;
  return invitationViewport(slug);
}

export default function Page({ params }: PageProps<"/i/[slug]">) {
  return <InvitationPage params={params} />;
}
