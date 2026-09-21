<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
import { site, publisher, author, repoUrl } from '@/config/site'

const changelog = [
  { date: '2026 年 5 月', text: 'QR Code 產生器上線，支援網址、WiFi、電子名片、純文字、Email、電話、簡訊 7 種類型，並寫了第一批教學文章。' },
  { date: '2026 年 9 月 7 日', text: '從 qrcode-studio.pocketool.app 搬到口袋工具主網域 www.pocketool.app/qrcode-studio/，舊網址自動轉過來。' },
  { date: '2026 年 9 月 13 日', text: '新增一維條碼產生器：EAN-13、EAN-8、Code 128、Code 39、ITF-14，自動計算檢查碼。' },
  { date: '2026 年 9 月 20 日', text: '新增 QR Code 掃描器：把截圖或圖檔丟進來，在瀏覽器內解碼。' },
  { date: '2026 年 9 月 21 日', text: '修正中文、emoji 內容產生的 QR Code 掃出來是亂碼的問題，之前做好、內容含中文或 emoji 的 QR Code 請重新產生一張替換；教學文章全面改寫並新增教學總覽。' },
]

useSeoHead({
  title: `關於 ${site.name}｜口袋工具`,
  description: `${site.name} 是口袋工具的免費 QR Code 產生器、掃描器與一維條碼產生器：所有圖片都在你的瀏覽器內產生與解讀，內容不傳雲端、沒有浮水印、不會過期。這裡說明誰在維護、為什麼做、怎麼運作與更新紀錄。`,
  path: '/about',
  kind: 'page',
  pageType: 'AboutPage',
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: `關於 ${site.name}`, url: `${site.url}/about/` },
  ],
})
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10 text-muted leading-7 [&_a]:(text-brand underline font-700) [&_h2]:(text-lg font-700 text-ink mt-8) [&_p]:mt-3">
    <h1 class="text-2xl font-700 text-ink">關於 {{ site.name }}</h1>
    <p>
      {{ site.name }} 是一組免費的 QR Code 與條碼工具，屬於<a :href="publisher.url">口袋工具 Pocketool</a>：<a :href="author.url">{{ author.name }}</a>（六角學院共同創辦人、軟體工程師與講師）打造的免費線上工具集，每個工具都以「免費、開箱即用、尊重隱私」為原則設計，由{{ author.name }}持續維護。所有 QR Code 與條碼都在你的瀏覽器內產生與解讀，不會上傳至雲端儲存空間，也沒有浮水印。
    </p>

    <h2>為什麼做這個工具</h2>
    <p>
      搜尋「QR Code 產生器」會找到很多服務，但不少產生的是<strong class="text-ink">動態 QR Code</strong>：圖裡存的其實是服務商的轉址網址，試用期結束、方案到期或服務關閉，印在名片與包裝上的 QR Code 就跟著失效；也常見把 SVG 下載或去浮水印鎖在付費方案裡。{{ site.name }} 只做<strong class="text-ink">靜態 QR Code</strong>：你的內容直接編碼在圖裡，不經過任何轉址，印出去之後不會因為哪個服務停掉而失效。
    </p>

    <h2>三個工具怎麼運作</h2>
    <ul class="list-disc pl-5 mt-3 space-y-2">
      <li><RouterLink to="/">QR Code 產生器</RouterLink>：用開源函式庫 qr-code-styling（MIT License）在瀏覽器內繪製。每種類型都輸出手機相機認得的標準格式，例如 WiFi 用 <code>WIFI:</code>、電子名片用 vCard 3.0、Email 用 <code>mailto:</code>、簡訊用 <code>SMSTO:</code>。中文與 emoji 以通行的 UTF-8 編碼。</li>
      <li><RouterLink to="/barcode/">一維條碼產生器</RouterLink>：編碼器是自己寫的，會依 GS1 規則自動計算 EAN-13、EAN-8、ITF-14 的檢查碼，SVG 檔帶有毫米尺寸，置入排版軟體就是標準大小。</li>
      <li><RouterLink to="/scan/">QR Code 掃描器</RouterLink>：用 zxing-wasm 在瀏覽器內解碼截圖或圖檔。解碼結果先以純文字顯示，不會自動開啟連結，避免掃到偽造網址時被直接帶走。</li>
    </ul>
    <p>
      使用上的細節整理在<RouterLink to="/guide/">教學總覽</RouterLink>與<RouterLink to="/faq/">常見問題</RouterLink>，資料怎麼處理寫在<RouterLink to="/privacy/">隱私權政策</RouterLink>。
    </p>

    <h2>開放原始碼與第三方授權</h2>
    <p><RouterLink to="/scan/">QR Code 掃描器</RouterLink>的圖片解碼由 <a href="https://github.com/Sec-ant/zxing-wasm" target="_blank" rel="noopener">zxing-wasm</a> 提供，以 WebAssembly 形式在你的瀏覽器內執行，WASM 檔由本站自行提供、不從第三方 CDN 載入。</p>
    <p>zxing-wasm 由多個來源的程式碼組成，各自適用不同授權：</p>
    <ul class="mt-2 list-disc pl-5">
      <li><a href="https://github.com/zxing-cpp/zxing-cpp" target="_blank" rel="noopener">zxing-cpp</a>：<a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener">Apache License, Version 2.0</a></li>
      <li>zxing-wasm 的 C++ 繫結層 <code>ZXingWasm.cpp</code>：Apache License, Version 2.0</li>
      <li><a href="https://sourceforge.net/projects/zint/" target="_blank" rel="noopener">zint</a>：BSD-3-Clause License</li>
      <li>zxing-wasm 自有的程式碼：MIT License（Copyright © 2023 Ze-Zheng Wu）</li>
    </ul>
    <p>本站<RouterLink to="/barcode/">一維條碼產生器</RouterLink>的編碼器是自行實作的，不使用上述任何第三方編碼器。完整版本、雜湊與授權出處記在 GitHub 上的 <a :href="`${repoUrl}/blob/main/NOTICE.md`" target="_blank" rel="noopener"><code>NOTICE.md</code></a>。</p>

    <h2>更新紀錄</h2>
    <ul class="mt-3 space-y-2 list-none p-0">
      <li v-for="c in changelog" :key="c.date" class="flex gap-3">
        <span class="shrink-0 font-700 text-ink w-32">{{ c.date }}</span>
        <span>{{ c.text }}</span>
      </li>
    </ul>

    <h2>聯絡我們</h2>
    <p>
      發現掃不到的 QR Code、錯字或任何問題，歡迎透過口袋工具的<a :href="publisher.contactUrl">聯絡我們</a>頁面告訴我們；熟悉 GitHub 的話，也可以直接在 <a :href="`${repoUrl}/issues`" target="_blank" rel="noopener">GitHub Issues</a> 回報。想看看口袋工具還有哪些工具，請到<a :href="publisher.toolsUrl">所有工具</a>。
    </p>
  </article>
</template>
