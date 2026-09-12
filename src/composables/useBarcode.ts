import { ref, computed, watch, onBeforeUnmount, type Ref } from 'vue'
import type { BarcodeSymbology } from '@/pure/validateBarcode'
import { validateBarcode } from '@/pure/validateBarcode'
import { encodeBarcode, barcodeToSvg, barcodeGeometry } from '@/pure/encodeBarcode'
import { symbologyById } from '@/config/symbologies'
import { saveBlob } from '@/utils/save-blob'

// Code 39 把 $ / + % 當成 Full ASCII 的 shift 字元：掃描器可能把「$E」讀成
// 控制字元 ENQ、「+G」讀成小寫 g。以獨立的 ZXing 解碼器實測確認過這個行為
// （ZXing 自家編碼器產出的圖也是同樣結果），所以這不是 bug 而是 Code 39 的規範，
// 但使用者一定會踩到，必須先講。
const CODE39_SHIFT_CHARS = /[$/+%]/

export function useBarcode(raw: Ref<string>, sym: Ref<BarcodeSymbology>) {
  const validation = computed(() => validateBarcode(sym.value, raw.value))

  // 空輸入不算錯誤：預覽顯示引導文字，不該一開頁就紅字。
  const error = computed(() => {
    const v = validation.value
    if (v.ok || v.code === 'empty') return null
    return v.error ?? null
  })

  const pattern = computed(() => {
    const v = validation.value
    if (!v.ok || !v.normalized) return null
    try {
      return encodeBarcode(sym.value, v.normalized)
    } catch {
      // 驗證層已經擋掉所有已知的壞輸入；真的走到這裡寧可不顯示也不要顯示壞圖。
      return null
    }
  })

  /** 補碼與 Code 39 shift 字元都要主動告知，不能靜默。 */
  const notice = computed(() => {
    const v = validation.value
    if (!v.ok) return null
    const parts: string[] = []
    if (v.appendedCheckDigit) {
      parts.push(`已自動補上檢查碼 ${v.normalized!.slice(-1)}，完整號碼 ${v.normalized}。請對照你手上的號碼確認。`)
    }
    if (sym.value === 'code39' && CODE39_SHIFT_CHARS.test(v.normalized!)) {
      parts.push('內容含 $ / + % 這幾個字元，部分掃描器會依 Code 39 Full ASCII 規則把它們與下一個字元合併解讀，讀出來的內容可能不同。用於機器讀取時請先實機測試。')
    }
    return parts.length ? parts.join('') : null
  })

  const previewSvg = computed(() => {
    if (!pattern.value) return ''
    return barcodeToSvg(pattern.value, {
      moduleWidth: 2, height: 80, fontSize: 16, responsive: true,
    })
  })

  const printInfo = computed(() => {
    if (!pattern.value) return null
    const g = barcodeGeometry(pattern.value, { moduleWidth: 2, height: 80, fontSize: 16 })
    return { widthMm: g.widthMm, heightMm: g.heightMm, xMm: pattern.value.xDimensionMm }
  })

  /** DPI = 每模組像素數 ÷ X(mm) × 25.4，與符號大小無關。 */
  function pngSize(scale: number) {
    if (!pattern.value) return null
    const g = barcodeGeometry(pattern.value, { moduleWidth: scale, height: scale * 40, fontSize: scale * 8 })
    return { w: g.width, h: g.height, dpi: Math.round((scale / pattern.value.xDimensionMm) * 25.4) }
  }

  function downloadSvg() {
    if (!pattern.value) return
    // 下載檔帶 mm 實體尺寸，置入排版軟體就是標稱尺寸；不帶 responsive 的 inline style。
    const svg = barcodeToSvg(pattern.value, {
      moduleWidth: 2, height: 80, fontSize: 16, physicalUnits: true,
    })
    saveBlob(
      new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svg}`], { type: 'image/svg+xml;charset=utf-8' }),
      'barcode.svg',
    )
  }

  async function downloadPng(scale = 4) {
    if (typeof window === 'undefined' || !pattern.value) return
    // 直接畫矩形而不是把 SVG 轉圖：drawImage 縮放會在條的硬邊緣產生抗鋸齒灰邊，
    // 那正是掃描器判斷邊界時最怕的東西。
    const g = barcodeGeometry(pattern.value, { moduleWidth: scale, height: scale * 40, fontSize: scale * 8 })
    const canvas = document.createElement('canvas')
    canvas.width = g.width
    canvas.height = g.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return          // happy-dom 回傳 null，測試環境安靜退出
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, g.width, g.height)
    ctx.fillStyle = '#000000'
    for (const r of [...g.bearer, ...g.bars]) ctx.fillRect(r.x, r.y, r.w, r.h)
    if (g.text) {
      ctx.font = `${g.text.size}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText(g.text.s, g.text.x, g.text.y)
    }
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(b => res(b), 'image/png'))
    if (blob) saveBlob(blob, 'barcode.png')
  }

  // 切換符號學時保留輸入並重新驗證：使用者常在 EAN-13 與 ITF-14 之間比較同一組
  // 數字，清空很惱人。（QR 那邊的 GeneratorTool 會清空，因為各類型的欄位結構不同。）
  const liveMessage = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  watch([error, notice, sym], () => {
    // 輸入 EAN-13 的過程中前 12 次按鍵都是「位數不足」，不 debounce 的話
    // aria-live 會排隊播報十幾次。
    clearTimeout(timer)
    timer = setTimeout(() => { liveMessage.value = error.value ?? notice.value ?? '' }, 500)
  })
  function flushMessage() {
    clearTimeout(timer)
    liveMessage.value = error.value ?? notice.value ?? ''
  }
  onBeforeUnmount(() => clearTimeout(timer))

  return {
    validation, error, notice, pattern, previewSvg, printInfo, pngSize,
    downloadSvg, downloadPng, liveMessage, flushMessage,
    meta: computed(() => symbologyById[sym.value]),
    canDownload: computed(() => !!pattern.value),
  }
}
