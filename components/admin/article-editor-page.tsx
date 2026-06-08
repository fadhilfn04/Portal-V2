'use client'

import { useState } from 'react'
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
  Star, X, Plus, Loader2,
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
  const isEditing = !!article?.id
  const isSuperAdmin = userRole === 'super_admin'

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
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
    },
  })

  const [title, tags, status] = watch(['title', 'tags', 'status'])

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

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!isEditing && !watch('slug')) {
      setValue('slug', generateSlug(value))
    }
  }

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

      const payload = {
        ...values,
        reading_time: readingTime,
        cover_image: values.gallery_images?.[0] ?? values.cover_image ?? '',
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
                  : 'text-neutral-500'
              )}>
                {status === 'published' ? 'Terbit'
                  : status === 'pending_review' ? 'Menunggu Persetujuan'
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors shadow-sm"
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

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Judul artikel yang menarik…"
              {...register('title', { onChange: handleTitleChange })}
              className="w-full px-0 py-3 text-2xl lg:text-3xl font-extrabold text-neutral-900 placeholder-neutral-300 border-none outline-none bg-transparent font-heading"
            />
            {errors.title && (
              <p className="text-xs text-error-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="flex items-center gap-2 pb-4 border-b border-neutral-150">
            <span className="text-xs text-neutral-400">URL:</span>
            <div className="flex-1">
              <input
                type="text"
                placeholder="url-artikel-anda"
                {...register('slug')}
                className="w-full text-xs text-brand-600 bg-transparent border-none outline-none font-mono"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <textarea
              rows={2}
              placeholder="Ringkasan singkat artikel (opsional, tampil di listing dan SEO)…"
              {...register('excerpt')}
              className="w-full px-0 py-2 text-base text-neutral-600 placeholder-neutral-300 border-none outline-none bg-transparent resize-none leading-relaxed"
            />
          </div>

          {/* Photo uploader */}
          <Controller
            name="gallery_images"
            control={control}
            render={({ field }) => (
              <ArticlePhotoUploader value={field.value ?? []} onChange={field.onChange} />
            )}
          />

          {/* TipTap Editor */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-3 border-b border-neutral-150 bg-neutral-50">
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBold().run()}
                active={editor?.isActive('bold')}
                title="Bold"
              >
                <Bold size={15} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                active={editor?.isActive('italic')}
                title="Italic"
              >
                <Italic size={15} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                active={editor?.isActive('underline')}
                title="Underline"
              >
                <UnderlineIcon size={15} />
              </ToolbarButton>
              <div className="w-px h-5 bg-neutral-200 mx-1" />
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor?.isActive('heading', { level: 2 })}
                title="Heading 2"
              >
                <Heading2 size={15} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                active={editor?.isActive('heading', { level: 3 })}
                title="Heading 3"
              >
                <Heading3 size={15} />
              </ToolbarButton>
              <div className="w-px h-5 bg-neutral-200 mx-1" />
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                active={editor?.isActive('bulletList')}
                title="Bullet list"
              >
                <List size={15} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                active={editor?.isActive('orderedList')}
                title="Ordered list"
              >
                <ListOrdered size={15} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                active={editor?.isActive('blockquote')}
                title="Blockquote"
              >
                <Quote size={15} />
              </ToolbarButton>
              <div className="w-px h-5 bg-neutral-200 mx-1" />
              <ToolbarButton
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                active={editor?.isActive({ textAlign: 'left' })}
                title="Align left"
              >
                <AlignLeft size={15} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                active={editor?.isActive({ textAlign: 'center' })}
                title="Align center"
              >
                <AlignCenter size={15} />
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
          {/* Publish settings */}
          <div className="bg-white rounded-2xl border border-neutral-150 p-5 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 font-heading">Pengaturan Publikasi</h3>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Kategori</label>
              <select
                {...register('category_id')}
                className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Publish date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Tanggal Terbit</label>
              <input
                type="datetime-local"
                {...register('published_at')}
                className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
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
            {/* Tag input */}
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


          {/* SEO */}
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
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
