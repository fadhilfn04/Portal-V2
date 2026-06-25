import { z } from 'zod'

/**
 * Indonesian WhatsApp number regex pattern.
 *
 * Indonesian WhatsApp numbers typically have 11-13 characters total.
 * The pattern accommodates common formats while preventing unrealistic lengths.
 *
 * Supported formats:
 * - 08 followed by 9-10 digits (total: 11-12 characters)
 * - 628 followed by 9-10 digits (total: 12-13 characters)
 * - +628 followed by 9-10 digits (total: 13-14 characters, but refined to 13 max)
 *
 * Real-world examples: 08123456789 (11 chars), 6281234567890 (12 chars)
 *
 * Pattern breakdown:
 * - ^: Start of string
 * - (08|628|\+628): Indonesian country code variants
 * - [0-9]{9,10}: 9-10 digits for realistic phone number length
 * - $: End of string
 */
const phoneRegex = /^(08|628|\+628)[0-9]{9,10}$/

export const whatsappSubscriberSchema = z.object({
  phone_number: z
    .string()
    .min(11, 'Nomor WhatsApp minimal 11 digit')
    .max(13, 'Nomor WhatsApp maksimal 13 digit')
    .regex(
      phoneRegex,
      'Format nomor WhatsApp tidak valid. Gunakan format: 08xx, 628xx, atau +628xx',
    ),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').nullable(),
  source: z.string().max(50, 'Source maksimal 50 karakter').nullable(),
  is_active: z.boolean().optional(),
})

export const whatsappSubscriberUpdateSchema = whatsappSubscriberSchema.partial().extend({
  phone_number: z
    .string()
    .min(11, 'Nomor WhatsApp minimal 11 digit')
    .max(13, 'Nomor WhatsApp maksimal 13 digit')
    .regex(phoneRegex, 'Format nomor WhatsApp tidak valid. Gunakan format: 08xx, 628xx, atau +628xx')
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
