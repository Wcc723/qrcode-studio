<script setup lang="ts">
import BatchTool from '@/components/batch/BatchTool.vue'
import ToolZone from '@/components/ToolZone.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
import { BATCH_MAX_ROWS } from '@/pure/batch/rows'
import { formatCount } from '@/pure/batch/sequence'

const max = formatCount(BATCH_MAX_ROWS)

const faqs = [
  { q: '一次可以做幾張？', a: `一次最多 ${max} 筆，PNG、SVG 都一樣。全部在你的瀏覽器裡產生，張數越多、圖片越大，需要的時間越久，畫面上會顯示進度，隨時可以取消。更多的話請分成幾批產生。` },
  { q: '我貼上的清單會上傳嗎？', a: '不會。清單、連號與做好的圖片只在這個分頁的記憶體裡，ZIP 也是在你的瀏覽器裡打包好直接下載，不會上傳到任何伺服器，也不會存進網址、Cookie 或瀏覽器的儲存空間。網站的流量統計只記大概幾筆（例如 51 到 200 筆）、哪一種碼、下載 PNG 還是 SVG，不含清單內容與檔名。' },
  { q: '為什麼有些列被標成紅色？', a: '那一列做不成碼：QR Code 的內容太長、EAN 的位數或檢查碼不對、Code 39 有不支援的字元（例如中文或 # @ 這類符號），或是內容空白。可以回到 Excel 修正後重新貼上，或選「略過有問題的列」先產生其他的。內容重複只會提醒，照樣產生。' },
  { q: 'EAN-13 的檢查碼要自己算嗎？', a: '不用。輸入 12 位會自動補上第 13 位；輸入 13 位會驗證，不符的那一列會標紅並告訴你正確的檢查碼應該是多少。用連號產生的店內碼也一樣，每一筆都會算好。' },
  { q: '檔名怎麼決定？', a: '從 Excel 貼上時可以選「檔名欄」，例如財產編號；每行一筆與連號可以用內容本身或流水號（001、002…）。檔名不能用的字元（/ \\ : * ? " < > |）會換成底線，重複的檔名自動加上 (2)、(3)。' },
  { q: '為什麼沒有顏色和 LOGO？', a: '標籤與條碼用黑白最好掃，批次產生只做黑白。要做彩色、加 LOGO 的單張 QR Code，請用免費 QR Code 產生器。' },
]

const steps = [
  '選輸入方式：從 Excel 貼上、每行一筆，或設定連號',
  '要做成網址時填內容範本，例如 https://example.com/asset/{編號}',
  '選 QR Code 或條碼種類，看「檢查結果」有沒有標紅的列',
  '選 PNG 或 SVG，按「下載 ZIP」',
]

useSeoHead({
  title: '批次產生 QR Code 與條碼｜Excel 貼上、連號流水號，免費下載 ZIP',
  description: '一次產生上千張 QR Code 或條碼：從 Excel 貼上清單、設定連號流水號或套用網址範本，自動補 EAN-13 檢查碼、逐列抓出錯誤，免費免註冊、清單不上傳，立即下載 PNG 或 SVG 的 ZIP 檔。',
  path: '/batch',
  appName: '批次產生 QR Code 與條碼',
  appType: 'WebApplication',
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: '批次產生 QR Code 與條碼', url: `${site.url}/batch/` },
  ],
})
</script>

