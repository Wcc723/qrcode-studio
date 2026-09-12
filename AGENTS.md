# AGENTS.md

這份是 `qrcode-studio` 的開發指引，Claude Code 與 Codex 共用（`CLAUDE.md` 只引用這份）。

> **本專案屬於口袋工具 workspace**（本機在 `../../`）。在 workspace 裡工作時，開工前先讀根目錄的 `AGENTS.md`：跨專案規則、網域與轉址、搬站流程、專案清單都在那裡。Claude Code 會自動載入它；Codex 請自己讀。

**不可違反**

- push `main` 前須經站長同意；push 即觸發 Cloudflare Workers Builds 部署，不要手動 `wrangler deploy`
- `wrangler.jsonc` 的 `name` 必須是 `qrcode-studio`（線上 Worker 名）
- 子路徑相關設定（base、routes、assets 目錄、`_headers`、`404.html`）改動前，先讀本檔的子路徑章節與 workspace 的 `docs/runbooks/subpath-migration.md`

## 這個 repo 是什麼

**QR Code Studio**，正式網址 `https://www.pocketool.app/qrcode-studio/`。在瀏覽器內產生
網址 / WiFi / 電子名片 / Email 等類型的 QR Code，可自訂顏色、漸層、LOGO 與容錯等級，
下載 PNG / SVG / JPG。Vue 3 + Vite + vite-ssg + UnoCSS，每條路由都預渲染成靜態 HTML。

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
npm run test        # vitest（237 個）
npm run seo:audit   # 稽核 dist/qrcode-studio（113 條）
npm run deploy      # 緊急備用：rm -rf dist && build && wrangler deploy
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

## v-html 的富文字連結要自己補前綴

`src/content/guides.ts` 的 `bodyHtml` 與 `src/config/qr-types.ts` 的 `body` 是原生
`<a href="/...">`，用 `v-html` 塞進 DOM，**既不經 Vite base 也不經 vue-router**，
在子路徑下會連到 hub 的 404。兩個 sink（`GuidePage.vue`、`SeoContent.vue`）都套用
`src/utils/with-base.ts` 的 `withBase()`。新增同型的 `v-html` 出口時記得一起套。

模板內的站內連結一律用 `RouterLink`，不要用原生 `<a href="/...">`。

`npm run seo:audit` 有一條逐頁斷言會擋下漏補的情況：dist 內所有 `href="/..."`
必須以 `/qrcode-studio/` 開頭。期望前綴由 sitemap 的第一條 `<loc>` 推導，
讓 `gen-sitemap.mjs` 與 `site.ts` 兩個獨立來源互相對帳。

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
