<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
import { site, publisher } from '@/config/site'
import { withBase } from '@/utils/with-base'

// 答案是 HTML（站內連結寫 href="/..."），用 v-html 輸出，所以要經過 withBase() 補子路徑前綴。
// 描述本站行為的句子以程式碼為準；不要寫工具做不到的事。
interface Faq { q: string; a: string }
const groups: { id: string; title: string; items: Faq[] }[] = [
  {
    id: 'cost', title: '費用與使用條件',
    items: [
      { q: 'QR Code 產生器要錢嗎？需要註冊嗎？', a: '完全免費、免註冊，也沒有浮水印。PNG、JPG 與 SVG 向量檔都能直接下載，商用與印刷皆可。' },
      { q: 'QR Code 會過期嗎？', a: '不會。本站產生的是靜態 QR Code，內容直接編碼在圖裡，掃描時不經過任何伺服器，所以就算本站有一天關閉，你印出去的 QR Code 照樣能用。要注意的只有一件事：如果 QR Code 裡放的是網址，那個網頁本身要一直存在。' },
      { q: '這是動態 QR Code 嗎？可以事後修改內容嗎？', a: '不是，靜態 QR Code 產生後就無法修改內容。如果目的地之後可能會變，可以讓 QR Code 指向你自己網站上的一個固定網址，要改時改網站內容就好。兩種 QR Code 的差別見<a href="/guide/what-is-qr-code/">什麼是 QR Code</a>。' },
      { q: '有數量或使用次數的限制嗎？', a: '沒有。想做幾張就做幾張，本站也不會記錄你做了哪些 QR Code。目前一次產生一張，沒有批次產生的功能。' },
    ],
  },
  {
    id: 'privacy', title: '隱私與安全',
    items: [
      { q: '我輸入的內容會被上傳嗎？', a: '不會。網址、WiFi 密碼、聯絡資訊等內容只在你的瀏覽器內編碼成圖片，不會上傳至雲端儲存空間，本站也不會保存。詳細說明見<a href="/privacy/">隱私權政策</a>。' },
      { q: '掃描器的圖片會上傳嗎？', a: '不會。<a href="/scan/">QR Code 掃描器</a>用在你瀏覽器內執行的 WebAssembly 模組解碼，圖片與解讀出來的內容都留在這個分頁的記憶體裡，關掉分頁就不會留下。' },
      { q: '網站會收集哪些資料？', a: '本站用 Google Analytics 收集瀏覽統計，例如看了哪些頁面、用什麼裝置，它以 _ga 開頭的 Cookie 區分不同的造訪。另外，Cloudflare 傳送每一頁時會自動加入 Cloudflare Web Analytics，統計瀏覽量與網頁速度，它不使用 Cookie。兩者都用來了解網站怎麼被使用，統計資料不包含你輸入到產生器或掃描器的任何內容，詳見<a href="/privacy/">隱私權政策</a>。' },
      { q: '掃到可疑的 QR Code 怎麼辦？', a: '先看清楚掃出來的網址是不是你預期的網域，不確定就不要點，更不要在那個頁面輸入帳號密碼或付款資料。本站的掃描器只顯示完整文字與網站主機，不會自動開啟連結。更多提醒見<a href="/guide/scan-qr-code/">如何掃描 QR Code</a>。' },
    ],
  },
  {
    id: 'design', title: '外觀與 LOGO',
    items: [
      { q: '可以加 LOGO 和自訂顏色嗎？', a: '可以。支援自訂前景與背景顏色、漸層、透明背景，以及上傳 LOGO。上傳 LOGO 時容錯等級會自動提高到 H，LOGO 大小也會自動控制在掃得出來的範圍內。' },
      { q: '加了 LOGO 會不會掃不到？', a: '用本站上傳 LOGO 的話，LOGO 最多只會蓋掉約 9% 的模組，遠低於 H 等級能還原的 30%，一般都能正常掃描。容易出問題的是配色太淡、LOGO 蓋到角落的定位圖形，或是下載後在設計軟體裡自己再貼一個大 LOGO。完整說明見<a href="/guide/qr-with-logo/">加 LOGO 的教學</a>。' },
      { q: '可以把方塊改成圓點或其他造型嗎？', a: '目前只提供標準的方塊造型，可以調整的是顏色、漸層、背景與 LOGO。' },
      { q: '淺色的 QR Code 配深色背景可以嗎？', a: '不建議。相機靠明暗差判讀，不少掃描器讀不了這種反白的 QR Code。請維持深色方塊、淺色背景，漸層的兩端也都要夠深。' },
      { q: '容錯等級要選哪一個？', a: '一般用途維持預設的 M；戶外、貼紙、包裝這類容易磨損的地方選 Q；要加 LOGO 用 H。容錯越高圖案越密，不一定越好，比較與實際圖例見<a href="/guide/error-correction/">容錯等級怎麼選</a>。' },
    ],
  },
  {
    id: 'download', title: '下載與印刷',
    items: [
      { q: '可以下載 SVG 向量檔嗎？', a: '可以，而且免費。SVG 放多大都不會失真，適合名片、海報與大圖輸出，也能直接在 Illustrator、Figma 等軟體裡編輯。' },
      { q: 'PNG 要設多大？', a: '「尺寸」滑桿可以設 200 到 2000 像素，預設 1000 像素。以印刷常用的 300 dpi 換算，1000 像素大約可以印 8.5 公分，2000 像素大約 16.9 公分；要印得更大請用 SVG。換算表見<a href="/guide/qr-code-svg/">SVG 與印刷尺寸</a>。' },
      { q: 'QR Code 要印多大才掃得到？', a: '常用的估算是：掃描距離大約是 QR Code 寬度的 10 倍。名片、桌卡通常 2 到 3 公分以上；要讓人站在 2 公尺外掃，至少要 20 公分左右。內容越長、圖案越密，就要印得更大，最可靠的方法是印一張樣張實測。' },
      { q: '下載的圖四周為什麼只有一點點白邊？', a: '下載的圖只在外圍留了一圈窄白邊。QR Code 規格要求四周至少留 4 個模組寬的空白（靜區），排版時請在四周自己留出這段空間，不要讓文字、邊框或圖案貼上來。' },
    ],
  },
  {
    id: 'types', title: 'QR Code 類型',
    items: [
      { q: '可以做哪些類型的 QR Code？', a: '支援<a href="/url/">網址</a>、<a href="/wifi/">WiFi</a>、<a href="/vcard/">電子名片</a>、<a href="/text/">純文字</a>、<a href="/email/">Email</a>、<a href="/phone/">電話</a>與<a href="/sms/">簡訊</a> 7 種。每一種都輸出手機相機認得的標準格式，例如 WiFi 用 WIFI:、電子名片用 vCard 3.0。' },
      { q: '中文內容可以嗎？', a: '可以。中文與 emoji 以 UTF-8 編碼，一個中文字佔 3 個位元組，所以同樣大小能放的中文字大約是英文字母的三分之一。內容很長時建議放在網頁上，QR Code 只放網址。' },
      { q: 'WiFi 換了密碼，QR Code 要重做嗎？', a: '要。靜態 QR Code 裡直接存著密碼，換密碼後請重新產生一張，並把舊的撤下。' },
      { q: '一維條碼和 QR Code 差在哪？', a: '一維條碼是商品包裝上那種直條條碼，主要存商品編號；QR Code 是二維條碼，可以直接存網址、文字與聯絡資訊。要做 EAN-13、Code 128 等商品或物流條碼，請用<a href="/barcode/">一維條碼產生器</a>。' },
    ],
  },
  {
    id: 'scan', title: '掃描',
    items: [
      { q: '怎麼掃描 QR Code？', a: '用 iPhone 或 Android 的內建相機對準即可，多數情況不需要另外安裝 App，也可以用 LINE 的掃描器。各系統的入口整理在<a href="/guide/scan-qr-code/">如何掃描 QR Code</a>。' },
      { q: '電腦裡的 QR Code 圖片或截圖怎麼讀？', a: '把圖片拖進或貼到本站的<a href="/scan/">QR Code 掃描器</a>，就能在瀏覽器內解碼，支援 PNG、JPEG 與 WebP，也能讀 Code 128、EAN-13 等一維條碼。' },
      { q: '我做的 QR Code 掃不到，可能是什麼原因？', a: '最常見的是：顏色對比不夠或反白、印得太小、四周沒有留白、內容太長導致圖案太密，或是下載後又自己貼了 LOGO。可以先把圖檔丟進<a href="/scan/">掃描器</a>確認內容正確，再依<a href="/guide/qr-code-svg/">印刷教學</a>檢查尺寸與靜區。' },
    ],
  },
]

