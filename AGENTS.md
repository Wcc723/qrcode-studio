# AGENTS.md

這份是 `qrcode-studio` 的開發指引，Claude Code 與 Codex 共用（`CLAUDE.md` 只引用這份）。

> **本專案屬於口袋工具 workspace**（本機在 `../../`）。在 workspace 裡工作時，開工前先讀根目錄的 `AGENTS.md`：跨專案規則、網域與轉址、搬站流程、專案清單都在那裡。Claude Code 會自動載入它；Codex 請自己讀。

**不可違反**

- push `main` 前須經站長同意；push 即觸發 Cloudflare Workers Builds 部署，不要手動 `wrangler deploy`
- `wrangler.jsonc` 的 `name` 必須是 `qrcode-studio`（線上 Worker 名）
- 子路徑相關設定（base、routes、assets 目錄、`_headers`、`404.html`）改動前，先讀本檔的子路徑章節與 workspace 的 `docs/runbooks/subpath-migration.md`
- `/scan/` 的解碼器 WASM 一律自架，不得改回第三方 CDN；`zxing-wasm` 必須精確鎖版（見「圖片解碼」章節）
- 新增或移除路由時，要同步更新 `scripts/seo/audit.mjs` 的 `EXPECTED_PATHS`，否則 build 會擋下來

## 這個 repo 是什麼

**QR Code 製造機**（英文 QR Code Maker，2026-09-26 前叫 QR Code Studio），正式網址 `https://www.pocketool.app/qrcode-studio/`。在瀏覽器內產生
網址 / WiFi / 電子名片 / Email 等類型的 QR Code，可自訂顏色、漸層、LOGO 與容錯等級，
下載 PNG / SVG / JPG。Vue 3 + Vite + vite-ssg + UnoCSS（圖示用建置時打包的 Lucide），
每條路由都預渲染成靜態 HTML。

它是 `pocketool.app` 站群的 7 個工具站之一。站群的 hub 是
`https://www.pocketool.app`（repo `pocket-tool-blog`，workspace 內在 `../pocket-tool-blog`），工具站正陸續從
`<slug>.pocketool.app` 子網域搬到 hub 的子路徑。**本站已於 2026-09-07 搬完**，
與 `compound-calculator`、`kaomoji` 同一模式；`tw-life-calc` 與 `zipcode` 待搬，
`beyblade` 與 `speak-cards` 站長決定不搬。逐站現況以 hub 的 `CLAUDE.md` 對照表為準。

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

## 部署

**Cloudflare Workers Static Assets**（設定見 `wrangler.jsonc`，Worker 名 `qrcode-studio`），
走 **Cloudflare Workers Builds**：後台接 Git，push 到 `main` 就自動建置並部署。
這個 Cloudflare 帳號底下**沒有任何 Pages 專案**，站群全部是 Worker。

repo 內**沒有** GitHub Actions。原本有一份 `.github/workflows/deploy.yml`，但 repo 的
Actions secrets 是空的、`CLOUDFLARE_API_TOKEN` 從未設定，那條部署從 2026-06-01 起每次
都失敗，而 Workers Builds 一直正常運作所以沒人發現。2026-09-07 已整個移除。

**把關綁在 npm 生命週期上**，不是後台欄位：Workers Builds 只吃一條建置命令，所以用
`prebuild`（跑測試）與 `postbuild`（跑 SEO 稽核）掛在 `build` 上。任一步失敗就中止，
部署不會發生。這樣把關留在版本控管內、本機能用同一條指令重現，也不必碰後台那個
一輸入就會讓整頁變空白的「組建命令」欄位。

## 子路徑部署：四個不可改動點

站台掛在 hub 網域的子路徑底下，以下幾件事互相牽動，改錯不會有錯誤訊息，只會靜默壞掉。

- **`wrangler.jsonc` 的 `name` 維持 `qrcode-studio`**，必須與後台 Worker 名一致。
  Workers Builds 會用後台名稱覆寫這欄，所以 CI 看不出差異；但本機 `npm run deploy`
  會照這裡的名字建 Worker，名字不符就會另開一個空 Worker 並把 route 搶走。
