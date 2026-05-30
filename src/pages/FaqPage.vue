<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
const faqs = [
  { q: 'QR Code 產生器要錢嗎？需要註冊嗎？', a: '完全免費、免註冊、無浮水印，可直接下載 PNG 與 SVG，商用與印刷皆可。' },
  { q: 'QR Code 會過期嗎？', a: '不會。本站產生的是靜態 QR Code，內容直接編碼在圖中，永久有效、不需聯網、不會失效。' },
  { q: '我的資料會被上傳嗎？安全嗎？', a: '不會。所有產生過程都在你的瀏覽器內完成，不會傳送到任何伺服器，也沒有後台紀錄。' },
  { q: '可以加上 LOGO 和自訂顏色嗎？', a: '可以。支援自訂前景／背景顏色、漸層與上傳 LOGO；上傳 LOGO 時會自動提高容錯等級以確保可掃描。' },
  { q: '可以下載 SVG 向量檔嗎？', a: '可以。除了 PNG／JPG，也免費提供 SVG 向量檔，放大不失真，適合印刷與大圖輸出。' },
  { q: '加了 LOGO 會不會掃不到？', a: '只要把容錯等級提高到 H（上傳 LOGO 時會自動調整）、LOGO 不要太大並保留白邊，加 LOGO 也能正常掃描，印刷前建議實機測試。' },
  { q: '這是動態 QR Code 嗎？可以事後修改嗎？', a: '本站產生的是靜態 QR Code，無法事後修改內容；好處是永久有效、不依賴任何伺服器、不會被收費停用。內容若有變更，重新產生一張即可。' },
  { q: '怎麼掃描 QR Code？', a: '用 iPhone／Android 內建相機或 LINE 掃描即可，多數情況免裝 App。詳見「如何掃描 QR Code」教學。' },
]
useSeoHead({ title: '常見問題 FAQ｜免費 QR Code 產生器', description: '關於免費 QR Code 產生器的常見問題：是否免費、會不會過期、能否加 LOGO、可否下載 SVG、資料是否上傳、如何掃描等。', path: '/faq', faqs })
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-3xl font-800 text-ink">💬 常見問題</h1>
    <div class="mt-6 space-y-3">
      <details v-for="(f, i) in faqs" :key="i" class="card p-4">
        <summary class="font-display font-700 text-ink cursor-pointer select-none">{{ f.q }}</summary>
        <p class="text-ink/75 font-600 mt-2 leading-relaxed">{{ f.a }}</p>
      </details>
    </div>
  </article>
</template>
