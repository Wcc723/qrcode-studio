<script setup lang="ts">
/**
 * /scan/：把已經在這台裝置上的圖片（截圖、附件、相簿照片）解碼成內容。
 *
 * 定位刻意與 /guide/scan-qr-code/ 分開：那一篇教「手機怎麼掃」，這一頁做的是
 * 「電腦裡的圖片怎麼讀」。兩邊互相連結，但不搶同一組字。
 *
 * 頁面說明、限制與隱私都寫在 SSR 就會輸出的內容裡（不是等 hydration 才出現的
 * 元件內部），這樣沒有 JavaScript 的爬蟲與讀者也拿得到完整資訊。
 */
import ScanTool from '@/components/scan/ScanTool.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'

// 第一步的按鍵（Ctrl、⌘、V）要包進 <kbd>，所以在模板裡另外寫，這裡只放後兩步
const steps = [
  '解碼在你的瀏覽器內完成，結果會先以純文字顯示，不會自動開啟任何連結',
  '確認內容沒問題後，再決定要複製、開啟，或帶回產生器重新製作一張',
]

const faqs = [
  {
    q: '圖片會上傳到伺服器嗎？',
    a: '不會。解碼用的是在你瀏覽器內執行的 WebAssembly 模組，圖片與解讀出來的內容都留在這個分頁裡，不會送到任何伺服器，也不會寫進瀏覽器的儲存空間。關掉分頁就什麼都不剩。',
  },
  {
    q: '支援哪些圖片格式？有大小限制嗎？',
    a: '支援 PNG、JPEG 與 WebP，一次一張。不支援 SVG，因為 SVG 是可執行的向量格式，不適合拿別人給的檔案直接算圖。檔案上限 12 MB，像素總數上限約 4000 萬，超過會請你先裁切或縮小。',
  },
  {
    q: '可以讀哪些條碼？',
    a: '與本站產生器支援的格式一致：QR Code，以及 Code 128、EAN-13、EAN-8、Code 39、ITF-14 五種一維條碼。其他符號學（DataMatrix、Aztec、PDF417 等）會明確告訴你不支援，而不是給你一個看起來像但其實不對的結果。',
  },
  {
    q: '一張圖裡有好幾個條碼怎麼辦？',
    a: '這一版會告訴你偵測到幾個，但不顯示結果，也不提供任何動作。因為掃描順序由演算法決定，跟你眼睛看到的主次無關，替你挑一個很可能挑錯而你不會發現。請把圖裁切成只剩一個條碼再試。',
  },
  {
    q: '為什麼讀到網址不會自動幫我打開？',
    a: 'QR Code 最常見的風險就是掃到偽造的網址。本工具只顯示完整文字、通訊協定與網站主機，由你確認之後再決定要不要開；而且只有 http 與 https 提供開啟按鈕，javascript:、data: 這類內容一律只顯示文字，連可以按的連結都不會產生。',
  },
  {
    q: '可以用相機即時掃描嗎？',
    a: '這一版不做相機掃描。手機內建相機本來就掃得又快又好，不需要再多一層網頁；本頁專心處理「圖片已經在裝置裡」的情況，例如別人傳來的截圖、郵件附件或下載的圖檔。手機怎麼掃的教學請看下方連結。',
  },
]

useSeoHead({
  title: 'QR Code 掃描器｜上傳圖片或貼上截圖，線上解碼 QR 與條碼',
  description: '免費線上 QR Code 掃描器與條碼解碼器：上傳圖片、拖放或直接貼上截圖，在瀏覽器內讀取 QR Code 與 Code 128、EAN-13 等一維條碼。圖片不上傳雲端，結果先安全預覽再決定是否開啟。',
  path: '/scan',
  appName: 'QR Code 掃描器',
  appType: 'WebApplication',
  ogImage: { path: '/og-scan.png', width: 1200, height: 630, alt: 'QR Code 掃描器：上傳圖片或貼上截圖就能解碼，圖片不上傳' },
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: 'QR Code 掃描器', url: `${site.url}/scan/` },
  ],
})
</script>

