<script setup lang="ts">
/**
 * 印成標籤紙的設定、提醒與列印鈕，下面接紙張預覽（LabelSheets）。狀態在 useBatchLabels（跟著 BatchTool），
 * 這裡只負責畫面。毫米數字一律來自 src/pure/batch/paper.ts 與型號資料，元件不寫毫米字面值。
 * 繁中版是台灣的 A4 型號、單位 mm；英文版是美國 Letter 的型號（加一個 A4）、單位英寸（文案在 src/pure/batch/copy.ts）。
 *
 * 一律看得到的：型號的格子尺寸、自訂尺寸的錯誤、起始格在哪裡、放不下或太小的碼、被截斷的字、紙邊內縮、
 * 這台電腦沒有選的字型、列印設定的重點（紙張、實際大小 100%、邊界無、不要符合頁面大小）、不能列印的原因。
 * 收進「?」的：型號怎麼選、每格的字怎麼排、位移怎麼量、Edge 與 Chrome 的設定位置。
 */
import { computed, reactive, useId } from 'vue'
import { CUSTOM_SHEET, LINE_COUNT, type BatchLabels, type PrintTarget } from '@/composables/useBatchLabels'
import { BRAND_NAMES, sheetLabel, sheetLabelEn, type LabelBrand } from '@/pure/batch/labelSheets'
import type { CustomGridField } from '@/pure/batch/labelLayout'
import { gridBottom, gridRight } from '@/pure/batch/labelLayout'
import { labelCopy, type LineUnit } from '@/pure/batch/copy'
import type { PaperId } from '@/pure/batch/paper'
import HelpTip from '../HelpTip.vue'
import PillGroup from './PillGroup.vue'
import LabelSheets from './LabelSheets.vue'

const props = defineProps<{ labels: BatchLabels; lineUnit: LineUnit }>()
const L = reactive(props.labels)
const isEn = L.locale === 'en'
const t = labelCopy[L.locale]

const uid = useId()
const id = (name: string) => `${uid}-${name}`

/** 選單的分組：繁中是鶴屋、龍德；英文是跟 Avery 同規格的 Letter 與 A4 */
const groups = (isEn ? (['avery', 'a4'] as LabelBrand[]) : (['herwood', 'longder'] as LabelBrand[])).map(brand => ({
  brand,
  name: isEn ? (brand === 'avery' ? 'Avery-compatible sizes (US Letter)' : 'A4') : BRAND_NAMES[brand],
  sheets: L.sheets.filter(s => s.brand === brand),
}))
const optionLabel = (brandName: string, s: (typeof L.sheets)[number]) => (isEn ? sheetLabelEn(s) : `${brandName} ${sheetLabel(s)}`)

const customFields: { field: CustomGridField; integer?: true }[] = [
  { field: 'columns', integer: true },
  { field: 'rows', integer: true },
  { field: 'labelWidthMm' },
  { field: 'labelHeightMm' },
  { field: 'topMm' },
  { field: 'leftMm' },
  { field: 'colGapMm' },
  { field: 'rowGapMm' },
]
const paperOptions: PaperId[] = ['letter', 'a4']

const targetOptions: { value: PrintTarget; label: string }[] = [
  { value: 'labels', label: t.targetLabels },
  { value: 'test', label: t.targetTest },
]

/** 型號的格子尺寸與邊界：一律看得到 */
const sheetInfo = computed(() => {
  const g = L.grid
  if (!g) return ''
  return t.sheetInfo({
    per: L.perSheet, columns: g.columns, rows: g.rows, widthMm: g.labelWidthMm, heightMm: g.labelHeightMm,
    topMm: g.topMm, leftMm: g.leftMm, rightMm: gridRight(g, L.paper), bottomMm: gridBottom(g, L.paper),
    colGapMm: g.colGapMm, rowGapMm: g.rowGapMm,
  })
})

const startHint = computed(() => {
  const g = L.grid
  if (!g) return ''
  const start = L.placement.startCell
  return t.startHint(start, Math.floor((start - 1) / g.columns) + 1, ((start - 1) % g.columns) + 1)
})

const summary = computed(() => {
  const n = L.items.length
  if (!n || !L.grid) return ''
  return t.summary(n, L.placement.copies, L.sheetTotal, L.paper.id)
})

const printLabel = computed(() => t.printButton(L.target, L.sheetTotal, !!L.printBlocker, L.paper.id))
const linesHelp = computed(() => t.linesHelp(props.lineUnit))

