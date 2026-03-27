import { z } from "zod/v4"

export const sendMailSchema = z.object({
  to: z.array(z.email()).min(1, "At least one recipient is required"),
  cc: z.array(z.email()).optional(),
  bcc: z.array(z.email()).optional(),
  subject: z.string().min(1, "Subject is required"),
  text: z.string().optional(),
  html: z.string().optional(),
  inReplyTo: z.string().optional(),
  references: z.array(z.string()).optional(),
})

export const listMailSchema = z.object({
  folder: z.string().default("INBOX"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const folderSchema = z.object({
  folder: z.string().min(1, "Folder path is required"),
})

export type SendMailInput = z.infer<typeof sendMailSchema>
export type ListMailInput = z.infer<typeof listMailSchema>
