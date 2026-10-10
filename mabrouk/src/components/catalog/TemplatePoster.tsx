import type { CSSProperties } from "react";
import { deriveNoorColors } from "@/catalog/colors";
import type { ShowcaseTemplate } from "@/catalog/types";
import { ArchFrame, Divider, Star8 } from "@/templates/noor/v1/Ornaments";
import { noorThemes, themeStyle } from "@/templates/noor/v1/themes";
import "@/templates/duo/v1/duo.css";
import { layaliLook } from "@/templates/layali/v1/looks";
import { EmbossedPaper, WaxSeal } from "@/templates/layali/v1/Paper";
import { neonText, palette, romanceVars, shaabiVars } from "@/templates/duo/v1/palettes";

type PosterTemplate = Pick<ShowcaseTemplate, "kind" | "thumbnail" | "colors" | "noor" | "duo" | "variables" | "name"> & Partial<Pick<ShowcaseTemplate, "layali" | "id">>;

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
    return <DuoPoster template={template} locale={locale} base={base} />;
  }

  if (template.kind === "layali" && template.noor) {
    return <LayaliPoster template={template} locale={locale} base={base} />;
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

/** Mini preview of a two-entrance template, drawn in its own style and palette. */
function DuoPoster({ template, locale, base }: { template: PosterTemplate; locale: "ar" | "en"; base: string }) {
  const p = palette(template.duo?.palette);
  const style = template.duo?.style ?? "diagonal";
  const n = template.noor!;
  const brideLabel = locale === "ar" ? "صحاب العروسة" : "Bride's friends";
  const groomLabel = locale === "ar" ? "صحاب العريس" : "Groom's friends";
  const names = (
    <span className="f-names text-[17px] leading-tight" style={{ color: p.romance.ink }}>
      {n.partner1[locale]} <span style={{ color: p.romance.accent }}>♥</span> {n.partner2[locale]}
    </span>
  );
  const badge = (size: number) => (
    <div
      className="flex flex-col items-center justify-center rounded-full bg-white text-center"
      style={{ width: size, height: size, boxShadow: `0 0 0 3px ${p.shaabi.accent}, 0 0 0 7px ${p.romance.accent}55` }}
    >
      {names}
    </div>
  );

  if (style === "doors") {
    const door = (bride: boolean) => (
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative h-[150px] w-[92px] overflow-hidden rounded-t-full"
          style={{ ...(bride ? romanceVars(p) : shaabiVars(p)), boxShadow: `0 0 0 3px ${bride ? p.romance.accent : p.shaabi.accent}` }}
        >
          <span className="absolute inset-y-0 left-1/2 w-px" style={{ background: bride ? p.romance.accent : p.shaabi.accent }} />
          <span className="absolute top-1/2 left-[42%] h-2 w-2 rounded-full" style={{ background: bride ? p.romance.accent : p.shaabi.accent }} />
          <span className="absolute top-1/2 right-[42%] h-2 w-2 rounded-full" style={{ background: bride ? p.romance.accent : p.shaabi.accent }} />
        </div>
        <span className="f-names text-[15px]" style={bride ? { color: p.romance.accent } : neonText(p)}>
          {bride ? brideLabel : groomLabel}
        </span>
      </div>
    );
    return (
      <div lang={locale} className={`${base} flex flex-col items-center justify-center gap-4`} style={{ background: `linear-gradient(90deg, ${p.romance.bg2}, ${p.romance.bg} 46%, ${p.shaabi.glow} 54%, ${p.shaabi.bg})` }}>
        {badge(96)}
        <div className="flex items-start gap-3" dir="ltr">
          {door(locale === "ar" ? false : true)}
          <span className="mt-4 h-[120px] w-[3px] rounded-full" style={{ background: `linear-gradient(${p.romance.accent}, ${p.shaabi.accent})` }} />
          {door(locale === "ar")}
        </div>
      </div>
    );
  }

  if (style === "tickets") {
    const ticket = (bride: boolean) => (
      <div
        className="flex h-[78px] w-[84%] items-center justify-between rounded-xl px-4"
        style={{ ...(bride ? romanceVars(p) : shaabiVars(p)), rotate: bride ? "-3deg" : "2deg", boxShadow: "0 10px 20px -10px rgba(0,0,0,0.5)" }}
      >
        <span className="f-names text-[19px]" style={bride ? { color: p.romance.accent } : neonText(p)}>
          {bride ? brideLabel : groomLabel}
        </span>
        <span className="h-12 border-s-2 border-dashed" style={{ borderColor: bride ? p.romance.accent : p.shaabi.accent }} />
      </div>
    );
    return (
      <div lang={locale} className={`${base} flex flex-col items-center justify-center gap-3`} style={{ background: `linear-gradient(180deg, ${p.romance.bg}, ${p.romance.bg2} 38%, ${p.shaabi.glow} 62%, ${p.shaabi.bg2})` }}>
        {badge(92)}
        {ticket(true)}
        <span className="f-display flex h-8 w-8 items-center justify-center rounded-full bg-white text-[12px]" style={{ color: p.romance.ink, boxShadow: `0 0 0 2px ${p.shaabi.accent}` }}>
          {locale === "ar" ? "أو" : "or"}
        </span>
        {ticket(false)}
      </div>
    );
  }

  if (style === "split") {
    return (
      <div lang={locale} className={`${base} flex`}>
        <div className="flex w-1/2 flex-col items-center justify-end pb-[22%] text-center" style={romanceVars(p)}>
          <span className="text-[22px]" aria-hidden>👰‍♀️</span>
          <span className="f-names px-2 text-[18px] leading-tight" style={{ color: p.romance.accent }}>{brideLabel}</span>
        </div>
        <div className="relative flex w-1/2 flex-col items-center justify-end overflow-hidden pb-[22%] text-center" style={shaabiVars(p)}>
          <div className="duo-rays" aria-hidden />
          <span className="relative text-[22px]" aria-hidden>🥁</span>
          <span className="f-names relative px-2 text-[18px] leading-tight" style={neonText(p)}>{groomLabel}</span>
        </div>
        <span className="absolute inset-y-0 left-1/2 w-[5px] -translate-x-1/2" style={{ background: `repeating-linear-gradient(180deg, #fff 0 10px, ${p.shaabi.accent} 10px 20px)` }} />
        <div className="absolute top-[24%] left-1/2 -translate-x-1/2 -translate-y-1/2">{badge(100)}</div>
      </div>
    );
  }

  return (
    <div lang={locale} className={base}>
      <div className="absolute inset-0 flex flex-col items-center pt-[14%]" style={{ ...romanceVars(p), clipPath: "polygon(0 0,100% 0,100% 44%,0 56%)" }}>
        <span className="text-[26px]" aria-hidden>👰‍♀️</span>
        <span className="f-names mt-1 text-[22px]" style={{ color: p.romance.accent }}>{brideLabel}</span>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-end overflow-hidden pb-[14%]" style={{ ...shaabiVars(p), clipPath: "polygon(0 56%,100% 44%,100% 100%,0 100%)" }}>
        <div className="duo-rays" aria-hidden />
        <span className="relative text-[26px]" aria-hidden>🥁</span>
        <span className="f-names relative mt-1 text-[24px]" style={neonText(p)}>{groomLabel}</span>
      </div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <line x1="0" y1="56" x2="100" y2="44" stroke="#fff" strokeWidth="6" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1="56" x2="100" y2="44" stroke={p.shaabi.accent} strokeWidth="2.5" strokeDasharray="8 6" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{badge(108)}</div>
    </div>
  );
}

/** Cinematic designs: the sealed, embossed envelope itself is the poster. */
function LayaliPoster({ template, locale, base }: { template: PosterTemplate; locale: "ar" | "en"; base: string }) {
  const look = layaliLook(template.layali?.look);
  const n = template.noor!;
  const uid = `poster-${template.id ?? template.name.en}`.replace(/[^a-zA-Z0-9-]/g, "");
  const initials = locale === "ar" ? `${n.partner1.ar.replace(/^ال/, "")[0] ?? ""}${n.partner2.ar.replace(/^ال/, "")[0] ?? ""}` : `${n.latin1[0] ?? ""}&${n.latin2[0] ?? ""}`;
  return (
    <div className={base} style={{ background: look.lining }}>
      <EmbossedPaper uid={`${uid}-p`} motif={look.motif} color={look.paper} scale={0.7} />
      <div className="absolute inset-x-0 top-0 h-[56%]" style={{ clipPath: "polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)", filter: "drop-shadow(0 8px 10px rgba(0,0,0,.45))" }}>
        <EmbossedPaper uid={`${uid}-f`} motif={look.motif} color={look.flap} scale={0.7} relief={4} />
      </div>
      <div className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,.45))" }}>
        <WaxSeal uid={`${uid}-s`} colors={look.seal} monogram={initials} size={84} />
      </div>
      <p className="absolute inset-x-0 top-[72%] text-center text-[26px] leading-tight" style={{ color: look.envelopeInk, fontFamily: locale === "ar" ? "var(--font-aref), serif" : "var(--font-pinyon), serif" }}>
        {n.partner1[locale]} {locale === "ar" ? "و" : "&"} {n.partner2[locale]}
      </p>
      <p className="absolute inset-x-0 top-[84%] text-center text-[12px] tracking-[0.3em]" style={{ color: look.envelopeInk, fontFamily: "var(--font-cormorant), serif" }}>
        {n.date.slice(0, 10).split("-").reverse().join(" · ")}
      </p>
    </div>
  );
}
