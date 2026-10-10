import type { DemoPayload } from "@/catalog/demo";
import DuoInvitation from "@/templates/duo/v1/DuoInvitation";
import { resolveTemplate } from "@/templates/registry";
import { DemoShell } from "./DemoShell";

/** Renders a template demo (Noor engine or sandboxed HTML) inside the demo shell. */
export function DemoView({ payload }: { payload: DemoPayload }) {
  const { template, locale } = payload;
  const name = template.name[locale];
  const Noor = payload.noorView && !payload.duo ? resolveTemplate("noor", 1).Component : null;

  return (
    <DemoShell
      tracks={payload.tracks}
      shareUrl={payload.shareUrl}
      orderUrl={payload.orderUrl}
      ctaLabel={template.ctaText[locale]}
      shareText={name}
      galleryHref={locale === "ar" ? "/#designs" : "/en#designs"}
      locale={locale}
      clientName={payload.clientName}
      autoStartOnTap={template.kind === "noor"}
    >
      {payload.duo && payload.noorView ? (
        <DuoInvitation view={payload.noorView} duo={payload.duo} />
      ) : Noor && payload.noorView ? (
        <Noor view={payload.noorView} />
      ) : (
        <iframe
          title={name}
          srcDoc={payload.htmlDoc}
          // No allow-same-origin: imported code runs in an opaque origin and
          // can't read this site's cookies or storage.
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
          referrerPolicy="no-referrer"
          className="fixed inset-0 h-[100svh] w-full border-0"
          style={{ background: template.colors.background }}
        />
      )}
    </DemoShell>
  );
}
