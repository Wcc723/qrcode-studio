<script setup lang="ts">
/**
 * A4 標籤紙的預覽與列印區：螢幕上是一疊 A4 預覽，列印時頁面上只剩這一區（規則在下面的 @media print）。
 *
 * - 每張紙 210 mm 寬（高度扣掉 PAGE_FIT_GUARD_MM，免得多印一張白紙），格子照型號的絕對位置用 mm 定位，
 *   碼是向量 SVG（viewBox 以模組為單位、寬高寫 mm），字是系統字型。毫米數字一律來自 src/pure/batch/paper.ts。
 * - 掛載時在 <head> 加一段 `@page { size: A4; margin: 0; }`，卸載就拿掉：其他頁、其他輸出方式照一般網頁列印。
 * - 螢幕放不下實際寬度時用 CSS zoom 縮小整區，而且只寫在 @media screen 裡；列印時照 mm 原尺寸，不縮放、不截圖。
 * - 螢幕上只畫前幾張（其他張 display: none），列印時全部印出來；格子的虛線框、略過的格子與頁碼只在螢幕上。
 * - 貼上的內容一律是文字節點，不用 v-html。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { PREVIEW_SHEETS, type BatchLabels } from '@/composables/useBatchLabels'
import type { Rect } from '@/pure/batch/labelLayout'
import type { PlacedLine } from '@/pure/batch/labelContent'
import {
  A4, PAGE_NUMBER_INSET_MM, PAGE_RULE, PX_PER_MM, TEST_INFO_FONT_PT, TEST_INFO_HEIGHT_MM, TEST_INFO_PADDING_MM,
  TEST_INFO_WIDTH_MM, TEST_LINE_MM, TEST_NUMBER_PT, mm, pt, ptToMm, sheetBox,
} from '@/pure/batch/paper'
import { formatCount } from '@/pure/batch/sequence'
import CalibrationRuler from './CalibrationRuler.vue'

const props = defineProps<{ labels: BatchLabels; lineUnit: string }>()
const L = reactive(props.labels)

/* ---------- @page：只在這一區顯示時 ---------- */

let pageStyle: HTMLStyleElement | null = null
onMounted(() => {
  pageStyle = document.createElement('style')
  pageStyle.setAttribute('data-label-page', '')
  pageStyle.textContent = PAGE_RULE
  document.head.appendChild(pageStyle)
})
onBeforeUnmount(() => { pageStyle?.remove() })

/* ---------- 螢幕預覽的縮放 ---------- */

