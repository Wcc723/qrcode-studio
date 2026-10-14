<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import type { ErrorCorrectionLevel } from '@/types'
import { useBatch, PREVIEW_COUNT, ISSUE_LIST_LIMIT, type OutputMode } from '@/composables/useBatch'
import { useBatchLabels } from '@/composables/useBatchLabels'
import { pngPresetsFor, symbologiesFor, symbologyMapFor } from '@/config/symbologies'
import { applyTemplate, templateToken } from '@/pure/batch/template'
import { BATCH_MAX_ROWS, type BatchSymbology } from '@/pure/batch/rows'
import { batchCopy } from '@/pure/batch/copy'
import { useLocale } from '@/i18n/locale'
import HelpTip from '../HelpTip.vue'
import PrivacyNote from '../PrivacyNote.vue'
import PillGroup from './PillGroup.vue'
import BatchPreviewGrid from './BatchPreviewGrid.vue'
import LabelPrint from './LabelPrint.vue'

const uid = useId()
const id = (name: string) => `${uid}-${name}`
const locale = useLocale().value
const t = batchCopy[locale]
const symbologies = symbologiesFor(locale)
const symbologyById = symbologyMapFor(locale)
const pngPresets = pngPresetsFor(locale)
const TEMPLATE_TOKEN = templateToken(locale)

const {
  mode, lineUnit, pasteText, linesText, seq, hasHeader, contentCol, nameCol, linesName, seqName,
  template, symbology, ec, onError, output, format, qrSize, barcodeScale,
  table, headerCells, columns, sequence, sequenceShown, sourceRows, linesLookTabular,
  templateCheck, checked, ready, failed, duplicates, appendedCount, hasStoreCodes, code39ShiftCount, fileNames, blocker,
  previewTiles, busy, progress, status, exportError, download, cancel,
} = useBatch(locale)

// 標籤紙的設定跟著工具卡：切回「下載 ZIP」再切回來，型號、起始格、位移都還在
const labels = useBatchLabels({ ready, mode, table, headerCells, columns, contentCol, symbology, ec, blocker, lineUnit }, { locale })

const modeOptions = [
  { value: 'paste', label: t.modeOptions.paste },
  { value: 'lines', label: t.modeOptions.lines },
  { value: 'sequence', label: t.modeOptions.sequence },
] as const

const symbologyOptions: { value: BatchSymbology; label: string }[] = [
  { value: 'qr', label: 'QR Code' },
  ...symbologies.map(s => ({ value: s.id, label: s.label })),
]

const outputOptions: { value: OutputMode; label: string }[] = [
  { value: 'zip', label: t.outputZip },
  { value: 'label', label: t.outputLabel },
]

const formatOptions = [
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' },
] as const

const ecLevels: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']
const ecLabel = t.ecLabel
// 不給 2000：2,000 張 2000 像素的 PNG 在 WebKit 要將近一分鐘、ZIP 超過 150 MB，手機容易記憶體不足
const qrSizes = [300, 600, 1000, 1500]

const clip = (s: string, n = 40) => (s.length > n ? `${s.slice(0, n)}…` : s)


const isBarcode = computed(() => symbology.value !== 'qr')
/** 有檢查碼的三種，以及不含檢查碼時要幾位 */
const GTIN_DATA_LEN: Partial<Record<BatchSymbology, number>> = { ean13: 12, ean8: 7, itf14: 13 }
const gtinDataLen = computed(() => GTIN_DATA_LEN[symbology.value] ?? 0)
const isGtin = computed(() => gtinDataLen.value > 0)
const symLabel = computed(() => symbologyOptions.find(o => o.value === symbology.value)!.label)
const rule = computed(() => (symbology.value === 'qr'
  ? t.qrRule
  : symbologyById[symbology.value as Exclude<BatchSymbology, 'qr'>].rule))

const templateExample = computed(() => {
  if (!templateCheck.value.ok || templateCheck.value.empty) return null
  const first = sourceRows.value.find(r => r.value)
  return applyTemplate(template.value, first?.value ?? 'TP-0001', locale)
})

