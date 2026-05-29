<script setup lang="ts">
import { computed } from 'vue'
import type { QrStyleOptions, ErrorCorrectionLevel } from '@/types'

const props = defineProps<{ modelValue: QrStyleOptions }>()
const emit = defineEmits<{ 'update:modelValue': [QrStyleOptions] }>()

function patch(part: Partial<QrStyleOptions>) {
  emit('update:modelValue', { ...props.modelValue, ...part })
}

const transparent = computed({
  get: () => props.modelValue.bgColor === 'transparent',
  set: (v: boolean) => patch({ bgColor: v ? 'transparent' : '#ffffff' }),
})

function onLogo(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => patch({ logoDataUrl: String(reader.result), errorCorrectionLevel: 'H' })
  reader.readAsDataURL(file)
}

const ecLevels: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']
const ecLabel: Record<ErrorCorrectionLevel, string> = {
  L: '低（圖最簡潔）', M: '中（建議）', Q: '較高', H: '最高（適合加 LOGO）',
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <label class="text-sm text-muted">前景色</label>
      <input data-test="dotColor" type="color" :value="modelValue.dotColor" @input="patch({ dotColor: ($event.target as HTMLInputElement).value })" />
      <label class="text-sm text-muted ml-2">背景色</label>
      <input type="color" :value="modelValue.bgColor === 'transparent' ? '#ffffff' : modelValue.bgColor" :disabled="transparent" @input="patch({ bgColor: ($event.target as HTMLInputElement).value })" />
      <label class="flex items-center gap-1 text-sm text-muted ml-2">
        <input data-test="transparent" type="checkbox" v-model="transparent" />透明
      </label>
    </div>

    <label class="flex items-center gap-2 text-sm text-muted">
      <input type="checkbox" :checked="modelValue.useGradient" @change="patch({ useGradient: ($event.target as HTMLInputElement).checked })" />
      使用漸層
      <input v-if="modelValue.useGradient" type="color" :value="modelValue.gradientColor" @input="patch({ gradientColor: ($event.target as HTMLInputElement).value })" />
    </label>

    <label class="block">
      <span class="text-sm text-muted">加入 LOGO</span>
      <input type="file" accept="image/*" class="block mt-1 text-sm" @change="onLogo" />
      <button v-if="modelValue.logoDataUrl" class="text-xs text-brand mt-1" @click="patch({ logoDataUrl: null })">移除 LOGO</button>
    </label>

    <label class="block">
      <span class="text-sm text-muted">容錯等級</span>
      <select class="input-base mt-1" :value="modelValue.errorCorrectionLevel" @change="patch({ errorCorrectionLevel: ($event.target as HTMLSelectElement).value as ErrorCorrectionLevel })">
        <option v-for="lv in ecLevels" :key="lv" :value="lv">{{ ecLabel[lv] }}</option>
      </select>
    </label>

    <label class="block">
      <span class="text-sm text-muted">尺寸：{{ modelValue.width }}px</span>
      <input type="range" min="200" max="2000" step="100" class="w-full" :value="modelValue.width" @input="patch({ width: Number(($event.target as HTMLInputElement).value) })" />
    </label>
  </div>
</template>
