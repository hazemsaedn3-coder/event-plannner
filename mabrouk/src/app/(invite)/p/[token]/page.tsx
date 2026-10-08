import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLinkPayload } from "@/catalog/demo";
import { DemoView } from "@/components/demo/DemoView";

/** Personalised preview sent to one client: /p/<token>. Never indexed. */
export const metadata: Metadata = {
  title: "معاينة خاصة · Private preview — Mabrouk",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export async function generateStaticParams() {
  return [{ token: "__none__" }];
}

async function Preview({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await getLinkPayload(token);
  if (!payload) notFound();
  return <DemoView payload={payload} />;
}

export default function ClientPreviewPage({ params }: PageProps<"/p/[token]">) {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-[#f8f2e7]" />}>
      <Preview params={params} />
    </Suspense>
  );
}
