import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCatalogStore } from "@/catalog/store";
import { OrderDetail } from "@/components/admin/OrderDetail";
import { siteConfig } from "@/config/site";
import { requireAdmin } from "@/lib/admin-auth";
import { getLiveStore } from "@/live/store";
import { getOrderStore } from "@/orders/store";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const store = getOrderStore();
  const order = await store.get(id);
  if (!order) notFound();
  const [files, templates, invitation] = await Promise.all([
    order.files.length ? Promise.resolve(order.files) : store.listFiles(id),
    getCatalogStore().listTemplates(),
    order.invitationSlug ? getLiveStore().get(order.invitationSlug) : Promise.resolve(null),
  ]);
  return (
    <OrderDetail
      initial={{ ...order, files }}
      templates={templates.map((t) => ({ id: t.id, name: t.name.en, kind: t.kind, status: t.status }))}
      invitation={invitation ? { slug: invitation.slug, status: invitation.status, validUntil: invitation.validUntil } : null}
      siteUrl={siteConfig.url}
    />
  );
}

export default function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<p className="text-[#7A6A55]">Loading order…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}
