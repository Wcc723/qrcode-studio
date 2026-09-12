<script setup lang="ts">
import type { BarcodeSymbology } from '@/pure/validateBarcode'
import { symbologies } from '@/config/symbologies'

defineProps<{ modelValue: BarcodeSymbology }>()
const emit = defineEmits<{ 'update:modelValue': [BarcodeSymbology] }>()
</script>

<template>
  <!--
    用原生 radio 而不是 role="tablist"：切換的是「用哪個編碼器」而非多個內容面板，
    本質是互斥單選。原生 radio 免費拿到整組一個 tab stop、方向鍵移動並選取、
    Home/End，全部由瀏覽器處理，不必自己寫 roving tabindex。

    fieldset 必須 min-w-0：UA 樣式是 min-inline-size: min-content，
    不覆寫的話 400px 下會被 5 顆 pill 撐開造成整頁橫向溢出。
  -->
  <fieldset class="border-0 p-0 m-0 min-w-0" data-test="bc-symbology">
    <legend class="text-sm text-muted p-0 mb-2">條碼類型</legend>
    <div class="flex flex-wrap gap-2">
      <label
        v-for="s in symbologies" :key="s.id"
        :data-test="`bc-sym-${s.id}`"
        class="relative inline-flex items-center rounded-full cursor-pointer select-none">
        <input
          type="radio" name="bc-symbology" class="peer sr-only"
          :value="s.id" :checked="modelValue === s.id"
          :data-test="`bc-radio-${s.id}`"
          @change="emit('update:modelValue', s.id)" />
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
