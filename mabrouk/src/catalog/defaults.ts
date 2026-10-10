import { BUILTIN_TRACK, type DuoConfig, type NoorDemoConfig, type ShowcaseTemplate } from "./types";

/**
 * Seed catalog, written to storage the first time the catalog is read.
 * After that, everything is edited in the admin panel.
 */

const baseNoor: NoorDemoConfig = {
  baseTheme: "ivory-gold",
  colorsMode: "preset",
  market: "EG",
  tone: "romantic",
  defaultLocale: "ar",
  partner1: { ar: "عمر", en: "Omar" },
  partner2: { ar: "ليلى", en: "Laila" },
  latin1: "Omar",
  latin2: "Laila",
  opening: { ar: "بسم الله الرحمن الرحيم", en: "In the name of God, the Most Gracious, the Most Merciful" },
  hostsLine: {
    ar: "بفرحة تملأ القلوب، تتشرف عائلتا الشريف والمصري بدعوتكم",
    en: "With hearts full of joy, the El-Sherif and El-Masry families invite you",
  },
  inviteLine: {
    ar: "لمشاركتنا فرحة العمر، ووجودكم يكتمل به فرحنا",
    en: "to celebrate the beginning of our forever. Your presence completes our joy",
  },
  date: "2027-06-17T20:00",
  timeZone: "Africa/Cairo",
  showHijri: true,
  venueName: { ar: "قصر الياسمين للاحتفالات", en: "Qasr El-Yasmine Ballroom" },
  venueAddress: { ar: "طريق السويس، القاهرة الجديدة", en: "Suez Road, New Cairo" },
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=30.0302,31.4755",
  dressCode: { ar: "رسمي — نرجو تجنّب اللون الأبيض", en: "Formal — kindly avoid white" },
  heroImage: "",
  gallery: [],
};

/* ------------------------------------------------------------------ */
/* Sample content so every demo looks like a finished invitation.      */
/* Photos: public/demo (CC0, StockSnap), see public/demo/CREDITS.json. */
/* ------------------------------------------------------------------ */

const P = (name: string) => `/demo/${name}.webp`;

const COUPLE = ["couple-walk", "couple-forest", "couple-glance", "couple-field", "couple-bouquet", "couple-sunset"].map(P);
const VENUE = ["venue-hall", "venue-tables", "venue-candles", "venue-decor", "venue-chairs", "venue-cake"].map(P);
const GALLERY = ["gallery-rings", "gallery-bouquet", "gallery-hands", "gallery-roses", "gallery-shoes", "gallery-book", "gallery-blooms", "gallery-ring-roses"].map(P);

const sample: Partial<NoorDemoConfig> = {
  features: {},
  couple: { images: COUPLE.slice(0, 4), layout: "arch" },
  venueShowcase: {
    images: VENUE,
    layout: "hero",
    title: { ar: "مكان الفرح", en: "Where we celebrate" },
    story: {
      ar: "قاعة واسعة بسقف خشبي وأنوار دافئة تتعلّق فوق الطاولات، وجنينة صغيرة للصور عند الغروب. المكان على طريق السويس بعد دائري التجمع بخمس دقائق، وفيه جراج مجاني للضيوف.",
      en: "A grand hall with a timber ceiling and warm lights strung over the tables, plus a small garden for sunset photos. Five minutes past the Tagamoa ring road on Suez Road, with free parking for guests.",
    },
  },
  timeline: [
    { time: "19:30", title: { ar: "استقبال الضيوف", en: "Guests arrive" }, note: { ar: "مشروبات ترحيب في الجنينة", en: "Welcome drinks in the garden" } },
    { time: "20:30", title: { ar: "الزفة", en: "The zaffa" }, note: { ar: "دخول العروسين بالطبول والمزمار", en: "The couple's entrance with drums and mizmar" } },
    { time: "21:00", title: { ar: "الرقصة الأولى", en: "First dance" }, note: { ar: "", en: "" } },
    { time: "22:00", title: { ar: "العشاء", en: "Dinner" }, note: { ar: "بوفيه مفتوح", en: "Open buffet" } },
    { time: "23:00", title: { ar: "تقطيع التورتة", en: "Cutting the cake" }, note: { ar: "", en: "" } },
    { time: "23:30", title: { ar: "الحفلة لآخر الليل", en: "Dancing till late" }, note: { ar: "دي جي ومفاجآت", en: "DJ and surprises" } },
  ],
  gallery: GALLERY,
  galleryLayout: "carousel",
  gifts: {
    message: {
      ar: "وجودكم أجمل هدية. ولمن يحب أن يشاركنا بهدية، يسعدنا ذلك من هنا:",
      en: "Your presence is the greatest gift. If you'd like to give something, you can do so here:",
    },
    accounts: [{ label: { ar: "إنستاباي", en: "InstaPay" }, value: "omar.laila@instapay" }],
  },
  contacts: [
    { name: { ar: "والد العريس — أ. محمود", en: "Groom's father — Mahmoud" }, phone: "201000000001" },
    { name: { ar: "أخت العروسة — سلمى", en: "Bride's sister — Salma" }, phone: "201000000002" },
  ],
  notes: {
    title: { ar: "ملاحظات صغيرة", en: "Good to know" },
    body: {
      ar: "يُفضّل الحضور قبل الزفة بنص ساعة.\nالأطفال فوق ٨ سنوات مرحّب بهم.\nفي فاليه باركنج عند المدخل الرئيسي.",
      en: "Please arrive half an hour before the zaffa.\nChildren over 8 are warmly welcome.\nValet parking at the main entrance.",
    },
  },
  rsvpSettings: { deadline: "2027-06-01", maxHeadcount: 4 },
  countdown: { title: { ar: "باقي على الفرح", en: "Until we say yes" }, showSeconds: true },
};

