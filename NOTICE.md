# 第三方授權聲明（NOTICE）

本站（QR Code Studio）的圖片解碼功能使用 [zxing-wasm](https://github.com/Sec-ant/zxing-wasm)，
以 WebAssembly 形式在使用者的瀏覽器內執行。WASM 檔由本站自行提供，不從任何第三方 CDN 載入。

## 使用的版本

| 項目 | 值 |
|---|---|
| npm 套件 | `zxing-wasm` 3.1.4（在 `package.json` 精確鎖版） |
| 建置目標 | reader（只含解碼，不含編碼器） |
| WASM 檔 | `zxing_reader.wasm`，953,527 bytes |
| WASM SHA-256 | `e8af31edb56d0522f4de74495839385ef019ba8bc90d38e5ecb2f18795d86fb2` |
| 對應的 zxing-cpp commit | `0b2d9a8fc81f420f369928c24331091ff0525976` |

上表的雜湊、版本與 commit 取自套件自己 export 的 `ZXING_WASM_SHA256`、`ZXING_WASM_VERSION`
與 `ZXING_CPP_COMMIT`，並由自動化測試（`src/utils/zxing-reader.test.ts`）對安裝的二進位檔驗證。

## 授權

zxing-wasm 由多個來源的程式碼組成，各自適用不同授權（依上游 README 的「Licenses」章節）：

- **[zxing-cpp](https://github.com/zxing-cpp/zxing-cpp)**：Apache License, Version 2.0
- **`src/cpp/ZXingWasm.cpp`**（zxing-wasm 的 C++ 繫結層）：Apache License, Version 2.0
- **[zint](https://sourceforge.net/projects/zint/)**：BSD-3-Clause License
- **zxing-wasm 自有的程式碼**：MIT License（Copyright © 2023 Ze-Zheng Wu）

Apache License, Version 2.0 全文：<https://www.apache.org/licenses/LICENSE-2.0>
上游各份授權原文的位置：

- zxing-cpp：<https://github.com/zxing-cpp/zxing-cpp/blob/master/LICENSE>
- ZXingWasm.cpp：<https://github.com/Sec-ant/zxing-wasm/blob/main/src/cpp/LICENSE>
- zint：<https://sourceforge.net/p/zint/code/ci/master/tree/LICENSE>
- zxing-wasm（MIT）：<https://github.com/Sec-ant/zxing-wasm/blob/main/LICENSE>

MIT 授權原文也隨套件一起安裝在 `node_modules/zxing-wasm/LICENSE`。

## 本站自己的一維條碼編碼器

本站 `/barcode/` 的一維條碼是自行實作的（`src/pure/encodeBarcode.ts`），
不使用 zint 或其他第三方編碼器，與上述授權無關。
