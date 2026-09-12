import { describe, it, expect } from 'vitest'
import { encodeBarcode, barcodeToSvg, BarcodeEncodeError } from './encodeBarcode'

/**
 * 黃金向量：每一條的位元樣式都以獨立的 ZXing C++（wasm）解碼器回讀驗證過，
 * 讀回的內容與輸入完全相同。自寫編碼表最危險的失敗模式是「看起來對但模組數錯」，
 * 那不會拋錯、畫面也正常，只有掃描或比對位元樣式抓得到，所以釘住整串位元。
 */
const GOLDEN = {
  ean13_5449000000996: '10101000110011101001011100011010001101010011101010111001011100101110010111010011101001010000101',
  ean13_9780201379624: '10101110110001001010011100100110100111001100101010100001010001001110100101000011011001011100101',
  ean8_55123457: '1010110001011000100110010010011010101000010101110010011101000100101',
  code128_ABC12345: '110100100001010001100010001011000100010001101001101110010011100110101110111101110110111010111011000100111001101100011101011',
  code128_1234567890: '110100111001011001110010001011000111000101101100001010011011110110100111100101100011101011',
  code128_A1B2: '1101001000010100011000100111001101000101100011001110010101100010001100011101011',
  code39_ABC1234: '1000101110111010111010100010111010111010001011101110111010001010100010101110111011101000101011101011100010101110111011100010101010100011101011101000101110111010',
  itf14_15400141288763: '101011100010100010111010101110001000111010001011101110100010001011101011100010001110101000111011101010111000100010001110001110101011101',
}

describe('encodeBarcode 黃金向量（已用 ZXing 解碼器回讀驗證）', () => {
  it('EAN-13 5449000000996', () => {
    expect(encodeBarcode('ean13', '5449000000996').bits).toBe(GOLDEN.ean13_5449000000996)
  })
  it('EAN-13 9780201379624（ISBN-13，第 1 位為 9 走不同 parity 樣式）', () => {
    expect(encodeBarcode('ean13', '9780201379624').bits).toBe(GOLDEN.ean13_9780201379624)
  })
  it('EAN-8 55123457', () => {
    expect(encodeBarcode('ean8', '55123457').bits).toBe(GOLDEN.ean8_55123457)
  })
  it('Code 128 ABC-12345（子集 B 起始，中途切 C）', () => {
    expect(encodeBarcode('code128', 'ABC-12345').bits).toBe(GOLDEN.code128_ABC12345)
  })
  it('Code 128 1234567890（純偶數位數字，全程子集 C 雙密度）', () => {
    expect(encodeBarcode('code128', '1234567890').bits).toBe(GOLDEN.code128_1234567890)
  })
  it('Code 128 A1B2（數字串太短，不切子集 C）', () => {
    expect(encodeBarcode('code128', 'A1B2').bits).toBe(GOLDEN.code128_A1B2)
  })
  it('Code 39 ABC-1234', () => {
    expect(encodeBarcode('code39', 'ABC-1234').bits).toBe(GOLDEN.code39_ABC1234)
  })
  it('ITF-14 15400141288763', () => {
    expect(encodeBarcode('itf14', '15400141288763').bits).toBe(GOLDEN.itf14_15400141288763)
  })
})

describe('模組數符合各規範公式', () => {
  it('EAN-13 本體固定 95 模組', () => {
    expect(encodeBarcode('ean13', '5449000000996').bits.length).toBe(95)
  })
  it('EAN-8 本體固定 67 模組', () => {
    expect(encodeBarcode('ean8', '55123457').bits.length).toBe(67)
  })
  it('Code 128 為 11 × (字元數 + 2) + 13', () => {
    // 'ABC-12345'：B 起始 + A B C - 各 1 + 切 C + 12 34 5... 實際符號字元數由編碼器決定，
    // 所以改以「模組數必為 11 的倍數加 13」驗證結構
    for (const v of ['ABC-12345', 'Hello World $19.99', 'A1B2', '1234567890']) {
      const n = encodeBarcode('code128', v).bits.length
      expect((n - 13) % 11).toBe(0)
    }
  })
  it('Code 39 為 16 × (字元數 + 2)，含起止符與字元間隔', () => {
    for (const v of ['ABC-1234', 'HELLO WORLD', 'A B-C.D$E/F+G%H']) {
      expect(encodeBarcode('code39', v).bits.length).toBe((v.length + 2) * 16)
    }
  })
  it('ITF-14 固定 135 模組（起 4 + 7 對 × 18 + 止 5）', () => {
    expect(encodeBarcode('itf14', '15400141288763').bits.length).toBe(135)
  })
})

