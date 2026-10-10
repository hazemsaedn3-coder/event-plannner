import Link from "next/link";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { CopyLink } from "@/components/invite/CopyLink";
import { absoluteUrl } from "@/config/site";
import { requireAdmin } from "@/lib/admin-auth";
import { getLiveStore } from "@/live/store";
import { liveState, type LiveState } from "@/live/types";
import { deleteInvitation, setInvitationStatus } from "../../production-actions";

const STATE: Record<LiveState, { label: string; tone: string }> = {
  live: { label: "Live", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  scheduled: { label: "Scheduled", tone: "bg-sky-50 text-sky-800 ring-sky-200" },
  expired: { label: "Expired", tone: "bg-stone-100 text-stone-700 ring-stone-300" },
  inactive: { label: "Inactive", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
};

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "∞");

async function Invitations() {
  await requireAdmin();
  const store = getLiveStore();
  const [list, usage] = await Promise.all([store.list(), store.usage().catch(() => ({}) as Awaited<ReturnType<typeof store.usage>>)]);
  const now = new Date();
  const live = list.filter((i) => liveState(i, now) === "live").length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[34px] leading-tight">Invitations</h1>
          <p className="text-[14px] text-[#7A6A55]">
            {live} live · {list.length} total · production links at /i/…
          </p>
        </div>
        <Link href="/admin/invitations/new" className="rounded-full bg-gradient-to-b from-[#C9A45C] to-[#A9823C] px-5 py-2.5 text-[14px] font-semibold text-white">
          ✦ Generate invitation
        </Link>
      </div>

      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {list.map((inv) => {
          const state = liveState(inv, now);
          const u = usage[inv.slug];
          const url = absoluteUrl(`/i/${inv.slug}`);
          return (
            <li key={inv.slug} className="flex flex-col gap-3 rounded-3xl border border-[#E7DCC6] bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/admin/invitations/${inv.slug}`} className="block truncate text-[17px] font-semibold hover:underline" dir="auto">
                    {inv.clientName || inv.slug}
                  </Link>
                  <p className="truncate font-mono text-[12px] text-[#A0907A]">/i/{inv.slug}</p>
                  <p className="truncate text-[13px] text-[#7A6A55]">
                    {inv.templateName.en} · {inv.validity.mode === "event" ? "Event date" : "Date range"}: {day(inv.validFrom)} → {day(inv.validUntil)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] ring-1 ${STATE[state].tone}`}>{STATE[state].label}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["Opens", u?.views ?? 0],
                  ["RSVPs", u?.rsvps ?? 0],
                  ["Attending", u?.attending ?? 0],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-[#F6F3EE] py-2">
                    <p className="text-[18px] font-semibold">{v}</p>
                    <p className="text-[11px] text-[#7A6A55]">{k}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-[13px]">
                <Link href={`/admin/invitations/${inv.slug}`} className="rounded-full bg-[#2A2420] px-3 py-1.5 text-white">
                  Edit
                </Link>
                <a href={`/i/${inv.slug}`} target="_blank" className="rounded-full border border-[#E1D5BE] px-3 py-1.5">
                  Open ↗
                </a>
                <CopyLink value={url} label="Copy link" done="Copied ✓" />
                <form action={setInvitationStatus.bind(null, inv.slug, inv.status === "active" ? "inactive" : "active")}>
                  <button className="rounded-full border border-[#E1D5BE] px-3 py-1.5">{inv.status === "active" ? "Deactivate" : "Activate"}</button>
                </form>
                {inv.orderId && (
                  <Link href={`/admin/orders/${inv.orderId}`} className="rounded-full border border-[#E1D5BE] px-3 py-1.5">
                    Order
                  </Link>
                )}
                <ConfirmButton action={deleteInvitation.bind(null, inv.slug)} message={`Delete /i/${inv.slug}? The link will stop working.`}>
                  Delete
                </ConfirmButton>
              </div>
            </li>
          );
        })}
        {!list.length && (
          <li className="col-span-full rounded-3xl border border-dashed border-[#D9C9A8] p-10 text-center text-[#7A6A55]">
            No production invitations yet. Generate one from an order, or start from a design.
          </li>
        )}
      </ul>
    </>
  );
}

export default function InvitationsPage() {
  return (
    <Suspense fallback={<p className="text-[#7A6A55]">Loading invitations…</p>}>
      <Invitations />
    </Suspense>
  );
}
