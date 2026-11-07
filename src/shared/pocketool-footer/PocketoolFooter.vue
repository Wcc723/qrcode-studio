<!-- 此檔由共用頁尾正本同步（版本 1.3.0），不要在這裡改。 -->
<!--
  口袋工具共用頁尾（契約見共用頁尾文件；資料：pocketool-footer-data.mjs）。
  只用 Vue 本身，不 import vue-router、vitepress、UnoCSS 或任何站的元件，丟進哪一站都能編譯、能預渲染。
  script 是 lang="ts"（各站的 vue-tsc 才看得到 props 的型別；Vite 與 VitePress 都直接編得動），型別來自資料檔旁邊的 .d.mts。

  由上而下：本站專屬區（預設 slot，有內容才傳，沒傳就不出現）→「口袋工具的站」互連列 → 字標與「網站資訊」連結列 →
  語系列（languages 有傳才出現）→ 版權句 → 經營者署名（永遠是整頁最後一行，後面不能再放任何字）。

  props：site 是目前這站的代號（hub 是 pocket-tool-blog），locale 是 zh-Hant、zh-Hans、en、ja、ko，
  languages 是這一頁在各語言的去處（選用，格式見資料檔的 pocketoolFooterLanguages）。
  語系列每一筆標那個語言的 lang 與 data-ptf-lang（各站「外語頁不能有中文」這類檢查靠它認出語名）；
  目前的語言是純文字加 aria-current，其他是一般 <a>（整頁換頁、同分頁開、標 hreflang）。
  簡中頁的 lang="zh-Hant" 標在共用的區塊（.ptf__sites、.ptf__row、.ptf__copy），<footer> 與本站專屬區不標。
  樣式只管版面；顏色與字型全部走 --ptf-* 變數，各站另寫一小段 CSS 對應到自己的色票（變數表在契約文件）。
  模板裡的字緊貼標籤、同一個元素的內容寫在同一行：預渲染後再壓縮 HTML 的站才不會跟瀏覽器端 render 對不上。
  唯一刻意留的空白是站名與短說明之間的一個半形空格（兩個 span 之間單獨一個文字節點，壓縮會保留），
  純文字抽取時兩段才不會黏在一起。
-->
<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { pocketoolFooterModel, type PocketoolFooterLanguageInput, type PocketoolFooterLocale, type PocketoolSiteKey } from './pocketool-footer-data.mjs'

const props = defineProps({
  /** 目前這站的代號 */
  site: { type: String as PropType<PocketoolSiteKey>, required: true },
  /** 頁面語系 */
  locale: { type: String as PropType<PocketoolFooterLocale>, default: 'zh-Hant' },
  /** 這一頁在各語言的去處（選用；只有一種語言的站不傳） */
  languages: { type: Array as PropType<readonly PocketoolFooterLanguageInput[]>, default: () => [] },
})

const m = computed(() => pocketoolFooterModel(props.site, props.locale, props.languages))
</script>