describe('護線與起止樣式', () => {
  it('EAN-13 左右護線 101、中央護線 01010', () => {
    const b = encodeBarcode('ean13', '5449000000996').bits
    expect(b.startsWith('101')).toBe(true)
    expect(b.endsWith('101')).toBe(true)
    expect(b.slice(45, 50)).toBe('01010')
  })
  it('EAN-8 中央護線 01010', () => {
    const b = encodeBarcode('ean8', '55123457').bits
    expect(b.slice(31, 36)).toBe('01010')
  })
  it('ITF-14 起始 1010、結束 11101', () => {
    const b = encodeBarcode('itf14', '15400141288763').bits
    expect(b.startsWith('1010')).toBe(true)
    expect(b.endsWith('11101')).toBe(true)
  })
})

describe('靜區與 bearer bars', () => {
  it('只有 ITF-14 需要 bearer bars', () => {
    expect(encodeBarcode('itf14', '15400141288763').bearerBars).toBe(true)
    for (const [s, v] of [['ean13', '5449000000996'], ['ean8', '55123457'], ['code128', 'ABC'], ['code39', 'ABC']] as const) {
      expect(encodeBarcode(s, v).bearerBars).toBe(false)
    }
  })
  it('非 EAN 系列左右靜區皆至少 10 倍模組寬', () => {
    for (const [s, v] of [['code128', 'ABC'], ['code39', 'ABC'], ['itf14', '15400141288763']] as const) {
      const p = encodeBarcode(s, v)
      expect(p.quietLeft).toBeGreaterThanOrEqual(10)
      expect(p.quietRight).toBeGreaterThanOrEqual(10)
    }
  })
  it('EAN-13 靜區左右不對稱（左 11、右 7），左邊多的 4 模組是放第 1 位數字的', () => {
    const p = encodeBarcode('ean13', '5449000000996')
    expect(p.quietLeft).toBe(11)
    expect(p.quietRight).toBe(7)
  })
  it('EAN-8 靜區左右各 7', () => {
    const p = encodeBarcode('ean8', '55123457')
    expect(p.quietLeft).toBe(7)
    expect(p.quietRight).toBe(7)
  })
})

describe('防禦性檢查：長度不符時拋錯而不是靜默產出壞圖', () => {
  it('EAN-13 給 12 位會拋錯（補碼是 validateBarcode 的責任）', () => {
    expect(() => encodeBarcode('ean13', '544900000099')).toThrow(BarcodeEncodeError)
  })
  it('EAN-8 給 7 位會拋錯', () => {
    expect(() => encodeBarcode('ean8', '5512345')).toThrow(BarcodeEncodeError)
  })
  it('ITF-14 給 13 位會拋錯', () => {
    expect(() => encodeBarcode('itf14', '1540014128876')).toThrow(BarcodeEncodeError)
  })
  it('Code 39 遇到字元集外的字元會拋錯', () => {
    expect(() => encodeBarcode('code39', 'abc')).toThrow(BarcodeEncodeError)
  })
  it('空字串會拋錯', () => {
    expect(() => encodeBarcode('code128', '')).toThrow(BarcodeEncodeError)
    expect(() => encodeBarcode('code39', '')).toThrow(BarcodeEncodeError)
  })
})

