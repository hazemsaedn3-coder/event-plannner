import type { InvitationContent } from "@/lib/types";

/**
 * DEMO — "Omar & Laila". Fictional couple, fictional venues.
 * Used on the landing page (live phone preview + design gallery).
 * Demo invitations never store RSVPs.
 */
export const omarLaila: InvitationContent = {
  slug: "omar-laila",
  templateId: "noor",
  templateVersion: 1,
  themeId: "ivory-gold",
  market: "EG",
  tone: "romantic",
  defaultLocale: "ar",
  status: "live",
  isDemo: true,
  timeZone: "Africa/Cairo",
  showHijri: true,

  partner1: { name: { ar: "عمر", en: "Omar" }, latinName: "Omar" },
  partner2: { name: { ar: "ليلى", en: "Laila" }, latinName: "Laila" },
  opening: { ar: "بسم الله الرحمن الرحيم", en: "In the name of God, the Most Gracious, the Most Merciful" },
  hostsLine: {
    ar: "بفرحة تملأ القلوب، تتشرف عائلتا الشريف والمصري بدعوتكم",
    en: "With hearts full of joy, the El-Sherif and El-Masry families invite you",
  },
  inviteLine: {
    ar: "لمشاركتنا فرحة العمر، ووجودكم يكتمل به فرحنا",
    en: "to celebrate the beginning of our forever. Your presence completes our joy",
  },

  mainEventId: "wedding",
  subEvents: [
    {
      id: "katb",
      kind: "katb-el-kitab",
      startsAt: "2027-06-10T18:30:00+03:00",
      endsAt: "2027-06-10T20:30:00+03:00",
      venue: {
        name: { ar: "مسجد الرحمة الكبير", en: "Al-Rahma Grand Mosque" },
        address: { ar: "التجمع الخامس، القاهرة الجديدة", en: "Fifth Settlement, New Cairo" },
        lat: 30.0074,
        lng: 31.4913,
      },
      audience: "mixed",
      visibility: "public",
      note: { ar: "يليه استقبال خفيف في حديقة المسجد", en: "Followed by a light reception in the mosque garden" },
    },
    {
      id: "henna",
      kind: "henna",
      startsAt: "2027-06-15T20:00:00+03:00",
      endsAt: "2027-06-15T23:59:00+03:00",
      venue: {
        name: { ar: "بيت العائلة", en: "The family home" },
        address: { ar: "مصر الجديدة، القاهرة", en: "Heliopolis, Cairo" },
        lat: 30.0911,
        lng: 31.3226,
      },
      audience: "women",
      visibility: "guests-only",
      dressCode: { ar: "ألوان مبهجة وطابع شرقي", en: "Bright colours, oriental touch" },
    },
    {
      id: "wedding",
      kind: "wedding",
      startsAt: "2027-06-17T20:00:00+03:00",
      endsAt: "2027-06-18T01:00:00+03:00",
      venue: {
        name: { ar: "قصر الياسمين للاحتفالات", en: "Qasr El-Yasmine Ballroom" },
        address: { ar: "طريق السويس، القاهرة الجديدة", en: "Suez Road, New Cairo" },
        lat: 30.0302,
        lng: 31.4755,
      },
      audience: "mixed",
      visibility: "public",
    },
  ],

  story: [
    {
      when: { ar: "خريف ٢٠٢٢", en: "Autumn 2022" },
      title: { ar: "أول لقاء", en: "First hello" },
      body: {
        ar: "في معرض الكتاب، مدّ كلانا يده لنفس الرواية… وبدأت الحكاية.",
        en: "At the book fair, we both reached for the same novel… and the story began.",
      },
    },
    {
      when: { ar: "ربيع ٢٠٢٥", en: "Spring 2025" },
      title: { ar: "السؤال", en: "The question" },
      body: {
        ar: "على كورنيش النيل عند الغروب، قال عمر: «تكملي الرواية معايا؟»",
        en: "On the Nile corniche at sunset, Omar asked: “Will you finish this story with me?”",
      },
    },
    {
      when: { ar: "صيف ٢٠٢٧", en: "Summer 2027" },
      title: { ar: "الفصل الأجمل", en: "The best chapter" },
      body: {
        ar: "والآن نكتب أجمل فصولنا… ونريدكم معنا فيه.",
        en: "Now we begin our most beautiful chapter, and we want you in it.",
      },
    },
  ],

  dressCode: {
    ar: "رسمي — نرجو تجنّب اللون الأبيض",
    en: "Formal — kindly avoid white",
  },
  gifts: {
    message: {
      ar: "حضوركم هو أجمل هدية. ولمن يرغب بالمشاركة في بداية حياتنا:",
      en: "Your presence is the greatest gift. For those who wish to contribute to our new home:",
    },
    accounts: [{ label: { ar: "إنستاباي", en: "InstaPay" }, value: "omar.laila@instapay" }],
  },
  music: { credit: "Built-in Mabrouk music box (synthesized, royalty-free)" },

  rsvp: {
    enabled: true,
    deadline: "2027-06-01T23:59:00+03:00",
    maxHeadcountGeneral: 2,
  },

  hostKey: "demo-host-9nr3ue8s7wd8pgfb",

  guests: [
    {
      code: "kcy4kpgq",
      displayName: { ar: "أحمد وعائلته", en: "Ahmed & Family" },
      latinName: "Ahmed & Family",
      seats: 4,
      subEventIds: ["katb", "wedding"],
      phone: "201000000001",
      locale: "ar",
    },
    {
      code: "7j5qvapd",
      displayName: { ar: "خالتي منى", en: "Auntie Mona" },
      latinName: "Auntie Mona",
      seats: 2,
      subEventIds: ["katb", "henna", "wedding"],
      phone: "201000000002",
      locale: "ar",
    },
    {
      code: "ep2havyb",
      displayName: { ar: "سارة وكريم", en: "Sara & Karim" },
      latinName: "Sara & Karim",
      seats: 2,
      subEventIds: ["wedding"],
      locale: "en",
    },
    {
      code: "8ap362xy",
      displayName: { ar: "د. يوسف", en: "Dr. Youssef" },
      latinName: "Dr. Youssef",
      seats: 1,
      phone: "971500000003",
      locale: "en",
    },
  ],
};