<template>
  <div>
    <ToolZone lead="貼上 Excel 清單或設定連號，一次下載整包 ZIP">
      <template #title>批次產生 QR Code 與條碼</template>
      <BatchTool />
    </ToolZone>

    <article class="max-w-[720px] mx-auto px-4 mt-10 text-ink/85 font-600 leading-relaxed" data-test="doc">
      <p class="zone-label"><span class="icon-badge-sm bg-pop-sky"><span class="i-lucide-book-open" aria-hidden="true" /></span>使用說明</p>
      <p class="text-lg text-ink" data-test="doc-lead">
        免費線上批次產生 QR Code 與一維條碼：從 Excel 或 Google 試算表貼上清單、每行一筆，或直接設定連號，一次做出上千張，打包成 ZIP 下載。
        支援 QR Code、Code 128、EAN-13、EAN-8、Code 39、ITF-14，自動補上檢查碼、逐列檢查錯誤，清單只在你的瀏覽器裡處理，不會上傳。
      </p>

      <h2 class="text-2xl font-800 text-ink mt-8">三種輸入方式</h2>
      <ul class="list-disc pl-5 mt-3 space-y-2">
        <li><strong class="text-ink">從 Excel 貼上</strong>：在 Excel 或 Google 試算表選取整塊儲存格（可以連欄名那一列一起），複製後貼上。工具會判斷第一列是不是欄名，你再選哪一欄要做成碼（內容欄）、哪一欄當檔名（檔名欄），其他欄先不用管。</li>
        <li><strong class="text-ink">每行一筆</strong>：一行一個網址或編號，空白行會自動略過。適合手上已經有一串網址的情況。</li>
        <li><strong class="text-ink">連號（流水號）</strong>：設定前綴、起始值、數量或結束值、增量、補零位數與後綴，例如 TP-0001 到 TP-0500，畫面上即時顯示前三筆與最後一筆，不必先在 Excel 往下拉。</li>
      </ul>

      <h2 class="text-2xl font-800 text-ink mt-10">常見用法</h2>
      <h3 class="text-xl font-700 text-ink mt-6">財產與設備標籤</h3>
      <p class="mt-3">把財產清冊的「財產編號」那一欄連同欄名一起複製貼上，內容欄選財產編號。要給掃描槍讀編號選 Code 128；要讓手機一掃就打開這台設備的資料頁，選 QR Code，並在內容範本填 <code>https://你的網站/asset/{編號}</code>。</p>

      <h3 class="text-xl font-700 text-ink mt-6">商品條碼與店內碼</h3>
      <p class="mt-3">店裡自己用的商品碼可以用 EAN-13 的店內碼（20 到 29 開頭）：選「連號」，前綴 20、起始值 1、補零 10 位，每一筆的第 13 位檢查碼會自動算好。20 到 29 開頭只在自己店裡有效，要上架通路請向 GS1 台灣申請正式的商品條碼。</p>

      <h3 class="text-xl font-700 text-ink mt-6">序號、兌換券與流水號</h3>
      <p class="mt-3">序號 A0001 到 A0500 用連號：前綴 A、補零 4 位、數量 500。檔名選「用連號」，ZIP 解開就是 A0001.png、A0002.png，照順序排好。</p>

      <h3 class="text-xl font-700 text-ink mt-6">Google 表單預填：每張 QR Code 自動帶入編號</h3>
      <ol class="list-decimal pl-5 mt-3 space-y-1">
        <li>在 Google 表單的選單點「取得預先填入的連結」，在編號那一題填一個示範值（例如 TEST），取得連結並複製。</li>
        <li>把連結貼進「內容範本」，把網址最後的 TEST 換成 <code>{編號}</code>，例如 <code>…&amp;entry.123456789={編號}</code>。</li>
        <li>貼上編號清單或設定連號。每一張 QR Code 掃開，都是已經填好自己編號的表單。</li>
      </ol>
      <p class="mt-3">範本是網址時，代入的編號會自動轉成網址可用的寫法，編號裡有空白、中文或 &amp; 也不會把網址弄壞。</p>

      <h2 class="text-2xl font-800 text-ink mt-10">一維條碼還是 QR Code？</h2>
      <p class="mt-3">要給掃描槍讀編號、跟收銀或庫存系統對接，用一維條碼：Code 128 最通用，零售商品用 EAN-13。要讓手機相機一掃就打開網頁、表單或說明頁，用 QR Code。兩種都要也可以，同一份清單先做一次 QR Code，再切到 Code 128 做一次。</p>
      <p class="mt-3">只要做一張的話，用<RouterLink to="/barcode/" class="text-link underline underline-offset-2 font-700">條碼產生器</RouterLink>或<RouterLink to="/" class="text-link underline underline-offset-2 font-700">免費 QR Code 產生器</RouterLink>，可以調顏色、加 LOGO。</p>

      <h2 class="text-2xl font-800 text-ink mt-10">印出去的碼不會過期，網址要選你能長期維持的</h2>
      <p class="mt-3">本站做的是靜態 QR Code：網址直接存在圖裡，不經過任何轉址服務，印出去之後不會因為哪個服務停掉而失效。但碼裡的網址要一直打得開：請用你自己能長期維持的網址，不要用短網址服務，也避免之後會改的網址（例如表單換一份、網站改版換路徑）。網址一改，已經貼出去的標籤就得重印。</p>

      <h2 class="text-2xl font-800 text-ink mt-10">使用步驟</h2>
      <ol class="doc-steps">
        <li v-for="(s, i) in steps" :key="i">
          <span class="step-no">{{ i + 1 }}</span>
          <span>{{ s }}</span>
        </li>
      </ol>

      <h2 class="text-2xl font-800 text-ink mt-10">常見問題</h2>
      <div class="doc-faq">
        <details v-for="(f, i) in faqs" :key="i">
          <summary>{{ f.q }}<span class="i-lucide-chevron-down faq-chevron" aria-hidden="true" /></summary>
          <p>{{ f.a }}<template v-if="i === 1">詳見<RouterLink to="/privacy/" class="text-link underline underline-offset-2 font-700">隱私權政策</RouterLink>。</template></p>
        </details>
      </div>
    </article>
  </div>
</template>
