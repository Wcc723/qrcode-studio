<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { qrTypes } from '@/config/qr-types'
import { guides } from '@/content/guides'
import { site, publisher, FOOTER_SITE } from '@/config/site'
import { FOOTER_LOCALE, LANG_TAG, LANGUAGE_NAME, LOCALES, useLocale, type Locale } from '@/i18n/locale'
import PocketoolFooter from '@/shared/pocketool-footer/PocketoolFooter.vue'
import FootFold from '@/components/FootFold.vue'
import type { PocketoolFooterLanguageInput } from '@/shared/pocketool-footer/pocketool-footer-data.mjs'

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

// 頁首導覽：1024px 以上排在站名右邊，以下在標題列下方另起一排（可橫向捲動）。英文版只有三頁。
// 2026-11 改版加上「批次」（站長裁示）：之前批次頁只能從文章連結與頁尾進去。
const navZh = [
  { to: '/', label: '產生器' },
  { to: '/scan/', label: '掃描器' },
  { to: '/barcode/', label: '條碼' },
  { to: '/batch/', label: '批次' },
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

/** 語言切換：連到另一個語系，連結文字用那個語系寫（語名是 LANGUAGE_NAME，頁尾的語系列也用它） */
const otherLocale = computed<Locale>(() => (isEn.value ? 'zh-TW' : 'en'))
const lang = computed(() => ({ label: LANGUAGE_NAME[otherLocale.value], lang: LANG_TAG[otherLocale.value] }))

/**
 * 頁尾的語系列（共用頁尾的 languages）：照 LOCALES 的順序列中文、English，目前的語言畫成純文字。
 * 本站只有兩種語言，另一個語言的去處就是頁首語言切換用的 switchTo（App.vue 用 src/i18n/pairs.ts 的 switchTarget 算），
 * 兩邊是同一個值，不另外算。共用頁尾畫的是一般 <a>（整頁換頁，不經 vue-router），所以自己補上子路徑前綴。
 */
const footerLanguages = computed<PocketoolFooterLanguageInput[]>(() => LOCALES.map((l) => (l === locale.value
  ? { lang: LANG_TAG[l], label: LANGUAGE_NAME[l], current: true }
  : { lang: LANG_TAG[l], label: LANGUAGE_NAME[l], href: `${base}${props.switchTo.replace(/^\//, '')}` })))
const homeTo = computed(() => (isEn.value ? '/en/' : '/'))
const siteName = computed(() => (isEn.value ? site.nameEn : site.name))
const hub = computed(() => (isEn.value
  ? { url: publisher.urlEn, label: publisher.nameEn }
  : { url: publisher.url, label: '口袋工具' }))
const navLabel = computed(() => (isEn.value ? 'Main menu' : '主選單'))

// 頁尾本站專屬區的連結：字跟著共用頁尾是 16px；跟共用部分一樣，任何寬度每個連結都至少 44px 高（好點）
const footList = 'mt-2 font-600 text-muted list-none p-0'
const footLink = 'flex items-center min-h-11 hover:text-link transition'

/*
 * 頁尾本站專屬區的欄（FootFold.vue）在手機（768px 以下）收合成可展開的標題，桌機一律展開（2026-11 站長裁示：手機頁尾太長）。
 * 預渲染一律展開，爬蟲與還沒跑 JS 的人看得到全部連結；掛載後才依寬度收起（hydrate 規則：瀏覽器狀態只在 onMounted 之後讀），
 * 寬度變了跟著變。「回報問題」與隱私那一行放在收合區外面，一直看得到。
 */
const footWide = ref(true)
let stopFootQuery: (() => void) | undefined
onMounted(() => {
  if (typeof window.matchMedia !== 'function') return
  const mq = window.matchMedia('(min-width: 768px)')
  const sync = () => { footWide.value = mq.matches }
  sync()
  mq.addEventListener?.('change', sync)
  stopFootQuery = () => mq.removeEventListener?.('change', sync)
})
onBeforeUnmount(() => stopFootQuery?.())
</script>
<template>
  <div class="min-h-screen flex flex-col">
    <!--
      頁首（2026-11 改版，口袋工具家族的樣子）：站徽、站名，下面一行連回口袋工具；右邊是主選單與語言切換。
      1024px 以下主選單改到標題列下方另起一排（可橫向捲動），語言切換留在標題列右邊。
    -->
    <header class="bg-white border-b border-line">
      <div class="max-w-screen-lg mx-auto px-4 min-h-17 py-2 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- 站徽跟站名連到同一頁：站徽這個連結不進 Tab 順序、報讀器也略過，只留站名那一個 -->
          <RouterLink :to="homeTo" tabindex="-1" aria-hidden="true" class="shrink-0 flex">
            <img :src="`${base}logo-64.png`" :srcset="`${base}logo-64.png 2x, ${base}logo-96.png 3x`" width="38" height="38" alt="" class="w-9.5 h-9.5 max-[359px]:w-8 max-[359px]:h-8" data-test="site-logo">
          </RouterLink>
          <div class="flex flex-col leading-tight min-w-0">
            <RouterLink :to="homeTo" class="inline-flex items-center min-h-6 font-800 text-lg md:text-xl max-[359px]:text-base text-ink whitespace-nowrap" data-test="site-name">{{ siteName }}</RouterLink>
            <a :href="hub.url" class="inline-flex items-center min-h-6 self-start text-muted hover:text-link transition-colors whitespace-nowrap" data-test="hub-link">{{ hub.label }}</a>
          </div>
        </div>
        <nav :aria-label="navLabel" class="hidden lg:flex items-center gap-0.5 font-600">
          <RouterLink v-for="n in nav" :key="n.to" :to="n.to" exact-active-class="!bg-brand-50 !text-link-700"
            class="inline-flex items-center min-h-11 px-3 rounded-[10px] text-ink hover:bg-sunk transition-colors whitespace-nowrap">{{ n.label }}</RouterLink>
          <RouterLink :to="props.switchTo" :hreflang="lang.lang" :lang="lang.lang" data-test="lang-switch"
            class="ml-2 inline-flex items-center gap-1.5 min-h-11 px-3 rounded-[10px] border border-line bg-white text-ink hover:border-brand transition-colors whitespace-nowrap"><span class="i-lucide-globe" aria-hidden="true" />{{ lang.label }}</RouterLink>
        </nav>
        <RouterLink :to="props.switchTo" :hreflang="lang.lang" :lang="lang.lang" data-test="lang-switch-mobile"
          class="lg:hidden shrink-0 inline-flex items-center gap-1.5 min-h-11 px-3 rounded-[10px] border border-line bg-white text-ink font-600 hover:border-brand transition-colors whitespace-nowrap"><span class="i-lucide-globe" aria-hidden="true" />{{ lang.label }}</RouterLink>
      </div>
      <nav :aria-label="navLabel" class="lg:hidden border-t border-line">
        <div class="max-w-screen-lg mx-auto px-2 py-1 flex gap-0.5 overflow-x-auto font-600 whitespace-nowrap">
          <RouterLink v-for="n in nav" :key="n.to" :to="n.to" exact-active-class="!bg-brand-50 !text-link-700"
            class="inline-flex items-center min-h-11 px-3 rounded-[10px] text-ink hover:bg-sunk transition-colors">{{ n.label }}</RouterLink>
        </div>
      </nav>
    </header>
    <main class="flex-1"><slot /></main>
    <!--
      頁尾是口袋工具站群共用的元件（src/shared/pocketool-footer/，同步來的拷貝，不要在這裡改）：互連列、字標與網站資訊、版權句、
      最後一行的經營者署名都由它畫，字跟著頁面語系。網站資訊下面的語系列（中文、English）也由它畫，去處跟頁首的語言切換相同（footerLanguages）。
      本站自己的東西放在它的本站專屬區（預設 slot）：站內連結、英文頁的「In Chinese only」、回報問題、隱私那一行與
      DENSO WAVE 的商標聲明。連回口袋工具、版權句與署名只在共用的部分出現一次。
      顏色與字型的對應在 src/styles/pocketool-footer.css。
    -->
    <PocketoolFooter :site="FOOTER_SITE" :locale="FOOTER_LOCALE[locale]" :languages="footerLanguages" class="mt-16">
      <template v-if="isEn">
        <div class="grid gap-x-8 gap-y-6 grid-cols-2 md:grid-cols-3">
          <FootFold title="Free tools" list-id="foot-en-tools" :wide="footWide" :list-class="footList">
            <li><RouterLink to="/en/" :class="footLink">QR code generator</RouterLink></li>
            <li><RouterLink to="/en/batch/" :class="footLink">Bulk QR code generator</RouterLink></li>
            <li><RouterLink to="/en/barcode/" :class="footLink">Barcode generator</RouterLink></li>
            <li><a :href="publisher.toolsUrlEn" :class="footLink">More free tools</a></li>
          </FootFold>
          <FootFold title="In Chinese only" list-id="foot-en-zh-only" :wide="footWide" :list-class="footList">
            <li><RouterLink to="/scan/" hreflang="zh-Hant-TW" :class="footLink">QR code scanner<span class="sr-only"> (in Chinese)</span></RouterLink></li>
            <li><RouterLink to="/wifi/" hreflang="zh-Hant-TW" :class="footLink">WiFi QR code<span class="sr-only"> (in Chinese)</span></RouterLink></li>
            <li><RouterLink to="/vcard/" hreflang="zh-Hant-TW" :class="footLink">vCard QR code<span class="sr-only"> (in Chinese)</span></RouterLink></li>
            <li><RouterLink to="/guide/" hreflang="zh-Hant-TW" :class="footLink">QR code guides<span class="sr-only"> (in Chinese)</span></RouterLink></li>
          </FootFold>
          <!-- About 只有關於頁與回報問題兩個連結，收起來省不了多少，手機也照樣展開 -->
          <section>
            <h2 class="font-display font-700 text-ink text-base">About</h2>
            <ul :class="footList">
              <li><a :href="publisher.aboutToolUrlEn" :class="footLink">About {{ site.nameEn }}</a></li>
              <li>
                <a :href="publisher.reportUrlEn" target="_blank" rel="nofollow noopener" referrerpolicy="no-referrer" :class="footLink" data-test="report-link" @click="addReportPath"
                  >Report a problem<span class="sr-only"> (opens in a new tab)</span></a
                >
              </li>
            </ul>
          </section>
        </div>
        <p class="mt-6 font-600 text-muted"><span class="i-lucide-lock" aria-hidden="true" /> Made in your browser, nothing is uploaded</p>
        <p class="mt-1 text-muted" data-test="trademark">{{ site.trademarkEn }}</p>
      </template>
      <template v-else>
        <div class="grid gap-x-8 gap-y-6 grid-cols-2 md:grid-cols-4">
          <FootFold title="QR Code 類型" list-id="foot-types" :wide="footWide" :list-class="footList">
            <li v-for="t in qrTypes" :key="t.type">
              <RouterLink :to="`${t.path}/`" :class="footLink">{{ t.label }} QR Code</RouterLink>
            </li>
          </FootFold>
          <FootFold title="其他工具" list-id="foot-tools" :wide="footWide" :list-class="footList">
            <li><RouterLink to="/" :class="footLink">免費 QR Code 產生器</RouterLink></li>
            <li><RouterLink to="/scan/" :class="footLink">QR Code 掃描器</RouterLink></li>
            <li><RouterLink to="/barcode/" :class="footLink">條碼產生器</RouterLink></li>
            <li><RouterLink to="/batch/" :class="footLink">批次產生 QR Code 與條碼</RouterLink></li>
            <li><a :href="publisher.toolsUrl" :class="footLink">更多免費工具</a></li>
          </FootFold>
          <FootFold title="教學" list-id="foot-guides" :wide="footWide" :list-class="footList">
            <li v-for="g in guides" :key="g.slug">
              <RouterLink :to="`/guide/${g.slug}/`" :class="footLink">{{ g.shortTitle }}</RouterLink>
            </li>
            <li><RouterLink to="/guide/" :class="[footLink, 'gap-1']">所有教學<span class="i-lucide-arrow-right" aria-hidden="true" /></RouterLink></li>
          </FootFold>
          <FootFold title="關於" list-id="foot-about" :wide="footWide" :list-class="footList">
            <li><RouterLink to="/about/" :class="footLink">關於 {{ site.name }}</RouterLink></li>
            <li><RouterLink to="/faq/" :class="footLink">常見問題</RouterLink></li>
            <li><RouterLink to="/privacy/" :class="footLink">本工具隱私權政策</RouterLink></li>
            <!-- 回報問題在收合區外面，手機收起來也看得到；桌機接在上面那串下面，不多空一段 -->
            <template #after>
              <ul :class="[footList, 'md:mt-0']">
                <li>
                  <a :href="publisher.reportUrl" target="_blank" rel="nofollow noopener" referrerpolicy="no-referrer" :class="footLink" data-test="report-link" @click="addReportPath"
                    >回報問題<span class="sr-only">（另開分頁）</span></a
                  >
                </li>
              </ul>
            </template>
          </FootFold>
        </div>
        <p class="mt-6 font-600 text-muted"><span class="i-lucide-lock" aria-hidden="true" /> 瀏覽器內生成，內容不傳雲端</p>
        <p class="mt-1 text-muted" data-test="trademark">{{ site.trademark }}</p>
      </template>
    </PocketoolFooter>
  </div>
</template>
