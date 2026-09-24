// @vitest-environment node
/**
 * /scan/ 的原始碼護欄。這些性質在單元測試裡看不出來，壞掉也不會有錯誤訊息：
 * 只會安靜地把使用者的圖片內容送到不該去的地方，或是把解碼器拖進首頁的 chunk。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { guideBodies } from './content/guide-bodies'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

/**
 * 只留程式碼：註解裡本來就會提到「預設會去哪個 CDN」「為什麼不用 localStorage」，
 * 那些說明正是我們希望留著的東西，不該讓護欄把它們當成違規。
 * 刻意不處理行末註解，避免把字串裡的 `://` 也切掉。
 */
const codeOf = (source: string) => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .split('\n')
  .filter(line => !/^\s*(\/\/|\*)/.test(line))
  .join('\n')

const readCode = (rel: string) => codeOf(read(rel))

function walk(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap(name => {
    const rel = `${dir}/${name}`
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel]
  })
}

/** 掃描功能的所有 production 檔案（不含測試）。 */
const SCAN_SOURCES = [
  'src/pages/ScanPage.vue',
  'src/components/scan/ScanTool.vue',
  'src/components/scan/ScanResultView.vue',
  'src/composables/useImageScanner.ts',
  'src/composables/useCopyText.ts',
  'src/utils/zxing-reader.ts',
  'src/utils/image-to-imagedata.ts',
  'src/utils/scan-handoff.ts',
  'src/pure/scanFormats.ts',
  'src/pure/scanResult.ts',
  'src/pure/parseScanPayload.ts',
  'src/pure/imageInput.ts',
]

const allSrcFiles = walk('src').filter(f => /\.(ts|vue)$/.test(f) && !f.includes('.test.'))

describe('結果一律是文字節點', () => {
  it('掃描相關的檔案都沒有 v-html 或 innerHTML', () => {
    for (const file of SCAN_SOURCES) {
      const source = readCode(file)
      expect(source, file).not.toMatch(/v-html/)
      expect(source, file).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write/)
    }
  })
})

