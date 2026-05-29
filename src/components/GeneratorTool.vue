<script setup lang="ts">
import { ref, computed } from 'vue'
import type { QrType, QrStyleOptions } from '@/types'
import { defaultStyle } from '@/types'
import QrTypeTabs from './QrTypeTabs.vue'
import QrPreview from './QrPreview.vue'
import StylePanel from './StylePanel.vue'
import DownloadBar from './DownloadBar.vue'
import { inputComponents } from './inputs'
import { exceedsQrCapacity } from '@/pure/qrCapacity'

const props = withDefaults(defineProps<{ defaultType?: QrType }>(), { defaultType: 'url' })
const current = ref<QrType>(props.defaultType)
const payload = ref('')
const style = ref<QrStyleOptions>({ ...defaultStyle })
const previewRef = ref<InstanceType<typeof QrPreview> | null>(null)

const activeInput = computed(() => inputComponents[current.value])
const overCapacity = computed(() => !!payload.value && exceedsQrCapacity(payload.value, style.value.errorCorrectionLevel))
function onType(t: QrType) { current.value = t; payload.value = '' }
function download(ext: 'png' | 'svg' | 'jpeg') { previewRef.value?.download(ext) }
async function copy() { await previewRef.value?.copyImage() }
</script>

<template>
  <div class="card p-5 md:p-6">
    <QrTypeTabs :model-value="current" @update:model-value="onType" />
    <div class="grid md:grid-cols-[1fr_auto] gap-6 mt-5">
      <div class="space-y-5 min-w-0">
        <component :is="activeInput" :key="current" @update:payload="payload = $event" />
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
