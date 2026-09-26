<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { BarcodeSymbology } from '@/pure/validateBarcode'
import { takeScanHandoff } from '@/utils/scan-handoff'
import { pngPresets } from '@/config/symbologies'
import { useBarcode } from '@/composables/useBarcode'
import SymbologyPicker from './SymbologyPicker.vue'
import BarcodeValueInput from './BarcodeValueInput.vue'
import BarcodePreview from './BarcodePreview.vue'
import HelpTip from '../HelpTip.vue'
import PrivacyNote from '../PrivacyNote.vue'

const sym = ref<BarcodeSymbology>('code128')
const raw = ref('')
const scale = ref(4)

const {
  error, notice, pattern, previewSvg, printInfo, pngSize,
  downloadSvg, downloadPng, liveMessage, flushMessage, meta, canDownload,
} = useBarcode(raw, sym)

// /scan/ 交棒過來的一維碼。只在瀏覽器端取、取一次就清掉；
// QR 的交棒不歸這裡管，直接丟掉而不是硬塞進條碼輸入框。
onMounted(() => {
  const handoff = takeScanHandoff()
  if (handoff?.kind !== 'barcode') return
  sym.value = handoff.symbology
  raw.value = handoff.value
})

const png = computed(() => pngSize(scale.value))
</script>

<template>
  <div class="card p-5 md:p-6">
    <PrivacyNote mode="barcode" class="mb-5" />
    <p class="zone-label"><span class="icon-badge-sm bg-pop-sun"><span class="i-lucide-pencil" aria-hidden="true" /></span>輸入內容</p>
    <SymbologyPicker v-model="sym" />

    <div class="mt-5 min-w-0">
      <BarcodeValueInput
        v-model="raw" :meta="meta" :error="error" :notice="notice"
        :live-message="liveMessage" @flush="flushMessage" />
    </div>

    <hr class="border-t-2 border-dashed border-ink/15 my-5" />

    <p class="zone-label"><span class="icon-badge-sm bg-pop-mint"><span class="i-lucide-barcode" aria-hidden="true" /></span>預覽與下載</p>

    <BarcodePreview
      :svg="previewSvg" :pattern="pattern" :error="error"
      :label="meta.label" :print-info="printInfo" />

    <div class="mt-4">
      <HelpTip name="PNG 解析度" id="bc-scale-help">
        <template #head><label for="bc-scale" class="text-sm text-muted">PNG 解析度</label></template>
        <p>網頁用、列印、高解析印刷分別讓最細的一條佔 2、4、8 像素。下面的 DPI 是照「建議列印寬度」印出來時的解析度。</p>
        <p>PNG 檔案本身不記錄每英吋點數，拉進 Word 這類軟體隨手縮放，條就會被壓得太細而掃不到；需要精確尺寸時請下載 SVG，它的寬高以毫米標示。</p>
      </HelpTip>
      <select id="bc-scale" v-model.number="scale" data-test="bc-scale" aria-describedby="bc-scale-help" class="input-base mt-1">
        <option v-for="p in pngPresets" :key="p.id" :value="p.scale">{{ p.label }}</option>
      </select>
    </div>
    <p v-if="png" data-test="bc-png-info" class="text-xs text-muted font-600 mt-1">
      PNG {{ png.w }} × {{ png.h }} px，約 {{ png.dpi }} DPI
    </p>

    <div class="grid grid-cols-2 gap-2 mt-4">
      <button data-test="dl-png" class="btn-primary !bg-pop-sun" :disabled="!canDownload"
        @click="downloadPng(scale)"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">下載 </span>PNG</button>
      <button data-test="dl-svg" class="btn-primary !bg-pop-mint" :disabled="!canDownload"
        @click="downloadSvg()"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">下載 </span>SVG</button>
    </div>
  </div>
</template>