- **`assets.directory` 維持 `./dist`**，不要改成 `./dist/qrcode-studio`。
  URL `/qrcode-studio/wifi/` 要對到檔案 `dist/qrcode-studio/wifi/index.html`，
  靠的就是 directory 停在 `./dist` 這一層，與 `vite.config.ts` 的
  `base: '/qrcode-studio/'` ＋ `build.outDir: 'dist/qrcode-studio'` 一起把
  磁碟路徑與線上網址對齊。
- **`html_handling` 用 `force-trailing-slash`**。站內 canonical、sitemap `<loc>`、
  vue-router 內鏈三者都是帶尾斜線的形式（`/wifi/`、`/guide/xxx/`），強制尾斜線
  讓對外網址與它們一致。
- **第一條 route 必須是尾萬用 `www.pocketool.app/qrcode-studio*`**。Cloudflare 的
  route pattern 比對整條請求 URL（含 query string），而 pattern 內不能寫 query 參數，
  所以要匹配帶 query 的網址只能以 `*` 結尾。精確寫法會讓
  `/qrcode-studio?utm_source=x` 落到 hub 回 404。副作用是 `/qrcode-studio-foo`
  這類前綴路徑也會被本 Worker 接走（見下方 404.html）。

**舊子網域 `qrcode-studio.pocketool.app` 的 Custom Domain 刻意不寫進 `routes` 陣列。**
wrangler 只在陣列裡有 `custom_domain` 條目時才會呼叫 `publishCustomDomains`，沒有就
完全不碰後台既有的綁定，那筆 proxied DNS 記錄才會留著讓轉址有流量可攔。

## 資產根目錄（`./dist`）要放的東西

`build.outDir` 在 `dist/qrcode-studio`，但有些東西 Cloudflare **只認資產根目錄那一份**：

- **`dist/404.html`**：route 第一條是尾萬用，`/qrcode-studio-foo` 這種前綴路徑也會進來，
  而 `not_found_handling: "404-page"` 是往上找「最近的」404.html。根目錄沒有的話會回
  **空 body**。由 `scripts/gen-sitemap.mjs` 從 `dist/qrcode-studio/404.html` 複製一份過去。

`_headers` 本站沒有用到（沒有自訂快取或安全標頭）。若日後要加，同樣只有
`dist/_headers` 會被當設定檔解析，且規則路徑要自己帶 `/qrcode-studio` 前綴
（它比對的是請求網址，不是磁碟結構）。

## 子路徑前綴的事實來源只有三處

其餘一律推導，不要在別的地方硬編：

1. `vite.config.ts` 的 `base` 與 `build.outDir`
2. `src/main.ts` 的 router base（`base: import.meta.env.BASE_URL`）——
   vite-ssg 的 `createWebHistory(routerOptions.base)` **不會**自動吃 Vite 的 base，
   漏了會讓 matcher 命不到任何路由（白畫面）且預渲染 HTML 的 `<a href>` 全部少前綴。
   `src/router.ts` 內的 `path` 一律不加前綴。
3. `scripts/gen-sitemap.mjs` 的 `BASE` 與 `dist`

`src/config/site.ts` 的 `url` 是 canonical / og:url / JSON-LD 的來源，**無尾斜線**
（`useSeoHead.ts` 會自己補）。CI 刻意不再用 `SITE_URL` 環境變數覆蓋 sitemap 的 BASE，
避免出現第二個事實來源。

## 圖片解碼（`/scan/`）的四條規則

解碼用 `zxing-wasm`，以 WebAssembly 在使用者的瀏覽器內執行。以下四件事改錯都不會
有錯誤訊息，只會安靜地壞掉或把使用者的圖片內容送到不該去的地方。

- **WASM 自架，且與 JS 同版。** 套件預設的 `locateFile` 會去 `fastly.jsdelivr` 抓檔，
  那會讓「圖片不離開瀏覽器」多一個第三方依賴。做法是 `import ... from
  'zxing-wasm/reader/zxing_reader.wasm?url'` 讓 Vite 收成本站資產，再用
  `prepareZXingModule({ overrides: { locateFile } })` 覆寫。`package.json` 精確鎖版
  （不用 `^`），測試以套件 export 的 `ZXING_WASM_SHA256` 對帳 `node_modules` 那一份，
  稽核再比對 `dist` 那一份，混版就會紅。
