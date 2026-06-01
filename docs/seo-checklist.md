# SEO 上線檢核清單 — QRTool

> 網域：`https://qrcode-studio.pocketool.app`　·　產生日期：2026-06-01
> 標記：✅ 完成　❌ 未完成　⚠️ 需手動（外部平台 / 待補資產，無法由程式驗證）

## A. 技術基礎（程式可驗 — `npm run seo:audit`，目前 73/73 PASS）

- [x] ✅ robots.txt 存在且含 `Sitemap:` 絕對網址
- [x] ✅ sitemap.xml 存在，涵蓋所有公開路由（17 條，build 時自動產生並排除 404）
- [x] ✅ 每頁有唯一 `<title>`（非空、跨頁不重複）
- [x] ✅ 每頁有唯一 `<meta name="description">`
- [x] ✅ 每頁有 `<link rel="canonical">`（帶尾斜線、無 query）
- [x] ✅ noindex 掃描乾淨（僅 404 頁有 `noindex, follow`，公開頁皆無）
- [x] ✅ Open Graph（og:title/description/url/type/site_name/locale）與 Twitter 卡（card/title/description）
- [ ] ⚠️ **og:image / twitter:image**：程式已接好，但 `site.ogImage` 留空、尚無圖檔 → 見 B 區
- [x] ✅ JSON-LD：每頁 SoftwareApplication（工具頁）/ Article（教學文）+ BreadcrumbList；全站一份 Organization（App.vue）
- [x] ✅ 隱私權政策頁存在（`/privacy`；AdSlot 目前停用，仍預留）

## B. 一次性決策（人工確認）

- [x] ✅ 正式網域已拍板：`qrcode-studio.pocketool.app`，Cloudflare 自動憑證（全站 HTTPS）
- [ ] ⚠️ www / 非 www：本站為三級子網域，無 www 變體，免處理（如未來綁裸網域再設 301）
- [x] ✅ Cloudflare `html_handling: "force-trailing-slash"` 與 canonical 的尾斜線寫法一致
- [ ] ⚠️ **預設分享圖 `public/og-default.png`（建議 1200×630）尚未就位**。做好後在 `src/config/site.ts` 把 `ogImage` 設為 `'/og-default.png'`，og:image / twitter:image / Organization.logo 會自動輸出。

## C. 外部平台操作（⚠️ 無法自動化，逐項手動完成）

- [ ] ⚠️ Google Search Console：驗證網站擁有權
- [ ] ⚠️ GSC：提交 `https://qrcode-studio.pocketool.app/sitemap.xml`
- [ ] ⚠️ GSC：對首頁與各類型核心頁（/wifi/、/url/、/vcard/…）做 URL Inspection → 要求建立索引
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
