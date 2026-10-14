<script setup lang="ts">
import BatchTool from '@/components/batch/BatchTool.vue'
import ToolZone from '@/components/ToolZone.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
import { BATCH_MAX_ROWS } from '@/pure/batch/rows'
import { formatCount } from '@/pure/batch/sequence'
import { BARCODE_MIN_X_MM, CALIBRATION_MM, PRINTER_EDGE_RANGE } from '@/pure/batch/paper'
import { CODE128_MAX_LENGTH, CODE39_MAX_LENGTH } from '@/pure/validateBarcode'

const max = formatCount(BATCH_MAX_ROWS)
/** 校正尺的長度（公分）與條碼最細的線的下限：數字從 paper.ts 來 */
const rulerCm = CALIBRATION_MM / 10
const code128MinMm = BARCODE_MIN_X_MM.code128

// link：答案後面接一段文字與站內連結（模板裡用 RouterLink，不走 v-html），最後補句號
interface BatchFaq { q: string; a: string; link?: { lead: string; to: string; text: string } }
const faqs: BatchFaq[] = [
  { q: 'Excel 的清單怎麼一次轉成 QR Code 或條碼？', a: '在 Excel 或 Google 試算表選取整塊儲存格（可以連欄名那一列）複製，回到這頁選「從 Excel 貼上」並貼進輸入框，再選內容欄、檔名欄與碼的種類，按「下載 ZIP」就好，不用裝增益集、條碼字型或寫公式。', link: { lead: '想在 Excel、Google 試算表或 Word 裡自己做，公式、條碼字型與合併列印的做法見', to: '/guide/excel-qr-code-barcode/', text: 'Excel 怎麼做 QR Code 與條碼' } },
  { q: '一次可以做幾張？', a: `一次最多 ${max} 筆，PNG、SVG 都一樣。全部在你的瀏覽器裡產生，張數越多、圖片越大，需要的時間越久，畫面上會顯示進度，隨時可以取消。更多的話請分成幾批產生。` },
  { q: '我貼上的清單會上傳嗎？', a: '不會。清單、連號與做好的圖片只在這個分頁的記憶體裡，ZIP 也是在你的瀏覽器裡打包好直接下載，不會上傳到任何伺服器，也不會存進網址、Cookie 或瀏覽器的儲存空間。網站的流量統計只記大概幾筆（例如 51 到 200 筆）、哪一種碼、下載 PNG 還是 SVG，不含清單內容與檔名。', link: { lead: '詳見', to: '/privacy/', text: '隱私權政策' } },
  { q: '為什麼有些列被標成紅色？', a: `那一列做不成碼，紅字會寫出原因，常見的有：QR Code 的內容太長，超過能放的上限；EAN-13、EAN-8、ITF-14 混了數字以外的字（空白與 - 會自動去掉）、位數不對或檢查碼不符；Code 128 超過 ${CODE128_MAX_LENGTH} 個字元、Code 39 超過 ${CODE39_MAX_LENGTH} 個字元，或是有不支援的字元，例如中文，Code 39 也不收 # @ & 這類符號；或是內容空白。可以選「略過有問題的列」先產生其他的，或回到 Excel 修好再重新貼上。內容重複只會提醒，照樣產生。` },
  { q: 'EAN-13 的檢查碼要自己算嗎？', a: '不用。輸入 12 位會自動補上第 13 位；輸入 13 位會驗證，不符的那一列會標紅並告訴你正確的檢查碼應該是多少。用連號產生的店內碼也一樣，每一筆都會算好。' },
  { q: '檔名怎麼決定？', a: '從 Excel 貼上時可以選「檔名欄」，例如財產編號；每行一筆與連號可以用內容本身或流水號（001、002…）。檔名不能用的字元（/ \\ : * ? " < > |）會換成底線，重複的檔名自動加上 (2)、(3)。' },
  { q: '為什麼沒有顏色和 LOGO？', a: '標籤與條碼用黑白最好掃，批次產生只做黑白。', link: { lead: '要做彩色、加 LOGO 的單張 QR Code，請用', to: '/', text: '免費 QR Code 產生器' } },
  { q: '可以直接印在 A4 標籤貼紙上嗎？', a: '可以。輸出方式選「印成 A4 標籤紙」，再選鶴屋或龍德的型號（找不到可以自訂尺寸），每一格是一個碼加一到三行字，按「列印標籤」用瀏覽器直接印。本站不產生 PDF 檔，想存成 PDF，可以在列印視窗的目的地選「另存為 PDF」。' },
  { q: '印出來的位置跟標籤對不準怎麼辦？', a: `先用白紙印「對位測試頁」，量上面的校正尺是不是剛好 ${rulerCm} 公分：短了就是列印設定有縮放，請把縮放改成「實際大小（100%）」、邊界選「無」，不要選「符合頁面大小」。尺寸對了但整批往同一邊偏，就把測試頁疊在標籤紙上對著光看偏了多少，填進「位移微調」再印一次；勾選「記住這台印表機的位移」，下次就不用重量。` },
  { q: '標籤紙用掉一半，可以接著印嗎？', a: '可以。在「從第幾格開始印」填第一張還沒用的格子號碼（由左到右、由上到下數），前面的格子會留白。只有第一張受影響，第二張起從第 1 格開始。' },
]

