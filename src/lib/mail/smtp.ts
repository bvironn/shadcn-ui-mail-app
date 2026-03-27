import nodemailer from "nodemailer"

import type { MailCredentials } from "@/types/auth.types"
import type { SendMailPayload } from "@/types/mail.types"

export async function sendMail(
  creds: MailCredentials,
  payload: SendMailPayload
): Promise<{ messageId: string }> {
  const transporter = nodemailer.createTransport({
    host: creds.smtpHost,
    port: creds.smtpPort,
    secure: creds.smtpPort === 465,
    auth: {
      user: creds.email,
      pass: creds.password,
    },
  })

  const result = await transporter.sendMail({
    from: `"${creds.name}" <${creds.email}>`,
    to: payload.to.join(", "),
    cc: payload.cc?.join(", "),
    bcc: payload.bcc?.join(", "),
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    inReplyTo: payload.inReplyTo,
    references: payload.references?.join(" "),
  })

  return { messageId: result.messageId }
}
