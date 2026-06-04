'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Loader2, Globe, MessageSquare, MessageCircle, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

const settingsSchema = z.object({
  site_name:                 z.string().min(2).max(100),
  site_tagline:              z.string().max(200).default(''),
  site_description:          z.string().max(500).default(''),
  articles_per_page:         z.number().int().min(4).max(50).default(12),
  enable_comments:           z.boolean().default(true),
  require_comment_approval:  z.boolean().default(true),
  enable_whatsapp:           z.boolean().default(false),
  whatsapp_gateway:          z.enum(['manual', 'waha', 'whapi', 'meta']).default('manual'),
})

type SettingsForm = z.infer<typeof settingsSchema>

async function fetchSettings(): Promise<SettingsForm> {
  const supabase = createClient()
  const { data } = await supabase.from('site_settings').select('key, value')

  const map: Record<string, unknown> = {}
  for (const row of data ?? []) {
    map[row.key] = typeof row.value === 'string'
      ? JSON.parse(row.value)
      : row.value
  }

  return {
    site_name:                (map.site_name as string)                 ?? 'Portal PeduaTel',
    site_tagline:             (map.site_tagline as string)              ?? 'Persatuan Pensiunan Telekomunikasi Indonesia',
    site_description:         (map.site_description as string)         ?? '',
    articles_per_page:        (map.articles_per_page as number)        ?? 12,
    enable_comments:          (map.enable_comments as boolean)         ?? true,
    require_comment_approval: (map.require_comment_approval as boolean)?? true,
    enable_whatsapp:          (map.enable_whatsapp as boolean)         ?? false,
    whatsapp_gateway:         (map.whatsapp_gateway as SettingsForm['whatsapp_gateway']) ?? 'manual',
  }
}

async function saveSettings(values: SettingsForm) {
  const supabase = createClient()
  const upserts = Object.entries(values).map(([key, value]) => ({
    key,
    value: JSON.stringify(value),
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' })
  if (error) throw new Error(error.message)
}

export default function PengaturanPage() {
  const qc = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSettings,
  })

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsForm>,
    defaultValues: settings,
  })

  useEffect(() => {
    if (settings) reset(settings)
  }, [settings, reset])

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast.success('Pengaturan berhasil disimpan.')
      qc.invalidateQueries({ queryKey: ['site-settings'] })
      reset(undefined, { keepValues: true })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-neutral-300" />
      </div>
    )
  }

  const enableComments = watch('enable_comments')
  const enableWhatsapp = watch('enable_whatsapp')

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 font-heading">Pengaturan</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Konfigurasi umum portal PeduaTel</p>
        </div>
        <button
          type="submit"
          disabled={mutation.isPending || !isDirty}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Simpan Perubahan
        </button>
      </div>

      {/* Section: Site Info */}
      <section className="bg-white rounded-2xl border border-neutral-150 p-6 space-y-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
            <Globe size={16} className="text-brand-600" />
          </div>
          <h2 className="text-sm font-bold text-neutral-900 font-heading">Informasi Situs</h2>
        </div>

        <Field label="Nama Situs" error={errors.site_name?.message}>
          <input type="text" {...register('site_name')} className={inputClass(!!errors.site_name)} placeholder="Portal PeduaTel" />
        </Field>

        <Field label="Tagline">
          <input type="text" {...register('site_tagline')} className={inputClass()} placeholder="Persatuan Pensiunan Telekomunikasi Indonesia" />
        </Field>

        <Field label="Deskripsi Situs">
          <textarea rows={3} {...register('site_description')} className={inputClass() + ' resize-none'} placeholder="Deskripsi singkat portal untuk SEO" />
        </Field>

        <Field label="Artikel per Halaman" error={errors.articles_per_page?.message}>
          <input type="number" {...register('articles_per_page', { valueAsNumber: true })} className={cn(inputClass(!!errors.articles_per_page), 'w-24')} min={4} max={50} />
          <p className="text-xs text-neutral-400 mt-1">Jumlah artikel yang ditampilkan di halaman listing (4–50)</p>
        </Field>
      </section>

      {/* Section: Comments */}
      <section className="bg-white rounded-2xl border border-neutral-150 p-6 space-y-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
            <MessageSquare size={16} className="text-green-600" />
          </div>
          <h2 className="text-sm font-bold text-neutral-900 font-heading">Pengaturan Komentar</h2>
        </div>

        <Toggle label="Aktifkan Komentar" description="Izinkan pengunjung memberikan komentar pada artikel" {...register('enable_comments')} />

        {enableComments && (
          <Toggle
            label="Wajib Persetujuan Moderator"
            description="Komentar baru harus disetujui admin sebelum tampil di portal"
            {...register('require_comment_approval')}
          />
        )}
      </section>

      {/* Section: WhatsApp */}
      <section className="bg-white rounded-2xl border border-neutral-150 p-6 space-y-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
            <MessageCircle size={16} className="text-green-600" />
          </div>
          <h2 className="text-sm font-bold text-neutral-900 font-heading">Broadcast WhatsApp</h2>
        </div>

        <Toggle label="Aktifkan Broadcast WhatsApp" description="Kirim notifikasi artikel baru melalui WhatsApp" {...register('enable_whatsapp')} />

        {enableWhatsapp && (
          <Field label="Gateway WhatsApp">
            <select {...register('whatsapp_gateway')} className={inputClass()}>
              <option value="manual">Manual (Salin & Tempel)</option>
              <option value="waha">WAHA API</option>
              <option value="whapi">Whapi.cloud</option>
              <option value="meta">Meta WhatsApp Business</option>
            </select>
            <p className="text-xs text-amber-600 mt-1.5">
              ⚠️ Selain Manual, gateway lain membutuhkan konfigurasi tambahan di environment variables.
            </p>
          </Field>
        )}
      </section>

      {/* Section: Security info */}
      <section className="bg-neutral-50 rounded-2xl border border-neutral-150 p-5">
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-neutral-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-neutral-700">Keamanan & Akses</p>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Pengaturan autentikasi, manajemen pengguna, dan hak akses admin dikelola langsung melalui
              Supabase Dashboard → Authentication. Untuk menambah admin baru, jalankan script SQL
              <code className="mx-1 px-1.5 py-0.5 bg-neutral-200 rounded text-xs font-mono">supabase/setup-admin.sql</code>
              di SQL Editor Supabase.
            </p>
          </div>
        </div>
      </section>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputClass(hasError = false) {
  return cn(
    'w-full h-10 px-3.5 text-sm rounded-lg border bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all',
    hasError ? 'border-red-300' : 'border-neutral-200'
  )
}

import { forwardRef } from 'react'

const Toggle = forwardRef<
  HTMLInputElement,
  { label: string; description?: string; name: string; onChange: React.ChangeEventHandler<HTMLInputElement> }
>(function Toggle({ label, description, ...props }, ref) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5">
        <input type="checkbox" ref={ref} {...props} className="sr-only peer" />
        <div className="w-10 h-6 bg-neutral-200 peer-checked:bg-brand-600 rounded-full transition-colors" />
        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-800 group-hover:text-neutral-900">{label}</p>
        {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
      </div>
    </label>
  )
})
