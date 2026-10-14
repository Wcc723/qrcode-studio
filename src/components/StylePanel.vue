<script setup lang="ts">
import { computed, useId } from 'vue'
import type { QrStyleOptions, ErrorCorrectionLevel } from '@/types'
import HelpTip from './HelpTip.vue'
import { useUiCopy } from '@/locales/ui'

const props = defineProps<{ modelValue: QrStyleOptions }>()
const emit = defineEmits<{ 'update:modelValue': [QrStyleOptions] }>()
const uid = useId()
const t = useUiCopy().style

function patch(part: Partial<QrStyleOptions>) {
  emit('update:modelValue', { ...props.modelValue, ...part })
}

const transparent = computed({
  get: () => props.modelValue.bgColor === 'transparent',
  set: (v: boolean) => patch({ bgColor: v ? 'transparent' : '#ffffff' }),
})

// 勾選框與下拉選單一律用 v-model，不用 :checked／:value。整頁載入時 client 會沿用預渲染的 DOM（hydrate），
// hydrate 不會改 <select> 的 value 與勾選框的 checked：SSR 輸出的 <select value="M"> 瀏覽器不認，
// 畫面會停在第一個選項 L；Firefox 重新整理時還會把上一次的勾選還原回來，跟狀態對不上。
// v-model 的 SSR 輸出會在選中的 <option> 加 selected，hydrate 完也會把畫面對回狀態（src/hydration.test.ts）。
const useGradient = computed({
  get: () => props.modelValue.useGradient,
  set: (v: boolean) => patch({ useGradient: v }),
})
const ecLevel = computed({
  get: () => props.modelValue.errorCorrectionLevel,
  set: (v: ErrorCorrectionLevel) => patch({ errorCorrectionLevel: v }),
})

function onLogo(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => patch({ logoDataUrl: String(reader.result), errorCorrectionLevel: 'H' })
  reader.readAsDataURL(file)
}

const ecLevels: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']
const ecLabel = t.ecLabel
</script>

<template>
  <div class="space-y-4">
    <div>
      <HelpTip :name="t.colorName" :id="`${uid}-color-help`">
        <template #head><span :id="`${uid}-color`" class="text-sm font-700 text-ink">{{ t.color }}</span></template>
        <p>{{ t.colorHelp }}</p>
      </HelpTip>
      <div role="group" :aria-labelledby="`${uid}-color`" :aria-describedby="`${uid}-color-help`" class="flex items-center gap-2.5 flex-wrap mt-1.5">
        <label :for="`${uid}-dot`" class="text-sm font-600 text-ink">{{ t.dotColor }}</label>
        <input :id="`${uid}-dot`" data-test="dotColor" type="color" class="w-9 h-9 rounded-lg border-2 border-ink cursor-pointer p-0 bg-white" :value="modelValue.dotColor" @input="patch({ dotColor: ($event.target as HTMLInputElement).value })" />
        <label :for="`${uid}-bg`" class="text-sm font-600 text-ink ml-1">{{ t.bgColor }}</label>
        <input :id="`${uid}-bg`" type="color" class="w-9 h-9 rounded-lg border-2 border-ink cursor-pointer p-0 bg-white disabled:opacity-40" :value="modelValue.bgColor === 'transparent' ? '#ffffff' : modelValue.bgColor" :disabled="transparent" @input="patch({ bgColor: ($event.target as HTMLInputElement).value })" />
        <label class="flex items-center gap-1 text-sm font-600 text-ink ml-1 cursor-pointer">
          <input data-test="transparent" type="checkbox" class="accent-brand w-4 h-4" v-model="transparent" />{{ t.transparent }}
        </label>
      </div>
      <!-- 條件式提醒一律看得到，不收進「?」：勾了透明才出現 -->
      <p v-if="transparent" data-test="transparent-jpg-note" class="text-xs text-muted font-600 mt-1.5">{{ t.transparentNote }}</p>
    </div>

    <label class="flex items-center gap-2 text-sm font-600 text-ink cursor-pointer">
      <input v-model="useGradient" data-test="useGradient" type="checkbox" class="accent-brand w-4 h-4" />
      {{ t.gradient }}
      <input v-if="modelValue.useGradient" type="color" :aria-label="t.gradientColor" class="w-9 h-9 rounded-lg border-2 border-ink cursor-pointer p-0 bg-white" :value="modelValue.gradientColor" @input="patch({ gradientColor: ($event.target as HTMLInputElement).value })" />
    </label>

    <div>
      <HelpTip :name="t.logoName" :id="`${uid}-logo-help`">
        <template #head><label :for="`${uid}-logo`" class="text-sm font-700 text-ink">{{ t.logo }}</label></template>
        <p>{{ t.logoHelp }}</p>
        <p>{{ t.logoHelp2.before }}<RouterLink v-if="t.logoHelp2.link" :to="t.logoHelp2.link.to">{{ t.logoHelp2.link.text }}</RouterLink>{{ t.logoHelp2.after }}</p>
      </HelpTip>
      <input :id="`${uid}-logo`" type="file" accept="image/*" :aria-describedby="`${uid}-logo-help`" class="block mt-1.5 text-sm text-muted file:(mr-2 px-3 py-1.5 rounded-lg border-2 border-ink bg-pop-sun font-700 text-ink cursor-pointer)" @change="onLogo" />
      <button v-if="modelValue.logoDataUrl" type="button" class="chip bg-white mt-2 hover:bg-pop-pink transition" @click="patch({ logoDataUrl: null })"><span class="i-lucide-x" aria-hidden="true" />{{ t.removeLogo }}</button>
    </div>

    <div>
      <HelpTip :name="t.ecName" :id="`${uid}-ec-help`">
        <template #head><label :for="`${uid}-ec`" class="text-sm font-700 text-ink">{{ t.ec }}</label></template>
        <p>{{ t.ecHelp }}</p>
        <p>{{ t.ecHelp2.before }}<RouterLink v-if="t.ecHelp2.link" :to="t.ecHelp2.link.to">{{ t.ecHelp2.link.text }}</RouterLink>{{ t.ecHelp2.after }}</p>
      </HelpTip>
      <select :id="`${uid}-ec`" v-model="ecLevel" data-test="ecLevel" :aria-describedby="`${uid}-ec-help`" class="input-base mt-1.5">
        <option v-for="lv in ecLevels" :key="lv" :value="lv">{{ ecLabel[lv] }}</option>
      </select>
    </div>

    <div>
      <HelpTip :name="t.sizeName" :id="`${uid}-size-help`">
        <template #head><label :for="`${uid}-size`" class="text-sm font-700 text-ink">{{ t.size(modelValue.width).label }}<span class="text-link">{{ t.size(modelValue.width).value }}</span></label></template>
        <p>{{ t.sizeHelp }}</p>
      </HelpTip>
      <input :id="`${uid}-size`" type="range" min="200" max="2000" step="100" :aria-describedby="`${uid}-size-help`" class="w-full mt-1.5 accent-brand" :value="modelValue.width" @input="patch({ width: Number(($event.target as HTMLInputElement).value) })" />
    </div>
  </div>
</template>