const steps = [
  '選輸入方式：從 Excel 貼上、每行一筆，或設定連號',
  '要做成網址時填內容範本，例如 https://example.com/asset/{編號}',
  '選 QR Code 或條碼種類，看「檢查結果」有沒有標紅的列',
  '選 PNG 或 SVG 按「下載 ZIP」；要印成貼紙就選「印成 A4 標籤紙」，挑好型號後按「列印標籤」',
]

useSeoHead({
  title: '批次產生 QR Code 與條碼｜Excel 貼上，免費下載 ZIP、印標籤紙',
  description: '免費批次產生 QR Code 與條碼，一次做上千張：從 Excel 貼上清單、設定流水號或套用網址範本，自動補 EAN-13 檢查碼、逐列抓錯，立即下載 PNG 或 SVG 的 ZIP 檔，或直接印在鶴屋、龍德的 A4 標籤紙上，清單不上傳。',
  path: '/batch',
  appName: '批次產生 QR Code 與條碼',
  appType: 'WebApplication',
  // 圖上的字在 scripts/brand/cards.mjs（og-batch.png）：替代文字以大標開頭，寫著橫幅、每個小標籤、圖角標籤與每格標籤上的字
  ogImage: {
    path: '/og-batch.png', width: 1200, height: 630,
    alt: '批次產生 QR Code 與條碼：Excel 貼上，下載 ZIP、印標籤紙，可設定連號、自動補檢查碼，清單不上傳。右邊是標著「標籤紙」的一張標籤紙，每格一個條碼，底下的字依序是 0001、0002、0003、0004、0005、0006',
  },
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: '批次產生 QR Code 與條碼', url: `${site.url}/batch/` },
  ],
})
</script>

