/**
 * 幫「不經 Vite base、也不經 vue-router」的原生 HTML 連結與圖片補上站台前綴。
 *
 * 站台掛在 www.pocketool.app/qrcode-studio/ 子路徑底下。Vite 只會改寫它自己解析到的
 * 資產參照，vue-router 只會處理 RouterLink；用 v-html 塞進 DOM 的富文字（guide-bodies.ts
 * 的本文、qr-types.ts 的 body）兩者都不經過，root-relative 的 href="/..."、src="/..."
 * 會直接連到 hub 的 404，而且 build 不報錯、單元測試也抓不到。
 *
 * BASE_URL 結尾必定帶斜線（Vite 保證），所以 href="/ → href="/qrcode-studio/。
 * `//` 開頭的協定相對網址不是站內路徑，不動它。
 */
export function withBase(html: string, base: string = import.meta.env.BASE_URL): string {
  // 屬性名前面必須是空白，data-href="/..." 這類自訂屬性才不會被誤改。
  return html.replace(/(\s)(href|src)="\/(?!\/)/g, `$1$2="${base}`)
}
