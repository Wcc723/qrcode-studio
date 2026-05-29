<script setup lang="ts">
// AdSense 上線審核通過後，把 enabled 改 true 並填入 client/slot
defineProps<{ slotId: string }>()
const enabled = false
</script>
<template>
  <div class="my-6">
    <div v-if="!enabled" data-test="ad-placeholder"
      class="border border-dashed border-line rounded-lg text-muted text-xs flex items-center justify-center h-20 bg-slate-50">
      廣告版位（待 AdSense 審核啟用）
    </div>
    <!-- enabled 時在此插入 <ins class="adsbygoogle" ...> 與初始化腳本 -->
  </div>
</template>
