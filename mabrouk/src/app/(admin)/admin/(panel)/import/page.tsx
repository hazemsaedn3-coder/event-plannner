import { Suspense } from "react";
import { ImportForm } from "@/components/admin/ImportForm";
import { requireAdmin } from "@/lib/admin-auth";

async function Guard() {
  await requireAdmin();
  return <ImportForm />;
}

export default function ImportPage() {
  return (
    <>
      <h1 className="font-[family-name:var(--font-cormorant)] text-[34px] leading-tight">Import a template</h1>
      <p className="max-w-2xl text-[14px] text-[#7A6A55]">
        Imported templates are saved as drafts so you can review them first. HTML templates run in a sandbox. Use{" "}
        <code className="rounded bg-white px-1">{"{{name1}}"}</code>-style placeholders to make text editable, and the CSS variables{" "}
        <code className="rounded bg-white px-1">--mbk-background</code>, <code className="rounded bg-white px-1">--mbk-text</code>,{" "}
        <code className="rounded bg-white px-1">--mbk-accent</code> (also <code className="rounded bg-white px-1">--mbk-surface</code>,{" "}
        <code className="rounded bg-white px-1">--mbk-seal</code>) to make colors editable.
      </p>
      <Suspense>
        <Guard />
      </Suspense>
    </>
  );
}
