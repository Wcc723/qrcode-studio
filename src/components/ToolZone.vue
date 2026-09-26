<script setup lang="ts">
/**
 * 工具區（應用程式）：標題、一行副標與工具卡，整條鋪淡薄荷底，下緣一條整寬黑線，
 * 跟下面的說明文章（維持頁面底色、文件樣式）明確分開。
 *
 * 這一塊直接放在 <main> 底下，本來就是整個視窗寬，裡面再用 max-w-screen-lg 收內容；
 * 所以鋪底不需要 100vw（那會把捲軸寬度算進去，造成水平溢出），也不需要 box-shadow 的變通。
 * 頁面不要再把它包進有寬度上限的容器裡。
 *
 * 副標只留一行（30 字以內）；原本標題下那段完整說明移到說明文章的第一段，SEO 內文一個字都不刪。
 */
defineProps<{ lead: string }>()
</script>

<template>
  <section class="tool-zone" data-test="tool-zone">
    <div class="max-w-screen-lg mx-auto px-4">
      <header class="mb-5">
        <h1 class="text-3xl md:text-4xl font-800 text-ink reveal reveal-1"><slot name="title" /></h1>
        <p class="text-muted font-700 mt-2 reveal reveal-2" data-test="tool-lead">{{ lead }}</p>
      </header>
      <div class="reveal reveal-3"><slot /></div>
    </div>
  </section>
</template>
