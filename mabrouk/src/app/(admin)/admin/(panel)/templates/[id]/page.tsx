import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCatalogStore } from "@/catalog/store";
import { TemplateEditor } from "@/components/admin/TemplateEditor";
import { siteConfig } from "@/config/site";
import { requireAdmin } from "@/lib/admin-auth";

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const store = getCatalogStore();
  const [template, media, links] = await Promise.all([store.getTemplate(id), store.listMedia(), store.listLinks(id)]);
  if (!template) notFound();
  return <TemplateEditor initial={template} media={media} links={links} siteUrl={siteConfig.url} />;
}

export default function EditTemplatePage({ params }: PageProps<"/admin/templates/[id]">) {
  return (
    <Suspense fallback={<p className="text-[#7A6A55]">Loading editor…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}
