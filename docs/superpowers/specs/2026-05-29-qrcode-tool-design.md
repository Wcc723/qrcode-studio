# QR Code 工具 — 設計規格

- 日期：2026-05-29
- 狀態：設計定案（待使用者最終確認 → 進入實作計畫）
- 一句話定位：**純前端、保護隱私、永久免費、無浮水印、現代化且 SEO 友善的繁中 QR Code 產生器**

---

## 1. 背景與目標

### 三大目標
1. **良好 SEO，促進流量**
2. **介面好用、易於操作**
3. **改進現有 QR 工具的缺點**

### 研究發現（Ubersuggest + 競品分析，台灣 Google）
- 主關鍵字「**qr code 產生器**」月搜尋量 **40,500**、SEO 難度僅 **28**、競爭度 0.09（低）。
- 「qr code with image」3,600/月、難度僅 6；「qr code ai」1,300/月、難度 13——皆為易切入長尾。
- SERP 第一頁出現多個 **網域權重 (DA) 僅 9～13 的小站**（qrcode-generator.tw、34qr.com、barcodeocean.com）→ 證明**新網域 + GitHub Pages 也能擠進第一頁**，只要頁面快、結構好、純工具導向。
- 龍頭 **QuickMark**（DA 51）拿走約 13,000 點擊/月，但工具老舊（ASP）、無顏色/LOGO/形狀客製、無即時預覽、行動體驗差、術語外露 → 這就是切入點。

### 現有工具共通缺點（我們要改進的）
1. 介面老舊、行動體驗差。
2. 視覺客製化弱（無顏色/LOGO/即時預覽）。
3. 高解析、SVG 常被鎖在付費牆或加浮水印。
4. 隱私疑慮：多數工具把資料送後端處理。
5. 動態 QR 陷阱：免費生成的動態 QR 日後常失效或被收費。
6. 繁中市場缺乏「優質工具 + 優質內容」兼具者。

---

## 2. 範圍決策（已與使用者確認）

| 項目 | 決策 | 理由 |
|---|---|---|
| 靜態 / 動態 | **純靜態 QR** | 零後端、零維運、最佳隱私，完美符合 GitHub Pages |
| 內容類型 | **常用型**：網址、純文字、WiFi、vCard 名片、Email、電話、SMS | 涵蓋 ~90% 需求，每型可做獨立 SEO 頁 |
| 客製化深度 | **進階**：顏色、漸層、LOGO、容錯、尺寸 + 即時預覽 | 打贏 QuickMark 的關鍵差異；點陣/邊角形狀留待未來 |
| 變現 | **免費工具 + 預留 AdSense 廣告版位** | 先衝流量與口碑，版面預留不擾人的廣告區 |
| 語言 | **繁中 (zh-TW) 優先**，架構保留 i18n 彈性 | 主戰場是繁中 40,500/月；英文版未來再加 |
| 網域 | **自訂網域**（指向 GitHub Pages） | SEO 加分、可品牌化；SERP 證明精準網域有效 |
| 視覺風格 | **A · 專業可信藍**（靛藍 #4f46e5、大量留白、圓角、柔和陰影） | 信任感與轉換率最佳，廣告易融入 |
| 主工具版面 | **A · 雙欄分割**（輸入左 / sticky 即時預覽右），手機自動堆疊單欄 | 桌機效率與轉換最佳 |

### 明確不做（YAGNI）
- 動態 QR、掃描次數追蹤、帳號系統（需後端）。
- 點陣 / 邊角形狀客製（v1 不做，函式庫已支援，未來可一鍵加）。
- 批次產生（未來可評估）。
- 英文 i18n 內容（v1 架構保留、不啟用）。

---

## 3. 技術架構

### 技術選型
- **建置**：Vite + Vue 3（`<script setup>` Composition API）
- **SSG**：`vite-ssg`（antfu）— 建置時把每條 Vue Router 路由預渲染為靜態 HTML；最適合「互動工具 + SEO 內容頁」混合，且工具與 landing pages 共用元件。
  - 替代方案評估：VitePress（偏文件站、嵌入複雜互動工具彆扭）、Nuxt SSG（功能全但對純靜態工具偏重）。
