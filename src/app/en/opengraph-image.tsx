import { readFileSync } from "node:fs";
import path from "node:path";

import { ImageResponse } from "next/og";

import { getDictionary } from "@/i18n";
import { OG_TOKENS } from "@/lib/og-tokens";

/**
 * Open Graph image — English locale (`/en`).
 *
 * Mirror of src/app/opengraph-image.tsx — same visual treatment, English
 * strings pulled from the `en` dictionary. Kept as two files (rather than a
 * shared helper) because Next's opengraph-image file convention keys off the
 * literal file position in the route tree; this is the idiomatic Next 16 way.
 * If the two ever diverge visually, extract a shared render function — for
 * now the duplication is small enough that locality beats indirection.
 */

// Pin to Node: this handler uses `fs.readFileSync` on a `public/` asset, which
// would crash on Edge. Next 16's default for file-convention routes is Node,
// but the explicit guard keeps that invariant load-bearing.
export const runtime = "nodejs";

export const alt = getDictionary("en").meta.imageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same deterministic layout as the PT image. See docstring there for why.
const STARS: Array<[number, number, number, number]> = [
  [3, 8, 2, 0.8],
  [7, 22, 1, 0.5],
  [12, 5, 1.5, 0.7],
  [18, 14, 1, 0.4],
  [22, 3, 2, 0.9],
  [26, 18, 1, 0.5],
  [31, 9, 1.5, 0.6],
  [37, 2, 1, 0.4],
  [42, 12, 2.5, 0.8],
  [48, 6, 1, 0.5],
  [54, 16, 1.5, 0.7],
  [60, 4, 1, 0.4],
  [66, 11, 2, 0.8],
  [71, 19, 1, 0.5],
  [76, 7, 1.5, 0.6],
  [81, 15, 1, 0.4],
  [86, 3, 2, 0.9],
  [91, 10, 1, 0.5],
  [95, 17, 1.5, 0.7],
  [98, 5, 1, 0.4],
  [5, 35, 1.5, 0.6],
  [14, 42, 1, 0.4],
  [19, 55, 2, 0.7],
  [25, 48, 1, 0.5],
  [2, 68, 1.5, 0.6],
  [8, 75, 1, 0.4],
  [13, 85, 2, 0.8],
  [17, 92, 1, 0.5],
  [4, 58, 1, 0.4],
  [9, 48, 1.5, 0.6],
  [16, 62, 1, 0.5],
  [21, 88, 2, 0.7],
  [58, 28, 1, 0.5],
  [62, 36, 1.5, 0.7],
  [67, 45, 1, 0.4],
  [72, 33, 2, 0.8],
  [78, 41, 1, 0.5],
  [83, 27, 1.5, 0.6],
  [88, 38, 1, 0.4],
  [93, 30, 2, 0.8],
  [97, 44, 1, 0.5],
  [56, 52, 1.5, 0.6],
  [61, 60, 1, 0.4],
  [69, 55, 2, 0.7],
  [74, 63, 1, 0.5],
  [79, 50, 1.5, 0.6],
  [84, 58, 1, 0.4],
  [89, 65, 2, 0.8],
  [94, 53, 1, 0.5],
  [99, 61, 1.5, 0.7],
  [58, 72, 1, 0.4],
  [64, 80, 1.5, 0.6],
  [70, 88, 1, 0.5],
  [76, 75, 2, 0.7],
  [82, 83, 1, 0.4],
  [87, 91, 1.5, 0.6],
  [92, 78, 1, 0.5],
  [96, 86, 2, 0.8],
  [50, 24, 1, 0.4],
  [45, 70, 1.5, 0.6],
];

export default async function Image() {
  const dict = getDictionary("en");

  // Read the pre-scaled `-og.png` variant (720×720) to keep the base64 payload
  // small. The full-res source stays untouched for on-site use (scene 5).
  const earthPath = path.join(
    process.cwd(),
    "public",
    "assets",
    "space",
    "earth-astronauts-og.png"
  );
  const earthBuffer = readFileSync(earthPath);
  const earthDataUrl = `data:image/png;base64,${earthBuffer.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: OG_TOKENS.bg,
        backgroundImage: "radial-gradient(ellipse 80% 40% at 50% 15%, #14102a 0%, #000000 60%)",
        padding: "56px 64px",
        fontFamily: "serif",
      }}
    >
      {STARS.map(([x, y, s, o], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: `${s}px`,
            height: `${s}px`,
            borderRadius: "9999px",
            backgroundColor: "#ffffff",
            opacity: o,
          }}
        />
      ))}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "440px",
          height: "100%",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={earthDataUrl} alt="" width={360} height={360} style={{ objectFit: "contain" }} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: "48px",
          paddingRight: "16px",
        }}
      >
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 20,
            letterSpacing: "0.18em",
            color: OG_TOKENS.textMuted,
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          {dict.hero.messageMarker}
        </div>
        <div
          style={{
            fontFamily: "serif",
            fontSize: 72,
            lineHeight: 1.05,
            color: OG_TOKENS.accent,
            marginBottom: 24,
            textShadow: "0 0 24px rgba(179, 119, 255, 0.35)",
          }}
        >
          {dict.hero.headline}
        </div>
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 34,
            color: OG_TOKENS.text,
            opacity: 0.85,
          }}
        >
          {dict.hero.nameBanner}
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
