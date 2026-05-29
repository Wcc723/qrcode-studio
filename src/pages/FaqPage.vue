<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
const faqs = [
  { q: 'QR Code 會過期嗎？', a: '不會。靜態 QR Code 內容直接編碼在圖中，永久有效。' },
  { q: '需要付費或註冊嗎？', a: '完全免費、免註冊、無浮水印。' },
  { q: '可以加上 LOGO 嗎？', a: '可以。上傳 LOGO 後會自動提高容錯等級以確保可掃描。' },
  { q: '資料會被上傳嗎？', a: '不會，全部在瀏覽器內生成。' },
]
useSeoHead({ title: '常見問題 FAQ｜QR Code 產生器', description: '關於本 QR Code 產生器的常見問題：是否免費、會不會過期、能否加 LOGO、資料是否上傳。', path: '/faq', faqs })
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-2xl font-700 text-ink">常見問題</h1>
    <div class="mt-6 space-y-3">
      <details v-for="(f, i) in faqs" :key="i" class="card p-4">
        <summary class="font-600 cursor-pointer">{{ f.q }}</summary>
        <p class="text-muted mt-2">{{ f.a }}</p>
      </details>
    </div>
  </article>
</template>