const count = groups.reduce((n, g) => n + g.items.length, 0)

useSeoHead({
  title: 'QR Code 產生器常見問題｜QR Code Studio',
  description: `QR Code 產生器的 ${count} 個常見問題：是否免費、會不會過期、資料會不會上傳、加 LOGO 會不會掃不到、PNG 與 SVG 要多大、印多大才掃得到、各類型與掃描方式。`,
  path: '/faq',
  kind: 'page',
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: '常見問題', url: `${site.url}/faq/` },
  ],
})
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-3xl font-800 text-ink">QR Code 產生器常見問題</h1>
    <p class="text-ink/80 font-600 mt-4 leading-7">使用 {{ site.name }} 時最常被問到的問題，依主題分類。想看更完整的說明與圖例，可以到<RouterLink to="/guide/" class="text-link underline underline-offset-2 font-700">教學總覽</RouterLink>。</p>
    <nav aria-label="問題分類" class="mt-5 flex flex-wrap gap-2">
      <a v-for="g in groups" :key="g.id" :href="`#${g.id}`" class="chip bg-white hover:bg-pop-sun transition">{{ g.title }}</a>
    </nav>

    <section v-for="g in groups" :id="g.id" :key="g.id" class="mt-10 scroll-mt-4">
      <h2 class="text-xl font-800 text-ink">{{ g.title }}</h2>
      <div class="mt-4 space-y-3">
        <details v-for="(f, i) in g.items" :key="i" class="card p-4">
          <summary class="font-display font-700 text-ink cursor-pointer select-none">{{ f.q }}</summary>
          <p class="text-ink/75 font-600 mt-2 leading-relaxed [&_a]:(text-link underline underline-offset-2 font-700)" v-html="withBase(f.a)" />
        </details>
      </div>
    </section>

    <p class="mt-10 text-ink/80 font-600 leading-7">找不到你的問題？歡迎透過口袋工具的<a :href="publisher.contactUrl" class="text-link underline underline-offset-2 font-700">聯絡我們</a>頁面告訴我們。</p>
  </article>
</template>
