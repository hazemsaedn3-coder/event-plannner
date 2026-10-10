import type { Metadata } from "next";
import { OrderDone } from "@/components/order/OrderDone";

export const metadata: Metadata = { title: "تم استلام طلبك · مبروك", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function Page({ params }: PageProps<"/order/done/[id]">) {
  return <OrderDone locale="ar" params={params} />;
}
