<script setup lang="ts">
import type { PreviewTile } from '@/composables/useBatch'
import { rectsPath } from '@/composables/useBatch'
import { formatCount } from '@/pure/batch/sequence'

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
</script>

<template>
  <div>
    <ul class="grid gap-2 list-none p-0 m-0" :class="wide ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8'" data-test="batch-preview">
      <li v-for="t in tiles" :key="t.key" class="min-w-0 rounded-xl border-2 border-ink bg-white p-1.5">
        <svg
          v-if="t.kind === 'qr'" :viewBox="t.viewBox" class="block w-full h-auto" shape-rendering="crispEdges"
          role="img" :aria-label="`第 ${t.line} 筆的 QR Code`">
          <path fill="#000" :d="t.d" />
        </svg>
        <svg
          v-else :viewBox="`0 0 ${t.g.width} ${t.g.height}`" class="block w-full h-auto" shape-rendering="crispEdges"
          role="img" :aria-label="`第 ${t.line} 筆的條碼`">
          <path fill="#000" :d="rectsPath([...t.g.bearer, ...t.g.bars])" />
          <text
            v-if="t.g.text" :x="t.g.text.x" :y="t.g.text.y" text-anchor="middle" font-family="monospace"
            :font-size="t.g.text.size" fill="#000">{{ t.g.text.s }}</text>
        </svg>
        <p class="text-[11px] leading-tight text-muted font-700 mt-1 truncate" :title="t.name" data-test="batch-preview-name">{{ t.name }}</p>
      </li>
    </ul>
    <p v-if="total > tiles.length" class="text-xs text-muted font-600 mt-2">
      預覽前 {{ tiles.length }} 張，下載的 ZIP 裡有全部 {{ formatCount(total) }} 張。
    </p>
  </div>
</template>
