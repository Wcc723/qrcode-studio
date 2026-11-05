<script setup lang="ts">
/**
 * 工具區（應用程式）：標題區、一行副標與工具卡，整條鋪暖杏色底，下緣一條細線，
 * 跟下面的說明文章（紙白、文件樣式）明確分開。
 *
 * 標題區有兩種（2026-11 改版）：
 * - hero（首頁）：右邊一張水彩橫幅，左邊是小標籤、h1、副標與三個打勾，工具卡往上疊進橫幅一點
 * - 其他工具頁：看得到的導覽路徑，下面是圓底插圖、h1、副標，右邊一張裝飾插圖
 * 插圖都是 alt="" 的裝飾圖（public/img/），不取代介面圖示；首屏的橫幅不延遲載入，其他首屏插圖很小也不延遲。
 *
 * 這一塊直接放在 <main> 底下，本來就是整個視窗寬，裡面再用 max-w-screen-lg 收內容；
 * 所以鋪底不需要 100vw（那會把捲軸寬度算進去，造成水平溢出），也不需要 box-shadow 的變通。
 * 頁面不要再把它包進有寬度上限的容器裡。
 *
 * 副標只留一行（30 字以內）；原本標題下那段完整說明移到說明文章的第一段。說明文章的大綱與每頁獨有的資訊不刪，
 * 跨段重複的套話可以刪（2026-11 起，規則見 docs/ui.md「說明文章的字」）。
 * 隱私只說一次（工具卡頂部那一行），標題區的打勾不提隱私。
 */
export interface ZoneCrumb { label: string, to?: string, href?: string }

const props = defineProps<{
  lead: string
  /** 首頁的水彩橫幅：小標籤與三個打勾（字由頁面給，英文頁給英文） */
  hero?: { pill: string, trust: string[] }
  /** 標題左邊的圓底插圖（public/img/ 的檔名，例如 type-wifi-160.webp） */
  art?: string
  /** 標題列右邊的裝飾插圖（640px 以下不顯示） */
  deco?: string
  /** 看得到的導覽路徑：最後一項是這一頁（不連結） */
  crumbs?: ZoneCrumb[]
  crumbsLabel?: string
}>()
const base = import.meta.env.BASE_URL
const img = (name: string) => `${base}img/${name}`
</script>

<template>
  <section class="tool-zone" data-test="tool-zone">
    <div v-if="props.hero" class="zone-hero" data-test="zone-hero">
      <img class="zone-hero-img" :src="img('hero-home-1600.webp')"
        :srcset="`${img('hero-home-1600.webp')} 1600w, ${img('hero-home-2400.webp')} 2400w`"
        sizes="(min-width: 768px) 66vw, 100vw" width="2400" height="900" alt="" fetchpriority="high" decoding="async">
      <div class="relative max-w-screen-lg mx-auto px-4 pt-2 pb-8 md:pt-13 md:pb-19">
        <div class="max-w-[520px] flex flex-col gap-3 md:gap-4">
          <p class="hidden md:inline-flex self-start px-3.5 py-1 bg-white border border-[#f1cf9f] rounded-full text-ink reveal reveal-1">{{ props.hero.pill }}</p>
          <h1 class="text-[32px] md:text-[46px] leading-tight font-900 text-ink reveal reveal-1"><slot name="title" /></h1>
          <p class="text-[17px] md:text-[19px] leading-relaxed font-600 text-[#4a3d30] reveal reveal-2" data-test="tool-lead">{{ lead }}</p>
          <ul class="list-none m-0 p-0 flex flex-col md:flex-row md:flex-wrap gap-x-5.5 gap-y-1.5 reveal reveal-2" data-test="zone-trust">
            <li v-for="t in props.hero.trust" :key="t" class="flex items-center gap-2 font-600 text-ink"><span class="i-lucide-check text-mintd text-xl" aria-hidden="true" />{{ t }}</li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else class="zone-head">
      <div class="max-w-screen-lg mx-auto px-4 pt-5 pb-7 flex flex-col gap-3.5">
        <nav v-if="props.crumbs?.length" :aria-label="props.crumbsLabel" data-test="breadcrumb">
          <ol class="list-none m-0 p-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-600">
            <li v-for="(c, i) in props.crumbs" :key="c.label" class="inline-flex items-center gap-1.5">
              <span v-if="i > 0" class="i-lucide-chevron-right text-muted" aria-hidden="true" />
              <RouterLink v-if="c.to" :to="c.to" class="inline-flex items-center min-h-6 text-ink underline underline-offset-3 hover:text-link">{{ c.label }}</RouterLink>
              <a v-else-if="c.href" :href="c.href" class="inline-flex items-center min-h-6 text-ink underline underline-offset-3 hover:text-link">{{ c.label }}</a>
              <span v-else aria-current="page" class="text-muted">{{ c.label }}</span>
            </li>
          </ol>
        </nav>
        <div class="flex items-center gap-4 md:gap-4.5">
          <span v-if="props.art" class="art-bubble !bg-white w-16 h-16 md:w-22 md:h-22">
            <img :src="img(props.art)" alt="" width="160" height="160" class="w-14 h-14 md:w-19.5 md:h-19.5">
          </span>
          <div class="flex flex-col gap-1 min-w-0">
            <h1 class="text-[28px] md:text-[38px] leading-tight font-900 text-ink reveal reveal-1"><slot name="title" /></h1>
            <p class="md:text-lg font-600 text-[#4a3d30] reveal reveal-2" data-test="tool-lead">{{ lead }}</p>
          </div>
          <img v-if="props.deco" :src="img(props.deco)" alt="" width="240" height="240" class="hidden sm:block ml-auto h-24 w-auto shrink-0">
        </div>
      </div>
    </div>
    <div class="max-w-screen-lg mx-auto px-4">
      <div class="relative reveal reveal-3" :class="{ 'zone-overlap': props.hero }"><slot /></div>
    </div>
  </section>
</template>
