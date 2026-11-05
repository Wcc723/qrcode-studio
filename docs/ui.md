# 工具區、說明與用字

`AGENTS.md` 的「工具區與說明文章」與「用字：白話優先」留規則的重點，這份放各條的全文：class 名、樣式、例子、詞表與測試。

2026-10-15 從 `AGENTS.md` 逐字搬來（#24：`AGENTS.md` 精簡到 20 KB 以下，免得超過 Codex 串接指令的上限）。
`AGENTS.md` 只留摘要與指路，這裡的每一條和它一樣不可違反。文中的「產品名與站徽」指 `AGENTS.md` 那一節（全文在 `docs/brand/README.md`「AGENTS.md 的硬規則」）。

## 工具區與說明文章

工具頁（首頁、7 個類型頁、`/scan/`、`/barcode/`、`/batch/`）分成上下兩塊，一眼要分得出哪裡是應用程式、哪裡是說明：

- **工具區**（`src/components/ToolZone.vue`）：標題區、一行副標、工具卡，整條鋪暖杏色底（`uno.config.ts` 的 `zone`，`#fff4e6`），
  下緣一條整寬細線（`line`）。它直接放在 `<main>` 底下，本來就是整個視窗寬；**不要包進有寬度上限的容器，
  也不要改用 `100vw`**（會把捲軸寬度算進去，造成水平溢出）。
  - 標題區兩種（2026-11 改版）：首頁傳 `hero`（右邊水彩橫幅 `.zone-hero`、小標籤、h1、副標、三個打勾，工具卡用 `.zone-overlap` 往上疊進橫幅），
    其他工具頁傳 `crumbs`（看得到的導覽路徑，最後一項是這一頁、`aria-current="page"`）、`art`（h1 左邊的圓底插圖）與 `deco`（右邊的裝飾，640px 以下不顯示）。
    英文頁的小標籤、打勾與導覽路徑的字由英文頁自己傳進去，不寫在元件裡（英文字串不進 entry chunk）。
  - 工具卡的區塊編號用 `.step-dot`（橘色圓底數字，`aria-hidden`），後面接 `.zone-label` 段落。
- **說明文章**（`SeoContent.vue` 與各頁的 `<article data-test="doc">`）：維持頁面底色；段落閱讀寬度 720px（`.doc-p`），
  卡片列與圖可以寬到內容寬（`max-w-screen-lg`）。文件樣式在 `main.css`：`.doc-h2`（h2 加虛線底與右邊的裝飾插圖）、
  `.doc-card`（有插圖的細框連結卡）、`.doc-steps-art`（步驟配圖）、`.doc-figure`（概念圖與圖說）、`.doc-faq`、`.doc-links`、`.doc-chips`。
- **卡片一律細框**（2026-11 改版前是粗黑框加硬陰影）：工具卡用 `card`（1px `line` 框、20px 圓角、柔和的暖色陰影），
  可點的小卡用 `sticker`，文章裡用 `.doc-card`。**不要再加粗黑框或位移的硬陰影**，那是改版前的風格。
  工具卡要比文章卡片醒目，靠的是陰影與暖杏色底，不是框線粗細。
- **按鈕**：同一個畫面只有一個主要動作用實心的 `btn-primary`（產生器與條碼的 PNG、掃描器的選擇圖片、
  批次的下載 ZIP 或列印標籤、掃描結果的「用這個內容再做一張」），
  其他動作用 `btn-secondary`（白底細框）。不要再用 `!bg-pop-*` 把按鈕染成糖果色。
- **副標只留一行**（30 字以內，類型頁在 `qr-types.ts` 的 `lead`）。原本標題下那段完整說明放在說明文章
  第一段（`data-test="doc-lead"`；首頁與 `/url/` 以外的類型頁 2026-11 刪了，見下一條）。SEO 內文可以移出工具區。
