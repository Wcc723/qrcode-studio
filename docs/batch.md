# 批次產生（`/batch/`）

`AGENTS.md` 留規則的指路，這份放規則本身與測試。

貼上 Excel、每行一筆或連號，一次做成很多張 QR Code 或一維條碼，打包成 ZIP。清單常是財產清冊、會員編號與表單網址，
以下幾件事改錯都不會有錯誤訊息：

- **編碼器與批次邏輯不進 entry chunk。** 路由是 `() => import(...)`；QR 用 `qrcode-generator`（dependency、精確鎖版，
  版本要跟 qr-code-styling 帶的同一份），只在 `src/pure/batch/qrMatrix.ts` import。`seo:audit` 驗 entry chunk 沒有
  QR 與條碼編碼器、ZIP、逐列檢查與 GA 事件的記號。
- **清單與產物只在記憶體。** 不寫網址、Cookie、localStorage、sessionStorage、IndexedDB；ZIP 在瀏覽器裡組好（`src/pure/batch/zip.ts`，
  零相依 STORE、UTF-8 檔名）直接下載。GA 只在 `src/utils/batch-analytics.ts` 送 `batch_download`：筆數級距、碼制、格式三個字面值。
  貼上的內容一律文字節點，預覽用 Vue 直接畫 `<svg>`，不用 `v-html`。`src/batch-gates.test.ts` 掃原始碼；隱私權頁「批次產生」那段跟著改。
- **單次上限 `BATCH_MAX_ROWS`**（`src/pure/batch/rows.ts`，註解有實測數字）。要調高或加更大的圖片大小，先在 Chromium 與 WebKit
  實測 2,000 張 PNG 的時間與 ZIP 大小。
- **靜區與畫法**：見 `docs/quiet-zone.md` 的「批次產生」。PNG 的畫法（`src/pure/raster.ts`）與條碼產生器的單張下載共用。
  `src/pure/batch/readback.test.ts` 把每種碼制的 SVG 與 PNG 用自架的 zxing-wasm 讀回來，改編碼、留白或畫法時要綠。

## 檔案

| 檔案 | 內容 |
|---|---|
| `src/pages/BatchPage.vue` | 頁面、說明文章與常見問題（FAQ 只做看得到的文字，不輸出 FAQPage） |
| `src/components/batch/` | 工具卡（`BatchTool.vue`）、膠囊單選、預覽格 |
| `src/composables/useBatch.ts` | 狀態與推導：三種輸入、範本、逐列檢查、檔名、預覽、匯出 |
| `src/pure/batch/` | 純函式：貼上解析（`table.ts`）、連號（`sequence.ts`）、範本與網址轉碼（`template.ts`）、逐列檢查與檔名（`rows.ts`、`filename.ts`）、QR 模組矩陣（`qrMatrix.ts`）、每張的檔案內容（`artifact.ts`）、ZIP（`zip.ts`） |
| `src/utils/batch-export.ts` | 分批產生、進度、取消，組成 ZIP 的 Blob |
| `src/utils/batch-analytics.ts` | 唯一可以送 GA 的地方 |
| `test/helpers/zip.ts` | 測試用的 ZIP 讀取器（照 APPNOTE 逐筆對照 local header 與中央目錄） |
