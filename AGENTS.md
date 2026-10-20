# AGENTS.md

這份是 `qrcode-studio` 的開發指引，Claude Code 與 Codex 共用（`CLAUDE.md` 只引用這份）。

> **本專案屬於口袋工具 workspace**（本機在 `../../`）。在 workspace 裡工作時，開工前先讀根目錄的 `AGENTS.md`：跨專案規則、網域與轉址、搬站流程、專案清單都在那裡。Claude Code 會自動載入它；Codex 請自己讀。

**不可違反**

- push `main` 即觸發 Cloudflare Workers Builds 部署，不要手動 `wrangler deploy`
- `wrangler.jsonc` 的 `name` 必須是 `qrcode-studio`（線上 Worker 名）
- 子路徑相關設定（base、routes、assets 目錄、`_headers`、`404.html`）改動前，先讀本檔的子路徑章節與 workspace 的 `docs/runbooks/subpath-migration.md`
- `/scan/` 的解碼器 WASM 一律自架，不得改回第三方 CDN；`zxing-wasm` 必須精確鎖版（見「圖片解碼」章節）
- 新增或移除路由時，要同步更新 `scripts/seo/audit.mjs` 的 `EXPECTED_PATHS`，否則 build 會擋下來
- 新增或移除中英成對的頁面時，`src/i18n/pairs.ts`、`src/router.ts` 的英文路由與 `scripts/seo/audit.mjs` 的 `EXPECTED_PAIRS` 一起改（見「中英文版」）

**細節在本 repo 的 `docs/`**，這份只留規則與指路：部署沿革、子路徑規則的原因與本機驗證 `deploy.md`、圖片解碼 `scan.md`、
靜區 `quiet-zone.md`、批次產生與標籤紙 `batch.md`、中英文版 `i18n.md`、工具區、說明與用字 `ui.md`、教學文章與 v-html `guides.md`、
產品名、站徽與分享圖 `brand/README.md`、SEO 檢核與標題改動紀錄 `seo-checklist.md`。從這份搬過去的規則全文放在各檔的
「AGENTS.md 的硬規則」（`ui.md`、`guides.md` 整份都是），和這份一樣不可違反，改到相關的東西前先讀。

## 這個 repo 是什麼

**QR Code 製造機**（英文 QR Code Maker，2026-09-26 前叫 QR Code Studio），正式網址 `https://www.pocketool.app/qrcode-studio/`。在瀏覽器內產生
網址 / WiFi / 電子名片 / Email 等類型的 QR Code，可自訂顏色、漸層、LOGO 與容錯等級，
下載 PNG / SVG / JPG。Vue 3 + Vite + vite-ssg + UnoCSS（圖示用建置時打包的 Lucide），
每條路由都預渲染成靜態 HTML。英文版（QR Code Maker）在 `/qrcode-studio/en/`，目前有首頁、批次與條碼三頁（見「中英文版」）。

它屬於 `pocketool.app` 站群，hub 是
`https://www.pocketool.app`（repo `pocket-tool-blog`，workspace 內在 `../pocket-tool-blog`），
本站已從子網域搬到 hub 的子路徑（搬站背景見 `docs/deploy.md`）。

套件管理用 **npm**。

## 常用指令

```bash
npm run dev         # 本機開發，網址會帶 /qrcode-studio/ 前綴
npm run build       # 測試 → vite-ssg build → SEO 稽核（見下方「把關」）
npm run preview     # 預覽 build 結果
npm run test        # vitest
npm run seo:audit   # 稽核 dist/qrcode-studio
npm run deploy      # 緊急備用：rm -rf dist && build && wrangler deploy

# 只有要重新產生 /scan/ 的黃金測試圖時才跑（產物已進版控）
node scripts/fixtures/gen-scan-fixtures.mjs
```

Node 版本照 `.nvmrc`（22），但測試在 Node 25 也要過：`test/setup/web-storage.ts` 換上 happy-dom 的 Web Storage，
「內容不寫進儲存空間」的測試靠它才驗得到東西（原因見檔頭），不要拿掉。

## 部署

**Cloudflare Workers Static Assets**（設定見 `wrangler.jsonc`，Worker 名 `qrcode-studio`），
走 **Cloudflare Workers Builds**：後台接 Git，push 到 `main` 就自動建置並部署。
這個 Cloudflare 帳號底下**沒有任何 Pages 專案**，站群全部是 Worker。

