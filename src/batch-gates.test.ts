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
  'src/composables/useBatchLabels.ts',
  'src/pure/raster.ts',
  'src/utils/batch-export.ts',
  'src/utils/batch-analytics.ts',
  'src/utils/batch-label-offset.ts',
]
/** 唯一可以碰瀏覽器儲存空間的批次檔案：「記住這台印表機的位移」只存兩個數字 */
const OFFSET_STORE = 'src/utils/batch-label-offset.ts'
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
      // 記住位移的那一個檔案可以用 localStorage（下面另外驗它只存兩個數字），其他出口一樣不行
      if (file === OFFSET_STORE && label === 'localStorage') continue
      expect(pattern.test(source), `${file} 不該出現 ${label}`).toBe(false)
    }
  })

  it('記住位移只存 {x, y} 兩個數字，不碰清單、標籤上的字或型號', () => {
    const touching = BATCH_SOURCES.filter(f => /localStorage|sessionStorage|indexedDB/i.test(readCode(f)))
    expect(touching).toEqual([OFFSET_STORE])
    const source = readCode(OFFSET_STORE)
    // 寫進去的只有 JSON.stringify(value)，value 是 { x: clampOffset(x), y: clampOffset(y) }
    expect(source.match(/setItem\(/g)).toHaveLength(1)
    expect(source).toContain('setItem(OFFSET_STORAGE_KEY, JSON.stringify(value))')
    expect(source).toMatch(/const value: PrinterOffset = \{ x: clampOffset\(x\), y: clampOffset\(y\) \}/)
    // 只 import 位移的數字整理，不 import 清單、表格、字或型號
    const imports = [...source.matchAll(/from '([^']+)'/g)].map(m => m[1])
    expect(imports).toEqual(['@/pure/batch/labelLayout'])
    // 用到它的只有標籤的狀態
    const users = BATCH_SOURCES.filter(f => f !== OFFSET_STORE && /batch-label-offset/.test(readCode(f)))
    expect(users).toEqual(['src/composables/useBatchLabels.ts'])
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

describe('印成 A4 標籤紙', () => {
  const LABEL_COMPONENTS = walk('src/components/batch').filter(f => /\/(Label|Calibration)[A-Za-z]*\.vue$/.test(f))

  it('有掃到標籤紙的元件', () => {
    expect(LABEL_COMPONENTS).toEqual(expect.arrayContaining([
      'src/components/batch/LabelPrint.vue', 'src/components/batch/LabelSheets.vue', 'src/components/batch/CalibrationRuler.vue',
    ]))
  })

  it('元件不寫毫米字面值：CSS 的 12mm、mm(12) 這種一律從 paper.ts 拿', () => {
    for (const file of LABEL_COMPONENTS) {
      const source = readCode(file)
      expect(source.match(/\b\d+(?:\.\d+)?mm\b/g), `${file} 寫了毫米字面值`).toBeNull()
      expect(source.match(/\bmm\(\s*-?\d/g), `${file} 把數字直接丟進 mm()`).toBeNull()
    }
  })

  it('列印規則：@page 不寫死在 CSS（只在列印區顯示時加進 <head>），縮放只在 @media screen，列印時只印列印區', () => {
    const sheets = readCode('src/components/batch/LabelSheets.vue')
    const css = sheets.slice(sheets.indexOf('<style>'))
    expect(css).not.toMatch(/@page/)
    expect(sheets).toMatch(/textContent = PAGE_RULE/)
    expect(read('src/pure/batch/paper.ts')).toContain("export const PAGE_RULE = '@page { size: A4; margin: 0; }'")
    const screen = css.slice(css.indexOf('@media screen'), css.indexOf('@media print'))
    expect(screen).toMatch(/zoom: var\(--label-zoom/)
    expect(css.replace(screen, '')).not.toMatch(/zoom: var/)
    expect(css).not.toMatch(/transform:\s*scale/)
    const print = css.slice(css.indexOf('@media print'))
    expect(print).toContain('body:has(.label-print-area) :not(:has(.label-print-area)):not(.label-print-area):not(.label-print-area *)')
    expect(print).toMatch(/\.label-sheet \{[^}]*break-after: page/)
  })

  it('不產生 PDF：沒有 PDF 或截圖轉檔的套件，批次的檔案也沒有引用', () => {
    const pkg = JSON.parse(read('package.json'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter(d => /pdf|html2canvas|dom-to-image|html-to-image|canvg/i.test(d))).toEqual([])
    for (const file of BATCH_SOURCES) expect(readCode(file), file).not.toMatch(/jspdf|pdf-lib|pdfmake|html2canvas|toDataURL|\.pdf['"]/i)
  })

  it('碼是向量 SVG：標籤上的碼用 <svg><path>，不用 <img>、<canvas>', () => {
    const sheets = readCode('src/components/batch/LabelSheets.vue')
    expect(sheets).toMatch(/<svg[\s\S]*?class="label-code"[\s\S]*?<path fill="#000" :d="cell\.code\.d" \/>/)
    expect(sheets).not.toMatch(/<img|<canvas|getContext/)
  })

  it('印標籤時送的 GA 輸出方式是 label，型號與位移不進 GA', () => {
    const source = readCode('src/composables/useBatchLabels.ts')
    expect([...source.matchAll(/trackBatchDownload\(([^)]*)\)/g)].map(m => m[1])).toEqual(["items.value.length, src.symbology.value, 'label'"])
  })
})

describe('隱私權頁與站內互鏈', () => {
  it('隱私權頁說明批次的清單只在記憶體、GA 只記級距；記住位移只存兩個數字', () => {
    const privacy = read('src/pages/PrivacyPage.vue')
    expect(privacy).toContain('to="/batch/"')
    expect(privacy).toMatch(/IndexedDB/)
    expect(privacy).toMatch(/級距/)
    expect(privacy).toMatch(/不包含清單內容/)
    expect(privacy).toMatch(/記住這台印表機的位移/)
    expect(privacy).toMatch(/兩個數字/)
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
