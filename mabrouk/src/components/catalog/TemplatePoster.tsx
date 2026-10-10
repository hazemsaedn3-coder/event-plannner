import type { CSSProperties } from "react";
import { deriveNoorColors } from "@/catalog/colors";
import type { ShowcaseTemplate } from "@/catalog/types";
import { ArchFrame, Divider, Star8 } from "@/templates/noor/v1/Ornaments";
import { noorThemes, themeStyle } from "@/templates/noor/v1/themes";

type PosterTemplate = Pick<ShowcaseTemplate, "kind" | "thumbnail" | "colors" | "noor" | "variables" | "name">;

/**
 * Preview thumbnail. Uses the uploaded thumbnail when there is one;
 * otherwise draws a vector poster in the template's colors, so every
 * card looks sharp on any screen without extra downloads.
 */
export function TemplatePoster({ template, locale, className = "" }: { template: PosterTemplate; locale: "ar" | "en"; className?: string }) {
  const base = `relative aspect-[3/4] overflow-hidden rounded-[26px] ${className}`;

  if (template.thumbnail) {
    return (
      <div className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={template.thumbnail} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }

  if (template.kind === "duo" && template.noor) {
    const n = template.noor;
    return (
      <div lang={locale} className={`${base}`}>
        <div className="duo-romance absolute inset-0 flex flex-col items-center pt-[14%]" style={{ clipPath: "polygon(0 0,100% 0,100% 44%,0 56%)" }}>
          <span className="text-[26px]" aria-hidden>👰‍♀️</span>
          <span className="f-names mt-1 text-[22px] text-[#D4507A]">{locale === "ar" ? "صحاب العروسة" : "Bride's friends"}</span>
        </div>
        <div className="duo-shaabi absolute inset-0 flex flex-col items-center justify-end overflow-hidden pb-[14%]" style={{ clipPath: "polygon(0 56%,100% 44%,100% 100%,0 100%)" }}>
          <div className="duo-rays" aria-hidden />
          <span className="relative text-[26px]" aria-hidden>🥁</span>
          <span className="f-names duo-neon relative mt-1 text-[24px]">{locale === "ar" ? "صحاب العريس" : "Groom's friends"}</span>
        </div>
        <div className="absolute top-1/2 left-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-white text-center ring-4 ring-[#FFD400]">
          <span className="f-names text-[19px] leading-tight text-[#4A2430]">
            {n.partner1[locale]} <span className="text-[#D4507A]">♥</span> {n.partner2[locale]}
          </span>
        </div>
      </div>
    );
  }

  const c = template.colors;
  const noor = template.kind === "noor" ? template.noor : undefined;
  const colors = noor?.colorsMode === "preset" ? noorThemes[noor.baseTheme].colors : deriveNoorColors(c);
  const style = themeStyle({ ...noorThemes["ivory-gold"], colors }) as CSSProperties;
  const name1 = noor ? noor.partner1[locale] : template.variables.name1 || template.name[locale];
  const name2 = noor ? noor.partner2[locale] : template.variables.name2 || "";
  const date = noor ? noor.date.slice(0, 10).split("-").reverse().join(" · ") : template.variables.date || "";

  return (
    <div lang={locale} className={`noor-bg text-[var(--ink)] ${base}`} style={style}>
      <div className="noor-pattern absolute inset-0" aria-hidden />
      <ArchFrame className="absolute inset-x-6 top-6 bottom-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)]" />
      <div className="relative flex h-full flex-col items-center justify-center px-10 text-center">
        <Star8 size={16} className="text-[var(--accent)]" />
        <p className="f-names mt-4 line-clamp-2 text-[40px] leading-[1.1]">{name1}</p>
        {name2 && (
          <>
            <p className="f-names text-[24px] leading-none text-[var(--accent)]">{locale === "ar" && noor ? "و" : "&"}</p>
            <p className="f-names text-[40px] leading-[1.1]">{name2}</p>
          </>
        )}
        <Divider className="mt-5" />
        {date && (
          <p className="f-display mt-3 text-[17px] tracking-[0.12em]" dir="ltr">
            {date}
          </p>
        )}
        {template.kind === "noor" ? (
          <span
            className="mt-6 block h-10 w-10 rounded-full shadow-md"
            style={{ background: `radial-gradient(circle at 35% 30%, ${colors.seal}, ${colors.sealDark})` }}
            aria-hidden
          />
        ) : (
          <span className="mt-6 rounded-full border border-[var(--line)] px-3 py-1 text-[11px] tracking-[0.2em] text-[var(--accent)] uppercase">
            HTML
          </span>
        )}
      </div>
    </div>
  );
}
