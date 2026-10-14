<script setup lang="ts">
import type { PreviewTile } from '@/composables/useBatch'
import { rectsPath } from '@/composables/useBatch'
import { batchCopy } from '@/pure/batch/copy'
import { useLocale } from '@/i18n/locale'

/**
 * 前幾張的預覽。直接用 Vue 畫 <svg>：QR Code 是一段 path，一維條碼是 path 加一個 <text>，
 * 號碼與檔名都是文字節點，不用 v-html（清單是使用者貼上的內容）。
 */
defineProps<{
  tiles: PreviewTile[]
  total: number
  /** 一維條碼是寬扁的，一列放少一點 */
  wide?: boolean
}>()
const t = batchCopy[useLocale().value].download
</script>

<template>
  <div>
    <ul class="grid gap-2 list-none p-0 m-0" :class="wide ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8'" data-test="batch-preview">
      <li v-for="tile in tiles" :key="tile.key" class="min-w-0 rounded-xl border-2 border-ink bg-white p-1.5">
        <svg
          v-if="tile.kind === 'qr'" :viewBox="tile.viewBox" class="block w-full h-auto" shape-rendering="crispEdges"
          role="img" :aria-label="t.previewQr(tile.line)">
          <path fill="#000" :d="tile.d" />
        </svg>
        <svg
          v-else :viewBox="`0 0 ${tile.g.width} ${tile.g.height}`" class="block w-full h-auto" shape-rendering="crispEdges"
          role="img" :aria-label="t.previewBarcode(tile.line)">
          <path fill="#000" :d="rectsPath([...tile.g.bearer, ...tile.g.bars])" />
          <text
            v-if="tile.g.text" :x="tile.g.text.x" :y="tile.g.text.y" text-anchor="middle" font-family="monospace"
            :font-size="tile.g.text.size" fill="#000">{{ tile.g.text.s }}</text>
        </svg>
        <p class="text-[11px] leading-tight text-muted font-700 mt-1 truncate" :title="tile.name" data-test="batch-preview-name">{{ tile.name }}</p>
      </li>
    </ul>
    <p v-if="total > tiles.length" class="text-xs text-muted font-600 mt-2">
      {{ t.previewMore(tiles.length, total) }}
    </p>
  </div>
</template>
