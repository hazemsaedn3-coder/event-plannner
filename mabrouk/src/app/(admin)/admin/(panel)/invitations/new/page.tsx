import Link from "next/link";
import { Suspense } from "react";
import { getCatalogStore } from "@/catalog/store";
import { TemplatePoster } from "@/components/catalog/TemplatePoster";
import { requireAdmin } from "@/lib/admin-auth";
import { createInvitation } from "../../../production-actions";

async function Picker() {
  await requireAdmin();
  const templates = await getCatalogStore().listTemplates();
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/invitations" className="rounded-full border border-[#E1D5BE] bg-white px-3 py-1.5 text-[13px]">
          ← Invitations
        </Link>
        <h1 className="font-[family-name:var(--font-cormorant)] text-[34px] leading-tight">Generate an invitation</h1>
      </div>
      <p className="mt-1 text-[14px] text-[#7A6A55]">
        Step 1 of 2: choose the design. Next you fill in the couple&apos;s details, photos, sections, music and the active period, with a live preview, then activate the link.
      </p>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((t) => (
          <li key={t.id} className="flex flex-col rounded-3xl border border-[#E7DCC6] bg-white p-3">
            <TemplatePoster template={t} locale="en" />
            <p className="mt-3 truncate px-1 text-[15px] font-semibold">{t.name.en}</p>
            <p className="truncate px-1 text-[12px] text-[#A0907A]">
              {t.kind.toUpperCase()} {t.status === "draft" ? "· draft" : ""}
            </p>
            <div className="mt-3 flex gap-2 px-1 pb-1">
              <form action={createInvitation.bind(null, t.id, undefined)} className="flex-1">
                <button className="w-full rounded-full bg-[#2A2420] px-3 py-2 text-[13px] text-white">Use this design</button>
              </form>
              <a href={`/admin/preview/${t.id}`} target="_blank" className="rounded-full border border-[#E1D5BE] px-3 py-2 text-[13px]">
                Preview
              </a>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function NewInvitationPage() {
  return (
    <Suspense fallback={<p className="text-[#7A6A55]">Loading designs…</p>}>
      <Picker />
    </Suspense>
  );
}
