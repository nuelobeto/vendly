import "server-only"

export const BRAND = "#4556d9"

/** Values are interpolated into HTML email; user-controlled ones must escape. */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Shared shell. Deliberately table-free inline CSS — email clients are not
 * browsers, and a stylesheet would be stripped by most of them.
 */
export function emailLayout({
  heading,
  body,
  cta,
  footnote,
}: {
  heading: string
  body: string
  cta?: { label: string; url: string }
  footnote?: string
}) {
  const button = cta
    ? `
  <p style="margin:0 0 24px">
    <a href="${cta.url}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:${BRAND};color:#ffffff;font-weight:600;text-decoration:none">
      ${escapeHtml(cta.label)}
    </a>
  </p>
  <p style="font-size:13px;line-height:1.6;margin:0 0 8px;color:#71717a">
    Or paste this link into your browser:
  </p>
  <p style="font-size:13px;word-break:break-all;margin:0 0 24px;color:#71717a">
    ${escapeHtml(cta.url)}
  </p>`
    : ""

  return `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0a0a0a">
  <p style="font-size:18px;font-weight:700;letter-spacing:-0.3px;margin:0 0 24px;color:${BRAND}">Vendly</p>
  <h1 style="font-size:22px;font-weight:600;margin:0 0 16px">${heading}</h1>
  <div style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#3f3f46">${body}</div>
  ${button}
  ${footnote ? `<p style="font-size:13px;line-height:1.6;margin:0;color:#71717a">${footnote}</p>` : ""}
</div>`.trim()
}
