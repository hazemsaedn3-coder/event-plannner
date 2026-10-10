import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrderStore } from "@/orders/store";
import { ORDER_STATUSES, orderStatusIds, statusInfo, type OrderStatus } from "@/orders/types";

const PAGE = 30;

/** Request time (the page is dynamic: requireAdmin() opted it into per-request rendering). */
const requestTime = () => Date.now();

function ago(iso: string, now: number) {
  const m = Math.round((now - Date.parse(iso)) / 60000);
  if (m < 60) return `${Math.max(m, 1)} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

async function Orders({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && orderStatusIds.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const store = getOrderStore();
  const { items, total, counts } = await store.list({ status, query: q, limit: PAGE, offset: (page - 1) * PAGE });
  const all = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const now = requestTime();
  const href = (p: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ status, q: q || undefined, ...p })) if (v !== undefined && v !== "") u.set(k, String(v));
    const s = u.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[34px] leading-tight">Orders</h1>
          <p className="text-[14px] text-[#7A6A55]">
            {all} total · {counts.new ?? 0} new · storage: {store.kind === "supabase" ? "Supabase" : "local file (dev)"}
          </p>
        </div>
        <form action="/admin/orders" className="flex w-full gap-2 sm:w-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, phone or MBK-…"
            className="w-full min-w-0 rounded-full border border-[#E1D5BE] bg-white px-4 py-2 text-[14px] outline-none focus:border-[#B08A45] sm:w-72"
          />
          <button className="rounded-full bg-[#2A2420] px-4 py-2 text-[14px] text-white">Search</button>
        </form>
      </div>

      <nav className="mt-5 flex gap-1.5 overflow-x-auto pb-1 text-[13px]">
        <Link href={href({ status: undefined, page: undefined })} className={`shrink-0 rounded-full px-3 py-1.5 ${!status ? "bg-[#2A2420] text-white" : "border border-[#E1D5BE] bg-white"}`}>
          All <span className="opacity-60">{all}</span>
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s.id}
            href={href({ status: s.id, page: undefined })}
            className={`shrink-0 rounded-full px-3 py-1.5 ${status === s.id ? "bg-[#2A2420] text-white" : "border border-[#E1D5BE] bg-white"}`}
          >
            {s.label} <span className="opacity-60">{counts[s.id] ?? 0}</span>
          </Link>
        ))}
      </nav>

      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((o) => {
          const st = statusInfo(o.status);
          return (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="grid gap-x-4 gap-y-1 rounded-2xl border border-[#E7DCC6] bg-white p-4 transition hover:border-[#B08A45] sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13px] text-[#7A6A55]">{o.ref}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[12px] ring-1 ${st.tone}`}>{st.label}</span>
                    {o.whatsappVerified && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] text-emerald-700">✓ WhatsApp verified</span>}
                    {o.invitationSlug && <span className="rounded-full bg-[#FBF6EA] px-2 py-0.5 text-[12px] text-[#8A6A2F]">Invitation linked</span>}
                    {o.files.length > 0 && <span className="text-[12px] text-[#A0907A]">📷 {o.files.length}</span>}
                  </p>
                  <p className="mt-1 truncate text-[17px] font-semibold" dir="auto">
                    {o.groomName} &amp; {o.brideName}
                  </p>
                  <p className="truncate text-[13px] text-[#7A6A55]">
                    {o.templateName.en} · {o.event.date} {o.event.time} · {o.event.city}
                    {o.event.venueName ? ` · ${o.event.venueName}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-[#7A6A55] sm:flex-col sm:items-end sm:justify-center">
                  <span className="font-mono" dir="ltr">
                    +{o.whatsapp}
                  </span>
                  <span>{ago(o.createdAt, now)}</span>
                </div>
              </Link>
            </li>
          );
        })}
        {!items.length && (
          <li className="rounded-2xl border border-dashed border-[#D9C9A8] p-10 text-center text-[#7A6A55]">
            {q || status ? "No orders match." : "No orders yet. Share /order and they'll appear here automatically."}
          </li>
        )}
      </ul>

      {total > PAGE && (
        <div className="mt-5 flex items-center justify-center gap-2 text-[14px]">
          {page > 1 && (
            <Link href={href({ page: page - 1 })} className="rounded-full border border-[#E1D5BE] bg-white px-4 py-2">
              ← Newer
            </Link>
          )}
          <span className="text-[#7A6A55]">
            Page {page} of {Math.ceil(total / PAGE)}
          </span>
          {page * PAGE < total && (
            <Link href={href({ page: page + 1 })} className="rounded-full border border-[#E1D5BE] bg-white px-4 py-2">
              Older →
            </Link>
          )}
        </div>
      )}
    </>
  );
}

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<p className="text-[#7A6A55]">Loading orders…</p>}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}
