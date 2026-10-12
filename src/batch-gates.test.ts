// @vitest-environment node
/**
 * /batch/ 的原始碼護欄。使用者貼上的清單常是財產清冊、會員編號、表單網址，壞掉也不會有錯誤訊息：
 * 只會安靜地把清單寫進網址或儲存空間、送進 GA，或把編碼器拖進每一頁都要下載的 entry chunk。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

/** 只留程式碼：註解裡寫「為什麼不用 localStorage」正是要留著的說明 */
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
const production = (f: string) => /\.(ts|vue)$/.test(f) && !f.includes('.test.')

/** 批次功能的所有 production 檔案（不含測試）；資料夾裡新增的檔案自動納入 */
const BATCH_SOURCES = [
  'src/pages/BatchPage.vue',
  ...walk('src/components/batch').filter(production),
  ...walk('src/pure/batch').filter(production),
  'src/composables/useBatch.ts',
  'src/pure/raster.ts',
  'src/utils/batch-export.ts',
  'src/utils/batch-analytics.ts',
]
const allSrcFiles = walk('src').filter(production)

describe('有掃到東西', () => {
  it('清單包含頁面、元件、純函式、匯出與統計', () => {
    for (const f of ['src/components/batch/BatchTool.vue', 'src/pure/batch/zip.ts', 'src/pure/batch/table.ts', 'src/pure/batch/qrMatrix.ts']) {
      expect(BATCH_SOURCES).toContain(f)
    }
    expect(BATCH_SOURCES.length).toBeGreaterThanOrEqual(15)
  })
})

describe('貼上的內容一律是文字節點', () => {
  it('批次的檔案都沒有 v-html 或 innerHTML', () => {
    for (const file of BATCH_SOURCES) {
      const source = readCode(file)
      expect(source, file).not.toMatch(/v-html/)
      expect(source, file).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write/)
    }
  })
})

describe('清單與產物不得離開瀏覽器記憶體', () => {
  const FORBIDDEN: [RegExp, string][] = [
    [/localStorage/, 'localStorage'],
    [/sessionStorage/, 'sessionStorage'],
    [/indexedDB/i, 'IndexedDB'],
    [/caches\./, 'Cache Storage'],
    [/document\.cookie/, 'cookie'],
    [/sendBeacon/, 'sendBeacon'],
    [/XMLHttpRequest|new WebSocket|EventSource/, '其他網路 API'],
    [/\bfetch\s*\(/, 'fetch'],
    [/history\.(pushState|replaceState)/, 'history state'],
    [/location\.(hash|search|href)\s*=/, '寫入網址'],
    [/useRoute\b|route\.query|router\.(push|replace)/, '網址參數或換頁帶內容'],
  ]

  it.each(BATCH_SOURCES)('%s 沒有任何儲存、網路或網址寫入的出口', (file) => {
    const source = readCode(file)
    for (const [pattern, label] of FORBIDDEN) {
      expect(pattern.test(source), `${file} 不該出現 ${label}`).toBe(false)
    }
  })

  it('GA 只在 batch-analytics.ts，而且只送三個字面值組成的事件', () => {
    const touching = BATCH_SOURCES.filter(f => /\bgtag\b|dataLayer/.test(readCode(f)))
    expect(touching).toEqual(['src/utils/batch-analytics.ts'])
    const source = readCode('src/utils/batch-analytics.ts')
    const calls = [...source.matchAll(/gtag\(([^)]*\))?[^)]*\)/g)].map(m => m[0])
    expect(calls).toEqual(["gtag('event', 'batch_download', batchDownloadEvent(count, symbology, output))"])
    // 事件的三個欄位型別都是字面值聯集，不是任意字串
    expect(source).toMatch(/count_range: BatchCountRange/)
    expect(source).toMatch(/symbology: BatchSymbology/)
    expect(source).toMatch(/output: BatchOutput/)
  })
})

describe('編碼器與批次邏輯不進 entry chunk', () => {
  it('qrcode-generator 只在 qrMatrix.ts 裡 import', () => {
    const importing = allSrcFiles.filter(f => /from ['"]qrcode-generator['"]|import\(['"]qrcode-generator['"]\)/.test(readCode(f)))
    expect(importing).toEqual(['src/pure/batch/qrMatrix.ts'])
  })

  it('批次的模組只被批次的檔案 import；路由用動態 import 載入頁面', () => {
    const batchModule = /['"]@\/(?:pure\/batch\/|components\/batch\/|composables\/useBatch|utils\/batch-|pages\/BatchPage)/
    const outsiders = allSrcFiles.filter(f => !BATCH_SOURCES.includes(f) && batchModule.test(readCode(f)))
    expect(outsiders).toEqual(['src/router.ts'])
    expect(readCode('src/router.ts')).toMatch(/component: \(\) => import\('@\/pages\/BatchPage\.vue'\)/)
    expect(readCode('src/router.ts')).not.toMatch(/^import .*BatchPage/m)
  })

  it('package.json 把 qrcode-generator 精確鎖版在 dependencies（跟 qr-code-styling 帶的同一版）', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.dependencies['qrcode-generator']).toBe('1.5.2')
    expect(pkg.devDependencies['qrcode-generator']).toBeUndefined()
    const installed = JSON.parse(read('node_modules/qrcode-generator/package.json'))
    expect(installed.version).toBe('1.5.2')
  })
})

describe('隱私權頁與站內互鏈', () => {
  it('隱私權頁說明批次的清單只在記憶體、GA 只記級距', () => {
    const privacy = read('src/pages/PrivacyPage.vue')
    expect(privacy).toContain('to="/batch/"')
    expect(privacy).toMatch(/IndexedDB/)
    expect(privacy).toMatch(/級距/)
    expect(privacy).toMatch(/不包含清單內容/)
  })

  it('首頁、條碼產生器、頁尾都連到批次頁，批次頁連回單張的兩個產生器', () => {
    expect(read('src/pages/HomePage.vue')).toContain('to="/batch/"')
    expect(read('src/pages/BarcodePage.vue')).toContain('to="/batch/"')
    expect(read('src/layouts/DefaultLayout.vue')).toContain('to="/batch/"')
    const page = read('src/pages/BatchPage.vue')
    expect(page).toContain('to="/barcode/"')
    expect(page).toContain('to="/"')
  })
})
