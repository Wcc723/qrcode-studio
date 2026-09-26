<script setup lang="ts">
import { qrTypes } from '@/config/qr-types'
import { guides } from '@/content/guides'
import { site, publisher } from '@/config/site'

// 站徽是 public/ 底下的點陣圖（scripts/brand/render.mjs 產生）。模板裡寫死 /logo-64.png 不會經過 Vite base，
// 在子路徑下會連到 hub 的 404，所以從 BASE_URL 組出網址。
const base = import.meta.env.BASE_URL

// 頁首導覽：桌機是一排膠囊，手機在標題列下方另起一排（可橫向捲動）。
const nav = [
  { to: '/', label: '產生器' },
  { to: '/scan/', label: '掃描器' },
  { to: '/barcode/', label: '一維條碼' },
  { to: '/guide/', label: '教學' },
  { to: '/faq/', label: 'FAQ' },
]
</script>
<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b-3 border-ink bg-pop-sun/90">
      <div class="max-w-screen-lg mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <!-- 320 到 359px：站名縮一級，右邊「口袋工具」才不會壓到頁面邊距 -->
        <RouterLink to="/" class="flex items-center gap-2.5 max-[359px]:gap-2 font-display font-700 text-xl max-[359px]:text-lg text-ink whitespace-nowrap shrink-0">
          <img :src="`${base}logo-64.png`" :srcset="`${base}logo-64.png 2x, ${base}logo-96.png 3x`" width="32" height="32" alt="" class="w-8 h-8 shrink-0" data-test="site-logo">
          <span data-test="site-name">{{ site.name }}</span>
        </RouterLink>
        <nav aria-label="主選單" class="hidden md:flex items-center gap-1.5 text-sm font-700">
          <RouterLink v-for="n in nav" :key="n.to" :to="n.to" exact-active-class="!border-ink bg-white"
            class="px-3 py-1 rounded-full border-2 border-transparent hover:border-ink hover:bg-white transition">{{ n.label }}</RouterLink>
          <a :href="publisher.url" class="ml-1 inline-flex items-center gap-1 px-3 py-1 rounded-full border-2 border-ink bg-white hover:bg-pop-mint transition"><span class="i-lucide-toolbox" aria-hidden="true" />口袋工具</a>
        </nav>
        <a :href="publisher.url" class="md:hidden chip !text-sm !px-2.5 !py-1 bg-white shrink-0"><span class="i-lucide-toolbox" aria-hidden="true" />口袋工具</a>
      </div>
      <nav aria-label="主選單" class="md:hidden border-t-2 border-ink/15">
        <div class="max-w-screen-lg mx-auto px-4 py-2 flex gap-1.5 overflow-x-auto text-sm font-700 whitespace-nowrap">
          <RouterLink v-for="n in nav" :key="n.to" :to="n.to" exact-active-class="!bg-white"
            class="chip !text-sm !px-2.5 !py-1 bg-white/60">{{ n.label }}</RouterLink>
        </div>
      </nav>
    </header>
    <main class="flex-1"><slot /></main>
    <footer class="border-t-3 border-ink mt-16 bg-white">
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
            <li><RouterLink to="/barcode/" class="hover:text-link transition">一維條碼產生器</RouterLink></li>
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
