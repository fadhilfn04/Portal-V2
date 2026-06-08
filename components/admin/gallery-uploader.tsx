'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const MAX = 4

interface ArticlePhotoUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
}

export function ArticlePhotoUploader({ value, onChange }: ArticlePhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    const slots = MAX - value.length
    if (slots <= 0) { toast.warning(`Maksimal ${MAX} foto.`); return }

    const toUpload = Array.from(files).slice(0, slots)
    setUploading(true)
    const uploaded: string[] = []

    for (const file of toUpload) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        uploaded.push(data.url)
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gagal mengunggah gambar.')
      }
    }

    if (uploaded.length) onChange([...value, ...uploaded])
    setUploading(false)
  }

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
          Foto Artikel
        </label>
        <span className="text-xs text-neutral-400">{value.length}/{MAX} foto</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }}
      />

      {/* Collage preview */}
      {value.length > 0 && <CollagePreview images={value} onRemove={remove} />}

      {/* Upload button */}
      {value.length < MAX && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed text-sm font-medium transition-colors',
            uploading
              ? 'border-brand-200 bg-brand-50 text-brand-400 cursor-not-allowed'
              : 'border-neutral-200 text-neutral-400 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-500 cursor-pointer'
          )}
        >
          {uploading
            ? <><Loader2 size={15} className="animate-spin" />Mengunggah…</>
            : <><ImagePlus size={15} />{value.length === 0 ? 'Unggah Foto' : 'Tambah Foto'}</>}
        </button>
      )}

      <p className="text-xs text-neutral-400">JPG, PNG atau WebP · Maks. 5 MB · Bisa pilih beberapa sekaligus</p>
    </div>
  )
}

/* ── Collage preview inside editor ─────────────────────────────── */

function Img({ src, onRemove, sizes, className }: { src: string; onRemove: () => void; sizes: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden group bg-neutral-100', className)}>
      <Image src={src} alt="" fill className="object-cover" sizes={sizes} />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
      >
        <X size={12} />
      </button>
    </div>
  )
}

function CollagePreview({ images, onRemove }: { images: string[]; onRemove: (i: number) => void }) {
  const n = images.length

  if (n === 1) return (
    <Img src={images[0]} onRemove={() => onRemove(0)} sizes="640px"
      className="aspect-video rounded-xl"
    />
  )

  if (n === 2) return (
    <div className="grid grid-cols-2 gap-1.5">
      {images.map((src, i) => (
        <Img key={i} src={src} onRemove={() => onRemove(i)} sizes="320px"
          className="aspect-4/3 rounded-xl"
        />
      ))}
    </div>
  )

  if (n === 3) return (
    <div className="grid grid-cols-3 gap-1.5 h-52">
      <Img src={images[0]} onRemove={() => onRemove(0)} sizes="426px"
        className="col-span-2 rounded-xl"
      />
      <div className="flex flex-col gap-1.5">
        {[1, 2].map((i) => (
          <Img key={i} src={images[i]} onRemove={() => onRemove(i)} sizes="213px"
            className="flex-1 rounded-xl"
          />
        ))}
      </div>
    </div>
  )

  // 4 images
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {images.map((src, i) => (
        <Img key={i} src={src} onRemove={() => onRemove(i)} sizes="320px"
          className="aspect-4/3 rounded-xl"
        />
      ))}
    </div>
  )
}
