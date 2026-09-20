<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
useSeoHead({ title: `關於 ${site.name}`, description: `${site.name} 是免費、不傳雲端、保護隱私的線上 QR Code 產生器。`, path: '/about' })
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-2xl font-700 text-ink">關於 {{ site.name }}</h1>
    <p class="text-muted mt-4 leading-7">{{ site.name }} 致力於提供乾淨、快速、免費且保護隱私的 QR Code 工具。所有 QR Code 都在你的瀏覽器內生成與解讀，不會上傳至雲端儲存空間，也沒有浮水印。</p>

    <h2 class="text-lg font-700 text-ink mt-7">開放原始碼與第三方授權</h2>
    <p class="text-muted mt-3 leading-7"><RouterLink to="/scan/" class="text-brand underline font-700">QR Code 掃描器</RouterLink>的圖片解碼由 <a href="https://github.com/Sec-ant/zxing-wasm" target="_blank" rel="noopener" class="text-brand underline font-700">zxing-wasm</a> 提供，以 WebAssembly 形式在你的瀏覽器內執行，WASM 檔由本站自行提供、不從第三方 CDN 載入。</p>
    <p class="text-muted mt-3 leading-7">zxing-wasm 由多個來源的程式碼組成，各自適用不同授權：</p>
    <ul class="text-muted mt-2 leading-7 list-disc pl-5">
      <li><a href="https://github.com/zxing-cpp/zxing-cpp" target="_blank" rel="noopener" class="text-brand underline font-700">zxing-cpp</a>：<a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener" class="text-brand underline font-700">Apache License, Version 2.0</a></li>
      <li>zxing-wasm 的 C++ 繫結層 <code>ZXingWasm.cpp</code>：Apache License, Version 2.0</li>
      <li><a href="https://sourceforge.net/projects/zint/" target="_blank" rel="noopener" class="text-brand underline font-700">zint</a>：BSD-3-Clause License</li>
      <li>zxing-wasm 自有的程式碼：MIT License（Copyright © 2023 Ze-Zheng Wu）</li>
    </ul>
    <p class="text-muted mt-3 leading-7">本站 <RouterLink to="/barcode/" class="text-brand underline font-700">一維條碼產生器</RouterLink>的編碼器是自行實作的，不使用上述任何第三方編碼器。完整版本、雜湊與授權出處記在 repo 的 <code>NOTICE.md</code>。</p>
  </article>
</template>
