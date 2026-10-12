<script setup lang="ts">
/**
 * 印成 A4 標籤紙的設定、提醒與列印鈕，下面接 A4 預覽（LabelSheets）。狀態在 useBatchLabels（跟著 BatchTool），
 * 這裡只負責畫面。毫米數字一律來自 src/pure/batch/paper.ts 與型號資料，元件不寫毫米字面值。
 *
 * 一律看得到的：型號的格子尺寸、自訂尺寸的錯誤、起始格在哪裡、放不下或太小的碼、被截斷的字、紙邊內縮、
 * 這台電腦沒有選的字型、列印設定的重點（A4、實際大小 100%、邊界無、不要符合頁面大小）、不能列印的原因。
 * 收進「?」的：型號怎麼選、每格的字怎麼排、位移怎麼量、Edge 與 Chrome 的設定位置。
 */
import { computed, reactive, useId } from 'vue'
import { CUSTOM_SHEET, LINE_COUNT, type BatchLabels, type PrintTarget } from '@/composables/useBatchLabels'
import { BRAND_NAMES, sheetLabel, type LabelBrand } from '@/pure/batch/labelSheets'
import type { CustomGridField } from '@/pure/batch/labelLayout'
import { gridBottom, gridRight } from '@/pure/batch/labelLayout'
import { CALIBRATION_MM, OFFSET_LIMIT_MM, OFFSET_STEP_MM } from '@/pure/batch/paper'
import { PRINT_FONTS } from '@/pure/batch/printFonts'
import { formatCount } from '@/pure/batch/sequence'
import HelpTip from '../HelpTip.vue'
import PillGroup from './PillGroup.vue'
import LabelSheets from './LabelSheets.vue'

const props = defineProps<{ labels: BatchLabels; lineUnit: string }>()
const L = reactive(props.labels)

const uid = useId()
const id = (name: string) => `${uid}-${name}`

const brands = (['herwood', 'longder'] as LabelBrand[]).map(brand => ({
  brand, name: BRAND_NAMES[brand], sheets: L.sheets.filter(s => s.brand === brand),
}))

const customFields: { field: CustomGridField; label: string; integer?: true }[] = [
  { field: 'columns', label: '欄數', integer: true },
  { field: 'rows', label: '列數', integer: true },
  { field: 'labelWidthMm', label: '單格寬' },
  { field: 'labelHeightMm', label: '單格高' },
  { field: 'topMm', label: '上邊界' },
  { field: 'leftMm', label: '左邊界' },
  { field: 'colGapMm', label: '欄距' },
  { field: 'rowGapMm', label: '列距' },
]

const targetOptions: { value: PrintTarget; label: string }[] = [
  { value: 'labels', label: '標籤' },
  { value: 'test', label: '對位測試頁' },
]

/** 型號的格子尺寸與邊界：一律看得到 */
const sheetInfo = computed(() => {
  const g = L.grid
  if (!g) return ''
  const gaps = [g.colGapMm ? `欄距 ${g.colGapMm}` : '', g.rowGapMm ? `列距 ${g.rowGapMm}` : ''].filter(Boolean).join('、')
  return `每張 ${L.perSheet} 格（${g.columns} 欄 × ${g.rows} 列），每格寬 ${g.labelWidthMm} × 高 ${g.labelHeightMm} mm；`
    + `邊界：上 ${g.topMm}、左 ${g.leftMm}、右 ${gridRight(g)}、下 ${gridBottom(g)} mm${gaps ? `；${gaps} mm` : ''}。`
})

const startHint = computed(() => {
  const g = L.grid
  if (!g) return ''
  const start = L.placement.startCell
  if (start === 1) return '從左上角第 1 格開始。用掉一部分的標籤紙，填第一張還沒用的格子號碼，前面的格子會留白。'
  const row = Math.floor((start - 1) / g.columns) + 1
  const column = ((start - 1) % g.columns) + 1
  return `第 ${start} 格是第 ${row} 列第 ${column} 欄，前面 ${start - 1} 格留白（只有第一張）。`
})

const summary = computed(() => {
  const n = L.items.length
  if (!n || !L.grid) return ''
  const copies = L.placement.copies
  return `共 ${formatCount(n)} 筆${copies > 1 ? ` × ${copies} 份` : ''}，印 ${formatCount(L.sheetTotal)} 張 A4。`
})

