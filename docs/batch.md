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
- **Code 39 的 $ / + % 一律提醒，不擋下載。** 掃描器會把它們跟下一個字合起來讀（`A/B` 讀成 `A"`），批次一次印幾百張，
  不講就是整批讀錯。判斷用 `src/pure/validateBarcode.ts` 的 `CODE39_SHIFT_CHARS`，條碼產生器與批次共用；提醒在「檢查結果」
  （`data-test="batch-code39-shift"`），`helpNotes.test.ts` 鎖它看得到，`readback.test.ts` 鎖讀回值真的會變。
- **靜區與畫法**：見 `docs/quiet-zone.md` 的「批次產生」。PNG 的畫法（`src/pure/raster.ts`）與條碼產生器的單張下載共用。
  `src/pure/batch/readback.test.ts` 把每種碼制的 SVG 與 PNG 用自架的 zxing-wasm 讀回來，改編碼、留白或畫法時要綠。

## 印成 A4 標籤紙

批次頁的第二種輸出（「輸出方式」選「印成 A4 標籤紙」）：清單排在台灣常見的 A4 標籤紙上，用瀏覽器列印。
只做 `@page` 加 `window.print()`，**不產生 PDF 檔，不引入 PDF 或截圖轉檔的套件**（使用者要 PDF 就在列印視窗另存）。
以下幾件事改錯都不會有錯誤訊息，只會印歪、印到紙邊外，或印出掃不到的標籤：

- **毫米數字只在 `src/pure/batch/paper.ts`**：紙張、印表機印不到的紙邊（5 mm）、每格內距、字級、一維條碼與 QR Code 的最小尺寸、
  位移範圍、校正尺、對位測試頁。元件用常數與 `mm()` 組 CSS，不寫 `12mm`、`mm(12)` 這種字面值（`src/batch-gates.test.ts` 掃）。
- **型號資料是純資料**（`src/pure/batch/labelSheets.ts`）：品牌＋型號，每筆單格寬高、上與左邊界、欄距列距、是否全版切割、範本代碼。
  數字是鶴屋、龍德官網 Word 範本的版面設定（不是實測），同格數的型號邊界會差到 2 mm，所以一律做到型號。橫向範本（例如鶴屋 C59105）
  已換算成直向；右邊界與下邊界用紙的寬高反推。新增或修改型號時 `labelSheets.test.ts` 要綠：每格都在 A4 裡、左右邊界相差 1 mm 以內、
  下邊界寫進對照表（數字一變就紅，要對照範本確認）。
- **格子照型號的絕對位置定位**（`labelLayout.ts`），不是平均排滿整張紙：從第 N 格開始只影響第一張，每筆 N 份連續排、跨頁從第 1 格接著排，
  X／Y 位移平移每一格（對位測試頁的格線也是）。單次最多 `LABEL_MAX_CELLS` 格（含留白的格子與份數），2,000 格在桌機 Chromium
  與 WebKit 約 4 秒排好；要調高先在兩邊實測。
- **每格的排法**（`labelContent.ts`）：QR Code 依格子形狀決定字放右邊或下面（只看形狀，同一張紙每格一致），一維條碼在上、
  號碼與字在下。字依長度縮小，最小 6 pt，再放不下就截斷補「…」，畫面上列出是哪幾列。
- **放不下能掃的大小就擋下**：一維條碼最細的線（窄條）低於下限（EAN 標準尺寸的 80%、Code 128 與 Code 39 0.19 mm、ITF-14 0.264 mm）、
  條高低於 5 mm、QR Code 小方塊低於 0.2 mm 時停用「列印標籤」並說明原因，那幾格的碼與字也不畫進列印區（用 Ctrl＋P 繞過按鈕也印不出來，
  螢幕上標出原因）；偏細（Code 128 低於 0.25 mm、ITF-14 低於 0.495 mm、QR Code 低於 0.3 mm）只提醒。對位測試頁不受影響。
