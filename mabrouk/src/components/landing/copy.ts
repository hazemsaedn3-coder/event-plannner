import { addOnLabels, formatPrice, pricing, type AddOnId } from "@/config/pricing";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/links";
import type { L10n, Locale, ThemeId } from "@/lib/types";

export const DEMO_SLUGS: Record<ThemeId, string> = {
  "ivory-gold": "omar-laila",
  "emerald-night": "omar-laila-emerald",
  "blush-rose": "omar-laila-blush",
};

/** Prefilled WhatsApp order message naming the chosen design. */
export function orderUrl(locale: Locale, design?: string): string {
  const text =
    locale === "ar"
      ? design
        ? `مرحباً مبروك 👋\nحابب أطلب دعوة زفاف بتصميم «${design}».`
        : "مرحباً مبروك 👋\nحابب أطلب دعوة زفاف رقمية."
      : design
        ? `Hi Mabrouk 👋\nI'd like to order a wedding invitation in the “${design}” design.`
        : "Hi Mabrouk 👋\nI'd like to order a digital wedding invitation.";
  return whatsappUrl(text, siteConfig.whatsappNumber);
}

const ops = siteConfig.operations;
const n = (x: number, l: Locale) => (l === "ar" ? x.toLocaleString("ar-EG") : String(x));

