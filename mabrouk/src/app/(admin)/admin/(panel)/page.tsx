import Link from "next/link";
import { Suspense } from "react";
import { getCatalogStore } from "@/catalog/store";
import { TemplatePoster } from "@/components/catalog/TemplatePoster";
import { CopyLink } from "@/components/invite/CopyLink";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { absoluteUrl } from "@/config/site";
import { requireAdmin } from "@/lib/admin-auth";
import { createTemplate, deleteTemplate, duplicateTemplate, setTemplateStatus } from "../actions";

async function Templates() {
  await requireAdmin();
  const store = getCatalogStore();
  const templates = await store.listTemplates();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[34px] leading-tight">Templates</h1>
          <p className="text-[14px] text-[#7A6A55]">
            {templates.filter((t) => t.status === "published").length} published · {templates.length} total ·{" "}
            storage: {store.kind === "supabase" ? "Supabase" : "local file (dev)"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={createTemplate.bind(null, "noor")}>
            <button className="rounded-full bg-[#2A2420] px-4 py-2 text-[14px] text-white hover:bg-black">+ New Noor design</button>
          </form>
          <form action={createTemplate.bind(null, "duo")}>
            <button className="rounded-full border border-[#D9C9A8] bg-white px-4 py-2 text-[14px] hover:border-[#B08A45]">+ New bride/groom design</button>
          </form>
          <form action={createTemplate.bind(null, "html")}>
            <button className="rounded-full border border-[#D9C9A8] bg-white px-4 py-2 text-[14px] hover:border-[#B08A45]">+ New HTML design</button>
          </form>
          <Link href="/admin/import" className="rounded-full border border-[#D9C9A8] bg-white px-4 py-2 text-[14px] hover:border-[#B08A45]">
            Import…
          </Link>
        </div>
      </div>

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <li key={t.id} className="flex flex-col overflow-hidden rounded-3xl border border-[#E7DCC6] bg-white">
            <Link href={`/admin/templates/${t.id}`} className="block p-3">
              <TemplatePoster template={t} locale="en" />
            </Link>
            <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-[17px] font-semibold">{t.name.en}</h2>
                  <p className="truncate text-[13px] text-[#7A6A55]" dir="rtl">
                    {t.name.ar}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[12px] text-[#A0907A]">/demo/{t.id}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] ${
                    t.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {t.status === "published" ? "Published" : "Draft"} · {t.kind.toUpperCase()}
                </span>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 text-[13px]">
                <Link href={`/admin/templates/${t.id}`} className="rounded-full bg-[#2A2420] px-3 py-1.5 text-white">
                  Edit
                </Link>
                <a href={`/admin/preview/${t.id}`} target="_blank" className="rounded-full border border-[#E1D5BE] px-3 py-1.5">
                  Preview
                </a>
                {t.status === "published" && <CopyLink value={absoluteUrl(`/demo/${t.id}`)} label="Copy demo link" done="Copied ✓" />}
                <form action={setTemplateStatus.bind(null, t.id, t.status === "published" ? "draft" : "published")}>
                  <button className="rounded-full border border-[#E1D5BE] px-3 py-1.5">{t.status === "published" ? "Unpublish" : "Publish"}</button>
                </form>
                <form action={duplicateTemplate.bind(null, t.id)}>
                  <button className="rounded-full border border-[#E1D5BE] px-3 py-1.5">Duplicate</button>
                </form>
                <ConfirmButton action={deleteTemplate.bind(null, t.id)} message={`Delete “${t.name.en}”? Its client links will stop working.`}>
                  Delete
                </ConfirmButton>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<p className="text-[#7A6A55]">Loading…</p>}>
      <Templates />
    </Suspense>
  );
}
