"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteInvitation, saveInvitation } from "@/app/(admin)/admin/production-actions";
import type { MediaMeta, ShowcaseTemplate } from "@/catalog/types";
import { liveState, type LiveInvitation, type Validity } from "@/live/types";
import { ContentEditor, normalizeTemplate, SECTION_NAV } from "./ContentEditor";
import { PreviewPane } from "./PreviewPane";
import { Field, input, Section, Toggle } from "./ui";

const STATE = {
  live: { label: "Live now", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  scheduled: { label: "Scheduled", tone: "bg-sky-50 text-sky-800 ring-sky-200" },
  expired: { label: "Expired", tone: "bg-stone-100 text-stone-700 ring-stone-300" },
  inactive: { label: "Inactive", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
};

const addDays = (day: string, n: number) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const pretty = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

/**
 * The visual invitation builder: one couple's production invitation,
 * edited with a real-time preview, then activated for a period.
 */
export function InvitationBuilder({
  initial,
  media: initialMedia,
  siteUrl,
  usage,
  order,
}: {
  initial: LiveInvitation;
  media: MediaMeta[];
  siteUrl: string;
  usage: { views: number; rsvps: number; attending: number };
  order: { id: string; ref: string } | null;
}) {
  const router = useRouter();
  const [inv, setInv] = useState<LiveInvitation>(initial);
  const [t, setT] = useState<ShowcaseTemplate>(() => normalizeTemplate(initial.template));
  const [form, setForm] = useState({ slug: initial.slug, clientName: initial.clientName, clientPhone: initial.clientPhone, status: initial.status, validity: initial.validity });
  const [baseline, setBaseline] = useState(() => JSON.stringify({ t: normalizeTemplate(initial.template), form }));
  const [media, setMedia] = useState(initialMedia);
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "saved" | "error"; text?: string }>({ kind: "idle" });
  const dirty = useMemo(() => JSON.stringify({ t, form }) !== baseline, [t, form, baseline]);

  const url = `${siteUrl}/i/${inv.slug}`;
  const hostUrl = `${siteUrl}/host/${inv.slug}?key=${encodeURIComponent(inv.hostKey)}`;
  const state = liveState(inv, new Date());
  const v = form.validity;
  const eventDay = t.noor?.date.slice(0, 10);

  const periodText =
    v.mode === "range"
      ? `${pretty(v.from)} → ${pretty(v.until)}`
      : eventDay
        ? `From activation until the end of ${pretty(addDays(eventDay, 1 + v.graceDays))}`
        : "No end date (imported design without an event date)";

  async function save(nextStatus?: "active" | "inactive") {
    setStatus({ kind: "saving" });
    const payload = { ...form, status: nextStatus ?? form.status, template: t };
    const res = await saveInvitation(inv.slug, payload);
    if (!res.ok) {
      setStatus({ kind: "error", text: res.error });
      return;
    }
    const next = { ...form, status: res.invitation.status, slug: res.invitation.slug };
    setForm(next);
    setInv(res.invitation);
    setBaseline(JSON.stringify({ t, form: next }));
    setStatus({ kind: "saved", text: nextStatus === "active" ? "Activated ✓ The link is live in its period." : "Saved ✓" });
    if (res.invitation.slug !== initial.slug) router.replace(`/admin/invitations/${res.invitation.slug}`);
    router.refresh();
  }

  const couple = t.noor ? `${t.noor.partner1.ar} و${t.noor.partner2.ar}` : form.clientName;
  const shareMsg = `${form.clientName ? `${form.clientName}، ` : ""}ألف مبروك 🤍\nدعوتكم جاهزة:\n${url}\n\nلوحة متابعة تأكيدات الحضور (خاصة بكم فقط):\n${hostUrl}`;
  const guestMsg = `يسعدنا دعوتكم لفرح ${couple} 💌\n${url}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="sticky top-14 z-20 -mx-1 flex flex-col gap-2 rounded-2xl bg-[#F6F3EE]/95 px-1 py-2 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/invitations" className="rounded-full border border-[#E1D5BE] bg-white px-3 py-1.5 text-[13px]">
              ←
            </Link>
            <h1 className="me-auto min-w-0 truncate font-[family-name:var(--font-cormorant)] text-[28px]" dir="auto">
              {form.clientName || inv.slug}
            </h1>
            <span className={`rounded-full px-2.5 py-1 text-[12px] ring-1 ${STATE[state].tone}`}>{STATE[state].label}</span>
            {status.text && (
              <span role="status" className={`text-[13px] ${status.kind === "error" ? "text-rose-700" : "text-emerald-700"}`}>
                {status.text}
              </span>
            )}
            <button
              type="button"
              onClick={() => save()}
              disabled={status.kind === "saving"}
              className="rounded-full bg-[#2A2420] px-5 py-2 text-[14px] font-medium text-white hover:bg-black disabled:opacity-50"
            >
              {status.kind === "saving" ? "Saving…" : dirty ? "Save changes" : "Save"}
            </button>
            {form.status !== "active" && (
              <button
                type="button"
                onClick={() => save("active")}
                disabled={status.kind === "saving"}
                className="rounded-full bg-gradient-to-b from-[#C9A45C] to-[#A9823C] px-5 py-2 text-[14px] font-semibold text-white disabled:opacity-50"
              >
                ✦ Save & activate
              </button>
            )}
          </div>
          {t.noor && (
            <nav className="flex gap-1 overflow-x-auto text-[12px] [scrollbar-width:none]">
              <a href="#sec-link" className="shrink-0 rounded-full border border-[#B08A45] bg-white px-2.5 py-1 text-[#8A6A2F]">
                Link & period
              </a>
              {SECTION_NAV.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-full border border-[#E7DCC6] bg-white px-2.5 py-1 text-[#5E5246] hover:border-[#B08A45]">
                  {s.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        <Section id="sec-link" title="Link & active period" hint={`Design: ${inv.template.name.en} (from “${inv.templateId}”). Edits here never change the catalog design.`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client name">
              <input className={input} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Ahmed & Sara" dir="auto" />
            </Field>
            <Field label="Client WhatsApp (digits, with country code)">
              <input className={input} dir="ltr" value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value.replace(/\D/g, "") })} placeholder="201001234567" />
            </Field>
          </div>
          <Field label="Link" hint="Changing it after sharing breaks the old link.">
            <div className="flex items-center overflow-hidden rounded-xl border border-[#E1D5BE] bg-white focus-within:border-[#B08A45]">
              <span className="shrink-0 bg-[#F6F3EE] px-3 py-2 font-mono text-[13px] text-[#7A6A55]">{siteUrl.replace(/^https?:\/\//, "")}/i/</span>
              <input
                className="min-w-0 flex-1 px-2 py-2 font-mono text-[14px] outline-none"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
              />
            </div>
          </Field>

          <Toggle
            label={form.status === "active" ? "Active: guests can open the invitation in its period" : "Inactive: the link shows “not available”"}
            checked={form.status === "active"}
            onChange={(on) => setForm({ ...form, status: on ? "active" : "inactive" })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {(["event", "range"] as const).map((mode) => (
              <label key={mode} className={`flex cursor-pointer flex-col gap-1 rounded-2xl border p-3.5 ${v.mode === mode ? "border-[#B08A45] bg-[#FBF6EA]" : "border-[#EFE6D4]"}`}>
                <span className="flex items-center gap-2 text-[14px] font-medium">
                  <input
                    type="radio"
                    name="validity"
                    checked={v.mode === mode}
                    onChange={() =>
                      setForm({
                        ...form,
                        validity:
                          mode === "event"
                            ? ({ mode: "event", graceDays: 0 } as Validity)
                            : ({ mode: "range", from: new Date().toISOString().slice(0, 10), until: eventDay ? addDays(eventDay, 1) : new Date().toISOString().slice(0, 10) } as Validity),
                      })
                    }
                  />
                  {mode === "event" ? "Until the event date" : "From a start date to an end date"}
                </span>
                <span className="text-[12px] text-[#7A6A55]">
                  {mode === "event" ? "Opens on activation, closes after the wedding day (+ optional extra days)." : "Opens and closes on exact days (event time zone)."}
                </span>
              </label>
            ))}
          </div>
          {v.mode === "event" ? (
            <Field label="Keep it open after the event">
              <select className={input} value={v.graceDays} onChange={(e) => setForm({ ...form, validity: { mode: "event", graceDays: Number(e.target.value) } })}>
                {[0, 1, 3, 7, 14, 30, 90, 180].map((d) => (
                  <option key={d} value={d}>
                    {d === 0 ? "No extra days (closes the day after the event)" : `${d} extra days`}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Active from">
                <input type="date" className={input} value={v.from} onChange={(e) => setForm({ ...form, validity: { ...v, from: e.target.value } })} />
              </Field>
              <Field label="Active until (inclusive)">
                <input type="date" className={input} value={v.until} min={v.from} onChange={(e) => setForm({ ...form, validity: { ...v, until: e.target.value } })} />
              </Field>
            </div>
          )}
          <p className="rounded-xl bg-[#F6F3EE] px-3 py-2 text-[13px] text-[#5E5246]">🗓 {periodText}</p>
        </Section>

        <ContentEditor t={t} setT={setT} media={media} addMedia={(m) => setMedia((list) => [m, ...list])} textHint="This couple's real details. Guests see exactly this." />

        <section className="rounded-3xl border border-rose-200 bg-white p-5">
          <h2 className="text-[17px] font-semibold text-rose-800">Danger zone</h2>
          <form
            action={deleteInvitation.bind(null, inv.slug)}
            onSubmit={(e) => {
              if (!window.confirm(`Delete /i/${inv.slug}? The link will stop working for every guest.`)) e.preventDefault();
            }}
          >
            <button className="mt-3 rounded-full border border-rose-300 px-4 py-2 text-[14px] text-rose-700 hover:bg-rose-50">Delete invitation</button>
          </form>
        </section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        <PreviewPane template={t} mode="live" openHref={`/i/${inv.slug}`} />

        <div className="rounded-3xl border border-[#E7DCC6] bg-white p-4 text-[13px]">
          <p className="font-medium">Production link</p>
          <p className="mt-1 flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{url}</span>
            <button type="button" className="rounded-full border border-[#E1D5BE] px-2 py-1 text-[12px]" onClick={() => navigator.clipboard.writeText(url)}>
              Copy
            </button>
          </p>
          {dirty && <p className="mt-1 text-[#B08A45]">Unsaved changes. Guests still see the last saved version.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${form.clientPhone}?text=${encodeURIComponent(shareMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full bg-[#1f7a4d] px-3 py-1.5 text-[12px] font-medium text-white ${form.clientPhone ? "" : "pointer-events-none opacity-40"}`}
            >
              Send to client on WhatsApp
            </a>
            <a href={`https://wa.me/?text=${encodeURIComponent(guestMsg)}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#E1D5BE] px-3 py-1.5 text-[12px]">
              Guest message
            </a>
          </div>
          <p className="mt-4 font-medium">Couple&apos;s RSVP dashboard (private)</p>
          <p className="mt-1 flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{hostUrl}</span>
            <button type="button" className="rounded-full border border-[#E1D5BE] px-2 py-1 text-[12px]" onClick={() => navigator.clipboard.writeText(hostUrl)}>
              Copy
            </button>
          </p>
          {order && (
            <p className="mt-4">
              <Link href={`/admin/orders/${order.id}`} className="text-[#B08A45] underline">
                From order {order.ref} →
              </Link>
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-[#E7DCC6] bg-white p-3 text-center">
          {[
            ["Opens", usage.views],
            ["RSVPs", usage.rsvps],
            ["Attending", usage.attending],
          ].map(([k, n]) => (
            <div key={k} className="rounded-2xl bg-[#F6F3EE] py-2">
              <p className="text-[20px] font-semibold">{n}</p>
              <p className="text-[11px] text-[#7A6A55]">{k}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
