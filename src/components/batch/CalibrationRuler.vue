<script setup lang="ts">
/**
 * 校正尺（印在對位測試頁的中間）：印出來用尺量，長度剛好就是用實際大小（100%）列印；
 * 短了多半是列印設定選了「符合頁面大小」或縮放不是 100%。SVG 以 mm 為單位，列印是向量。
 * 繁中版是 CALIBRATION_MM 長、刻度到 mm；英文版是 CALIBRATION_IN 英寸長、刻度到 1/16 英寸（美國的尺就是這樣刻的）。
 * 長度、刻度與線寬都在 src/pure/batch/paper.ts。
 */
import { computed } from 'vue'
import {
  CALIBRATION_HEIGHT_MM, CALIBRATION_IN, CALIBRATION_IN_DIVISIONS, CALIBRATION_LABEL_MM, CALIBRATION_LINE_MM, CALIBRATION_MM,
  CALIBRATION_TICK_LINE_MM, MM_PER_IN, mm,
} from '@/pure/batch/paper'

const props = withDefaults(defineProps<{
  unit?: 'cm' | 'in'
  /** 無障礙名稱與旁邊的說明（文案在 copy.ts，跟語言走） */
  aria: string
  caption: string
}>(), { unit: 'cm' })

const H = CALIBRATION_HEIGHT_MM
const LONG = H * 0.75
const MID = H * 0.5
const QUARTER = H * 0.4
const SHORT = H * 0.3

const ruler = computed(() => {
  if (props.unit === 'in') {
    const length = CALIBRATION_IN * MM_PER_IN
    const step = MM_PER_IN / CALIBRATION_IN_DIVISIONS
    const ticks = Array.from({ length: CALIBRATION_IN * CALIBRATION_IN_DIVISIONS + 1 }, (_, i) => {
      const at = i % CALIBRATION_IN_DIVISIONS
      const tick = at === 0 ? LONG : at % (CALIBRATION_IN_DIVISIONS / 2) === 0 ? MID : at % (CALIBRATION_IN_DIVISIONS / 4) === 0 ? QUARTER : SHORT
      return { x: i * step, length: tick }
    })
    const labels = Array.from({ length: CALIBRATION_IN + 1 }, (_, i) => ({ x: i * MM_PER_IN, text: i }))
    return { length, ticks, labels }
  }
  const ticks = Array.from({ length: CALIBRATION_MM + 1 }, (_, i) => ({ x: i, length: i % 10 === 0 ? LONG : i % 5 === 0 ? MID : SHORT }))
  const labels = Array.from({ length: CALIBRATION_MM / 10 + 1 }, (_, i) => ({ x: i * 10, text: i }))
  return { length: CALIBRATION_MM, ticks, labels }
})
/** 左右各留一個字寬，頭尾的數字才不會被切掉 */
const pad = CALIBRATION_LABEL_MM
const width = computed(() => ruler.value.length + pad * 2)
const height = H + CALIBRATION_LABEL_MM * 1.5
</script>

<template>
  <div class="label-ruler">
    <svg
      :width="mm(width)" :height="mm(height)" :viewBox="`${-pad} 0 ${width} ${height}`"
      role="img" :aria-label="aria" data-test="label-ruler" :data-unit="unit">
      <line x1="0" :y1="H" :x2="ruler.length" :y2="H" stroke="#000" :stroke-width="CALIBRATION_LINE_MM" data-test="label-ruler-base" />
      <line
        v-for="tk in ruler.ticks" :key="tk.x" :x1="tk.x" :y1="H" :x2="tk.x" :y2="H - tk.length"
        stroke="#000" :stroke-width="CALIBRATION_TICK_LINE_MM" />
      <text
        v-for="n in ruler.labels" :key="n.text" :x="n.x" :y="H + CALIBRATION_LABEL_MM * 1.2" :font-size="CALIBRATION_LABEL_MM"
        text-anchor="middle" fill="#000">{{ n.text }}</text>
    </svg>
    <span class="label-ruler-caption">{{ caption }}</span>
  </div>
</template>

<style>
.label-ruler { display: flex; align-items: flex-end; gap: 0.5em; color: #000; }
.label-ruler svg { display: block; overflow: visible; flex: none; }
.label-ruler-caption { white-space: nowrap; }
</style>
