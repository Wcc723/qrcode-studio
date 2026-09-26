// @vitest-environment node
/**
 * 畫面上不用 emoji，圖示一律用建置時打包的 Lucide（UnoCSS presetIcons 的 i-lucide-* class）。
 *
 * emoji 的長相由各家系統字型決定（同一個 🔒 在 Windows、macOS、Android 各長一樣），顏色也無法跟著
 * 文字走；圖示改成單色 SVG 之後，童趣感由糖果色圓底徽章（uno.config.ts 的 icon-badge）補回來。
 *
 * 掃的是會出現在畫面上的原始檔：元件、頁面、版面、設定檔與教學本文。測試檔不掃：
 * qrByteString.test.ts、qr-utf8-roundtrip.test.ts 刻意用 emoji 驗證 UTF-8 編碼。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

function walk(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const rel = `${dir}/${name}`
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel]
  })
}

const SOURCES = [
  'index.html',
  ...walk('src').filter((f) => /\.(vue|ts)$/.test(f) && !/\.test\.ts$/.test(f) && !f.endsWith('.d.ts')),
]

/**
 * © 與 ™、® 在 Unicode 裡也屬於 Extended_Pictographic，但它們是一般的文字符號（版權聲明、商標），
 * 要留著。⌘ 是按鍵上印的字，不屬於 Extended_Pictographic，本來就不會被擋，畫面上要包進 <kbd>。
 * U+FE0F 是「用 emoji 樣式顯示」的選擇符，接在 ✏、⬇ 這類字後面就會變成彩色 emoji。
 */
const ALLOWED = new Set(['©', '™', '®'])
const EMOJI = /[\p{Extended_Pictographic}️]/gu

describe('畫面上不用 emoji', () => {
  it('有掃到東西（清單不能是空的）', () => {
    expect(SOURCES.length).toBeGreaterThan(40)
    expect(SOURCES).toContain('src/layouts/DefaultLayout.vue')
    expect(SOURCES).toContain('src/content/guide-bodies.ts')
  })

  it.each(SOURCES)('%s 沒有 emoji', (file) => {
    const hits: string[] = []
    readFileSync(join(root, file), 'utf8').split('\n').forEach((line, i) => {
      const found = [...line.matchAll(EMOJI)].map((m) => m[0]).filter((c) => !ALLOWED.has(c))
      if (found.length) hits.push(`${i + 1}: ${found.join(' ')}`)
    })
    expect(hits, `${file} 有 emoji，請改用 i-lucide-* 圖示`).toEqual([])
  })

  it('⌘ 只出現在 <kbd> 裡', () => {
    for (const file of SOURCES.filter((f) => f.endsWith('.vue'))) {
      const code = readFileSync(join(root, file), 'utf8').replace(/<!--[\s\S]*?-->/g, '')
      const bare = code.replace(/<kbd>⌘<\/kbd>/g, '').split('\n').filter((l) => l.includes('⌘') && !/^\s*(\/\/|\*)/.test(l))
      expect(bare, file).toEqual([])
    }
  })
})

describe('圖示都是裝飾，報讀器不念', () => {
  it.each(SOURCES.filter((f) => f.endsWith('.vue')))('%s 的每個圖示都有 aria-hidden="true"', (file) => {
    const code = readFileSync(join(root, file), 'utf8')
    // 靜態的 class="i-lucide-…"，以及動態綁定圖示的 :class（類型圖示、複製與已複製）
    const tags = [...code.matchAll(/<[a-zA-Z][^>]*?(?:\bi-lucide-|:class="[^"]*(?:\.icon\b|i-lucide-))[^>]*>/g)].map((m) => m[0])
    for (const tag of tags) expect(tag, `${file}：${tag}`).toContain('aria-hidden="true"')
  })
})

describe('圖示在建置時打包，不向第三方取圖', () => {
  const uno = readFileSync(join(root, 'uno.config.ts'), 'utf8').replace(/\/\/.*$/gm, '')
  it('presetIcons 不設 cdn、不開 autoInstall', () => {
    expect(uno).toMatch(/presetIcons\(/)
    expect(uno).not.toMatch(/\bcdn\s*:/)
    expect(uno).not.toMatch(/autoInstall\s*:\s*true/)
  })

  it('Lucide 圖示集是本機相依，授權寫在 NOTICE 與關於頁', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    expect(pkg.devDependencies['@iconify-json/lucide']).toBeTruthy()
    const notice = readFileSync(join(root, 'NOTICE.md'), 'utf8')
    expect(notice).toContain('Lucide')
    expect(notice).toContain('ISC')
    expect(readFileSync(join(root, 'src/pages/AboutPage.vue'), 'utf8')).toContain('Lucide')
  })
})
