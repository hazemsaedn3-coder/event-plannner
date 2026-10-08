import { BUILTIN_TRACK, type NoorDemoConfig, type ShowcaseTemplate } from "./types";

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
];
