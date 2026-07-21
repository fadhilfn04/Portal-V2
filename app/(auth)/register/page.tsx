'use client'

import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirm_password: z.string().min(8, 'Konfirmasi password minimal 8 karakter'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Password tidak cocok',
  path: ['confirm_password'],
})

type RegisterForm = z.infer<typeof registerSchema>

function RegisterForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values: RegisterForm) => {
    const { confirm_password, ...registerData } = values

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registrasi gagal.')
      }

      toast.success(data.message || 'Registrasi berhasil! Silakan tunggu persetujuan admin.')
      setIsSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registrasi gagal. Silakan coba lagi.')
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600 font-bold text-2xl mb-4 font-heading shadow-lg">
              ✓
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-900 font-heading">
              Registrasi Berhasil!
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Akun Anda telah terdaftar dan menunggu persetujuan administrator.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <span className="text-green-500 mt-0.5">ℹ</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">Langkah Selanjutnya</p>
                  <p className="text-sm text-green-700 mt-1">
                    Anda akan diarahkan ke halaman login dalam beberapa saat.
                    Setelah disetujui, Anda dapat login menggunakan email dan password yang telah didaftarkan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-neutral-400 mt-6">
            © {new Date().getFullYear()} PeduaTel — Persatuan Pensiunan Telekomunikasi Indonesia
          </p>
        </div>
      </div>
    )
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
          <p className="text-neutral-500 text-sm mt-1">Daftar sebagai admin</p>
        </div>

        {/* Info banner */}
        <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <span className="text-base leading-none">ℹ</span>
          <div>
            <p className="font-semibold">Persetujuan Admin Diperlukan</p>
            <p className="text-amber-600 mt-0.5">Setelah mendaftar, akun Anda perlu disetujui oleh superadmin sebelum dapat digunakan.</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="full_name">
                Nama Lengkap
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  {...register('full_name')}
                  className={cn(
                    'w-full h-11 pl-10 pr-4 rounded-xl border text-sm text-neutral-900 placeholder-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all',
                    errors.full_name ? 'border-error-400 bg-error-50' : 'border-neutral-200 hover:border-neutral-300'
                  )}
                />
              </div>
              {errors.full_name && <p className="mt-1.5 text-xs text-error-600">{errors.full_name.message}</p>}
            </div>

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
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="confirm_password">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('confirm_password')}
                  className={cn(
                    'w-full h-11 pl-10 pr-11 rounded-xl border text-sm text-neutral-900 placeholder-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all',
                    errors.confirm_password ? 'border-error-400 bg-error-50' : 'border-neutral-200 hover:border-neutral-300'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm_password && <p className="mt-1.5 text-xs text-error-600">{errors.confirm_password.message}</p>}
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
                  Mendaftar…
                </>
              ) : (
                'Daftar sebagai Admin'
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              Sudah punya akun?{' '}
              <a href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
                Masuk di sini
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          © {new Date().getFullYear()} PeduaTel — Persatuan Pensiunan Telekomunikasi Indonesia
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
