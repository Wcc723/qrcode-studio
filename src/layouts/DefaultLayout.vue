<script setup lang="ts">
import { qrTypes } from '@/config/qr-types'
import { guides } from '@/content/guides'
import { site, publisher } from '@/config/site'

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
        <RouterLink to="/" class="flex items-center gap-2.5 font-display font-700 text-xl text-ink shrink-0">
          <span class="w-8 h-8 rounded-lg bg-brand border-2 border-ink shadow-[2px_2px_0_#16130f] inline-flex items-center justify-center text-white text-sm">▦</span>
          {{ site.name }}
        </RouterLink>
        <nav aria-label="主選單" class="hidden md:flex items-center gap-1.5 text-sm font-700">
          <RouterLink v-for="n in nav" :key="n.to" :to="n.to" exact-active-class="!border-ink bg-white"
            class="px-3 py-1 rounded-full border-2 border-transparent hover:border-ink hover:bg-white transition">{{ n.label }}</RouterLink>
          <a :href="publisher.url" class="ml-1 px-3 py-1 rounded-full border-2 border-ink bg-white hover:bg-pop-mint transition">🧰 口袋工具</a>
        </nav>
        <a :href="publisher.url" class="md:hidden chip !text-sm !px-2.5 !py-1 bg-white shrink-0">🧰 口袋工具</a>
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
              <RouterLink :to="`${t.path}/`" class="hover:text-brand transition">{{ t.label }} QR Code</RouterLink>
            </li>
          </ul>
        </section>
        <section>
          <h2 class="font-display font-700 text-ink text-base">其他工具</h2>
          <ul class="mt-3 space-y-1.5 font-600 text-muted list-none p-0">
            <li><RouterLink to="/" class="hover:text-brand transition">免費 QR Code 產生器</RouterLink></li>
            <li><RouterLink to="/scan/" class="hover:text-brand transition">QR Code 掃描器</RouterLink></li>
            <li><RouterLink to="/barcode/" class="hover:text-brand transition">一維條碼產生器</RouterLink></li>
            <li><a :href="publisher.toolsUrl" class="hover:text-brand transition">更多免費工具</a></li>
          </ul>
        </section>
        <section>
          <h2 class="font-display font-700 text-ink text-base">教學</h2>
          <ul class="mt-3 space-y-1.5 font-600 text-muted list-none p-0">
            <li v-for="g in guides" :key="g.slug">
              <RouterLink :to="`/guide/${g.slug}/`" class="hover:text-brand transition">{{ g.shortTitle }}</RouterLink>
            </li>
            <li><RouterLink to="/guide/" class="hover:text-brand transition">所有教學 →</RouterLink></li>
          </ul>
        </section>
        <section>
          <h2 class="font-display font-700 text-ink text-base">關於</h2>
          <ul class="mt-3 space-y-1.5 font-600 text-muted list-none p-0">
            <li><RouterLink to="/about/" class="hover:text-brand transition">關於 {{ site.name }}</RouterLink></li>
            <li><RouterLink to="/faq/" class="hover:text-brand transition">常見問題</RouterLink></li>
            <li><RouterLink to="/privacy/" class="hover:text-brand transition">隱私權政策</RouterLink></li>
            <li><a :href="publisher.contactUrl" class="hover:text-brand transition">聯絡我們</a></li>
            <li><a :href="publisher.url" class="hover:text-brand transition">口袋工具 Pocketool</a></li>
          </ul>
        </section>
      </div>
      <div class="border-t-2 border-ink/10">
        <p class="max-w-screen-lg mx-auto px-4 py-4 text-xs text-muted font-600">
          © {{ site.name }} · <a :href="publisher.url" class="hover:text-brand underline underline-offset-2">口袋工具 Pocketool</a> 出品 · 🔒 瀏覽器內生成，內容不傳雲端
        </p>
      </div>
    </footer>
  </div>
</template>