const printLabel = computed(() => (L.target === 'test'
  ? '印對位測試頁（1 張 A4）'
  : L.sheetTotal && !L.printBlocker ? `列印標籤（${formatCount(L.sheetTotal)} 張 A4）` : '列印標籤'))

const noticeIcon = { block: 'i-lucide-circle-alert text-rose-600', warn: 'i-lucide-triangle-alert text-amber-700', info: 'i-lucide-info' } as const
</script>

<template>
  <section :aria-labelledby="id('label-title')" data-test="label-print">
    <p :id="id('label-title')" class="zone-label"><span class="icon-badge-sm bg-pop-mint"><span class="i-lucide-printer" aria-hidden="true" /></span>印成 A4 標籤紙</p>

    <div class="grid gap-6 md:grid-cols-2 md:gap-8">
      <!-- 型號、起始格、份數 -->
      <div class="min-w-0">
        <HelpTip name="標籤紙型號" :id="id('sheet-help')">
          <template #head><label :for="id('sheet')" class="text-sm font-700 text-ink">標籤紙型號</label></template>
          <p>型號印在標籤紙的包裝上，例如鶴屋 L3464、龍德 LD-8108。格子的位置照兩家官網提供的 Word 範本設定；同樣格數的型號，邊界可能差到 2 mm，請選跟手上一樣的型號。</p>
          <p>格子尺寸寫成寬 × 高（mm）。全版切割是整張紙都是標籤、四邊沒有留白。找不到你的型號就選「自訂尺寸」，用尺量第一張標籤離紙的上緣與左緣、標籤的寬高與標籤之間的空隙。</p>
        </HelpTip>
        <select
          :id="id('sheet')" v-model="L.sheetId" data-test="label-sheet-select" class="input-base mt-1"
          :aria-describedby="`${id('sheet-help')} ${id('sheet-info')}`">
          <optgroup v-for="b in brands" :key="b.brand" :label="b.name">
            <option v-for="s in b.sheets" :key="s.id" :value="s.id">{{ b.name }} {{ sheetLabel(s) }}</option>
          </optgroup>
          <option :value="CUSTOM_SHEET">自訂尺寸</option>
        </select>
        <p :id="id('sheet-info')" class="text-xs text-muted font-600 mt-1" data-test="label-sheet-info">{{ sheetInfo }}</p>

        <fieldset v-if="L.sheetId === CUSTOM_SHEET" class="border-0 p-0 m-0 mt-3 min-w-0" data-test="label-custom">
          <legend class="text-sm font-700 text-ink">自訂尺寸（mm）</legend>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
            <label v-for="f in customFields" :key="f.field" class="min-w-0 text-xs font-700 text-ink">{{ f.label }}
              <input
                v-model="L.custom[f.field]" type="text" :inputmode="f.integer ? 'numeric' : 'decimal'" autocomplete="off"
                class="input-base mt-0.5 font-mono text-sm !px-2" :data-test="`label-custom-${f.field}`"
                :aria-invalid="!L.gridResult.ok && L.gridResult.field === f.field"
                :aria-describedby="id('custom-error')" />
            </label>
          </div>
          <p :id="id('custom-error')" class="text-sm font-700 mt-1 min-h-[1.25rem]" aria-live="polite">
            <span v-if="!L.gridResult.ok" class="text-rose-600" data-test="label-custom-error"><span class="i-lucide-circle-alert mr-1" aria-hidden="true" />{{ L.gridResult.error }}</span>
          </p>
        </fieldset>

        <label v-if="L.edgeCount" class="flex items-start gap-2 text-sm font-600 text-ink cursor-pointer mt-3">
          <input v-model="L.avoidEdge" type="checkbox" class="accent-brand w-4 h-4 mt-0.5 shrink-0" data-test="label-avoid-edge" />
          <span>最外圈的格子往內縮，避開印表機印不到的紙邊</span>
        </label>

        <div class="grid grid-cols-2 gap-3 mt-4">
          <div class="min-w-0">
            <label :for="id('start')" class="text-sm font-700 text-ink">從第幾格開始印</label>
            <input
              :id="id('start')" v-model.number="L.startCell" type="number" inputmode="numeric" min="1" :max="L.perSheet || 1" step="1"
              class="input-base mt-1 font-mono" data-test="label-start" :aria-describedby="id('start-hint')"
              @change="L.startCell = L.placement.startCell" />
          </div>
          <div class="min-w-0">
            <label :for="id('copies')" class="text-sm font-700 text-ink">每筆印幾份</label>
            <input
              :id="id('copies')" v-model.number="L.copies" type="number" inputmode="numeric" min="1" :max="L.maxCopies" step="1"
              class="input-base mt-1 font-mono" data-test="label-copies" :aria-describedby="id('copies-hint')"
              @change="L.copies = L.placement.copies" />
          </div>
        </div>
        <p :id="id('start-hint')" class="text-xs text-muted font-600 mt-1" data-test="label-start-hint">{{ startHint }}</p>
        <p :id="id('copies-hint')" class="text-xs text-muted font-600 mt-1">每一筆連續印幾張一樣的（最多 {{ L.maxCopies }} 份），例如一張貼設備、一張貼財產卡。</p>
      </div>

      <!-- 每格的字、字型、位移 -->
      <div class="min-w-0">
        <HelpTip name="每格的字" :id="id('lines-help')">
          <template #head><span class="text-sm font-700 text-ink" aria-hidden="true">每格的字（最多三行）</span></template>
          <p>從貼上的欄位選要印在碼旁邊的字，例如財產編號、品名、保管單位；第一行粗一點。格子寬時字在 QR Code 右邊，窄時在下面；條碼的號碼固定印在條碼下方。</p>
          <p>每一行依長度自動縮小，縮到最小還放不下就截斷、以「…」結尾，上面會列出是哪幾{{ lineUnit }}。</p>
        </HelpTip>
        <div class="grid gap-2 mt-1" role="group" aria-label="每格的字">
          <div v-for="i in LINE_COUNT" :key="i" class="flex items-center gap-2 min-w-0">
            <label :for="id(`line-${i}`)" class="text-sm font-600 text-ink shrink-0">第 {{ i }} 行</label>
            <select
              :id="id(`line-${i}`)" v-model="L.lineSources[i - 1]" :data-test="`label-line-${i}`" class="input-base min-w-0"
              :aria-describedby="id('lines-help')">
              <option v-for="o in L.lineOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
        </div>

        <label :for="id('font')" class="block text-sm font-700 text-ink mt-4">字型</label>
        <select :id="id('font')" v-model="L.fontId" data-test="label-font" class="input-base mt-1">
          <option v-for="f in PRINT_FONTS" :key="f.id" :value="f.id">{{ f.label }}{{ L.installedFonts && !L.installedFonts[f.id] ? '（這台電腦沒有）' : '' }}</option>
        </select>
        <p v-if="L.missingFont" class="text-sm text-ink font-600 mt-1" data-test="label-font-missing">
          <span class="i-lucide-triangle-alert mr-1 text-amber-700" aria-hidden="true" />這台電腦沒有{{ L.missingFont.label }}，預覽與列印{{ L.missingFont.fallbackNote }}。要印出{{ L.missingFont.label }}，請用有這套字型的 Windows 電腦列印。
        </p>

        <div class="mt-4">
          <HelpTip name="位移微調" :id="id('offset-help')">
            <template #head><span class="text-sm font-700 text-ink" aria-hidden="true">位移微調（mm）</span></template>
            <p>印出來整批往同一個方向偏時用：內容偏左，「左右」填正數往右移；偏上，「上下」填正數往下移。最多 ±{{ OFFSET_LIMIT_MM }} mm，可以填到 {{ OFFSET_STEP_MM }} mm。</p>
            <p>先在下面選「對位測試頁」用白紙印一張，疊在標籤紙上對著光看，格線離標籤的切線差多少就填多少，再印一次確認。</p>
            <p>勾選「記住這台印表機的位移」時，只在這台電腦的瀏覽器存左右、上下兩個數字，不存清單；取消勾選就刪掉。</p>
          </HelpTip>
          <div class="grid grid-cols-2 gap-3 mt-1">
            <label class="min-w-0 text-sm font-600 text-ink">左右（正數往右）
              <input
                v-model.number="L.offsetX" type="number" inputmode="decimal" :min="-OFFSET_LIMIT_MM" :max="OFFSET_LIMIT_MM" :step="OFFSET_STEP_MM"
                class="input-base mt-1 font-mono" data-test="label-offset-x" :aria-describedby="id('offset-help')"
                @change="L.offsetX = L.offset.xMm" />
            </label>
            <label class="min-w-0 text-sm font-600 text-ink">上下（正數往下）
              <input
                v-model.number="L.offsetY" type="number" inputmode="decimal" :min="-OFFSET_LIMIT_MM" :max="OFFSET_LIMIT_MM" :step="OFFSET_STEP_MM"
                class="input-base mt-1 font-mono" data-test="label-offset-y" :aria-describedby="id('offset-help')"
                @change="L.offsetY = L.offset.yMm" />
            </label>
          </div>
          <label class="flex items-center gap-2 text-sm font-600 text-ink cursor-pointer mt-2">
            <input v-model="L.rememberOffset" type="checkbox" class="accent-brand w-4 h-4" data-test="label-remember" :aria-describedby="id('offset-help')" />記住這台印表機的位移
          </label>
        </div>
      </div>
    </div>

    <!-- 提醒：一律看得到 -->
    <ul v-if="L.notices.length" class="list-none p-0 m-0 mt-5 space-y-1.5" data-test="label-notices">
      <li
        v-for="n in L.notices" :key="n.id" class="text-sm font-600 break-words"
        :class="n.level === 'block' ? 'text-rose-700' : 'text-ink'" :data-test="`label-notice-${n.id}`">
        <span class="mr-1" :class="noticeIcon[n.level]" aria-hidden="true" />{{ n.text }}
      </li>
    </ul>

    <hr class="border-t-2 border-dashed border-ink/15 my-6" />

    <!-- 要印什麼、列印 -->
    <HelpTip name="要印什麼" :id="id('target-help')">
      <template #head><span class="text-sm font-700 text-ink" aria-hidden="true">要印什麼</span></template>
      <p>對位測試頁只印每一格的框線與格號，中間有一把 {{ CALIBRATION_MM / 10 }} 公分校正尺。第一次用某個型號、或換了印表機時，先用白紙印這一頁，疊在標籤紙上對著光看：格線落在標籤的切線上，再放標籤紙印；校正尺量起來不是剛好 {{ CALIBRATION_MM / 10 }} 公分，就是列印設定有縮放。</p>
    </HelpTip>
    <PillGroup v-model="L.target" :options="targetOptions" name="label-target" legend="要印什麼" :describedby="id('target-help')" test-id="label-target" />

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button" data-test="label-print-btn" class="btn-primary !bg-pop-sun" :disabled="!!L.activeBlocker"
        :aria-describedby="`${id('print-tips')} ${id('print-help')} ${id('print-status')}`" @click="L.print()">
        <span class="i-lucide-printer" aria-hidden="true" />{{ printLabel }}
      </button>
      <span v-if="L.target === 'labels' && summary" class="text-sm text-muted font-700" data-test="label-summary">{{ summary }}</span>
    </div>
    <HelpTip name="列印設定" :id="id('print-help')">
      <template #head>
        <p :id="id('print-tips')" class="text-sm text-ink font-700 mt-2" data-test="label-print-tips">
          列印時紙張選 A4、縮放選「實際大小（100%）」、邊界選「無」，不要選「符合頁面大小」。
        </p>
      </template>
      <p>Edge 與 Chrome：列印視窗按「更多設定」，縮放選「預設」或自訂 100，不要選「符合頁面大小」「符合可列印區域」這類自動縮放；邊界選「無」，「頁首和頁尾」取消勾選。標籤紙放進印表機前，先看紙匣上的圖示，確認要印的那一面朝哪裡、紙的上緣朝哪裡。</p>
      <p>印出來後量一下對位測試頁的校正尺：剛好 {{ CALIBRATION_MM / 10 }} 公分就是實際大小。想存成 PDF，在「目的地」選「另存為 PDF」即可，本站不另外產生 PDF 檔。</p>
    </HelpTip>
    <div :id="id('print-status')" aria-live="polite" class="mt-2 text-sm font-700 min-h-[1.5rem]" data-test="label-print-status">
      <p v-if="L.activeBlocker" class="text-muted" data-test="label-blocker">{{ L.activeBlocker }}</p>
    </div>

    <LabelSheets :labels="labels" :line-unit="lineUnit" class="mt-3" />
  </section>
</template>
