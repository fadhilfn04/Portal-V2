import Link from 'next/link'
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react'

const FOOTER_LINKS = {
  portal: [
    { label: 'Beranda', href: '/' },
    { label: 'Semua Berita', href: '/artikel' },
    { label: 'Kegiatan', href: '/kategori/kegiatan' },
    { label: 'Tentang PeduaTel', href: '/tentang' },
  ],
  kategori: [
    { label: 'Berita Pusat', href: '/kategori/berita-pusat' },
    { label: 'Berita Daerah', href: '/kategori/berita-daerah' },
    { label: 'Kesehatan', href: '/kategori/kesehatan' },
    { label: 'Dapen Telkom', href: '/kategori/dapen-telkom' },
    { label: 'Pengumuman', href: '/kategori/pengumuman' },
  ],
  eksternal: [
    { label: 'Telkom Indonesia', href: 'https://telkom.co.id', external: true },
    { label: 'Dana Pensiun Telkom', href: 'https://dapentel.co.id', external: true },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-900 text-white">
      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white font-bold text-xl font-heading">
                P
              </div>
              <div>
                <p className="font-bold text-white font-heading text-lg leading-none">PeduaTel</p>
                <p className="text-[11px] text-white/60 leading-none mt-1 tracking-wider uppercase">
                  Pensiunan Telekomunikasi
                </p>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Portal resmi berita, informasi, dan kegiatan bagi para pensiunan Telkom Indonesia.
              Tetap terhubung, tetap aktif, tetap bermakna.
            </p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="mt-0.5 shrink-0 text-white/40" />
                <span className="text-xs text-white/60 leading-relaxed">
                  Kantor Pusat P2TEL Jalan Supratman 48, Bandung
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="shrink-0 text-white/40" />
                <span className="text-xs text-white/60">+62 21 5200000</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={14} className="shrink-0 text-white/40" />
                <span className="text-xs text-white/60">info@peduatel.id</span>
              </div>
            </div>
          </div>

          {/* Portal links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Portal</h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.portal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kategori links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Kategori</h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.kategori.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* External + WhatsApp CTA */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Tautan</h4>
            <ul className="space-y-2.5 mb-6">
              {FOOTER_LINKS.eksternal.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                    <ExternalLink size={12} />
                  </a>
                </li>
              ))}
            </ul>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs font-semibold text-white mb-1">Berlangganan WhatsApp</p>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">
                Dapatkan berita terbaru langsung di WhatsApp Anda
              </p>
              <Link
                href="#whatsapp-subscribe"
                className="inline-flex items-center justify-center w-full px-3 py-2 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                📱 Daftar Sekarang
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>© {currentYear} PeduaTel — Persatuan Pensiunan Telekomunikasi Indonesia</p>
            <div className="flex items-center gap-4">
              <Link href="/kebijakan-privasi" className="hover:text-white/70 transition-colors">
                Kebijakan Privasi
              </Link>
              <Link href="/syarat-penggunaan" className="hover:text-white/70 transition-colors">
                Syarat Penggunaan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
