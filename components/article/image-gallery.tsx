'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PhotoCollageProps {
  images: string[]
}

export function PhotoCollage({ images }: PhotoCollageProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (!images.length) return null

  return (
    <>
      <CollageGrid images={images} onOpen={setLightbox} />
      {lightbox !== null && (
        <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} onChange={setLightbox} />
      )}
    </>
  )
}

/* ── Shared image slot ─────────────────────────────────────────── */

function Slot({ src, index, onOpen, sizes, className, priority }: {
  src: string
  index: number
  onOpen: (i: number) => void
  sizes: string
  className?: string
  priority?: boolean
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden cursor-zoom-in group bg-neutral-100',
        className,
      )}
      onClick={() => onOpen(index)}
    >
      <Image
        src={src}
        alt={`Foto ${index + 1}`}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        sizes={sizes}
        priority={priority}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
    </div>
  )
}

/* ── Layout grids ──────────────────────────────────────────────── */

function CollageGrid({ images, onOpen }: { images: string[]; onOpen: (i: number) => void }) {
  const n = images.length

  if (n === 1) return (
    <Slot
      src={images[0]}
      index={0}
      onOpen={onOpen}
      sizes="(max-width:1024px) 100vw, 800px"
      priority
      className="aspect-video rounded-2xl mb-8 shadow-md"
    />
  )

  if (n === 2) return (
    <div className="grid grid-cols-2 gap-1.5 mb-8 rounded-2xl overflow-hidden shadow-md">
      {images.map((src, i) => (
        <Slot key={i} src={src} index={i} onOpen={onOpen} sizes="400px" priority={i === 0}
          className="aspect-4/3"
        />
      ))}
    </div>
  )

  if (n === 3) return (
    <div className="grid grid-cols-3 gap-1.5 h-72 mb-8 rounded-2xl overflow-hidden shadow-md">
      <Slot src={images[0]} index={0} onOpen={onOpen} sizes="533px" priority
        className="col-span-2"
      />
      <div className="flex flex-col gap-1.5">
        <Slot src={images[1]} index={1} onOpen={onOpen} sizes="267px" className="flex-1" />
        <Slot src={images[2]} index={2} onOpen={onOpen} sizes="267px" className="flex-1" />
      </div>
    </div>
  )

  // 4 images
  return (
    <div className="grid grid-cols-2 gap-1.5 mb-8 rounded-2xl overflow-hidden shadow-md">
      {images.map((src, i) => (
        <Slot key={i} src={src} index={i} onOpen={onOpen} sizes="400px" priority={i === 0}
          className="aspect-4/3"
        />
      ))}
    </div>
  )
}

/* ── Lightbox ───────────────────────────────────────────────────── */

function Lightbox({ images, index, onClose, onChange }: {
  images: string[]
  index: number
  onClose: () => void
  onChange: (i: number) => void
}) {
  const prev = () => onChange((index - 1 + images.length) % images.length)
  const next = () => onChange((index + 1) % images.length)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
        onClick={onClose}
        aria-label="Tutup"
      >
        <X size={20} />
      </button>

      <div
        className="relative w-full max-w-5xl"
        style={{ maxHeight: '90vh', aspectRatio: '16/9' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[index]}
          alt={`Foto ${index + 1}`}
          fill
          className="object-contain"
          sizes="100vw"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Sebelumnya"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Berikutnya"
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onChange(i) }}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
