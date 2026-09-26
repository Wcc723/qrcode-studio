<script setup lang="ts">
import { computed, useId } from 'vue'
import type { QrStyleOptions, ErrorCorrectionLevel } from '@/types'
import HelpTip from './HelpTip.vue'

const props = defineProps<{ modelValue: QrStyleOptions }>()
const emit = defineEmits<{ 'update:modelValue': [QrStyleOptions] }>()
const uid = useId()

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
    <div>
      <HelpTip name="顏色" :id="`${uid}-color-help`">
        <template #head><span :id="`${uid}-color`" class="text-sm font-700 text-ink">顏色</span></template>
        <p>相機靠明暗差判讀：請維持深色的方塊、淺色的背景，用漸層時兩端的顏色也都要夠深。淺色方塊配深色背景（反白）很多掃描器讀不出來。</p>
      </HelpTip>
      <div role="group" :aria-labelledby="`${uid}-color`" :aria-describedby="`${uid}-color-help`" class="flex items-center gap-2.5 flex-wrap mt-1.5">
        <label :for="`${uid}-dot`" class="text-sm font-600 text-ink">前景色</label>
        <input :id="`${uid}-dot`" data-test="dotColor" type="color" class="w-9 h-9 rounded-lg border-2 border-ink cursor-pointer p-0 bg-white" :value="modelValue.dotColor" @input="patch({ dotColor: ($event.target as HTMLInputElement).value })" />
        <label :for="`${uid}-bg`" class="text-sm font-600 text-ink ml-1">背景色</label>
        <input :id="`${uid}-bg`" type="color" class="w-9 h-9 rounded-lg border-2 border-ink cursor-pointer p-0 bg-white disabled:opacity-40" :value="modelValue.bgColor === 'transparent' ? '#ffffff' : modelValue.bgColor" :disabled="transparent" @input="patch({ bgColor: ($event.target as HTMLInputElement).value })" />
        <label class="flex items-center gap-1 text-sm font-600 text-ink ml-1 cursor-pointer">
          <input data-test="transparent" type="checkbox" class="accent-brand w-4 h-4" v-model="transparent" />透明
        </label>
      </div>
      <!-- 條件式提醒一律看得到，不收進「?」：勾了透明才出現 -->
      <p v-if="transparent" data-test="transparent-jpg-note" class="text-xs text-muted font-600 mt-1.5">JPG 不支援透明，下載 JPG 時會改用白色背景；要透明背景請下載 PNG 或 SVG。</p>
    </div>

    <label class="flex items-center gap-2 text-sm font-600 text-ink cursor-pointer">
      <input type="checkbox" class="accent-brand w-4 h-4" :checked="modelValue.useGradient" @change="patch({ useGradient: ($event.target as HTMLInputElement).checked })" />
      使用漸層
      <input v-if="modelValue.useGradient" type="color" aria-label="漸層的第二個顏色" class="w-9 h-9 rounded-lg border-2 border-ink cursor-pointer p-0 bg-white" :value="modelValue.gradientColor" @input="patch({ gradientColor: ($event.target as HTMLInputElement).value })" />
    </label>

    <div>
      <HelpTip name="加入 LOGO" :id="`${uid}-logo-help`">
        <template #head><label :for="`${uid}-logo`" class="text-sm font-700 text-ink">加入 LOGO</label></template>
        <p>LOGO 圖片只在你的瀏覽器裡讀取，不會上傳。加入後容錯等級會自動切到 H，LOGO 放在正中央，蓋掉的方塊最多約 9%，一般都能正常掃描。</p>
        <p>建議用去背的 PNG、筆畫簡單的圖形，印出來之前先用手機實際掃一次。完整說明見<RouterLink to="/guide/qr-with-logo/">加 LOGO 的教學</RouterLink>。</p>
      </HelpTip>
      <input :id="`${uid}-logo`" type="file" accept="image/*" :aria-describedby="`${uid}-logo-help`" class="block mt-1.5 text-sm text-muted file:(mr-2 px-3 py-1.5 rounded-lg border-2 border-ink bg-pop-sun font-700 text-ink cursor-pointer)" @change="onLogo" />
      <button v-if="modelValue.logoDataUrl" type="button" class="chip bg-white mt-2 hover:bg-pop-pink transition" @click="patch({ logoDataUrl: null })"><span class="i-lucide-x" aria-hidden="true" />移除 LOGO</button>
    </div>

    <div>
      <HelpTip name="容錯等級" :id="`${uid}-ec-help`">
        <template #head><label :for="`${uid}-ec`" class="text-sm font-700 text-ink">容錯等級</label></template>
        <p>QR Code 被弄髒、磨損或遮住一部分時，還能讀出多少：L、M、Q、H 約可還原 7%、15%、25%、30% 的損毀。等級越高圖案越密，一般用途維持 M；戶外、貼紙這類容易磨損的地方選 Q；加入 LOGO 時會自動切到 H。</p>
        <p>比較與實際圖例見<RouterLink to="/guide/error-correction/">容錯等級怎麼選</RouterLink>。</p>
      </HelpTip>
      <select :id="`${uid}-ec`" :aria-describedby="`${uid}-ec-help`" class="input-base mt-1.5" :value="modelValue.errorCorrectionLevel" @change="patch({ errorCorrectionLevel: ($event.target as HTMLSelectElement).value as ErrorCorrectionLevel })">
        <option v-for="lv in ecLevels" :key="lv" :value="lv">{{ ecLabel[lv] }}</option>
      </select>
    </div>

    <div>
      <HelpTip name="尺寸" :id="`${uid}-size-help`">
        <template #head><label :for="`${uid}-size`" class="text-sm font-700 text-ink">尺寸：<span class="text-link">{{ modelValue.width }}px</span></label></template>
        <p>下載的 PNG 與 JPG 的寬高，200 到 2000 像素。以印刷常用的 300 dpi 換算，1000 像素大約可以印 8.5 公分，2000 像素大約 16.9 公分；要印得更大請下載 SVG，向量檔放多大都不會失真。</p>
      </HelpTip>
      <input :id="`${uid}-size`" type="range" min="200" max="2000" step="100" :aria-describedby="`${uid}-size-help`" class="w-full mt-1.5 accent-brand" :value="modelValue.width" @input="patch({ width: Number(($event.target as HTMLInputElement).value) })" />
    </div>
  </div>
</template>
