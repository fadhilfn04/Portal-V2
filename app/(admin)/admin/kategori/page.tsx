'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, GripVertical, Check, X, Loader2 } from 'lucide-react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const PRESET_COLORS = [
  '#1a3c6e', '#0284c7', '#059669', '#d97706',
  '#dc2626', '#7c3aed', '#db2777', '#ea580c',
  '#0f766e', '#1d4ed8', '#15803d', '#b45309',
]

const categoryFormSchema = z.object({
  name: z.string().min(2, 'Minimal 2 karakter').max(50),
  description: z.string().max(200).optional().default(''),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#1a3c6e'),
  sort_order: z.number().int().default(0),
})

type CategoryForm = z.infer<typeof categoryFormSchema>

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  sort_order: number
  is_active: boolean
}

export default function KategoriPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      const json = await res.json()
      return json.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: CategoryForm) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Gagal membuat kategori')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      toast.success('Kategori berhasil ditambahkan.')
      setShowAddForm(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<CategoryForm & { is_active: boolean }> }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Gagal memperbarui kategori')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      toast.success('Kategori berhasil diperbarui.')
      setEditingId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Gagal menghapus kategori')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      toast.success('Kategori berhasil dihapus.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 font-heading">Kelola Kategori</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{categories.length} kategori tersedia</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} />
          Tambah Kategori
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <CategoryForm
          onSubmit={(values) => createMutation.mutate(values)}
          onCancel={() => setShowAddForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Category list */}
      <div className="bg-white rounded-2xl border border-neutral-150">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-neutral-300" />
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {categories.map((cat) => (
              <div key={cat.id}>
                {editingId === cat.id ? (
                  <div className="p-5">
                    <CategoryForm
                      defaultValues={{ name: cat.name, description: cat.description ?? '', color: cat.color, sort_order: cat.sort_order }}
                      onSubmit={(values) => updateMutation.mutate({ id: cat.id, values })}
                      onCancel={() => setEditingId(null)}
                      isLoading={updateMutation.isPending}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Drag handle */}
                    <GripVertical size={16} className="text-neutral-300 shrink-0 cursor-grab" />

                    {/* Color swatch */}
                    <div
                      className="h-8 w-8 rounded-lg shrink-0 border-2 border-white shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-800 text-sm">{cat.name}</span>
                        <span className="text-xs text-neutral-400 font-mono">/{cat.slug}</span>
                        {!cat.is_active && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-neutral-100 text-neutral-500 rounded-full uppercase">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-xs text-neutral-400 mt-0.5 truncate">{cat.description}</p>
                      )}
                    </div>

                    {/* Sort order */}
                    <span className="text-xs text-neutral-400 hidden sm:block">Urutan: {cat.sort_order}</span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateMutation.mutate({ id: cat.id, values: { is_active: !cat.is_active } })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"
                        title={cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {cat.is_active
                          ? <ToggleRight size={18} className="text-green-500" />
                          : <ToggleLeft size={18} />}
                      </button>
                      <button
                        onClick={() => setEditingId(cat.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus kategori "${cat.name}"?`)) {
                            deleteMutation.mutate(cat.id)
                          }
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: {
  defaultValues?: Partial<CategoryForm>
  onSubmit: (v: CategoryForm) => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CategoryForm>({
    resolver: zodResolver(categoryFormSchema) as Resolver<CategoryForm>,
    defaultValues: { name: '', description: '', color: '#1a3c6e', sort_order: 0, ...defaultValues },
  })

  const selectedColor = watch('color')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-neutral-50 rounded-xl border border-neutral-200 p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Nama Kategori *</label>
          <input
            type="text"
            {...register('name')}
            placeholder="Contoh: Berita Pusat"
            className={cn(
              'w-full h-10 px-3.5 text-sm rounded-lg border bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all',
              errors.name ? 'border-red-300' : 'border-neutral-200'
            )}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        {/* Sort order */}
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Urutan Tampil</label>
          <input
            type="number"
            {...register('sort_order', { valueAsNumber: true })}
            className="w-full h-10 px-3.5 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Deskripsi (opsional)</label>
        <input
          type="text"
          {...register('description')}
          placeholder="Deskripsi singkat kategori"
          className="w-full h-10 px-3.5 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
        />
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-xs font-semibold text-neutral-600 mb-2">Warna Kategori</label>
        <div className="flex items-center gap-3 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              className={cn(
                'h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110',
                selectedColor === c ? 'border-neutral-900 scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            {...register('color')}
            className="h-8 w-12 rounded-lg border border-neutral-200 cursor-pointer p-0.5"
            title="Pilih warna kustom"
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-5 w-5 rounded-md" style={{ backgroundColor: selectedColor }} />
          <span className="text-xs font-mono text-neutral-500">{selectedColor}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Simpan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <X size={14} />
          Batal
        </button>
      </div>
    </form>
  )
}
