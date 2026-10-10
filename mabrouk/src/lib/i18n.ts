import type { L10n, Locale, SubEventKind, Audience } from "./types";

export function t(text: L10n, locale: Locale): string {
  return text[locale] || text.ar || text.en;
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export const subEventKindLabel: Record<SubEventKind, L10n> = {
  engagement: { ar: "الخطوبة", en: "Engagement" },
  "katb-el-kitab": { ar: "كتب الكتاب", en: "Katb el-Kitab" },
  henna: { ar: "ليلة الحنة", en: "Henna Night" },
  wedding: { ar: "حفل الزفاف", en: "Wedding" },
};

export const audienceLabel: Record<Audience, L10n> = {
  mixed: { ar: "", en: "" },
  men: { ar: "للرجال", en: "Men only" },
  women: { ar: "للنساء", en: "Women only" },
};

/** UI strings shared by invitation templates. */
export const ui = {
  tapToOpen: { ar: "اضغط لفتح الدعوة", en: "Tap to open" },
  youAreInvited: { ar: "دعوة خاصة", en: "You're invited" },
  dear: { ar: "إلى", en: "Dear" },
  countdown: { ar: "العد التنازلي", en: "Counting down" },
  days: { ar: "يوم", en: "Days" },
  hours: { ar: "ساعة", en: "Hours" },
  minutes: { ar: "دقيقة", en: "Minutes" },
  seconds: { ar: "ثانية", en: "Seconds" },
  itsToday: { ar: "اليوم هو اليوم الموعود", en: "The day is here" },
  ourStory: { ar: "حكايتنا", en: "Our story" },
  celebrations: { ar: "المناسبات", en: "Celebrations" },
  map: { ar: "خرائط جوجل", en: "Google Maps" },
  waze: { ar: "Waze", en: "Waze" },
  addToCalendar: { ar: "أضف للتقويم", en: "Add to calendar" },
  dressCode: { ar: "اللباس", en: "Dress code" },
  gifts: { ar: "الهدايا", en: "Gifts" },
  copy: { ar: "نسخ", en: "Copy" },
  copied: { ar: "تم النسخ", en: "Copied" },
  gallery: { ar: "لحظات", en: "Moments" },
  rsvp: { ar: "تأكيد الحضور", en: "RSVP" },
  rsvpBy: { ar: "نرجو التأكيد قبل", en: "Kindly reply by" },
  yourName: { ar: "الاسم", en: "Your name" },
  attending: { ar: "سأحضر بكل سرور", en: "Joyfully attending" },
  notAttending: { ar: "أعتذر عن الحضور", en: "Regretfully declining" },
  headcount: { ar: "عدد الحضور", en: "Number of guests" },
  seatsReserved: { ar: "عدد المقاعد المحجوزة لكم:", en: "Seats reserved for you:" },
  messageToCouple: { ar: "رسالة للعروسين (اختياري)", en: "A message for the couple (optional)" },
  send: { ar: "إرسال", en: "Send" },
  sending: { ar: "جارٍ الإرسال…", en: "Sending…" },
  thanksYes: { ar: "شكراً! بانتظاركم بكل حب", en: "Thank you! We can't wait to celebrate with you" },
  thanksNo: { ar: "شكراً لإبلاغنا، ستكونون في قلوبنا", en: "Thank you for letting us know. You'll be missed" },
  changeAnswer: { ar: "تعديل الرد", en: "Change my reply" },
  rsvpClosed: { ar: "انتهى موعد تأكيد الحضور", en: "RSVPs are closed" },
  demoNote: { ar: "هذه دعوة تجريبية، لن يتم حفظ الرد", en: "This is a demo invitation; replies are not saved" },
  error: { ar: "حدث خطأ، حاول مرة أخرى", en: "Something went wrong, please try again" },
  music: { ar: "الموسيقى", en: "Music" },
  language: { ar: "English", en: "عربي" },
  madeWith: { ar: "صُنعت بحب مع", en: "Made with" },
  ended: { ar: "انتهت هذه الدعوة", en: "This invitation has ended" },
  endedBody: {
    ar: "شكراً لكل من شاركنا الفرحة",
    en: "Thank you to everyone who shared our joy",
  },
  pinTitle: { ar: "دعوة خاصة", en: "Private invitation" },
  pinBody: {
    ar: "أدخل الرمز المرسل إليك مع الدعوة",
    en: "Enter the code you received with your invitation",
  },
  pinWrong: { ar: "الرمز غير صحيح", en: "Incorrect code" },
  pinOpen: { ar: "فتح", en: "Open" },
  ourPhotos: { ar: "نحن", en: "Us" },
  theVenue: { ar: "مكان الفرح", en: "The venue" },
  directions: { ar: "الاتجاهات", en: "Directions" },
  schedule: { ar: "برنامج الليلة", en: "The evening" },
  contactUs: { ar: "للتواصل", en: "Contact" },
  call: { ar: "اتصال", en: "Call" },
  whatsapp: { ar: "واتساب", en: "WhatsApp" },
  notes: { ar: "ملاحظات", en: "Good to know" },
  share: { ar: "شارك الدعوة", en: "Share the invitation" },
  shareBody: { ar: "ابعت الفرحة لحبايبك", en: "Pass the joy along" },
  copyLink: { ar: "نسخ الرابط", en: "Copy link" },
  more: { ar: "المزيد", en: "More" },
  close: { ar: "إغلاق", en: "Close" },
  next: { ar: "التالي", en: "Next" },
  previous: { ar: "السابق", en: "Previous" },
  photo: { ar: "صورة", en: "Photo" },
  enlarge: { ar: "تكبير الصورة", en: "View photo" },
} satisfies Record<string, L10n>;
