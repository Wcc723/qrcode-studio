<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
import { site, publisher } from '@/config/site'

// 內容有實質變動時才改這個日期。
const UPDATED = { iso: '2026-09-24', label: '2026 年 9 月 24 日' }

useSeoHead({
  title: '隱私權政策｜QR Code Studio',
  description: 'QR Code Studio 的隱私權政策：QR Code 在你的瀏覽器內產生與解讀，輸入的內容與上傳的圖片不會離開你的裝置；網站以 Google Analytics 與 Cloudflare Web Analytics 統計使用情形，並說明廣告 Cookie 與你的選擇權。',
  path: '/privacy',
  kind: 'page',
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: '隱私權政策', url: `${site.url}/privacy/` },
  ],
})
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10 [&_a]:(text-link underline font-700)">
    <h1 class="text-2xl font-700 text-ink">隱私權政策</h1>
    <p class="text-sm text-muted font-600 mt-2">最後更新日期：<time :datetime="UPDATED.iso">{{ UPDATED.label }}</time></p>

    <p class="text-muted mt-4 leading-7">
      本頁說明 {{ site.name }}（<code>www.pocketool.app/qrcode-studio/</code>，以下簡稱「本工具」）如何處理你的資料。本工具是 <a :href="publisher.url">口袋工具 Pocketool</a> 的一部分，<strong>同時適用口袋工具全站隱私權政策</strong>（<a :href="publisher.privacyUrl">www.pocketool.app/privacy</a>）；這一頁補充說明本工具特有的處理方式。
    </p>

    <h2 class="text-lg font-700 text-ink mt-7">你輸入的內容（QR Code 產生器、一維條碼產生器）</h2>
    <p class="text-muted mt-3 leading-7">你輸入的所有內容（網址、WiFi 密碼、聯絡資訊、條碼號碼等）都只在你的瀏覽器內處理並產生圖片，<strong>不會上傳至雲端儲存空間，我們也不會儲存這些內容</strong>。你上傳的 LOGO 圖片同樣只在瀏覽器內與 QR Code 合成，不會送到任何伺服器。本工具本身不使用 Cookie、localStorage 或其他瀏覽器儲存空間保存你輸入的內容，重新整理頁面後就會清空。</p>

    <h2 class="text-lg font-700 text-ink mt-7">圖片解碼（QR Code 掃描器）</h2>
    <p class="text-muted mt-3 leading-7">在<RouterLink to="/scan/">QR Code 掃描器</RouterLink>選擇、拖放或貼上的圖片，<strong>不會上傳到任何伺服器</strong>。解碼是由本站提供的 WebAssembly（WASM）模組在你的瀏覽器內執行的，該模組本身也由本站網域提供，不從第三方 CDN 載入。</p>
    <p class="text-muted mt-3 leading-7">圖片內容與解讀出來的結果（含網址、WiFi 密碼、名片資訊等）只存在於該分頁的記憶體中：<strong>不會寫入網址、Cookie、localStorage、sessionStorage 或任何瀏覽紀錄</strong>，也不會出現在使用數據分析的事件裡。關閉或重新整理分頁後就不會保留。按下「用此內容重新產生」把內容帶回產生器時，同樣只在記憶體中傳遞，且只會被取用一次。</p>

    <h2 class="text-lg font-700 text-ink mt-7">使用數據分析（Google Analytics）</h2>
    <p class="text-muted mt-3 leading-7">為了解網站使用情況並持續改善，本站使用 Google Analytics（GA4）收集使用統計，例如瀏覽的頁面、停留時間、裝置與瀏覽器類型、概略地區（依 IP 推估）等。這些資料透過 Cookie（名稱是 _ga 開頭）區分不同的造訪，<strong>不包含你輸入到產生器中的任何內容</strong>，也不會用來辨識你的個人身分。相關資料由 Google 依其<a href="https://policies.google.com/privacy" target="_blank" rel="noopener">隱私權政策</a>處理；你可以安裝 <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics 停用外掛</a>，或在瀏覽器封鎖 Cookie 來拒絕統計。</p>

    <h2 class="text-lg font-700 text-ink mt-7">網站流量統計（Cloudflare Web Analytics）</h2>
    <p class="text-muted mt-3 leading-7">本站架設在 Cloudflare 上。Cloudflare 傳送每一頁時，會自動加入 Cloudflare Web Analytics 的統計程式，把頁面網址與來源網頁（兩者都不含「?」與「#」之後的部分）、瀏覽器資訊，以及網頁載入時間等效能數據送給 Cloudflare，用來統計瀏覽量與網頁速度。依 <a href="https://www.cloudflare.com/web-analytics/" target="_blank" rel="noopener">Cloudflare 的說明</a>，它不使用 Cookie 或 localStorage。<strong>它送出的資料不包含你在產生器輸入的內容，也不包含你在掃描器選擇的圖片</strong>。</p>

    <h2 class="text-lg font-700 text-ink mt-7">第三方廣告與 Cookie</h2>
    <p class="text-muted mt-3 leading-7">本工具的頁面目前<strong>沒有顯示廣告，也沒有載入廣告程式碼</strong>。口袋工具網站使用 Google AdSense 等第三方廣告服務；本工具日後若加入廣告，同樣適用以下說明：</p>
    <ul class="text-muted mt-2 leading-7 list-disc pl-5 space-y-1">
      <li>第三方廠商（包括 Google）會使用 Cookie，根據你先前造訪本網站或其他網站的紀錄，向你放送廣告。</li>
      <li>Google 使用廣告 Cookie，讓 Google 及其合作夥伴能依據你造訪本站和（或）網路上其他網站的紀錄，向你放送廣告。</li>
      <li>你可以前往 <a href="https://adssettings.google.com/" target="_blank" rel="noopener">Google 廣告設定</a>停用個人化廣告，也可以到 <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener">www.aboutads.info/choices</a> 停用部分第三方廠商用於個人化廣告的 Cookie。</li>
      <li>Google 如何使用合作夥伴網站與應用程式的資料，請參閱 <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Google 的說明</a>。</li>
    </ul>

    <h2 class="text-lg font-700 text-ink mt-7">政策變更與聯絡方式</h2>
    <p class="text-muted mt-3 leading-7">本頁內容有實質變動時，會更新上方的「最後更新日期」。對本政策或本工具有任何疑問，歡迎透過口袋工具的<a :href="publisher.contactUrl">聯絡我們</a>頁面與我們聯繫；網站的營運者與製作緣由見<RouterLink to="/about/">關於頁</RouterLink>。</p>
  </article>
</template>
