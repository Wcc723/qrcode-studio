<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { BarcodeSymbology } from '@/pure/validateBarcode'
import { takeScanHandoff } from '@/utils/scan-handoff'
import { pngPresets } from '@/config/symbologies'
import { useBarcode } from '@/composables/useBarcode'
import SymbologyPicker from './SymbologyPicker.vue'
import BarcodeValueInput from './BarcodeValueInput.vue'
import BarcodePreview from './BarcodePreview.vue'

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
    <SymbologyPicker v-model="sym" />

    <div class="mt-5 min-w-0">
      <BarcodeValueInput
        v-model="raw" :meta="meta" :error="error" :notice="notice"
        :live-message="liveMessage" @flush="flushMessage" />
    </div>

    <hr class="border-t-2 border-dashed border-ink/15 my-5" />

    <BarcodePreview
      :svg="previewSvg" :pattern="pattern" :error="error"
      :label="meta.label" :print-info="printInfo" />

    <label class="block mt-4">
      <span class="text-sm text-muted">PNG 解析度</span>
      <select v-model.number="scale" data-test="bc-scale" class="input-base mt-1">
        <option v-for="p in pngPresets" :key="p.id" :value="p.scale">{{ p.label }}</option>
      </select>
    </label>
    <p v-if="png" data-test="bc-png-info" class="text-xs text-muted font-600 mt-1">
      PNG {{ png.w }} × {{ png.h }} px，約 {{ png.dpi }} DPI
    </p>

    <div class="grid grid-cols-2 gap-2 mt-4">
      <button data-test="dl-png" class="btn-primary !bg-pop-sun" :disabled="!canDownload"
        @click="downloadPng(scale)">⬇ PNG</button>
      <button data-test="dl-svg" class="btn-primary !bg-pop-mint" :disabled="!canDownload"
        @click="downloadSvg()">⬇ SVG</button>
    </div>
  </div>
</template>
