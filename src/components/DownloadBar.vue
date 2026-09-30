<script setup lang="ts">
defineProps<{
  download: (ext: 'png' | 'svg' | 'jpeg') => void
  disabled: boolean
  copy?: () => void
  /** 「下載格式」說明框的 id：四顆按鈕都用 aria-describedby 指到它（說明也講了「複製」） */
  describedby?: string
}>()
</script>
<template>
  <div class="grid grid-cols-2 gap-2 mt-4">
    <button data-test="dl-png" :aria-describedby="describedby" class="btn-primary !bg-pop-sun" :disabled="disabled" @click="download('png')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">下載 </span>PNG</button>
    <button data-test="dl-svg" :aria-describedby="describedby" class="btn-primary !bg-pop-mint" :disabled="disabled" @click="download('svg')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">下載 </span>SVG</button>
    <button data-test="dl-jpg" :aria-describedby="describedby" class="btn-primary !bg-pop-sky" :disabled="disabled" @click="download('jpeg')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">下載 </span>JPG</button>
    <button data-test="dl-copy" :aria-describedby="describedby" class="btn-primary !bg-pop-pink" :disabled="disabled" @click="copy?.()"><span class="i-lucide-copy" aria-hidden="true" />複製</button>
  </div>
</template>
