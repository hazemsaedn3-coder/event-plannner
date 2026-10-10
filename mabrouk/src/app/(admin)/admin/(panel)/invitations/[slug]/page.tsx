import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCatalogStore } from "@/catalog/store";
import { InvitationBuilder } from "@/components/admin/InvitationBuilder";
import { siteConfig } from "@/config/site";
import { requireAdmin } from "@/lib/admin-auth";
import { getLiveStore } from "@/live/store";
import { getOrderStore } from "@/orders/store";

async function Builder({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const store = getLiveStore();
  const inv = await store.get(slug);
  if (!inv) notFound();
  const [media, usage, order] = await Promise.all([
    getCatalogStore().listMedia(),
    store.usage().catch(() => ({}) as Record<string, { views: number; rsvps: number; attending: number }>),
    inv.orderId ? getOrderStore().get(inv.orderId) : Promise.resolve(null),
  ]);
  return (
    <InvitationBuilder
      initial={inv}
      media={media}
      siteUrl={siteConfig.url}
      usage={usage[slug] ?? { views: 0, rsvps: 0, attending: 0 }}
      order={order ? { id: order.id, ref: order.ref } : null}
    />
  );
}

export default function InvitationBuilderPage({ params }: PageProps<"/admin/invitations/[slug]">) {
  return (
    <Suspense fallback={<p className="text-[#7A6A55]">Loading builder…</p>}>
      <Builder params={params} />
    </Suspense>
  );
}