/** The same sample, laid out differently per design so each demo feels its own. */
function demo(over: { couple?: NonNullable<NoorDemoConfig["couple"]>["layout"]; venue?: NonNullable<NoorDemoConfig["venueShowcase"]>["layout"]; gallery?: NoorDemoConfig["galleryLayout"]; rotate?: number }): Partial<NoorDemoConfig> {
  const r = over.rotate ?? 0;
  const turn = <T,>(a: T[]) => [...a.slice(r % a.length), ...a.slice(0, r % a.length)];
  return {
    ...sample,
    couple: { images: turn(COUPLE).slice(0, 4), layout: over.couple ?? "arch" },
    venueShowcase: { ...sample.venueShowcase!, images: turn(VENUE), layout: over.venue ?? "hero" },
    gallery: turn(GALLERY),
    galleryLayout: over.gallery ?? "carousel",
  };
}

const music = { trackIds: [BUILTIN_TRACK], defaultTrackId: BUILTIN_TRACK };
const cta = { ar: "أريد هذا التصميم", en: "I want this design" };
const stamp = "2026-10-08T00:00:00.000Z";

const SAVE_THE_DATE_HTML = `<main class="card">
  <p class="kicker">{{kicker}}</p>
  <h1><span>{{name1}}</span><em>&amp;</em><span>{{name2}}</span></h1>
  <div class="rule"></div>
  <p class="date">{{date}}</p>
  <p class="place">{{place}}</p>
  <p class="msg">{{message}}</p>
  <a class="btn" href="{{button_link}}" target="_blank" rel="noopener">{{button_text}}</a>
</main>`;

