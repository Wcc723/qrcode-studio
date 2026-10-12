<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import type { ErrorCorrectionLevel } from '@/types'
import { useBatch, PREVIEW_COUNT, ISSUE_LIST_LIMIT, type OutputMode } from '@/composables/useBatch'
import { useBatchLabels } from '@/composables/useBatchLabels'
import { symbologies, symbologyById, pngPresets } from '@/config/symbologies'
import { formatCount, MAX_PAD } from '@/pure/batch/sequence'
import { TEMPLATE_TOKEN, applyTemplate } from '@/pure/batch/template'
import { BATCH_MAX_ROWS, type BatchSymbology } from '@/pure/batch/rows'
import HelpTip from '../HelpTip.vue'
import PrivacyNote from '../PrivacyNote.vue'
import PillGroup from './PillGroup.vue'
import BatchPreviewGrid from './BatchPreviewGrid.vue'
import LabelPrint from './LabelPrint.vue'

const uid = useId()
const id = (name: string) => `${uid}-${name}`

const {
  mode, lineUnit, pasteText, linesText, seq, hasHeader, contentCol, nameCol, linesName, seqName,
  template, symbology, ec, onError, output, format, qrSize, barcodeScale,
  table, headerCells, columns, sequence, sequenceShown, sourceRows, linesLookTabular,
  templateCheck, checked, ready, failed, duplicates, appendedCount, hasStoreCodes, code39ShiftCount, fileNames, blocker,
  previewTiles, busy, progress, status, exportError, download, cancel,
} = useBatch()

// 標籤紙的設定跟著工具卡：切回「下載 ZIP」再切回來，型號、起始格、位移都還在
const labels = useBatchLabels({ ready, mode, table, headerCells, columns, contentCol, symbology, ec, blocker, lineUnit })

const modeOptions = [
  { value: 'paste', label: '從 Excel 貼上' },
  { value: 'lines', label: '每行一筆' },
  { value: 'sequence', label: '連號' },
] as const

const symbologyOptions: { value: BatchSymbology; label: string }[] = [
  { value: 'qr', label: 'QR Code' },
  ...symbologies.map(s => ({ value: s.id, label: s.label })),
]

const outputOptions: { value: OutputMode; label: string }[] = [
  { value: 'zip', label: '下載 ZIP' },
  { value: 'label', label: '印成 A4 標籤紙' },
]

const formatOptions = [
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' },
] as const

const ecLevels: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']
const ecLabel: Record<ErrorCorrectionLevel, string> = {
  L: '低：圖案最簡單（螢幕上用）', M: '中：一般用途（建議）', Q: '較高：戶外、貼紙', H: '最高：容易磨損的地方',
}
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
  ? '可以放網址或文字，中文也可以；內容越長，方塊越多越細。'
  : symbologyById[symbology.value as Exclude<BatchSymbology, 'qr'>].rule))

const templateExample = computed(() => {
  if (!templateCheck.value.ok || templateCheck.value.empty) return null
  const first = sourceRows.value.find(r => r.value)
  return applyTemplate(template.value, first?.value ?? 'TP-0001')
})

function insertToken() {
  template.value = `${template.value}${TEMPLATE_TOKEN}`
}

const shownIssues = computed(() => failed.value.slice(0, ISSUE_LIST_LIMIT))

