<script setup lang="ts">
defineProps<{ download: (ext: 'png' | 'svg' | 'jpeg') => void; disabled: boolean; copy?: () => void }>()
</script>
<template>
  <div class="flex gap-2 mt-4 flex-wrap">
    <button data-test="dl-png" class="btn-primary flex-1" :disabled="disabled" @click="download('png')">⬇ PNG</button>
    <button data-test="dl-svg" class="btn-primary flex-1" :disabled="disabled" @click="download('svg')">⬇ SVG</button>
    <button data-test="dl-jpg" class="btn-primary flex-1" :disabled="disabled" @click="download('jpeg')">⬇ JPG</button>
    <button data-test="dl-copy" class="btn-primary flex-1" :disabled="disabled" @click="copy?.()">📋 複製</button>
  </div>
</template>
