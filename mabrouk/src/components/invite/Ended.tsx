import { dirOf, t, ui } from "@/lib/i18n";
import type { InvitationView } from "@/lib/view";
import { resolveTemplate } from "@/templates/registry";
import { themeStyle } from "@/templates/noor/v1/themes";
import type { CSSProperties } from "react";

/** Shown once an invitation passes its expiry (default: 6 months after the wedding). */
export function Ended({ view }: { view: InvitationView }) {
  const theme = resolveTemplate(view.templateId, view.templateVersion).themes[view.themeId];
  const l = view.initialLocale;
  return (
    <main
      lang={l}
      dir={dirOf(l)}
      className="noor-bg flex min-h-[100svh] flex-col items-center justify-center px-8 text-center text-[var(--ink)]"
      style={themeStyle(theme) as CSSProperties}
    >
      <p className="f-names text-[44px]">
        {t(view.partner1, l)} <span className="text-[var(--accent)]">{l === "ar" ? "و" : "&"}</span> {t(view.partner2, l)}
      </p>
      <h1 className="f-display mt-6 text-[24px]">{t(ui.ended, l)}</h1>
      <p className="f-body mt-2 text-[16px] text-[var(--ink-soft)]">{t(ui.endedBody, l)}</p>
      <a href={l === "ar" ? "/" : "/en"} className="f-body mt-12 text-[13px] text-[var(--ink-soft)]">
        {t(ui.madeWith, l)} <span className="text-[var(--accent)]">{l === "ar" ? "مبروك" : "Mabrouk"}</span>
      </a>
    </main>
  );
}
