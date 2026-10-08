import type { InvitationContent } from "@/lib/types";

/**
 * SAMPLE — GCC-style invitation (fictional). Exercises the Gulf features:
 * formal "the families invite you" wording, no couple photos, separate
 * men-only and women-only receptions with different guest lists, Hijri date,
 * and a PIN gate (PIN: 2468) so forwarded links can't be opened.
 *
 * Not linked from the landing page.
 */
export const faisalNoura: InvitationContent = {
  slug: "faisal-noura-wqhmh7ju",
  templateId: "noor",
  templateVersion: 1,
  themeId: "emerald-night",
  market: "GCC",
  tone: "formal",
  defaultLocale: "ar",
  status: "live",
  timeZone: "Asia/Riyadh",
  showHijri: true,

  partner1: { name: { ar: "فيصل", en: "Faisal" }, latinName: "Faisal" },
  partner2: { name: { ar: "نورة", en: "Noura" }, latinName: "Noura" },
  opening: { ar: "بسم الله الرحمن الرحيم", en: "In the name of God, the Most Gracious, the Most Merciful" },
  hostsLine: {
    ar: "يتشرف الشيخ عبدالله بن سعد العتيبي والشيخ محمد بن ناصر القحطاني بدعوتكم",
    en: "Sheikh Abdullah bin Saad Al-Otaibi and Sheikh Mohammed bin Nasser Al-Qahtani request the honour of your presence",
  },
  inviteLine: {
    ar: "لحضور حفل زواج ابنيهما، وذلك بمشيئة الله تعالى",
    en: "at the wedding celebration of their children, God willing",
  },

  mainEventId: "men",
  subEvents: [
    {
      id: "men",
      kind: "wedding",
      title: { ar: "حفل الرجال", en: "Men's reception" },
      startsAt: "2027-01-21T20:30:00+03:00",
      endsAt: "2027-01-22T00:30:00+03:00",
      venue: {
        name: { ar: "قاعة الريم الكبرى", en: "Al-Reem Grand Hall" },
        address: { ar: "حي الملقا، الرياض", en: "Al-Malqa, Riyadh" },
        lat: 24.8133,
        lng: 46.6086,
      },
      audience: "men",
      visibility: "guests-only",
      note: { ar: "العشاء الساعة العاشرة مساءً", en: "Dinner is served at 10 pm" },
    },
    {
      id: "women",
      kind: "wedding",
      title: { ar: "حفل النساء", en: "Women's reception" },
      startsAt: "2027-01-21T21:00:00+03:00",
      endsAt: "2027-01-22T02:00:00+03:00",
      venue: {
        name: { ar: "قصر اللؤلؤة للاحتفالات", en: "Al-Lulua Celebration Palace" },
        address: { ar: "حي حطين، الرياض", en: "Hittin, Riyadh" },
        lat: 24.7626,
        lng: 46.6012,
      },
      audience: "women",
      visibility: "guests-only",
      note: {
        ar: "نأمل عدم اصطحاب الأطفال، ويُمنع التصوير",
        en: "Kindly no children. Photography is not permitted",
      },
    },
  ],

  dressCode: { ar: "اللباس الرسمي", en: "Formal attire" },

  rsvp: { enabled: true, maxHeadcountGeneral: 1 },

  pin: "2468",
  hostKey: "2eazm3wzfggwdutvrv6nhqtj",

  guests: [
    {
      code: "pfnf8smd",
      displayName: { ar: "الأستاذ خالد الدوسري", en: "Mr. Khalid Al-Dosari" },
      latinName: "Mr. Khalid Al-Dosari",
      seats: 3,
      subEventIds: ["men"],
      phone: "966500000001",
    },
    {
      code: "5surrg5v",
      displayName: { ar: "السيدة هيا الشمري", en: "Mrs. Haya Al-Shammari" },
      latinName: "Mrs. Haya Al-Shammari",
      seats: 2,
      subEventIds: ["women"],
      phone: "966500000002",
    },
  ],
};
