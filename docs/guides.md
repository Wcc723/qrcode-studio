# 教學文章與 v-html 富文字

`AGENTS.md` 的「v-html 的富文字連結要自己補前綴」留規則的重點，這份放全文：哪些 sink 要補前綴、教學的中繼資料與本文怎麼分、示意圖與日期、`seo:audit` 怎麼擋。
〈Excel 怎麼做 QR Code 與條碼〉的批次頁截圖怎麼重產見 `docs/batch.md`「教學裡的範例圖（重產方式）」，教學的分享圖見 `docs/brand/README.md`「教學的分享圖」。

2026-10-15 從 `AGENTS.md` 逐字搬來（#24：`AGENTS.md` 精簡到 20 KB 以下，免得超過 Codex 串接指令的上限）。
`AGENTS.md` 只留摘要與指路，這裡的每一條和它一樣不可違反。

## v-html 的富文字連結要自己補前綴

`src/content/guide-bodies.ts` 的教學本文與 `src/config/qr-types.ts` 的 `body` 是原生
`<a href="/...">`、`<img src="/...">`，用 `v-html` 塞進 DOM，**既不經 Vite base 也不經 vue-router**，
在子路徑下會連到 hub 的 404。這類 sink（`GuidePage.vue`、`SeoContent.vue`、`FaqPage.vue`）都套用
`src/utils/with-base.ts` 的 `withBase()`，它同時補 `href` 與 `src`。新增同型的 `v-html` 出口時記得一起套。

教學的中繼資料（標題、日期、分組）在 `src/content/guides.ts`，會進 entry chunk；本文在
`guide-bodies.ts`，只有動態載入的文章頁會用到，不要把本文搬回 `guides.ts`。文章裡的示意圖
由 `scripts/figures/gen-guide-figures.mjs` 產生到 `public/guides/`（產物進版控），圖裡的版本與
模組數要和文章寫的一致。〈Excel 怎麼做 QR Code 與條碼〉的兩張批次頁截圖由 `scripts/figures/batch-screenshots.mjs` 產生
（合成清冊、視窗與裁切見 `docs/batch.md`，本 repo 不裝 Playwright，不進 build）。
`published` 是 git 歷史上的首次上線日，不要改；`updated` 只在實質改寫時更新，
sitemap 的 `<lastmod>` 與 `article:modified_time` 都從它來。

模板內的站內連結一律用 `RouterLink`，不要用原生 `<a href="/...">`。

`npm run seo:audit` 有一條逐頁斷言會擋下漏補的情況：dist 內所有 `href="/..."` 與 `src="/..."`
必須以 `/qrcode-studio/` 開頭。期望前綴由 sitemap 的第一條 `<loc>` 推導，
讓 `gen-sitemap.mjs` 與 `site.ts` 兩個獨立來源互相對帳。