<template>
  <footer class="ptf" :data-pocketool-footer="m.version">
    <div class="ptf__inner">
      <div v-if="$slots.default" class="ptf__local"><slot /></div>
      <nav class="ptf__sites" :aria-label="m.sitesLabel" :lang="m.lang">
        <p class="ptf__title" aria-hidden="true">{{ m.sitesLabel }}</p>
        <ul class="ptf__site-list">
          <li v-for="s in m.sites" :key="s.key" class="ptf__site-item"><a class="ptf-site" :href="s.href" :hreflang="s.hreflang" :target="s.target" :aria-current="s.current ? 'true' : undefined"><span class="ptf-site__name" :lang="s.nameLang">{{ s.name }}</span> <span class="ptf-site__desc">{{ s.desc }}</span></a></li>
        </ul>
      </nav>
      <div class="ptf__row" :lang="m.lang">
        <a class="ptf__brand" :class="{ 'ptf__brand--latin': !m.brand.zh }" :href="m.brand.href" :hreflang="m.brand.hreflang" :target="m.brand.target" :aria-label="m.brand.label"><img class="ptf__mark" :src="m.brand.mark" :srcset="m.brand.srcset" sizes="28px" width="28" height="28" alt="" loading="lazy" decoding="async" /><span v-if="m.brand.zh" class="ptf__brand-zh">口袋工具</span><span class="ptf__brand-latin">Pocketool</span></a>
        <nav class="ptf__info" :aria-label="m.infoLabel">
          <a v-for="l in m.info" :key="l.key" class="ptf__info-link" :class="{ ptf__ext: l.external }" :href="l.href" :hreflang="l.hreflang" :target="l.target">{{ l.label }}<svg v-if="l.external" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg></a>
        </nav>
      </div>
      <nav v-if="m.languages.length" class="ptf__langs" :aria-label="m.languagesLabel" :lang="m.lang">
        <svg class="ptf__globe" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" /></svg>
        <ul class="ptf__lang-list">
          <li v-for="l in m.languages" :key="l.lang" class="ptf__lang-item"><span v-if="l.current" class="ptf__lang ptf__lang--current" :lang="l.lang" data-ptf-lang aria-current="true">{{ l.label }}</span><a v-else class="ptf__lang" :href="l.href" :lang="l.lang" :hreflang="l.hreflang" data-ptf-lang>{{ l.label }}</a></li>
        </ul>
      </nav>
      <p class="ptf__copy" :lang="m.lang"><span class="ptf__note">{{ m.note }}</span>{{ m.copyright }}</p>
      <p class="ptf__owner"><a data-owner-line :href="m.owner.href" lang="zh-Hant" hreflang="zh-Hant">{{ m.owner.text }}</a></p>
    </div>
  </footer>
</template>

<style scoped>
/*
 * 變數（預設值寫在 var() 的第二個參數）：底 --ptf-bg、正文 --ptf-ink、次要字 --ptf-ink-2、分隔線 --ptf-line、
 * 頁尾頂線 --ptf-border-top（預設 1px 的 --ptf-line）、底線與目前這站的記號 --ptf-line-strong、滑過 --ptf-link-hover、
 * 字型 --ptf-font（預設跟著頁面）、字標英文字型 --ptf-font-brand、
 * 內容寬 --ptf-max-width、左右留白 --ptf-gutter（手機）與 --ptf-gutter-wide（720px 以上）。
 * 字一律 16px 以上（字標中文 18px）；手機上每個連結的點擊高度至少 44px。深色模式由各站在自己的深色選擇器改變數，這裡不寫。
 */
