<script setup lang="ts">
import { computed } from 'vue'
import { qrTypes } from '@/config/qr-types'
import { guides } from '@/content/guides'
import { site, publisher } from '@/config/site'
import { LANG_TAG, useLocale } from '@/i18n/locale'

const props = withDefaults(defineProps<{
  /** 語言切換連到哪裡（App.vue 依目前的路由算好：另一個語系的同一頁，沒有就是那個語系的首頁） */
  switchTo?: string
}>(), { switchTo: '/en/' })

const locale = useLocale()
const isEn = computed(() => locale.value === 'en')

// 站徽是 public/ 底下的點陣圖（scripts/brand/render.mjs 產生）。模板裡寫死 /logo-64.png 不會經過 Vite base，
// 在子路徑下會連到 hub 的 404，所以從 BASE_URL 組出網址。
const base = import.meta.env.BASE_URL

// 回報問題：點下去才補目前頁面的路徑（只取 pathname，產生器與掃描器的內容都不在網址上，也不帶 ? 與 #）。
// 中鍵、複製連結就只帶 site。英文版連到問題回報的英文頁。
function addReportPath(event: MouseEvent) {
  const url = isEn.value ? publisher.reportUrlEn : publisher.reportUrl
  ;(event.currentTarget as HTMLAnchorElement).href = `${url}&path=${encodeURIComponent(location.pathname)}`
}

// 頁首導覽：桌機是一排膠囊，手機在標題列下方另起一排（可橫向捲動）。英文版只有三頁。
const navZh = [
  { to: '/', label: '產生器' },
  { to: '/scan/', label: '掃描器' },
  { to: '/barcode/', label: '條碼' },
  { to: '/guide/', label: '教學' },
  { to: '/faq/', label: '常見問題' },
]
// 英文的字比較長：手機那一排要放得下三頁加語言切換（400px 寬）
const navEn = [
  { to: '/en/', label: 'QR Code' },
  { to: '/en/batch/', label: 'Bulk QR' },
  { to: '/en/barcode/', label: 'Barcode' },
]
const nav = computed(() => (isEn.value ? navEn : navZh))

/** 語言切換：連到另一個語系，連結文字用那個語系寫 */
const lang = computed(() => (isEn.value
  ? { label: '中文', lang: LANG_TAG['zh-TW'] }
  : { label: 'English', lang: LANG_TAG.en }))
const homeTo = computed(() => (isEn.value ? '/en/' : '/'))
const siteName = computed(() => (isEn.value ? site.nameEn : site.name))
const hub = computed(() => (isEn.value
  ? { url: publisher.urlEn, label: publisher.nameEn }
  : { url: publisher.url, label: '口袋工具' }))