const downloadLabel = computed(() => (ready.value.length
  ? `下載 ZIP（${formatCount(ready.value.length)} 張 ${format.value === 'png' ? 'PNG' : 'SVG'}）`
  : '下載 ZIP'))
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
        <p :id="id('input-title')" class="zone-label"><span class="icon-badge-sm bg-pop-sun"><span class="i-lucide-clipboard-list" aria-hidden="true" /></span>輸入清單</p>
        <HelpTip name="輸入方式" :id="id('mode-help')">
          <template #head><span class="text-sm text-muted" aria-hidden="true">輸入方式</span></template>
          <ul>
            <li><strong>從 Excel 貼上</strong>：在 Excel 或 Google 試算表選取整塊儲存格（可以含欄名那一列）複製後貼上，再選哪一欄要做成碼、哪一欄當檔名。</li>
            <li><strong>每行一筆</strong>：一行一個網址或編號，空白行會略過。</li>
            <li><strong>連號</strong>：前綴加數字加後綴，例如 TP-0001 到 TP-0500，不必先在 Excel 拉好。</li>
          </ul>
        </HelpTip>
        <PillGroup v-model="mode" :options="modeOptions" name="batch-mode" legend="輸入方式" :describedby="id('mode-help')" test-id="batch-mode" />

        <!-- 從 Excel 貼上 -->
        <div v-if="mode === 'paste'" class="mt-4">
          <label :for="id('paste')" class="text-sm font-700 text-ink">貼上 Excel 的儲存格</label>
          <textarea
            :id="id('paste')" v-model="pasteText" data-test="batch-paste" rows="8" wrap="off" spellcheck="false"
            autocomplete="off" autocapitalize="off" :aria-describedby="id('paste-hint')"
            class="input-base mt-1 font-mono text-sm leading-relaxed"
            placeholder="財產編號	名稱	保管單位&#10;TP-0001	筆記型電腦	總務處&#10;TP-0002	投影機	教務處" />
          <p :id="id('paste-hint')" class="text-xs text-muted font-600 mt-1">欄與欄之間是 Tab（直接從試算表複製就是），儲存格裡有換行也沒關係。</p>

          <div v-if="table.columnCount" class="grid gap-3 sm:grid-cols-2 mt-3" data-test="batch-columns">
            <label class="sm:col-span-2 flex items-center gap-2 text-sm font-600 text-ink cursor-pointer">
              <input v-model="hasHeader" data-test="batch-has-header" type="checkbox" class="accent-brand w-4 h-4" />第一列是欄名（不做成碼）
            </label>
            <div class="min-w-0">
              <label :for="id('content-col')" class="text-sm font-700 text-ink">內容欄（做成碼的那一欄）</label>
              <select :id="id('content-col')" v-model.number="contentCol" data-test="batch-content-col" class="input-base mt-1">
                <option v-for="c in columns" :key="c.index" :value="c.index">{{ c.label }}</option>
              </select>
            </div>
            <div class="min-w-0">
              <label :for="id('name-col')" class="text-sm font-700 text-ink">檔名欄</label>
              <select :id="id('name-col')" v-model.number="nameCol" data-test="batch-name-col" class="input-base mt-1">
                <option :value="-1">流水號（001、002…）</option>
                <option v-for="c in columns" :key="c.index" :value="c.index">{{ c.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 每行一筆 -->
        <div v-else-if="mode === 'lines'" class="mt-4">
          <label :for="id('lines')" class="text-sm font-700 text-ink">一行一筆</label>
          <textarea
            :id="id('lines')" v-model="linesText" data-test="batch-lines" rows="8" wrap="off" spellcheck="false"
            autocomplete="off" autocapitalize="off" :aria-describedby="id('lines-hint')"
            class="input-base mt-1 font-mono text-sm leading-relaxed"
            placeholder="https://example.com/menu/table-01&#10;https://example.com/menu/table-02" />
          <p :id="id('lines-hint')" class="text-xs text-muted font-600 mt-1">一行做成一張，空白行會略過。</p>
          <p v-if="linesLookTabular" data-test="batch-lines-tab" class="text-sm text-ink font-700 mt-1">
            <span class="i-lucide-info mr-1" aria-hidden="true" />有幾行裡有 Tab，看起來是從試算表貼了好幾欄。要選哪一欄做成碼，請改用「從 Excel 貼上」。
          </p>
          <label :for="id('lines-name')" class="block text-sm font-700 text-ink mt-3">檔名</label>
          <select :id="id('lines-name')" v-model="linesName" data-test="batch-lines-name" class="input-base mt-1">
            <option value="value">用這一行的內容</option>
            <option value="serial">流水號（001、002…）</option>
          </select>
        </div>

        <!-- 連號 -->
        <div v-else class="mt-4" data-test="batch-sequence">
          <div class="grid grid-cols-2 gap-3">
            <label class="min-w-0 text-sm font-700 text-ink">前綴
              <input v-model="seq.prefix" data-test="seq-prefix" type="text" class="input-base mt-1 font-mono" placeholder="TP-" autocomplete="off" spellcheck="false" />
            </label>
            <label class="min-w-0 text-sm font-700 text-ink">後綴
              <input v-model="seq.suffix" data-test="seq-suffix" type="text" class="input-base mt-1 font-mono" placeholder="（選填）" autocomplete="off" spellcheck="false" />
            </label>
            <label class="min-w-0 text-sm font-700 text-ink">起始值
              <input v-model="seq.start" data-test="seq-start" type="text" inputmode="numeric" class="input-base mt-1 font-mono" :aria-invalid="!sequence.ok && sequence.field === 'start'" autocomplete="off" />
            </label>
            <label class="min-w-0 text-sm font-700 text-ink">增量
              <input v-model="seq.step" data-test="seq-step" type="text" inputmode="numeric" class="input-base mt-1 font-mono" :aria-invalid="!sequence.ok && sequence.field === 'step'" autocomplete="off" />
            </label>
          </div>
          <fieldset class="border-0 p-0 m-0 mt-3 min-w-0">
            <legend class="text-sm font-700 text-ink">做到哪裡</legend>
            <div class="grid grid-cols-2 gap-3 mt-1">
              <div class="min-w-0">
                <label class="flex items-center gap-1.5 text-sm font-600 text-ink cursor-pointer">
                  <input v-model="seq.until" type="radio" :name="id('until')" value="count" class="accent-brand w-4 h-4" data-test="seq-until-count" />數量
                </label>
                <input v-model="seq.count" data-test="seq-count" type="text" inputmode="numeric" aria-label="數量" class="input-base mt-1 font-mono" :disabled="seq.until !== 'count'" :aria-invalid="!sequence.ok && sequence.field === 'count'" autocomplete="off" />
              </div>
              <div class="min-w-0">
                <label class="flex items-center gap-1.5 text-sm font-600 text-ink cursor-pointer">
                  <input v-model="seq.until" type="radio" :name="id('until')" value="end" class="accent-brand w-4 h-4" data-test="seq-until-end" />結束值
                </label>
                <input v-model="seq.end" data-test="seq-end" type="text" inputmode="numeric" aria-label="結束值" class="input-base mt-1 font-mono" :disabled="seq.until !== 'end'" :aria-invalid="!sequence.ok && sequence.field === 'end'" autocomplete="off" />
              </div>
            </div>
          </fieldset>
          <div class="grid grid-cols-2 gap-3 mt-3">
            <label class="min-w-0 text-sm font-700 text-ink">補零到幾位
              <input v-model="seq.pad" data-test="seq-pad" type="text" inputmode="numeric" class="input-base mt-1 font-mono" :aria-invalid="!sequence.ok && sequence.field === 'pad'" autocomplete="off" />
            </label>
            <label class="min-w-0 text-sm font-700 text-ink">檔名
              <select v-model="seqName" data-test="seq-name" class="input-base mt-1">
                <option value="value">用連號</option>
                <option value="serial">流水號（001、002…）</option>
              </select>
            </label>
          </div>
          <p class="text-xs text-muted font-600 mt-1">補零：4 位時 1 會寫成 0001，0 或留白就不補（最多 {{ MAX_PAD }} 位）。</p>
          <!-- 即時顯示前三筆與最後一筆；錯誤一律看得到 -->
          <div class="mt-2 text-sm font-700 min-h-[1.5rem]" aria-live="polite" data-test="seq-preview">
            <p v-if="!sequence.ok" class="text-rose-600 break-all"><span class="i-lucide-circle-alert mr-1" aria-hidden="true" />{{ sequence.error }}</p>
            <p v-else-if="sequenceShown" class="text-ink break-words">
              <template v-for="(v, i) in sequenceShown.head" :key="i"><template v-if="i">、</template><span class="font-mono">{{ v }}</span></template><template v-if="sequenceShown.last"> … <span class="font-mono">{{ sequenceShown.last }}</span></template>
              <span class="text-muted font-600">（共 {{ formatCount(sequence.values.length) }} 筆）</span>
            </p>
          </div>
          <p v-if="isGtin" class="text-xs text-ink font-700 mt-1" data-test="seq-gtin-hint">
            <span class="i-lucide-info mr-1" aria-hidden="true" />{{ symLabel }} 請讓連號產生 {{ gtinDataLen }} 位數字，每一筆的檢查碼會自動算好補上。<template v-if="symbology === 'ean13'">例如店內碼：前綴 20、補零 10 位。</template>
          </p>
        </div>

        <!-- 內容範本 -->
        <div class="mt-5">
          <HelpTip name="內容範本" :id="id('tpl-help')">
            <template #head><label :for="id('tpl')" class="text-sm font-700 text-ink">內容範本（選填）</label></template>
            <p>每一張都是同一個網址、只有最後的編號不一樣時用：把網址貼進來，編號的位置改成 {{ TEMPLATE_TOKEN }}，例如 https://example.com/asset/{{ TEMPLATE_TOKEN }}。</p>
            <p>Google 表單的預填連結也可以：在表單的「取得預先填入的連結」隨便填一個示範值、複製連結，把網址裡的示範值換成 {{ TEMPLATE_TOKEN }}。</p>
            <p>範本是網址時，代入的值會自動轉成網址可用的寫法，空白、中文、&amp; 這些字不會把網址弄壞。不需要就留白，每一列的值會直接做成碼。</p>
          </HelpTip>
          <div class="flex gap-2 mt-1">
            <input
              :id="id('tpl')" v-model="template" data-test="batch-template" type="text" inputmode="url"
              class="input-base font-mono text-sm min-w-0" placeholder="https://example.com/asset/{編號}"
              autocomplete="off" autocapitalize="off" spellcheck="false"
              :aria-invalid="!templateCheck.ok" :aria-describedby="`${id('tpl-help')} ${id('tpl-status')}`" />
            <button type="button" class="chip bg-white shrink-0 hover:bg-pop-sun transition" data-test="batch-insert-token" @click="insertToken">
              <span class="i-lucide-plus" aria-hidden="true" /><span class="sr-only">插入</span>{{ TEMPLATE_TOKEN }}
            </button>
          </div>
          <div :id="id('tpl-status')" class="text-xs font-700 mt-1 min-h-[1.25rem]">
            <p v-if="!templateCheck.ok" class="text-rose-600 text-sm" data-test="batch-template-error"><span class="i-lucide-circle-alert mr-1" aria-hidden="true" />{{ templateCheck.error }}</p>
            <p v-else-if="templateExample" class="text-muted break-all" data-test="batch-template-example">第一張的內容：<span class="font-mono text-ink">{{ templateExample }}</span></p>
          </div>
        </div>
      </section>

      <!-- ② 碼的種類與輸出 -->
      <section class="min-w-0" :aria-labelledby="id('code-title')">
        <p :id="id('code-title')" class="zone-label"><span class="icon-badge-sm bg-pop-sky"><span class="i-lucide-qr-code" aria-hidden="true" /></span>碼的種類</p>
        <HelpTip name="碼的種類" :id="id('sym-help')">
          <template #head><span class="text-sm text-muted" aria-hidden="true">QR Code 或條碼</span></template>
          <ul>
            <li><strong>QR Code</strong>：網址、文字、Google 表單連結，手機相機就能掃。</li>
            <li v-for="s in symbologies" :key="s.id"><strong>{{ s.label }}</strong>：{{ s.about }}</li>
          </ul>
          <p>不確定用哪個：要給手機掃開網頁就選 QR Code；財產、倉儲這類給掃描槍讀編號的選 Code 128；商品零售結帳用 EAN-13。</p>
        </HelpTip>
        <PillGroup v-model="symbology" :options="symbologyOptions" name="batch-symbology" legend="碼的種類" :describedby="id('sym-help')" test-id="batch-sym" />
        <p class="text-xs text-muted font-600 mt-2" data-test="batch-rule">{{ rule }}</p>

        <div v-if="!isBarcode" class="mt-4">
          <HelpTip name="耐髒程度" :id="id('ec-help')">
            <template #head><label :for="id('ec')" class="text-sm font-700 text-ink">耐髒程度（容錯等級）</label></template>
            <p>被弄髒、磨損還掃不掃得出來：L、M、Q、H 被遮住約 7%、15%、25%、30% 還能掃。等級越高，方塊越多越細；一般用途維持 M，貼在戶外或容易磨損的標籤選 Q。</p>
          </HelpTip>
          <select :id="id('ec')" v-model="ec" data-test="batch-ec" :aria-describedby="id('ec-help')" class="input-base mt-1">
            <option v-for="lv in ecLevels" :key="lv" :value="lv">{{ ecLabel[lv] }}</option>
          </select>
        </div>

        <!-- .zone-label 在 main.css 有 margin，要用 ! 才蓋得過 -->
        <p class="zone-label !mt-7"><span class="icon-badge-sm bg-pop-mint"><span class="i-lucide-folder-archive" aria-hidden="true" /></span>輸出方式</p>
        <HelpTip name="輸出方式" :id="id('output-help')">
          <template #head><span class="text-sm text-muted" aria-hidden="true">下載圖檔，或直接印在標籤紙上</span></template>
          <p>下載 ZIP：每一筆一個圖檔，打包成一個 ZIP，適合放進 Word、簡報或送印刷廠。</p>
          <p>印成 A4 標籤紙：照鶴屋、龍德的標籤紙型號排好，碼旁邊可以加一到三行字，用瀏覽器直接印在貼紙上；可以從第幾格開始印，用掉一半的標籤紙也能接著用。</p>
        </HelpTip>
        <PillGroup v-model="output" :options="outputOptions" name="batch-output" legend="輸出方式" :describedby="id('output-help')" test-id="batch-output" />

        <template v-if="output === 'zip'">
          <div class="mt-4">
            <HelpTip name="下載格式" :id="id('fmt-help')">
              <template #head><span class="text-sm font-700 text-ink" aria-hidden="true">每一張的檔案格式</span></template>
              <p>PNG 是一般圖片，Word、簡報、通訊軟體都能直接用。SVG 是向量圖，放大縮小都不會糊，適合送印刷與排版軟體；條碼的 SVG 帶有毫米尺寸，置入排版軟體就是標準大小。</p>
              <p>全部的檔案會打包成一個 ZIP，解壓縮後就是一張一張的圖。</p>
            </HelpTip>
            <PillGroup v-model="format" :options="formatOptions" name="batch-format" legend="下載格式" :describedby="id('fmt-help')" test-id="batch-format" />
          </div>

          <div v-if="!isBarcode" class="mt-3">
            <HelpTip name="圖片大小" :id="id('size-help')">
              <template #head><label :for="id('size')" class="text-sm font-700 text-ink">圖片大小</label></template>
              <p>每張 PNG 的寬高（像素），四周至少 4 格小方塊寬的留白（靜區）也算在裡面。以一般印刷品的精細度（300 dpi）換算，600 像素大約可以印 5 公分、1000 像素大約 8.5 公分。SVG 是向量圖，這個數字只是置入文件時的預設大小。</p>
            </HelpTip>
            <select :id="id('size')" v-model.number="qrSize" data-test="batch-qr-size" :aria-describedby="id('size-help')" class="input-base mt-1">
              <option v-for="s in qrSizes" :key="s" :value="s">{{ s }} × {{ s }} 像素</option>
            </select>
          </div>
          <div v-else-if="format === 'png'" class="mt-3">
            <HelpTip name="PNG 清晰度" :id="id('scale-help')">
              <template #head><label :for="id('scale')" class="text-sm font-700 text-ink">PNG 清晰度</label></template>
              <p>網頁用、一般列印、高品質印刷分別讓最細的線佔 2、4、8 像素。PNG 檔不會記錄該印多大，拉進 Word 這類軟體隨手縮放，線會被壓得太細而掃不到；需要精確尺寸時請下載 SVG。</p>
            </HelpTip>
            <select :id="id('scale')" v-model.number="barcodeScale" data-test="batch-scale" :aria-describedby="id('scale-help')" class="input-base mt-1">
              <option v-for="p in pngPresets" :key="p.id" :value="p.scale">{{ p.label }}</option>
            </select>
          </div>
        </template>
        <p v-else class="text-sm text-ink font-600 mt-3" data-test="batch-label-hint">
          <span class="i-lucide-arrow-down mr-1" aria-hidden="true" />標籤紙型號、從第幾格開始、每格的字與位移，在下方「印成 A4 標籤紙」設定。
        </p>
      </section>
    </div>

    <hr class="border-t-2 border-dashed border-ink/15 my-6" />

    <!-- ③ 檢查結果 -->
    <section :aria-labelledby="id('check-title')" data-test="batch-check">
      <p :id="id('check-title')" class="zone-label"><span class="icon-badge-sm bg-pop-pink"><span class="i-lucide-list-checks" aria-hidden="true" /></span>檢查結果</p>
      <p v-if="!checked.length" class="text-sm text-muted font-600">輸入清單之後，這裡會逐列檢查：太長、位數不對、檢查碼（條碼最後一位）不符、不支援的字元、空白。</p>
      <template v-else>
        <p class="text-sm font-700 text-ink" data-test="batch-summary">
          共 {{ formatCount(checked.length) }} {{ lineUnit }}：<span class="text-emerald-700">{{ formatCount(ready.length) }} 筆可以產生</span><template v-if="failed.length">、<span class="text-rose-600">{{ formatCount(failed.length) }} {{ lineUnit }}有問題</span></template><template v-if="duplicates.length">、{{ formatCount(duplicates.length) }} 組內容重複</template>
        </p>
        <p v-if="appendedCount" class="text-sm text-ink font-600 mt-1" data-test="batch-appended">
          <span class="i-lucide-circle-check mr-1 text-emerald-700" aria-hidden="true" />{{ formatCount(appendedCount) }} 筆只有 {{ gtinDataLen }} 位，已自動補上檢查碼，下面的預覽與檔名都是補好的完整號碼。
        </p>
        <p v-if="hasStoreCodes" class="text-sm text-ink font-600 mt-1" data-test="batch-store-code">
          <span class="i-lucide-info mr-1" aria-hidden="true" />20 到 29 開頭的 EAN-13 是店內碼，只在你自己的店裡有效，不能拿去通路上架；要上架請向 GS1 台灣申請正式的商品條碼。
        </p>
        <!-- 合法的 Code 39，照樣產生；但讀回來可能變成別的字，整批印出去之前一定要知道 -->
        <p v-if="code39ShiftCount" class="text-sm text-ink font-600 mt-1" data-test="batch-code39-shift">
          <span class="i-lucide-triangle-alert mr-1 text-amber-700" aria-hidden="true" />有 {{ formatCount(code39ShiftCount) }} 筆內容含 $ / + % 這幾個符號，有些掃描器會把它們跟下一個字合在一起讀，讀出來可能跟你輸入的不一樣。要給機器讀取時，請先實際掃一張，或改用 Code 128。
        </p>

        <div v-if="failed.length" class="mt-3">
          <ul class="list-none p-0 m-0 space-y-1 max-h-64 overflow-y-auto rounded-xl border-2 border-rose-300 bg-rose-50 p-3" data-test="batch-issues">
            <li v-for="r in shownIssues" :key="r.index" class="text-sm text-rose-700 font-600 break-all">
              <span class="font-800">第 {{ r.line }} {{ lineUnit }}</span><template v-if="r.value">「<span class="font-mono">{{ clip(r.value) }}</span>」</template>：{{ r.error }}
            </li>
            <li v-if="failed.length > shownIssues.length" class="text-sm text-rose-700 font-700">還有 {{ formatCount(failed.length - shownIssues.length) }} {{ lineUnit }}有問題沒列出來。</li>
          </ul>
          <fieldset class="border-0 p-0 m-0 mt-3 min-w-0">
            <legend class="text-sm font-700 text-ink">有問題的{{ lineUnit }}要怎麼處理</legend>
            <div class="flex flex-wrap gap-x-5 gap-y-1 mt-1">
              <label class="flex items-center gap-1.5 text-sm font-600 text-ink cursor-pointer">
                <input v-model="onError" type="radio" :name="id('on-error')" value="block" class="accent-brand w-4 h-4" data-test="batch-on-error-block" />全部修好才產生
              </label>
              <label class="flex items-center gap-1.5 text-sm font-600 text-ink cursor-pointer">
                <input v-model="onError" type="radio" :name="id('on-error')" value="skip" class="accent-brand w-4 h-4" data-test="batch-on-error-skip" />略過有問題的{{ lineUnit }}
              </label>
            </div>
          </fieldset>
        </div>

        <div v-if="duplicates.length" class="mt-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-3" data-test="batch-duplicates">
          <p class="text-sm text-ink font-700"><span class="i-lucide-triangle-alert mr-1 text-amber-700" aria-hidden="true" />內容重複（只是提醒，照樣會產生）：</p>
          <ul class="list-disc pl-5 mt-1 space-y-0.5 text-sm text-ink font-600">
            <li v-for="d in duplicates.slice(0, 10)" :key="d.value" class="break-all">
              第 {{ d.lines.slice(0, 8).join('、') }}{{ d.lines.length > 8 ? ' 等' : '' }} {{ lineUnit }}都是「<span class="font-mono">{{ clip(d.value) }}</span>」
            </li>
            <li v-if="duplicates.length > 10">還有 {{ formatCount(duplicates.length - 10) }} 組。</li>
          </ul>
        </div>
      </template>
    </section>

    <hr class="border-t-2 border-dashed border-ink/15 my-6" />

    <!-- ④ 預覽與下載（ZIP），或印成 A4 標籤紙 -->
    <LabelPrint v-if="output === 'label'" :labels="labels" :line-unit="lineUnit" />
    <section v-else :aria-labelledby="id('dl-title')">
      <p :id="id('dl-title')" class="zone-label"><span class="icon-badge-sm bg-pop-mint"><span class="i-lucide-download" aria-hidden="true" /></span>預覽與下載</p>
      <BatchPreviewGrid v-if="previewTiles.length" :tiles="previewTiles" :total="ready.length" :wide="isBarcode" />
      <p v-else class="text-sm text-muted font-600">可以產生的前 {{ PREVIEW_COUNT }} 張會顯示在這裡。</p>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <button
          ref="downloadBtn" type="button" data-test="batch-download" class="btn-primary !bg-pop-sun"
          :disabled="!!blocker || busy" :aria-describedby="id('dl-status')" @click="startDownload">
          <span class="i-lucide-download" aria-hidden="true" />{{ downloadLabel }}
        </button>
        <button v-if="busy" ref="cancelBtn" type="button" data-test="batch-cancel" class="chip bg-white !text-sm !px-3 !py-1.5 hover:bg-pop-pink transition" @click="cancel">
          <span class="i-lucide-x" aria-hidden="true" />取消
        </button>
      </div>

      <div v-if="busy" class="mt-3 max-w-md" data-test="batch-progress">
        <progress class="w-full h-3 accent-brand" :value="progress.done" :max="progress.total || 1" :aria-label="`正在產生，已完成 ${percent}%`" />
        <p class="text-xs text-muted font-700 mt-1">正在產生 {{ formatCount(progress.done) }} / {{ formatCount(progress.total) }} 張…</p>
      </div>

      <!-- 不能下載的原因、下載結果：一律看得到，螢幕閱讀器也會念 -->
      <div :id="id('dl-status')" aria-live="polite" class="mt-2 text-sm font-700 min-h-[1.5rem]" data-test="batch-status">
        <p v-if="exportError" class="text-rose-600"><span class="i-lucide-circle-alert mr-1" aria-hidden="true" />{{ exportError }}</p>
        <p v-else-if="status" class="text-ink"><span class="i-lucide-circle-check mr-1 text-emerald-700" aria-hidden="true" />{{ status }}</p>
        <p v-else-if="blocker && !busy" class="text-muted" data-test="batch-blocker">{{ blocker }}</p>
      </div>
      <p class="text-xs text-muted font-600 mt-1">一次最多 {{ formatCount(BATCH_MAX_ROWS) }} 筆；更多請分批產生。檔名{{ fileNames.length ? `像是 ${fileNames[0]}` : '來自檔名欄或流水號' }}，重複的會自動加上 (2)、(3)。</p>
    </section>
  </div>
</template>
