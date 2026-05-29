<script setup lang="ts">
defineProps<{ download: (ext: 'png' | 'svg' | 'jpeg') => void; disabled: boolean; copy?: () => void }>()
</script>
<template>
  <div class="grid grid-cols-2 gap-2 mt-4">
    <button data-test="dl-png" class="btn-primary !bg-pop-sun" :disabled="disabled" @click="download('png')">⬇ PNG</button>
    <button data-test="dl-svg" class="btn-primary !bg-pop-mint" :disabled="disabled" @click="download('svg')">⬇ SVG</button>
    <button data-test="dl-jpg" class="btn-primary !bg-pop-sky" :disabled="disabled" @click="download('jpeg')">⬇ JPG</button>
    <button data-test="dl-copy" class="btn-primary !bg-pop-pink" :disabled="disabled" @click="copy?.()">📋 複製</button>
  </div>
</template>