.ptf {
  background: var(--ptf-bg, #f8f3ed);
  border-top: var(--ptf-border-top, 1px solid var(--ptf-line, #e8ddd3));
  color: var(--ptf-ink-2, #6f6056);
  font-family: var(--ptf-font, inherit);
  font-size: 16px;
  line-height: 1.75;
}

.ptf__inner {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: var(--ptf-max-width, 1200px);
  margin: 0 auto;
  padding: 32px var(--ptf-gutter, 16px) 28px;
}

/* 本站專屬區：內容與樣式是各站自己的，這裡只在它跟互連列之間畫一條線（所以沒有內容就不要傳 slot） */
.ptf__local {
  min-width: 0;
}

.ptf__local + .ptf__sites {
  padding-top: 24px;
  border-top: 1px solid var(--ptf-line, #e8ddd3);
}

.ptf__title {
  margin: 0 0 8px;
  color: var(--ptf-ink, #352b26);
  font-size: 16px;
  font-weight: 700;
}

.ptf__site-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ptf__site-item {
  min-width: 0;
  margin: 0;
  padding: 0;
}

.ptf-site {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 44px;
  padding: 6px 0;
  color: var(--ptf-ink-2, #6f6056);
  text-decoration: none;
}

.ptf-site__name {
  color: var(--ptf-ink, #352b26);
  font-weight: 700;
  overflow-wrap: anywhere;
}

.ptf-site__desc {
  color: var(--ptf-ink-2, #6f6056);
  overflow-wrap: anywhere;
}

.ptf-site:hover .ptf-site__name {
  color: var(--ptf-link-hover, #b94320);
}

/* 目前這站：站名加底線（不靠顏色分辨），螢幕閱讀器念 aria-current */
.ptf-site[aria-current='true'] .ptf-site__name {
  text-decoration: underline;
  text-decoration-color: var(--ptf-line-strong, #9c8874);
  text-decoration-thickness: 2px;
  text-underline-offset: 5px;
}

.ptf__row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;
  padding-top: 24px;
  border-top: 1px solid var(--ptf-line, #e8ddd3);
}

.ptf__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  color: var(--ptf-ink, #352b26);
  text-decoration: none;
}

.ptf__mark {
  display: block;
  width: 28px;
  height: 28px;
}

.ptf__brand-zh {
  color: var(--ptf-ink, #352b26);
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1;
}

.ptf__brand-latin {
  color: var(--ptf-ink-2, #6f6056);
  font-family: var(--ptf-font-brand, inherit);
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}

.ptf__brand--latin .ptf__brand-latin {
  color: var(--ptf-ink, #352b26);
  font-size: 18px;
}

/* 手機：網站資訊兩欄、每格 44px */
.ptf__info {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
  width: 100%;
}

.ptf__info a {
  color: var(--ptf-ink, #352b26);
  font-size: 16px;
  font-weight: 500;
  line-height: 44px;
  text-decoration: none;
}

.ptf__info a:hover {
  color: var(--ptf-link-hover, #b94320);
}

.ptf__info .ptf__ext {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 語系列：地球圖示加各語言的名稱，手機上自動換行；每一筆至少 44×44 */
.ptf__langs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ptf__globe {
  flex: none;
  display: block;
  color: var(--ptf-ink-2, #6f6056);
}

.ptf__lang-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 20px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ptf__lang-item {
  margin: 0;
  padding: 0;
}

.ptf__lang {
  display: inline-flex;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
  color: var(--ptf-ink, #352b26);
  font-size: 16px;
  font-weight: 500;
}

a.ptf__lang {
  text-decoration: underline;
  text-decoration-color: var(--ptf-line-strong, #9c8874);
  text-underline-offset: 5px;
}

a.ptf__lang:hover {
  color: var(--ptf-link-hover, #b94320);
}

/* 目前的語言：粗體、不是連結、沒有底線（不靠顏色分辨），螢幕閱讀器念 aria-current */
.ptf__lang--current {
  font-weight: 700;
}

.ptf__copy {
  margin: 0;
  color: var(--ptf-ink-2, #6f6056);
  font-size: 16px;
}

.ptf__note {
  display: block;
}

.ptf__owner {
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid var(--ptf-line, #e8ddd3);
  font-size: 16px;
}

.ptf__owner a {
  display: inline-block;
  color: var(--ptf-ink, #352b26);
  font-weight: 700;
  line-height: 44px;
  text-decoration: underline;
  text-decoration-color: var(--ptf-line-strong, #9c8874);
  text-underline-offset: 5px;
}

.ptf__owner a:hover {
  color: var(--ptf-link-hover, #b94320);
}

@media (min-width: 720px) {
  .ptf__inner {
    padding: 40px var(--ptf-gutter-wide, 32px) 32px;
  }

  .ptf__site-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 32px;
  }

  .ptf__row {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px 32px;
  }

  .ptf__info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 24px;
    width: auto;
  }

  /* 點擊高度維持 44px（行政小幫手、Pixel Smith 規定所有寬度都 44px），兩個字的連結補到 44px 寬 */
  .ptf__info a {
    min-width: 44px;
  }

  /* 版權句的兩句排成一行，句間留白（字串尾端不放空格） */
  .ptf__note {
    display: inline;
    margin-inline-end: 0.5em;
  }
}
</style>