export function copy(l: Locale) {
  const price = (p: { EGP: number; USD: number }) => ({
    egp: formatPrice(p.EGP, "EGP", l),
    usd: formatPrice(p.USD, "USD", l),
  });

  return {
    nav: {
      designs: { ar: "التصاميم", en: "Designs" },
      pricing: { ar: "الأسعار", en: "Pricing" },
      faq: { ar: "الأسئلة", en: "FAQ" },
      switchLang: { ar: "English", en: "عربي" },
      order: { ar: "اطلب الآن", en: "Order" },
    },
    hero: {
      kicker: { ar: "دعوات زفاف رقمية فاخرة", en: "Premium digital wedding invitations" },
      title: {
        ar: "دعوة فرحكم… تُفتح كأنها ظرف حقيقي",
        en: "A wedding invitation that opens like a real envelope",
      },
      body: {
        ar: "موقع دعوة أنيق بحركة وموسيقى، بالعربي والإنجليزي، يوصل لكل ضيوفكم برابط واحد على واتساب. فيه عدّ تنازلي، خرائط، وتأكيد حضور، وجاهز خلال ٧٢ ساعة.",
        en: "An elegant animated invitation website with music, in Arabic and English, shared with every guest as one WhatsApp link. Countdown, maps and RSVP included, ready in 72 hours.",
      },
      cta: { ar: "اطلب دعوتك أونلاين", en: "Order online" },
      chat: { ar: "كلّمنا على واتساب", en: "Chat on WhatsApp" },
      demo: { ar: "شاهد دعوة تجريبية", en: "Open a live demo" },
      from: {
        ar: `بـ ${price(pricing.base).egp} فقط`,
        en: `Only ${price(pricing.base).egp} in Egypt · ${price(pricing.base).usd} elsewhere`,
      },
      tryIt: { ar: "جرّبها: اضغط على الظرف", en: "Try it: tap the envelope" },
    },
    how: {
      title: { ar: "كيف تعمل؟", en: "How it works" },
      steps: [
        {
          title: { ar: "اختاروا التصميم", en: "Pick a design" },
          body: {
            ar: "تصفحوا التصاميم وجرّبوا كل واحد على موبايلكم.",
            en: "Browse the designs and try each one live on your phone.",
          },
        },
        {
          title: { ar: "املوا الطلب أو كلمونا", en: "Order online or message us" },
          body: {
            ar: "الأسماء والمواعيد والأماكن وصوركم في فورم بسيط، أو على واتساب مباشرة. ونحن نكتب الصياغة بالعربي والإنجليزي.",
            en: "Names, dates, venues and photos in a short form, or straight on WhatsApp. We write the wording in Arabic and English.",
          },
        },
        {
          title: { ar: `استلموا الرابط خلال ${n(ops.deliveryHours, "ar")} ساعة`, en: `Get your link in ${ops.deliveryHours} hours` },
          body: {
            ar: "شاركوه على واتساب وتابعوا تأكيدات الحضور من لوحة خاصة بكم.",
            en: "Share it on WhatsApp and follow RSVPs from your private dashboard.",
          },
        },
      ] satisfies { title: L10n; body: L10n }[],
    },
    features: [
      { ar: "ظرف يُفتح بختم الشمع وموسيقى", en: "Wax-sealed envelope opening with music" },
      { ar: "عدّ تنازلي حتى يوم الفرح", en: "Countdown to the big day" },
      { ar: "خرائط جوجل وWaze لكل مناسبة", en: "Google Maps & Waze for every event" },
      { ar: "إضافة للتقويم بضغطة", en: "One-tap add to calendar" },
      { ar: "تأكيد حضور ولوحة متابعة", en: "RSVP with a host dashboard" },
      { ar: "عربي وإنجليزي بضغطة زر", en: "Arabic & English toggle" },
      { ar: "التاريخ الهجري والميلادي", en: "Hijri & Gregorian dates" },
      { ar: "حفلات منفصلة للرجال والنساء", en: "Separate men's & women's events" },
      { ar: "رمز سري يمنع فتح الرابط المُعاد توجيهه", en: "Optional PIN so forwarded links stay private" },
    ] satisfies L10n[],
    designs: {
      title: { ar: "التصاميم", en: "Designs" },
      body: {
        ar: "اضغط على أي تصميم لتجربته مباشرة على موبايلك، مع الموسيقى. جميل بدون صور، ويمكن إضافة صوركم إن رغبتم.",
        en: "Tap any design to try it live on your phone, music included. Beautiful without photos; add yours if you like.",
      },
      live: { ar: "عرض حي", en: "Live demo" },
      share: { ar: "مشاركة", en: "Share" },
      copied: { ar: "تم نسخ الرابط", en: "Link copied" },
      empty: { ar: "تصاميم جديدة قريباً", en: "New designs coming soon" },
      order: { ar: "اطلب هذا التصميم", en: "Order this design" },
      chat: { ar: "اسأل على واتساب", en: "Ask on WhatsApp" },
      templateName: { ar: "نور", en: "Noor" },
    },
    pricing: {
      title: { ar: "الأسعار", en: "Pricing" },
      plan: { ar: "دعوة كاملة", en: "Complete invitation" },
      egypt: { ar: "داخل مصر", en: "In Egypt" },
      abroad: { ar: "خارج مصر", en: "Outside Egypt" },
      base: price(pricing.base),
      includes: [
        { ar: `تسليم خلال ${n(ops.deliveryHours, "ar")} ساعة`, en: `Delivered within ${ops.deliveryHours} hours` },
        { ar: `${n(ops.includedRevisions, "ar")} جولة تعديلات`, en: `${ops.includedRevisions} revision rounds` },
        { ar: "كل المناسبات: خطوبة، كتب كتاب، حنة، فرح", en: "All events: engagement, Katb el-Kitab, henna, wedding" },
        { ar: "تأكيد حضور + لوحة متابعة + تصدير Excel", en: "RSVP + host dashboard + CSV export" },
        {
          ar: `الرابط يعمل حتى ${n(ops.liveMonthsAfterWedding, "ar")} أشهر بعد الفرح`,
          en: `Link stays live ${ops.liveMonthsAfterWedding} months after the wedding`,
        },
      ] satisfies L10n[],
      addOnsTitle: { ar: "إضافات", en: "Add-ons" },
      addOns: (Object.keys(pricing.addOns) as AddOnId[]).map((id) => ({
        label: addOnLabels[id],
        ...price(pricing.addOns[id]),
      })),
      payment: {
        ar: "الدفع عبر إنستاباي أو فودافون كاش. ونرسل لكم طرق الدفع من خارج مصر على واتساب.",
        en: "Pay via InstaPay or Vodafone Cash. Outside Egypt, we'll share payment options on WhatsApp.",
      },
    },
    faq: {
      title: { ar: "أسئلة شائعة", en: "Questions" },
      items: [
        {
          q: { ar: "هل يحتاج الضيوف لتحميل تطبيق؟", en: "Do guests need an app?" },
          a: {
            ar: "لا. الدعوة رابط يفتح مباشرة من واتساب على أي موبايل، وخفيفة حتى على الإنترنت الضعيف.",
            en: "No. It's a link that opens straight from WhatsApp on any phone, and it's light even on a weak connection.",
          },
        },
        {
          q: { ar: "ليس لدينا صور، هل هذا مشكلة؟", en: "We don't have photos. Is that a problem?" },
          a: {
            ar: "إطلاقاً. تصاميمنا مبنية على الخط العربي والزخارف لتبدو فاخرة بدون صور. والصور اختيارية.",
            en: "Not at all. Our designs are built on calligraphy and ornament to look premium without photos. Photos are optional.",
          },
        },
        {
          q: { ar: "ما هي الروابط الشخصية للضيوف؟", en: "What are personal guest links?" },
          a: {
            ar: `كل ضيف يأخذ رابطاً باسمه («إلى أحمد وعائلته») مع عدد مقاعد محدد، وترسلونه بضغطة من لوحة التحكم. (+${pricing.addOns.guestLinks.EGP.toLocaleString("ar-EG")} جنيه)`,
            en: `Each guest gets a link with their name (“Dear Ahmed & Family”) and a seat limit, sent in one tap from your dashboard. (+${pricing.addOns.guestLinks.EGP} EGP / +$${pricing.addOns.guestLinks.USD})`,
          },
        },
        {
          q: { ar: "حفل الرجال منفصل عن حفل النساء، هل يمكن ذلك؟", en: "Our men's and women's receptions are separate. Possible?" },
          a: {
            ar: "نعم. كل مناسبة لها مكانها ووقتها، ونحدد لكل ضيف المناسبات التي يراها فقط.",
            en: "Yes. Each event has its own venue and time, and each guest only sees the events they're invited to.",
          },
        },
        {
          q: { ar: "هل يمكن منع من أُعيد إليه الرابط من فتحه؟", en: "Can we stop forwarded links from being opened?" },
          a: {
            ar: "نعم، بإضافة رمز سري (PIN) يُرسل مع الدعوة، فلا تُفتح بدونه.",
            en: "Yes. Add an optional PIN that's sent with the invitation. Without it, the link won't open.",
          },
        },
        {
          q: { ar: "ماذا لو أردنا تعديل شيء؟", en: "What if we want changes?" },
          a: {
            ar: `السعر يشمل ${n(ops.includedRevisions, "ar")} جولة تعديلات. وكل جولة إضافية بـ ${pricing.addOns.extraRevision.EGP.toLocaleString("ar-EG")} جنيه.`,
            en: `${ops.includedRevisions} revision rounds are included. Each extra round is ${pricing.addOns.extraRevision.EGP} EGP.`,
          },
        },
        {
          q: { ar: "إلى متى يبقى الرابط يعمل؟", en: "How long does the link stay live?" },
          a: {
            ar: `حتى ${n(ops.liveMonthsAfterWedding, "ar")} أشهر بعد يوم الفرح.`,
            en: `Until ${ops.liveMonthsAfterWedding} months after the wedding day.`,
          },
        },
        {
          q: { ar: "كيف أدفع؟", en: "How do I pay?" },
          a: {
            ar: "إنستاباي أو فودافون كاش داخل مصر. ومن خارج مصر نرسل لكم الطرق المتاحة على واتساب.",
            en: "InstaPay or Vodafone Cash in Egypt. From abroad, we'll share the available options on WhatsApp.",
          },
        },
      ] satisfies { q: L10n; a: L10n }[],
    },
    final: {
      title: { ar: "جاهزين نفرح معكم", en: "Let's make your invitation" },
      body: { ar: "اطلبوا أونلاين في دقيقتين، أو ابعتولنا على واتساب ونبدأ فوراً.", en: "Order online in two minutes, or message us on WhatsApp and we'll get started." },
    },
    paths: {
      title: { ar: "طريقتين للطلب", en: "Two ways to order" },
      onlineTitle: { ar: "اطلب أونلاين", en: "Order online" },
      onlineBody: {
        ar: "اختاروا التصميم، اكتبوا الأسماء وتفاصيل الفرح، وارفعوا صوركم. هتستلموا رقم طلب وفريقنا يكلمكم للتأكيد.",
        en: "Pick a design, add your names and wedding details, upload your photos. You get an order number and our team calls you to confirm.",
      },
      chatTitle: { ar: "كلّمنا مباشرة", en: "Talk to us directly" },
      chatBody: {
        ar: "عندكم سؤال أو طلب خاص؟ افتحوا واتساب وهنرد عليكم بسرعة.",
        en: "A question or a special request? Open WhatsApp and we'll reply quickly.",
      },
    },
    footer: {
      rights: { ar: "مبروك. دعوات زفاف رقمية.", en: "Mabrouk. Digital wedding invitations." },
    },
  };
}
