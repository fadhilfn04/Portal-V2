import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <Icon className="h-8 w-8 text-neutral-400" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-neutral-700">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-neutral-500 leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  )
}