- **路由**：Vue Router
- **QR 引擎**：`qr-code-styling` — 純前端，支援顏色/漸層/LOGO/（未來）點陣形狀，輸出 PNG/SVG。**零後端、零上傳**，直接坐實隱私訴求。
- **樣式**：UnoCSS（原子化、體積極小、載入快，有利 CWV/SEO）
- **Head/SEO**：`@unhead/vue`（vite-ssg 內建）— 每頁 title/description/OG/canonical/JSON-LD/hreflang
- **i18n**：vue-i18n（v1 僅啟用 zh-TW，路由保留語言段彈性）
- **廣告**：`<AdSlot>` 元件預留版位，上線有流量後申請 AdSense 審核再啟用
- **部署**：GitHub Actions → `vite-ssg build` → GitHub Pages；`CNAME` 指向自訂網域

### 資料流（全程瀏覽器內，無任何網路請求）
```
使用者輸入 → Vue reactive state → debounce(~150ms)
  → payload builder（純函式，依類型組字串）
  → useQrCode（qr-code-styling 即時渲染到 sticky 預覽）
  → 按下載 → 匯出 PNG / SVG / JPG 到本機
```

---

## 4. 網站結構與 SEO 佈局

### 頁面地圖
```
/                         首頁 · 主工具（鎖定「qr code 產生器」40,500/月）
/url                      網址 QR Code
/wifi                     WiFi QR Code
/vcard                    電子名片 vCard QR Code
/text                     純文字 QR Code
/email                    Email QR Code
/phone                    電話 QR Code
/sms                      簡訊 SMS QR Code
/guide/what-is-qr-code    什麼是 QR Code？（長尾資訊型）
/guide/error-correction   容錯等級怎麼選？
/guide/qr-with-logo       如何加入 LOGO
/about  /privacy  /faq    信任 / 合規頁
```

### SEO 策略
- **類型 landing page = SEO 放大器**：每頁 = 同一個 `GeneratorTool`（預選好類型）+ 該類型專屬介紹/使用步驟/FAQ。把一個關鍵字放大成一整串。
- **內容/教學**：攻長尾、建立 E-E-A-T 權威、內鏈導回工具。
- **每頁技術 SEO**：唯一 title/description/OG 圖、canonical、`sitemap.xml`、`robots.txt`、hreflang（保留英文）。
- **結構化資料 JSON-LD**：`SoftwareApplication`、`FAQPage`、`BreadcrumbList`。
- **隱私頁**強調「不上傳、瀏覽器內生成」作為信任訊號與差異化。

---

## 5. 功能規格

### QR 內容類型
| 類型 | 輸入欄位 | 產生格式 |
|---|---|---|
| 網址 | URL（自動補 https、驗證） | 純 URL |
| 純文字 | 多行文字 | 原文 |
| WiFi | SSID、密碼、加密(WPA/WEP/無)、隱藏網路 | `WIFI:T:WPA;S:<ssid>;P:<pwd>;H:<bool>;;` |
| vCard | 姓名、電話、Email、公司、職稱、地址、網站 | vCard 3.0 |
| Email | 收件者、主旨、內文 | `mailto:?subject=&body=` |
| 電話 | 號碼 | `tel:` |
| SMS | 號碼、訊息 | `SMSTO:<number>:<message>` |

### 客製化（進階級）
- 前景色 / 背景色（含透明背景）
- 漸層（線性／放射、雙色）
- 加入 LOGO（上傳圖片、調大小、自動留白）→ 上傳時自動把容錯升至 H 確保可掃
- 容錯等級 L/M/Q/H（附白話說明，不對使用者丟術語）
- 尺寸、邊距

### 輸出（差異化：全部免費、無浮水印）
- PNG（可選解析度，最高 ~2000px）
- SVG（向量、無限放大）
- JPG
- 一鍵複製到剪貼簿

