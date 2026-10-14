<script setup lang="ts">
import { computed } from 'vue'
import type { BarcodeSymbology } from '@/pure/validateBarcode'
import { symbologiesFor } from '@/config/symbologies'
import { useLocale } from '@/i18n/locale'
import { barcodeCopy } from '@/locales/barcode'
import HelpTip from '../HelpTip.vue'

const props = defineProps<{ modelValue: BarcodeSymbology }>()
const emit = defineEmits<{ 'update:modelValue': [BarcodeSymbology] }>()
const locale = useLocale().value
const symbologies = symbologiesFor(locale)
const t = barcodeCopy[locale]

// radio 用 v-model，不用 :checked：整頁載入時 client 沿用預渲染的 DOM（hydrate），hydrate 不會改 checked，
// Firefox 重新整理又會把上一次選的 radio 還原回來，畫面上會勾著 EAN-13、亮著 Code 128，點 EAN-13 也不會觸發 change。
// v-model 在 hydrate 時就把 checked 對回狀態（src/hydration.test.ts）。
const selected = computed({
  get: () => props.modelValue,
  set: (v: BarcodeSymbology) => emit('update:modelValue', v),
})
</script>

<template>
  <!--
    用原生 radio 而不是 role="tablist"：切換的是「用哪個編碼器」而非多個內容面板，
    本質是互斥單選。原生 radio 免費拿到整組一個 tab stop、方向鍵移動並選取、
    Home/End，全部由瀏覽器處理，不必自己寫 roving tabindex。

    fieldset 必須 min-w-0：UA 樣式是 min-inline-size: min-content，
    不覆寫的話 400px 下會被 5 顆 pill 撐開造成整頁橫向溢出。
  -->
  <!--
    「?」不放進 legend：按鈕會讓群組名稱多念一段「條碼類型的說明」。看得到的欄名在 field-head 裡
    （對報讀器隱藏），群組名稱仍由 sr-only 的 legend 提供，用途說明用 aria-describedby 接上。
  -->
  <HelpTip :name="t.typeName" id="bc-sym-help">
    <template #head><span class="text-sm text-muted" aria-hidden="true">{{ t.type }}</span></template>
    <ul>
      <li v-for="s in symbologies" :key="s.id"><strong>{{ s.label }}</strong>{{ locale === 'en' ? ': ' : '：' }}{{ s.about }}</li>
    </ul>
    <p>{{ t.typeHelpEnd }}</p>
  </HelpTip>
  <fieldset class="border-0 p-0 m-0 mt-1.5 min-w-0" data-test="bc-symbology" aria-describedby="bc-sym-help">
    <legend class="sr-only">{{ t.type }}</legend>
    <div class="flex flex-wrap gap-2">
      <label
        v-for="s in symbologies" :key="s.id"
        :data-test="`bc-sym-${s.id}`"
        class="relative inline-flex items-center rounded-full cursor-pointer select-none">
        <input
          type="radio" name="bc-symbology" class="peer sr-only"
          v-model="selected" :value="s.id"
          :data-test="`bc-radio-${s.id}`" />
        <!--
          焦點框畫在這個 span 上而不是靠全域 :focus-visible：radio 是 sr-only
          （1x1px、clip），outline 會畫在那個看不見的點上。peer-focus-visible
          是不含中括號的標準 variant，不依賴本專案沒掛的 arbitrary-variant 抽取器。
        -->
        <span
          class="px-3.5 py-1.5 rounded-full text-sm font-display font-600 border-2 border-ink transition-all duration-150 whitespace-nowrap peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-brand peer-focus-visible:outline-offset-2"
          :class="modelValue === s.id
            ? 'bg-pop-pink text-ink shadow-[3px_3px_0_#16130f] -translate-y-0.5'
            : 'bg-white text-ink hover:bg-pop-sun hover:shadow-[2px_2px_0_#16130f] hover:-translate-y-0.5'">
          {{ s.label }}
        </span>
      </label>
    </div>
  </fieldset>
</template>
