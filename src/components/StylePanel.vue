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
  L: '低：圖案最簡單（螢幕上用）', M: '中：一般用途（建議）', Q: '較高：戶外、貼紙', H: '最高：要加 LOGO',
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
        <label :for="`${uid}-dot`" class="text-sm font-600 text-ink">方塊顏色</label>
        <input :id="`${uid}-dot`" data-test="dotColor" type="color" class="w-9 h-9 rounded-lg border-2 border-ink cursor-pointer p-0 bg-white" :value="modelValue.dotColor" @input="patch({ dotColor: ($event.target as HTMLInputElement).value })" />
        <label :for="`${uid}-bg`" class="text-sm font-600 text-ink ml-1">背景顏色</label>
        <input :id="`${uid}-bg`" type="color" class="w-9 h-9 rounded-lg border-2 border-ink cursor-pointer p-0 bg-white disabled:opacity-40" :value="modelValue.bgColor === 'transparent' ? '#ffffff' : modelValue.bgColor" :disabled="transparent" @input="patch({ bgColor: ($event.target as HTMLInputElement).value })" />
        <label class="flex items-center gap-1 text-sm font-600 text-ink ml-1 cursor-pointer">
          <input data-test="transparent" type="checkbox" class="accent-brand w-4 h-4" v-model="transparent" />透明背景
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
        <p>LOGO 圖片只在你的瀏覽器裡讀取，不會上傳。加入後會自動調成最耐髒的等級（H），LOGO 放在正中央，蓋掉的方塊最多約 9%，一般都能正常掃描。</p>
        <p>建議用去背的 PNG、筆畫簡單的圖形，印出來之前先用手機實際掃一次。完整說明見<RouterLink to="/guide/qr-with-logo/">加 LOGO 的教學</RouterLink>。</p>
      </HelpTip>
      <input :id="`${uid}-logo`" type="file" accept="image/*" :aria-describedby="`${uid}-logo-help`" class="block mt-1.5 text-sm text-muted file:(mr-2 px-3 py-1.5 rounded-lg border-2 border-ink bg-pop-sun font-700 text-ink cursor-pointer)" @change="onLogo" />
      <button v-if="modelValue.logoDataUrl" type="button" class="chip bg-white mt-2 hover:bg-pop-pink transition" @click="patch({ logoDataUrl: null })"><span class="i-lucide-x" aria-hidden="true" />移除 LOGO</button>
    </div>

    <div>
      <HelpTip name="耐髒程度" :id="`${uid}-ec-help`">
        <template #head><label :for="`${uid}-ec`" class="text-sm font-700 text-ink">耐髒程度（容錯等級）</label></template>
        <p>被弄髒、磨損或中間蓋了 LOGO，還掃不掃得出來：L、M、Q、H 被遮住約 7%、15%、25%、30% 還能掃。等級越高，方塊越多越細；一般用途維持 M，戶外、貼紙這類容易磨損的地方選 Q，加入 LOGO 時會自動調成 H。</p>
        <p>比較與實際圖例見<RouterLink to="/guide/error-correction/">容錯等級怎麼選</RouterLink>。</p>
      </HelpTip>
      <select :id="`${uid}-ec`" :aria-describedby="`${uid}-ec-help`" class="input-base mt-1.5" :value="modelValue.errorCorrectionLevel" @change="patch({ errorCorrectionLevel: ($event.target as HTMLSelectElement).value as ErrorCorrectionLevel })">
        <option v-for="lv in ecLevels" :key="lv" :value="lv">{{ ecLabel[lv] }}</option>
      </select>
    </div>

    <div>
      <HelpTip name="圖片大小" :id="`${uid}-size-help`">
        <template #head><label :for="`${uid}-size`" class="text-sm font-700 text-ink">圖片大小：<span class="text-link">{{ modelValue.width }} 像素</span></label></template>
        <p>下載的 PNG 與 JPG 的寬高，200 到 2000 像素。以一般印刷品的精細度（300 dpi，每英吋 300 點）換算，1000 像素大約可以印 8.5 公分，2000 像素大約 16.9 公分；要印得更大請下載 SVG 向量檔，放多大都不會糊。</p>
      </HelpTip>
      <input :id="`${uid}-size`" type="range" min="200" max="2000" step="100" :aria-describedby="`${uid}-size-help`" class="w-full mt-1.5 accent-brand" :value="modelValue.width" @input="patch({ width: Number(($event.target as HTMLInputElement).value) })" />
    </div>
  </div>
</template>