- **全版切割與貼著紙邊的型號**：最外圈的格子，碼與字縮進離紙邊 5 mm 以內（預設開，關掉時改成提醒）。
- **列印 CSS**（`src/components/batch/LabelSheets.vue` 的 `<style>`）：`@media print` 只留列印區（`:has()` 保留祖先、其他元素
  `display: none`），每張紙 210 × 296.5 mm（扣 0.5 mm 免得多印一張白紙）、`break-after: page`。`@page { size: A4; margin: 0; }`
  不寫在 CSS 裡，列印區掛載時才加進 `<head>`、卸載就拿掉，其他頁照一般網頁列印（`seo:audit` 驗 CSS 沒有 `@page`）。
  螢幕預覽的縮放用 CSS `zoom`，只寫在 `@media screen`；螢幕上只畫前 3 張，其他張在列印時才出現。
- **碼是向量 SVG**（viewBox 以模組為單位、寬高寫 mm，跟批次下載的 SVG 同一份路徑），字是系統字型（微軟正黑體、標楷體、新細明體，
  掛載後用 canvas 量字寬、偵測這台電腦有沒有選的字型）。
- **隱私**：清單一樣只在記憶體。唯一的例外是使用者勾選「記住這台印表機的位移」時，`src/utils/batch-label-offset.ts` 在 localStorage
  存 `{"x":數字,"y":數字}`，取消勾選就刪掉；批次的檔案只有它能碰儲存空間（`batch-gates.test.ts` 驗）。按「列印標籤」時送一次
  `batch_download`，輸出方式是 `label`，不送型號、起始格、份數或位移；對位測試頁不送。隱私權頁「批次產生」那段跟著改。
- **驗收**：`labelReadback.test.ts` 照標籤的實際大小以 300 dpi 光柵化，再用自架的 zxing-wasm 讀回；瀏覽器列印模式量 DOM（每頁 210 mm 寬、
  抽樣型號的格子左上角跟資料相差 0.1 mm 以內、頁數等於按鈕上的張數）與截圖回讀在 Chromium 與 WebKit 跑。實體印表機的對位與縮放
  agent 驗不到，上線前照 `docs/label-print-acceptance.md` 實機印。

## 檔案

| 檔案 | 內容 |
|---|---|
| `src/pages/BatchPage.vue` | 頁面、說明文章與常見問題（FAQ 只做看得到的文字，不輸出 FAQPage） |
| `src/components/batch/` | 工具卡（`BatchTool.vue`）、膠囊單選、預覽格；標籤紙的設定（`LabelPrint.vue`）、A4 預覽與列印區（`LabelSheets.vue`）、校正尺 |
| `src/composables/useBatch.ts` | 狀態與推導：三種輸入、範本、逐列檢查、檔名、預覽、匯出、輸出方式 |
| `src/composables/useBatchLabels.ts` | 標籤紙的狀態：型號或自訂、起始格、份數、每格的字、字型、內縮、位移、排好的每一頁、提醒與擋下的原因、列印 |
| `src/pure/batch/` | 純函式：貼上解析（`table.ts`）、連號（`sequence.ts`）、範本與網址轉碼（`template.ts`）、逐列檢查與檔名（`rows.ts`、`filename.ts`）、QR 模組矩陣（`qrMatrix.ts`）、每張的檔案內容（`artifact.ts`）、ZIP（`zip.ts`）；標籤紙的規格（`paper.ts`）、型號（`labelSheets.ts`）、排版（`labelLayout.ts`）、每格的碼與字（`labelContent.ts`）、系統字型（`printFonts.ts`） |
| `src/utils/batch-export.ts` | 分批產生、進度、取消，組成 ZIP 的 Blob |
| `src/utils/batch-analytics.ts` | 唯一可以送 GA 的地方 |
| `src/utils/batch-label-offset.ts` | 「記住這台印表機的位移」：唯一可以碰儲存空間的批次檔案，只存兩個數字 |
| `test/helpers/zip.ts` | 測試用的 ZIP 讀取器（照 APPNOTE 逐筆對照 local header 與中央目錄） |
| `docs/label-print-acceptance.md` | 標籤紙的實機列印驗收清單（Windows 的 Edge 與 Chrome） |