repo 內**沒有** GitHub Actions（移除經過見 `docs/deploy.md`）。

**把關綁在 npm 生命週期上**，不是後台欄位：Workers Builds 只吃一條建置命令，所以用
`prebuild`（跑測試）與 `postbuild`（跑 SEO 稽核）掛在 `build` 上。任一步失敗就中止，
部署不會發生。

## 子路徑部署：四個不可改動點

站台掛在 hub 網域的子路徑底下，以下幾件事互相牽動，改錯不會有錯誤訊息，只會靜默壞掉。
這一節與下面兩節每一條的原因見 `docs/deploy.md`「AGENTS.md 的硬規則：子路徑」，改之前先讀。

- **`wrangler.jsonc` 的 `name` 維持 `qrcode-studio`**，必須與後台 Worker 名一致。
  本機 `npm run deploy` 會照這裡的名字建 Worker，名字不符就會另開一個空 Worker 並把 route 搶走。
- **`assets.directory` 維持 `./dist`**，不要改成 `./dist/qrcode-studio`。
- **`html_handling` 用 `force-trailing-slash`**。
- **第一條 route 必須是尾萬用 `www.pocketool.app/qrcode-studio*`**。精確寫法會讓
  `/qrcode-studio?utm_source=x` 落到 hub 回 404。

**舊子網域 `qrcode-studio.pocketool.app` 的 Custom Domain 刻意不寫進 `routes` 陣列。**

## 資產根目錄（`./dist`）要放的東西

`build.outDir` 在 `dist/qrcode-studio`，但有些東西 Cloudflare **只認資產根目錄那一份**：

- **`dist/404.html`**：根目錄沒有的話，`/qrcode-studio-foo` 這種前綴路徑會回**空 body**。
  由 `scripts/gen-sitemap.mjs` 從 `dist/qrcode-studio/404.html` 複製一份過去。
- `_headers` 本站沒有用到。若日後要加，同樣只有 `dist/_headers` 會被當設定檔解析，且規則路徑要自己帶 `/qrcode-studio` 前綴。

## 子路徑前綴的事實來源只有三處

其餘一律推導，不要在別的地方硬編：

1. `vite.config.ts` 的 `base` 與 `build.outDir`
2. `src/main.ts` 的 router base（`base: import.meta.env.BASE_URL`），漏了會白畫面。
   `src/router.ts` 內的 `path` 一律不加前綴。
3. `scripts/gen-sitemap.mjs` 的 `BASE` 與 `dist`

`src/config/site.ts` 的 `url` 是 canonical / og:url / JSON-LD 的來源，**無尾斜線**
（`useSeoHead.ts` 會自己補）。CI 刻意不再用 `SITE_URL` 環境變數覆蓋 sitemap 的 BASE，
避免出現第二個事實來源。

## 圖片解碼（`/scan/`）的四條規則

解碼用 `zxing-wasm`，以 WebAssembly 在使用者的瀏覽器內執行。以下四件事改錯都不會
有錯誤訊息，只會安靜地壞掉或把使用者的圖片內容送到不該去的地方。做法、原因與測試見 `docs/scan.md`。

- **WASM 自架，且與 JS 同版。** 不用套件預設的 `locateFile`（會去 `fastly.jsdelivr` 抓檔）；`package.json` 精確鎖版（不用 `^`），
  測試與稽核對帳 WASM 雜湊，混版就會紅。
- **只用 `zxing-wasm/reader`，而且只能動態 import。** `/scan` 這條 route 本身也必須是 `() => import(...)`。稽核會驗 entry chunk 裡
  沒有 `zxing`。
- **一律先解成 `ImageData` 再交給解碼器。** zxing-wasm 內建的影像解碼器**讀不懂 WebP**，所以走 `createImageBitmap` → canvas → `ImageData`。
- **圖片與解碼內容只能留在記憶體。** 不得寫入網址（query／hash）、Cookie、
  localStorage、sessionStorage、IndexedDB、Cache Storage，也不得進 GA 事件。
  「用這個內容再做一張」用 `src/utils/scan-handoff.ts` 的模組層級變數交棒，取用一次就清掉。
  解碼結果一律以文字節點渲染，**不得用 `v-html` 或 `innerHTML`**：那是別人做的 QR，
  內容完全不可信。`src/scan-gates.test.ts` 會掃原始碼擋下這些出口。

