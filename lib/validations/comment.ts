import { z } from 'zod'

export const commentSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  content: z.string().min(10, 'Komentar minimal 10 karakter').max(2000, 'Komentar maksimal 2000 karakter'),
})

export type CommentFormData = z.infer<typeof commentSchema>

export const whatsappSubscribeSchema = z.object({
  phone_number: z
    .string()
    .regex(/^(08|628|\+628)[0-9]{8,11}$/, 'Format nomor WhatsApp tidak valid'),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100).optional().or(z.literal('')),
})

export type WhatsAppSubscribeData = z.infer<typeof whatsappSubscribeSchema>
