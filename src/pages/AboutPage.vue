<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
useSeoHead({ title: `關於 ${site.name}`, description: `${site.name} 是免費、不傳雲端、保護隱私的線上 QR Code 產生器。`, path: '/about' })
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-2xl font-700 text-ink">關於 {{ site.name }}</h1>
    <p class="text-muted mt-4 leading-7">{{ site.name }} 致力於提供乾淨、快速、免費且保護隱私的 QR Code 工具。所有 QR Code 都在你的瀏覽器內生成，不會上傳至雲端儲存空間，也沒有浮水印。</p>
  </article>
</template>