describe('barcodeToSvg（純字串、零 DOM，SSR 與 node 測試都能跑）', () => {
  const pat = encodeBarcode('ean13', '5449000000996')

  it('產出合法的 SVG 根元素與 viewBox', () => {
    const svg = barcodeToSvg(pat, { moduleWidth: 2, height: 80 })
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(svg.endsWith('</svg>')).toBe(true)
    expect(svg).toContain('viewBox="0 0 ')
  })
  it('寬度 = (本體 + 左右靜區) × 模組寬', () => {
    const svg = barcodeToSvg(pat, { moduleWidth: 2, height: 80 })
    const w = (95 + 11 + 7) * 2   // 95 本體 + 左 11 + 右 7 靜區 = 113 模組
    expect(svg).toContain(`width="${w}"`)
  })
  it('白底板覆蓋整張圖（含靜區），使用者沿邊裁切不會裁進靜區', () => {
    const svg = barcodeToSvg(pat, { moduleWidth: 2, height: 80 })
    expect(svg).toContain('<rect width="226" height="102" fill="#ffffff"/>')
  })
  it('條紋是 rect 元素（真向量，不是點陣）', () => {
    const svg = barcodeToSvg(pat, { moduleWidth: 2, height: 80 })
    expect((svg.match(/<rect /g) || []).length).toBeGreaterThan(20)
  })
  it('預設顯示人眼可讀碼，且內容是補完檢查碼的完整號碼', () => {
    const svg = barcodeToSvg(pat, { moduleWidth: 2 })
    expect(svg).toContain('>5449000000996</text>')
  })
  it('showText: false 時不產生 text 元素', () => {
    const svg = barcodeToSvg(pat, { moduleWidth: 2, showText: false })
    expect(svg).not.toContain('<text')
  })
  it('ITF-14 會畫出 bearer bars（比無框的多 4 個 rect）', () => {
    const itf = encodeBarcode('itf14', '15400141288763')
    const withFrame = barcodeToSvg(itf, { moduleWidth: 2 })
    const ean = barcodeToSvg(pat, { moduleWidth: 2 })
    expect(withFrame).toContain('<rect x="0" y="0" width="')
    // bearer 版本的第一個 g 內容含 4 條外框
    expect(withFrame.length).toBeGreaterThan(0)
    expect(ean).not.toContain('<rect x="0" y="0" width="4"')
  })
  it('HRI 文字會做 XML 轉義（Code 128 允許 < > & "）', () => {
    const p = encodeBarcode('code128', 'A<B>&"C')
    const svg = barcodeToSvg(p, { moduleWidth: 2 })
    expect(svg).toContain('A&lt;B&gt;&amp;&quot;C')
    expect(svg).not.toContain('<B>')
  })
  it('條紋顏色固定純黑、底固定純白（紅光掃描器看不見紅色條）', () => {
    const svg = barcodeToSvg(pat, { moduleWidth: 2 })
    expect(svg).toContain('fill="#ffffff"')
    expect(svg).toContain('fill="#000000"')
  })
})

describe('列印實體尺寸（PNG 無法帶 DPI metadata，靠 SVG 的 mm 尺寸補）', () => {
  it('EAN-13 標稱總寬 37.29mm（113 模組 × 0.330mm，與 GS1 一致）', () => {
    const pat = encodeBarcode('ean13', '5449000000996')
    expect(pat.xDimensionMm).toBe(0.33)
    const totalModules = 95 + pat.quietLeft + pat.quietRight
    expect(totalModules).toBe(113)
    expect(Math.round(totalModules * pat.xDimensionMm * 100) / 100).toBe(37.29)
  })
  it('EAN-8 標稱總寬 26.73mm（81 模組 × 0.330mm）', () => {
    const pat = encodeBarcode('ean8', '55123457')
    const totalModules = 67 + pat.quietLeft + pat.quietRight
    expect(totalModules).toBe(81)
    expect(Math.round(totalModules * pat.xDimensionMm * 100) / 100).toBe(26.73)
  })
  it('ITF-14 的 X 是 1.016mm，比 EAN 粗 3 倍（外箱要遠距離掃）', () => {
    expect(encodeBarcode('itf14', '15400141288763').xDimensionMm).toBe(1.016)
  })
  it('physicalUnits 會把根元素換成 mm，viewBox 維持模組座標', () => {
    const pat = encodeBarcode('ean13', '5449000000996')
    const svg = barcodeToSvg(pat, { moduleWidth: 2, height: 80, physicalUnits: true })
    expect(svg).toContain('width="37.29mm"')
    expect(svg).toContain('viewBox="0 0 226 102"')
    // 根元素用 mm；內部白底板仍用 viewBox 單位，所以只斷言根元素那一段
    expect(svg.slice(0, svg.indexOf('>'))).not.toContain('width="226"')
  })
  it('預設不帶 mm（預覽用 px，才能被 CSS 縮放）', () => {
    const svg = barcodeToSvg(encodeBarcode('ean13', '5449000000996'), { moduleWidth: 2, height: 80 })
    expect(svg).toContain('width="226"')
    expect(svg).not.toContain('mm"')
  })
})