- **只用 `zxing-wasm/reader`，而且只能動態 import。** `zxing-wasm` 與 `/full`、`/writer`
  會多帶編碼器進來。靜態 import 會把解碼器拖進 entry chunk，變成全站每一頁都付這個
  成本；`/scan` 這條 route 本身也必須是 `() => import(...)`。稽核會驗 entry chunk 裡
  沒有 `zxing`。
- **一律先解成 `ImageData` 再交給解碼器。** zxing-wasm 內建的影像解碼器讀得懂 PNG 與
  JPEG，但**讀不懂 WebP**（會回一筆空結果，看起來就像「這張圖沒有條碼」）。所以走
  `createImageBitmap` → canvas → `ImageData`，三種容器共用一條路；順便在配置 canvas
  之前就能擋掉解壓縮炸彈。
- **圖片與解碼內容只能留在記憶體。** 不得寫入網址（query／hash）、Cookie、
  localStorage、sessionStorage、IndexedDB、Cache Storage，也不得進 GA 事件。
  「用此內容重新產生」用 `src/utils/scan-handoff.ts` 的模組層級變數交棒，取用一次就清掉。
  解碼結果一律以文字節點渲染，**不得用 `v-html` 或 `innerHTML`**：那是別人做的 QR，
  內容完全不可信。`src/scan-gates.test.ts` 會掃原始碼擋下這些出口。

黃金解碼測試（`src/utils/zxing-reader.test.ts`）用的圖固定在 `test/fixtures/scan/`，
由 `scripts/fixtures/gen-scan-fixtures.mjs` 以同版 zxing-wasm writer 離線產生，
**不得從網路抓來路不明的測試圖**。測試期間會把 `fetch` 換成會拋錯的版本，
確保解碼真的沒有連網。

新增 `zxing-wasm` 版本時要一起更新 repo 根目錄的 `NOTICE.md`：那份記的是上游四份授權
（zxing-cpp 與 ZXingWasm.cpp 的 Apache-2.0、zint 的 BSD-3-Clause、zxing-wasm 自有碼的 MIT）
與實際安裝的版本、WASM 雜湊、zxing-cpp commit，站上的對應說明在 `/about/`。

## v-html 的富文字連結要自己補前綴

`src/content/guide-bodies.ts` 的教學本文與 `src/config/qr-types.ts` 的 `body` 是原生
`<a href="/...">`、`<img src="/...">`，用 `v-html` 塞進 DOM，**既不經 Vite base 也不經 vue-router**，
在子路徑下會連到 hub 的 404。這類 sink（`GuidePage.vue`、`SeoContent.vue`、`FaqPage.vue`）都套用
`src/utils/with-base.ts` 的 `withBase()`，它同時補 `href` 與 `src`。新增同型的 `v-html` 出口時記得一起套。

教學的中繼資料（標題、日期、分組）在 `src/content/guides.ts`，會進 entry chunk；本文在
`guide-bodies.ts`，只有動態載入的文章頁會用到，不要把本文搬回 `guides.ts`。文章裡的示意圖
由 `scripts/figures/gen-guide-figures.mjs` 產生到 `public/guides/`（產物進版控），圖裡的版本與
模組數要和文章寫的一致。`published` 是 git 歷史上的首次上線日，不要改；`updated` 只在實質改寫時更新，
sitemap 的 `<lastmod>` 與 `article:modified_time` 都從它來。

模板內的站內連結一律用 `RouterLink`，不要用原生 `<a href="/...">`。

`npm run seo:audit` 有一條逐頁斷言會擋下漏補的情況：dist 內所有 `href="/..."` 與 `src="/..."`
必須以 `/qrcode-studio/` 開頭。期望前綴由 sitemap 的第一條 `<loc>` 推導，
讓 `gen-sitemap.mjs` 與 `site.ts` 兩個獨立來源互相對帳。

## 工具區與說明文章

工具頁（首頁、7 個類型頁、`/scan/`、`/barcode/`）分成上下兩塊，一眼要分得出哪裡是應用程式、哪裡是說明：

- **工具區**（`src/components/ToolZone.vue`）：h1、一行副標、工具卡，整條鋪淡薄荷底 `#E6F7EE`，
  下緣一條整寬黑線。它直接放在 `<main>` 底下，本來就是整個視窗寬；**不要包進有寬度上限的容器，
  也不要改用 `100vw`**（會把捲軸寬度算進去，造成水平溢出）。
