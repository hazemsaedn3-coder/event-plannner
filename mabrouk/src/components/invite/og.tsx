import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getGuest, getInvitation } from "@/lib/invitations";
import { formatNumericDate, mainEvent } from "@/lib/dates";
import { resolveTemplate } from "@/templates/registry";

export const ogSize = { width: 1200, height: 630 };

const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/CormorantGaramond-Medium.ttf")),
  readFile(join(process.cwd(), "assets/fonts/PinyonScript-Regular.ttf")),
]);

/**
 * WhatsApp / social link preview. Satori can't shape Arabic, so the image uses
 * the Latin names; the Arabic lives in the page title and description.
 */
export async function invitationOgImage(slug: string, guestCode: string | null) {
  const inv = getInvitation(slug);
  const guest = inv && guestCode ? getGuest(inv, guestCode) : null;
  const [cormorant, pinyon] = await fonts;

  const c = inv
    ? resolveTemplate(inv.templateId, inv.templateVersion).themes[inv.themeId].colors
    : { bg: "#F8F2E7", bg2: "#EFE4D0", ink: "#3A2E22", inkSoft: "#7A6A55", accent: "#B08A45" };
  const names = inv ? [inv.partner1.latinName, inv.partner2.latinName] : ["Mabrouk", ""];
  const date = inv ? formatNumericDate(mainEvent(inv).startsAt, "en", inv.market, inv.timeZone) : "";
  const kicker = guest ? `Dear ${guest.latinName}` : "You're invited";

  const star = (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill={c.accent}
        d="M12 0l2.6 5.7L20.5 3.5l-2.2 5.9L24 12l-5.7 2.6 2.2 5.9-5.9-2.2L12 24l-2.6-5.7-5.9 2.2 2.2-5.9L0 12l5.7-2.6L3.5 3.5l5.9 2.2z"
      />
    </svg>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(180deg, ${c.bg} 0%, ${c.bg2} 100%)`,
          color: c.ink,
          fontFamily: "Cormorant",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: `2px solid ${c.accent}`,
            borderRadius: 24,
            opacity: 0.6,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 42,
            left: 42,
            right: 42,
            bottom: 42,
            border: `1px solid ${c.accent}`,
            borderRadius: 16,
            opacity: 0.35,
            display: "flex",
          }}
        />
        {star(34)}
        <div style={{ fontSize: 34, letterSpacing: 6, color: c.accent, marginTop: 18, textTransform: "uppercase" }}>
          {kicker}
        </div>
        <div style={{ display: "flex", alignItems: "center", fontFamily: "Pinyon", fontSize: 150, lineHeight: 1.1, marginTop: 6 }}>
          <span>{names[0]}</span>
          {names[1] && <span style={{ color: c.accent, fontSize: 110, margin: "0 30px" }}>&</span>}
          <span>{names[1]}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 10 }}>
          <div style={{ width: 90, height: 1, background: c.accent, display: "flex" }} />
          <div style={{ fontSize: 44, letterSpacing: 8 }}>{date}</div>
          <div style={{ width: 90, height: 1, background: c.accent, display: "flex" }} />
        </div>
        <div style={{ position: "absolute", bottom: 60, fontSize: 24, color: c.inkSoft, letterSpacing: 3 }}>
          Made with Mabrouk
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Cormorant", data: cormorant, weight: 500, style: "normal" },
        { name: "Pinyon", data: pinyon, weight: 400, style: "normal" },
      ],
    },
  );
}
