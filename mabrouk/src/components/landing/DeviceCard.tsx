import { TemplatePoster } from "@/components/catalog/TemplatePoster";
import type { ShowcaseTemplate } from "@/catalog/types";
import { layaliLook } from "@/templates/layali/v1/looks";
import { EmbossedPaper } from "@/templates/layali/v1/Paper";

/**
 * A design presented like a product shot: the invitation on a phone,
 * standing on a backdrop in the design's own world (embossed paper for
 * cinematic designs, a soft photo for the others).
 */
export function DeviceCard({ template, locale, liveLabel }: { template: ShowcaseTemplate; locale: "ar" | "en"; liveLabel: string }) {
  const look = template.kind === "layali" ? layaliLook(template.layali?.look) : null;
  const photo = template.noor?.couple?.images?.[0] ?? template.noor?.venueShowcase?.images?.[0];
  const c = template.colors;
  const glow = look ? look.foil[1] : c.accent;

  return (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-35px_rgba(0,0,0,0.55)]" style={{ background: look?.page.bg2 ?? c.background }}>
      {look ? (
        <EmbossedPaper uid={`dc-${template.id}`} motif={look.motif} color={look.paper} scale={0.8} strength={0.7} />
      ) : photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-110 object-cover blur-[3px]" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c.background}99, ${c.background}E6)` }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: `radial-gradient(90% 70% at 50% 30%, ${c.surface}, ${c.background})` }} />
      )}
      {/* light pooling under the phone */}
      <div className="absolute inset-x-[15%] bottom-[4%] h-[18%] rounded-[50%] blur-2xl" style={{ background: `${glow}66` }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(70% 55% at 50% 45%, transparent 40%, rgba(0,0,0,0.28) 100%)" }} />

      {/* the phone */}
      <div
        className="absolute top-[7%] left-1/2 aspect-[9/18.5] w-[54%] -translate-x-1/2 rounded-[30px] bg-[#111] p-[5px] shadow-[0_26px_50px_-18px_rgba(0,0,0,0.7)] transition duration-500 group-hover:-translate-y-2 group-hover:rotate-[-1.5deg]"
      >
        <div className="absolute top-[9px] left-1/2 z-10 h-[10px] w-[34%] -translate-x-1/2 rounded-full bg-[#111]" />
        <div className="relative h-full w-full overflow-hidden rounded-[25px]">
          <TemplatePoster template={template} locale={locale} className="!absolute inset-0 !aspect-auto h-full !rounded-none" />
        </div>
      </div>

      <span className="absolute end-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white backdrop-blur-md">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        {liveLabel}
      </span>
    </div>
  );
}
