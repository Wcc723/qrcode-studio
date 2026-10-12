<script setup lang="ts" generic="T extends string">
import { computed } from 'vue'

/**
 * 一排膠囊樣式的單選（原生 radio），樣式跟條碼產生器的「條碼類型」一樣。
 * 原生 radio 免費拿到整組一個 tab stop、方向鍵移動並選取；radio 用 v-model，hydrate 時才會把 checked 對回狀態。
 * fieldset 要 min-w-0：UA 樣式是 min-inline-size: min-content，400px 寬時會被膠囊撐開造成整頁橫向溢出。
 */
const props = defineProps<{
  modelValue: T
  options: readonly { value: T; label: string }[]
  /** radio 的 name，同一頁要唯一 */
  name: string
  /** 群組名稱（sr-only 的 legend）；看得到的欄名由外面的 HelpTip 或標題提供 */
  legend: string
  describedby?: string
  testId?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [T] }>()

const selected = computed({
  get: () => props.modelValue,
  set: (v: T) => emit('update:modelValue', v),
})
</script>

<template>
  <fieldset class="border-0 p-0 m-0 mt-1.5 min-w-0" :data-test="testId" :aria-describedby="describedby">
    <legend class="sr-only">{{ legend }}</legend>
    <div class="flex flex-wrap gap-2">
      <label
        v-for="o in options" :key="o.value"
        class="relative inline-flex items-center rounded-full cursor-pointer select-none">
        <input
          v-model="selected" type="radio" :name="name" class="peer sr-only"
          :value="o.value" :data-test="testId ? `${testId}-${o.value}` : undefined" />
        <span
          class="px-3.5 py-1.5 rounded-full text-sm font-display font-600 border-2 border-ink transition-all duration-150 whitespace-nowrap peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-brand peer-focus-visible:outline-offset-2"
          :class="modelValue === o.value
            ? 'bg-pop-pink text-ink shadow-[3px_3px_0_#16130f] -translate-y-0.5'
            : 'bg-white text-ink hover:bg-pop-sun hover:shadow-[2px_2px_0_#16130f] hover:-translate-y-0.5'">
          {{ o.label }}
        </span>
      </label>
    </div>
  </fieldset>
</template>
