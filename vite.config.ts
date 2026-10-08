import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // 掛在 hub 網域的子路徑 www.pocketool.app/qrcode-studio/。
  // build.outDir 一起搬，讓 dist 內檔案路徑與線上 URL 路徑一一對齊，
  // wrangler 的 assets.directory 才能維持 ./dist。
  base: '/qrcode-studio/',
  build: { outDir: 'dist/qrcode-studio' },
  plugins: [vue(), UnoCSS()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  ssgOptions: {
    script: 'async',
    // 不要改回 'minify'：vite-ssg 的 minify 用 html-minifier-terser 的 collapseWhitespace，會削掉文字節點
    // 頭尾的空白（`<label><input> 使用漸層 </label>` 變成「 使用漸層」），client 的 vnode 還留著，
    // hydrate 時每一頁都報 text mismatch。不壓縮每頁 gzip 後只多約 140 bytes。src/hydration.test.ts 會擋。
    formatting: 'none',
    dirStyle: 'nested',
    async includedRoutes(paths) {
      const { guides } = await import('./src/content/guides')
      const dynamic = guides.map((g: { slug: string }) => `/guide/${g.slug}`)
      // /404 由 catch-all 路由渲染 NotFoundPage，build 後由 gen-sitemap.mjs 提升成 dist/404.html
      return [...paths.filter((p: string) => !p.includes(':')), ...dynamic, '/404']
    },
  },
})
