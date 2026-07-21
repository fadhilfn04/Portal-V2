'use client'

import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/admin'
  const hasAccessError = searchParams.get('error') === 'no-access'
  const hasNotApprovedError = searchParams.get('error') === 'not-approved'
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginForm) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      toast.error('Email atau password salah. Silakan periksa kembali.')
      return
    }

    // Check if user is approved (for admin role)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_approved')
      .eq('id', data.user.id)
      .single()

    // If admin and not approved, sign out and redirect with error
    if (profile?.role === 'admin' && !profile.is_approved) {
      await supabase.auth.signOut()
      window.location.href = '/login?error=not-approved'
      return
    }

    // Hard redirect so Next.js server picks up the new session cookie
    window.location.href = redirectTo
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white font-bold text-2xl mb-4 font-heading shadow-lg">
            P
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 font-heading">
            Portal PeduaTel
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Masuk ke panel administrasi</p>
        </div>

        {/* Access denied banner */}
        {hasAccessError && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-error-50 border border-error-200 rounded-xl text-sm text-error-700">
            <span className="text-base leading-none">⛔</span>
            <div>
              <p className="font-semibold">Akses Ditolak</p>
              <p className="text-error-600 mt-0.5">Akun Anda belum memiliki hak akses admin. Hubungi administrator untuk mendapatkan akses.</p>
            </div>
          </div>
        )}

        {/* Not approved banner */}
        {hasNotApprovedError && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <span className="text-base leading-none">⏳</span>
            <div>
              <p className="font-semibold">Akun Belum Disetujui</p>
              <p className="text-amber-600 mt-0.5">Akun Anda telah terdaftar tetapi belum disetujui oleh administrator. Silakan tunggu persetujuan.</p>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="email">
                Alamat Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@peduatel.id"
                  {...register('email')}
                  className={cn(
                    'w-full h-11 pl-10 pr-4 rounded-xl border text-sm text-neutral-900 placeholder-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all',
                    errors.email ? 'border-error-400 bg-error-50' : 'border-neutral-200 hover:border-neutral-300'
                  )}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-error-600">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={cn(
                    'w-full h-11 pl-10 pr-11 rounded-xl border text-sm text-neutral-900 placeholder-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all',
                    errors.password ? 'border-error-400 bg-error-50' : 'border-neutral-200 hover:border-neutral-300'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-error-600">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Masuk…
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          © {new Date().getFullYear()} PeduaTel — Persatuan Pensiunan Telekomunikasi Indonesia
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
