/**
 * 標籤上的碼讀得回來：照標籤的排法（格子、內距、紙邊內縮、字佔掉的高度）算出碼的位置與大小，
 * 用跟畫面同一份 SVG 路徑畫出整格，以一般印表機的 300 dpi 光柵化，再用本站自架的 zxing-wasm 讀回來。
 *
 * 驗的是「照這個尺寸印出來掃得到」：最小的格子（龍德 LD-8101 的 25.4 × 16.9 mm）、全版切割內縮的角落格、
 * 提醒「窄條偏細」的條碼都包含在內。測試不連網：fetch 換成會丟錯的版本，WASM 直接餵 node_modules 那一份。
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { loadZXingReader, READER_OPTIONS } from '@/utils/zxing-reader'
import { toScanFormat } from '../scanFormats'
import { encodeBarcode } from '../encodeBarcode'
import type { BarcodeSymbology } from '../validateBarcode'
import { sheetById } from './labelSheets'
import { cellRect, contentBox } from './labelLayout'
import { estimateMeasure, printFont } from './printFonts'
import { barcodeLabelModules, barcodeLabelSvg, isBlocking, layoutCell, qrLabelModules, qrLabelSvg, type TextStyle } from './labelContent'
import { makeQrMatrix } from './qrMatrix'

const LOCAL_WASM = join(process.cwd(), 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')
const offlineOverrides = { wasmBinary: readFileSync(LOCAL_WASM).buffer }
const realFetch = globalThis.fetch
beforeAll(() => {
  globalThis.fetch = (() => { throw new Error('測試不得發出任何網路請求') }) as typeof fetch
})
afterAll(() => { globalThis.fetch = realFetch })

const style: TextStyle = { family: printFont('jhenghei').stack, firstWeight: 700, weight: 400 }
const PRINTER_DPI = 300

interface Case { sheet: string; cell: number; symbology: 'qr' | BarcodeSymbology; value: string; lines: string[] }

const CASES: Case[] = [
  { sheet: 'herwood-L3464', cell: 4, symbology: 'qr', value: 'https://example.com/asset/TP-2026-0001', lines: ['TP-2026-0001', '筆記型電腦', '總務處'] },
  { sheet: 'herwood-L3464', cell: 4, symbology: 'code128', value: 'TP-2026-0001', lines: ['筆記型電腦', '總務處'] },
  { sheet: 'herwood-L3464', cell: 4, symbology: 'ean13', value: '4710088331236', lines: ['店內商品'] },
  { sheet: 'herwood-C3070', cell: 0, symbology: 'qr', value: 'https://example.com/asset/TP-0001', lines: ['TP-0001', '投影機'] },
  { sheet: 'herwood-C3070', cell: 29, symbology: 'ean13', value: '2000000000015', lines: [] },
  { sheet: 'longder-LD-8101', cell: 8, symbology: 'qr', value: 'https://example.com/a/1', lines: ['A-0001'] },
  { sheet: 'longder-LD-8101', cell: 8, symbology: 'code128', value: 'A001', lines: [] },
  { sheet: 'herwood-L1748', cell: 0, symbology: 'code128', value: 'TP-0001', lines: ['筆記型電腦'] },
  { sheet: 'herwood-L1748', cell: 5, symbology: 'itf14', value: '15400141288763', lines: [] },
  { sheet: 'longder-LD-831', cell: 0, symbology: 'code39', value: 'TP-0001', lines: ['財產標籤', '總務處'] },
]

/** 整格畫成 SVG：白底，碼照排好的位置放進去（跟元件一樣，用 mm 指定寬高、viewBox 以模組為單位） */
function cellSvg(c: Case) {
  const rect = cellRect(sheetById[c.sheet]!, c.cell)
  const { box } = contentBox(rect, true)
  let code
  let parts
  if (c.symbology === 'qr') {
    const m = makeQrMatrix(c.value, 'M')!
    code = { kind: 'qr' as const, modules: qrLabelModules(m) }
    parts = () => qrLabelSvg(m)
  } else {
    const p = encodeBarcode(c.symbology, c.value)
    code = { kind: 'barcode' as const, symbology: c.symbology, modules: barcodeLabelModules(p), hri: c.value }
    parts = (x: number, h: number) => barcodeLabelSvg(p, x, h)
  }
  const layout = layoutCell(box, code, c.lines, style, estimateMeasure)
  expect(isBlocking(layout.issue), JSON.stringify(layout.issue)).toBe(false)
  const r = layout.code!
  const { viewBox, d } = parts(layout.moduleMm, r.h)
  const x = box.x - rect.x + r.x
  const y = box.y - rect.y + r.y
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.w}mm" height="${rect.h}mm" viewBox="0 0 ${rect.w} ${rect.h}">`
    + `<rect width="${rect.w}" height="${rect.h}" fill="#ffffff"/>`
    + `<svg x="${x}" y="${y}" width="${r.w}" height="${r.h}" viewBox="${viewBox}" preserveAspectRatio="none" shape-rendering="crispEdges">`
    + `<path fill="#000000" d="${d}"/></svg></svg>`
  return { svg, layout }
}

async function decode(svg: string) {
  const { data, info } = await sharp(Buffer.from(svg), { density: PRINTER_DPI }).flatten({ background: '#ffffff' }).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true })
  const pixels = new Uint8ClampedArray(new ArrayBuffer(data.length))
  pixels.set(data)
  const zxing = await loadZXingReader(offlineOverrides)
  const results = await zxing.readBarcodes({ data: pixels, width: info.width, height: info.height, colorSpace: 'srgb' } as unknown as ImageData, READER_OPTIONS)
  return results.map(r => ({ format: toScanFormat(r.format, r.text), text: r.text }))
}

describe(`標籤上的碼以 ${PRINTER_DPI} dpi 光柵化後讀得回來`, () => {
  it.each(CASES.map(c => [`${c.sheet} 第 ${c.cell + 1} 格 ${c.symbology} ${c.value}`, c] as [string, Case]))('%s', async (_name, c) => {
    const { svg, layout } = cellSvg(c)
    const got = await decode(svg)
    expect(got, `模組 ${layout.moduleMm} mm`).toHaveLength(1)
    expect(got[0]!.format).toBe(c.symbology === 'qr' ? 'qrcode' : c.symbology)
    expect(got[0]!.text).toBe(c.value)
  }, 30_000)
})
