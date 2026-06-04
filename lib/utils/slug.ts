import slugify from 'slugify'

export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'id',
    remove: /[*+~.()'"!:@]/g,
  })
}

export function generateUniqueSlug(text: string, suffix?: string): string {
  const base = generateSlug(text)
  return suffix ? `${base}-${suffix}` : base
}
