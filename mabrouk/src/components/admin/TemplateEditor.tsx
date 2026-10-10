"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createLink, deleteLink, deleteTemplate, saveTemplate } from "@/app/(admin)/admin/actions";
import type { MediaMeta, PreviewLink, ShowcaseTemplate } from "@/catalog/types";
import { ContentEditor, normalizeTemplate, SECTION_NAV } from "./ContentEditor";
import { PreviewPane } from "./PreviewPane";
import { Field, ImagePicker, input, L10nField, Section, type L } from "./ui";

export function TemplateEditor({ initial: raw, media: initialMedia, links: initialLinks, siteUrl }: { initial: ShowcaseTemplate; media: MediaMeta[]; links: PreviewLink[]; siteUrl: string }) {
  const router = useRouter();
  const [initial] = useState(() => normalizeTemplate(raw));
  const [t, setT] = useState<ShowcaseTemplate>(initial);
  const [saved, setSaved] = useState(initial);
  const [savedId, setSavedId] = useState(initial.id);
  const [media, setMedia] = useState(initialMedia);
  const [links, setLinks] = useState(initialLinks);
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "saved" | "error"; text?: string }>({ kind: "idle" });
  const dirty = useMemo(() => JSON.stringify(t) !== JSON.stringify(saved), [t, saved]);

  const images = media.filter((m) => m.kind === "image");
  const set = <K extends keyof ShowcaseTemplate>(k: K, v: ShowcaseTemplate[K]) => setT((x) => ({ ...x, [k]: v }));
  const addMedia = (m: MediaMeta) => setMedia((list) => [m, ...list]);
  const publicUrl = `${siteUrl}/demo/${savedId}`;

  async function save() {
    setStatus({ kind: "saving" });
    const res = await saveTemplate(savedId, t);
    if (!res.ok) {
      setStatus({ kind: "error", text: res.error });
      return;
    }
    setStatus({ kind: "saved", text: "Saved ✓" });
    setSaved(t);
    if (res.id !== savedId) {
      setSavedId(res.id);
      router.replace(`/admin/templates/${res.id}`);
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex min-w-0 flex-col gap-5">
        {/* Header / save bar */}
        <div className="sticky top-14 z-20 -mx-1 flex flex-col gap-2 rounded-2xl bg-[#F6F3EE]/95 px-1 py-2 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="me-auto min-w-0 truncate font-[family-name:var(--font-cormorant)] text-[28px]">{t.name.en || t.name.ar}</h1>
            {status.text && (
              <span role="status" className={`text-[13px] ${status.kind === "error" ? "text-rose-700" : "text-emerald-700"}`}>
                {status.text}
              </span>
            )}
            <a href={`/api/admin/templates/${savedId}/export`} className="rounded-full border border-[#E1D5BE] bg-white px-3 py-2 text-[13px]">
              Export JSON
            </a>
            <button
              type="button"
              onClick={save}
              disabled={status.kind === "saving"}
              className="rounded-full bg-[#2A2420] px-5 py-2 text-[14px] font-medium text-white hover:bg-black disabled:opacity-50"
            >
              {status.kind === "saving" ? "Saving…" : dirty ? "Save changes" : "Save"}
            </button>
          </div>
          {t.noor && (
            <nav className="flex gap-1 overflow-x-auto text-[12px] [scrollbar-width:none]">
              {SECTION_NAV.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-full border border-[#E7DCC6] bg-white px-2.5 py-1 text-[#5E5246] hover:border-[#B08A45]">
                  {s.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        <Section title="Basics" hint="Shown on the landing page gallery.">
          <L10nField label="Name" value={t.name} onChange={(v) => set("name", v)} />
          <L10nField label="Short description" value={t.description} onChange={(v) => set("description", v)} multiline />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="URL id" hint={`/demo/${t.id}`}>
              <input className={`${input} font-mono`} value={t.id} onChange={(e) => set("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
            </Field>
            <Field label="Status">
              <select className={input} value={t.status} onChange={(e) => set("status", e.target.value as ShowcaseTemplate["status"])}>
                <option value="published">Published (visible on site)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </Field>
            <Field label="Order" hint="Lower shows first">
              <input type="number" min={0} max={9999} className={input} value={t.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
            </Field>
          </div>
          <L10nField label="Order button text" value={t.ctaText} onChange={(v) => set("ctaText", v)} />
          <ImagePicker label="Gallery thumbnail (leave empty for an auto-drawn poster)" value={t.thumbnail} images={images} onChange={(v) => set("thumbnail", v)} onUploaded={addMedia} />
        </Section>

        <ContentEditor t={t} setT={setT} media={media} addMedia={addMedia} textHint="Sample content shown in the demo. Client links can override the names and date; production invitations get their own copy." />

        <ClientLinks templateId={savedId} template={t} siteUrl={siteUrl} links={links} setLinks={setLinks} />

        <section className="rounded-3xl border border-rose-200 bg-white p-5">
          <h2 className="text-[17px] font-semibold text-rose-800">Danger zone</h2>
          <form
            action={deleteTemplate.bind(null, savedId)}
            onSubmit={(e) => {
              if (!window.confirm("Delete this template and all its client links?")) e.preventDefault();
            }}
          >
            <button className="mt-3 rounded-full border border-rose-300 px-4 py-2 text-[14px] text-rose-700 hover:bg-rose-50">Delete template</button>
          </form>
        </section>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <PreviewPane
          template={t}
          openHref={`/admin/preview/${savedId}`}
          footer={
            <div className="mt-3 rounded-xl bg-[#F6F3EE] p-3 text-[13px]">
              <p className="font-medium">Public share link</p>
              {t.status === "published" ? (
                <p className="mt-1 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{publicUrl}</span>
                  <button type="button" className="rounded-full border border-[#E1D5BE] bg-white px-2 py-1 text-[12px]" onClick={() => navigator.clipboard.writeText(publicUrl)}>
                    Copy
                  </button>
                </p>
              ) : (
                <p className="mt-1 text-[#7A6A55]">Publish the template to activate /demo/{savedId}. Client links below work even for drafts.</p>
              )}
              {dirty && <p className="mt-2 text-[#B08A45]">The preview shows your unsaved changes. Save to publish them.</p>}
            </div>
          }
        />
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Client preview links                                                */
/* ------------------------------------------------------------------ */

function ClientLinks({
  templateId,
  template,
  siteUrl,
  links,
  setLinks,
}: {
  templateId: string;
  template: ShowcaseTemplate;
  siteUrl: string;
  links: PreviewLink[];
  setLinks: (fn: (l: PreviewLink[]) => PreviewLink[]) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [note, setNote] = useState("");
  const [p1, setP1] = useState<L>({ ar: "", en: "" });
  const [p2, setP2] = useState<L>({ ar: "", en: "" });
  const [date, setDate] = useState("");
  const [vars, setVars] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setError(null);
    const overrides =
      template.kind !== "html"
        ? {
            ...(p1.ar || p1.en ? { partner1: { ar: p1.ar || p1.en, en: p1.en || p1.ar }, latin1: p1.en || undefined } : {}),
            ...(p2.ar || p2.en ? { partner2: { ar: p2.ar || p2.en, en: p2.en || p2.ar }, latin2: p2.en || undefined } : {}),
            ...(date ? { date } : {}),
          }
        : { variables: Object.fromEntries(Object.entries(vars).filter(([, v]) => v)) };
    const res = await createLink(templateId, { clientName, note, overrides });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setLinks((l) => [res.link, ...l]);
    setClientName("");
    setNote("");
    setP1({ ar: "", en: "" });
    setP2({ ar: "", en: "" });
    setDate("");
    setVars({});
  }

  return (
    <Section title="Client preview links" hint="A private link per client (/p/…), optionally with their own names, date or texts. Not indexed by search engines.">
      <div className="grid gap-3 rounded-2xl bg-[#FBF8F2] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Client name">
            <input className={input} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Ahmed & Sara" />
          </Field>
          <Field label="Internal note (optional)">
            <input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Instagram lead, 12 Oct" />
          </Field>
        </div>
        {template.kind !== "html" ? (
          <>
            <L10nField label="Their first name (optional)" value={p1} onChange={setP1} />
            <L10nField label="Their second name (optional)" value={p2} onChange={setP2} />
            <Field label="Their date (optional)">
              <input type="datetime-local" className={input} value={date} onChange={(e) => setDate(e.target.value.slice(0, 16))} />
            </Field>
          </>
        ) : (
          Object.keys(template.variables).map((k) => (
            <Field key={k} label={`${k} (optional)`}>
              <input className={input} placeholder={template.variables[k]} value={vars[k] ?? ""} onChange={(e) => setVars({ ...vars, [k]: e.target.value })} />
            </Field>
          ))
        )}
        {error && <p className="text-[13px] text-rose-700">{error}</p>}
        <button type="button" onClick={create} disabled={busy} className="justify-self-start rounded-full bg-[#2A2420] px-4 py-2 text-[14px] text-white disabled:opacity-50">
          {busy ? "Creating…" : "Create client link"}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {links.map((l) => {
          const url = `${siteUrl}/p/${l.token}`;
          return (
            <li key={l.token} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#EFE6D4] px-3 py-2 text-[14px]">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.clientName || "Unnamed client"}</p>
                <p className="truncate font-mono text-[12px] text-[#7A6A55]">{url}</p>
                {l.note && <p className="truncate text-[12px] text-[#A0907A]">{l.note}</p>}
              </div>
              <button type="button" className="rounded-full border border-[#E1D5BE] px-3 py-1 text-[13px]" onClick={() => navigator.clipboard.writeText(url)}>
                Copy
              </button>
              <a
                className="rounded-full bg-[#1f9d55] px-3 py-1 text-[13px] text-white"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(`${l.clientName ? `${l.clientName}، ` : ""}هذه معاينة تصميم دعوتكم من مبروك 💌\n${url}`)}`}
              >
                WhatsApp
              </a>
              <a className="rounded-full border border-[#E1D5BE] px-3 py-1 text-[13px]" href={url} target="_blank">
                Open
              </a>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-[13px] text-rose-700"
                onClick={async () => {
                  if (!window.confirm("Delete this client link?")) return;
                  await deleteLink(l.token);
                  setLinks((list) => list.filter((x) => x.token !== l.token));
                }}
              >
                Delete
              </button>
            </li>
          );
        })}
        {!links.length && <li className="text-[13px] text-[#A0907A]">No client links yet.</li>}
      </ul>
    </Section>
  );
}
