import type { LiveState } from "@/live/types";

const T = {
  scheduled: {
    ar: { title: "الدعوة لسه مافتحتش", body: "هتكون متاحة ابتداءً من" },
    en: { title: "This invitation isn't open yet", body: "It opens on" },
  },
  expired: {
    ar: { title: "انتهت هذه الدعوة", body: "شكراً لكل من شاركنا الفرحة 🤍" },
    en: { title: "This invitation has ended", body: "Thank you to everyone who shared our joy 🤍" },
  },
  inactive: {
    ar: { title: "الدعوة غير متاحة حالياً", body: "لو عندك سؤال تواصل مع أصحاب الدعوة." },
    en: { title: "This invitation isn't available right now", body: "If you have a question, please contact the hosts." },
  },
};

/** Shown at /i/<slug> outside the invitation's active period (or when switched off). */
export function LiveStatus({ state, opensAt, timeZone }: { state: Exclude<LiveState, "live">; opensAt?: string | null; timeZone?: string }) {
  const date = (l: "ar" | "en") =>
    opensAt
      ? new Intl.DateTimeFormat(l === "ar" ? "ar-EG" : "en-GB", { dateStyle: "full", timeZone: timeZone ?? "Africa/Cairo" }).format(new Date(opensAt))
      : "";
  return (
    <main className="noor-bg flex min-h-[100svh] items-center justify-center px-6 py-16 text-center text-[#3A2E22]" style={{ background: "#F8F2E7" }}>
      <div className="w-full max-w-[420px] rounded-[28px] border border-[#E1D2B4] bg-[#FFFBF4] px-7 py-12 shadow-[0_30px_60px_-40px_rgba(58,46,34,0.5)]">
        <svg width="34" height="34" viewBox="0 0 24 24" className="mx-auto text-[#B08A45]" aria-hidden>
          <path fill="currentColor" d="M12 2l2.4 4.2L19 5l-1.2 4.6L22 12l-4.2 2.4L19 19l-4.6-1.2L12 22l-2.4-4.2L5 19l1.2-4.6L2 12l4.2-2.4L5 5l4.6 1.2z" opacity=".9" />
        </svg>
        {(["ar", "en"] as const).map((l) => (
          <div key={l} lang={l} dir={l === "ar" ? "rtl" : "ltr"} className={l === "en" ? "mt-8 border-t border-[#E9DCC2] pt-8" : "mt-5"}>
            <h1 className={`text-[26px] leading-snug ${l === "ar" ? "font-[family-name:var(--font-amiri)]" : "font-[family-name:var(--font-cormorant)] text-[30px]"}`}>
              {T[state][l].title}
            </h1>
            <p className="mt-2 text-[15px] text-[#7A6A55]">
              {T[state][l].body} {state === "scheduled" && <strong className="text-[#3A2E22]">{date(l)}</strong>}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
