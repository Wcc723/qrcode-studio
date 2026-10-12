<script setup lang="ts">
/**
 * 5 公分校正尺（印在對位測試頁的中間）：印出來用尺量，剛好 5 公分就是用實際大小（100%）列印；
 * 短了多半是列印設定選了「符合頁面大小」或縮放不是 100%。SVG 以 mm 為單位，列印是向量。
 * 長度、刻度與線寬都在 src/pure/batch/paper.ts。
 */
import {
  CALIBRATION_HEIGHT_MM, CALIBRATION_LABEL_MM, CALIBRATION_LINE_MM, CALIBRATION_MM, CALIBRATION_TICK_LINE_MM, mm,
} from '@/pure/batch/paper'

const H = CALIBRATION_HEIGHT_MM
const LONG = H * 0.75
const MID = H * 0.5
const SHORT = H * 0.3
const ticks = Array.from({ length: CALIBRATION_MM + 1 }, (_, i) => ({ x: i, length: i % 10 === 0 ? LONG : i % 5 === 0 ? MID : SHORT }))
const labels = Array.from({ length: CALIBRATION_MM / 10 + 1 }, (_, i) => i)
/** 左右各留一個字寬，「0」與「5」的數字才不會被切掉 */
const pad = CALIBRATION_LABEL_MM
const width = CALIBRATION_MM + pad * 2
const height = H + CALIBRATION_LABEL_MM * 1.5
</script>

<template>
  <div class="label-ruler">
    <svg
      :width="mm(width)" :height="mm(height)" :viewBox="`${-pad} 0 ${width} ${height}`"
      role="img" aria-label="5 公分校正尺" data-test="label-ruler">
      <line x1="0" :y1="H" :x2="CALIBRATION_MM" :y2="H" stroke="#000" :stroke-width="CALIBRATION_LINE_MM" data-test="label-ruler-base" />
      <line
        v-for="t in ticks" :key="t.x" :x1="t.x" :y1="H" :x2="t.x" :y2="H - t.length"
        stroke="#000" :stroke-width="CALIBRATION_TICK_LINE_MM" />
      <text
        v-for="cm in labels" :key="cm" :x="cm * 10" :y="H + CALIBRATION_LABEL_MM * 1.2" :font-size="CALIBRATION_LABEL_MM"
        text-anchor="middle" fill="#000">{{ cm }}</text>
    </svg>
    <span class="label-ruler-caption">校正尺：剛好 5 公分就是實際大小列印</span>
  </div>
</template>

<style>
.label-ruler { display: flex; align-items: flex-end; gap: 0.5em; color: #000; }
.label-ruler svg { display: block; overflow: visible; flex: none; }
.label-ruler-caption { white-space: nowrap; }
</style>
