#!/usr/bin/env node
// Audit a built dist/ for technical-SEO basics. Machine-verifiable checks only.
// Usage: node scripts/audit.mjs [--dist dist]
// Exit code 0 = all PASS, 1 = at least one FAIL. Zero dependencies.

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import { CARDS } from '../brand/cards.mjs'

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
// 本站掛在 www.pocketool.app/qrcode-studio/ 子路徑，爬蟲只讀根網域的 robots.txt，
// 由 hub（pocket-tool-blog repo）統一提供，dist 內不再有這個檔。
if (existsSync(join(distDir, 'robots.txt'))) {
  const robots = readFileSync(join(distDir, 'robots.txt'), 'utf8')
  add('robots.txt 含 Sitemap 行', /sitemap:\s*https?:\/\//i.test(robots))
}
add('sitemap.xml 存在', existsSync(join(distDir, 'sitemap.xml')))

// 子路徑站台的兩個致命失誤，build 與單元測試都抓不到，只能在產物上驗：
//   ① canonical 少了 /qrcode-studio 前綴（site.ts 漏改）
//   ② 內鏈 href="/..." 沒補前綴（v-html 富文字繞過 Vite base 與 vue-router）
// 期望前綴不另立常數，改由 sitemap 的第一條 <loc> 推導——sitemap 來自
// gen-sitemap.mjs、canonical 來自 site.ts，兩個獨立來源互相對帳才有意義。
const sitemapXml = existsSync(join(distDir, 'sitemap.xml'))
  ? readFileSync(join(distDir, 'sitemap.xml'), 'utf8')
  : ''
const firstLoc = pick(sitemapXml, /<loc>([^<]+)<\/loc>/i)
const siteBase = firstLoc ? firstLoc.replace(/\/$/, '') : null
const basePath = siteBase ? `${new URL(siteBase).pathname}/`.replace(/\/{2,}/g, '/') : null
add('sitemap 第一條 loc 可解析出站台前綴', !!siteBase, siteBase || '')

// 產品名（2026-09-26 由 QR Code Studio 改名）。刻意在這裡再寫一次、不從 site.ts 推導：
// 稽核要跟產生頁面的程式各自獨立，site.ts 改錯才會被抓到。
const PRODUCT_NAME = 'QR Code 製造機'
const SITE_NAME = `${PRODUCT_NAME}｜口袋工具`
const FORMER_NAME = 'QR Code Studio'
const ALTERNATE_NAMES = ['QR Code Maker', FORMER_NAME]
const TRADEMARK = 'QR Code 是 DENSO WAVE INCORPORATED 在日本及其他國家的註冊商標。'
const metaContent = (html, prop) =>
  pick(html, new RegExp(`<meta[^>]+(?:property|name)=["']${prop.replace(/[:.]/g, '\\$&')}["'][^>]+content=["']([^"']*)["']`, 'i'))
const ogImages = new Map()
const squashText = (html) => (html ?? '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<[^>]+>/g, '').replace(/\s+/g, '')
const jsonLd = (html) => [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => { try { return JSON.parse(m[1]) } catch { return null } })
/** PNG 的寬、高與色彩類型（IHDR），順便回報有沒有 tRNS（有的話就不是全不透明） */
const pngInfo = (file) => {
  const buf = readFileSync(file)
  if (buf.toString('latin1', 1, 4) !== 'PNG') return null
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), colorType: buf[25], hasTrns: buf.includes(Buffer.from('tRNS')) }
}
/**
 * 解開 8-bit、不交錯的 RGB／RGBA PNG（sharp 產的圖示就是這種），回傳逐像素的位元組；其他格式回 null。
 * 稽核要看 maskable 圖示的實際像素，又不想為此多裝相依，所以自己解：IDAT 接起來 inflate，再逐列還原五種濾波。
 */
const pngPixels = (file) => {
  const buf = readFileSync(file)
  const [w, h, depth, colorType, interlace] = [buf.readUInt32BE(16), buf.readUInt32BE(20), buf[24], buf[25], buf[28]]
  const ch = { 2: 3, 6: 4 }[colorType]
  if (depth !== 8 || !ch || interlace !== 0) return null
  const idat = []
  for (let at = 8; at + 8 <= buf.length; ) {
    const len = buf.readUInt32BE(at)
    if (buf.toString('latin1', at + 4, at + 8) === 'IDAT') idat.push(buf.subarray(at + 8, at + 8 + len))
    at += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * ch
  const data = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]
    const src = y * (stride + 1) + 1
    const row = y * stride
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? data[row + i - ch] : 0
      const b = y > 0 ? data[row - stride + i] : 0
      const c = y > 0 && i >= ch ? data[row - stride + i - ch] : 0
      const p = a + b - c
      const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)]
      const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter]
      data[row + i] = (raw[src + i] + pred) & 0xff
    }
  }
  return { w, h, ch, data }
}