<template>
  <div class="py-8">
    <header class="max-w-screen-lg mx-auto px-4 mb-5">
      <span class="chip bg-pop-mint reveal reveal-1"><span class="i-lucide-lock" aria-hidden="true" />在你的瀏覽器內解碼・圖片不上傳</span>
      <h1 class="text-3xl md:text-4xl font-800 text-ink mt-3 reveal reveal-2">
        QR Code 掃描器：用圖片或截圖解碼
      </h1>
      <p class="text-muted font-600 mt-2 reveal reveal-3">
        把電腦或手機裡已經有的圖片丟進來就好：拖放、選檔案，或直接貼上截圖。
        支援 QR Code 與 Code 128、EAN-13、EAN-8、Code 39、ITF-14。
        不必安裝軟體、不需要相機權限，圖片與解讀出來的內容都留在你的瀏覽器裡。
      </p>
    </header>

    <div class="max-w-screen-lg mx-auto px-4">
      <div class="reveal reveal-4"><ScanTool /></div>
      <AdSlot slot-id="scan-below-tool" />
    </div>

    <article class="max-w-screen-lg mx-auto px-4 mt-12">
      <h2 class="text-2xl font-800 text-ink">什麼情況適合用網頁解碼圖片？</h2>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        手機相機掃眼前的實體 QR Code 又快又準，不需要網頁插手。真正麻煩的是
        <strong class="text-ink">條碼已經是一張圖</strong>的時候：同事用 LINE 傳來的截圖、
        郵件附件裡的電子票券、網頁上的付款碼、下載回來的圖檔。這些圖在電腦裡，
        你沒辦法拿相機對著自己的螢幕掃得很順，通常還得掏出手機拍一次。
      </p>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        這一頁就是為那個情境做的：<strong class="text-ink">貼上截圖</strong>或拖放圖檔，
        在瀏覽器內直接解碼。免安裝、免註冊、不需要開相機權限，
        圖片也不會被上傳到任何雲端服務。
      </p>

      <h3 class="text-xl font-700 text-ink mt-8">使用步驟</h3>
      <ol class="list-none pl-0 mt-4 grid gap-3 sm:grid-cols-3">
        <li class="card p-4 flex gap-3 items-start">
          <span class="shrink-0 w-7 h-7 rounded-full bg-pop-sun border-2 border-ink font-display font-700 flex items-center justify-center text-sm">1</span>
          <span class="font-600 text-ink/85 leading-snug">把圖片拖進虛線框，或按「選擇圖片」，也可以直接 <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>V</kbd> 貼上截圖</span>
        </li>
        <li v-for="(s, i) in steps" :key="i" class="card p-4 flex gap-3 items-start">
          <span class="shrink-0 w-7 h-7 rounded-full bg-pop-sun border-2 border-ink font-display font-700 flex items-center justify-center text-sm">{{ i + 2 }}</span>
          <span class="font-600 text-ink/85 leading-snug">{{ s }}</span>
        </li>
      </ol>

      <h2 class="text-2xl font-800 text-ink mt-10">安全與隱私：這一頁做了什麼、不做什麼</h2>
      <ul class="list-disc pl-5 mt-3 space-y-1.5 text-ink/80 font-600 leading-relaxed">
        <li><strong class="text-ink">圖片不離開瀏覽器</strong>：解碼模組（WebAssembly）由本站提供並在你的裝置上執行，圖片不會上傳，解碼結果也不會寫進 Cookie 或瀏覽器儲存空間。</li>
        <li><strong class="text-ink">不自動開啟任何東西</strong>：結果一律先以純文字顯示，不會自動跳轉、不會自動下載，也不會執行掃到的內容。</li>
        <li><strong class="text-ink">只有 http 與 https 給開啟按鈕</strong>：其他通訊協定（例如 javascript:、data:）只顯示文字，並且會告訴你那不是一般網址。</li>
        <li><strong class="text-ink">一次一張、一個碼</strong>：不支援多圖批次；一張圖裡有兩個以上的條碼時會直接說明，不會替你挑一個。</li>
        <li><strong class="text-ink">不支援 SVG</strong>：SVG 可以夾帶腳本與外部參照，不適合拿來路過算圖。請改用 PNG、JPEG 或 WebP。</li>
      </ul>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        完整說明見<RouterLink to="/privacy/" class="text-brand underline font-700">隱私權政策</RouterLink>，
        解碼器的第三方授權列在<RouterLink to="/about/" class="text-brand underline font-700">關於頁</RouterLink>。
      </p>

      <h2 class="text-2xl font-800 text-ink mt-10">想用手機掃眼前的 QR Code？</h2>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        那種情況不必用這一頁。iPhone 與 Android 的內建相機、LINE 的行動條碼掃描器都能直接掃，
        步驟與設定位置整理在<RouterLink to="/guide/scan-qr-code/" class="text-brand underline font-700">如何掃描 QR Code（手機相機、LINE、電腦）</RouterLink>。
        本頁處理的是另一半：<strong class="text-ink">條碼已經變成圖片</strong>的時候怎麼讀。
      </p>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        要反過來自己<strong class="text-ink">製作</strong>條碼，請用<RouterLink to="/" class="text-brand underline font-700">免費 QR Code 產生器</RouterLink>或<RouterLink
          to="/barcode/" class="text-brand underline font-700">一維條碼產生器</RouterLink>。
        解碼出來的內容也可以直接按「用此內容重新產生」帶過去。
      </p>

      <h3 class="text-xl font-700 text-ink mt-8">常見問題</h3>
      <div class="mt-4 space-y-3">
        <details v-for="(f, i) in faqs" :key="i" class="card p-4">
          <summary class="font-display font-700 text-ink cursor-pointer select-none">{{ f.q }}</summary>
          <p class="text-ink/75 font-600 mt-2 leading-relaxed">{{ f.a }}</p>
        </details>
      </div>
    </article>
  </div>
</template>
