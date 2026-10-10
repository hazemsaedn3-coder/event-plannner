import type { Metadata } from "next";
import { OrderPage } from "@/components/order/OrderPage";

export const metadata: Metadata = {
  title: "Order your invitation · Mabrouk",
  description: "Choose your wedding invitation design and send your details, or message us directly on WhatsApp.",
  alternates: { canonical: "/en/order", languages: { ar: "/order", en: "/en/order" } },
};

export default function Page({ searchParams }: PageProps<"/en/order">) {
  return <OrderPage locale="en" searchParams={searchParams} />;
}
