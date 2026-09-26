<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { QrType, QrStyleOptions } from '@/types'
import type { PayloadInputMap } from '@/pure'
import { defaultStyle } from '@/types'
import { takeScanHandoff } from '@/utils/scan-handoff'
import QrTypeTabs from './QrTypeTabs.vue'
import QrPreview from './QrPreview.vue'
import StylePanel from './StylePanel.vue'
import DownloadBar from './DownloadBar.vue'
import PrivacyNote from './PrivacyNote.vue'
import { inputComponents } from './inputs'
import { exceedsQrCapacity } from '@/pure/qrCapacity'

const props = withDefaults(defineProps<{ defaultType?: QrType }>(), { defaultType: 'url' })
const current = ref<QrType>(props.defaultType)
const payload = ref('')
const style = ref<QrStyleOptions>({ ...defaultStyle })
const previewRef = ref<InstanceType<typeof QrPreview> | null>(null)

// /scan/ 交棒過來的內容。只在瀏覽器端取（SSR 預渲染時不該有任何使用者資料），
// 而且取用一次就清掉：重新整理這一頁就不會再帶內容進來。
const initial = ref<PayloadInputMap[QrType] | undefined>()
// key 要跟著交棒次數變，否則交棒型別剛好等於目前型別時，輸入元件不會重建、
// 也就吃不到 initial。
const handoffSeq = ref(0)
onMounted(() => {
  const handoff = takeScanHandoff()
  // 一維碼不歸這裡管；直接丟掉，不要硬塞進 QR 表單。
  if (handoff?.kind !== 'qr') return
  current.value = handoff.type
  initial.value = handoff.data
  handoffSeq.value++
})

const activeInput = computed(() => inputComponents[current.value])
const overCapacity = computed(() => !!payload.value && exceedsQrCapacity(payload.value, style.value.errorCorrectionLevel))
function onType(t: QrType) { current.value = t; payload.value = ''; initial.value = undefined }
function download(ext: 'png' | 'svg' | 'jpeg') { previewRef.value?.download(ext) }
async function copy() { await previewRef.value?.copyImage() }
</script>

<template>
  <div class="card p-5 md:p-6">
    <PrivacyNote mode="generate" class="mb-4" />
    <QrTypeTabs :model-value="current" @update:model-value="onType" />
    <div class="grid md:grid-cols-[1fr_auto] gap-6 mt-5">
      <div class="space-y-5 min-w-0">
        <component :is="activeInput" :key="`${current}:${handoffSeq}`" :initial="initial"
          @update:payload="payload = $event" />
        <hr class="border-t-2 border-dashed border-ink/15" />
        <StylePanel v-model="style" />
      </div>
      <div class="md:w-72 min-w-0">
        <QrPreview ref="previewRef" :data="payload" :style="style" />
        <DownloadBar :download="download" :copy="copy" :disabled="!payload || overCapacity" />
      </div>
    </div>
  </div>
</template>
