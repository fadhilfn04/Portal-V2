'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Eye, Newspaper, Heart, MessageSquare, TrendingUp, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

async function fetchAnalytics() {
  const supabase = createClient()

  const [statsRes, monthlyViewsRes, monthlyArticlesRes, topArticlesRes, categoryStatsRes] = await Promise.all([
    // Overview stats
    Promise.all([
      supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'published'),
      supabase.from('articles').select('view_count, like_count').eq('status', 'published'),
      supabase.from('comments').select('id', { count: 'exact' }).eq('status', 'approved'),
      supabase.from('comments').select('id', { count: 'exact' }).eq('status', 'pending'),
    ]),
    // Monthly views
    supabase.from('monthly_views').select('*').order('month'),
    // Monthly articles
    supabase.from('monthly_articles').select('*').order('month'),
    // Top articles
    supabase.from('articles_with_author')
      .select('id, title, view_count, like_count, comment_count, category_name, category_color, published_at')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(10),
    // Articles by category
    supabase.from('categories').select('name, color').eq('is_active', true),
  ])

  const [articlesCount, articleStats, commentsCount, pendingComments] = statsRes
  const totalViews = (articleStats.data ?? []).reduce((s, a) => s + (a.view_count ?? 0), 0)
  const totalLikes = (articleStats.data ?? []).reduce((s, a) => s + (a.like_count ?? 0), 0)

  return {
    stats: {
      totalArticles: articlesCount.count ?? 0,
      totalViews,
      totalLikes,
      totalComments: commentsCount.count ?? 0,
      pendingComments: pendingComments.count ?? 0,
    },
    monthlyViews: (monthlyViewsRes.data ?? []).map((d: any) => ({
      month: format(parseISO(d.month), 'MMM yyyy', { locale: idLocale }),
      views: d.view_count,
    })),
    monthlyArticles: (monthlyArticlesRes.data ?? []).map((d: any) => ({
      month: format(parseISO(d.month), 'MMM yyyy', { locale: idLocale }),
      articles: d.article_count,
    })),
    topArticles: topArticlesRes.data ?? [],
  }
}

const STAT_CARDS = (stats: Awaited<ReturnType<typeof fetchAnalytics>>['stats']) => [
  { label: 'Artikel Terbit',  value: stats.totalArticles.toLocaleString('id-ID'),  icon: Newspaper,    color: '#1a3c6e', bg: '#f0f5ff' },
  { label: 'Total Ditonton',  value: stats.totalViews > 999 ? `${(stats.totalViews/1000).toFixed(1)}k` : stats.totalViews.toLocaleString('id-ID'), icon: Eye, color: '#0284c7', bg: '#f0f9ff' },
  { label: 'Total Suka',      value: stats.totalLikes.toLocaleString('id-ID'),     icon: Heart,        color: '#e31837', bg: '#fff1f2' },
  { label: 'Total Komentar',  value: stats.totalComments.toLocaleString('id-ID'),  icon: MessageSquare,color: '#059669', bg: '#f0fdf4' },
]

export default function AnalitikPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-neutral-300" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Gagal memuat data analitik.</p>
      </div>
    )
  }

  const { stats, monthlyViews, monthlyArticles, topArticles } = data

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 font-heading">Analitik</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Ringkasan performa portal PeduaTel</p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS(stats).map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-neutral-150 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: card.bg }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
              <TrendingUp size={14} className="text-neutral-200" />
            </div>
            <p className="text-2xl font-extrabold text-neutral-900 font-heading leading-none mb-1">{card.value}</p>
            <p className="text-xs text-neutral-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly views */}
        <div className="bg-white rounded-2xl border border-neutral-150 p-6">
          <h2 className="text-sm font-bold text-neutral-900 mb-4 font-heading">Views per Bulan</h2>
          {monthlyViews.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-neutral-400 text-sm">Belum ada data views</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyViews} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9aa3b5' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9aa3b5' }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e5eb' }}
                  formatter={(v: any) => [typeof v === 'number' ? v.toLocaleString('id-ID') : v, 'Views']}
                />
                <Line type="monotone" dataKey="views" stroke="#1a3c6e" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly articles */}
        <div className="bg-white rounded-2xl border border-neutral-150 p-6">
          <h2 className="text-sm font-bold text-neutral-900 mb-4 font-heading">Artikel Terbit per Bulan</h2>
          {monthlyArticles.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-neutral-400 text-sm">Belum ada data artikel</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyArticles} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9aa3b5' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9aa3b5' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e5eb' }}
                  formatter={(v: any) => [v, 'Artikel']}
                />
                <Bar dataKey="articles" fill="#1a3c6e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top articles table */}
      <div className="bg-white rounded-2xl border border-neutral-150">
        <div className="p-5 border-b border-neutral-100">
          <h2 className="text-sm font-bold text-neutral-900 font-heading">10 Artikel Terpopuler</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Artikel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Kategori</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Views</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Suka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {(topArticles as any[]).map((article, i) => (
                <tr key={article.id} className="hover:bg-neutral-25 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                      i < 3 ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-800 line-clamp-1">{article.title}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {article.category_name && (
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded-full"
                        style={{ backgroundColor: `${article.category_color}18`, color: article.category_color }}
                      >
                        {article.category_name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1 text-sm font-semibold text-brand-600">
                      <Eye size={13} />
                      {article.view_count.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="flex items-center justify-end gap-1 text-sm text-neutral-500">
                      <Heart size={13} />
                      {article.like_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
