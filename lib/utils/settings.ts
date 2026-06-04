import { createClient } from '@/lib/supabase/server'

export interface SiteSettings {
  site_name:                 string
  site_tagline:              string
  site_description:          string
  articles_per_page:         number
  enable_comments:           boolean
  require_comment_approval:  boolean
  enable_whatsapp:           boolean
  whatsapp_gateway:          'manual' | 'waha' | 'whapi' | 'meta'
  hero_article_id:           string | null
  featured_count:            number
}

export const SETTINGS_DEFAULTS: SiteSettings = {
  site_name:                'Portal PeduaTel',
  site_tagline:             'Persatuan Pensiunan Telekomunikasi Indonesia',
  site_description:         'Portal resmi berita dan informasi bagi pensiunan Telkom Indonesia.',
  articles_per_page:        12,
  enable_comments:          true,
  require_comment_approval: true,
  enable_whatsapp:          false,
  whatsapp_gateway:         'manual',
  hero_article_id:          null,
  featured_count:           6,
}

export async function getSettings(): Promise<SiteSettings> {
  const supabase = await createClient()
  const { data } = await supabase.from('site_settings').select('key, value')

  const map: Record<string, unknown> = {}
  for (const row of data ?? []) {
    // Supabase returns JSONB columns already parsed as JS primitives/objects
    map[row.key] = row.value
  }

  return {
    site_name:                str(map.site_name,                SETTINGS_DEFAULTS.site_name),
    site_tagline:             str(map.site_tagline,             SETTINGS_DEFAULTS.site_tagline),
    site_description:         str(map.site_description,         SETTINGS_DEFAULTS.site_description),
    articles_per_page:        num(map.articles_per_page,        SETTINGS_DEFAULTS.articles_per_page),
    enable_comments:          bool(map.enable_comments,         SETTINGS_DEFAULTS.enable_comments),
    require_comment_approval: bool(map.require_comment_approval,SETTINGS_DEFAULTS.require_comment_approval),
    enable_whatsapp:          bool(map.enable_whatsapp,         SETTINGS_DEFAULTS.enable_whatsapp),
    whatsapp_gateway:         (map.whatsapp_gateway as SiteSettings['whatsapp_gateway']) ?? SETTINGS_DEFAULTS.whatsapp_gateway,
    hero_article_id:          (map.hero_article_id as string | null) ?? null,
    featured_count:           num(map.featured_count,           SETTINGS_DEFAULTS.featured_count),
  }
}

export async function getSetting<K extends keyof SiteSettings>(key: K): Promise<SiteSettings[K]> {
  const settings = await getSettings()
  return settings[key]
}

// ── helpers ────────────────────────────────────────────────────
function bool(v: unknown, fallback: boolean): boolean {
  if (v === null || v === undefined) return fallback
  return Boolean(v)
}
function str(v: unknown, fallback: string): string {
  if (typeof v === 'string') return v
  return fallback
}
function num(v: unknown, fallback: number): number {
  const n = Number(v)
  return isNaN(n) ? fallback : n
}
