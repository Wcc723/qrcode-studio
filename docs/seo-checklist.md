# SEO 上線檢核清單：QR Code 製造機

> 網址：`https://www.pocketool.app/qrcode-studio/`　·　產生日期：2026-06-01，2026-09 更新
> 2026-09 由子網域 `qrcode-studio.pocketool.app` 搬到 www 主網域子路徑，舊網址以 Cloudflare Bulk Redirect 301 過來。
> 標記：✅ 完成　❌ 未完成　⚠️ 需手動（外部平台 / 待補資產，無法由程式驗證）

## A. 技術基礎（程式可驗：`npm run seo:audit`，2026-09-26 共 497 項，由 `postbuild` 綁在每次 `npm run build` 之後自動跑）

- [x] ✅ robots.txt 由 hub 的 `https://www.pocketool.app/robots.txt` 統一提供（子路徑下的 robots.txt 爬蟲不會讀），本 repo 不再放 `public/robots.txt`
- [x] ✅ sitemap.xml 存在，涵蓋所有公開路由（18 條，loc 全為 `https://www.pocketool.app/qrcode-studio/...`，build 時自動產生並排除 404）
- [x] ✅ 每頁 canonical 值帶正確子路徑前綴（audit 逐頁斷言，非只檢查標籤存在）
- [x] ✅ 每頁內鏈皆帶 `/qrcode-studio/` 前綴（audit 逐頁斷言，擋住 v-html 富文字繞過 Vite base 的漏網之魚）
- [x] ✅ 每頁有唯一 `<title>`（非空、跨頁不重複）
- [x] ✅ 每頁有唯一 `<meta name="description">`
- [x] ✅ 每頁有 `<link rel="canonical">`（帶尾斜線、無 query）
- [x] ✅ noindex 掃描乾淨（僅 404 頁有 `noindex, follow`，公開頁皆無）
- [x] ✅ Open Graph（og:title/description/url/type/site_name/locale）與 Twitter 卡（card/title/description）
- [x] ✅ **og:image / twitter:image**：`public/og-default.png`（1200×630）已就位，`site.ogImage` 已啟用
- [x] ✅ JSON-LD：每頁 SoftwareApplication（QR 工具頁）/ WebApplication（`/barcode/` 一維條碼）/ Article（教學文）+ BreadcrumbList；全站一份 Organization（App.vue）
- [x] ✅ 隱私權政策頁存在（`/privacy`；AdSlot 目前停用，仍預留）

## B. 一次性決策（人工確認）

- [x] ✅ 正式網址已拍板：`https://www.pocketool.app/qrcode-studio/`（舊 `qrcode-studio.pocketool.app` 以 Cloudflare Bulk Redirect 301 過來）
- [x] ✅ 子路徑前綴只存在於三處：`vite.config.ts` 的 `base` 與 `build.outDir`、`src/main.ts` 的 router base、`scripts/gen-sitemap.mjs` 的 `BASE`／`dist`。頁面層與 `src/router.ts` 一律不得硬編前綴；CI 也不再用 `SITE_URL` 覆蓋
- [x] ✅ www / 非 www：本站已掛在 `www.pocketool.app` 底下，apex `pocketool.app` 由 zone 層級的 Single Redirect 301 到 www，本站不需另外處理
- [x] ✅ Cloudflare `html_handling: "force-trailing-slash"` 與 canonical 的尾斜線寫法一致
- [x] ✅ 預設分享圖 `public/og-default.png`（1200×630，糖果風）已就位，`site.ogImage` 已設定，og:image / twitter:image / Organization.logo 皆輸出。

## C. 外部平台操作（⚠️ 無法自動化，逐項手動完成）

- [x] ✅ Google Search Console：本站涵蓋於 domain property `sc-domain:pocketool.app`，**不需**另建 property，也**不要**用「網址變更」工具（同一個 domain property 內的 host 變更不適用該工具）
- [ ] ⚠️ GSC：在 `sc-domain:pocketool.app` 提交 `https://www.pocketool.app/qrcode-studio/sitemap.xml`。**等它顯示成功之後**，才移除舊的 `https://qrcode-studio.pocketool.app/sitemap.xml` 提交紀錄
- [ ] ⚠️ GSC：對首頁與各類型核心頁（/wifi/、/url/、/vcard/…）做 URL Inspection → 要求建立索引
- [ ] ⚠️ GA4：2026-09-17 起本站改送站群共用 property（量測 ID `G-4FJ6KE3R2V`，`content_group: 'qrcode-studio'`），舊 property `G-WX9VS8GGBZ` 只留歷史。共用 property 的資料串流網址是 `https://www.pocketool.app`；所有以 hostname 或 page_path 為條件的關鍵事件／目標對象／自訂定義都要改用 `content_group`（`page_path` 由 `/wifi/` 變成 `/qrcode-studio/wifi/`，GA4 不會警告，只會比對到零列）
- [ ] ⚠️ Bing Webmaster Tools：驗證 + 提交 sitemap（可從 GSC 匯入）
- [ ] ⚠️ 外部入口：個人站 / GitHub README / 社群至少放一條連結指向本站（避免孤島）
- [ ] ⚠️ （若日後啟用 AdSense）隱私權政策頁內容齊備、符合 Google 廣告政策

---

### 觀念提醒
- GA / AdSense **不是**加速收錄的管道。真正讓站被收錄的是 **sitemap + GSC 提交 + 可爬的 HTML + 內外鏈**。
- 新站「收不到」最常見原因是被 `noindex`、`robots.txt Disallow` 擋住，或頁面是孤島。A 區與內部連結已顧好。
- 2026 現況：FAQ rich results 已於 2026-05-07 下架，本站已移除 FAQPage schema；FAQ 文字內容保留於首頁 / FAQ 頁 / 各類型頁（利於 UX 與長尾）。

### 重跑檢核
```bash
npm run build && npm run seo:audit
```
