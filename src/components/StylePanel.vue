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
    <div class="flex items-center gap-2.5 flex-wrap">
      <span class="text-sm font-700 text-ink">前景色</span>
      <input data-test="dotColor" type="color" class="w-9 h-9 rounded-lg border-2 border-ink cursor-pointer p-0 bg-white" :value="modelValue.dotColor" @input="patch({ dotColor: ($event.target as HTMLInputElement).value })" />
      <span class="text-sm font-700 text-ink ml-1">背景色</span>
      <input type="color" class="w-9 h-9 rounded-lg border-2 border-ink cursor-pointer p-0 bg-white disabled:opacity-40" :value="modelValue.bgColor === 'transparent' ? '#ffffff' : modelValue.bgColor" :disabled="transparent" @input="patch({ bgColor: ($event.target as HTMLInputElement).value })" />
      <label class="flex items-center gap-1 text-sm font-600 text-ink ml-1 cursor-pointer">
        <input data-test="transparent" type="checkbox" class="accent-brand w-4 h-4" v-model="transparent" />透明
      </label>
    </div>

    <label class="flex items-center gap-2 text-sm font-600 text-ink cursor-pointer">
      <input type="checkbox" class="accent-brand w-4 h-4" :checked="modelValue.useGradient" @change="patch({ useGradient: ($event.target as HTMLInputElement).checked })" />
      🌈 使用漸層
      <input v-if="modelValue.useGradient" type="color" class="w-9 h-9 rounded-lg border-2 border-ink cursor-pointer p-0 bg-white" :value="modelValue.gradientColor" @input="patch({ gradientColor: ($event.target as HTMLInputElement).value })" />
    </label>

    <label class="block">
      <span class="text-sm font-700 text-ink">🖼️ 加入 LOGO</span>
      <input type="file" accept="image/*" class="block mt-1.5 text-sm text-muted file:(mr-2 px-3 py-1.5 rounded-lg border-2 border-ink bg-pop-sun font-700 text-ink cursor-pointer)" @change="onLogo" />
      <button v-if="modelValue.logoDataUrl" class="chip bg-white mt-2 hover:bg-pop-pink transition" @click="patch({ logoDataUrl: null })">✕ 移除 LOGO</button>
    </label>

    <label class="block">
      <span class="text-sm font-700 text-ink">容錯等級</span>
      <select class="input-base mt-1.5" :value="modelValue.errorCorrectionLevel" @change="patch({ errorCorrectionLevel: ($event.target as HTMLSelectElement).value as ErrorCorrectionLevel })">
        <option v-for="lv in ecLevels" :key="lv" :value="lv">{{ ecLabel[lv] }}</option>
      </select>
    </label>

    <label class="block">
      <span class="text-sm font-700 text-ink">尺寸：<span class="text-brand">{{ modelValue.width }}px</span></span>
      <input type="range" min="200" max="2000" step="100" class="w-full mt-1.5 accent-brand" :value="modelValue.width" @input="patch({ width: Number(($event.target as HTMLInputElement).value) })" />
    </label>
  </div>
</template>