// 逐頁
const titles = new Map()
const descs = new Map()
let hasAds = false
for (const f of pages) {
  const html = readFileSync(f, 'utf8')
  const name = rel(f)
  const title = pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  const desc = pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)
  const canonicalHref = pick(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html)
  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)
  if (/adsbygoogle|googlesyndication|googletagmanager|gtag\/js/i.test(html)) hasAds = true

  add(`[${name}] 有 <title>`, !!title, title || '')
  add(`[${name}] 有 meta description`, !!desc)
  add(`[${name}] 有 canonical`, canonical)
  if (siteBase) {
    add(`[${name}] canonical 帶正確站台前綴`, !!canonicalHref && canonicalHref.startsWith(`${siteBase}/`), canonicalHref || '')
  }
  if (basePath && basePath !== '/') {
    // src 也要驗：教學本文的 <img src="/guides/..."> 同樣繞過 Vite base，漏補就是破圖。
    const badHrefs = [...html.matchAll(/\s(?:href|src)="(\/(?!\/)[^"']*)"/g)]
      .map((m) => m[1])
      .filter((h) => !h.startsWith(basePath))
    add(`[${name}] 內鏈與圖片皆帶 ${basePath} 前綴`, badHrefs.length === 0, badHrefs.slice(0, 5).join(' '))
  }
  add(`[${name}] 無 noindex`, !noindex)
  // 「廣告版位（待 AdSense 審核啟用）」這類佔位框會讓頁面看起來像沒做完，審核會扣分。
  add(`[${name}] 沒有廣告佔位框`, !html.includes('廣告版位'))
  add(`[${name}] 沒有舊品牌名 QRTool`, !html.includes('QRTool'))
  // 站長的文案規則：中文不用破折號，補充說明改用冒號、逗號或括號。
  add(`[${name}] 沒有破折號「——」`, !html.includes('——'))
  // `[&_a]:(text-brand underline)` 沒被 transformerVariantGroup 展開的話，括號裡的 class 會
  // 直接套到外層元素（整段本文變底線＋等寬字），畫面壞了但 build 不會報錯。
  const rawGroups = [...html.matchAll(/class="([^"]*)"/g)].map((m) => m[1]).filter((c) => /:\(/.test(c))
  add(`[${name}] class 裡沒有未展開的 variant group`, rawGroups.length === 0, rawGroups.slice(0, 1).join(''))
  add(`[${name}] og:site_name 是「${SITE_NAME}」`, metaContent(html, 'og:site_name') === SITE_NAME)
  // 改名：title、分享卡與畫面上都不再出現舊名。關於頁的更新紀錄刻意寫一次「原名」，其他頁一次都不行；
  // JSON-LD 的 alternateName 在 <script> 裡，不算畫面文字。
  add(`[${name}] title 與 og 標籤沒有舊名 ${FORMER_NAME}`,
    ![title, metaContent(html, 'og:title'), metaContent(html, 'og:image:alt')].some((v) => v?.includes(FORMER_NAME)))
  const formerInText = squashText(pick(html, /<body[^>]*>([\s\S]*)<\/body>/i)).split(FORMER_NAME.replace(/\s+/g, '')).length - 1
  add(`[${name}] 畫面文字的舊名次數（只有關於頁的更新紀錄一次）`, formerInText === (name === 'about/index.html' ? 1 : 0), `${formerInText} 次`)
  add(`[${name}] 頁尾有 DENSO WAVE 註冊商標聲明`, squashText(html).includes(TRADEMARK.replace(/\s+/g, '')))
  const website = jsonLd(html).map((ld) => ld?.isPartOf).find((p) => p?.['@type'] === 'WebSite')
  add(`[${name}] JSON-LD WebSite 名稱是「${PRODUCT_NAME}」、alternateName 有英文名與舊名`,
    website?.name === PRODUCT_NAME && JSON.stringify(website?.alternateName) === JSON.stringify(ALTERNATE_NAMES),
    JSON.stringify(website ?? null))
  const ogImage = metaContent(html, 'og:image')
  if (siteBase) {
    const ogFile = ogImage && ogImage.startsWith(`${siteBase}/`) ? join(distDir, ogImage.slice(siteBase.length)) : null
    add(`[${name}] og:image 指向 dist 內存在的檔案`, !!ogFile && existsSync(ogFile), ogImage || '')
    if (ogFile && existsSync(ogFile)) {
      const size = `${metaContent(html, 'og:image:width')}×${metaContent(html, 'og:image:height')}`
      if (!ogImages.has(ogFile)) ogImages.set(ogFile, new Set())
      ogImages.get(ogFile).add(size)
    }
  }
  add(`[${name}] og:image 帶寬、高、類型與替代文字`,
    ['og:image:width', 'og:image:height', 'og:image:type', 'og:image:alt'].every((p) => !!metaContent(html, p)))
  // 分享圖上的字要跟頁面對得上。2026-09-30 /barcode/ 與 /scan/ 的 title 改成白話之後，分享圖還寫著
  // 「一維條碼產生器」「就能解碼」，當時沒有一條檢查擋得住。圖上的字的正本是 scripts/brand/cards.mjs（render.mjs 用它產圖）：
  // 替代文字要寫著圖上的大標；專屬分享圖（不是 og-default）的替代文字以大標開頭、也有橫幅那句，大標還要出現在 title 裡。
  // 這裡只對得到 cards.mjs：改了字卻沒重跑 render.mjs，public/ 的 PNG 還是舊的，要自己重產、目視確認。
  const ogPath = siteBase && ogImage?.startsWith(`${siteBase}/`) ? ogImage.slice(siteBase.length + 1) : null
  const card = ogPath ? CARDS.find((c) => c.out === ogPath) : null
  // 站台根目錄的分享圖都是 render.mjs 照 cards.mjs 產的。對不到卡片的話底下的對帳會安靜跳過，所以這裡先紅；
  // 換了檔名沒改 cards.mjs 的 out、或在網址後面加 ?v= 都會停在這條。子目錄的圖（教學示意圖）不是卡片，不在此限。
  if (ogPath && !ogPath.includes('/')) add(`[${name}] og:image 是 cards.mjs 裡的一張分享圖`, !!card, ogPath)
  if (card) {
    const alt = squashText(metaContent(html, 'og:image:alt'))
    const headline = squashText(card.lines.map((l) => l.text).join(''))
    add(`[${name}] 分享圖的替代文字寫著圖上的大標「${headline}」`, alt.includes(headline), metaContent(html, 'og:image:alt') ?? '')
    if (card.out !== 'og-default.png') {
      add(`[${name}] 專屬分享圖的替代文字以大標開頭、有橫幅那句，大標也在 title 裡`,
        alt.startsWith(headline) && alt.includes(squashText(card.banner)) && squashText(title).includes(headline),
        `${card.out}：${card.banner}`)
    }
  }
  if (title) titles.set(name, title)
  if (desc) descs.set(name, desc)
}

// 唯一性
const dupTitles = [...titles.values()].filter((v, _i, a) => a.indexOf(v) !== a.lastIndexOf(v))
add('所有頁 title 唯一', new Set(titles.values()).size === titles.size,
  dupTitles.length ? `重複：${[...new Set(dupTitles)].join(' / ')}` : '')
add('所有頁 description 唯一', new Set(descs.values()).size === descs.size)

// GA 只在正式主機載入：產物（含 404.html）不能有寫死的 <script src="…googletagmanager…">，
// gtag.js 一律由看 location.hostname 的那段 inline script 插入。本機 preview、wrangler dev 與
// workers.dev 跑的是同一份產物，寫死的話開發與驗收的造訪都會混進正式報表。
// build 會把 inline script 壓縮改寫，所以不比對原始碼字面，改成把那段 script 換上假的
// location、window、document 實際跑一次（不碰網路），看它在各主機名上做了什麼。
// 主機名、量測 ID 與 content_group 刻意再寫一次，不從 index.html 推導。
const GA_HOST = 'www.pocketool.app'
const GA_ID = 'G-4FJ6KE3R2V'
const GA_CONTENT_GROUP = 'qrcode-studio'
const runGa = (script, hostname) => {
  const appended = []
  const win = {}
  const doc = { createElement: (tag) => ({ tag }), head: { appendChild: (el) => { appended.push(el) } } }
  try {
    new Function('location', 'window', 'document', script)({ hostname }, win, doc)
  } catch (e) {
    return { error: String(e) }
  }
  const commands = (win.dataLayer ?? []).map((a) => Array.from(a))
  return { appended, commands, hasGtag: typeof win.gtag === 'function' }
}
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8')
  const name = rel(f)
  const ga = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
    .filter((s) => s.includes('googletagmanager.com/gtag/js'))
  add(`[${name}] 沒有寫死的 <script src> 載入 gtag.js，恰好一段 inline GA 片段`,
    !/<script[^>]*\ssrc=["'][^"']*googletagmanager/i.test(html) && ga.length === 1, `inline GA 片段 ${ga.length} 段`)
  if (ga.length !== 1) continue
  const prod = runGa(ga[0], GA_HOST)
  add(`[${name}] GA 在 ${GA_HOST} 插入 async gtag.js，config 帶量測 ID 與 content_group`,
    !prod.error && prod.hasGtag && prod.appended.length === 1
      && prod.appended[0].tag === 'script' && prod.appended[0].async === true
      && prod.appended[0].src === `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
      && prod.commands[0]?.[0] === 'js'
      && JSON.stringify(prod.commands[1]) === JSON.stringify(['config', GA_ID, { content_group: GA_CONTENT_GROUP }]),
    prod.error ?? JSON.stringify(prod.commands[1] ?? null))
  const others = ['localhost', '127.0.0.1', 'qrcode-studio.example.workers.dev', 'pocketool.app']
    .map((h) => [h, runGa(ga[0], h)])
    .filter(([, r]) => r.error || r.hasGtag || r.appended.length || r.commands.length)
  add(`[${name}] GA 在 localhost、127.0.0.1、workers.dev、apex 都不載入`, others.length === 0,
    others.map(([h]) => h).join(' '))
}

// 分享圖：社群平台對大檔會逾時或直接不抓，全部壓在 300 KB 以下；實際尺寸要等於頁面宣告的 og:image:width／height，
// 而且是 1200×630（Facebook、LINE 的大卡比例）。
for (const [f, declared] of ogImages) {
  const size = statSync(f).size
  add(`[og] ${rel(f)} 小於 300 KB`, size < 300 * 1024, `${Math.round(size / 1024)} KB`)
  const info = pngInfo(f)
  add(`[og] ${rel(f)} 是 1200×630 的 PNG，等於頁面宣告的尺寸`,
    !!info && info.w === 1200 && info.h === 630 && [...declared].every((d) => d === `${info.w}×${info.h}`),
    info ? `實際 ${info.w}×${info.h}，宣告 ${[...declared].join(' / ')}` : '不是 PNG')
}

// 有品牌後綴的頁面：title 後綴跟著產品名換（首頁與 7 個類型頁本來就沒有後綴，不動）
for (const [page, expected] of [
  ['faq/index.html', `QR Code 產生器常見問題｜${PRODUCT_NAME}`],
  ['guide/index.html', `QR Code 教學總覽｜${PRODUCT_NAME}`],
  ['privacy/index.html', `隱私權政策｜${PRODUCT_NAME}`],
  ['about/index.html', `關於 ${PRODUCT_NAME}｜口袋工具`],
  ['404.html', `找不到頁面｜${PRODUCT_NAME}`],
]) {
  const file = join(distDir, page)
  const title = existsSync(file) ? pick(readFileSync(file, 'utf8'), /<title[^>]*>([\s\S]*?)<\/title>/i) : null
  add(`[${page}] title 是「${expected}」`, title === expected, title ?? '(沒有這頁)')
}
// /barcode/ 與 /scan/ 的標題（2026-09-30 改成白話：「一維條碼產生器」改以「條碼產生器」開頭，「解碼」改「讀取」）。
// H1 跟 title 用同一種說法，搜尋結果的標題才不會出現兩種寫法；og:title、twitter:title 跟 title 一致。
// 值刻意再寫一次、不從頁面推導，改標題時兩邊一起改。
for (const [page, expectedTitle, expectedH1] of [
  ['barcode/index.html', '條碼產生器｜EAN-13、Code 128 商品條碼線上免費製作', '條碼產生器（EAN-13、Code 128）'],
  ['scan/index.html', 'QR Code 掃描器｜上傳圖片或截圖，線上讀取 QR 與條碼', 'QR Code 掃描器：用圖片或截圖讀取'],
]) {
  const file = join(distDir, page)
  const html = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const title = pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  add(`[${page}] title 是「${expectedTitle}」`, title === expectedTitle, title ?? '(沒有這頁)')
  add(`[${page}] og:title、twitter:title 等於 title`,
    metaContent(html, 'og:title') === expectedTitle && metaContent(html, 'twitter:title') === expectedTitle)
  const h1 = squashText(pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i))
  add(`[${page}] H1 是「${expectedH1}」`, h1 === expectedH1.replace(/\s+/g, ''), h1)
}
{
  const html = readFileSync(join(distDir, 'index.html'), 'utf8')
  const app = jsonLd(html).find((ld) => ld?.['@type'] === 'SoftwareApplication')
  add(`[index.html] 首頁 SoftwareApplication 名稱是「${PRODUCT_NAME}」`, app?.name === PRODUCT_NAME, app?.name ?? '')
  add('[about/index.html] 關於頁有「商標」一節',
    squashText(readFileSync(join(distDir, 'about', 'index.html'), 'utf8')).includes(`商標${TRADEMARK}`.replace(/\s+/g, '')))
}

// 出品方 Organization：pocketool.app 底下每個站的 JSON-LD 都用同一個 @id 指口袋工具，完整定義在 hub 首頁。
// 常數刻意在這裡再寫一次、不從 site.ts 推導：site.ts 的 @id 少一個字就變成另一個實體，只有獨立對帳抓得到。
// 本產品（QR Code 製造機）的名稱只放在 WebSite，不能再變成另一個 Organization。
const ORG_ID = 'https://www.pocketool.app/#organization'
const ORG_NAME = '口袋工具 Pocketool'
const ORG_URL = 'https://www.pocketool.app/'
// logo 由 hub 提供（不在本站 dist 裡），這裡只驗網址；檔案本身的尺寸與 200 由 hub 那邊負責。
const ORG_LOGO = 'https://www.pocketool.app/brand/pocketool-icon.png'
/** 遞迴收集 JSON-LD 裡所有 @type 含 Organization 的節點（頂層、publisher、巢狀都算） */
const orgNodes = (node, out = []) => {
  if (Array.isArray(node)) node.forEach((n) => orgNodes(n, out))
  else if (node && typeof node === 'object') {
    const type = node['@type']
    if (type === 'Organization' || (Array.isArray(type) && type.includes('Organization'))) out.push(node)
    for (const v of Object.values(node)) orgNodes(v, out)
  }
  return out
}
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8')
  const name = rel(f)
  const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  const lds = jsonLd(html)
  add(`[${name}] 每段 JSON-LD 都解析得了`, blocks.length > 0 && lds.every(Boolean), `${blocks.length} 段`)
  const orgs = orgNodes(lds)
  const ids = [...new Set(orgs.map((o) => o['@id'] ?? '(沒有 @id)'))]
  add(`[${name}] 每個 Organization 都用共用 @id（一頁只有這一個實體）`, orgs.length > 0 && ids.length === 1 && ids[0] === ORG_ID, ids.join(' / '))
  add(`[${name}] Organization 的 name 與 url 是口袋工具`,
    orgs.length > 0 && orgs.every((o) => o.name === ORG_NAME && o.url === ORG_URL),
    [...new Set(orgs.map((o) => `${o.name} ${o.url}`))].join(' / '))
  const full = lds.filter((ld) => ld?.['@type'] === 'Organization')
  add(`[${name}] 有一份完整的 Organization 節點，logo 是 hub 的品牌圖`,
    full.length === 1 && full[0].logo === ORG_LOGO, JSON.stringify(full.map((o) => o.logo)))
  const withPublisher = lds.filter((ld) => ld?.publisher)
  if (name !== '404.html') {
    add(`[${name}] 主要 JSON-LD 的 publisher 指向共用節點`,
      withPublisher.length > 0 && withPublisher.every((ld) => ld.publisher['@id'] === ORG_ID && ld.publisher['@type'] === 'Organization'))
  }
}

// 站徽與圖示：沒有這些 <link> 的話，瀏覽器與 iOS 會去抓根網域的 /favicon.ico、/apple-touch-icon.png（hub 的圖示）。
// 圖檔由 scripts/brand/render.mjs 產生；apple-touch-icon 與 maskable 圖示必須不透明（iOS 會把透明補成黑色，
// maskable 被裁成圓形或方圓形時，裁切範圍內都要是底色）。
{
  const home = readFileSync(join(distDir, 'index.html'), 'utf8')
  const inDist = (href) => !!href && !!basePath && href.startsWith(basePath) && existsSync(join(distDir, href.slice(basePath.length)))
  const links = [...home.matchAll(/<link[^>]+>/gi)].map((m) => m[0])
  const hrefOf = (re) => links.filter((l) => re.test(l)).map((l) => pick(l, /href=["']([^"']+)["']/i))
  for (const [label, re, file] of [
    ['favicon.svg', /rel=["']icon["'][^>]*type=["']image\/svg\+xml["']|type=["']image\/svg\+xml["'][^>]*rel=["']icon["']/i, 'favicon.svg'],
    ['favicon.ico', /rel=["']icon["']/i, 'favicon.ico'],
    ['apple-touch-icon', /rel=["']apple-touch-icon["']/i, 'apple-touch-icon.png'],
    ['manifest', /rel=["']manifest["']/i, 'manifest.webmanifest'],
  ]) {
    const href = hrefOf(re).find((h) => h?.endsWith(file))
    add(`首頁有 ${label} 且指向本站前綴下存在的檔案`, inDist(href), href || '')
  }
  const touch = existsSync(join(distDir, 'apple-touch-icon.png')) ? pngInfo(join(distDir, 'apple-touch-icon.png')) : null
  add('apple-touch-icon 是 180×180、不透明的 RGB PNG', !!touch && touch.w === 180 && touch.h === 180 && touch.colorType === 2 && !touch.hasTrns,
    touch ? `${touch.w}×${touch.h}，色彩類型 ${touch.colorType}` : '')
  const manifestFile = join(distDir, 'manifest.webmanifest')
  let manifest = null
  try { manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) } catch { /* 下面會報 */ }
  add(`manifest 可解析、名稱是「${PRODUCT_NAME}」`, manifest?.name === PRODUCT_NAME && manifest?.short_name === PRODUCT_NAME, manifest?.name ?? '')
  // any 是站徽本身（可以透明），maskable 是滿版底色、站徽縮在安全圓內。兩種用途不能合寫成「any maskable」：
  // 當 any 用時拿到的是留了安全邊的圖，站徽看起來縮一圈。
  const icons = manifest?.icons ?? []
  const purposes = icons.map((i) => `${i.sizes} ${i.purpose ?? '(沒寫)'}`)
  add('manifest 圖示是 192 與 512 各一張 any、一張 maskable，不合寫 purpose',
    JSON.stringify([...purposes].sort()) === JSON.stringify(['192x192 any', '192x192 maskable', '512x512 any', '512x512 maskable']),
    purposes.join(' / '))
  // 底色就是 manifest 的 background_color（Android 的啟動畫面也用它），兩邊對得起來
  const bg = (manifest?.background_color ?? '').match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)?.slice(1).map((x) => parseInt(x, 16))
  for (const icon of icons) {
    const file = join(distDir, icon.src)
    const info = existsSync(file) && !icon.src.startsWith('/') ? pngInfo(file) : null
    add(`manifest 圖示 ${icon.src} 存在、尺寸相符`, !!info && `${info.w}x${info.h}` === icon.sizes, info ? `${info.w}x${info.h}` : '找不到或不是相對路徑')
    if (icon.purpose !== 'maskable' || !info) continue
    add(`maskable 圖示 ${icon.src} 是不透明的 RGB PNG`, info.colorType === 2 && !info.hasTrns, `色彩類型 ${info.colorType}`)
    // 安全圓：以中心為圓心、半徑為寬度 40% 的圓（W3C Manifest 的 safe zone），各平台的遮罩形狀都不會切到它。
    // 像素只要有一角落在圓外就算圓外（遮罩會切過它），那些像素必須跟底色一模一樣。
    const px = pngPixels(file)
    let outside = 0
    let inside = 0
    if (px && bg) {
      const radius = 0.4 * px.w
      for (let y = 0; y < px.h; y++) {
        for (let x = 0; x < px.w; x++) {
          const at = (y * px.w + x) * px.ch
          const isBg = bg.every((v, k) => px.data[at + k] === v)
          const far = Math.max(Math.abs(x - px.w / 2), Math.abs(x + 1 - px.w / 2)) ** 2 +
            Math.max(Math.abs(y - px.h / 2), Math.abs(y + 1 - px.h / 2)) ** 2 > radius ** 2
          if (!isBg && far) outside++
          if (!isBg && !far) inside++
        }
      }
    }
    add(`maskable 圖示 ${icon.src} 的安全圓（半徑 40%）外只有底色 ${manifest.background_color}，站徽在圓內`,
      !!px && !!bg && outside === 0 && inside > 0, px && bg ? `圓外 ${outside} 個像素不是底色，圓內 ${inside} 個` : '解不開 PNG 或 background_color 不是 #RRGGBB')
  }
  // 頁首站徽：srcset 也不經 Vite base，要自己驗前綴
  const logoTag = pick(home, /(<img[^>]+data-test="site-logo"[^>]*>)/i) ?? ''
  const logoUrls = [pick(logoTag, /\ssrc="([^"]+)"/), ...(pick(logoTag, /srcset="([^"]+)"/) ?? '').split(',').map((c) => c.trim().split(/\s+/)[0])]
    .filter(Boolean)
  add('頁首站徽的 src 與 srcset 都帶前綴、檔案存在', logoUrls.length === 3 && logoUrls.every(inDist), logoUrls.join(' '))
}

// 頁面類型：JSON-LD 的主類型要跟頁面性質一致。
for (const [page, type] of [['about', 'AboutPage'], ['privacy', 'WebPage'], ['faq', 'WebPage']]) {
  const file = join(distDir, page, 'index.html')
  if (!existsSync(file)) continue
  add(`[${page}] JSON-LD 主類型是 ${type}`, readFileSync(file, 'utf8').includes(`"@type":"${type}"`))
}
for (const f of pages.filter((f) => /^guide\/[^/]+\/index\.html$/.test(rel(f)))) {
  const html = readFileSync(f, 'utf8')
  const name = rel(f)
  add(`[${name}] Article 帶 datePublished 與 dateModified`,
    /"@type":"Article"/.test(html) && /"datePublished":"\d{4}-\d{2}-\d{2}/.test(html) && /"dateModified":"\d{4}-\d{2}-\d{2}/.test(html))
  add(`[${name}] 有 article:modified_time`, !!metaContent(html, 'article:modified_time'))
  add(`[${name}] 作者是真人（Person）`, /"author":\{"@type":"Person"/.test(html))
}

// 隱私權頁（只有偵測到廣告/分析才要求）
if (hasAds) {
  const hasPrivacy = htmlFiles.some((f) => /^privacy(\/index)?\.html$/.test(rel(f)))
  add('偵測到廣告/分析 → 隱私權頁存在', hasPrivacy)
}

// ───────────────────────────────────────────────────────────────────
// 網址集合：新增路由時這份清單要跟著改，那正是這條稽核的用意。
// 沒有它，「某頁預渲染失敗因此從 sitemap 消失」或「不小心多出一條路由」
// 都不會有任何錯誤訊息，只會安靜地少收錄／多收錄。
// ───────────────────────────────────────────────────────────────────
const EXPECTED_PATHS = [
  '/',
  '/about/', '/barcode/', '/batch/', '/email/', '/faq/', '/phone/', '/privacy/', '/scan/',
  '/sms/', '/text/', '/url/', '/vcard/', '/wifi/',
  '/guide/', '/guide/error-correction/', '/guide/line-qr-code/', '/guide/qr-code-svg/',
  '/guide/qr-with-logo/', '/guide/scan-qr-code/', '/guide/what-is-qr-code/',
].sort()

const sitemapPaths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname.replace(basePath ? basePath.replace(/\/$/, '') : '', '') || '/')
  .sort()
const missing = EXPECTED_PATHS.filter((p) => !sitemapPaths.includes(p))
const extra = sitemapPaths.filter((p) => !EXPECTED_PATHS.includes(p))
add('sitemap 的網址集合與預期一致', missing.length === 0 && extra.length === 0,
  [missing.length ? `缺少：${missing.join(' ')}` : '', extra.length ? `多出：${extra.join(' ')}` : ''].filter(Boolean).join('　'))
add('404 頁沒有被收進 sitemap', !sitemapPaths.some((p) => p.includes('404')))

// <lastmod>：只有教學文章有，而且必須等於頁面上的 article:modified_time（同一個事實來源）。
for (const m of sitemapXml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)) {
  const [, loc, lastmod] = m
  const path = new URL(loc).pathname.replace(basePath ? basePath.replace(/\/$/, '') : '', '') || '/'
  const isGuide = /^\/guide\/[^/]+\/$/.test(path)
  if (!isGuide) {
    add(`[sitemap] ${path} 沒有 lastmod（只有教學文章有真實更新日）`, !lastmod, lastmod || '')
    continue
  }
  const file = join(distDir, path, 'index.html')
  const modified = existsSync(file) ? metaContent(readFileSync(file, 'utf8'), 'article:modified_time') : null
  add(`[sitemap] ${path} 的 lastmod 等於文章的最後更新日`, !!lastmod && lastmod === modified, `${lastmod} / ${modified}`)
}

// ───────────────────────────────────────────────────────────────────
// /scan/：SSR 就要有的內容。這幾件事在單元測試裡看不到，只能驗產物。
// 刻意只驗「不靠 hydration 也會出現」的東西，解碼結果那類 client-only 的
// 畫面本來就不該出現在預渲染 HTML 裡。
// ───────────────────────────────────────────────────────────────────
const scanHtmlPath = join(distDir, 'scan', 'index.html')
add('/scan/ 已預渲染', existsSync(scanHtmlPath))
if (existsSync(scanHtmlPath)) {
  const html = readFileSync(scanHtmlPath, 'utf8')
  add('[scan] SSR HTML 已有 <h1>', /<h1[^>]*>[\s\S]*?掃描器[\s\S]*?<\/h1>/.test(html))
  add('[scan] SSR HTML 已有說明段落', /拖放|貼上/.test(html))
  add('[scan] SSR HTML 已有隱私與限制說明', /不會上傳/.test(html) && /SVG/.test(html) && /12 MB/.test(html))
  add('[scan] 有 WebApplication JSON-LD', /"@type":"WebApplication"/.test(html))
  add('[scan] 有 BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/.test(html))
  if (basePath) add('[scan] 互鏈到既有掃描教學', html.includes(`${basePath}guide/scan-qr-code/`))
  add('[scan] 解碼結果不該出現在預渲染 HTML（那是 client-only）',
    !/data-test="scan-result-text"/.test(html))
}

// ───────────────────────────────────────────────────────────────────
// /batch/：批次產生。預渲染要有標題、說明與結構化資料；清單與預覽是 client-only，
// 不該出現在預渲染 HTML。互鏈：首頁與條碼產生器連過來，批次頁連回兩個單張產生器。
// ───────────────────────────────────────────────────────────────────
const batchHtmlPath = join(distDir, 'batch', 'index.html')
add('/batch/ 已預渲染', existsSync(batchHtmlPath))
if (existsSync(batchHtmlPath) && basePath) {
  const html = readFileSync(batchHtmlPath, 'utf8')
  add('[batch] SSR HTML 已有 <h1>', /<h1[^>]*>[\s\S]*?批次產生[\s\S]*?<\/h1>/.test(html))
  add('[batch] 有 WebApplication JSON-LD', /"@type":"WebApplication"/.test(html))
  add('[batch] 有 BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/.test(html))
  add('[batch] 沒有 FAQPage（FAQ 只做看得到的文字）', !/"@type":"FAQPage"/.test(html))
  add('[batch] 連回條碼產生器與首頁', html.includes(`href="${basePath}barcode/"`) && html.includes(`href="${basePath}"`))
  add('[batch] 預覽格是 client-only，不在預渲染 HTML', !/data-test="batch-preview"/.test(html))
  // 標籤紙的設定與 A4 預覽要等使用者選「印成 A4 標籤紙」才出現；@page 也只在那時才加進 <head>
  add('[batch] 標籤紙的列印區是 client-only，不在預渲染 HTML', !/label-print-area|data-test="label-print"/.test(html))
  add('[batch] 說明文章有標籤紙列印與對位的段落', /印成 A4 標籤紙/.test(html) && /對位測試頁/.test(html) && /從第幾格開始/.test(html))
  for (const [page, file] of [['index.html', join(distDir, 'index.html')], ['barcode/index.html', join(distDir, 'barcode', 'index.html')]]) {
    add(`[${page}] 連到批次產生`, existsSync(file) && readFileSync(file, 'utf8').includes(`href="${basePath}batch/"`))
  }
}

const guideScanPath = join(distDir, 'guide', 'scan-qr-code', 'index.html')
if (existsSync(guideScanPath) && basePath) {
  const html = readFileSync(guideScanPath, 'utf8')
  add('[guide/scan-qr-code] 互鏈到 /scan/', html.includes(`${basePath}scan/`))
  add('[guide/scan-qr-code] 仍然以手機操作為主，沒被改成圖片解碼頁', /iPhone/.test(html) && /Android/.test(html))
}

for (const [page, needles] of [
  ['privacy', ['WebAssembly', 'localStorage']],
  ['about', ['zxing-wasm', 'Apache License', 'BSD-3-Clause']],
]) {
  const file = join(distDir, page, 'index.html')
  if (!existsSync(file)) continue
  const html = readFileSync(file, 'utf8')
  for (const needle of needles) add(`[${page}] 含「${needle}」`, html.includes(needle))
}

// ───────────────────────────────────────────────────────────────────
// 圖示：畫面上不用 emoji，改用建置時打包的 Lucide（UnoCSS presetIcons）。
// presetIcons 在圖示集沒安裝時不會報錯，class 只會靜默失效（畫面上一片空白），
// 所以要在產物上對帳：HTML 與 JS 用到的每個 i-lucide-* 都要在 CSS 裡有規則。
// ───────────────────────────────────────────────────────────────────
{
  // © ™ ® 在 Unicode 也算 Extended_Pictographic，但它們是版權與商標符號，要留著
  const emojiIn = (text) => [...text.matchAll(/[\p{Extended_Pictographic}️]/gu)].map((m) => m[0])
    .filter((c) => !['©', '™', '®'].includes(c))
  for (const f of htmlFiles) {
    const html = readFileSync(f, 'utf8')
    const body = (pick(html, /<body[^>]*>([\s\S]*)<\/body>/i) ?? '').replace(/<script[\s\S]*?<\/script>/gi, '')
    const found = emojiIn(body)
    add(`[${rel(f)}] 頁面內容沒有 emoji`, found.length === 0, [...new Set(found)].join(' '))
  }

  const assetsList = existsSync(join(distDir, 'assets')) ? readdirSync(join(distDir, 'assets')) : []
  const cssText = assetsList.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(distDir, 'assets', f), 'utf8')).join('\n')
  const jsText = assetsList.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(distDir, 'assets', f), 'utf8')).join('\n')
  const htmlText = htmlFiles.map((f) => readFileSync(f, 'utf8')).join('\n')
  const used = new Set([...`${htmlText}\n${jsText}`.matchAll(/\bi-lucide-[a-z0-9]+(?:-[a-z0-9]+)*/g)].map((m) => m[0]))
  const missingIcons = [...used].filter((c) => !cssText.includes(`.${c}{`))
  add('有用到 Lucide 圖示', used.size > 0, `${used.size} 個`)
  add('用到的 i-lucide-* 在 CSS 裡都有規則（圖示集有裝、有打包）', missingIcons.length === 0, missingIcons.join(' '))
  // 圖示一律在建置時轉成 CSS 內嵌，執行時不得向 Iconify 等第三方取圖
  add('產物沒有連到線上圖示服務', !/api\.iconify\.design|api\.unisvg\.com|api\.simplesvg\.com|esm\.sh\/@iconify/.test(`${htmlText}\n${jsText}\n${cssText}`))
}

// ───────────────────────────────────────────────────────────────────
// 工具區與說明文章：工具頁的標題下只留一行副標，原本那段完整說明移到說明文章開頭。
// SEO 內文一個字都不能刪，只能移出工具區，所以要在產物上對帳：
//   ① 每個工具頁都有工具區（data-test="tool-zone"）與它後面的說明文章（data-test="doc"）
//   ② 原本標題下的句子還在預渲染 HTML 的內文裡，而且落在說明文章，不在工具區
// 比對時拿掉所有空白：模板裡的長句會跨行。
// ───────────────────────────────────────────────────────────────────
{
  const squash = (s) => s.replace(/\s+/g, '')
  const textOf = (html) => squash((html ?? '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ''))
  const MOVED = {
    '': ['線上免費製作 QR Code（QRCode）：瀏覽器內即時生成、不傳雲端，可自訂顏色與加入 LOGO，免費下載 PNG 與 SVG 向量檔，永久有效不過期。'],
    'scan/': [
      '把電腦或手機裡已經有的圖片丟進來就好：拖放、選檔案，或直接貼上截圖。',
      '支援 QR Code 與 Code 128、EAN-13、EAN-8、Code 39、ITF-14。',
      '不必安裝軟體、不需要相機權限，圖片與解讀出來的內容都留在你的瀏覽器裡。',
    ],
    'barcode/': [
      '免費線上製作一維條碼，支援 Code 128、EAN-13、EAN-8、Code 39、ITF-14。',
      '瀏覽器內即時生成、不傳雲端，自動計算檢查碼，下載可直接印刷的 PNG 與 SVG 向量檔。',
    ],
    'batch/': [
      '免費線上批次產生 QR Code 與一維條碼：從 Excel 或 Google 試算表貼上清單、每行一筆，或直接設定連號，一次做出上千張，打包成 ZIP 下載。',
      '支援 QR Code、Code 128、EAN-13、EAN-8、Code 39、ITF-14，自動補上檢查碼（條碼最後一位，用來抓打錯的號碼）、逐列檢查錯誤，清單只在你的瀏覽器裡處理，不會上傳。',
      '也可以直接排在鶴屋、龍德的 A4 標籤紙上用瀏覽器列印：每格一個碼加一到三行字，從第幾格開始印都可以。',
    ],
  }
  // 7 個類型頁：標題下原本就是 meta description 那一句
  for (const t of ['url', 'wifi', 'vcard', 'text', 'email', 'phone', 'sms']) MOVED[`${t}/`] = null
  for (const [dir, sentences] of Object.entries(MOVED)) {
    const file = join(distDir, dir, 'index.html')
    if (!existsSync(file)) { add(`[${dir || '/'}] 工具頁存在`, false); continue }
    const html = readFileSync(file, 'utf8')
    const zoneAt = html.indexOf('data-test="tool-zone"')
    const docAt = html.indexOf('data-test="doc"')
    add(`[${dir || '/'}] 有工具區，說明文章在它後面`, zoneAt !== -1 && docAt > zoneAt)
    add(`[${dir || '/'}] 只有一個 h1`, (html.match(/<h1[\s>]/g) ?? []).length === 1)
    const zoneText = textOf(html.slice(zoneAt, docAt))
    const docText = textOf(html.slice(docAt))
    const needles = sentences ?? [metaContent(html, 'description') ?? '(沒有 description)']
    for (const s of needles) {
      const n = squash(s)
      add(`[${dir || '/'}] 內文仍有「${s.slice(0, 16)}…」且在說明文章裡`, docText.includes(n) && !zoneText.includes(n))
    }
  }
  // 掃描頁「安全與隱私」的五條留在說明文章裡（工具裡的「?」可以重述其中幾句，所以不檢查工具區）
  const scanFile = join(distDir, 'scan', 'index.html')
  if (existsSync(scanFile)) {
    const html = readFileSync(scanFile, 'utf8')
    const docText = textOf(html.slice(html.indexOf('data-test="doc"')))
    for (const s of ['圖片不離開瀏覽器', '不自動開啟任何東西', '只有 http 與 https 給開啟按鈕', '一次一張、一個碼', 'SVG 檔裡可以藏程式碼']) {
      add(`[scan/] 安全與隱私仍有「${s}」`, docText.includes(squash(s)))
    }
  }
}

// ───────────────────────────────────────────────────────────────────
// 解碼器的資產邊界
// ───────────────────────────────────────────────────────────────────
const assetsDir = join(distDir, 'assets')
const assetFiles = existsSync(assetsDir) ? readdirSync(assetsDir) : []
const wasmFiles = assetFiles.filter((f) => f.endsWith('.wasm'))
add('reader WASM 收進本站資產（恰好一份）', wasmFiles.length === 1, wasmFiles.join(' '))

if (wasmFiles.length === 1) {
  const distWasm = readFileSync(join(assetsDir, wasmFiles[0]))
  const pinned = 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm'
  if (existsSync(pinned)) {
    const same = createHash('sha256').update(distWasm).digest('hex')
      === createHash('sha256').update(readFileSync(pinned)).digest('hex')
    // JS 與 WASM 混版是難查的執行期爆炸，所以直接比對鎖定版本那一份的雜湊。
    add('本站 WASM 與 package.json 鎖定的版本是同一個檔', same)
  }

  const wasmUrl = `${basePath ?? '/'}assets/${wasmFiles[0]}`
  const jsFiles = assetFiles.filter((f) => f.endsWith('.js'))
  const jsSources = jsFiles.map((f) => [f, readFileSync(join(assetsDir, f), 'utf8')])
  add('有 chunk 指向本站的 WASM 位址（locateFile 覆寫確實有進到產物）',
    jsSources.some(([, s]) => s.includes(wasmUrl)), wasmUrl)

  // entry chunk 由首頁的 <script type="module"> 決定，名字有 hash 不能寫死。
  const homeHtml = readFileSync(join(distDir, 'index.html'), 'utf8')
  const entryName = (homeHtml.match(/<script[^>]+type="module"[^>]+src="[^"]*\/assets\/([^"]+\.js)"/) || [])[1]
  add('找得到 entry chunk', !!entryName, entryName || '')
  if (entryName) {
    const entrySource = jsSources.find(([f]) => f === entryName)?.[1] ?? ''
    // 解碼器只在 /scan/ 有人真的丟圖時才下載；進了 entry 就是全站每一頁都付這個成本。
    add('entry chunk 不含解碼器', !/zxing/i.test(entrySource))
    add('entry chunk 不含第三方 CDN 位址', !/jsdelivr|unpkg\.com/.test(entrySource))
    add('entry chunk 不直接參照 WASM', !entrySource.includes(wasmUrl))
  }

  // 上游 zxing-wasm 的 bundle 裡帶著它預設的 jsDelivr 位址字串（我們以 locateFile
  // 覆寫掉，執行期不會用到）。能驗的是：那個字串只出現在被動態載入的 chunk 裡，
  // 而且沒有任何 HTML 去 preload／preconnect 那個網域。
  const cdnPages = pages.filter((f) => /jsdelivr|unpkg\.com/.test(readFileSync(f, 'utf8')))
  add('沒有任何頁面 preload／連到第三方 CDN', cdnPages.length === 0, cdnPages.map(rel).join(' '))
  const wasmInHtml = pages.filter((f) => readFileSync(f, 'utf8').includes(wasmUrl))
  add('WASM 不在任何頁面被預先載入（只在使用者丟圖時才下載）', wasmInHtml.length === 0,
    wasmInHtml.map(rel).join(' '))
}

// ───────────────────────────────────────────────────────────────────
// 編碼器與批次邏輯的資產邊界：QR 編碼器（qrcode-generator）、一維條碼編碼器、ZIP 與批次流程
// 只在用到的頁面才下載，不能進 entry chunk。比對的是壓縮後還留著的字串；每個記號也要在某個 chunk 裡找得到，
// 免得原始碼改了字、這裡變成永遠通過的空檢查。
// ───────────────────────────────────────────────────────────────────
{
  const jsFiles = assetFiles.filter((f) => f.endsWith('.js'))
  const homeHtml = readFileSync(join(distDir, 'index.html'), 'utf8')
  const entryName = (homeHtml.match(/<script[^>]+type="module"[^>]+src="[^"]*\/assets\/([^"]+\.js)"/) || [])[1]
  const entrySource = entryName ? readFileSync(join(assetsDir, entryName), 'utf8') : ''
  for (const [label, marker] of [
    ['QR 編碼器（qrcode-generator）', 'code length overflow'],
    ['一維條碼編碼器（Code 128 樣式表）', '11011001100'],
    ['批次的 ZIP', 'ZIP 裡有重複的檔名'],
    ['批次的逐列檢查', '超過 QR Code 能放的上限'],
    ['批次的 GA 事件', 'batch_download'],
    ['標籤紙型號資料', 'LD-8108'],
    ['標籤紙的版面規格', '@page { size: A4; margin: 0; }'],
  ]) {
    const holders = jsFiles.filter((f) => readFileSync(join(assetsDir, f), 'utf8').includes(marker))
    add(`entry chunk 不含 ${label}，只在動態載入的 chunk`, !!entryName && holders.length > 0 && !entrySource.includes(marker), holders.join(' '))
  }
  // @page（A4、邊界 0）只在標籤紙的列印區顯示時才加進 <head>；寫死在 CSS 裡會讓每一頁都沒有列印邊界
  const cssWithPage = assetFiles.filter((f) => f.endsWith('.css') && /@page/.test(readFileSync(join(assetsDir, f), 'utf8')))
  add('CSS 沒有寫死 @page（只在標籤紙列印區顯示時才加）', cssWithPage.length === 0, cssWithPage.join(' '))
}

// ───────────────────────────────────────────────────────────────────
// 整頁載入的 hydrate（src/utils/hydration.ts）：client 比對 <html data-ssg-route> 與網址，
// 同一頁才沿用預渲染的 DOM。這個屬性不見或跟檔案路徑對不上，client 會默默回到整頁重畫，
// 畫面看不出來、單元測試也驗不到；404.html 是 /404，不會跟任何正常網址對上。
// 屬性名刻意再寫一次、不從原始碼推導（hydration.test.ts 鎖著同一個名字）。
//
// 另外 hydrate 不會改 <select> 的 value：預渲染的每個下拉選單都要在選中的 <option> 標 selected
// （v-model 才會有，:value 只會輸出瀏覽器不認的 <select value="M">），不然 hydrate 之後、
// 以及沒跑 JavaScript 的讀者與爬蟲，看到的都是第一個選項。
// ───────────────────────────────────────────────────────────────────
{
  const SSG_ROUTE_ATTR = 'data-ssg-route'
  const decodeAttr = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  for (const f of htmlFiles) {
    const html = readFileSync(f, 'utf8')
    const name = rel(f)
    const expected = name === '404.html' ? '/404'
      : name === 'index.html' ? '/'
        : `/${name.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`
    const attr = html.match(new RegExp(`<html\\b[^>]*\\s${SSG_ROUTE_ATTR}="([^"]*)"`, 'i'))?.[1]
    add(`[${name}] <html ${SSG_ROUTE_ATTR}> 是 ${expected}（跟檔案路徑一致，client 才會 hydrate）`,
      attr !== undefined && decodeAttr(attr) === expected, attr === undefined ? '沒有這個屬性' : attr)
    const selects = [...html.matchAll(/<select\b[^>]*>([\s\S]*?)<\/select>/gi)]
    if (selects.length) {
      const bad = selects
        .map((m) => [pick(m[0], /<select\b[^>]*\sid="([^"]*)"/i) ?? '(沒有 id)', (m[1].match(/<option\b[^>]*\sselected(?=[\s>=/])/gi) ?? []).length])
        .filter(([, n]) => n !== 1)
      add(`[${name}] 每個下拉選單都恰好標了一個 selected 的選項`, bad.length === 0, bad.map(([id, n]) => `${id} 有 ${n} 個`).join(' '))
    }
  }
}

// 輸出
let failed = 0
for (const r of results) {
  const mark = r.passed ? 'PASS' : (failed++, 'FAIL')
  console.log(`${mark}  ${r.name}${r.detail ? `  — ${r.detail}` : ''}`)
}
console.log(`\n${results.length - failed}/${results.length} 通過`)
process.exit(failed ? 1 : 0)