黃金解碼測試的圖（`test/fixtures/scan/`）離線產生，**不得從網路抓來路不明的測試圖**。
新增 `zxing-wasm` 版本時要一起更新 repo 根目錄的 `NOTICE.md`（記哪些見 `docs/scan.md`「授權」）。

## 下載檔的四周留白（靜區）

四邊至少 4 個模組：margin 由 `src/pure/qrGeometry.ts` 依模組數算（套件的 `margin` 是像素，不要寫死），外部寬高等於
「圖片大小」，放不下就擋。改 qr-code-styling、尺寸、留白或下載格式時，`qrGeometry.test.ts` 與 `qr-quiet-zone.test.ts`
都要綠。細節見 `docs/quiet-zone.md`。

## 批次產生（`/batch/`）

編碼器與批次邏輯不進 entry chunk、清單只在記憶體、GA 只送三個字面值、單次上限要先實測；印成標籤紙的毫米數字只在 `paper.ts`、
`@page` 只在列印區顯示時才加（跟著紙張換 A4 或 Letter）、不產生 PDF：規則、測試與實機驗收清單見 `docs/batch.md`。

## 中英文版（`/en/`）

英文版的網址前綴是 `/en/`，2026-10 先做首頁（網址 QR Code）、`/en/batch/`、`/en/barcode/` 三頁，跟繁中的同一頁成對。
既有的繁中網址、canonical、title、description 一律不動。細節（文案字典、Letter 標籤紙、測試）見 `docs/i18n.md`；
下面各條的全文（做法、原因、`seo:audit` 驗哪些）在它的「AGENTS.md 的硬規則」。

- **語系只看路由的 `meta.locale`**（英文路由才有 `'en'`）；元件用 `useLocale()`（`src/i18n/locale.ts`）取，不讀網址。
- **文案是型別化的字典，不放 vue-i18n 的 messages**：英文字串不進 entry chunk。**繁中字串搬進字典時一個字都不改**。
  英文是給美國使用者寫的，不是逐字翻譯。
- **hreflang 只放在成對的頁**（`src/i18n/pairs.ts` 的 `PAGE_PAIRS`）：`zh-Hant-TW`、`en`、`x-default` 三條，兩邊互指；
  其他繁中頁維持只指向自己的一條 `zh-Hant-TW`。**`x-default` 指繁中那一頁**（理由見 `docs/i18n.md`）。
- **語言跟著頁走**：`<html lang>`、`og:locale`、JSON-LD 的 `inLanguage`、`og:site_name`、商標聲明與回報問題的連結都跟著那一頁的語言。
- **語言切換在頁首**：成對的頁連到另一個語言的同一頁，沒有對應頁就連到該語言的首頁（`switchTarget`）。
- **GA 不分 property、不加參數**：兩種語言都是 `content_group: 'qrcode-studio'`。批次的 `batch_download` 仍然只有三個字面值。
- **英文頁沒有的東西連到繁中**（英文頁尾「In Chinese only」）；英文首頁只開網址一種。

## v-html 的富文字連結要自己補前綴

教學本文（`src/content/guide-bodies.ts`）與 `src/config/qr-types.ts` 的 `body` 用 `v-html` 塞進 DOM，**既不經 Vite base 也不經 vue-router**。
這類 sink 都套用 `src/utils/with-base.ts` 的 `withBase()`，新增同型的 `v-html` 出口時記得一起套。
模板內的站內連結一律用 `RouterLink`，不要用原生 `<a href="/...">`。`seo:audit` 逐頁驗 dist 內所有 `href="/..."` 與 `src="/..."` 都以 `/qrcode-studio/` 開頭。

教學的本文不要搬回 `guides.ts`（中繼資料會進 entry chunk）；`published` 不要改，`updated` 只在實質改寫時更新。
哪些 sink、示意圖怎麼產生、日期從哪裡來，全文見 `docs/guides.md`。

## 工具區與說明文章

工具頁分成上下兩塊（工具區與說明文章），一眼要分得出哪裡是應用程式、哪裡是說明。下面各條的全文（class 名、樣式、例子與測試）見 `docs/ui.md`「工具區與說明文章」。

