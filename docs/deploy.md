# 部署：背景與本機驗證

`AGENTS.md` 留規則與指路，這份放部署相關的背景、沿革與完整的驗證指令。
子路徑的規則本身（四個不可改動點、資產根目錄、前綴的事實來源）以 `AGENTS.md` 為準，各條的原因在下面的「AGENTS.md 的硬規則：子路徑」。

## AGENTS.md 的硬規則：子路徑

2026-10-15 從 `AGENTS.md` 逐字搬來（#24：`AGENTS.md` 精簡到 20 KB 以下，免得超過 Codex 串接指令的上限）。
`AGENTS.md` 的子路徑三節（四個不可改動點、資產根目錄、前綴的事實來源）只留規則與指路，下面是全文與原因，和它一樣不可違反。

### 四個不可改動點

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

### 資產根目錄（`./dist`）要放的東西

`build.outDir` 在 `dist/qrcode-studio`，但有些東西 Cloudflare **只認資產根目錄那一份**：

- **`dist/404.html`**：route 第一條是尾萬用，`/qrcode-studio-foo` 這種前綴路徑也會進來，
  而 `not_found_handling: "404-page"` 是往上找「最近的」404.html。根目錄沒有的話會回
  **空 body**。由 `scripts/gen-sitemap.mjs` 從 `dist/qrcode-studio/404.html` 複製一份過去。

`_headers` 本站沒有用到（沒有自訂快取或安全標頭）。若日後要加，同樣只有
`dist/_headers` 會被當設定檔解析，且規則路徑要自己帶 `/qrcode-studio` 前綴
（它比對的是請求網址，不是磁碟結構）。

### 子路徑前綴的事實來源只有三處

其餘一律推導，不要在別的地方硬編：

1. `vite.config.ts` 的 `base` 與 `build.outDir`
2. `src/main.ts` 的 router base（`base: import.meta.env.BASE_URL`）：
   vite-ssg 的 `createWebHistory(routerOptions.base)` **不會**自動吃 Vite 的 base，
   漏了會讓 matcher 命不到任何路由（白畫面）且預渲染 HTML 的 `<a href>` 全部少前綴。
   `src/router.ts` 內的 `path` 一律不加前綴。
3. `scripts/gen-sitemap.mjs` 的 `BASE` 與 `dist`

`src/config/site.ts` 的 `url` 是 canonical / og:url / JSON-LD 的來源，**無尾斜線**
（`useSeoHead.ts` 會自己補）。CI 刻意不再用 `SITE_URL` 環境變數覆蓋 sitemap 的 BASE，
避免出現第二個事實來源。

## 站群與搬站

工具站正陸續從 `<slug>.pocketool.app` 子網域搬到 hub 的子路徑。**本站已於 2026-09-07 搬完**，
與 `compound-calculator`、`kaomoji` 同一模式；`tw-life-calc` 與 `zipcode` 待搬，
`beyblade` 與 `speak-cards` 站長決定不搬。逐站現況以 hub 的 `CLAUDE.md` 對照表為準。

## 部署方式的沿革

repo 內**沒有** GitHub Actions。原本有一份 `.github/workflows/deploy.yml`，但 repo 的
Actions secrets 是空的、`CLOUDFLARE_API_TOKEN` 從未設定，那條部署從 2026-06-01 起每次
都失敗，而 Workers Builds 一直正常運作所以沒人發現。2026-09-07 已整個移除。

把關綁在 npm 生命週期上（`prebuild`、`postbuild`），不是後台欄位：這樣把關留在版本控管內、
本機能用同一條指令重現，也不必碰後台那個一輸入就會讓整頁變空白的「組建命令」欄位。

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
