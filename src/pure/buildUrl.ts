export interface UrlInputData { url: string }

export function buildUrl({ url }: UrlInputData): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || /^(mailto|tel|sms):/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}