- **說明文章的字**（2026-11-05 站長裁示，放寬原本的「一個字都不能刪」）：h1／h2／h3 大綱與每頁獨有的資訊（規格、步驟、
  使用情境、法規與安全說明）不刪；跨段重複的套話可以刪。這一輪刪了首頁與類型頁開頭的引言：它跟緊接的段落講同一批賣點
  （免費、不傳雲端、LOGO、PNG／SVG、不過期）。首頁引言裡只有它有的「QRCode」寫法併進下面第一段；類型頁的引言就是
  meta description，`<head>` 裡照留。**`/url/` 的引言照留**，那一頁的文章字句先不動。`seo:audit` 對帳留下來的關鍵句
  （`MOVED`：首頁三句、類型頁「關於」那段的第一句、`/url/` 加 meta description）仍在預渲染 HTML 的說明文章裡、不在工具區；
  改這些句子時要跟著改 `MOVED`。
- **手機（640px 以下）的文章卡片要緊湊**（2026-11-05 站長裁示：卡片一張一行堆得太長），插圖保留、縮小：
  首頁三步驟排三欄小卡、類型卡兩欄（`.type-card`：小插圖在標題左邊、說明句在下面整列）、教學卡縮圖 48px；
  類型頁的使用步驟與延伸閱讀插圖縮小、「其他類型與工具」（`.doc-chips`）排兩欄，每個連結仍至少 44px 高。
- **收起來的說明**用 `<details>`，字都在預渲染 HTML 裡（Google 的垃圾內容政策與行動版優先索引都接受手風琴裡的內容）：
  首頁教學卡所有寬度只露前三篇，其他收進「展開其他幾篇教學」（`.more-fold`）；批次頁「印成 A4 標籤紙」那段留 h2 與第一段，
  型號清單與「印之前先對位」收進 `.doc-fold`，在工具區選了「印成 A4 標籤紙」就打開（`BatchTool` 送 `output-change`，
  狀態來自輸出方式的 `v-model`，不讀瀏覽器狀態），英文批次頁同樣做法。收進去的段落 h2／h3 大綱不變。
- 「輸入內容」「外觀」「預覽與下載」「使用說明」這類區塊標示用 `.zone-label` 段落，**不是標題**：
  各頁的 h1／h2／h3 大綱不因為分區而改變。
- `main.css` 開頭有最小框線 reset（所有元素 `border-width: 0; border-style: solid`），UnoCSS 的
  `border-2` 這類 class 才畫得出框線；`html`、`body` 的 `overflow-x` 用 `clip`，**不要改回 `hidden`**：
  那會讓 body 變成捲動容器，預覽框的 `sticky` 就黏不住。`src/styles/main-css.test.ts` 鎖著這兩條。

### 頁尾本站專屬區：手機收合

2026-11-05 站長裁示（手機頁尾太長）：`DefaultLayout.vue` 傳給共用頁尾的本站專屬區（`.ptf__local`），
各欄在 768px 以下收合成可展開的標題，桌機一律展開。共用頁尾本身不動。

- 每欄是 `src/components/FootFold.vue`，寫法照 WAI-ARIA 的手風琴：手機的 h2 裡放一顆按鈕（`aria-expanded`、`aria-controls`），
  清單用 `v-show` 收起。不用 `<details>`：h2 放在 `<summary>` 裡，部分報讀器會把它當成按鈕的一部分，標題清單裡就找不到；
  桌機也不該有一顆按了沒反應的按鈕。按鈕（`.foot-toggle`）至少 48px 高、字 16px，符合頁尾「每個連結至少 44px、字 16px 以上」。
- **預渲染與桌機是純標題加清單**，爬蟲與還沒跑 JS 的人看得到全部連結；掛載後才用 `matchMedia('(min-width: 768px)')`
  決定要不要換成按鈕並收起，寬度變了跟著變（hydrate 規則：瀏覽器狀態只在 `onMounted` 之後讀）。
  掛載後才收起會不會造成版面位移：2026-11-05 在 400px 量過 404（頁尾在第一個畫面裡）、關於、隱私權、常見問題，CLS 都是 0。
