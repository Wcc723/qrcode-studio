import { writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SITE_URL || 'https://qrtool.example'
const dist = 'dist'

function walk(dir, prefix = '') {
  const urls = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      urls.push(...walk(full, `${prefix}/${entry}`))
    } else if (entry === 'index.html') {
      urls.push(prefix === '' ? '/' : prefix)
    }
  }
  return urls
}

const urls = [...new Set(walk(dist))].sort()
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${BASE}${u === '/' ? '/' : u + '/'}</loc></url>`).join('\n')}
</urlset>
`
writeFileSync(join(dist, 'sitemap.xml'), xml)
console.log(`sitemap.xml written with ${urls.length} urls`)