const root = ref<HTMLElement | null>(null)
const zoom = ref(1)
/** 預覽左右各留的空間（px），紙的陰影才不會貼著外框 */
const GUTTER_PX = 12
let observer: ResizeObserver | null = null
function fit(): void {
  const el = root.value
  if (!el) return
  const available = el.clientWidth - GUTTER_PX * 2
  const sheetPx = A4.widthMm * PX_PER_MM
  zoom.value = available > 0 ? Math.min(1, Math.floor((available / sheetPx) * 1000) / 1000) : 1
}
onMounted(() => {
  fit()
  if (typeof ResizeObserver !== 'undefined' && root.value) {
    observer = new ResizeObserver(fit)
    observer.observe(root.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())

/* ---------- 位置 ---------- */

const box = sheetBox()
const rectStyle = (r: Rect, origin?: Rect) => ({
  left: mm((origin?.x ?? 0) + r.x), top: mm((origin?.y ?? 0) + r.y), width: mm(r.w), height: mm(r.h),
})
const lineStyle = (line: PlacedLine, origin: Rect) => ({
  ...rectStyle(line, origin),
  fontSize: pt(line.pt),
  lineHeight: mm(line.h),
  fontWeight: String(line.weight),
  textAlign: line.align,
})
const pageNumberStyle = { right: mm(PAGE_NUMBER_INSET_MM), bottom: mm(PAGE_NUMBER_INSET_MM) }

const pages = computed(() => L.rendered.pages)
const hiddenSheets = computed(() => (L.showAllSheets ? 0 : Math.max(0, pages.value.length - PREVIEW_SHEETS)))
const codeName = (kind: 'qr' | 'barcode', line: number | null) => `第 ${line ?? ''} ${props.lineUnit}的${kind === 'qr' ? ' QR Code' : '條碼'}`

/* ---------- 對位測試頁 ---------- */

const gridViewBox = `0 0 ${A4.widthMm} ${A4.heightMm}`
const numberSize = ptToMm(TEST_NUMBER_PT)
const infoStyle = {
  left: mm((A4.widthMm - TEST_INFO_WIDTH_MM) / 2),
  top: mm((A4.heightMm - TEST_INFO_HEIGHT_MM) / 2),
  width: mm(TEST_INFO_WIDTH_MM),
  height: mm(TEST_INFO_HEIGHT_MM),
  padding: mm(TEST_INFO_PADDING_MM),
  border: `${mm(TEST_LINE_MM)} solid #000`,
  fontSize: pt(TEST_INFO_FONT_PT),
}
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`
</script>

<template>
  <div ref="root" class="label-sheets" :style="{ '--label-zoom': String(zoom) }" data-test="label-sheets">
    <div class="label-print-area" :style="{ fontFamily: L.font.stack }">
      <template v-if="L.target === 'labels'">
        <div
          v-for="(page, p) in pages" :key="page.key" class="label-sheet" :class="{ 'label-sheet-extra': p >= PREVIEW_SHEETS && !L.showAllSheets }"
          :style="box" role="group" :aria-label="`第 ${p + 1} 張 A4`" data-test="label-sheet">
          <div
            v-for="cell in page.cells" :key="cell.key" class="label-cell" :class="{ 'label-cell-blank': cell.blank }"
            :style="rectStyle(cell.rect)" :data-cell="cell.index + 1" data-test="label-cell">
            <span v-if="cell.blocked" class="label-cell-blocked label-screen-only" data-test="label-cell-blocked">{{ cell.blocked }}</span>
            <template v-else-if="!cell.blank">
              <svg
                v-if="cell.code" class="label-code" :style="rectStyle(cell.code.rect, cell.box)" :viewBox="cell.code.viewBox"
                preserveAspectRatio="none" shape-rendering="crispEdges" role="img" :aria-label="codeName(cell.code.kind, cell.line)"
                :data-kind="cell.code.kind">
                <path fill="#000" :d="cell.code.d" />
              </svg>
              <p
                v-for="(line, i) in cell.lines" :key="i" class="label-line" :style="lineStyle(line, cell.box)"
                :data-hri="line.hri || undefined" :data-truncated="line.truncated || undefined">{{ line.text }}</p>
            </template>
          </div>
          <span class="label-page-number label-screen-only" :style="pageNumberStyle" aria-hidden="true">{{ p + 1 }}</span>
        </div>
      </template>

      <div v-else class="label-sheet" :style="box" role="group" aria-label="對位測試頁" data-test="label-test-sheet">
        <svg class="label-test-grid" :width="mm(A4.widthMm)" :height="mm(A4.heightMm)" :viewBox="gridViewBox" aria-hidden="true">
          <g fill="none" stroke="#000" :stroke-width="TEST_LINE_MM">
            <rect v-for="(r, i) in L.testCells" :key="i" :x="r.x" :y="r.y" :width="r.w" :height="r.h" data-test="label-test-cell" />
          </g>
          <g fill="#000" :font-size="numberSize" text-anchor="middle" dominant-baseline="central">
            <text v-for="(r, i) in L.testCells" :key="i" :x="r.x + r.w / 2" :y="r.y + r.h / 2">{{ i + 1 }}</text>
          </g>
        </svg>
        <div class="label-test-info" :style="infoStyle" data-test="label-test-info">
          <CalibrationRuler />
          <p>對位測試頁｜{{ L.sheetName }}（{{ L.perSheet }} 格）｜位移：左右 {{ signed(L.offset.xMm) }} mm、上下 {{ signed(L.offset.yMm) }} mm</p>
          <p>用白紙印這一頁，疊在標籤紙上對著光看，格線要落在標籤的切線上。差多少就在「位移微調」填多少，再印一次確認。</p>
        </div>
      </div>
    </div>

    <p v-if="L.target === 'labels' && hiddenSheets" class="label-more" data-test="label-more">
      螢幕上先預覽前 {{ PREVIEW_SHEETS }} 張，列印時會印出全部 {{ formatCount(pages.length) }} 張。
      <button type="button" class="label-more-btn" data-test="label-show-all" @click="L.showAllSheets = true">顯示全部</button>
    </p>
  </div>
</template>

<style>
/*
 * 不加 scoped：列印規則要碰到整頁的祖先元素。這份 CSS 只在批次頁的 chunk 裡；`@page` 不寫在這裡，
 * 而是在這一區掛載時才加進 <head>（見上面的 script），其他頁照一般網頁列印。
 */
.label-sheets {
  width: 100%;
  overflow-x: auto;
  background: #efe6d6;
  border: 2px solid #16130f;
  border-radius: 16px;
}
.label-print-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  color: #000;
}
.label-sheet {
  position: relative;
  flex: none;
  overflow: hidden;
  background: #fff;
  color: #000;
  box-shadow: 0 0 0 1px rgb(22 19 15 / 25%), 0 4px 14px rgb(22 19 15 / 12%);
}
.label-cell { position: absolute; overflow: hidden; }
.label-code { position: absolute; display: block; overflow: hidden; }
.label-line { position: absolute; margin: 0; padding: 0; white-space: nowrap; overflow: hidden; color: #000; }
.label-page-number { position: absolute; font: 700 12px/1 sans-serif; color: #7a6c57; }
.label-cell-blocked {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 2px;
  font: 700 11px/1.2 sans-serif; color: #be123c; text-align: center; background: rgb(255 228 230 / 70%);
}
.label-test-grid { position: absolute; left: 0; top: 0; display: block; }
.label-test-info { position: absolute; background: #fff; color: #000; line-height: 1.5; display: flex; flex-direction: column; gap: 0.4em; }
.label-test-info p { margin: 0; }
.label-more { margin: 0; padding: 0 16px 14px; font-size: 13px; font-weight: 600; color: #7a6c57; text-align: center; }
.label-more-btn { margin-left: 4px; padding: 2px 10px; border: 2px solid #16130f; border-radius: 999px; background: #fff; font-weight: 700; color: #16130f; }

@media screen {
  /* 只在螢幕上縮放：列印時照 mm 原尺寸 */
  .label-print-area { zoom: var(--label-zoom, 1); }
  /* 螢幕上看得到每一格的範圍；列印時不印框線 */
  .label-cell { outline: 1px dashed rgb(22 19 15 / 28%); outline-offset: -1px; }
  .label-cell-blank { background: repeating-linear-gradient(135deg, rgb(22 19 15 / 6%) 0 6px, transparent 6px 12px); }
  .label-sheet-extra { display: none; }
}

@media print {
  html, body {
    background: #fff !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  /* 有列印區的頁面：只印列印區。保留它的祖先，其他元素一律不顯示 */
  body:has(.label-print-area) :not(:has(.label-print-area)):not(.label-print-area):not(.label-print-area *) {
    display: none !important;
  }
  body:has(.label-print-area) :has(.label-print-area) {
    display: block !important;
    position: static !important;
    width: auto !important;
    max-width: none !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: none !important;
    box-shadow: none !important;
    overflow: visible !important;
    transform: none !important;
    animation: none !important;
  }
  .label-print-area {
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    zoom: 1 !important;
  }
  .label-sheet {
    box-shadow: none !important;
    margin: 0 !important;
    break-after: page;
    break-inside: avoid;
  }
  .label-sheet:last-child { break-after: auto; }
  .label-screen-only { display: none !important; }
}
</style>