### UX 細節
- 類型分頁列於上方（網址/WiFi/名片/文字/Email/電話/SMS）。
- 即時預覽，debounce 避免閃爍。
- 「🔒 不上傳・瀏覽器內生成」信任徽章常駐。
- 空輸入 → 顯示占位 QR、下載鍵停用。
- 輸入過長超出 QR 容量 → 友善提示。
- LOGO 上傳格式/大小錯誤 → 友善提示。
- 手機：堆疊單欄，預覽以 sticky 或輸入後呈現。

---

## 6. 元件架構（高內聚、可獨立測試）

```
src/
  pure/                      純函式 payload 建構（好單元測試）
    buildUrl.ts  buildWifi.ts  buildVCard.ts  buildEmail.ts
    buildPhone.ts  buildSms.ts  buildText.ts
  composables/
    useQrCode.ts             包 qr-code-styling，吃 reactive 設定 → 渲染/匯出
  components/
    GeneratorTool.vue        組合工具（props: defaultType）；首頁與每個 landing 共用
    QrTypeTabs.vue
    inputs/UrlInput.vue WifiInput.vue VCardInput.vue EmailInput.vue PhoneInput.vue SmsInput.vue TextInput.vue
    StylePanel.vue           顏色/漸層/LOGO/容錯/尺寸
    QrPreview.vue            sticky 即時預覽
    DownloadBar.vue          PNG/SVG/JPG/複製
    AdSlot.vue               廣告版位（預留）
    SeoContent.vue           landing 內容區塊
  layouts/DefaultLayout.vue  header / footer / nav
  pages/                     路由頁（首頁、各類型、guide、about/privacy/faq）
```
**關鍵隔離**：`pure/` payload 建構（純字串邏輯）與 `useQrCode`（渲染）和 UI 完全解耦。每個輸入面板只負責自己的欄位並 emit payload 字串。Landing page 只是帶不同 `defaultType` 並重用 `GeneratorTool`。

---

## 7. 測試策略

- **單元測試**：`pure/` 各 payload 建構函式（WiFi/vCard/SMS/Email 格式正確性）— 純函式，TDD 友善。
- **元件測試**：各輸入面板 emit 正確 payload；StylePanel 設定正確映射到 useQrCode 選項。
- **建置 smoke test**：每條路由產出靜態 HTML，且 title/description/canonical/JSON-LD 正確。
- **手動驗證**：用手機相機實際掃描各類型 QR（含含 LOGO、高容錯）確認可讀。

---

## 8. 效能與部署

### 效能 / 技術 SEO
- 預渲染 HTML → FCP/LCP 快、Core Web Vitals 佳（目標 Lighthouse ≥ 95）。
- UnoCSS 最小 CSS；QR 函式庫適度 code-split。
- 建置自動產生 `sitemap.xml` + `robots.txt`。
- 每頁獨立 OG 圖、canonical、hreflang。

### 部署
- GitHub Actions：`install → vite-ssg build → upload artifact → deploy Pages`。
- `public/CNAME` 指向自訂網域；base path 設為根目錄。

---

## 9. 風險與注意事項

- **AdSense 審核**：需先有實質流量與內容才易通過；版位先預留、暫不啟用。
- **含 LOGO 可掃性**：務必自動升容錯至 H 並限制 LOGO 覆蓋比例，實機掃描驗證。
- **自訂網域 DNS / CNAME**：部署前需設定 DNS 與 GitHub Pages 自訂網域、強制 HTTPS。
- **i18n 預留 vs 過度設計**：v1 只開 zh-TW，避免為未啟用的英文版增加複雜度。

---

## 10. v1 完成定義 (Definition of Done)

1. 7 種類型皆可在瀏覽器即時產生並下載 PNG/SVG（實機掃描可讀）。
2. 顏色/漸層/LOGO/容錯/尺寸客製可用且即時預覽。
3. 首頁 + 7 個類型 landing page + 基礎內容頁皆預渲染為靜態 HTML，meta/JSON-LD 正確。
4. 雙欄分割版面 + 專業可信藍視覺，手機 RWD 正常。
5. GitHub Actions 自動部署到 GitHub Pages + 自訂網域，Lighthouse ≥ 95。
6. payload 建構函式單元測試全綠。
