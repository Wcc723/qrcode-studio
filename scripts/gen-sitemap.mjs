import { writeFileSync, readdirSync, statSync, cpSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SITE_URL || 'https://qrcode-studio.pocketool.app'
const dist = 'dist'

// 把預渲染的 NotFound 頁（/404，dirStyle: nested → dist/404/index.html）
// 提升成頂層 dist/404.html，供 Cloudflare Static Assets 的 not_found_handling: "404-page" 使用。
// 必須在 sitemap 掃描前移除 dist/404 目錄，否則 /404/ 會被收進 sitemap。
const notFoundIndex = join(dist, '404', 'index.html')
if (existsSync(notFoundIndex)) {
  cpSync(notFoundIndex, join(dist, '404.html'))
  rmSync(join(dist, '404'), { recursive: true, force: true })
}

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
