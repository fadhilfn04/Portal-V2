import { z } from 'zod'

export const articleSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter').max(200, 'Judul maksimal 200 karakter'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh mengandung huruf kecil, angka, dan tanda hubung'),
  excerpt: z.string().max(500, 'Ringkasan maksimal 500 karakter').optional().default(''),
  content: z.string().min(1, 'Konten tidak boleh kosong'),
  content_html: z.string().default(''),
  cover_image: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
  cover_image_alt: z.string().max(200).optional().default(''),
  category_id: z.string().uuid('Pilih kategori yang valid').optional().or(z.literal('')),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maksimal 10 tag').default([]),
  status: z.enum(['draft', 'pending_review', 'published', 'archived']).default('draft'),
  is_featured: z.boolean().default(false),
  meta_title: z.string().max(70, 'Meta title maksimal 70 karakter').optional().default(''),
  meta_description: z.string().max(160, 'Meta description maksimal 160 karakter').optional().default(''),
  published_at: z.string().optional().default(''),
  gallery_images: z.array(z.string()).max(4, 'Maksimal 4 gambar galeri').default([]),
})

export type ArticleFormData = z.infer<typeof articleSchema>
