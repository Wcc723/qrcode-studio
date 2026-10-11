# 下載檔的四周留白（靜區）

`AGENTS.md` 留規則與指路，這份放機制與測試的細節。

QR Code 規格要求四邊各至少 4 個模組寬的空白。qr-code-styling 的 `margin` 單位是**像素**，v1.7.2 以前固定給 8 px，
1000 px 的碼四周只有約 0.3 個模組。v1.7.3 起的做法：

- **依實際模組數算。** `src/pure/qrGeometry.ts` 照規格推版本與每邊模組數（不讀套件的私有欄位 `_qr`），
  `quietZoneGeometry` 取放得下「碼 + 兩側各 4 模組」的最大整數模組，margin 取剩下空間的一半。
  模組是整數像素，所以留白是**至少** 4 個模組：圖片小、內容長時會寬很多（200 px、版本 4 約 8.5 個模組）。
- **外部寬高就是「圖片大小」**，碼縮進留白裡，不放大畫布。預覽框、縮圖與 PNG／SVG／JPG 都吃 `mapToQrOptions`，
  同一份幾何；透明背景時留白也是透明的，提醒只保證放在白色或淺色素面上。
- **放不下就擋。** 連 1 px 的模組都放不下時（滑桿範圍內不會發生）顯示 `SIZE_ERROR`、下載與複製都擋下，不退回固定像素。
- **教學的數字跟著幾何走。** 1000 px 時碼本身約占整張圖的七到九成，版本越高越多（版本 4 的碼是 792 px）。
  `src/content/guide-bodies.ts` 的印刷尺寸表是以碼本身的寬度算的，改了幾何要重算「圖片大小調到多少」那一欄。

## 測試

- `src/pure/qrGeometry.test.ts`：逐版本拿 qrcode-generator 對帳模組數，並照套件畫點的公式驗起點正好等於 margin。
  qrcode-generator 是精確鎖版的 devDependency，版本要跟 qr-code-styling 打包進去的那一份相同；
  升級 qr-code-styling 時先確認它帶的版本，兩邊不同就一起改。
- **產物 oracle** `src/composables/qr-quiet-zone.test.ts`：用真的 qr-code-styling 做出三種檔案（PNG／JPG 由 sharp
  把同一份 SVG 光柵化，sharp 是精確鎖版的 devDependency），從像素量四邊留白，再用自架的 zxing-wasm 解回原本的位元組。
  **擋住留白變窄的是像素量測，不是解碼**：zxing 在完全沒有留白時照樣解得出來，量測那幾行不能當成多餘拿掉。
- 升級 qr-code-styling、換編碼器、改尺寸或留白、加新的下載格式時，這兩份一定要一起綠。happy-dom 的 `<img>` 不會載入，
  有 LOGO 的案例靠 `test/helpers/qr-artifact.ts` 給套件的 `nodeCanvas.loadImage`。
