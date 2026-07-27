import "server-only"

import { sendEmail, type SendResult } from "@/lib/email/client"
import { renderInviteEmail } from "@/lib/email/templates/invite"

export type SendInviteResult = SendResult

/**
 * Never throws: a failed send must not fail invite creation, because the invite
 * row and its link are already valid by then.
 */
export async function sendInviteEmail({
  to,
  storeName,
  inviterName,
  role,
  url,
}: {
  to: string
  storeName: string
  inviterName: string | null
  role: string
  url: string
}): Promise<SendInviteResult> {
  const { subject, html, text } = renderInviteEmail({
    storeName,
    inviterName,
    role,
    url,
  })

  return sendEmail({ to, subject, html, text })
}
