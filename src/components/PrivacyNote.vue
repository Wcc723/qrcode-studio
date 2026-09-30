<script setup lang="ts">
/**
 * 工具卡頂部的隱私說明：畫面上只留一行，完整說明收在旁邊的「?」。
 * 以前同一句「不傳雲端」在標題貼紙、預覽框與頁尾各出現一次，現在工具裡只剩這一處（頁尾那行保留）。
 * 說明內容要跟隱私權政策一致：只描述程式真的做到的事。
 */
import HelpTip from './HelpTip.vue'

defineProps<{ mode: 'generate' | 'barcode' | 'scan' }>()
</script>

<template>
  <div data-test="privacy-note" class="text-sm font-700 text-ink">
    <HelpTip :name="mode === 'scan' ? '圖片不上傳' : '內容不上傳'">
      <template #head>
        <p class="inline-flex items-center gap-1.5">
          <span class="icon-badge-sm bg-pop-mint"><span class="i-lucide-lock" aria-hidden="true" /></span>
          {{ mode === 'scan' ? '在你的瀏覽器裡讀取，圖片不上傳' : '只在你的瀏覽器產生，內容不上傳' }}
        </p>
      </template>
      <p v-if="mode === 'generate'">你輸入的網址、WiFi 密碼、聯絡資訊與 LOGO 圖片，都只在你的瀏覽器裡轉成圖片，不會上傳到任何伺服器，本站也不會保存。</p>
      <p v-else-if="mode === 'barcode'">你輸入的條碼內容只在你的瀏覽器裡轉成圖片，不會上傳到任何伺服器，本站也不會保存。</p>
      <p v-else>讀取用的程式由本站提供，直接在你的瀏覽器裡執行。圖片與讀出來的內容只在這個分頁開著的時候存在，不會上傳，也不會存進 Cookie 或瀏覽器的儲存空間，關掉分頁就什麼都不剩。</p>
      <p>網站用流量統計工具（Google Analytics、Cloudflare Web Analytics）計算瀏覽量，統計資料不包含你輸入或丟進來的內容，詳見<RouterLink to="/privacy/">隱私權政策</RouterLink>。</p>
    </HelpTip>
  </div>
</template>