<template>
  <div>
    <ToolZone lead="貼上 Excel 清單或連號，下載 ZIP 或印標籤紙">
      <template #title>批次產生 QR Code 與條碼</template>
      <BatchTool />
    </ToolZone>

    <article class="max-w-[720px] mx-auto px-4 mt-10 text-ink/85 font-600 leading-relaxed" data-test="doc">
      <p class="zone-label"><span class="icon-badge-sm bg-pop-sky"><span class="i-lucide-book-open" aria-hidden="true" /></span>使用說明</p>
      <p class="text-lg text-ink" data-test="doc-lead">
        免費線上批次產生 QR Code 與一維條碼：從 Excel 或 Google 試算表貼上清單、每行一筆，或直接設定連號，一次做出上千張，打包成 ZIP 下載。
        支援 QR Code、Code 128、EAN-13、EAN-8、Code 39、ITF-14，自動補上檢查碼（條碼最後一位，用來抓打錯的號碼）、逐列檢查錯誤，清單只在你的瀏覽器裡處理，不會上傳。
        也可以直接排在鶴屋、龍德的 A4 標籤紙上用瀏覽器列印：每格一個碼加一到三行字，從第幾格開始印都可以。
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

      <h2 class="text-2xl font-800 text-ink mt-10">印成 A4 標籤紙（鶴屋、龍德型號）</h2>
      <p class="mt-3">在「輸出方式」選「印成 A4 標籤紙」，清單會直接排在 A4 標籤貼紙上，用瀏覽器列印，不必再用 Word 設定合併列印。每一格是一個碼加一到三行字，例如財產編號、品名、保管單位，字依長度自動縮小，太長就截斷並列出是哪幾列。</p>
      <ul class="list-disc pl-5 mt-3 space-y-2">
        <li><strong class="text-ink">選型號</strong>：內建鶴屋與龍德常見的型號，從 2 × 5 的 10 格到 7 × 16 的 112 格，格子的位置照兩家官網提供的 Word 範本設定。同樣格數的型號，邊界可能差到 2 mm，請選包裝上寫的型號；清單裡沒有的，選「自訂尺寸」自己量。</li>
        <li><strong class="text-ink">從第幾格開始</strong>：用掉一半的標籤紙，填第一張還沒用的格子號碼，前面的格子留白，接著印下去。</li>
        <li><strong class="text-ink">每筆印幾份</strong>：同一筆連續印好幾張，例如一張貼在設備上、一張貼在財產卡上。</li>
        <li><strong class="text-ink">全版切割</strong>：整張都是標籤、四邊沒有留白的型號，多數印表機印不到紙邊 {{ PRINTER_EDGE_RANGE }}，最外圈格子裡的碼與字會自動往內縮。</li>
        <li><strong class="text-ink">印不出能掃的大小就擋下</strong>：條碼在小格子裡會被壓得太窄，例如 EAN-13 低於標準尺寸的 80%、Code 128 最細的線不到 {{ code128MinMm }} mm，工具會說明原因並停用列印，不會印出掃不到的標籤。</li>
      </ul>

      <h3 class="text-xl font-700 text-ink mt-6">印之前先對位</h3>
      <ol class="list-decimal pl-5 mt-3 space-y-1">
        <li>在「要印什麼」選「對位測試頁」，用一般白紙印一張：上面只有每一格的框線、格號與一把 {{ rulerCm }} 公分校正尺。</li>
        <li>量校正尺：剛好 {{ rulerCm }} 公分才是實際大小。短了就是列印設定有縮放，請把縮放改成「實際大小（100%）」或「預設」，邊界選「無」，不要選「符合頁面大小」。</li>
        <li>把印好的白紙疊在標籤紙上，對著光看，格線要落在標籤的切線上。整批往同一個方向偏，就在「位移微調」填偏了多少（mm），再印一次確認；勾選「記住這台印表機的位移」，下次不用重量。</li>
        <li>對準了，再放標籤紙，選回「標籤」按「列印標籤」。</li>
      </ol>

      <h2 class="text-2xl font-800 text-ink mt-10">一維條碼還是 QR Code？</h2>
      <p class="mt-3">要給掃描槍讀編號、跟收銀或庫存系統對接，用一維條碼：Code 128 最通用，零售商品用 EAN-13。要讓手機相機一掃就打開網頁、表單或說明頁，用 QR Code。兩種都要也可以，同一份清單先做一次 QR Code，再切到 Code 128 做一次。</p>
      <p class="mt-3">只要做一張的話，用<RouterLink to="/barcode/" class="text-link underline underline-offset-2 font-700">條碼產生器</RouterLink>或<RouterLink to="/" class="text-link underline underline-offset-2 font-700">免費 QR Code 產生器</RouterLink>；QR Code 產生器還可以調顏色、加 LOGO。</p>

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
          <p>{{ f.a }}<template v-if="f.link">{{ f.link.lead }}<RouterLink :to="f.link.to" class="text-link underline underline-offset-2 font-700">{{ f.link.text }}</RouterLink>。</template></p>
        </details>
      </div>
    </article>
  </div>
</template>
