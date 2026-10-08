/**
 * 整頁載入時要不要 hydrate（沿用預渲染的 DOM，只掛上事件與狀態）。
 *
 * vite-ssg 的 client 預設不 hydrate（`ViteSSG` 第 4 個參數的 `hydration` 預設 false）：它用 `createApp`
 * 把 #app 整個清掉重畫。畫出來跟原本一樣、肉眼看不出來，但多做一次渲染，工具區的進場動畫重播一次，
 * 帶 `#段落` 的網址（常見問題的分類連結）在 #app 被清空的那一瞬間被捲回頁頂。
 *
 * 但不是每一份 HTML 都能 hydrate：找不到的網址，線上回的是 404.html（預渲染的是 `/404`），vite preview
 * 可能回首頁的 HTML，router 在 client 解析出來的卻是別頁。拿別頁的 DOM 硬 hydrate 一定 mismatch，而
 * Vue 正式版遇到 mismatch 不修 class 與屬性，頁首「目前頁面」的樣式會留在錯的連結上。
 * 所以 SSR 時在 `<html>` 記下這份 HTML 是哪一條路由，client 比對網址：同一頁才 hydrate，否則照舊整頁重畫。
 *
 * 同一頁也可能 mismatch：setup 或 template 讀了瀏覽器才有的狀態（localStorage、navigator、route.query、
 * /scan/ 交棒的內容），這類值一律在 onMounted 才讀。表單元件的選取狀態用 v-model：hydrate 不會改
 * `<select>` 的 value 與 radio、checkbox 的 checked，v-model 的指令會在 mounted 時把畫面對回狀態
 * （src/hydration.test.ts 逐頁驗）。正式版只在 console 報一行「Hydration completed but contains mismatches.」；
 * 要看是哪個節點，暫時在 vite.config.ts 加 `define: { __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' }` 再 build。
 */

/** SSR 時寫在 `<html>` 上的屬性，值是 vite-ssg 的 routePath（不含 base、沒有尾斜線，例如 `/wifi`、`/guide/qr-with-logo`）。 */
export const SSG_ROUTE_ATTR = 'data-ssg-route'

/** 拿掉一個尾斜線。只拿一個：vue-router 預設只容許一個可有可無的尾斜線，`/wifi//` 會落到 404 路由。 */
const dropTrailingSlash = (p: string) => (p.endsWith('/') ? p.slice(0, -1) : p)

/**
 * @param ssgRoute 這份 HTML 預渲染的 routePath（`<html data-ssg-route>`），沒有就是 null
 * @param pathname `location.pathname`（非 ASCII 會是百分比編碼）
 * @param base Vite 的 base（`import.meta.env.BASE_URL`，本站是 `/qrcode-studio/`）
 *
 * 本站的 routePath 沒有尾斜線（`/wifi`），線上網址一律有（Cloudflare 的 force-trailing-slash），
 * 兩邊各容許一個尾斜線再比。大小寫要完全一致：router 設了 sensitive，`/WIFI/` 在 client 是 404 頁。
 */
export function shouldHydrate(ssgRoute: string | null | undefined, pathname: string, base: string): boolean {
  if (!ssgRoute) return false
  let current: string
  try {
    current = decodeURIComponent(pathname)
  } catch {
    // 不合法的百分比編碼：比不出是不是同一頁，就照舊重畫
    return false
  }
  return dropTrailingSlash(current) === dropTrailingSlash(base) + dropTrailingSlash(ssgRoute)
}
