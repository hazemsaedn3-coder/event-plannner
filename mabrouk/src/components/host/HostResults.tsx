"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CopyLink } from "@/components/invite/CopyLink";
import type { Locale } from "@/lib/types";

export interface ResultReply {
  id: string;
  name: string;
  attending: boolean;
  headcount: number;
  message?: string;
  updatedAt: string;
  /** Set when the reply came from a personal guest link. */
  guestCode?: string;
}

export interface ResultGuest {
  code: string;
  name: string;
  seats: number;
  events: string;
  note?: string;
  views: number;
  reply?: { attending: boolean; headcount: number };
  link: string;
  whatsappHref: string;
}

export interface ResultsData {
  locale: Locale;
  couple: string;
  stats: { attendingPeople: number; replies: number; declined: number; pending: number; opens: number; invitedSeats: number };
  replies: ResultReply[];
  guests: ResultGuest[];
  csvHref: string;
  inviteUrl: string;
  otherLangHref: string;
  localStorageNote: boolean;
}

const L = {
  kicker: { ar: "صفحة نتائج الدعوة", en: "Invitation results" },
  private: { ar: "صفحة خاصة بيكم، ماتبعتوهاش للضيوف", en: "Private to you. Don't share it with guests" },
  attending: { ar: "شخص هيحضر", en: "people attending" },
  replies: { ar: "رد", en: "replies" },
  declined: { ar: "اعتذار", en: "declined" },
  pending: { ar: "لسه مردوش", en: "yet to reply" },
  opens: { ar: "مرة اتفتحت الدعوة", en: "invitation opens" },
  ofSeats: { ar: "من", en: "of" },
  seats: { ar: "مقعد", en: "seats" },
  all: { ar: "كل الردود", en: "All replies" },
  yesTab: { ar: "هيحضروا", en: "Attending" },
  noTab: { ar: "معتذرين", en: "Declined" },
  wishes: { ar: "التهاني والرسائل", en: "Wishes & messages" },
  guests: { ar: "قائمة الضيوف", en: "Guest list" },
  search: { ar: "ابحث بالاسم…", en: "Search by name…" },
  empty: { ar: "لسه مفيش ردود هنا. أول ما حد يأكد هيظهر فوراً.", en: "Nothing here yet. Replies appear here as soon as guests send them." },
  noWishes: { ar: "لسه مفيش رسائل.", en: "No messages yet." },
  yes: { ar: "هيحضر", en: "Attending" },
  no: { ar: "معتذر", en: "Declined" },
  waiting: { ar: "مستني الرد", en: "No reply yet" },
  people: { ar: "أشخاص", en: "people" },
  personal: { ar: "رابط شخصي", en: "Personal link" },
  send: { ar: "ابعت واتساب", en: "Send on WhatsApp" },
  copy: { ar: "نسخ الرابط", en: "Copy link" },
  copied: { ar: "اتنسخ ✓", en: "Copied ✓" },
  csv: { ar: "تحميل Excel", en: "Download Excel (CSV)" },
  view: { ar: "افتح الدعوة", en: "Open invitation" },
  copyInvite: { ar: "نسخ رابط الدعوة", en: "Copy invitation link" },
  refresh: { ar: "تحديث", en: "Refresh" },
  updated: { ar: "آخر تحديث", en: "Updated" },
  auto: { ar: "بيتحدث تلقائياً كل ٣٠ ثانية", en: "Refreshes automatically every 30 s" },
  lang: { ar: "English", en: "عربي" },
  localNote: {
    ar: "تنبيه: التخزين المحلي مفعّل (بدون Supabase). البيانات قد لا تُحفظ على الخادم.",
    en: "Note: local storage mode (no Supabase). Data may not persist on the server.",
  },
};

type Tab = "all" | "yes" | "no" | "wishes" | "guests";

