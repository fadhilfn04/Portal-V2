import Link from 'next/link'
import Image from 'next/image'
import { Eye, Heart, MessageCircle, Clock } from 'lucide-react'
import { CategoryBadge } from '@/components/shared/category-badge'
import { formatDateShort } from '@/lib/utils/format-date'
import { cn } from '@/lib/utils/cn'
import type { ArticleListItem } from '@/lib/types'

interface ArticleCardProps {
  article: ArticleListItem
  variant?: 'default' | 'horizontal' | 'compact'
  className?: string
  priority?: boolean
}

export function ArticleCard({
  article,
  variant = 'default',
  className,
  priority = false,
}: ArticleCardProps) {
  if (variant === 'horizontal') {
    return (
      <Link
        href={`/artikel/${article.slug}`}
        className={cn(
          'group flex gap-4 p-4 rounded-xl bg-white border border-neutral-150 hover:border-brand-200',
          'hover:shadow-md transition-all duration-200',
          className
        )}
      >
        {article.cover_image && (
          <div className="relative w-24 h-20 sm:w-32 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-neutral-100">
            <Image
              src={article.cover_image}
              alt={article.cover_image_alt ?? article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 96px, 128px"
            />
          </div>
        )}
        <div className="flex flex-col justify-between min-w-0 py-0.5">
          {article.category_name && (
            <CategoryBadge
              name={article.category_name}
              color={article.category_color ?? '#1a3c6e'}
              size="sm"
              className="mb-2 self-start"
            />
          )}
          <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-brand-600 line-clamp-2 transition-colors leading-snug">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 mt-auto pt-2 text-xs text-neutral-400">
            <span>{formatDateShort(article.published_at)}</span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {article.reading_time} mnt
            </span>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/artikel/${article.slug}`}
        className={cn('group flex items-start gap-3', className)}
      >
        {article.cover_image && (
          <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-neutral-100">
            <Image
              src={article.cover_image}
              alt={article.cover_image_alt ?? article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="64px"
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-800 group-hover:text-brand-600 line-clamp-2 leading-snug transition-colors">
            {article.title}
          </p>
          <p className="text-xs text-neutral-400 mt-1">{formatDateShort(article.published_at)}</p>
        </div>
      </Link>
    )
  }

  // Default card (vertical)
  return (
    <Link
      href={`/artikel/${article.slug}`}
      className={cn(
        'group flex flex-col bg-white rounded-2xl border border-neutral-150 overflow-hidden card-hover',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
        {article.cover_image ? (
          <Image
            src={article.cover_image}
            alt={article.cover_image_alt ?? article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
            <div className="text-4xl font-bold text-brand-200 font-heading">
              {article.title.charAt(0)}
            </div>
          </div>
        )}
        {/* Category overlay */}
        {article.category_name && (
          <div className="absolute top-3 left-3">
            <CategoryBadge
              name={article.category_name}
              color={article.category_color ?? '#1a3c6e'}
              size="sm"
              className="shadow-sm"
            />
          </div>
        )}
        {article.is_featured && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-accent-500 text-white rounded-full uppercase tracking-wide">
              Unggulan
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-base font-bold text-neutral-900 group-hover:text-brand-600 line-clamp-2 leading-snug transition-colors mb-2 font-heading">
          {article.title}
        </h3>

        {article.excerpt && (
          <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed mb-4 flex-1">
            {article.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 mt-auto">
          <div className="flex items-center gap-2">
            {article.author_avatar ? (
              <Image
                src={article.author_avatar}
                alt={article.author_name ?? 'Author'}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-[10px] font-bold text-brand-600">
                  {(article.author_name ?? 'A').charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-neutral-700 leading-none">
                {article.author_name ?? 'Tim Redaksi'}
              </p>
              <p className="text-[11px] text-neutral-400 leading-none mt-0.5">
                {formatDateShort(article.published_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {article.reading_time} mnt
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {article.view_count > 999
                ? `${(article.view_count / 1000).toFixed(1)}k`
                : article.view_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
