import { cn } from '@/lib/utils/cn'

interface CategoryBadgeProps {
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CategoryBadge({
  name,
  color = '#1a3c6e',
  size = 'md',
  className,
}: CategoryBadgeProps) {
  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full tracking-wide uppercase',
        sizes[size],
        className
      )}
      style={{
        backgroundColor: `${color}18`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {name}
    </span>
  )
}
