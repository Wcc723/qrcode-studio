/**
 * 條碼產生器（/barcode/、/en/barcode/）的文案。繁中是原本寫在元件與 symbologies.ts 裡的字串，一個字都沒改。
 * 條碼的檢查與錯誤訊息在 src/pure/validateBarcode.ts（批次也用同一份）。
 */
import type { Locale } from '@/i18n/locale'
import type { BarcodeSymbology } from '@/pure/validateBarcode'
import { CODE128_MAX_LENGTH } from '@/pure/validateBarcode'

/** 每種碼制的用途（收在「?」裡）與填寫規則（輸入框下方一律看得到） */
export const symbologyText: Record<Locale, Record<BarcodeSymbology, { about: string; rule: string }>> = {
  'zh-TW': {
    code128: { about: '物流、倉儲與內部管理最通用。', rule: '可放英文、數字與鍵盤上的半形符號，最多 80 個字元。' },
    ean13: { about: '零售商品條碼。', rule: '最後一位是檢查碼，由前面 12 位算出來，用來抓打錯的號碼。輸入 12 位會自動補上，輸入 13 位會驗證。' },
    ean8: { about: '小包裝零售商品。', rule: '最後一位是檢查碼，由前面 7 位算出來，用來抓打錯的號碼。輸入 7 位會自動補上，輸入 8 位會驗證。' },
    code39: { about: '老設備相容性最好，同樣內容會比 Code 128 寬約三成。', rule: '只收大寫英文、數字與 - . $ / + % 和半形空白。' },
    itf14: { about: '外箱與瓦楞紙箱用，會自動加上規定要有的外框粗線（bearer bar）。', rule: '最後一位是檢查碼，由前面 13 位算出來，用來抓打錯的號碼。輸入 13 位會自動補上，輸入 14 位會驗證。' },
  },
  en: {
    code128: { about: 'The everyday choice for shipping, warehouses, inventory and asset tags.', rule: `Letters, numbers and keyboard symbols, up to ${CODE128_MAX_LENGTH} characters.` },
    ean13: { about: 'Retail product barcodes used worldwide.', rule: 'The last digit is a check digit worked out from the first 12, so a typo gets caught. Type 12 digits and it is added for you, or type all 13 and it is checked.' },
    ean8: { about: 'Small retail packs with little room for a barcode.', rule: 'The last digit is a check digit worked out from the first 7. Type 7 digits and it is added for you, or type all 8 and it is checked.' },
    code39: { about: 'Works with the oldest scanners, but about 30% wider than Code 128 for the same content.', rule: 'Capital letters, numbers, - . $ / + % and spaces only.' },
    itf14: { about: 'Outer cases and shipping cartons. The thick frame (bearer bar) the standard calls for is added automatically.', rule: 'The last digit is a check digit worked out from the first 13. Type 13 digits and it is added for you, or type all 14 and it is checked.' },
  },
}

/** PNG 清晰度的三個選項（scale 不跟著語言變） */
export const pngPresetLabels: Record<Locale, Record<'web' | 'print' | 'press', string>> = {
  'zh-TW': { web: '網頁用', print: '一般列印', press: '高品質印刷' },
  en: { web: 'Web and screens', print: 'Standard print', press: 'High-quality print' },
}

export interface BarcodeCopy {
  input: string
  preview: string
  typeName: string
  type: string
  typeHelpEnd: string
  value: string
  hint: string
  pngName: string
  png: string
  pngHelp: [string, string]
  pngInfo: (w: number, h: number, dpi: number) => string
  download: string
  previewLabel: (symbology: string, text: string) => string
  printWidth: (mm: number) => string
  narrowest: (mm: number) => string
  appended: (digit: string, full: string) => string
  code39Shift: string
}

/** 1 mil = 千分之一英吋，美國的條碼規格用它寫窄條寬度 */
const mil = (mm: number) => Math.round(mm / 0.0254)
const inch = (mm: number) => Math.round((mm / 25.4) * 100) / 100

export const barcodeCopy: Record<Locale, BarcodeCopy> = {
  'zh-TW': {
    input: '輸入內容',
    preview: '預覽與下載',
    typeName: '條碼類型',
    type: '條碼類型',
    typeHelpEnd: '不確定用哪個就選 Code 128；商品零售結帳用 EAN-13。',
    value: '條碼內容',
    hint: '輸入內容後即時預覽',
    pngName: 'PNG 清晰度',
    png: 'PNG 清晰度',
    pngHelp: [
      'DPI 是每英吋印幾個點，數字越大越細。網頁用、一般列印、高品質印刷分別讓最細的線佔 2、4、8 像素，下面的 DPI 是照「建議列印寬度」印出來時的清晰度。',
      'PNG 檔不會記錄該印多大，拉進 Word 這類軟體隨手縮放，線就會被壓得太細而掃不到；需要精確尺寸時請下載 SVG，它的寬高以毫米標示。',
    ],
    pngInfo: (w, h, dpi) => `PNG ${w} × ${h} 像素，照建議寬度印約 ${dpi} DPI`,
    download: '下載 ',
    previewLabel: (symbology, text) => `${symbology} 條碼，內容 ${text}`,
    printWidth: mm => `建議列印寬度 ${mm} mm`,
    narrowest: mm => `最細的線 ${mm} mm`,
    appended: (digit, full) => `已自動補上檢查碼 ${digit}，完整號碼 ${full}。請對照你手上的號碼確認。`,
    code39Shift: '內容含 $ / + % 這幾個符號，有些掃描器會把它們跟下一個字合在一起讀，讀出來可能跟你輸入的不一樣。要給機器讀取時，請先實際掃一次。',
  },
  en: {
    input: 'Your barcode',
    preview: 'Preview and download',
    typeName: 'barcode types',
    type: 'Barcode type',
    typeHelpEnd: 'Not sure? Pick Code 128. For retail checkout, use EAN-13.',
    value: 'Barcode content',
    hint: 'Your barcode appears here as you type',
    pngName: 'PNG resolution',
    png: 'PNG resolution',
    pngHelp: [
      'DPI is dots per inch: the higher the number, the finer the print. Web, standard print and high-quality print make the narrowest bar 2, 4 and 8 pixels wide, and the DPI below is what you get when you print at the suggested width.',
      'A PNG does not remember how big it should print. Resize it freely in Word or a similar app and the bars can get too thin to scan. When the size has to be exact, download the SVG, which carries its real size.',
    ],
    pngInfo: (w, h, dpi) => `PNG ${w} × ${h} px, about ${dpi} DPI at the suggested width`,
    download: 'Download ',
    previewLabel: (symbology, text) => `${symbology} barcode: ${text}`,
    printWidth: mm => `Suggested print width ${inch(mm)} in (${mm} mm)`,
    narrowest: mm => `Narrowest bar ${mm} mm (${mil(mm)} mil)`,
    appended: (digit, full) => `Check digit ${digit} added. The full number is ${full}. Compare it with the number you were given.`,
    code39Shift: 'This contains $ / + % characters. Some scanners read them together with the next character, so the result may not match what you typed. If a machine will read these, test-scan one first.',
  },
}