const SAVE_THE_DATE_CSS = `*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{display:grid;place-items:center;padding:24px;background:radial-gradient(120% 80% at 50% 0%,var(--mbk-surface),var(--mbk-background));color:var(--mbk-text);font-family:Georgia,'Times New Roman',serif;text-align:center}
.card{max-width:420px;width:100%;padding:56px 28px;border:1px solid color-mix(in srgb,var(--mbk-accent) 45%,transparent);border-radius:220px 220px 24px 24px;animation:rise 1.4s cubic-bezier(.22,1,.36,1) both}
.kicker{letter-spacing:.35em;text-transform:uppercase;font-size:12px;color:var(--mbk-accent)}
h1{display:flex;flex-direction:column;align-items:center;margin:28px 0 8px;font-weight:400;font-size:54px;line-height:1.05;font-style:italic}
h1 em{font-size:30px;color:var(--mbk-accent);margin:6px 0}
h1 span{animation:fade 1.6s .4s both}
.rule{width:64px;height:1px;margin:24px auto;background:var(--mbk-accent)}
.date{font-size:22px;letter-spacing:.2em}
.place{margin-top:8px;opacity:.75}
.msg{margin-top:24px;line-height:1.7;opacity:.85}
.btn{display:inline-block;margin-top:32px;padding:14px 28px;border-radius:999px;background:var(--mbk-accent);color:var(--mbk-surface);text-decoration:none;font-size:15px}
@keyframes rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

const farahNoor: NoorDemoConfig = {
  ...baseNoor,
  opening: { ar: "", en: "" },
  hostsLine: { ar: "بكل الحب ندعوكم لفرح", en: "With all our love, join us at the wedding of" },
  inviteLine: { ar: "وجودكم هو اللي هيكمّل فرحتنا", en: "Your being there is what makes it complete" },
};

export const DEFAULT_DUO: DuoConfig = {
  gateQuestion: { ar: "إنت من طرف مين؟", en: "Whose side are you on?" },
  bride: {
    gateLabel: { ar: "صحاب العروسة يجوا هنا", en: "Bride's friends, this way" },
    title: { ar: "يا بنات… الليلة ليلتنا", en: "Girls, tonight is our night" },
    message: {
      ar: "العروسة مستنياكم تكونوا جنبها في أحلى ليلة في عمرها. تعالوا بأحلى فستان وأحلى ضحكة… ومتنسوش المناديل!",
      en: "The bride wants you right by her side on the most beautiful night of her life. Bring your best dress, your brightest smile — and tissues!",
    },
    trackId: "builtin:romantic-one",
  },
  groom: {
    gateLabel: { ar: "صحاب العريس يجوا هنا", en: "Groom's friends, this way" },
    title: { ar: "يا رجالة… الفرح فرحنا!", en: "Lads, it's our party!" },
    message: {
      ar: "صاحبنا داخل القفص الدهبي، وإحنا اللي هنزفّه! جهزوا نفسكم للرقص والزفة والمهرجانات لحد الصبح.",
      en: "Our boy is walking into the golden cage — and we're leading the zaffa! Get ready to dance till sunrise.",
    },
    trackId: "builtin:shaabi-one",
  },
};

/** Cinematic (Layali) demos: own couple, hero photo first, coverflow gallery. */
function layali(o: {
  id: string;
  look: NonNullable<ShowcaseTemplate["layali"]>["look"];
  sortOrder: number;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  colors: ShowcaseTemplate["colors"];
  p1: { ar: string; en: string };
  p2: { ar: string; en: string };
  date: string;
  couple: string[];
  venue: { ar: string; en: string };
  track: string;
  hostsLine?: { ar: string; en: string };
  inviteLine?: { ar: string; en: string };
}): ShowcaseTemplate {
  return {
    id: o.id,
    kind: "layali",
    status: "published",
    sortOrder: o.sortOrder,
    name: o.name,
    description: o.description,
    thumbnail: "",
    colors: o.colors,
    noor: {
      ...baseNoor,
      ...demo({ couple: "filmstrip", venue: "hero", gallery: "coverflow" }),
      couple: { images: o.couple.map(P), layout: "filmstrip" },
      // No couple photos → the hero shows the venue instead.
      ...(o.couple.length ? {} : { features: { couplePhotos: false } }),
      partner1: o.p1,
      partner2: o.p2,
      latin1: o.p1.en,
      latin2: o.p2.en,
      date: o.date,
      venueName: o.venue,
      hostsLine: o.hostsLine ?? { ar: "بقلوب يملؤها الفرح، ندعوكم لمشاركتنا ليلة العمر", en: "With hearts full of joy, we invite you to the night of our lives" },
      inviteLine: o.inviteLine ?? { ar: "وجودكم يكمّل فرحتنا", en: "Your presence completes our joy" },
    },
    layali: { look: o.look },
    variables: {},
    music: { trackIds: [o.track, "builtin:romantic-one", BUILTIN_TRACK].filter((v, i, a) => a.indexOf(v) === i), defaultTrackId: o.track },
    ctaText: cta,
    updatedAt: "2026-10-10T00:00:00.000Z",
  };
}

export const DEFAULT_TEMPLATES: ShowcaseTemplate[] = [
  layali({
    id: "layali-velvet",
    look: "velvet",
    sortOrder: 1,
    name: { ar: "ليالي — مخمل عنابي", en: "Layali — Burgundy Velvet" },
    description: {
      ar: "ظرف مخمل عنابي بنقش دمشقي بارز وختم ذهبي بحروفكم. يتكسر الختم، يتفتح الظرف وتطلع الكارت قدامك.",
      en: "A burgundy velvet envelope with embossed damask and a gold seal bearing your initials. The seal cracks, the flap opens, the card rises.",
    },
    colors: { background: "#2A0A11", surface: "#3A0F18", text: "#F6EAD3", accent: "#D9B865", seal: "#C9A24A" },
    p1: { ar: "يوسف", en: "Youssef" },
    p2: { ar: "مريم", en: "Mariam" },
    date: "2027-04-22T20:00",
    couple: ["couple-glance", "couple-forest", "couple-walk", "couple-bouquet"],
    venue: { ar: "فندق ماريوت القاهرة", en: "Cairo Marriott Hotel" },
    track: "builtin:romantic-one",
  }),
  layali({
    id: "layali-royal",
    look: "royal",
    sortOrder: 2,
    name: { ar: "ليالي — دانتيل ملكي", en: "Layali — Royal Gold Lace" },
    description: {
      ar: "ورق دهبي بدانتيل بارز كأنه مطرّز، وختم شمع ملكي. فخامة كلاسيكية بحركة سينمائية.",
      en: "Gold paper with raised lace like embroidery and a royal wax seal. Classic luxury, cinematic motion.",
    },
    colors: { background: "#FBF4E4", surface: "#FFFCF4", text: "#3E2E12", accent: "#A9823A", seal: "#D7B05A" },
    p1: { ar: "أحمد", en: "Ahmed" },
    p2: { ar: "سارة", en: "Sara" },
    date: "2027-07-07T19:30",
    couple: ["couple-walk", "couple-glance", "couple-field", "couple-forest"],
    venue: { ar: "قصر البارون — مصر الجديدة", en: "Baron Palace, Heliopolis" },
    track: "builtin:romantic-one",
  }),
  layali({
    id: "layali-midnight",
    look: "midnight",
    sortOrder: 3,
    name: { ar: "ليالي — ليل ونجوم", en: "Layali — Midnight Stars" },
    description: {
      ar: "كحلي ليلي بنقش نجوم إسلامية بارز وفوانيس بتنور ببطء. مثالي لحفلات الليل وكتب الكتاب.",
      en: "Midnight navy with embossed Islamic stars and slowly glowing lanterns. Perfect for evening weddings and katb el-kitab.",
    },
    colors: { background: "#0D1630", surface: "#16234A", text: "#F3ECDA", accent: "#E2C277", seal: "#C9A24A" },
    p1: { ar: "كريم", en: "Karim" },
    p2: { ar: "نور", en: "Nour" },
    date: "2027-03-12T21:00",
    couple: ["couple-sunset", "couple-walk", "couple-glance", "couple-field"],
    venue: { ar: "الفور سيزونز — نايل بلازا", en: "Four Seasons Nile Plaza" },
    track: "builtin:romantic-one",
  }),
  layali({
    id: "layali-garden",
    look: "garden",
    sortOrder: 4,
    name: { ar: "ليالي — حديقة الورد", en: "Layali — Rose Garden" },
    description: {
      ar: "ورق وردي بورود بارزة، ختم شمع أحمر، وورد بيتساقط على صوركم. رومانسي وناعم.",
      en: "Blush paper with raised roses, a red wax seal and petals falling over your photos. Soft and romantic.",
    },
    colors: { background: "#FBF0EE", surface: "#FFFAF9", text: "#4E2530", accent: "#B4606E", seal: "#A8344A" },
    p1: { ar: "عمر", en: "Omar" },
    p2: { ar: "ليلى", en: "Laila" },
    date: "2027-05-14T18:30",
    couple: ["couple-field", "couple-bouquet", "couple-forest", "couple-glance"],
    venue: { ar: "حديقة الأزهر", en: "Al-Azhar Park" },
    track: "builtin:romantic-one",
  }),
  layali({
    id: "layali-khaliji",
    look: "khaliji",
    sortOrder: 2,
    name: { ar: "خليجي — سدو وذهب", en: "Khaliji — Sadu & Gold" },
    description: {
      ar: "ظرف زمردي بنقش السدو البارز وشريط منسوج أحمر وذهبي، ختم ذهبي، ودخان بخور بيطلع بهدوء. حيّاكم الله.",
      en: "An emerald envelope with embossed Sadu weaving, a red-and-gold woven ribbon, a gold seal and soft rising incense smoke.",
    },
    colors: { background: "#0D2E2A", surface: "#123B35", text: "#F4EEDD", accent: "#DDBF73", seal: "#C9A24A" },
    p1: { ar: "سلطان", en: "Sultan" },
    p2: { ar: "نورة", en: "Noura" },
    date: "2027-02-18T20:30",
    couple: [],
    venue: { ar: "قصر الأفراح — الرياض", en: "Al Afrah Palace, Riyadh" },
    track: "builtin:romantic-one",
    hostsLine: {
      ar: "بكل الحب والتقدير، يتشرّف أهل العروسين بدعوتكم لحضور حفل زواج",
      en: "With love and honour, the two families invite you to the wedding of",
    },
    inviteLine: { ar: "حضوركم يزيدنا فرحاً وشرفاً… حيّاكم الله", en: "Your presence honours us. You are most welcome" },
  }),
  layali({
    id: "layali-saeedi",
    look: "saeedi",
    sortOrder: 3,
    name: { ar: "صعيدي — تلّي فضي", en: "Saeedi — Silver Tally" },
    description: {
      ar: "أسود وفضي بتطريز التلّي الصعيدي البارز وشريط تلّي على الظرف والكارت، وختم فضي بحروفكم. أصالة الصعيد بحركة سينمائية.",
      en: "Black and silver with embossed Upper-Egyptian tally embroidery, a tally ribbon on the envelope and card, and a silver seal with your initials.",
    },
    colors: { background: "#141418", surface: "#1E1E24", text: "#F2F0EA", accent: "#D9DCE3", seal: "#C3C7CF" },
    p1: { ar: "حسن", en: "Hassan" },
    p2: { ar: "زينب", en: "Zeinab" },
    date: "2027-08-20T19:00",
    couple: [],
    venue: { ar: "دوّار العيلة — سوهاج", en: "The family dawar, Sohag" },
    track: "builtin:shaabi-one",
    hostsLine: {
      ar: "يا مرحب بالحبايب… بكل الفرح والمحبة ندعوكم لفرح",
      en: "Welcome, dear ones! With all our joy and love we invite you to the wedding of",
    },
    inviteLine: { ar: "نوّرتونا وشرّفتونا… وفرحتنا ما تكملش غير بيكم", en: "You honour us, and our joy is only complete with you" },
  }),
  {
    id: "noor-ivory-gold",
    kind: "noor",
    status: "published",
    sortOrder: 10,
    name: { ar: "نور — عاجي وذهبي", en: "Noor — Ivory Gold" },
    description: {
      ar: "ظرف بختم الشمع، زخارف ذهبية وخط عربي. كلاسيكي وفاخر.",
      en: "Wax-sealed envelope, gold ornaments and Arabic calligraphy. Classic and luxurious.",
    },
    thumbnail: "",
    colors: { background: "#F8F2E7", surface: "#FFFBF4", text: "#3A2E22", accent: "#B08A45", seal: "#8C2232" },
    noor: { ...baseNoor, ...demo({ couple: "arch", venue: "hero", gallery: "carousel" }), baseTheme: "ivory-gold" },
    variables: {},
    music,
    ctaText: cta,
    updatedAt: stamp,
  },
  {
    id: "noor-emerald-night",
    kind: "noor",
    status: "published",
    sortOrder: 20,
    name: { ar: "نور — ليل زمردي", en: "Noor — Emerald Night" },
    description: {
      ar: "أخضر زمردي عميق مع ذهب دافئ. مثالي لحفلات المساء والخليج.",
      en: "Deep emerald with warm gold. Perfect for evening and Gulf weddings.",
    },
    thumbnail: "",
    colors: { background: "#0E2E26", surface: "#133A30", text: "#F4EBD6", accent: "#D6B46C", seal: "#C9A253" },
    noor: { ...baseNoor, ...demo({ couple: "polaroid", venue: "carousel", gallery: "grid", rotate: 1 }), baseTheme: "emerald-night" },
    variables: {},
    music,
    ctaText: cta,
    updatedAt: stamp,
  },
  {
    id: "noor-blush-rose",
    kind: "noor",
    status: "published",
    sortOrder: 30,
    name: { ar: "نور — وردي ناعم", en: "Noor — Blush Rose" },
    description: {
      ar: "وردي هادئ وذهب وردي. رومانسي وعصري.",
      en: "Soft blush and rose gold. Romantic and modern.",
    },
    thumbnail: "",
    colors: { background: "#F7E6E2", surface: "#FDF4F1", text: "#55343A", accent: "#B5737C", seal: "#9E4A58" },
    noor: { ...baseNoor, ...demo({ couple: "mosaic", venue: "grid", gallery: "masonry", rotate: 2 }), baseTheme: "blush-rose" },
    variables: {},
    music,
    ctaText: cta,
    updatedAt: stamp,
  },
  {
    id: "lumiere-save-the-date",
    kind: "html",
    status: "published",
    sortOrder: 40,
    name: { ar: "لوميير — احفظ الموعد", en: "Lumière — Save the Date" },
    description: {
      ar: "بطاقة «احفظ الموعد» بسيطة وأنيقة بحركة ناعمة.",
      en: "A minimal, elegant save-the-date card with soft motion.",
    },
    thumbnail: "",
    colors: { background: "#EFE7DA", surface: "#FBF8F2", text: "#2E2A26", accent: "#9C7A4B", seal: "#7A3B3B" },
    html: { html: SAVE_THE_DATE_HTML, css: SAVE_THE_DATE_CSS, js: "", baseUrl: "" },
    variables: {
      kicker: "Save the date",
      name1: "Youssef",
      name2: "Mariam",
      date: "12 · 09 · 2027",
      place: "Alexandria, Egypt",
      message: "Formal invitation to follow. We can't wait to celebrate with you.",
      button_text: "Add to calendar",
      button_link: "https://calendar.google.com",
    },
    music,
    ctaText: cta,
    updatedAt: stamp,
  },
  {
    id: "farah-bride-groom",
    kind: "duo",
    status: "published",
    sortOrder: 5,
    name: { ar: "فرح — صحاب العروسة وصحاب العريس", en: "Farah — Bride's & Groom's Friends" },
    description: {
      ar: "دعوة بمدخلين: صحاب العروسة يدخلوا عالم رومانسي، وصحاب العريس يدخلوا فرح شعبي بأغنيته. نفس التفاصيل، روحين مختلفين.",
      en: "One invitation, two doors: the bride's friends enter a romantic world, the groom's friends a shaabi street-wedding — each with its own song.",
    },
    thumbnail: "",
    colors: { background: "#F7E1E6", surface: "#FFF5F7", text: "#4A2430", accent: "#D4507A", seal: "#FFD400" },
    noor: { ...farahNoor, ...demo({ couple: "filmstrip", venue: "hero", gallery: "carousel" }) },
    duo: { ...DEFAULT_DUO, style: "diagonal", palette: "classic" },
    variables: {},
    music: { trackIds: ["builtin:romantic-one", "builtin:shaabi-one", BUILTIN_TRACK], defaultTrackId: "builtin:romantic-one" },
    ctaText: cta,
    updatedAt: "2026-10-10T00:00:00.000Z",
  },
  {
    id: "farah-palace-doors",
    kind: "duo",
    status: "published",
    sortOrder: 6,
    name: { ar: "فرح — بوابات القصر", en: "Farah — Palace Doors" },
    description: {
      ar: "بابين قصر: باب عاجي رومانسي لصحاب العروسة، وباب سرادق أحمر بخيامية لصحاب العريس. الباب بيتفتح أول ما تدوس.",
      en: "Two palace doors: an ivory romantic door for the bride's friends, a red khayamiya tent door for the groom's. They swing open on tap.",
    },
    thumbnail: "",
    colors: { background: "#FBF3EA", surface: "#FFFCF7", text: "#4A3426", accent: "#B5714F", seal: "#F5C542" },
    noor: { ...farahNoor, ...demo({ couple: "polaroid", venue: "carousel", gallery: "grid", rotate: 1 }) },
    duo: {
      ...DEFAULT_DUO,
      style: "doors",
      palette: "royal",
      gateQuestion: { ar: "اختار بابك", en: "Pick your door" },
      bride: { ...DEFAULT_DUO.bride, gateLabel: { ar: "باب صحاب العروسة", en: "The bride's friends' door" } },
      groom: { ...DEFAULT_DUO.groom, gateLabel: { ar: "باب صحاب العريس", en: "The groom's friends' door" }, title: { ar: "السرادق منوّر بيكم!", en: "The tent is lit for you!" } },
    },
    variables: {},
    music: { trackIds: ["builtin:romantic-one", "builtin:shaabi-one", BUILTIN_TRACK], defaultTrackId: "builtin:romantic-one" },
    ctaText: cta,
    updatedAt: "2026-10-10T00:00:00.000Z",
  },
  {
    id: "farah-party-tickets",
    kind: "duo",
    status: "published",
    sortOrder: 7,
    name: { ar: "فرح — تذاكر الفرح", en: "Farah — Party Tickets" },
    description: {
      ar: "تذكرتين دخول: تذكرة لافندر لصحاب العروسة وتذكرة نيون لصحاب العريس. اقطع تذكرتك وادخل.",
      en: "Two entry tickets: lavender for the bride's friends, neon for the groom's. Tear yours and walk in.",
    },
    thumbnail: "",
    colors: { background: "#EFE9FC", surface: "#FBF9FF", text: "#2F2350", accent: "#8B5CF6", seal: "#2EF2E2" },
    noor: { ...farahNoor, ...demo({ couple: "mosaic", venue: "grid", gallery: "masonry", rotate: 2 }) },
    duo: {
      ...DEFAULT_DUO,
      style: "tickets",
      palette: "night",
      gateQuestion: { ar: "تذكرتك فين؟", en: "Which ticket is yours?" },
      bride: { ...DEFAULT_DUO.bride, gateLabel: { ar: "تذكرة صحاب العروسة", en: "Bride's friends ticket" } },
      groom: { ...DEFAULT_DUO.groom, gateLabel: { ar: "تذكرة صحاب العريس", en: "Groom's friends ticket" }, title: { ar: "الليلة دي بتاعتنا!", en: "Tonight belongs to us!" } },
    },
    variables: {},
    music: { trackIds: ["builtin:romantic-one", "builtin:shaabi-one", BUILTIN_TRACK], defaultTrackId: "builtin:romantic-one" },
    ctaText: cta,
    updatedAt: "2026-10-10T00:00:00.000Z",
  },
  {
    id: "farah-half-half",
    kind: "duo",
    status: "published",
    sortOrder: 8,
    name: { ar: "فرح — نص ونص", en: "Farah — Half & Half" },
    description: {
      ar: "الشاشة نصين بخط زجزاج منوّر: نص خوخي رومانسي ونص أخضر ودهبي شعبي.",
      en: "The screen split in two by a glowing zigzag: a peach romantic half and a green-and-gold shaabi half.",
    },
    thumbnail: "",
    colors: { background: "#FFEDE2", surface: "#FFF9F5", text: "#4D2A20", accent: "#E2674A", seal: "#FFC93C" },
    noor: { ...farahNoor, ...demo({ couple: "filmstrip", venue: "carousel", gallery: "grid", rotate: 3 }) },
    duo: {
      ...DEFAULT_DUO,
      style: "split",
      palette: "sunset",
      gateQuestion: { ar: "إنت مع مين؟", en: "Who are you with?" },
      bride: { ...DEFAULT_DUO.bride, gateLabel: { ar: "صحاب العروسة من هنا", en: "Bride's friends here" } },
      groom: { ...DEFAULT_DUO.groom, gateLabel: { ar: "صحاب العريس من هنا", en: "Groom's friends here" }, title: { ar: "يلا بينا على الزفة!", en: "Off to the zaffa!" } },
    },
    variables: {},
    music: { trackIds: ["builtin:romantic-one", "builtin:shaabi-one", BUILTIN_TRACK], defaultTrackId: "builtin:romantic-one" },
    ctaText: cta,
    updatedAt: "2026-10-10T00:00:00.000Z",
  },
];
