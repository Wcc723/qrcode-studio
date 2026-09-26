<script setup lang="ts">
import BarcodeTool from '@/components/barcode/BarcodeTool.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'

const faqs = [
  { q: '一維條碼和 QR Code 有什麼不同？', a: '一維條碼由粗細不同的直條組成，只存得下十幾到二十幾位數字或英數，用途是對應一組商品編號或料號，品名與價格靠後端資料庫查。QR Code 是二維條碼，可直接存放網址、文字、WiFi 密碼與聯絡資訊，容量與容錯都遠高於一維條碼。' },
  { q: 'EAN-13 的檢查碼是什麼？要自己算嗎？', a: '不必自己算。EAN-13 的第 13 位是用前 12 位依 GS1 mod-10 規則算出來的檢查碼。你只要輸入前 12 位，本工具會自動補上並顯示完整號碼；若你輸入完整 13 位，工具會驗證檢查碼，不符時會告訴你正確的那一位是多少。' },
  { q: '為什麼不提供彩色條碼或加 LOGO？', a: '因為那會掃不到。大量收銀台與手持機用紅光讀取，紅、橘、黃在該波長下的反射率接近白紙，紅色的條等於沒有條。一維條碼也沒有 QR Code 那樣的錯誤更正碼，任何一條被遮住或對比不足，整張就失效。所以條碼本體固定純黑白。' },
  { q: '印出來掃不到，可能是什麼原因？', a: '最常見的是左右留白（靜區）被裁掉，或是印得太小。本工具產生的圖白底已經包含規範要求的靜區，請不要沿著條的邊緣再裁一次。另外最細的一條建議至少 0.3 mm 寬，要印刷請下載 SVG 向量檔，它帶有實體毫米尺寸。' },
  { q: '為什麼 PNG 拉進 Word 之後就掃不到了？', a: 'PNG 檔案本身無法記錄每英吋點數，所以在文件軟體裡隨手縮放就會把條壓得太細。需要精確尺寸時請下載 SVG，它的寬高是以毫米標示的，置入排版軟體時就是正確的標稱尺寸。' },
  { q: '支援電子發票的載具條碼嗎？', a: '不支援。電子發票有法定的專用格式與版本規範，不在本工具範圍內。本工具提供的是通用的一維條碼：Code 128、EAN-13、EAN-8、Code 39 與 ITF-14。' },
]

const steps = [
  '選擇條碼類型（不確定就先用 Code 128，商品零售用 EAN-13）',
  '輸入內容，預覽會即時更新，檢查碼與錯誤提示也會同步顯示',
  '下載 PNG 直接使用，或下載 SVG 向量檔送印刷',
]

useSeoHead({
  title: '一維條碼產生器｜EAN-13、Code 128 商品條碼線上免費製作',
  description: '免費線上一維條碼產生器，支援 EAN-13 商品條碼與 Code 128 等格式：輸入數字即時產生條碼，瀏覽器內生成、不傳雲端，自動計算檢查碼，免費下載 PNG 與 SVG 向量檔。',
  path: '/barcode',
  appName: '一維條碼產生器',
  appType: 'WebApplication',
  ogImage: { path: '/og-barcode.png', width: 1200, height: 630, alt: '一維條碼產生器：EAN-13、Code 128 線上製作，自動算檢查碼' },
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: '一維條碼', url: `${site.url}/barcode/` },
  ],
})
</script>

<template>
  <div class="py-8">
    <header class="max-w-screen-lg mx-auto px-4 mb-5">
      <span class="chip bg-pop-sky reveal reveal-1"><span class="i-lucide-lock" aria-hidden="true" />免費・不傳雲端</span>
      <h1 class="text-3xl md:text-4xl font-800 text-ink mt-3 reveal reveal-2">
        一維條碼產生器（EAN-13、Code 128）
      </h1>
      <p class="text-muted font-600 mt-2 reveal reveal-3">
        免費線上製作一維條碼，支援 Code 128、EAN-13、EAN-8、Code 39、ITF-14。
        瀏覽器內即時生成、不傳雲端，自動計算檢查碼，下載可直接印刷的 PNG 與 SVG 向量檔。
      </p>
    </header>

    <div class="max-w-screen-lg mx-auto px-4">
      <div class="reveal reveal-4"><BarcodeTool /></div>
      <AdSlot slot-id="barcode-below-tool" />
    </div>

    <article class="max-w-screen-lg mx-auto px-4 mt-12">
      <h2 class="text-2xl font-800 text-ink">一維條碼與 QR Code（二維條碼）差在哪？</h2>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        <strong class="text-ink">一維條碼</strong>由粗細不同的直條組成，只存得下十幾到二十幾位數字或英數，
        用途是對應一組商品編號或料號，品名與價格靠後端資料庫查。常見格式有 EAN-13、EAN-8、Code 128、Code 39 與 ITF-14。
      </p>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        <strong class="text-ink">QR Code（二維條碼）</strong>是方形點陣圖，可直接存放網址、文字、WiFi 密碼與聯絡資訊，
        掃描後不必查資料庫就能取得完整內容，容量與容錯都遠高於一維條碼。
      </p>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        要做的是商品包裝、庫存標籤、圖書編號那種直條條碼，就用本頁的一維條碼產生器；
        要做掃碼開網頁、加 LINE、連 WiFi 的方形圖，請改用<RouterLink to="/" class="text-brand underline font-700">免費 QR Code 產生器</RouterLink>或<RouterLink
          to="/url/" class="text-brand underline font-700">網址 QR Code 產生器</RouterLink>。
      </p>

      <h3 class="text-xl font-700 text-ink mt-8">五種格式怎麼選</h3>
      <ul class="list-disc pl-5 mt-3 space-y-1 text-ink/80 font-600 leading-relaxed">
        <li><strong class="text-ink">Code 128</strong>：物流、倉儲與內部管理最通用，可放英數與符號，密度也最高。不確定用哪個就選這個。</li>
        <li><strong class="text-ink">EAN-13</strong>：國際商品條碼，零售結帳用的就是它。13 位數字，最後一位是檢查碼。</li>
        <li><strong class="text-ink">EAN-8</strong>：EAN-13 的短版，給印刷面積太小的小包裝商品用。</li>
        <li><strong class="text-ink">Code 39</strong>：最老的英數條碼，老舊設備相容性最好，但同樣內容會比 Code 128 寬約三成。</li>
        <li><strong class="text-ink">ITF-14</strong>：外箱與瓦楞紙箱用，條粗、可遠距離掃，並帶規範要求的外框 bearer bar。</li>
      </ul>

      <h3 class="text-xl font-700 text-ink mt-8">使用步驟</h3>
      <ol class="list-none pl-0 mt-4 grid gap-3 sm:grid-cols-3">
        <li v-for="(s, i) in steps" :key="i" class="card p-4 flex gap-3 items-start">
          <span class="shrink-0 w-7 h-7 rounded-full bg-pop-sun border-2 border-ink font-display font-700 flex items-center justify-center text-sm">{{ i + 1 }}</span>
          <span class="font-600 text-ink/85 leading-snug">{{ s }}</span>
        </li>
      </ol>

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