function insertToken() {
  template.value = `${template.value}${TEMPLATE_TOKEN}`
}

const shownIssues = computed(() => failed.value.slice(0, ISSUE_LIST_LIMIT))

const downloadLabel = computed(() => t.download.button(ready.value.length, format.value))
const percent = computed(() => (progress.value.total ? Math.round((progress.value.done / progress.value.total) * 100) : 0))

const downloadBtn = ref<HTMLButtonElement | null>(null)
const cancelBtn = ref<HTMLButtonElement | null>(null)
/**
 * 按下去之後下載鈕在產生途中不能按，焦點會掉到頁面最上面，鍵盤使用者得從頭找回來：
 * 產生途中把焦點放在「取消」，結束（完成、取消或失敗）後焦點沒有被移到別處的話，再放回下載鈕。
 */
async function startDownload() {
  const run = download()
  await nextTick()
  if (busy.value) cancelBtn.value?.focus()
  await run
  await nextTick()
  const active = document.activeElement
  if (!active || active === document.body) downloadBtn.value?.focus()
}
</script>


<template>
  <div class="card p-5 md:p-6" data-test="batch-tool">
    <PrivacyNote mode="batch" class="mb-5" />

    <div class="grid gap-6 md:grid-cols-2 md:gap-8">
      <!-- ① 輸入清單 -->
      <section class="min-w-0" :aria-labelledby="id('input-title')">
        <p :id="id('input-title')" class="zone-label"><span class="icon-badge-sm bg-pop-sun"><span class="i-lucide-clipboard-list" aria-hidden="true" /></span>{{ t.input.title }}</p>
        <HelpTip :name="t.input.modeName" :id="id('mode-help')">
          <template #head><span class="text-sm text-muted" aria-hidden="true">{{ t.input.mode }}</span></template>
          <ul>
            <li v-for="m in t.input.modeHelp" :key="m.strong"><strong>{{ m.strong }}</strong>{{ m.text }}</li>
          </ul>
        </HelpTip>
        <PillGroup v-model="mode" :options="modeOptions" name="batch-mode" :legend="t.input.mode" :describedby="id('mode-help')" test-id="batch-mode" />

        <!-- 從 Excel 貼上 -->
        <div v-if="mode === 'paste'" class="mt-4">
          <label :for="id('paste')" class="text-sm font-700 text-ink">{{ t.input.pasteLabel }}</label>
          <textarea
            :id="id('paste')" v-model="pasteText" data-test="batch-paste" rows="8" wrap="off" spellcheck="false"
            autocomplete="off" autocapitalize="off" :aria-describedby="id('paste-hint')"
            class="input-base mt-1 font-mono text-sm leading-relaxed"
            :placeholder="t.input.pastePlaceholder" />
          <p :id="id('paste-hint')" class="text-xs text-muted font-600 mt-1">{{ t.input.pasteHint }}</p>

          <div v-if="table.columnCount" class="grid gap-3 sm:grid-cols-2 mt-3" data-test="batch-columns">
            <label class="sm:col-span-2 flex items-center gap-2 text-sm font-600 text-ink cursor-pointer">
              <input v-model="hasHeader" data-test="batch-has-header" type="checkbox" class="accent-brand w-4 h-4" />{{ t.input.hasHeader }}
            </label>
            <div class="min-w-0">
              <label :for="id('content-col')" class="text-sm font-700 text-ink">{{ t.input.contentCol }}</label>
              <select :id="id('content-col')" v-model.number="contentCol" data-test="batch-content-col" class="input-base mt-1">
                <option v-for="c in columns" :key="c.index" :value="c.index">{{ c.label }}</option>
              </select>
            </div>
            <div class="min-w-0">
              <label :for="id('name-col')" class="text-sm font-700 text-ink">{{ t.input.nameCol }}</label>
              <select :id="id('name-col')" v-model.number="nameCol" data-test="batch-name-col" class="input-base mt-1">
                <option :value="-1">{{ t.input.serial }}</option>
                <option v-for="c in columns" :key="c.index" :value="c.index">{{ c.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 每行一筆 -->
        <div v-else-if="mode === 'lines'" class="mt-4">
          <label :for="id('lines')" class="text-sm font-700 text-ink">{{ t.input.linesLabel }}</label>
          <textarea
            :id="id('lines')" v-model="linesText" data-test="batch-lines" rows="8" wrap="off" spellcheck="false"
            autocomplete="off" autocapitalize="off" :aria-describedby="id('lines-hint')"
            class="input-base mt-1 font-mono text-sm leading-relaxed"
            :placeholder="t.input.linesPlaceholder" />
          <p :id="id('lines-hint')" class="text-xs text-muted font-600 mt-1">{{ t.input.linesHint }}</p>
          <p v-if="linesLookTabular" data-test="batch-lines-tab" class="text-sm text-ink font-700 mt-1">
            <span class="i-lucide-info mr-1" aria-hidden="true" />{{ t.input.linesTab }}
          </p>
          <label :for="id('lines-name')" class="block text-sm font-700 text-ink mt-3">{{ t.input.fileName }}</label>
          <select :id="id('lines-name')" v-model="linesName" data-test="batch-lines-name" class="input-base mt-1">
            <option value="value">{{ t.input.useLine }}</option>
            <option value="serial">{{ t.input.serial }}</option>
          </select>
        </div>

        <!-- 連號 -->
        <div v-else class="mt-4" data-test="batch-sequence">
          <div class="grid grid-cols-2 gap-3">
            <label class="min-w-0 text-sm font-700 text-ink">{{ t.input.prefix }}
              <input v-model="seq.prefix" data-test="seq-prefix" type="text" class="input-base mt-1 font-mono" placeholder="TP-" autocomplete="off" spellcheck="false" />
            </label>
            <label class="min-w-0 text-sm font-700 text-ink">{{ t.input.suffix }}
              <input v-model="seq.suffix" data-test="seq-suffix" type="text" class="input-base mt-1 font-mono" :placeholder="t.input.suffixPlaceholder" autocomplete="off" spellcheck="false" />
            </label>
            <label class="min-w-0 text-sm font-700 text-ink">{{ t.input.start }}
              <input v-model="seq.start" data-test="seq-start" type="text" inputmode="numeric" class="input-base mt-1 font-mono" :aria-invalid="!sequence.ok && sequence.field === 'start'" autocomplete="off" />
            </label>
            <label class="min-w-0 text-sm font-700 text-ink">{{ t.input.step }}
              <input v-model="seq.step" data-test="seq-step" type="text" inputmode="numeric" class="input-base mt-1 font-mono" :aria-invalid="!sequence.ok && sequence.field === 'step'" autocomplete="off" />
            </label>
          </div>
          <fieldset class="border-0 p-0 m-0 mt-3 min-w-0">
            <legend class="text-sm font-700 text-ink">{{ t.input.until }}</legend>
            <div class="grid grid-cols-2 gap-3 mt-1">
              <div class="min-w-0">
                <label class="flex items-center gap-1.5 text-sm font-600 text-ink cursor-pointer">
                  <input v-model="seq.until" type="radio" :name="id('until')" value="count" class="accent-brand w-4 h-4" data-test="seq-until-count" />{{ t.input.count }}
                </label>
                <input v-model="seq.count" data-test="seq-count" type="text" inputmode="numeric" :aria-label="t.input.count" class="input-base mt-1 font-mono" :disabled="seq.until !== 'count'" :aria-invalid="!sequence.ok && sequence.field === 'count'" autocomplete="off" />
              </div>
              <div class="min-w-0">
                <label class="flex items-center gap-1.5 text-sm font-600 text-ink cursor-pointer">
                  <input v-model="seq.until" type="radio" :name="id('until')" value="end" class="accent-brand w-4 h-4" data-test="seq-until-end" />{{ t.input.end }}
                </label>
                <input v-model="seq.end" data-test="seq-end" type="text" inputmode="numeric" :aria-label="t.input.end" class="input-base mt-1 font-mono" :disabled="seq.until !== 'end'" :aria-invalid="!sequence.ok && sequence.field === 'end'" autocomplete="off" />
              </div>
            </div>
          </fieldset>
          <div class="grid grid-cols-2 gap-3 mt-3">
            <label class="min-w-0 text-sm font-700 text-ink">{{ t.input.pad }}
              <input v-model="seq.pad" data-test="seq-pad" type="text" inputmode="numeric" class="input-base mt-1 font-mono" :aria-invalid="!sequence.ok && sequence.field === 'pad'" autocomplete="off" />
            </label>
            <label class="min-w-0 text-sm font-700 text-ink">{{ t.input.fileName }}
              <select v-model="seqName" data-test="seq-name" class="input-base mt-1">
                <option value="value">{{ t.input.useSequence }}</option>
                <option value="serial">{{ t.input.serial }}</option>
              </select>
            </label>
          </div>
          <p class="text-xs text-muted font-600 mt-1">{{ t.input.padHint }}</p>
          <!-- 即時顯示前三筆與最後一筆；錯誤一律看得到 -->
          <div class="mt-2 text-sm font-700 min-h-[1.5rem]" aria-live="polite" data-test="seq-preview">
            <p v-if="!sequence.ok" class="text-rose-600 break-all"><span class="i-lucide-circle-alert mr-1" aria-hidden="true" />{{ sequence.error }}</p>
            <p v-else-if="sequenceShown" class="text-ink break-words">
              <template v-for="(v, i) in sequenceShown.head" :key="i"><template v-if="i">{{ t.input.listSep }}</template><span class="font-mono">{{ v }}</span></template><template v-if="sequenceShown.last"> … <span class="font-mono">{{ sequenceShown.last }}</span></template>
              <span class="text-muted font-600">{{ t.input.sequenceTotal(sequence.values.length) }}</span>
            </p>
          </div>
          <p v-if="isGtin" class="text-xs text-ink font-700 mt-1" data-test="seq-gtin-hint">
            <span class="i-lucide-info mr-1" aria-hidden="true" />{{ t.input.gtinHint(symLabel, gtinDataLen) }}<template v-if="symbology === 'ean13'">{{ t.input.gtinStoreHint }}</template>
          </p>
        </div>

        <!-- 內容範本 -->
        <div class="mt-5">
          <HelpTip :name="t.input.templateName" :id="id('tpl-help')">
            <template #head><label :for="id('tpl')" class="text-sm font-700 text-ink">{{ t.input.templateLabel }}</label></template>
            <p v-for="(h, i) in t.input.templateHelp" :key="i">{{ h }}</p>
          </HelpTip>
          <div class="flex gap-2 mt-1">
            <input
              :id="id('tpl')" v-model="template" data-test="batch-template" type="text" inputmode="url"
              class="input-base font-mono text-sm min-w-0" :placeholder="t.input.templatePlaceholder"
              autocomplete="off" autocapitalize="off" spellcheck="false"
              :aria-invalid="!templateCheck.ok" :aria-describedby="`${id('tpl-help')} ${id('tpl-status')}`" />
            <button type="button" class="chip bg-white shrink-0 hover:bg-pop-sun transition" data-test="batch-insert-token" @click="insertToken">
              <span class="i-lucide-plus" aria-hidden="true" /><span class="sr-only">{{ t.input.insert }}</span>{{ TEMPLATE_TOKEN }}
            </button>
          </div>
          <div :id="id('tpl-status')" class="text-xs font-700 mt-1 min-h-[1.25rem]">
            <p v-if="!templateCheck.ok" class="text-rose-600 text-sm" data-test="batch-template-error"><span class="i-lucide-circle-alert mr-1" aria-hidden="true" />{{ templateCheck.error }}</p>
            <p v-else-if="templateExample" class="text-muted break-all" data-test="batch-template-example">{{ t.input.templateExample }}<span class="font-mono text-ink">{{ templateExample }}</span></p>
          </div>
        </div>
      </section>

      <!-- ② 碼的種類與輸出 -->
      <section class="min-w-0" :aria-labelledby="id('code-title')">
        <p :id="id('code-title')" class="zone-label"><span class="icon-badge-sm bg-pop-sky"><span class="i-lucide-qr-code" aria-hidden="true" /></span>{{ t.code.title }}</p>
        <HelpTip :name="t.code.helpName" :id="id('sym-help')">
          <template #head><span class="text-sm text-muted" aria-hidden="true">{{ t.code.helpHead }}</span></template>
          <ul>
            <li><strong>QR Code</strong>{{ t.qrAbout }}</li>
            <li v-for="s in symbologies" :key="s.id"><strong>{{ s.label }}</strong>{{ locale === 'en' ? ': ' : '：' }}{{ s.about }}</li>
          </ul>
          <p>{{ t.code.helpEnd }}</p>
        </HelpTip>
        <PillGroup v-model="symbology" :options="symbologyOptions" name="batch-symbology" :legend="t.code.legend" :describedby="id('sym-help')" test-id="batch-sym" />
        <p class="text-xs text-muted font-600 mt-2" data-test="batch-rule">{{ rule }}</p>

        <div v-if="!isBarcode" class="mt-4">
          <HelpTip :name="t.code.ecName" :id="id('ec-help')">
            <template #head><label :for="id('ec')" class="text-sm font-700 text-ink">{{ t.code.ec }}</label></template>
            <p>{{ t.code.ecHelp }}</p>
          </HelpTip>
          <select :id="id('ec')" v-model="ec" data-test="batch-ec" :aria-describedby="id('ec-help')" class="input-base mt-1">
            <option v-for="lv in ecLevels" :key="lv" :value="lv">{{ ecLabel[lv] }}</option>
          </select>
        </div>

        <!-- .zone-label 在 main.css 有 margin，要用 ! 才蓋得過 -->
        <p class="zone-label !mt-7"><span class="icon-badge-sm bg-pop-mint"><span class="i-lucide-folder-archive" aria-hidden="true" /></span>{{ t.output.title }}</p>
        <HelpTip :name="t.output.helpName" :id="id('output-help')">
          <template #head><span class="text-sm text-muted" aria-hidden="true">{{ t.output.helpHead }}</span></template>
          <p v-for="(h, i) in t.output.help" :key="i">{{ h }}</p>
        </HelpTip>
        <PillGroup v-model="output" :options="outputOptions" name="batch-output" :legend="t.output.legend" :describedby="id('output-help')" test-id="batch-output" />

        <template v-if="output === 'zip'">
          <div class="mt-4">
            <HelpTip :name="t.output.formatName" :id="id('fmt-help')">
              <template #head><span class="text-sm font-700 text-ink" aria-hidden="true">{{ t.output.formatHead }}</span></template>
              <p v-for="(h, i) in t.output.formatHelp" :key="i">{{ h }}</p>
            </HelpTip>
            <PillGroup v-model="format" :options="formatOptions" name="batch-format" :legend="t.output.formatLegend" :describedby="id('fmt-help')" test-id="batch-format" />
          </div>

          <div v-if="!isBarcode" class="mt-3">
            <HelpTip :name="t.output.sizeName" :id="id('size-help')">
              <template #head><label :for="id('size')" class="text-sm font-700 text-ink">{{ t.output.size }}</label></template>
              <p>{{ t.output.sizeHelp }}</p>
            </HelpTip>
            <select :id="id('size')" v-model.number="qrSize" data-test="batch-qr-size" :aria-describedby="id('size-help')" class="input-base mt-1">
              <option v-for="s in qrSizes" :key="s" :value="s">{{ t.output.sizeOption(s) }}</option>
            </select>
          </div>
          <div v-else-if="format === 'png'" class="mt-3">
            <HelpTip :name="t.output.scaleName" :id="id('scale-help')">
              <template #head><label :for="id('scale')" class="text-sm font-700 text-ink">{{ t.output.scale }}</label></template>
              <p>{{ t.output.scaleHelp }}</p>
            </HelpTip>
            <select :id="id('scale')" v-model.number="barcodeScale" data-test="batch-scale" :aria-describedby="id('scale-help')" class="input-base mt-1">
              <option v-for="p in pngPresets" :key="p.id" :value="p.scale">{{ p.label }}</option>
            </select>
          </div>
        </template>
        <p v-else class="text-sm text-ink font-600 mt-3" data-test="batch-label-hint">
          <span class="i-lucide-arrow-down mr-1" aria-hidden="true" />{{ t.output.labelHint }}
        </p>
      </section>
    </div>

    <hr class="border-t-2 border-dashed border-ink/15 my-6" />

    <!-- ③ 檢查結果 -->
    <section :aria-labelledby="id('check-title')" data-test="batch-check">
      <p :id="id('check-title')" class="zone-label"><span class="icon-badge-sm bg-pop-pink"><span class="i-lucide-list-checks" aria-hidden="true" /></span>{{ t.check.title }}</p>
      <p v-if="!checked.length" class="text-sm text-muted font-600">{{ t.check.empty }}</p>
      <template v-else>
        <p class="text-sm font-700 text-ink" data-test="batch-summary">
          {{ t.check.total(checked.length, lineUnit) }}<span class="text-emerald-700">{{ t.check.ready(ready.length) }}</span><template v-if="failed.length">{{ t.check.sep }}<span class="text-rose-600">{{ t.check.failed(failed.length, lineUnit) }}</span></template><template v-if="duplicates.length">{{ t.check.sep }}{{ t.check.duplicates(duplicates.length) }}</template>
        </p>
        <p v-if="appendedCount" class="text-sm text-ink font-600 mt-1" data-test="batch-appended">
          <span class="i-lucide-circle-check mr-1 text-emerald-700" aria-hidden="true" />{{ t.check.appended(appendedCount, gtinDataLen) }}
        </p>
        <p v-if="hasStoreCodes" class="text-sm text-ink font-600 mt-1" data-test="batch-store-code">
          <span class="i-lucide-info mr-1" aria-hidden="true" />{{ t.check.storeCode }}
        </p>
        <!-- 合法的 Code 39，照樣產生；但讀回來可能變成別的字，整批印出去之前一定要知道 -->
        <p v-if="code39ShiftCount" class="text-sm text-ink font-600 mt-1" data-test="batch-code39-shift">
          <span class="i-lucide-triangle-alert mr-1 text-amber-700" aria-hidden="true" />{{ t.check.code39Shift(code39ShiftCount) }}
        </p>

        <div v-if="failed.length" class="mt-3">
          <ul class="list-none p-0 m-0 space-y-1 max-h-64 overflow-y-auto rounded-xl border-2 border-rose-300 bg-rose-50 p-3" data-test="batch-issues">
            <li v-for="r in shownIssues" :key="r.index" class="text-sm text-rose-700 font-600 break-all">
              <span class="font-800">{{ t.check.issueLine(r.line, lineUnit) }}</span><template v-if="r.value">{{ t.check.quote[0] }}<span class="font-mono">{{ clip(r.value) }}</span>{{ t.check.quote[1] }}</template>{{ t.check.issueSep }}{{ r.error }}
            </li>
            <li v-if="failed.length > shownIssues.length" class="text-sm text-rose-700 font-700">{{ t.check.moreIssues(failed.length - shownIssues.length, lineUnit) }}</li>
          </ul>
          <fieldset class="border-0 p-0 m-0 mt-3 min-w-0">
            <legend class="text-sm font-700 text-ink">{{ t.check.onErrorLegend(lineUnit) }}</legend>
            <div class="flex flex-wrap gap-x-5 gap-y-1 mt-1">
              <label class="flex items-center gap-1.5 text-sm font-600 text-ink cursor-pointer">
                <input v-model="onError" type="radio" :name="id('on-error')" value="block" class="accent-brand w-4 h-4" data-test="batch-on-error-block" />{{ t.check.onErrorBlock }}
              </label>
              <label class="flex items-center gap-1.5 text-sm font-600 text-ink cursor-pointer">
                <input v-model="onError" type="radio" :name="id('on-error')" value="skip" class="accent-brand w-4 h-4" data-test="batch-on-error-skip" />{{ t.check.onErrorSkip(lineUnit) }}
              </label>
            </div>
          </fieldset>
        </div>

        <div v-if="duplicates.length" class="mt-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-3" data-test="batch-duplicates">
          <p class="text-sm text-ink font-700"><span class="i-lucide-triangle-alert mr-1 text-amber-700" aria-hidden="true" />{{ t.check.duplicateTitle }}</p>
          <ul class="list-disc pl-5 mt-1 space-y-0.5 text-sm text-ink font-600">
            <li v-for="d in duplicates.slice(0, 10)" :key="d.value" class="break-all">
              {{ t.check.duplicateLine(d.lines.slice(0, 8), d.lines.length > 8, lineUnit) }}{{ t.check.quote[0] }}<span class="font-mono">{{ clip(d.value) }}</span>{{ t.check.quote[1] }}
            </li>
            <li v-if="duplicates.length > 10">{{ t.check.duplicateMore(duplicates.length - 10) }}</li>
          </ul>
        </div>
      </template>
    </section>

    <hr class="border-t-2 border-dashed border-ink/15 my-6" />

    <!-- ④ 預覽與下載（ZIP），或印成標籤紙 -->
    <LabelPrint v-if="output === 'label'" :labels="labels" :line-unit="lineUnit" />
    <section v-else :aria-labelledby="id('dl-title')">
      <p :id="id('dl-title')" class="zone-label"><span class="icon-badge-sm bg-pop-mint"><span class="i-lucide-download" aria-hidden="true" /></span>{{ t.download.title }}</p>
      <BatchPreviewGrid v-if="previewTiles.length" :tiles="previewTiles" :total="ready.length" :wide="isBarcode" />
      <p v-else class="text-sm text-muted font-600">{{ t.download.previewEmpty(PREVIEW_COUNT) }}</p>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <button
          ref="downloadBtn" type="button" data-test="batch-download" class="btn-primary !bg-pop-sun"
          :disabled="!!blocker || busy" :aria-describedby="id('dl-status')" @click="startDownload">
          <span class="i-lucide-download" aria-hidden="true" />{{ downloadLabel }}
        </button>
        <button v-if="busy" ref="cancelBtn" type="button" data-test="batch-cancel" class="chip bg-white !text-sm !px-3 !py-1.5 hover:bg-pop-pink transition" @click="cancel">
          <span class="i-lucide-x" aria-hidden="true" />{{ t.download.cancel }}
        </button>
      </div>

      <div v-if="busy" class="mt-3 max-w-md" data-test="batch-progress">
        <progress class="w-full h-3 accent-brand" :value="progress.done" :max="progress.total || 1" :aria-label="t.download.progressLabel(percent)" />
        <p class="text-xs text-muted font-700 mt-1">{{ t.download.progress(progress.done, progress.total) }}</p>
      </div>

      <!-- 不能下載的原因、下載結果：一律看得到，螢幕閱讀器也會念 -->
      <div :id="id('dl-status')" aria-live="polite" class="mt-2 text-sm font-700 min-h-[1.5rem]" data-test="batch-status">
        <p v-if="exportError" class="text-rose-600"><span class="i-lucide-circle-alert mr-1" aria-hidden="true" />{{ exportError }}</p>
        <p v-else-if="status" class="text-ink"><span class="i-lucide-circle-check mr-1 text-emerald-700" aria-hidden="true" />{{ status }}</p>
        <p v-else-if="blocker && !busy" class="text-muted" data-test="batch-blocker">{{ blocker }}</p>
      </div>
      <p class="text-xs text-muted font-600 mt-1">{{ t.download.footer(BATCH_MAX_ROWS, fileNames[0]) }}</p>
    </section>
  </div>
</template>
