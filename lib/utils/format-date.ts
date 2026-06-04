import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  return format(d, 'd MMMM yyyy', { locale: idLocale })
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  return format(d, 'd MMM yyyy', { locale: idLocale })
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  return formatDistanceToNow(d, { addSuffix: true, locale: idLocale })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  return format(d, 'd MMMM yyyy, HH:mm', { locale: idLocale })
}

export function toISOString(date: Date): string {
  return date.toISOString()
}
