"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ImportForm() {
  const router = useRouter();
  const [busy, setBusy] = useState<"url" | "files" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(kind: "url" | "files", form: HTMLFormElement) {
    setBusy(kind);
    setError(null);
    const res = await fetch("/api/admin/import", { method: "POST", body: new FormData(form) }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setBusy(null);
    if (res?.ok && data?.id) router.push(`/admin/templates/${data.id}`);
    else setError(data?.error ?? "Import failed");
  }

  const card = "rounded-3xl border border-[#E7DCC6] bg-white p-6";
  const btn = "rounded-full bg-[#2A2420] px-5 py-2.5 text-[14px] text-white hover:bg-black disabled:opacity-50";

  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2">
      <form
        className={card}
        onSubmit={(e) => {
          e.preventDefault();
          void submit("files", e.currentTarget);
        }}
      >
        <h2 className="text-[18px] font-semibold">Upload files</h2>
        <p className="mt-1 text-[14px] text-[#7A6A55]">
          One <b>.json</b> (exported from Mabrouk) — or one <b>.html</b> with optional <b>.css</b> and <b>.js</b>. Max 2 MB each.
        </p>
        <input
          name="files"
          type="file"
          multiple
          required
          accept=".json,.html,.htm,.css,.js,application/json,text/html,text/css,text/javascript"
          className="mt-4 block w-full text-[14px] file:me-3 file:rounded-full file:border-0 file:bg-[#F1E9DA] file:px-4 file:py-2"
        />
        <button className={`${btn} mt-5`} disabled={busy !== null}>
          {busy === "files" ? "Importing…" : "Import files"}
        </button>
      </form>

      <form
        className={card}
        onSubmit={(e) => {
          e.preventDefault();
          void submit("url", e.currentTarget);
        }}
      >
        <h2 className="text-[18px] font-semibold">Import from a URL</h2>
        <p className="mt-1 text-[14px] text-[#7A6A55]">
          A public web page (its HTML is copied; relative images and styles keep loading from the original site) or a link to a
          Mabrouk template <b>.json</b>.
        </p>
        <input
          name="url"
          type="url"
          required
          placeholder="https://example.com/invitation.html"
          className="mt-4 w-full rounded-xl border border-[#E1D5BE] px-4 py-3 text-[15px] outline-none focus:border-[#B08A45]"
        />
        <button className={`${btn} mt-5`} disabled={busy !== null}>
          {busy === "url" ? "Fetching…" : "Import URL"}
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-[14px] text-rose-700 md:col-span-2">
          {error}
        </p>
      )}
    </div>
  );
}