export function HostResults({ data }: { data: ResultsData }) {
  const { locale } = data;
  const tr = (x: { ar: string; en: string }) => x[locale];
  const nf = useMemo(() => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US"), [locale]);
  const df = useMemo(() => new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" }), [locale]);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");

  const refresh = () =>
    startTransition(() => {
      router.refresh();
      setUpdatedAt(new Date());
    });

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = data.stats;
  const match = (name: string) => !q.trim() || name.toLowerCase().includes(q.trim().toLowerCase());
  const replies = data.replies.filter((r) => match(r.name) && (tab === "yes" ? r.attending : tab === "no" ? !r.attending : tab === "wishes" ? Boolean(r.message) : true));
  const guests = data.guests.filter((g) => match(g.name));
  const wishCount = data.replies.filter((r) => r.message).length;
  const pct = s.invitedSeats ? Math.min(100, Math.round((s.attendingPeople / s.invitedSeats) * 100)) : 0;

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "all", label: tr(L.all), n: data.replies.length },
    { id: "yes", label: tr(L.yesTab), n: data.replies.length - s.declined },
    { id: "no", label: tr(L.noTab), n: s.declined },
    { id: "wishes", label: tr(L.wishes), n: wishCount },
    ...(data.guests.length ? [{ id: "guests" as Tab, label: tr(L.guests), n: data.guests.length }] : []),
  ];

  return (
    <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="f-body mx-auto min-h-[100svh] max-w-3xl px-4 pt-6 pb-20 text-[#3a2e22]">
      <header className="relative overflow-hidden rounded-[28px] bg-[#2b211a] px-6 py-7 text-[#f8f2e7] shadow-[0_24px_50px_-30px_rgba(0,0,0,0.6)]">
        <div className="pointer-events-none absolute -top-24 -end-16 h-56 w-56 rounded-full bg-[#c9a24a]/25 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] tracking-wide text-[#e2c277]">{tr(L.kicker)}</p>
            <h1 className="f-display mt-1 text-[34px] leading-tight">{data.couple}</h1>
            <p className="mt-1 text-[12px] text-[#f8f2e7]/60">🔒 {tr(L.private)}</p>
          </div>
          <a href={data.otherLangHref} className="shrink-0 rounded-full border border-[#e2c277]/50 px-4 py-2 text-[14px]">
            {tr(L.lang)}
          </a>
        </div>

        <div className="relative mt-6 flex items-end gap-4">
          <p className="f-display text-[56px] leading-none text-[#f3d98f]">{nf.format(s.attendingPeople)}</p>
          <p className="pb-2 text-[15px]">
            {tr(L.attending)}
            {s.invitedSeats > 0 && (
              <span className="text-[#f8f2e7]/60">
                {" "}
                {tr(L.ofSeats)} {nf.format(s.invitedSeats)} {tr(L.seats)}
              </span>
            )}
          </p>
        </div>
        {s.invitedSeats > 0 && (
          <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-[#c9a24a] to-[#f3d98f] transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
        )}
      </header>

      {data.localStorageNote && <p className="mt-4 rounded-xl bg-amber-100 p-3 text-[13px] text-amber-900">{tr(L.localNote)}</p>}

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { v: s.replies, l: L.replies, c: "text-[#3a2e22]" },
          { v: s.declined, l: L.declined, c: "text-rose-700" },
          { v: s.pending, l: L.pending, c: "text-amber-700", hide: !data.guests.length },
          { v: s.opens, l: L.opens, c: "text-[#8a6a2f]" },
        ]
          .filter((x) => !x.hide)
          .map((x, i) => (
            <div key={i} className="rounded-2xl border border-[#e7dcc6] bg-white/80 p-4">
              <p className={`f-display text-[30px] leading-none ${x.c}`}>{nf.format(x.v)}</p>
              <p className="mt-2 text-[13px] text-[#7a6a55]">{tr(x.l)}</p>
            </div>
          ))}
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a href={data.csvHref} className="rounded-full bg-[#3a2e22] px-4 py-2.5 text-[14px] text-[#f8f2e7]">
          ⬇ {tr(L.csv)}
        </a>
        <a href={data.inviteUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#d9c9a8] bg-white/70 px-4 py-2.5 text-[14px]">
          {tr(L.view)} ↗
        </a>
        <CopyLink value={data.inviteUrl} label={tr(L.copyInvite)} done={tr(L.copied)} />
        <button type="button" onClick={refresh} disabled={pending} className="ms-auto rounded-full border border-[#d9c9a8] bg-white/70 px-4 py-2.5 text-[14px] disabled:opacity-50">
          <span className={pending ? "inline-block animate-spin" : "inline-block"}>↻</span> {tr(L.refresh)}
        </button>
      </div>
      <p className="mt-2 text-[12px] text-[#a0907a]">
        {tr(L.updated)}: {updatedAt.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" })} · {tr(L.auto)}
      </p>

      <nav className="sticky top-0 z-10 -mx-4 mt-6 flex gap-2 overflow-x-auto bg-[#f8f2e7]/95 px-4 py-3 backdrop-blur [scrollbar-width:none]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-[14px] transition ${tab === t.id ? "bg-[#3a2e22] text-[#f8f2e7]" : "border border-[#e7dcc6] bg-white/70"}`}
          >
            {t.label} <span className="opacity-60">{nf.format(t.n)}</span>
          </button>
        ))}
      </nav>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={tr(L.search)}
        className="mt-2 w-full rounded-2xl border border-[#e7dcc6] bg-white px-4 py-3 text-[15px] outline-none focus:border-[#b08a45]"
      />

      {tab === "guests" ? (
        <ul className="mt-4 flex flex-col gap-3">
          {guests.map((g) => (
            <li key={g.code} className="rounded-2xl border border-[#e7dcc6] bg-white/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold">{g.name}</p>
                  <p className="mt-0.5 text-[13px] text-[#7a6a55]">
                    {nf.format(g.seats)} {tr(L.seats)} — {g.events}
                  </p>
                  {g.note && <p className="mt-1 text-[12px] text-[#b08a45]">{g.note}</p>}
                </div>
                <Badge reply={g.reply} tr={tr} nf={nf} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a href={g.whatsappHref} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] px-4 py-2 text-[13px] font-semibold text-white">
                  {tr(L.send)}
                </a>
                <CopyLink value={g.link} label={tr(L.copy)} done={tr(L.copied)} />
                <span className="text-[12px] text-[#7a6a55]">👁 {nf.format(g.views)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : replies.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-[#d9c9a8] p-8 text-center text-[15px] text-[#7a6a55]">{tab === "wishes" ? tr(L.noWishes) : tr(L.empty)}</p>
      ) : tab === "wishes" ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {replies.map((r) => (
            <li key={r.id} className="relative rounded-3xl border border-[#ead9b4] bg-gradient-to-b from-white to-[#fbf5e8] p-5">
              <span className="f-display absolute -top-3 start-4 text-[44px] leading-none text-[#c9a24a]/50">”</span>
              <p dir="auto" className="text-[16px] leading-relaxed whitespace-pre-line">{r.message}</p>
              <p className="mt-3 text-[14px] font-semibold text-[#8a6a2f]">
                — <bdi>{r.name}</bdi>
              </p>
              <p className="text-[12px] text-[#a0907a]">{df.format(new Date(r.updatedAt))}</p>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {replies.map((r) => (
            <li key={r.id} className="rounded-2xl border border-[#e7dcc6] bg-white/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p dir="auto" className="text-[16px] font-semibold">{r.name}</p>
                  {r.guestCode && <p className="text-[11px] text-[#b08a45]">{tr(L.personal)}</p>}
                </div>
                <Badge reply={r} tr={tr} nf={nf} />
              </div>
              {r.message && <p dir="auto" className="mt-2 rounded-xl bg-[#f8f2e7] px-3 py-2 text-[15px] leading-relaxed whitespace-pre-line">“{r.message}”</p>}
              <p className="mt-2 text-[12px] text-[#7a6a55]">{df.format(new Date(r.updatedAt))}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Badge({
  reply,
  tr,
  nf,
}: {
  reply?: { attending: boolean; headcount: number };
  tr: (x: { ar: string; en: string }) => string;
  nf: Intl.NumberFormat;
}) {
  const cls = !reply ? "bg-stone-100 text-stone-600" : reply.attending ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-[12px] ${cls}`}>
      {!reply ? tr(L.waiting) : reply.attending ? `${tr(L.yes)} · ${nf.format(reply.headcount)} ${tr(L.people)}` : tr(L.no)}
    </span>
  );
}
