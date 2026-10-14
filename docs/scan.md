# 圖片解碼（`/scan/`）

`AGENTS.md` 的「圖片解碼（`/scan/`）的四條規則」留規則的重點，這份放做法、原因與測試。

## AGENTS.md 的硬規則

2026-10-15 從 `AGENTS.md` 逐字搬來（#24：`AGENTS.md` 精簡到 20 KB 以下，免得超過 Codex 串接指令的上限）。
`AGENTS.md` 只留摘要與指路，這幾條和它一樣不可違反。

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
  「用這個內容再做一張」用 `src/utils/scan-handoff.ts` 的模組層級變數交棒，取用一次就清掉。
  解碼結果一律以文字節點渲染，**不得用 `v-html` 或 `innerHTML`**：那是別人做的 QR，
  內容完全不可信。`src/scan-gates.test.ts` 會掃原始碼擋下這些出口。

### 黃金解碼測試

黃金解碼測試（`src/utils/zxing-reader.test.ts`）用的圖固定在 `test/fixtures/scan/`，
由 `scripts/fixtures/gen-scan-fixtures.mjs` 以同版 zxing-wasm writer 離線產生，
**不得從網路抓來路不明的測試圖**。測試期間會把 `fetch` 換成會拋錯的版本，
確保解碼真的沒有連網。

### 授權（`NOTICE.md`）

新增 `zxing-wasm` 版本時要一起更新 repo 根目錄的 `NOTICE.md`：那份記的是上游四份授權
（zxing-cpp 與 ZXingWasm.cpp 的 Apache-2.0、zint 的 BSD-3-Clause、zxing-wasm 自有碼的 MIT）
與實際安裝的版本、WASM 雜湊、zxing-cpp commit，站上的對應說明在 `/about/`。
