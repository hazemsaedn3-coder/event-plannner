"use client";

import { AnimatePresence, m } from "motion/react";
import { useState, type FormEvent } from "react";
import { ui } from "@/lib/i18n";
import type { InvitationView } from "@/lib/view";
import { useLocale } from "../../shared/LocaleContext";
import { Divider, Icon } from "./Ornaments";
import { Reveal } from "./Sections";

type Status = "idle" | "sending" | "done" | "error";

export function Rsvp({ view }: { view: InvitationView }) {
  const { tr, locale } = useLocale();
  const guest = view.guest;
  const max = view.rsvp.maxHeadcount;

  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [headcount, setHeadcount] = useState(1);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [answer, setAnswer] = useState<boolean | null>(null);

  if (!view.rsvp.enabled || view.features?.rsvp === false) return null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (attending == null) return;
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    if (view.isDemo) {
      // Demos show the real flow but store nothing.
      await new Promise((r) => setTimeout(r, 600));
      setAnswer(attending);
      setStatus("done");
      return;
    }
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: view.slug,
          guestCode: guest?.code,
          name: guest ? undefined : name,
          attending,
          headcount: attending ? headcount : 0,
          message,
          locale,
          website: form.get("website"), // honeypot
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setAnswer(attending);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US");
  const field =
    "f-body w-full rounded-[12px] border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-[16px] text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 outline-none focus:border-[var(--accent)]";

  return (
    <section id="rsvp" className="px-5 py-14">
      <Reveal>
        <div className="mx-auto max-w-[400px] rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-6 py-9">
          <h2 className="f-display text-center text-[30px] text-[var(--ink)]">{tr(ui.rsvp)}</h2>
          <Divider className="mt-3" />
          {view.rsvp.deadline && view.rsvp.open && (
            <p className="f-body mt-4 text-center text-[14px] text-[var(--ink-soft)]">
              {tr(ui.rsvpBy)} {tr(view.rsvp.deadline)}
            </p>
          )}
          {guest && (
            <div className="f-body mt-3 text-center">
              <p className="text-[17px] text-[var(--ink)]">{tr(guest.displayName)}</p>
              <p className="text-[14px] text-[var(--accent)]">
                {tr(ui.seatsReserved)} {nf.format(guest.seats)}
              </p>
            </div>
          )}

          {!view.rsvp.open ? (
            <p className="f-body mt-6 text-center text-[15px] text-[var(--ink-soft)]">{tr(ui.rsvpClosed)}</p>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {status === "done" ? (
                <m.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 text-center"
                >
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Icon name="check" className="h-7 w-7" />
                  </span>
                  <p className="f-display mt-4 text-[22px] text-[var(--ink)]">
                    {tr(answer ? ui.thanksYes : ui.thanksNo)}
                  </p>
                  {view.isDemo && <p className="f-body mt-2 text-[13px] text-[var(--ink-soft)]">{tr(ui.demoNote)}</p>}
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="f-body mt-5 text-[14px] text-[var(--accent)] underline underline-offset-4"
                  >
                    {tr(ui.changeAnswer)}
                  </button>
                </m.div>
              ) : (
                <m.form
                  key="form"
                  onSubmit={submit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-7 flex flex-col gap-4"
                >
                  {!guest && (
                    <label className="flex flex-col gap-1.5">
                      <span className="f-body text-[14px] text-[var(--ink-soft)]">{tr(ui.yourName)}</span>
                      <input
                        className={field}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={80}
                        autoComplete="name"
                      />
                    </label>
                  )}

                  {/* honeypot: hidden from people, irresistible to bots */}
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

                  <div className="grid grid-cols-2 gap-2.5" role="radiogroup">
                    {[true, false].map((value) => (
                      <button
                        key={String(value)}
                        type="button"
                        role="radio"
                        aria-checked={attending === value}
                        onClick={() => setAttending(value)}
                        className={`f-body min-h-14 rounded-[12px] border px-3 py-3 text-[14px] leading-snug transition ${
                          attending === value
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                            : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
                        }`}
                      >
                        {tr(value ? ui.attending : ui.notAttending)}
                      </button>
                    ))}
                  </div>

                  {attending && max > 1 && (
                    <div className="flex items-center justify-between rounded-[12px] border border-[var(--line)] bg-[var(--bg)] px-4 py-2">
                      <span className="f-body text-[14px] text-[var(--ink-soft)]">{tr(ui.headcount)}</span>
                      <div className="flex items-center gap-3" dir="ltr">
                        <button
                          type="button"
                          aria-label="−"
                          onClick={() => setHeadcount((h) => Math.max(1, h - 1))}
                          className="h-10 w-10 rounded-full border border-[var(--line)] text-[20px] text-[var(--accent)] disabled:opacity-30"
                          disabled={headcount <= 1}
                        >
                          −
                        </button>
                        <span className="f-display w-6 text-center text-[22px] text-[var(--ink)]">{nf.format(headcount)}</span>
                        <button
                          type="button"
                          aria-label="+"
                          onClick={() => setHeadcount((h) => Math.min(max, h + 1))}
                          className="h-10 w-10 rounded-full border border-[var(--line)] text-[20px] text-[var(--accent)] disabled:opacity-30"
                          disabled={headcount >= max}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  <label className="flex flex-col gap-1.5">
                    <span className="f-body text-[14px] text-[var(--ink-soft)]">{tr(ui.messageToCouple)}</span>
                    <textarea
                      className={`${field} min-h-24 resize-none`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={500}
                    />
                  </label>

                  {status === "error" && (
                    <p className="f-body text-center text-[14px] text-red-600" role="alert">
                      {tr(ui.error)}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={attending == null || status === "sending"}
                    className="f-display mt-1 min-h-13 rounded-full bg-[var(--ink)] px-6 py-3.5 text-[19px] text-[var(--bg)] transition active:scale-[0.98] disabled:opacity-40"
                  >
                    {tr(status === "sending" ? ui.sending : ui.send)}
                  </button>
                </m.form>
              )}
            </AnimatePresence>
          )}
        </div>
      </Reveal>
    </section>
  );
}