const noticeIcon = { block: 'i-lucide-circle-alert text-rose-600', warn: 'i-lucide-triangle-alert text-amber-700', info: 'i-lucide-info' } as const
</script>

<template>
  <section :aria-labelledby="id('label-title')" data-test="label-print">
    <p :id="id('label-title')" class="zone-label"><span class="icon-badge-sm bg-pop-mint"><span class="i-lucide-printer" aria-hidden="true" /></span>{{ t.title }}</p>

    <div class="grid gap-6 md:grid-cols-2 md:gap-8">
      <!-- 型號、起始格、份數 -->
      <div class="min-w-0">
        <HelpTip :name="t.sheetName" :id="id('sheet-help')">
          <template #head><label :for="id('sheet')" class="text-sm font-700 text-ink">{{ t.sheet }}</label></template>
          <p>{{ t.sheetHelp[0] }}</p>
          <p>{{ t.sheetHelp[1] }}</p>
        </HelpTip>
        <select
          :id="id('sheet')" v-model="L.sheetId" data-test="label-sheet-select" class="input-base mt-1"
          :aria-describedby="`${id('sheet-help')} ${id('sheet-info')}`">
          <optgroup v-for="b in groups" :key="b.brand" :label="b.name">
            <option v-for="s in b.sheets" :key="s.id" :value="s.id">{{ optionLabel(b.name, s) }}</option>
          </optgroup>
          <option :value="CUSTOM_SHEET">{{ t.custom }}</option>
        </select>
        <p :id="id('sheet-info')" class="text-xs text-muted font-600 mt-1" data-test="label-sheet-info">{{ sheetInfo }}</p>

        <fieldset v-if="L.sheetId === CUSTOM_SHEET" class="border-0 p-0 m-0 mt-3 min-w-0" data-test="label-custom">
          <legend class="text-sm font-700 text-ink">{{ t.customLegend }}</legend>
          <!-- 英文版的自訂尺寸可以選紙張（Letter 或 A4）；繁中版只有 A4 -->
          <label v-if="isEn" class="block min-w-0 text-xs font-700 text-ink mt-1">{{ t.paperLabel }}
            <select v-model="L.customPaper" class="input-base mt-0.5 text-sm" data-test="label-custom-paper">
              <option v-for="p in paperOptions" :key="p" :value="p">{{ t.paperOptions[p] }}</option>
            </select>
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
            <label v-for="f in customFields" :key="f.field" class="min-w-0 text-xs font-700 text-ink">{{ t.customFields[f.field] }}
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
          <span>{{ t.avoidEdge }}</span>
        </label>

        <div class="grid grid-cols-2 gap-3 mt-4">
          <div class="min-w-0">
            <label :for="id('start')" class="text-sm font-700 text-ink">{{ t.start }}</label>
            <input
              :id="id('start')" v-model.number="L.startCell" type="number" inputmode="numeric" min="1" :max="L.perSheet || 1" step="1"
              class="input-base mt-1 font-mono" data-test="label-start" :aria-describedby="id('start-hint')"
              @change="L.startCell = L.placement.startCell" />
          </div>
          <div class="min-w-0">
            <label :for="id('copies')" class="text-sm font-700 text-ink">{{ t.copies }}</label>
            <input
              :id="id('copies')" v-model.number="L.copies" type="number" inputmode="numeric" min="1" :max="L.maxCopies" step="1"
              class="input-base mt-1 font-mono" data-test="label-copies" :aria-describedby="id('copies-hint')"
              @change="L.copies = L.placement.copies" />
          </div>
        </div>
        <p :id="id('start-hint')" class="text-xs text-muted font-600 mt-1" data-test="label-start-hint">{{ startHint }}</p>
        <p :id="id('copies-hint')" class="text-xs text-muted font-600 mt-1">{{ t.copiesHint(L.maxCopies) }}</p>
      </div>

      <!-- 每格的字、字型、位移 -->
      <div class="min-w-0">
        <HelpTip :name="t.linesName" :id="id('lines-help')">
          <template #head><span class="text-sm font-700 text-ink" aria-hidden="true">{{ t.linesHead }}</span></template>
          <p>{{ linesHelp[0] }}</p>
          <p>{{ linesHelp[1] }}</p>
        </HelpTip>
        <div class="grid gap-2 mt-1" role="group" :aria-label="t.linesGroup">
          <div v-for="i in LINE_COUNT" :key="i" class="flex items-center gap-2 min-w-0">
            <label :for="id(`line-${i}`)" class="text-sm font-600 text-ink shrink-0">{{ t.lineLabel(i) }}</label>
            <select
              :id="id(`line-${i}`)" v-model="L.lineSources[i - 1]" :data-test="`label-line-${i}`" class="input-base min-w-0"
              :aria-describedby="id('lines-help')">
              <option v-for="o in L.lineOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
        </div>

        <label :for="id('font')" class="block text-sm font-700 text-ink mt-4">{{ t.font }}</label>
        <select :id="id('font')" v-model="L.fontId" data-test="label-font" class="input-base mt-1">
          <option v-for="f in L.fonts" :key="f.id" :value="f.id">{{ f.label }}{{ L.installedFonts && !L.installedFonts[f.id] ? t.fontMissingSuffix : '' }}</option>
        </select>
        <p v-if="L.missingFont" class="text-sm text-ink font-600 mt-1" data-test="label-font-missing">
          <span class="i-lucide-triangle-alert mr-1 text-amber-700" aria-hidden="true" />{{ t.fontMissing(L.missingFont.label, L.missingFont.fallbackNote) }}
        </p>

        <div class="mt-4">
          <HelpTip :name="t.offsetName" :id="id('offset-help')">
            <template #head><span class="text-sm font-700 text-ink" aria-hidden="true">{{ t.offsetHead }}</span></template>
            <p v-for="(h, i) in t.offsetHelp" :key="i">{{ h }}</p>
          </HelpTip>
          <div class="grid grid-cols-2 gap-3 mt-1">
            <label class="min-w-0 text-sm font-600 text-ink">{{ t.offsetX }}
              <input
                v-model.number="L.offsetX" type="number" inputmode="decimal" :min="t.offsetInput.min" :max="t.offsetInput.max" :step="t.offsetInput.step"
                class="input-base mt-1 font-mono" data-test="label-offset-x" :aria-describedby="id('offset-help')"
                @change="L.offsetX = L.offsetShown.x" />
            </label>
            <label class="min-w-0 text-sm font-600 text-ink">{{ t.offsetY }}
              <input
                v-model.number="L.offsetY" type="number" inputmode="decimal" :min="t.offsetInput.min" :max="t.offsetInput.max" :step="t.offsetInput.step"
                class="input-base mt-1 font-mono" data-test="label-offset-y" :aria-describedby="id('offset-help')"
                @change="L.offsetY = L.offsetShown.y" />
            </label>
          </div>
          <label class="flex items-center gap-2 text-sm font-600 text-ink cursor-pointer mt-2">
            <input v-model="L.rememberOffset" type="checkbox" class="accent-brand w-4 h-4" data-test="label-remember" :aria-describedby="id('offset-help')" />{{ t.remember }}
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
    <HelpTip :name="t.targetName" :id="id('target-help')">
      <template #head><span class="text-sm font-700 text-ink" aria-hidden="true">{{ t.target }}</span></template>
      <p>{{ t.targetHelp }}</p>
    </HelpTip>
    <PillGroup v-model="L.target" :options="targetOptions" name="label-target" :legend="t.target" :describedby="id('target-help')" test-id="label-target" />

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button" data-test="label-print-btn" class="btn-primary !bg-pop-sun" :disabled="!!L.activeBlocker"
        :aria-describedby="`${id('print-tips')} ${id('print-help')} ${id('print-status')}`" @click="L.print()">
        <span class="i-lucide-printer" aria-hidden="true" />{{ printLabel }}
      </button>
      <span v-if="L.target === 'labels' && summary" class="text-sm text-muted font-700" data-test="label-summary">{{ summary }}</span>
    </div>
    <HelpTip :name="t.printHelpName" :id="id('print-help')">
      <template #head>
        <p :id="id('print-tips')" class="text-sm text-ink font-700 mt-2" data-test="label-print-tips">
          {{ t.printTips(L.paper.id) }}
        </p>
      </template>
      <p>{{ t.printHelp[0] }}</p>
      <p>{{ t.printHelp[1] }}</p>
    </HelpTip>
    <div :id="id('print-status')" aria-live="polite" class="mt-2 text-sm font-700 min-h-[1.5rem]" data-test="label-print-status">
      <p v-if="L.activeBlocker" class="text-muted" data-test="label-blocker">{{ L.activeBlocker }}</p>
    </div>

    <LabelSheets :labels="labels" :line-unit="lineUnit" class="mt-3" />
  </section>
</template>
