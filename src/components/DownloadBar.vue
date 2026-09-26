<script setup lang="ts">
defineProps<{ download: (ext: 'png' | 'svg' | 'jpeg') => void; disabled: boolean; copy?: () => void }>()
</script>
<template>
  <div class="grid grid-cols-2 gap-2 mt-4">
    <button data-test="dl-png" class="btn-primary !bg-pop-sun" :disabled="disabled" @click="download('png')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">下載 </span>PNG</button>
    <button data-test="dl-svg" class="btn-primary !bg-pop-mint" :disabled="disabled" @click="download('svg')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">下載 </span>SVG</button>
    <button data-test="dl-jpg" class="btn-primary !bg-pop-sky" :disabled="disabled" @click="download('jpeg')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">下載 </span>JPG</button>
    <button data-test="dl-copy" class="btn-primary !bg-pop-pink" :disabled="disabled" @click="copy?.()"><span class="i-lucide-copy" aria-hidden="true" />複製</button>
  </div>
</template>
