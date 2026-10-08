import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DEFAULT_TEMPLATES } from "@/catalog/defaults";
import { getDemoPayload } from "@/catalog/demo";
import { getPublishedTemplate } from "@/catalog/read";
import { DemoView } from "@/components/demo/DemoView";

/** Shareable live demo of a catalog template: /demo/<template-id>. */
export async function generateStaticParams() {
  return DEFAULT_TEMPLATES.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/demo/[id]">): Promise<Metadata> {
  const { id } = await params;
  const t = await getPublishedTemplate(id);
  if (!t) return { robots: { index: false } };
  return {
    title: `${t.name.ar} · ${t.name.en} — Mabrouk`,
    description: `${t.description.ar}\n${t.description.en}`,
    robots: { index: true, follow: true },
    openGraph: { title: t.name.ar, description: t.description.ar, siteName: "Mabrouk · مبروك", type: "website" },
  };
}

async function Demo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getDemoPayload(id);
  if (!payload) notFound();
  return <DemoView payload={payload} />;
}

export default function DemoPage({ params }: PageProps<"/demo/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-[#f8f2e7]" />}>
      <Demo params={params} />
    </Suspense>
  );
}
