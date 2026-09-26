<script setup lang="ts">
import { guides, guideCategories } from '@/content/guides'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'

const groups = guideCategories.map(c => ({ ...c, items: guides.filter(g => g.category === c.id) }))

function zhDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y} 年 ${m} 月 ${d} 日`
}

useSeoHead({
  title: 'QR Code 教學總覽｜QR Code Studio',
  description: `${guides.length} 篇 QR Code 教學一次看：QR Code 原理與容量、手機與電腦怎麼掃、容錯等級怎麼選、加 LOGO 不影響掃描、印刷用 SVG 與尺寸，以及 LINE QR Code 的做法。`,
  path: '/guide',
  kind: 'page',
  pageType: 'CollectionPage',
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: '教學', url: `${site.url}/guide/` },
  ],
})
</script>
<template>
  <div class="max-w-screen-md mx-auto px-4 py-10">
    <nav aria-label="麵包屑" class="text-sm text-muted font-600">
      <RouterLink to="/" class="hover:text-brand underline underline-offset-2">首頁</RouterLink><span class="mx-1.5">›</span>
      <span aria-current="page">教學</span>
    </nav>
    <h1 class="text-3xl md:text-4xl font-800 text-ink mt-3">QR Code 教學總覽</h1>
    <p class="text-ink/80 font-600 mt-4 leading-7">
      這裡整理了製作與使用 QR Code 時最常卡關的問題：它到底怎麼運作、能裝多少資料、手機和電腦各要怎麼掃、容錯等級該選哪一級、加了 LOGO 為什麼還掃得到，以及要印在名片或海報上時，檔案格式與尺寸怎麼決定。每一篇都對照本站工具的實際行為來寫，讀完可以直接回到<RouterLink to="/" class="text-brand underline underline-offset-2 font-700">QR Code 產生器</RouterLink>動手做。
    </p>

    <section v-for="grp in groups" :key="grp.id" class="mt-9">
      <h2 class="text-xl font-800 text-ink">{{ grp.label }}</h2>
      <ul class="mt-4 grid gap-4 list-none p-0">
        <li v-for="g in grp.items" :key="g.slug">
          <RouterLink :to="`/guide/${g.slug}/`" class="sticker p-4 block">
            <div class="font-display font-700 text-ink text-lg">{{ g.title }}</div>
            <p class="text-sm text-ink/75 font-600 mt-1.5 leading-relaxed">{{ g.description }}</p>
            <div class="text-xs text-muted font-600 mt-2">最後更新：<time :datetime="g.updated">{{ zhDate(g.updated) }}</time></div>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section class="mt-10 card p-5">
      <h2 class="text-lg font-800 text-ink">用得到的工具</h2>
      <ul class="mt-3 list-disc pl-5 space-y-1.5 text-ink/80 font-600 leading-relaxed">
        <li><RouterLink to="/" class="text-brand underline underline-offset-2 font-700">免費 QR Code 產生器</RouterLink>：網址、WiFi、電子名片等 7 種類型，可加 LOGO、下載 PNG 與 SVG。</li>
        <li><RouterLink to="/scan/" class="text-brand underline underline-offset-2 font-700">QR Code 掃描器</RouterLink>：截圖或圖檔裡的 QR Code 與條碼，在瀏覽器內解碼。</li>
        <li><RouterLink to="/barcode/" class="text-brand underline underline-offset-2 font-700">一維條碼產生器</RouterLink>：EAN-13、Code 128 等商品與物流條碼。</li>
        <li><RouterLink to="/faq/" class="text-brand underline underline-offset-2 font-700">常見問題</RouterLink>：費用、隱私、下載格式等快速解答。</li>
      </ul>
    </section>
  </div>
</template>
