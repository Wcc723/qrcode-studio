export interface VCardInputData {
  firstName: string; lastName: string; phone: string; email: string
  org: string; title: string; address: string; website: string
}

export function buildVCard(d: VCardInputData): string {
  const hasAny = Object.values(d).some(v => v.trim() !== '')
  if (!hasAny) return ''
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  lines.push(`N:${d.lastName};${d.firstName};;;`)
  lines.push(`FN:${[d.firstName, d.lastName].filter(Boolean).join(' ')}`)
  if (d.org) lines.push(`ORG:${d.org}`)
  if (d.title) lines.push(`TITLE:${d.title}`)
  if (d.phone) lines.push(`TEL:${d.phone}`)
  if (d.email) lines.push(`EMAIL:${d.email}`)
  if (d.address) lines.push(`ADR:;;${d.address};;;;`)
  if (d.website) lines.push(`URL:${d.website}`)
  lines.push('END:VCARD')
  return lines.join('\n')
}
