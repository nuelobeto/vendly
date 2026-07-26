import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Vendly — Launch your online store in minutes"

// Satori supports flexbox only, and no oklch() or CSS custom properties,
// so the brand colors are hardcoded hex equivalents of the app tokens.
const BRAND = "#4556d9"

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        padding: 80,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: BRAND,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          V
        </div>
        <div style={{ fontSize: 40, fontWeight: 600, color: "#0a0a0a" }}>
          Vendly
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: -2,
            color: "#0a0a0a",
            lineHeight: 1.1,
          }}
        >
          Your store. Live in minutes.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#71717a",
            maxWidth: 900,
          }}
        >
          Storefront, checkout, payouts and analytics out of the box.
        </div>
      </div>

      <div style={{ display: "flex", height: 10, background: BRAND }} />
    </div>,
    { ...size }
  )
}