- **說明文章**（`SeoContent.vue` 與各頁的 `<article data-test="doc">`）：維持頁面底色、閱讀寬度 720px，
  文件樣式（`main.css` 的 `.doc-steps`、`.doc-faq`、`.doc-links`、`.doc-chips`）。**粗框加硬陰影的
  `card`／`sticker` 只給工具卡用**，文章裡不要再用，否則整頁又會看起來都像工具。
- **副標只留一行**（30 字以內，類型頁在 `qr-types.ts` 的 `lead`）。原本標題下那段完整說明放在說明文章
  第一段（`data-test="doc-lead"`）。SEO 內文可以移出工具區，但**一個字都不能刪**；
  `seo:audit` 會對帳這些句子仍在預渲染 HTML 的說明文章裡、不在工具區。
- 「輸入內容」「外觀」「預覽與下載」「使用說明」這類區塊標示用 `.zone-label` 段落，**不是標題**：
  各頁的 h1／h2／h3 大綱不因為分區而改變。
- `main.css` 開頭有最小框線 reset（所有元素 `border-width: 0; border-style: solid`），UnoCSS 的
  `border-2` 這類 class 才畫得出框線；`html`、`body` 的 `overflow-x` 用 `clip`，**不要改回 `hidden`**：
  那會讓 body 變成捲動容器，預覽框的 `sticky` 就黏不住。`src/styles/main-css.test.ts` 鎖著這兩條。

### 工具裡的說明：「?」與一律看得到的提示

- **收進欄名旁的「?」**（`src/components/HelpTip.vue`）：只收「長、而且不看也能把欄位填完」的說明，
  例如容錯等級的百分比、LOGO 的大小限制、尺寸換算、條碼類型的用途、掃描的檔案上限。
  收起時用 `hidden`，文字仍在預渲染 HTML 裡；欄位要用 `aria-describedby` 指到說明框的 id。
  「?」不放進 `legend` 或 `<label>` 裡：欄名用 `<label for>`（或 `aria-hidden` 的欄名配 sr-only 的 legend），按鈕接在右邊。
- **一律看得到**：錯誤（容量超過、條碼格式與檢查碼）、條件式提醒（勾透明時 JPG 改白底）、
  填寫規則（`symbologies.ts` 的 `rule`：位數、可用字元、檢查碼）、列印尺寸與 PNG 像素數、
  掃描到非 http(s) 的警告、多個條碼與讀不到的指引。收起來只會讓工具更難用。
- **隱私只說一次**：工具卡頂部一行（`PrivacyNote.vue`），完整說明與隱私權政策連結收在它的「?」；
  預覽框與標題上不要再加「不傳雲端」貼紙（頁尾那行保留）。
- `src/helpNotes.test.ts` 兩個方向都鎖：每個「?」預設收起、欄位指得到它、裡面沒有可填欄位；
  上面「一律看得到」的每一項都不在收起來的容器裡。

### 圖示：不用 emoji

- 畫面上不用 emoji，圖示一律用 Lucide（`@iconify-json/lucide`，devDependency），寫成 UnoCSS 的
  `i-lucide-<名稱>` class，建置時轉成 CSS，顏色跟著 `currentColor`。`presetIcons` **不得設 `cdn`、
  不得開 `autoInstall`**：瀏覽器執行時不向任何第三方取圖。
- 圖示一律 `aria-hidden="true"`；只有圖示的按鈕要補文字（例如 sr-only 的「下載」）。
  需要顏色時放進糖果色圓底徽章（`uno.config.ts` 的 `icon-badge`、`icon-badge-sm`、`icon-badge-lg`，底色加 `bg-pop-*`）。
- 標題（h1／h2／h3）裡不放圖示或 emoji。`⌘` 是按鍵上的字，要包在 `<kbd>` 裡。
- UnoCSS 預設不掃一般的 `.ts`，所以 `uno.config.ts` 另外把 `src/config/*.ts` 加進掃描範圍（類型圖示寫在
  `qr-types.ts` 的 `icon`）。圖示 class 放在其他 `.ts` 檔時，要一起加進去。
