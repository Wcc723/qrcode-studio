#!/usr/bin/env node
// Audit a built dist/ for technical-SEO basics. Machine-verifiable checks only.
// Usage: node scripts/audit.mjs [--dist dist]
// Exit code 0 = all PASS, 1 = at least one FAIL. Zero dependencies.

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const argv = process.argv.slice(2)
const distDir = (() => {
  const i = argv.indexOf('--dist')
  return i !== -1 && argv[i + 1] ? argv[i + 1] : 'dist'
})()

if (!existsSync(distDir)) {
  console.error(`[audit] 找不到 ${distDir}/（先跑 npm run build）`)
  process.exit(1)
}

const htmlFiles = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === 'assets' || name.startsWith('.')) continue
      walk(full)
    } else if (name.endsWith('.html')) {
      htmlFiles.push(full)
    }
  }
})(distDir)

const rel = (f) => relative(distDir, f).split(sep).join('/')
const pages = htmlFiles.filter((f) => rel(f) !== '404.html')
const pick = (html, re) => {
  const m = html.match(re)
  return m ? m[1].trim() : null
}

const results = []
const add = (name, passed, detail = '') => results.push({ name, passed, detail })

// 站台層級
add('robots.txt 存在', existsSync(join(distDir, 'robots.txt')))
const robots = existsSync(join(distDir, 'robots.txt')) ? readFileSync(join(distDir, 'robots.txt'), 'utf8') : ''
add('robots.txt 含 Sitemap 行', /sitemap:\s*https?:\/\//i.test(robots))
add('sitemap.xml 存在', existsSync(join(distDir, 'sitemap.xml')))

// 逐頁
const titles = new Map()
const descs = new Map()
let hasAds = false
for (const f of pages) {
  const html = readFileSync(f, 'utf8')
  const name = rel(f)
  const title = pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  const desc = pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)
  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html)
  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)
  if (/adsbygoogle|googlesyndication|googletagmanager|gtag\/js/i.test(html)) hasAds = true

  add(`[${name}] 有 <title>`, !!title, title || '')
  add(`[${name}] 有 meta description`, !!desc)
  add(`[${name}] 有 canonical`, canonical)
  add(`[${name}] 無 noindex`, !noindex)
  if (title) titles.set(name, title)
  if (desc) descs.set(name, desc)
}

// 唯一性
const dupTitles = [...titles.values()].filter((v, _i, a) => a.indexOf(v) !== a.lastIndexOf(v))
add('所有頁 title 唯一', new Set(titles.values()).size === titles.size,
  dupTitles.length ? `重複：${[...new Set(dupTitles)].join(' / ')}` : '')
add('所有頁 description 唯一', new Set(descs.values()).size === descs.size)

// 隱私權頁（只有偵測到廣告/分析才要求）
if (hasAds) {
  const hasPrivacy = htmlFiles.some((f) => /^privacy(\/index)?\.html$/.test(rel(f)))
  add('偵測到廣告/分析 → 隱私權頁存在', hasPrivacy)
}

// 輸出
let failed = 0
for (const r of results) {
  const mark = r.passed ? 'PASS' : (failed++, 'FAIL')
  console.log(`${mark}  ${r.name}${r.detail ? `  — ${r.detail}` : ''}`)
}
console.log(`\n${results.length - failed}/${results.length} 通過`)
process.exit(failed ? 1 : 0)