- **工具區**（`src/components/ToolZone.vue`）直接放在 `<main>` 底下：**不要包進有寬度上限的容器，也不要改用 `100vw`**。
- **粗框加硬陰影的 `card`／`sticker` 只給工具卡用**，文章裡不要再用。
- **副標只留一行**（30 字以內）。SEO 內文可以移出工具區，但**一個字都不能刪**；`seo:audit` 會對帳。
- 區塊標示用 `.zone-label` 段落，**不是標題**：各頁的 h1／h2／h3 大綱不因為分區而改變。
- `main.css` 開頭的框線 reset 不要拿掉；`html`、`body` 的 `overflow-x` 用 `clip`，**不要改回 `hidden`**（`src/styles/main-css.test.ts` 鎖著）。
- **收進欄名旁的「?」**（`src/components/HelpTip.vue`）：只收「長、而且不看也能把欄位填完」的說明；
  錯誤、條件式提醒、填寫規則、列印尺寸、掃描的警告與指引**一律看得到**。`src/helpNotes.test.ts` 兩個方向都鎖。
  欄位用 `aria-describedby` 指到說明框，「?」不放進 legend 或 `<label>`，只有圖示的按鈕補 sr-only 文字（細節見 `docs/ui.md`）。
- **掃描結果的警告只給認不出類型的內容**：認得出類型的改成一句中性說明，認不出的照舊警告，不要放寬（`ScanResultView.test.ts` 兩邊都鎖）。
- **隱私只說一次**：工具卡頂部一行（`PrivacyNote.vue`），預覽框與標題上不要再加「不傳雲端」貼紙（頁尾那行保留）。
- **圖示：不用 emoji**：圖示一律用 Lucide 的 `i-lucide-<名稱>`，`presetIcons` **不得設 `cdn`、不得開 `autoInstall`**；
  圖示一律 `aria-hidden="true"`；標題（h1／h2／h3）裡不放圖示或 emoji（`src/no-emoji.test.ts` 與 `seo:audit` 擋）。

## 用字：白話優先

站長的要求是減少使用者的學習負擔（#7）。下面各條的例子、詞表與例外見 `docs/ui.md`「用字：白話優先」。

- **白話在前，原詞放括號**：先寫使用者聽得懂的說法；要讓人對得上外面看到的名稱時，原詞放括號或收進「?」。
- **使用者在別處真的會看到的名稱照寫，每頁第一次出現就白話解釋**。
- **只有工程師懂的詞，工具區不用**。台灣用語：「半角」一律寫「半形」。
- **欄名改了，提到它的地方一起改**。
- **不跟著文案改的**：網址、下拉選單與勾選框的 `value`、類型頁、首頁、`/scan/`、`/barcode/` 的 meta description 與 `seo:audit` 對帳的首段。
  title 與 H1 要改時另外處理：改之前把改前的 title 與 28 天基線記進 `docs/seo-checklist.md` 的「標題改動紀錄」。
- **關於頁的授權段落與隱私權頁準確性優先**：原詞保留，只在前面補白話。
- 教學只調整用字時 `updated` 不動（sitemap 的 `<lastmod>` 不跟著變），示意圖、圖說與替代文字不重產。
- `src/plain-words.test.ts` 擋工程師用語，要再擋新的詞，加在那裡。

## 產品名與站徽

2026-09-26 由 QR Code Studio 改名為 QR Code 製造機。**只換顯示的名字**：網址 slug、Worker 名、GA 的 `content_group`
都還是 `qrcode-studio`，不要跟著改。下面各條的全文（欄位、稽核項目、分享圖的寫法）見 `docs/brand/README.md`「AGENTS.md 的硬規則」。

- **唯一開關是 `src/config/site.ts`**：頁面與元件一律用 `site.name`、`site.nameEn`，不要寫死（`src/brand.test.ts` 擋）。
- **舊名只出現在兩處**：JSON-LD `WebSite.alternateName`（跟英文名一起）與關於頁更新紀錄的「原名」。
- `seo:audit` 的 `PRODUCT_NAME` 刻意再寫一次、不從 `site.ts` 推導，改名時兩邊一起改。
- **商標聲明**：頁尾與關於頁的「商標」一節都要有 DENSO WAVE 的註冊商標聲明（`site.trademark`）。
- **站徽與分享圖**：正本在 `scripts/brand/`，`node scripts/brand/render.mjs` 產生到 `public/`（產物進版控，不進 build）；
  manifest 圖示的 any 與 maskable 各兩張，不合寫成 `any maskable`。
