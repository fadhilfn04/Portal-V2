import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { HeroSection } from '@/components/home/hero-section'
import { LatestNewsSection } from '@/components/home/latest-news-section'
import { RegionalNewsSection } from '@/components/home/regional-news-section'
import { PopularArticlesSection } from '@/components/home/popular-articles-section'
import { EventsCalendarSection } from '@/components/home/events-calendar-section'
import { CtaSection } from '@/components/home/cta-section'
import type { ArticleListItem } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Beranda',
}

export const revalidate = 300 // 5 minutes

async function getHomepageData() {
  const supabase = await createClient()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const [featuredRes, latestRes, popularRes, regionalRes, eventsRes] = await Promise.all([
    // Hero: most recent featured
    supabase
      .from('articles_with_author')
      .select()
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(4),

    // Latest news
    supabase
      .from('articles_with_author')
      .select()
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(7),

    // Popular by views
    supabase
      .from('articles_with_author')
      .select()
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(6),

    // Regional news
    supabase
      .from('articles_with_author')
      .select()
      .eq('status', 'published')
      .eq('category_slug', 'berita-daerah')
      .order('published_at', { ascending: false })
      .limit(4),

    // Calendar events for current month (articles with event_date set)
    supabase
      .from('articles_with_author')
      .select('id,title,slug,is_featured,category_name,category_slug,category_color,event_date,event_end_date,event_time,event_end_time,event_location')
      .eq('status', 'published')
      .not('event_date', 'is', null)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true }),
  ])

  return {
    featured: (featuredRes.data?.[0] as ArticleListItem) ?? null,
    featuredSecondary: (featuredRes.data?.slice(1) as ArticleListItem[]) ?? [],
    latest: (latestRes.data as ArticleListItem[]) ?? [],
    popular: (popularRes.data as ArticleListItem[]) ?? [],
    regional: (regionalRes.data as ArticleListItem[]) ?? [],
    events: (eventsRes.data as ArticleListItem[]) ?? [],
  }
}

export default async function HomePage() {
  const { featured, featuredSecondary, latest, popular, regional, events } =
    await getHomepageData()

  return (
    <>
      {/* 1 — Hero: Featured article + secondary list */}
      <HeroSection featured={featured} secondary={featuredSecondary} />

      {/* 2 — Berita Terbaru */}
      <LatestNewsSection articles={latest} />

      {/* 3 — Paling Banyak Dibaca */}
      <PopularArticlesSection articles={popular} />

      {/* 4 — Kalender Kegiatan */}
      <EventsCalendarSection initialEvents={events} />

      {/* 5 — Berita Daerah */}
      <RegionalNewsSection articles={regional} />

      {/* 6 — WhatsApp CTA */}
      <CtaSection />
    </>
  )
}
