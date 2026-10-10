import type { Metadata } from "next";
import { OrderDone } from "@/components/order/OrderDone";

export const metadata: Metadata = { title: "Order received · Mabrouk", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function Page({ params }: PageProps<"/en/order/done/[id]">) {
  return <OrderDone locale="en" params={params} />;
}