describe('圖片與解碼內容不得離開瀏覽器記憶體', () => {
  const FORBIDDEN: [RegExp, string][] = [
    [/localStorage/, 'localStorage'],
    [/sessionStorage/, 'sessionStorage'],
    [/indexedDB/i, 'IndexedDB'],
    [/caches\./, 'Cache Storage'],
    [/document\.cookie/, 'cookie'],
    [/\bgtag\b|dataLayer/, 'GA / dataLayer'],
    [/sendBeacon/, 'sendBeacon'],
    [/XMLHttpRequest|new WebSocket|EventSource/, '其他網路 API'],
    [/history\.(pushState|replaceState)/, 'history state'],
    [/location\.(hash|search)\s*=/, '寫入網址'],
  ]

  it('掃描相關的檔案沒有任何儲存、分析或網址寫入的出口', () => {
    for (const file of SCAN_SOURCES) {
      const source = readCode(file)
      for (const [pattern, label] of FORBIDDEN) {
        expect(pattern.test(source), `${file} 不該出現 ${label}`).toBe(false)
      }
    }
  })

  it('掃描流程本身不發任何請求（只有動態 import 與 blob: URL）', () => {
    for (const file of SCAN_SOURCES) {
      const source = readCode(file)
      expect(source, file).not.toMatch(/\bfetch\s*\(/)
      expect(source, file).not.toMatch(/axios|\baxios\b/)
    }
  })
})

describe('解碼器只從本站載入', () => {
  it('src 內沒有任何第三方 CDN 網址', () => {
    for (const file of allSrcFiles) {
      const source = readCode(file)
      expect(source, file).not.toMatch(/jsdelivr|unpkg\.com|cdnjs|fastly/)
    }
  })

  it('只用 reader 進入點，不碰 full／writer（那會多帶編碼器進來）', () => {
    for (const file of allSrcFiles) {
      const source = readCode(file)
      expect(source, file).not.toMatch(/from ['"]zxing-wasm['"]/)
      expect(source, file).not.toMatch(/zxing-wasm\/(full|writer)/)
    }
  })

  it('reader 的 JS 只透過動態 import 取得，不會被靜態拉進 entry chunk', () => {
    const readerImports = allSrcFiles
      .map(f => [f, readCode(f)] as const)
      .filter(([, s]) => s.includes('zxing-wasm/reader'))
      .map(([f]) => f)
    expect(readerImports).toEqual(['src/utils/zxing-reader.ts'])

    const source = readCode('src/utils/zxing-reader.ts')
    // 型別是編譯期就消失的，執行期的取得一律用 await import()
    expect(source).toMatch(/await import\(['"]zxing-wasm\/reader['"]\)|import\(['"]zxing-wasm\/reader['"]\)/)
    expect(source).not.toMatch(/^import \{[^}]*\} from ['"]zxing-wasm\/reader['"]/m)
  })

  it('WASM 由 Vite 收成本站資產（?url），不是寫死的網址', () => {
    const source = read('src/utils/zxing-reader.ts')
    expect(source).toMatch(/import wasmUrl from ['"]zxing-wasm\/reader\/zxing_reader\.wasm\?url['"]/)
  })

  it('package.json 把 zxing-wasm 精確鎖版，不用範圍符號', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.dependencies['zxing-wasm']).toBe('3.1.4')
  })
})

describe('站內入口與互鏈', () => {
  it('footer 有掃描工具的連結', () => {
    expect(read('src/layouts/DefaultLayout.vue')).toContain('to="/scan/"')
  })

  it('首頁有掃描工具的連結', () => {
    expect(read('src/pages/HomePage.vue')).toContain('to="/scan/"')
  })

  it('既有的「如何掃描」教學指得到新工具', () => {
    expect(guideBodies['scan-qr-code']).toContain('href="/scan/"')
  })

  it('教學仍然以手機操作為主，沒有被改成圖片解碼', () => {
    const body = guideBodies['scan-qr-code']
    expect(body).toContain('iPhone 怎麼掃 QR Code')
    expect(body).toContain('Android 怎麼掃 QR Code')
  })

  it('工具頁反向指回教學，兩邊定位不同不互相競食', () => {
    const page = read('src/pages/ScanPage.vue')
    expect(page).toContain('/guide/scan-qr-code/')
    // 工具頁鎖「圖片／截圖／解碼」，教學鎖「手機怎麼掃」
    expect(page).toMatch(/截圖/)
    expect(page).toMatch(/圖片/)
  })
})

describe('隱私權與第三方授權', () => {
  it('隱私權頁說明圖片解碼在本機完成', () => {
    const privacy = read('src/pages/PrivacyPage.vue')
    expect(privacy).toMatch(/圖片/)
    expect(privacy).toMatch(/不會上傳|不傳雲端/)
    expect(privacy).toMatch(/WebAssembly|WASM/)
  })

  it('隱私權頁與 FAQ 如實說明流量統計：列出 Cloudflare Web Analytics，GA 不寫成匿名', () => {
    // Cloudflare 傳送每一頁時都會自動加入 Web Analytics 的統計程式；
    // GA 用 _ga 開頭的 Cookie 區分造訪，不是匿名統計。
    const privacy = read('src/pages/PrivacyPage.vue')
    expect(privacy).toContain('Cloudflare Web Analytics')
    expect(privacy).toContain('_ga')
    expect(privacy).not.toMatch(/匿名/)
    const faq = read('src/pages/FaqPage.vue')
    expect(faq).toContain('Cloudflare Web Analytics')
    expect(faq).not.toMatch(/匿名/)
  })

  it('repo 根目錄有 NOTICE，列出三份上游授權', () => {
    const notice = read('NOTICE.md')
    expect(notice).toContain('zxing-wasm')
    expect(notice).toContain('MIT')
    expect(notice).toContain('zxing-cpp')
    expect(notice).toContain('Apache License, Version 2.0')
    expect(notice).toContain('ZXingWasm.cpp')
    expect(notice).toContain('zint')
    expect(notice).toContain('BSD-3-Clause')
  })

  it('NOTICE 記的版本與實際安裝的一致', () => {
    const notice = read('NOTICE.md')
    const pkg = JSON.parse(read('node_modules/zxing-wasm/package.json'))
    expect(notice).toContain(pkg.version)
    expect(pkg.license).toBe('MIT')
  })

  it('站上看得到第三方授權說明（關於頁）', () => {
    const about = read('src/pages/AboutPage.vue')
    expect(about).toContain('zxing-wasm')
    expect(about).toContain('Apache')
    expect(about).toContain('BSD-3-Clause')
  })
})
