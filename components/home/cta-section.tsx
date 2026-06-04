'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessageCircle, Loader2, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { whatsappSubscribeSchema, type WhatsAppSubscribeData } from '@/lib/validations/comment'
import { cn } from '@/lib/utils/cn'

export function CtaSection() {
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WhatsAppSubscribeData>({
    resolver: zodResolver(whatsappSubscribeSchema),
  })

  const onSubmit = async (values: WhatsAppSubscribeData) => {
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
      reset()
      toast.success('Berhasil! Anda akan menerima notifikasi berita terbaru via WhatsApp.')
    } catch {
      toast.error('Pendaftaran gagal. Silakan coba lagi.')
    }
  }

  return (
    <section
      id="whatsapp-subscribe"
      className="py-12 lg:py-16 bg-gradient-to-br from-brand-600 to-brand-800 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
        {/* Icon */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20 mb-6">
          <MessageCircle size={32} className="text-white" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 font-heading">
          Dapatkan Berita Terbaru via WhatsApp
        </h2>
        <p className="text-white/70 text-base mb-8 max-w-lg mx-auto leading-relaxed">
          Daftarkan nomor WhatsApp Anda dan terima berita, kegiatan, dan informasi terbaru
          dari PeduaTel langsung di genggaman Anda.
        </p>

        {success ? (
          <div className="flex items-center justify-center gap-3 p-4 bg-white/10 border border-white/20 rounded-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
              <Check size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Pendaftaran Berhasil!</p>
              <p className="text-white/70 text-sm">Anda akan menerima berita terbaru via WhatsApp.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="flex-1">
                <input
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  {...register('phone_number')}
                  className={cn(
                    'w-full h-12 px-4 rounded-xl bg-white/10 border text-white placeholder-white/50',
                    'focus:outline-none focus:ring-2 focus:ring-white/40 transition-all text-base',
                    errors.phone_number
                      ? 'border-red-400 bg-red-500/10'
                      : 'border-white/30 hover:border-white/50 focus:border-white/60'
                  )}
                />
                {errors.phone_number && (
                  <p className="mt-1 text-xs text-red-300 text-left">{errors.phone_number.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-6 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <MessageCircle size={18} />
                    Daftar WhatsApp
                  </>
                )}
              </button>
            </div>
            <p className="text-white/50 text-xs">
              Nomor Anda aman bersama kami. Anda dapat berhenti berlangganan kapan saja.
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
