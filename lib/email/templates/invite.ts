import "server-only"

import { emailLayout, escapeHtml } from "@/lib/email/layout"

export function renderInviteEmail({
  storeName,
  inviterName,
  role,
  url,
}: {
  storeName: string
  inviterName: string | null
  role: string
  url: string
}) {
  const store = escapeHtml(storeName)
  const inviter = escapeHtml(inviterName ?? "Someone")
  const safeRole = escapeHtml(role)

  return {
    subject: `${inviter} invited you to join ${store} on Vendly`,
    html: emailLayout({
      heading: `Join ${store} on Vendly`,
      body: `<p style="margin:0">${inviter} invited you to join <strong>${store}</strong> as <strong>${safeRole}</strong>.</p>`,
      cta: { label: "Accept invitation", url },
      footnote:
        "This link expires in 7 days and can only be used once. If you weren't expecting this, you can safely ignore this email.",
    }),
    text: [
      `${inviter} invited you to join ${storeName} on Vendly as ${role}.`,
      "",
      `Accept the invitation: ${url}`,
      "",
      "This link expires in 7 days and can only be used once.",
    ].join("\n"),
  }
}