- **分享圖上的字**在 `scripts/brand/cards.mjs`：有專屬分享圖的頁 title 改說法時，分享圖跟著改字、重跑 `render.mjs`，
  替代文字照圖上的字寫。圖上的字不寫數量。新增教學時一起加卡片與替代文字。只換分享圖不動 `updated`。
- 頁首站徽在模板裡用 `import.meta.env.BASE_URL` 組網址；`manifest.webmanifest` 裡的路徑一律寫相對路徑。
- **JSON-LD 的 `Organization` 是出品方口袋工具，不是本產品。** 每個 Organization 節點都用站群共用的 `@id`（`site.ts` 的 `publisher.id`），
  `App.vue` 每頁一份完整節點、`publisher` 只放參照，logo 用 hub 的品牌圖網址，不要換成本產品的站徽。
  稽核與測試的 `ORG_ID`／`ORG_LOGO` 刻意再寫一次，要改 `@id` 或 logo 時三處一起改（原則上不改）。

## 整頁載入沿用預渲染的 DOM（hydrate）

`src/main.ts` 在 SSR 時把 routePath 記在 `<html data-ssg-route>`，client 比對網址，同一頁才 hydrate，404.html 這類
拿別頁 HTML 回應的照舊整頁重畫（原因與比對規則見 `src/utils/hydration.ts`）。三條規則：

- 瀏覽器才有的狀態（localStorage、navigator、`route.query`、`/scan/` 的交棒、`Date.now()`、`Math.random()`）
  不得在 setup 或 template 直接讀，一律在 `onMounted` 之後。
- 下拉選單、radio、checkbox 的選取狀態用 `v-model`，不用 `:value`／`:checked`：hydrate 不改 `<select>` 的 value 與
  checked，`<select :value>` 會停在第一個選項，Firefox 重新整理還會把上一次的選擇還原到欄位上。
- `vite.config.ts` 的 `ssgOptions.formatting` 維持 `'none'`：`'minify'` 削掉文字節點頭尾的空白，每頁都 text mismatch。

`src/hydration.test.ts` 逐頁 hydrate 驗沒有 mismatch、表單狀態對得上；`seo:audit` 驗每頁 `data-ssg-route` 跟檔案路徑
一致、每個下拉選單恰好一個 `selected`。

## GA 只在正式主機載入

`index.html` 的 GA 是一段 inline script：`location.hostname` 等於 `www.pocketool.app` 才建立 `gtag`、送 `config`
（`content_group: 'qrcode-studio'`）並插入 `gtag.js`；localhost、`vite dev`／`preview`、`wrangler dev`、workers.dev
連 `googletagmanager.com` 都不請求。**不要改回寫死的 `<script src="…gtag/js">`**：本機跑的是同一份產物，
開發與驗收的造訪會混進正式報表。404 頁由同一份 `index.html` 預渲染，不必另寫一份。

- `src/analytics.test.ts` 換上假的 location、window、document，在各主機名上跑原始碼那段；`seo:audit` 對產物
  （build 會壓縮改寫這段）逐頁做同樣的事，含 404.html
- 程式裡要送自訂事件時，先確認 `window.gtag` 存在；非正式主機上它是 `undefined`
- 瀏覽器驗收（本機或正式站）一律用 `page.route` 擋掉 GA 與廣告請求，要驗 GA 行為就攔截後回 204

## robots.txt 與 ads.txt 由 hub 提供

子路徑下爬蟲只讀根網域的 `/robots.txt`，AdSense 也只讀根網域的 `/ads.txt`，
所以本 repo 不放這兩個檔，統一由 hub（`../pocket-tool-blog/public/`）提供。
新增路由後要記得去 hub 確認 sitemap 那行還在。

本站目前暫時不載入廣告程式（`adsbygoogle.js`），頁面也沒有 `google-adsense-account` meta；要加其中任何一個之前先問站長。

## 改動 base 相關設定後的本機驗證

重新 build 後檢查 `dist` 結構與站內連結前綴，再用 `wrangler dev` 打四種網址；指令與預期回應見 `docs/deploy.md`。
**wrangler dev 在啟動時建好資產清單**，build 之後一定要重啟再驗。
