import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buildDemoPayload } from "@/catalog/demo";
import { getCatalogStore } from "@/catalog/store";
import { DemoView } from "@/components/demo/DemoView";
import { requireAdmin } from "@/lib/admin-auth";

/** Admin-only live preview, including drafts. Used by the editor's preview pane. */
async function Preview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const store = getCatalogStore();
  const [t, media] = await Promise.all([store.getTemplate(id), store.listMedia()]);
  if (!t) notFound();
  const payload = buildDemoPayload(t, Object.fromEntries(media.map((m) => [m.id, m])), { path: `/demo/${t.id}`, now: new Date() });
  return <DemoView payload={payload} />;
}

export default function AdminPreviewPage({ params }: PageProps<"/admin/preview/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-[100svh]" />}>
      <Preview params={params} />
    </Suspense>
  );
}
