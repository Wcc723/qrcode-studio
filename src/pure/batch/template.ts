/**
 * 內容範本：`https://example.com/asset/{編號}` 這種「固定的網址＋每一列的值」。
 * Google 表單的預填網址（`…/viewform?usp=pp_url&entry.123456={編號}`）也是同一種寫法。
 *
 * - 範本留白：內容就是那一列的值，原樣不動。
 * - 範本是網址（http:// 或 https:// 開頭）：值先轉成網址可用的寫法（encodeURIComponent）再代入，
 *   空白、中文、& ? # / 這些字才不會把網址拆壞。例如「A 01/中」代入後是 `A%2001%2F%E4%B8%AD`。
 * - 範本不是網址（例如 `ASSET-{編號}`）：照字面代入，不轉碼。
 * - 中文輸入法打出的全形大括號 `｛編號｝` 也認得。
 */

export const TEMPLATE_TOKEN = '{編號}'
const TOKEN = /[{｛]編號[}｝]/g
const URL_TEMPLATE = /^https?:\/\//i

export type TemplateCheck = { ok: true; isUrl: boolean; empty: boolean } | { ok: false; error: string }

/** 範本本身合不合用（跟哪一列無關）。 */
export function checkTemplate(template: string): TemplateCheck {
  const t = template.trim()
  if (!t) return { ok: true, isUrl: false, empty: true }
  if (!t.match(TOKEN)) {
    return { ok: false, error: `範本裡要有 ${TEMPLATE_TOKEN}，每一張才會帶入自己那一列的值；不需要範本就把這一格清空。` }
  }
  return { ok: true, isUrl: URL_TEMPLATE.test(t), empty: false }
}

/** 落單的 surrogate 換成 U+FFFD，encodeURIComponent 才不會丟 URIError */
function wellFormed(s: string): string {
  return s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '�')
}

/** 把值代入範本。範本要先通過 `checkTemplate`；留白時回傳值本身。 */
export function applyTemplate(template: string, value: string): string {
  const t = template.trim()
  if (!t) return value
  const filled = URL_TEMPLATE.test(t) ? encodeURIComponent(wellFormed(value)) : value
  // 用函式當替換值：值裡的 $& 這類字樣不能被當成特殊替換符號
  return t.replace(TOKEN, () => filled)
}
