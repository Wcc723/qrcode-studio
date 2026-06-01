import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/',
  plugins: [vue(), UnoCSS()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    dirStyle: 'nested',
    async includedRoutes(paths) {
      const { guides } = await import('./src/content/guides')
      const dynamic = guides.map((g: { slug: string }) => `/guide/${g.slug}`)
      // /404 由 catch-all 路由渲染 NotFoundPage，build 後由 gen-sitemap.mjs 提升成 dist/404.html
      return [...paths.filter((p: string) => !p.includes(':')), ...dynamic, '/404']
    },
  },
})
