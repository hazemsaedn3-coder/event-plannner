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

export const DEFAULT_TEMPLATES: ShowcaseTemplate[] = [
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
    noor: { ...baseNoor, baseTheme: "ivory-gold" },
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
    noor: { ...baseNoor, baseTheme: "emerald-night" },
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
    noor: { ...baseNoor, baseTheme: "blush-rose" },
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
    noor: {
      ...baseNoor,
      opening: { ar: "", en: "" },
      hostsLine: { ar: "بكل الحب ندعوكم لفرح", en: "With all our love, join us at the wedding of" },
      inviteLine: { ar: "وجودكم هو اللي هيكمّل فرحتنا", en: "Your being there is what makes it complete" },
    },
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
    noor: { ...baseNoor, opening: { ar: "", en: "" }, hostsLine: { ar: "بكل الحب ندعوكم لفرح", en: "With all our love, join us at the wedding of" }, inviteLine: { ar: "وجودكم هو اللي هيكمّل فرحتنا", en: "Your being there is what makes it complete" } },
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
    noor: { ...baseNoor, opening: { ar: "", en: "" }, hostsLine: { ar: "بكل الحب ندعوكم لفرح", en: "With all our love, join us at the wedding of" }, inviteLine: { ar: "وجودكم هو اللي هيكمّل فرحتنا", en: "Your being there is what makes it complete" } },
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
    noor: { ...baseNoor, opening: { ar: "", en: "" }, hostsLine: { ar: "بكل الحب ندعوكم لفرح", en: "With all our love, join us at the wedding of" }, inviteLine: { ar: "وجودكم هو اللي هيكمّل فرحتنا", en: "Your being there is what makes it complete" } },
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
