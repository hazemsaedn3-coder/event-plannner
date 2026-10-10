import type { Metadata } from "next";
import { OrderPage } from "@/components/order/OrderPage";

export const metadata: Metadata = {
  title: "اطلب دعوتك · مبروك",
  description: "اختاروا تصميم دعوة الفرح واملوا التفاصيل، أو كلمونا مباشرة على واتساب.",
  alternates: { canonical: "/order", languages: { ar: "/order", en: "/en/order" } },
};

export default function Page({ searchParams }: PageProps<"/order">) {
  return <OrderPage locale="ar" searchParams={searchParams} />;
}
