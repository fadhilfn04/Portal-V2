import { z } from 'zod'

// Indonesian WhatsApp format: 08xx, 628xx, +628xx followed by 8-11 digits
const phoneRegex = /^(08|628|\+628)[0-9]{8,11}$/

export const whatsappSubscriberSchema = z.object({
  phone_number: z
    .string()
    .min(10, 'Nomor WhatsApp minimal 10 digit')
    .max(15, 'Nomor WhatsApp maksimal 15 digit')
    .regex(phoneRegex, 'Format nomor WhatsApp tidak valid. Gunakan format: 08xx atau 628xx'),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').nullable(),
  source: z.string().max(50, 'Source maksimal 50 karakter').nullable(),
  is_active: z.boolean().optional(),
})

export const whatsappSubscriberUpdateSchema = whatsappSubscriberSchema.partial().extend({
  phone_number: z
    .string()
    .min(10, 'Nomor WhatsApp minimal 10 digit')
    .max(15, 'Nomor WhatsApp maksimal 15 digit')
    .regex(phoneRegex, 'Format nomor WhatsApp tidak valid')
    .optional(),
})

export const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'Pilih minimal 1 subscriber'),
  action: z.enum(['activate', 'deactivate']),
})

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Pilih minimal 1 subscriber'),
})

export type WhatsAppSubscriberInput = z.infer<typeof whatsappSubscriberSchema>
export type WhatsAppSubscriberUpdate = z.infer<typeof whatsappSubscriberUpdateSchema>
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>
