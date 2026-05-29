export interface EmailInputData { to: string; subject: string; body: string }

export function buildEmail({ to, subject, body }: EmailInputData): string {
  if (!to.trim()) return ''
  const params: string[] = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  return `mailto:${to.trim()}${params.length ? '?' + params.join('&') : ''}`
}
