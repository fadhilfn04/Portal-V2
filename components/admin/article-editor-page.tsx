'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Save, Send, Eye, ArrowLeft, Bold, Italic, UnderlineIcon,
  List, ListOrdered, Quote, Image as ImageIcon, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, Heading2, Heading3,
  Star, X, Plus, Loader2, Calendar, MapPin, Clock, Pencil, Check, Info,
} from 'lucide-react'
import { articleSchema, type ArticleFormData } from '@/lib/validations/article'
import { generateSlug } from '@/lib/utils/slug'
import { calculateReadingTime } from '@/lib/utils/reading-time'
import { cn } from '@/lib/utils/cn'
import { ArticlePhotoUploader } from '@/components/admin/gallery-uploader'

interface Category {
  id: string
  name: string
  slug: string
}

interface ArticleEditorPageProps {
  categories: Category[]
  article?: Partial<ArticleFormData> & { id?: string; rejection_reason?: string | null }
  userRole?: string
}

export function ArticleEditorPage({ categories, article, userRole }: ArticleEditorPageProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [readingTime, setReadingTime] = useState(1)
  const [slugLocked, setSlugLocked] = useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const isEditing = !!article?.id
  const isSuperAdmin = userRole === 'super_admin'

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    resetField,
    formState: { errors, isDirty },
    trigger,
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema) as Resolver<ArticleFormData>,
    defaultValues: {
      title: article?.title ?? '',
      slug: article?.slug ?? '',
      excerpt: article?.excerpt ?? '',
      content: article?.content ?? '',
      content_html: article?.content_html ?? '',
      cover_image: article?.cover_image ?? '',
      cover_image_alt: article?.cover_image_alt ?? '',
      category_id: article?.category_id ?? '',
      tags: article?.tags ?? [],
      status: article?.status ?? 'draft',
      is_featured: article?.is_featured ?? false,
      meta_title: article?.meta_title ?? '',
      meta_description: article?.meta_description ?? '',
      published_at: article?.published_at ?? new Date().toISOString().slice(0, 16),
      gallery_images: (article as any)?.gallery_images ?? [],
      event_date: (article as any)?.event_date ?? null,
      event_end_date: (article as any)?.event_end_date ?? null,
      event_time: (article as any)?.event_time ?? null,
      event_end_time: (article as any)?.event_end_time ?? null,
      event_location: (article as any)?.event_location ?? null,
    },
  })

  const [title, tags, status, categoryId] = watch(['title', 'tags', 'status', 'category_id'])

  // Auto-generate slug from title (always, unless manually edited)
  useEffect(() => {
    if (title && !slugManuallyEdited) {
      setValue('slug', generateSlug(title))
    }
  }, [title, setValue, slugManuallyEdited])

  const handleSlugEdit = () => {
    setSlugLocked(!slugLocked)
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true)
    setValue('slug', e.target.value)
  }

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Mulai menulis artikel Anda di sini…' }),
    ],
    content: article?.content_html ?? '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      setValue('content_html', html)
      setValue('content', text)
      setReadingTime(calculateReadingTime(text))
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor min-h-[500px] outline-none prose-peduatel max-w-none',
      },
    },
  })

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setValue('tags', [...tags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setValue('tags', tags.filter((t) => t !== tag))
  }

  const onSubmit = async (values: ArticleFormData) => {
    setIsSaving(true)
    try {
      const endpoint = isEditing ? `/api/articles/${article!.id}` : '/api/articles'
      const method = isEditing ? 'PUT' : 'POST'

      const selectedCategory = categories.find((cat) => cat.id === values.category_id)
      const isEventCategory = selectedCategory?.name.toLowerCase() === 'kegiatan'

      const payload = {
        ...values,
        reading_time: readingTime,
        cover_image: values.gallery_images?.[0] ?? values.cover_image ?? '',
        event_date: isEventCategory ? (values.event_date || null) : null,
        event_end_date: isEventCategory ? (values.event_end_date || null) : null,
        event_time: isEventCategory ? (values.event_time || null) : null,
        event_end_time: isEventCategory ? (values.event_end_time || null) : null,
        event_location: isEventCategory ? (values.event_location || null) : null,
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(
        isEditing ? 'Artikel berhasil diperbarui!' : 'Artikel berhasil disimpan!',
        { description: values.status === 'published' ? 'Artikel telah diterbitkan.' : 'Artikel disimpan sebagai draf.' }
      )
      router.push('/admin/artikel')
    } catch (err: any) {
      toast.error('Gagal menyimpan artikel', { description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const ToolbarButton = ({
    onClick, active = false, title: tip, children,
  }: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={tip}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors',
        active
          ? 'bg-brand-100 text-brand-700'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      )}
    >
      {children}
    </button>
  )

  const selectedCategory = categories.find((cat) => cat.id === categoryId)
  const isEventCategory = selectedCategory?.name.toLowerCase() === 'kegiatan'

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 font-heading">
              {isEditing ? 'Edit Artikel' : 'Tulis Artikel Baru'}
            </h1>
            <p className="text-xs text-neutral-500">
              Status:{' '}
              <span className={cn(
                'font-semibold',
                status === 'published' ? 'text-success-600'
                  : status === 'pending_review' ? 'text-amber-600'
                  : status === 'rejected' ? 'text-red-600'
                  : 'text-neutral-500'
              )}>
                {status === 'published' ? 'Terbit'
                  : status === 'pending_review' ? 'Menunggu Persetujuan'
                  : status === 'rejected' ? 'Ditolak'
                  : status === 'archived' ? 'Diarsipkan'
                  : 'Draf'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setValue('status', 'draft')
              handleSubmit(onSubmit)()
            }}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            <Save size={15} />
            Simpan Draf
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('status', 'published')
              handleSubmit(onSubmit)()
            }}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {isSuperAdmin
              ? (isEditing ? 'Perbarui & Terbitkan' : 'Terbitkan')
              : (isEditing ? 'Ajukan Perubahan' : 'Ajukan untuk Disetujui')}
          </button>
        </div>
      </div>

      {/* Rejection notice */}
      {article?.rejection_reason && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="shrink-0 mt-0.5 text-red-500">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5zm-.75 6a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75z"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800 mb-0.5">Artikel dikembalikan oleh Pusat</p>
            <p className="text-sm text-red-700">{article.rejection_reason}</p>
            <p className="text-xs text-red-500 mt-1">Perbaiki artikel dan ajukan kembali.</p>
          </div>
        </div>
      )}

      {/* Info banner for new articles */}
      {!isEditing && !isSuperAdmin && (
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <span className="font-semibold">Info:</span> Artikel akan ditinjau oleh Superadmin sebelum diterbitkan.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title Section */}
          <div className="bg-white rounded-2xl border border-neutral-150 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-700 flex items-center gap-1">
                Judul Artikel <span className="text-error-500">*</span>
              </label>
              <span className="text-xs text-neutral-400">{title.length}/200 karakter</span>
            </div>
            <input
              type="text"
              placeholder="Masukkan judul artikel yang menarik dan informatif…"
              {...register('title')}
              className="w-full px-4 py-3 text-xl font-bold text-neutral-900 placeholder-neutral-300 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
            {errors.title && (
              <p className="text-xs text-error-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* URL/Slug Section */}
          <div className="bg-white rounded-2xl border border-neutral-150 p-5">
            <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
              URL Artikel (Slug)
              <span className="text-xs font-normal text-neutral-400">— Otomatis dari judul</span>
            </label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-neutral-400 bg-neutral-100 px-3 py-2 rounded-lg font-mono">
                /artikel/
              </span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="url-artikel"
                  {...register('slug')}
                  onChange={handleSlugChange}
                  disabled={slugLocked && !slugManuallyEdited}
                  className={cn(
                    'w-full px-4 py-2 text-sm font-mono border rounded-lg pr-10',
                    slugLocked && !slugManuallyEdited
                      ? 'bg-neutral-50 text-neutral-500 border-neutral-200'
                      : 'bg-white text-brand-600 border-neutral-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100'
                  )}
                />
                {!slugLocked && !slugManuallyEdited && (
                  <button
                    type="button"
                    onClick={() => setSlugLocked(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                    title="Kunci slug"
                  >
                    <Check size={14} />
                  </button>
                )}
                {(slugLocked || slugManuallyEdited) && (
                  <button
                    type="button"
                    onClick={handleSlugEdit}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-brand-600 transition-colors"
                    title={slugManuallyEdited ? 'Slug diedit manual' : 'Buka kunci slug'}
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              {slugManuallyEdited ? 'Slug telah diedit secara manual' : 'Slug otomatis dibuat dari judul dan dapat diedit dengan klik ikon pensil'}
            </p>
            {errors.slug && (
              <p className="text-xs text-error-600 mt-1">{errors.slug.message}</p>
            )}
          </div>

          {/* Excerpt Section */}
          <div className="bg-white rounded-2xl border border-neutral-150 p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-neutral-700">
                Ringkasan (Excerpt)
              </label>
              <span className="text-xs text-neutral-400">Opsional</span>
            </div>
            <textarea
              rows={2}
              placeholder="Tulis ringkasan singkat yang akan muncul di daftar artikel dan SEO…"
              {...register('excerpt')}
              className="w-full px-4 py-3 text-sm text-neutral-600 placeholder-neutral-300 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none transition-all"
            />
            <p className="text-xs text-neutral-400 mt-1.5">
              Ringkasan akan tampil di halaman daftar artikel dan membantu SEO.
            </p>
          </div>

          {/* Photo uploader */}
          <div className="bg-white rounded-2xl border border-neutral-150 p-5">
            <Controller
              name="gallery_images"
              control={control}
              render={({ field }) => (
                <ArticlePhotoUploader value={field.value ?? []} onChange={field.onChange} />
              )}
            />
          </div>

          {/* Content Editor */}
          <div className="bg-white rounded-2xl border border-neutral-150 overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-150 bg-neutral-50">
              <label className="text-sm font-semibold text-neutral-700 flex items-center gap-1">
                Isi Artikel <span className="text-error-500">*</span>
              </label>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-3 border-b border-neutral-150">
              <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
                <Bold size={15} />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
                <Italic size={15} />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline">
                <UnderlineIcon size={15} />
              </ToolbarButton>
              <div className="w-px h-5 bg-neutral-200 mx-1" />
              <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Heading 2">
                <Heading2 size={15} />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Heading 3">
                <Heading3 size={15} />
              </ToolbarButton>
              <div className="w-px h-5 bg-neutral-200 mx-1" />
              <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet list">
                <List size={15} />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered list">
                <ListOrdered size={15} />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Quote">
                <Quote size={15} />
              </ToolbarButton>
              <div className="w-px h-5 bg-neutral-200 mx-1" />
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('left').run()} active={editor?.isActive({ textAlign: 'left' })} title="Align left">
                <AlignLeft size={15} />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('center').run()} active={editor?.isActive({ textAlign: 'center' })} title="Align center">
                <AlignCenter size={15} />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('right').run()} active={editor?.isActive({ textAlign: 'right' })} title="Align right">
                <AlignRight size={15} />
              </ToolbarButton>
            </div>

            {/* Editor area */}
            <div className="p-6">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-5">
          {/* Publish Settings */}
          <div className="bg-white rounded-2xl border border-neutral-150 p-5 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 font-heading">Pengaturan Publikasi</h3>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1">
                Kategori <span className="text-error-500">*</span>
              </label>
              <select
                {...register('category_id')}
                className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="text-xs text-error-600 mt-1">{errors.category_id.message}</p>}
            </div>

            {/* Publish date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                Tanggal Terbit
              </label>
              <input
                type="datetime-local"
                {...register('published_at')}
                className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
              <p className="text-xs text-neutral-400 mt-1.5">Kosongkan untuk terbitkan segera</p>
            </div>

            {/* Featured */}
            <Controller
              name="is_featured"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'relative flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                      field.value ? 'bg-brand-600' : 'bg-neutral-200'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute h-4 w-4 rounded-full bg-white shadow transition-transform',
                        field.value ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700 flex items-center gap-1">
                      <Star size={14} className={field.value ? 'text-amber-500' : 'text-neutral-400'} />
                      Artikel Unggulan
                    </p>
                    <p className="text-xs text-neutral-400">Tampilkan di hero homepage</p>
                  </div>
                </label>
              )}
            />
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl border border-neutral-150 p-5">
            <h3 className="text-sm font-bold text-neutral-900 mb-3 font-heading">Tag Artikel</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Tambah tag…"
                className="flex-1 h-9 px-3 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
              <button
                type="button"
                onClick={addTag}
                className="h-9 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200 rounded-full"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 text-brand-400 hover:text-brand-700"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Event Settings - only show for Kegiatan category */}
          {isEventCategory && (
            <div className="bg-white rounded-2xl border border-neutral-150 p-5 space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 font-heading flex items-center gap-2">
                <Calendar size={16} className="text-brand-600" />
                Informasi Kegiatan
              </h3>

              {/* Event Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Tanggal Mulai</label>
                  <input
                    type="date"
                    {...register('event_date')}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Tanggal Selesai</label>
                  <input
                    type="date"
                    {...register('event_end_date')}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
              </div>

              {/* Event Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1.5">
                    <Clock size={14} />
                    Waktu Mulai
                  </label>
                  <input
                    type="time"
                    {...register('event_time')}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Waktu Selesai</label>
                  <input
                    type="time"
                    {...register('event_end_time')}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
              </div>

              {/* Event Location */}
              <div>
                <label className="text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} />
                  Lokasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Aula Serbaguna, Gedung Pusat..."
                  {...register('event_location')}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>
            </div>
          )}

          {/* SEO Settings */}
          <div className="bg-white rounded-2xl border border-neutral-150 p-5 space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 font-heading">SEO</h3>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Meta Title</label>
              <input
                type="text"
                placeholder="Judul untuk mesin pencari"
                {...register('meta_title')}
                className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Meta Description</label>
              <textarea
                rows={3}
                placeholder="Deskripsi singkat untuk mesin pencari"
                {...register('meta_description')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none transition-all"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
