import { chromium } from "playwright";
import fs from "node:fs";
const pages = {
  royal: "https://www.farha-invitations.com/templates/royal/preview/",
  dream: "https://www.farha-invitations.com/templates/the-dream-night/preview/",
  gallery: "https://www.farha-invitations.com/templates/",
  home: "https://www.farha-invitations.com/",
};
fs.mkdirSync("out", { recursive: true });
const browser = await chromium.launch();
for (const [name, url] of Object.entries(pages)) {
  const dir = `out/${name}`;
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: "ar-EG" });
  const p = await ctx.newPage();
  const assets = [];
  p.on("response", async (r) => {
    const ct = r.headers()["content-type"] || "";
    if (/css|javascript/.test(ct) && assets.length < 40) {
      try { const body = await r.text(); assets.push({ url: r.url(), ct, size: body.length }); fs.writeFileSync(`${dir}/asset-${assets.length}.${ct.includes("css") ? "css" : "js"}`, body.slice(0, 400000)); } catch {}
    }
  });
  try {
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch (e) { fs.writeFileSync(`${dir}/error.txt`, String(e)); await ctx.close(); continue; }
  // Opening sequence before any interaction
  for (let i = 0; i < 10; i++) { await p.waitForTimeout(500); await p.screenshot({ path: `${dir}/a-open-${String(i).padStart(2, "0")}.jpg`, quality: 60, type: "jpeg" }); }
  if (name === "royal" || name === "dream") {
    // Tap the center (envelope / door / start button), then record the reveal
    await p.mouse.click(195, 470);
    for (let i = 0; i < 14; i++) { await p.waitForTimeout(350); await p.screenshot({ path: `${dir}/b-tap-${String(i).padStart(2, "0")}.jpg`, quality: 60, type: "jpeg" }); }
    // try clicking any visible button-like element if still on cover
    const btn = p.locator("button, [role=button], a.btn, .btn, .open, .enter").first();
    if (await btn.count()) { try { await btn.click({ timeout: 3000 }); } catch {} }
    for (let i = 0; i < 8; i++) { await p.waitForTimeout(400); await p.screenshot({ path: `${dir}/c-after-${String(i).padStart(2, "0")}.jpg`, quality: 60, type: "jpeg" }); }
  }
  // Scroll through the whole page
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  let y = 0, k = 0;
  while (y < h && k < 40) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${dir}/d-scroll-${String(k).padStart(2, "0")}.jpg`, quality: 60, type: "jpeg" });
    y += 700; k++;
  }
  fs.writeFileSync(`${dir}/page.html`, (await p.content()).slice(0, 600000));
  fs.writeFileSync(`${dir}/assets.json`, JSON.stringify(assets, null, 1));
  // Desktop view of the gallery / home
  if (name === "gallery" || name === "home") {
    const d = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const dp = await d.newPage();
    try { await dp.goto(url, { waitUntil: "networkidle", timeout: 60000 }); await dp.waitForTimeout(2500); await dp.screenshot({ path: `${dir}/desktop-full.jpg`, quality: 55, type: "jpeg", fullPage: true }); } catch {}
    await d.close();
  }
  await ctx.close();
}
await browser.close();
