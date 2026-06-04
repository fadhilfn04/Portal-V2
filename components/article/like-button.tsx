'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

interface LikeButtonProps {
  articleId: string
  initialCount: number
  className?: string
}

export function LikeButton({ articleId, initialCount, className }: LikeButtonProps) {
  const [count, setCount]   = useState(initialCount)
  const [liked, setLiked]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [particles, setParticles] = useState<number[]>([])

  // Persist liked state via localStorage
  useEffect(() => {
    const key = `liked_${articleId}`
    setLiked(localStorage.getItem(key) === '1')
  }, [articleId])

  const handleLike = async () => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(`/api/articles/${articleId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      const isNowLiked: boolean = data.liked
      setLiked(isNowLiked)
      setCount(data.count)
      localStorage.setItem(`liked_${articleId}`, isNowLiked ? '1' : '0')

      if (isNowLiked) {
        // Particle burst effect
        setParticles(Array.from({ length: 6 }, (_, i) => i))
        setTimeout(() => setParticles([]), 600)
        toast.success('Terima kasih atas suka Anda!', { duration: 2000 })
      }
    } catch {
      toast.error('Gagal memproses, coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col items-center gap-1.5 relative', className)}>
      {/* Particles */}
      <AnimatePresence>
        {particles.map((i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: 1,
              x: (Math.random() - 0.5) * 60,
              y: -(Math.random() * 40 + 20),
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Heart size={12} className="fill-accent-500 text-accent-500" />
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.button
        onClick={handleLike}
        disabled={loading}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-200',
          liked
            ? 'bg-accent-50 border-accent-300 text-accent-500'
            : 'bg-white border-neutral-200 text-neutral-400 hover:border-accent-300 hover:text-accent-400',
          loading && 'opacity-60 cursor-not-allowed'
        )}
        aria-label={liked ? 'Batal suka' : 'Suka artikel ini'}
      >
        <motion.div
          animate={liked ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Heart
            size={20}
            className={cn(
              'transition-all',
              liked ? 'fill-accent-500 text-accent-500' : 'fill-none'
            )}
          />
        </motion.div>
      </motion.button>

      <span className={cn(
        'text-xs font-semibold tabular-nums',
        liked ? 'text-accent-500' : 'text-neutral-400'
      )}>
        {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
      </span>
    </div>
  )
}
