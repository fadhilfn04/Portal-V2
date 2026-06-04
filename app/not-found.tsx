import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-25 px-4">
      <div className="text-center max-w-md">
        {/* Large 404 */}
        <div className="relative mb-8">
          <p className="text-[120px] font-extrabold text-neutral-100 leading-none select-none font-heading">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 border-2 border-brand-200">
              <Search size={32} className="text-brand-400" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-neutral-900 mb-3 font-heading">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-neutral-500 leading-relaxed mb-8">
          Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada.
          Kembali ke beranda dan temukan berita terkini.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Kembali ke Beranda
          </Link>
          <Link
            href="/artikel"
            className="flex items-center gap-2 px-5 py-3 border border-neutral-200 text-neutral-700 font-semibold rounded-xl text-sm hover:bg-neutral-50 transition-colors"
          >
            Lihat Semua Berita
          </Link>
        </div>
      </div>
    </div>
  )
}
