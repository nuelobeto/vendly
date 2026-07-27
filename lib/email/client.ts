import "server-only"

import { Resend } from "resend"

import { getEmailConfig } from "@/lib/env.server"

export type SendResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "failed"; detail?: string }

/**
 * Single exit point for every email the app sends — invites and, once the
 * Supabase auth hook is enabled, auth emails too.
 *
 * Never throws. Callers decide whether a failure is fatal: for invites it
 * isn't, for the auth hook it is (see the hook route).
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<SendResult> {
  const config = getEmailConfig()

  if (!config) {
    return { sent: false, reason: "not_configured" }
  }

  try {
    const resend = new Resend(config.apiKey)
    const { error } = await resend.emails.send({
      from: config.from,
      to,
      subject,
      html,
      text,
    })

    if (error) {
      console.error("[email] send failed:", error.message)
      return { sent: false, reason: "failed", detail: error.message }
    }

    return { sent: true }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error("[email] send threw:", detail)
    return { sent: false, reason: "failed", detail }
  }
}