- **「回報問題」與隱私那一行放在收合區外面**，一直看得到：繁中的「關於」欄把回報問題放在 `FootFold` 的 `after` slot（收起來的清單後面另一個清單）；
  英文的 About 只有兩個連結，整欄不收合。

### 工具裡的說明：「?」與一律看得到的提示

- **收進欄名旁的「?」**（`src/components/HelpTip.vue`）：只收「長、而且不看也能把欄位填完」的說明，
  例如容錯等級的百分比、LOGO 的大小限制、尺寸換算、條碼類型的用途、掃描的檔案上限。
  收起時用 `hidden`，文字仍在預渲染 HTML 裡；欄位要用 `aria-describedby` 指到說明框的 id。
  「?」不放進 `legend` 或 `<label>` 裡：欄名用 `<label for>`（或 `aria-hidden` 的欄名配 sr-only 的 legend），按鈕接在右邊。
- **一律看得到**：錯誤（容量超過、條碼格式與檢查碼）、條件式提醒（勾透明時 JPG 改白底）、
  填寫規則（`symbologies.ts` 的 `rule`：位數、可用字元、檢查碼）、列印尺寸與 PNG 像素數、
  掃描到非 http(s) 的警告、多個條碼與讀不到的指引。收起來只會讓工具更難用。
- **掃描結果的警告只給認不出類型的內容**：WiFi、電子名片、Email、電話、簡訊這些認得出類型的（`parsed.kind`），
  不寫「網址開頭」、不出警告，改成一句中性說明（例如「這是 WiFi 設定，不是網址，本站不會自動連線」，
  寫在 `ScanResultView.vue` 的 `kindNotes`）；認不出類型、開頭又不是 http／https 的（`javascript:`、`data:`、`file:`、
  半殘的 `WIFI:`、一維碼）照舊警告，不要放寬。`ScanResultView.test.ts` 兩邊都鎖。
- **隱私只說一次**：工具卡頂部一行（`PrivacyNote.vue`），完整說明與隱私權政策連結收在它的「?」；
  預覽框與標題上不要再加「不傳雲端」貼紙（頁尾那行保留）。
- `src/helpNotes.test.ts` 兩個方向都鎖：每個「?」預設收起、欄位指得到它、裡面沒有可填欄位；
  上面「一律看得到」的每一項都不在收起來的容器裡。

### 圖示：不用 emoji

- 畫面上不用 emoji，圖示一律用 Lucide（`@iconify-json/lucide`，devDependency），寫成 UnoCSS 的
  `i-lucide-<名稱>` class，建置時轉成 CSS，顏色跟著 `currentColor`。`presetIcons` **不得設 `cdn`、
  不得開 `autoInstall`**：瀏覽器執行時不向任何第三方取圖。
- 圖示一律 `aria-hidden="true"`；只有圖示的按鈕要補文字（例如 sr-only 的「下載」）。
  需要顏色時放進圓底徽章（`uno.config.ts` 的 `icon-badge`、`icon-badge-sm`、`icon-badge-lg`，底色加 `bg-pop-*`；
  2026-11 起 `pop-*` 是淡色，徽章沒有框線）。
- 標題（h1／h2／h3）裡不放圖示或 emoji。`⌘` 是按鍵上的字，要包在 `<kbd>` 裡。
- UnoCSS 預設不掃一般的 `.ts`，所以 `uno.config.ts` 另外把 `src/config/*.ts` 加進掃描範圍（類型圖示寫在
  `qr-types.ts` 的 `icon`）。圖示 class 放在其他 `.ts` 檔時，要一起加進去。
