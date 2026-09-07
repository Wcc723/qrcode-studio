import { writeFileSync, readdirSync, statSync, cpSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// 站台掛在 www.pocketool.app/qrcode-studio/ 子路徑：實體檔案在 dist/qrcode-studio/，
// wrangler 的 assets.directory 則維持 ./dist，兩者路徑因此與線上 URL 一一對齊。
// 這裡是子路徑網址的唯一事實來源（CI 不再用 SITE_URL 覆蓋），改網域只改這一行。
const BASE = process.env.SITE_URL || 'https://www.pocketool.app/qrcode-studio'
const dist = 'dist/qrcode-studio'
const assetsRoot = 'dist'

// 把預渲染的 NotFound 頁（/404，dirStyle: nested → dist/404/index.html）
// 提升成頂層 dist/404.html，供 Cloudflare Static Assets 的 not_found_handling: "404-page" 使用。
// 必須在 sitemap 掃描前移除 dist/404 目錄，否則 /404/ 會被收進 sitemap。
const notFoundIndex = join(dist, '404', 'index.html')
if (existsSync(notFoundIndex)) {
  cpSync(notFoundIndex, join(dist, '404.html'))
  // 再放一份到 assets 根目錄：route `www.pocketool.app/qrcode-studio*` 是尾萬用，
  // 連 /qrcode-studio-foo 這種前綴路徑也會進來，而 not_found_handling: "404-page"
  // 是往上找「最近的」404.html，那類請求找到的是根目錄這份。沒有它會回空 body。
  cpSync(notFoundIndex, join(assetsRoot, '404.html'))
  rmSync(join(dist, '404'), { recursive: true, force: true })
}

// vite-ssg 會留下 .vite/ssr-manifest.json，那是建置中繼檔、不該公開在正式網域上。
rmSync(join(dist, '.vite'), { recursive: true, force: true })

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
