import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, Target, Heart, Phone, Mail, MapPin, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tentang PeduaTel',
  description: 'Persatuan Pensiunan Telekomunikasi Indonesia (PeduaTel) — organisasi resmi yang menjadi wadah bagi seluruh pensiunan Telkom Indonesia.',
}

const PILLARS = [
  {
    icon: Users,
    title: 'Persatuan',
    description: 'Menjadi wadah pemersatu bagi seluruh pensiunan Telkom Indonesia di seluruh penjuru nusantara.',
  },
  {
    icon: Target,
    title: 'Pemberdayaan',
    description: 'Memberdayakan anggota melalui program pelatihan, kegiatan produktif, dan peningkatan kualitas hidup.',
  },
  {
    icon: Heart,
    title: 'Kepedulian',
    description: 'Hadir untuk anggota yang membutuhkan melalui program sosial, kesehatan, dan dukungan keluarga.',
  },
]

const STATS = [
  { value: '50.000+', label: 'Anggota Aktif' },
  { value: '34', label: 'Cabang Provinsi' },
  { value: '200+', label: 'Cabang Kabupaten/Kota' },
  { value: '1967', label: 'Tahun Berdiri' },
]

export default function TentangPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-800 to-brand-600 text-white py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20 mb-6 text-2xl font-bold font-heading">
            P
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 font-heading leading-tight">
            Persatuan Pensiunan<br />Telekomunikasi Indonesia
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto">
            Organisasi resmi yang menjadi rumah bagi seluruh pensiunan Telkom Indonesia.
            Bersama, kita tetap aktif, bermakna, dan terhubung.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-neutral-150 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-neutral-150">
            {STATS.map((stat) => (
              <div key={stat.label} className="py-10 px-6 text-center">
                <p className="text-3xl lg:text-4xl font-extrabold text-brand-600 font-heading mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About content */}
      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-bold text-accent-500 uppercase tracking-widest mb-3">Tentang Kami</p>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 font-heading mb-4">
                Siapa PeduaTel?
              </h2>
              <div className="prose-peduatel text-base text-neutral-600 space-y-4">
                <p>
                  <strong>Persatuan Pensiunan Telekomunikasi Indonesia (PeduaTel)</strong> adalah
                  organisasi kemasyarakatan yang didirikan untuk menjadi wadah persatuan, pemberdayaan,
                  dan perlindungan bagi seluruh pensiunan yang pernah mengabdi di lingkungan
                  PT Telkom Indonesia, Tbk beserta anak-anak perusahaannya.
                </p>
                <p>
                  Berdiri sejak tahun 1967, PeduaTel telah berkembang menjadi salah satu
                  organisasi pensiunan terbesar di Indonesia dengan lebih dari 50.000 anggota
                  aktif yang tersebar di 34 provinsi dan 200+ kabupaten/kota di seluruh nusantara.
                </p>
                <p>
                  Melalui berbagai program unggulan di bidang kesehatan, sosial, olahraga,
                  dan pemberdayaan ekonomi, PeduaTel berkomitmen untuk memastikan bahwa
                  masa pensiun bukan akhir dari pengabdian, melainkan babak baru kehidupan
                  yang tetap produktif, aktif, dan penuh makna.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-900 font-heading">Visi</h3>
              <div className="p-5 bg-brand-50 border border-brand-100 rounded-2xl">
                <p className="text-brand-800 font-medium leading-relaxed italic">
                  "Menjadi organisasi pensiunan Telkom yang mandiri, berdaya, dan bermartabat
                  dalam mewujudkan kesejahteraan anggota dan keluarga di seluruh Indonesia."
                </p>
              </div>

              <h3 className="text-lg font-bold text-neutral-900 font-heading mt-6">Misi</h3>
              <ul className="space-y-2.5">
                {[
                  'Mempererat silaturahmi dan persatuan sesama pensiunan Telkom Indonesia',
                  'Meningkatkan kualitas hidup anggota melalui program kesehatan, sosial, dan ekonomi',
                  'Memperjuangkan hak dan kepentingan anggota kepada pemangku kebijakan',
                  'Menyelenggarakan kegiatan yang produktif, positif, dan berkelanjutan',
                  'Membangun generasi penerus yang berprestasi melalui program beasiswa',
                ].map((misi, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-neutral-600 leading-relaxed">{misi}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="py-14 bg-neutral-50 border-y border-neutral-150">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-accent-500 uppercase tracking-widest mb-2">Nilai Utama</p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 font-heading">
              Tiga Pilar PeduaTel
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="bg-white rounded-2xl border border-neutral-150 p-7 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 mb-4">
                  <pillar.icon size={26} className="text-brand-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 font-heading mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-accent-500 uppercase tracking-widest mb-2">Hubungi Kami</p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 font-heading">
              Kontak & Alamat
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-neutral-150 p-7 space-y-5">
              <h3 className="font-bold text-neutral-900 font-heading">Kantor Pusat DPP PeduaTel</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-brand-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Gedung Grha Telkom, Jl. Gatot Subroto No. 52,<br />
                    Jakarta Selatan 12710
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-brand-400 shrink-0" />
                  <p className="text-sm text-neutral-600">(021) 5200-000</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-brand-400 shrink-0" />
                  <p className="text-sm text-neutral-600">info@peduatel.id</p>
                </div>
              </div>
              <p className="text-xs text-neutral-400 pt-2 border-t border-neutral-100">
                Jam operasional: Senin – Jumat, 08.00 – 16.00 WIB
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-neutral-150 p-5">
                <h4 className="text-sm font-semibold text-neutral-700 mb-3">Tautan Terkait</h4>
                <div className="space-y-2">
                  {[
                    { label: 'PT Telkom Indonesia, Tbk', href: 'https://telkom.co.id' },
                    { label: 'Dana Pensiun Telkom (Dapentel)', href: 'https://dapentel.co.id' },
                  ].map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                    >
                      <span className="text-sm text-neutral-700 group-hover:text-brand-600 transition-colors">
                        {link.label}
                      </span>
                      <ExternalLink size={14} className="text-neutral-400 group-hover:text-brand-400" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="bg-brand-600 rounded-2xl p-5 text-white">
                <p className="font-semibold mb-1">Bergabung dengan PeduaTel</p>
                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  Belum terdaftar? Daftarkan diri Anda sekarang dan nikmati seluruh manfaat keanggotaan.
                </p>
                <Link
                  href="/artikel?kategori=pengumuman"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brand-700 font-semibold text-sm rounded-lg hover:bg-brand-50 transition-colors"
                >
                  Lihat Info Pendaftaran
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