- `src/no-emoji.test.ts` 掃元件、設定與教學本文（`©`、`™`、`®` 例外，測試檔不掃）；`seo:audit` 驗
  各頁內容沒有 emoji、用到的 `i-lucide-*` 在 CSS 裡都有規則（圖示集沒裝時 class 會靜默失效）、
  產物沒有連到線上圖示服務。新增圖示時 `NOTICE.md` 不必改，Lucide 的授權已經寫在那裡。

### 裝飾插圖（2026-11 改版）

- 插圖是 `public/img/` 的 WebP（首頁水彩橫幅、WiFi 概念圖、類型與工具的軟陶圖示、教學縮圖、三步驟圖、裝飾小物），
  用 Codex 生圖產生，原檔與配方放在口袋工具 workspace，不放這個 repo。
- **插圖是裝飾，不取代介面圖示**：分頁、按鈕、「?」仍是 Lucide。插圖一律 `alt=""`，只有說明文章裡帶圖說的概念圖
  （`.doc-figure`）寫替代文字。h1／h2／h3 裡不放插圖（`.doc-h2` 的插圖在 h2 外面）。
- 網址一律用 `import.meta.env.BASE_URL` 組（`ToolZone.vue` 的 `img()`）；`qr-types.ts` 的 `body` 裡寫 `/img/...`，
  由 `withBase()` 補前綴。`seo:audit` 擋沒有 `/qrcode-studio/` 前綴的 `src`。
- 首屏的橫幅與標題區小圖不延遲載入（橫幅加 `fetchpriority="high"`），首屏以下的一律 `loading="lazy" decoding="async"`，
  並寫上 `width`、`height` 免得版面跳動。
- 字型用系統字，不載 webfont。

## 用字：白話優先

站長的要求是減少使用者的學習負擔，2026-09-30 全站照這幾條改過一次（#7）：

- **白話在前，原詞放括號**：先寫使用者聽得懂的說法；要讓人對得上外面看到的名稱時，原詞放括號或收進「?」。
  例如「耐髒程度（容錯等級）」「四周留白（靜區）」「小方塊（模組）」「淺色方塊配深色背景（反白）」。
- **使用者在別處真的會看到的名稱照寫，每頁第一次出現就白話解釋**：PNG、SVG、JPG、WebP、EAN-13、Code 128、DPI、
  WPA/WPA2、vCard、檢查碼。
- **只有工程師懂的詞，工具區不用**：通訊協定、網站主機、符號學、演算法、算圖、碼字、位元組、UTF-8、ASCII、
  WebAssembly、編碼器。說明文章裡也改白話，真的需要時才放括號。台灣用語：「半角」一律寫「半形」。
- **欄名改了，提到它的地方一起改**：教學與常見問題裡的「圖片大小」滑桿、「耐髒程度（容錯等級）」選單、「方塊顏色」。
- **不跟著文案改的**：網址；下拉選單與勾選框的 `value`（L／M／Q／H、WPA／WEP／nopass、PNG 清晰度的 scale），
  產出的內容不能變；類型頁、首頁、`/scan/`、`/barcode/` 的 meta description 與 `seo:audit` 對帳的關鍵句。
  title 與 H1 要改時另外處理：改之前把改前的 title 與 28 天基線記進 `docs/seo-checklist.md` 的「標題改動紀錄」，
  分享圖與替代文字一起改（見「產品名與站徽」）。
- **關於頁的授權段落與隱私權頁準確性優先**：原詞保留，只在前面補白話。`seo:audit` 要求隱私權頁有 WebAssembly、
  localStorage，關於頁有 zxing-wasm、Apache License、BSD-3-Clause。
- 教學只調整用字時 `updated` 不動（sitemap 的 `<lastmod>` 不跟著變），示意圖、圖說與替代文字不重產。
- `src/plain-words.test.ts` 掃元件、設定、composable、純函式、版面與頁面（關於、隱私權除外；註解不算），
  出現通訊協定、網站主機、符號學、演算法、算圖、半角、前景色、可列印的 ASCII、第一版就紅。要再擋新的詞，加在那裡。
