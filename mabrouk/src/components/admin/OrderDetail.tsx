"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { addOrderPhotoToLibrary, createInvitation, updateOrder } from "@/app/(admin)/admin/production-actions";
import { EVENT_TYPES, MUSIC_CHOICES, ORDER_SECTIONS, ORDER_STATUSES, statusInfo, type Order, type OrderStatus } from "@/orders/types";
import { input } from "./ui";

function Card({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#E7DCC6] bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Row({ k, v, ltr }: { k: string; v?: ReactNode; ltr?: boolean }) {
  if (v === undefined || v === "" || v === null) return null;
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-t border-[#F1EADB] py-2 text-[14px] first:border-t-0">
      <dt className="text-[#7A6A55]">{k}</dt>
      <dd className="min-w-0 break-words whitespace-pre-line" dir={ltr ? "ltr" : "auto"}>
        {v}
      </dd>
    </div>
  );
}

const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function OrderDetail({
  initial,
  templates,
  invitation,
  siteUrl,
}: {
  initial: Order;
  templates: { id: string; name: string; kind: string; status: string }[];
  invitation: { slug: string; status: string; validUntil: string | null } | null;
  siteUrl: string;
}) {
  const [order, setOrder] = useState(initial);
  const [status, setStatus] = useState<OrderStatus>(initial.status);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(initial.adminNotes);
  const [templateId, setTemplateId] = useState(templates.some((t) => t.id === initial.templateId) ? initial.templateId : (templates[0]?.id ?? ""));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [added, setAdded] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const st = statusInfo(order.status);

  const run = (fn: () => Promise<{ ok: true; order: Order } | { ok: false; error: string }>, done: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        setOrder(res.order);
        setMsg({ ok: true, text: done });
        after?.();
      } else setMsg({ ok: false, text: res.error });
    });

  const greet = `السلام عليكم ${order.groomName} و${order.brideName} 🤍\nمعاكم فريق مبروك بخصوص طلب دعوتكم رقم ${order.ref}.\nممكن نأكد معاكم التفاصيل؟\n\nHello! This is the Mabrouk team about your invitation order ${order.ref}. Could we confirm a few details?`;
  const waLink = `https://wa.me/${order.whatsapp}?text=${encodeURIComponent(greet)}`;
  const ev = EVENT_TYPES.find((x) => x.id === order.event.type);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/orders" className="rounded-full border border-[#E1D5BE] bg-white px-3 py-1.5 text-[13px]">
          ← Orders
        </Link>
        <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] leading-tight" dir="auto">
          {order.groomName} &amp; {order.brideName}
        </h1>
        <span className="font-mono text-[14px] text-[#7A6A55]">{order.ref}</span>
        <span className={`rounded-full px-3 py-1 text-[13px] ring-1 ${st.tone}`}>{st.label}</span>
        <span className="text-[13px] text-[#A0907A]">received {fmt(order.createdAt)}</span>
      </div>
      {msg && (
        <p role="status" className={`rounded-xl px-4 py-2 text-[14px] ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {msg.text}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card
            title="Customer & WhatsApp"
            aside={
              order.whatsappVerified ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] text-emerald-700 ring-1 ring-emerald-200">✓ Verified {order.verifiedAt ? fmt(order.verifiedAt) : ""}</span>
              ) : (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[12px] text-amber-800 ring-1 ring-amber-200">Not verified yet</span>
              )
            }
          >
            <dl>
              <Row k="Groom" v={order.groomName} />
              <Row k="Bride" v={order.brideName} />
              <Row k="WhatsApp" v={`+${order.whatsapp}`} ltr />
              <Row k="Email" v={order.email} ltr />
              <Row k="Language" v={order.locale === "ar" ? "Ordered in Arabic" : "Ordered in English"} />
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#1f7a4d] px-4 py-2 text-[13px] font-medium text-white">
                Open WhatsApp chat
              </a>
              <a href={`tel:+${order.whatsapp}`} className="rounded-full border border-[#E1D5BE] px-4 py-2 text-[13px]">
                Call
              </a>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => updateOrder(order.id, { whatsappVerified: !order.whatsappVerified }), order.whatsappVerified ? "Verification removed" : "WhatsApp number marked as verified")}
                className={`rounded-full px-4 py-2 text-[13px] ${order.whatsappVerified ? "border border-[#E1D5BE]" : "bg-emerald-600 text-white"}`}
              >
                {order.whatsappVerified ? "Remove verification" : "✓ Mark number as verified"}
              </button>
            </div>
            <p className="mt-2 text-[12px] text-[#A0907A]">Open the chat, confirm the customer replies from this number, then mark it as verified.</p>
          </Card>

          <Card title="Event">
            <dl>
              <Row k="Design" v={`${order.templateName.en} (${order.templateId})`} />
              <Row k="Occasion" v={ev ? `${ev.en} · ${ev.ar}` : order.event.type} />
              <Row k="Date & time" v={`${order.event.date}${order.event.time ? ` · ${order.event.time}` : ""}`} ltr />
              <Row k="City" v={order.event.city} />
              <Row k="Venue" v={order.event.venueName} />
              <Row k="Address" v={order.event.venueAddress} />
              <Row
                k="Maps"
                v={
                  order.event.mapsUrl ? (
                    <a href={order.event.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[#B08A45] underline">
                      Open link ↗
                    </a>
                  ) : undefined
                }
              />
              <Row k="Guests" v={order.event.guests === "" ? undefined : String(order.event.guests)} />
            </dl>
          </Card>

          <Card title="Requirements">
            <dl>
              <Row k="Language" v={{ ar: "Arabic", en: "English", both: "Arabic & English" }[order.preferences.language]} />
              <Row k="Music" v={MUSIC_CHOICES.find((x) => x.id === order.preferences.music)?.en} />
              <Row k="Sections" v={order.preferences.sections.map((s) => ORDER_SECTIONS.find((x) => x.id === s)?.en).join(", ") || "—"} />
              <Row k="Colors / style" v={order.preferences.colors} />
              <Row k="Wording" v={order.preferences.wording} />
              <Row k="Notes" v={order.notes} />
            </dl>
          </Card>

          <Card title={`Photos (${order.files.length})`}>
            {order.files.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {order.files.map((f) => (
                  <li key={f.id} className="flex flex-col gap-1.5">
                    <a href={`/api/admin/order-files/${f.id}`} target="_blank" className="relative block aspect-square overflow-hidden rounded-xl border border-[#E1D5BE] bg-[#F6F3EE]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/admin/order-files/${f.id}`} alt={f.name} className="h-full w-full object-cover" loading="lazy" />
                      <span className="absolute start-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">{f.kind === "venue" ? "Venue" : f.kind === "couple" ? "Couple" : "Other"}</span>
                    </a>
                    <div className="flex gap-1 text-[12px]">
                      <a href={`/api/admin/order-files/${f.id}?download`} className="rounded-full border border-[#E1D5BE] px-2 py-1">
                        Download
                      </a>
                      <button
                        type="button"
                        disabled={pending || Boolean(added[f.id])}
                        onClick={() =>
                          start(async () => {
                            const res = await addOrderPhotoToLibrary(f.id);
                            if (res.ok) setAdded((a) => ({ ...a, [f.id]: res.url }));
                            setMsg(res.ok ? { ok: true, text: "Added to Music & images" } : { ok: false, text: res.error });
                          })
                        }
                        className="rounded-full border border-[#E1D5BE] px-2 py-1 disabled:opacity-50"
                      >
                        {added[f.id] ? "In library ✓" : "Add to library"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-[#A0907A]">The customer didn&apos;t attach photos.</p>
            )}
          </Card>
        </div>

        <aside className="flex flex-col gap-5">
          <Card title="Status">
            <div className="flex flex-col gap-2">
              <select className={input} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <textarea className={`${input} min-h-16`} placeholder="Note for the history (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
              <button
                type="button"
                disabled={pending || (status === order.status && !note.trim())}
                onClick={() => run(() => updateOrder(order.id, { status, note }), "Order updated", () => setNote(""))}
                className="rounded-full bg-[#2A2420] px-4 py-2 text-[14px] text-white disabled:opacity-40"
              >
                {pending ? "Saving…" : "Update status"}
              </button>
            </div>
          </Card>

          <Card title="Production invitation">
            {invitation || order.invitationSlug ? (
              <div className="flex flex-col gap-2 text-[14px]">
                <p>
                  <span className="text-[#7A6A55]">Link: </span>
                  <span className="font-mono text-[13px] break-all">
                    {siteUrl}/i/{invitation?.slug ?? order.invitationSlug}
                  </span>
                </p>
                {invitation && (
                  <p className="text-[13px] text-[#7A6A55]">
                    {invitation.status === "active" ? "Active" : "Inactive (draft)"}
                    {invitation.validUntil ? ` · until ${fmt(invitation.validUntil)}` : ""}
                  </p>
                )}
                <Link href={`/admin/invitations/${invitation?.slug ?? order.invitationSlug}`} className="mt-1 rounded-full bg-[#2A2420] px-4 py-2 text-center text-[14px] text-white">
                  Open invitation builder →
                </Link>
              </div>
            ) : (
              <form action={createInvitation.bind(null, templateId, order.id)} className="flex flex-col gap-2">
                <p className="text-[13px] text-[#7A6A55]">
                  Creates the invitation with the names, date, venue, wishes and photos from this order. It stays inactive until you activate it.
                </p>
                <select className={input} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.status === "draft" ? "(draft)" : ""}
                    </option>
                  ))}
                </select>
                <button className="rounded-full bg-gradient-to-b from-[#C9A45C] to-[#A9823C] px-4 py-2.5 text-[14px] font-semibold text-white">✦ Generate invitation</button>
              </form>
            )}
          </Card>

          <Card title="Internal notes">
            <textarea className={`${input} min-h-28`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Only admins see this" maxLength={4000} />
            <button
              type="button"
              disabled={pending || notes === order.adminNotes}
              onClick={() => run(() => updateOrder(order.id, { adminNotes: notes }), "Notes saved")}
              className="mt-2 rounded-full border border-[#E1D5BE] px-4 py-2 text-[13px] disabled:opacity-40"
            >
              Save notes
            </button>
          </Card>

          <Card title="History">
            <ol className="relative flex flex-col gap-3 border-s border-[#E7DCC6] ps-4">
              {[...order.history].reverse().map((h, i) => (
                <li key={i} className="relative text-[13px]">
                  <span className="absolute -start-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#B08A45]" />
                  <p className="text-[#A0907A]">
                    {fmt(h.at)} · {h.by === "admin" ? "Admin" : "Customer"}
                  </p>
                  {h.status && <p className="font-medium">→ {statusInfo(h.status).label}</p>}
                  {h.note && <p className="text-[#5E5246]">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  );
}
