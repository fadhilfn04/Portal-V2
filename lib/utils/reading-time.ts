import rt from 'reading-time'

export function calculateReadingTime(content: string): number {
  const stats = rt(content)
  return Math.max(1, Math.ceil(stats.minutes))
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} menit baca`
}