- `src/no-emoji.test.ts` 掃元件、設定與教學本文（`©`、`™`、`®` 例外，測試檔不掃）；`seo:audit` 驗
  各頁內容沒有 emoji、用到的 `i-lucide-*` 在 CSS 裡都有規則（圖示集沒裝時 class 會靜默失效）、
  產物沒有連到線上圖示服務。新增圖示時 `NOTICE.md` 不必改，Lucide 的授權已經寫在那裡。

## 產品名與站徽

2026-09-26 由 QR Code Studio 改名為 QR Code 製造機。**只換顯示的名字**：網址 slug、Worker 名、GA 的 `content_group`
都還是 `qrcode-studio`，不要跟著改。

- **唯一開關是 `src/config/site.ts`**：`name`（產品名）、`nameEn`（英文名）、`formerNames`（舊名）、`siteName`（og:site_name）、
  `trademark`（商標聲明）。頁面與元件一律用 `site.name`，不要寫死；`src/brand.test.ts` 掃原始碼，寫死新名或舊名都會紅。
- **舊名只出現在兩處**：JSON-LD `WebSite.alternateName`（跟英文名一起）與關於頁更新紀錄的「原名」。`seo:audit` 逐頁驗
  title、og 標籤與畫面文字沒有舊名（關於頁剛好一次）。
- **title**：首頁與 7 個類型頁本來就沒有品牌後綴，改名不動；FAQ、教學總覽、隱私權、404 的後綴與關於頁跟著 `site.name`。
  `seo:audit` 的 `PRODUCT_NAME` 刻意再寫一次、不從 `site.ts` 推導，改名時兩邊一起改。
- **商標聲明**：名稱含 QR Code，頁尾與關於頁的「商標」一節都要有 DENSO WAVE 的註冊商標聲明（`site.trademark`），`seo:audit` 逐頁驗。
- **站徽**：正本在 `scripts/brand/`（`logo-source.png` 與分頁圖示用的簡化版 `favicon-source.png`），`node scripts/brand/render.mjs`
  從它們產生 `public/` 的頁首站徽、favicon、apple-touch-icon、manifest 圖示與三張分享圖（產物進版控，不進 build）。
  選案理由、檔案對照與重產方式在 `docs/brand/README.md`。
- 頁首站徽在模板裡用 `import.meta.env.BASE_URL` 組網址：寫死 `/logo-64.png` 不經 Vite base，在子路徑下會連到 hub 的 404。
  `index.html` 的 `<link>` 由 Vite 自動補前綴；`manifest.webmanifest` 裡的路徑一律寫相對路徑（`./`、`icon-192.png`）。
- JSON-LD 的 `Organization` 是出品方口袋工具，logo 維持 `public/pocketool-logo.png`，不要換成本產品的站徽。

## robots.txt 與 ads.txt 由 hub 提供

子路徑下爬蟲只讀根網域的 `/robots.txt`，AdSense 也只讀根網域的 `/ads.txt`，
所以本 repo 的 `public/robots.txt` 與 `public/ads.txt` 已刪除，兩者統一由 hub
（repo `pocket-tool-blog` 的 `public/`，workspace 內在 `../pocket-tool-blog/public/`）提供。新增路由後要記得去 hub 確認 sitemap 那行還在。

## 改動 base 相關設定後的本機驗證

```bash
rm -rf dist && npm run build

ls -a dist                                   # 應只有 404.html 與 qrcode-studio/
grep -rho 'href="/[^"]*"' dist/qrcode-studio --include='*.html' \
  | sort -u | grep -v '^href="/qrcode-studio/'   # 必須零輸出

npx wrangler dev --port 8799 --local         # 用真正的 Workers runtime 驗
curl -sI http://127.0.0.1:8799/qrcode-studio/            # 200
curl -sI http://127.0.0.1:8799/qrcode-studio             # 307 → 帶尾斜線
curl -sI "http://127.0.0.1:8799/qrcode-studio?utm_source=t"  # 307，不能是 404
curl -sI http://127.0.0.1:8799/qrcode-studio-foo         # 404 但 content-length 不能是 0
```

**wrangler dev 會在啟動時建好資產清單**，build 之後沒重啟的話會拿到過時的結果
（實際踩過：未預渲染路徑一度回 404，重啟後正常）。改完 build 一定要重啟再驗。