const navLabel = computed(() => (isEn.value ? 'Main menu' : '主選單'))
</script>
<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b-3 border-ink bg-pop-sun/90">
      <div class="max-w-screen-lg mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <!-- 320 到 359px：站名縮一級，右邊「口袋工具」才不會壓到頁面邊距 -->
        <RouterLink :to="homeTo" class="flex items-center gap-2.5 max-[359px]:gap-2 font-display font-700 text-xl max-[359px]:text-lg text-ink whitespace-nowrap shrink-0">
          <img :src="`${base}logo-64.png`" :srcset="`${base}logo-64.png 2x, ${base}logo-96.png 3x`" width="32" height="32" alt="" class="w-8 h-8 shrink-0" data-test="site-logo">
          <span data-test="site-name">{{ siteName }}</span>
        </RouterLink>
        <nav :aria-label="navLabel" class="hidden md:flex items-center gap-1.5 text-sm font-700">
          <RouterLink v-for="n in nav" :key="n.to" :to="n.to" exact-active-class="!border-ink bg-white"
            class="px-3 py-1 rounded-full border-2 border-transparent hover:border-ink hover:bg-white transition whitespace-nowrap">{{ n.label }}</RouterLink>
          <!-- 768 到 1023px 只留圖示（字給報讀器與滑鼠提示），一排才放得下繁中的五個連結加口袋工具 -->
          <RouterLink :to="props.switchTo" :hreflang="lang.lang" :lang="lang.lang" :title="lang.label" data-test="lang-switch"
            class="ml-1 inline-flex items-center gap-1 px-3 max-lg:px-2 py-1 rounded-full border-2 border-ink bg-white hover:bg-pop-sky transition whitespace-nowrap"><span class="i-lucide-languages" aria-hidden="true" /><span class="max-lg:sr-only">{{ lang.label }}</span></RouterLink>
          <a :href="hub.url" class="inline-flex items-center gap-1 px-3 py-1 rounded-full border-2 border-ink bg-white hover:bg-pop-mint transition whitespace-nowrap"><span class="i-lucide-toolbox" aria-hidden="true" />{{ hub.label }}</a>
        </nav>
        <a :href="hub.url" class="md:hidden chip !text-sm !px-2.5 !py-1 bg-white shrink-0"><span class="i-lucide-toolbox" aria-hidden="true" />{{ hub.label }}</a>
      </div>
      <nav :aria-label="navLabel" class="md:hidden border-t-2 border-ink/15">
        <div class="max-w-screen-lg mx-auto px-4 py-2 flex gap-1.5 overflow-x-auto text-sm font-700 whitespace-nowrap">
          <RouterLink v-for="n in nav" :key="n.to" :to="n.to" exact-active-class="!bg-white"
            class="chip !text-sm !px-2.5 !py-1 bg-white/60">{{ n.label }}</RouterLink>
          <!-- 語言切換排在這一排的最後：手機的標題列在 320px 寬時放不下第三個膠囊 -->
          <RouterLink :to="props.switchTo" :hreflang="lang.lang" :lang="lang.lang" data-test="lang-switch-mobile"
            class="chip !text-sm !px-2.5 !py-1 bg-white"><span class="i-lucide-languages" aria-hidden="true" />{{ lang.label }}</RouterLink>
        </div>
      </nav>
    </header>
    <main class="flex-1"><slot /></main>
    <footer v-if="isEn" class="border-t-3 border-ink mt-16 bg-white">
      <div class="max-w-screen-lg mx-auto px-4 py-10 grid gap-8 grid-cols-2 md:grid-cols-3 text-sm">
        <section>
          <h2 class="font-display font-700 text-ink text-base">Free tools</h2>
          <ul class="mt-3 space-y-1.5 font-600 text-muted list-none p-0">
            <li><RouterLink to="/en/" class="hover:text-link transition">QR code generator</RouterLink></li>
            <li><RouterLink to="/en/batch/" class="hover:text-link transition">Bulk QR code generator</RouterLink></li>
            <li><RouterLink to="/en/barcode/" class="hover:text-link transition">Barcode generator</RouterLink></li>
            <li><a :href="publisher.toolsUrlEn" class="hover:text-link transition">More free tools</a></li>
          </ul>
        </section>
        <section>
          <h2 class="font-display font-700 text-ink text-base">In Chinese only</h2>
          <ul class="mt-3 space-y-1.5 font-600 text-muted list-none p-0">
            <li><RouterLink to="/scan/" class="hover:text-link transition">QR code scanner</RouterLink></li>
            <li><RouterLink to="/wifi/" class="hover:text-link transition">WiFi QR code</RouterLink></li>
            <li><RouterLink to="/vcard/" class="hover:text-link transition">vCard QR code</RouterLink></li>
            <li><RouterLink to="/guide/" class="hover:text-link transition">QR code guides</RouterLink></li>
          </ul>
        </section>
        <section>
          <h2 class="font-display font-700 text-ink text-base">About</h2>
          <ul class="mt-3 space-y-1.5 font-600 text-muted list-none p-0">
            <li><a :href="publisher.aboutToolUrlEn" class="hover:text-link transition">About {{ site.nameEn }}</a></li>
            <li><a :href="publisher.privacyUrlEn" class="hover:text-link transition">Privacy policy</a></li>
            <li><a :href="publisher.contactUrlEn" class="hover:text-link transition">Contact</a></li>
            <li>
              <a :href="publisher.reportUrlEn" target="_blank" rel="nofollow noopener" referrerpolicy="no-referrer" class="hover:text-link transition" data-test="report-link" @click="addReportPath"
                >Report a problem<span class="sr-only"> (opens in a new tab)</span></a
              >
            </li>
            <li><a :href="publisher.urlEn" class="hover:text-link transition">{{ publisher.nameEn }}</a></li>
          </ul>
        </section>
      </div>
      <div class="border-t-2 border-ink/10">
        <p class="max-w-screen-lg mx-auto px-4 py-4 text-xs text-muted font-600">
          © {{ site.nameEn }} · Made by <a :href="publisher.urlEn" class="hover:text-link underline underline-offset-2">{{ publisher.nameEn }}</a> · <span class="i-lucide-lock" aria-hidden="true" /> Made in your browser, nothing is uploaded
        </p>
        <p class="max-w-screen-lg mx-auto px-4 pb-4 -mt-2 text-xs text-muted" data-test="trademark">{{ site.trademarkEn }}</p>
      </div>
    </footer>
    <footer v-else class="border-t-3 border-ink mt-16 bg-white">
      <div class="max-w-screen-lg mx-auto px-4 py-10 grid gap-8 grid-cols-2 md:grid-cols-4 text-sm">
        <section>
          <h2 class="font-display font-700 text-ink text-base">QR Code 類型</h2>
          <ul class="mt-3 space-y-1.5 font-600 text-muted list-none p-0">
            <li v-for="t in qrTypes" :key="t.type">
              <RouterLink :to="`${t.path}/`" class="hover:text-link transition">{{ t.label }} QR Code</RouterLink>
            </li>
          </ul>
        </section>
        <section>
          <h2 class="font-display font-700 text-ink text-base">其他工具</h2>
          <ul class="mt-3 space-y-1.5 font-600 text-muted list-none p-0">
            <li><RouterLink to="/" class="hover:text-link transition">免費 QR Code 產生器</RouterLink></li>
            <li><RouterLink to="/scan/" class="hover:text-link transition">QR Code 掃描器</RouterLink></li>
            <li><RouterLink to="/barcode/" class="hover:text-link transition">條碼產生器</RouterLink></li>
            <li><RouterLink to="/batch/" class="hover:text-link transition">批次產生 QR Code 與條碼</RouterLink></li>
            <li><a :href="publisher.toolsUrl" class="hover:text-link transition">更多免費工具</a></li>
          </ul>
        </section>
        <section>
          <h2 class="font-display font-700 text-ink text-base">教學</h2>
          <ul class="mt-3 space-y-1.5 font-600 text-muted list-none p-0">
            <li v-for="g in guides" :key="g.slug">
              <RouterLink :to="`/guide/${g.slug}/`" class="hover:text-link transition">{{ g.shortTitle }}</RouterLink>
            </li>
            <li><RouterLink to="/guide/" class="inline-flex items-center gap-1 hover:text-link transition">所有教學<span class="i-lucide-arrow-right" aria-hidden="true" /></RouterLink></li>
          </ul>
        </section>
        <section>
          <h2 class="font-display font-700 text-ink text-base">關於</h2>
          <ul class="mt-3 space-y-1.5 font-600 text-muted list-none p-0">
            <li><RouterLink to="/about/" class="hover:text-link transition">關於 {{ site.name }}</RouterLink></li>
            <li><RouterLink to="/faq/" class="hover:text-link transition">常見問題</RouterLink></li>
            <li><RouterLink to="/privacy/" class="hover:text-link transition">隱私權政策</RouterLink></li>
            <li><a :href="publisher.contactUrl" class="hover:text-link transition">聯絡我們</a></li>
            <li>
              <a :href="publisher.reportUrl" target="_blank" rel="nofollow noopener" referrerpolicy="no-referrer" class="hover:text-link transition" data-test="report-link" @click="addReportPath"
                >回報問題<span class="sr-only">（另開分頁）</span></a
              >
            </li>
            <li><a :href="publisher.url" class="hover:text-link transition">口袋工具 Pocketool</a></li>
          </ul>
        </section>
      </div>
      <div class="border-t-2 border-ink/10">
        <p class="max-w-screen-lg mx-auto px-4 py-4 text-xs text-muted font-600">
          © {{ site.name }} · <a :href="publisher.url" class="hover:text-link underline underline-offset-2">口袋工具 Pocketool</a> 出品 · <span class="i-lucide-lock" aria-hidden="true" /> 瀏覽器內生成，內容不傳雲端
        </p>
        <p class="max-w-screen-lg mx-auto px-4 pb-4 -mt-2 text-xs text-muted" data-test="trademark">{{ site.trademark }}</p>
      </div>
    </footer>
  </div>
</template>
