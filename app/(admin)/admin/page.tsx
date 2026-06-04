import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Newspaper, Eye, Heart, MessageSquare, Plus,
  TrendingUp, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatRelative } from '@/lib/utils/format-date'

export const metadata: Metadata = { title: 'Dashboard Admin' }

async function getDashboardStats() {
  const supabase = await createClient()

  const [
    articlesRes, viewsRes, likesRes, commentsRes,
    pendingCommentsRes, recentArticlesRes,
  ] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'published'),
    supabase.from('articles').select('view_count').eq('status', 'published'),
    supabase.from('articles').select('like_count').eq('status', 'published'),
    supabase.from('comments').select('id', { count: 'exact' }).eq('status', 'approved'),
    supabase.from('comments').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('articles_with_author')
      .select()
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5),
  ])

  const totalViews = (viewsRes.data ?? []).reduce((sum, a) => sum + (a.view_count ?? 0), 0)
  const totalLikes = (likesRes.data ?? []).reduce((sum, a) => sum + (a.like_count ?? 0), 0)

  return {
    totalArticles: articlesRes.count ?? 0,
    totalViews,
    totalLikes,
    totalComments: commentsRes.count ?? 0,
    pendingComments: pendingCommentsRes.count ?? 0,
    recentArticles: recentArticlesRes.data ?? [],
  }
}

const STATS = (data: Awaited<ReturnType<typeof getDashboardStats>>) => [
  {
    label: 'Artikel Terbit',
    value: data.totalArticles.toLocaleString('id-ID'),
    icon: Newspaper,
    color: '#1a3c6e',
    bg: '#f0f5ff',
    href: '/admin/artikel',
  },
  {
    label: 'Total Dibaca',
    value: data.totalViews > 999
      ? `${(data.totalViews / 1000).toFixed(1)}k`
      : data.totalViews.toLocaleString('id-ID'),
    icon: Eye,
    color: '#0284c7',
    bg: '#f0f9ff',
    href: '/admin/analitik',
  },
  {
    label: 'Total Suka',
    value: data.totalLikes.toLocaleString('id-ID'),
    icon: Heart,
    color: '#e31837',
    bg: '#fff1f2',
    href: '/admin/analitik',
  },
  {
    label: 'Komentar Disetujui',
    value: data.totalComments.toLocaleString('id-ID'),
    icon: MessageSquare,
    color: '#059669',
    bg: '#f0fdf4',
    href: '/admin/komentar',
  },
]

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()
  const statCards = STATS(stats)

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 font-heading">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Selamat datang di panel administrasi Portal PeduaTel</p>
        </div>
        <Link
          href="/admin/artikel/baru"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} />
          Artikel Baru
        </Link>
      </div>

      {/* Pending comments alert */}
      {stats.pendingComments > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {stats.pendingComments} komentar menunggu persetujuan
            </p>
            <p className="text-xs text-amber-600">Tinjau dan moderasi komentar dari pengunjung</p>
          </div>
          <Link
            href="/admin/komentar"
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
          >
            Tinjau Sekarang
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group flex flex-col p-5 bg-white rounded-2xl border border-neutral-150 hover:border-neutral-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: stat.bg }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <TrendingUp size={14} className="text-neutral-300 group-hover:text-success-500 transition-colors" />
            </div>
            <p className="text-2xl font-extrabold text-neutral-900 font-heading leading-none mb-1">
              {stat.value}
            </p>
            <p className="text-xs text-neutral-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent articles */}
      <div className="bg-white rounded-2xl border border-neutral-150">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900 font-heading">Artikel Terbaru</h2>
          <Link
            href="/admin/artikel"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Lihat Semua →
          </Link>
        </div>
        <div className="divide-y divide-neutral-50">
          {stats.recentArticles.map((article: any) => (
            <div key={article.id} className="flex items-center gap-4 px-5 py-4">
              {/* Status indicator */}
              <div className="shrink-0">
                {article.status === 'published' ? (
                  <CheckCircle2 size={18} className="text-success-500" />
                ) : (
                  <Clock size={18} className="text-neutral-300" />
                )}
              </div>

              {/* Article info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-800 truncate">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                  {article.category_name && (
                    <span
                      className="font-medium"
                      style={{ color: article.category_color }}
                    >
                      {article.category_name}
                    </span>
                  )}
                  <span>·</span>
                  <span>{formatRelative(article.published_at)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-neutral-400 shrink-0">
                <span className="flex items-center gap-1">
                  <Eye size={12} />
                  {article.view_count}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={12} />
                  {article.like_count}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/artikel/${article.slug}`}
                  target="_blank"
                  className="px-2.5 py-1.5 text-xs text-neutral-500 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Lihat
                </Link>
                <Link
                  href={`/admin/artikel/${article.id}/edit`}
                  className="px-2.5 py-1.5 text-xs text-brand-600 border border-brand-200 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tulis Artikel', href: '/admin/artikel/baru', icon: Plus, color: 'bg-brand-600 text-white' },
          { label: 'Moderasi Komentar', href: '/admin/komentar', icon: MessageSquare, color: 'bg-neutral-100 text-neutral-700' },
          { label: 'Broadcast WA', href: '/admin/broadcast', icon: TrendingUp, color: 'bg-green-500 text-white' },
          { label: 'Kelola Kategori', href: '/admin/kategori', icon: Newspaper, color: 'bg-neutral-100 text-neutral-700' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-center gap-3 p-4 rounded-xl font-medium text-sm transition-all hover:opacity-90 ${action.color}`}
          >
            <action.icon size={18} />
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
