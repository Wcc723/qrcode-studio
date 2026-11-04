// 頁尾的語系列與英文頁頁尾「沒有中文」的檢查。scripts/seo/audit.mjs 逐頁用，src/pocketool-footer.test.ts 也用同一支。零相依。
//
// 語系列是站群共用頁尾畫的（src/shared/pocketool-footer/，同步來的拷貝）：DefaultLayout.vue 傳中文、English 兩筆，
// 目前的語言是 <span aria-current="true">，另一個是一般 <a>，去處跟頁首的語言切換相同。
// 語名與 lang 刻意在這裡再寫一次、不從 src/i18n/locale.ts 推導：兩邊各自獨立，改了一邊另一邊會紅。

/** 語系列的兩筆：順序、lang（等於那個語言頁的 <html lang>）與語名（用那個語言自己寫） */
export const FOOTER_LANGUAGES = [
  { lang: 'zh-Hant-TW', label: '中文' },
  { lang: 'en', label: 'English' },
]

/**
 * 這一頁該有的語系列（pocketoolFooterProblems 的 languages）：pageLang 是這一頁的 <html lang>，
 * otherHref 是另一個語言的去處（帶子路徑前綴的站內路徑，跟頁首語言切換的 href 一樣）。
 */
export function expectedFooterLanguages(pageLang, otherHref) {
  return FOOTER_LANGUAGES.map(({ lang, label }) => (lang === pageLang ? { lang, label, current: true } : { lang, label, href: otherHref }))
}

const attrOf = (attrs, name) => attrs.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1]
const hasClass = (attrs, name) => (attrOf(attrs, 'class') ?? '').split(/\s+/).includes(name)
const NAME_OF_LANG = new Map(FOOTER_LANGUAGES.map(({ lang, label }) => [lang, label]))

/**
 * 英文頁的頁尾（<footer data-pocketool-footer>）裡不該有的中文與全形標點，回傳帶中文的字（空陣列就是過）。
 * 共用頁尾裡一定是中文的只有三種，只在這個頁尾裡、只認內容沒有其他標籤的元素，對不上就不拿掉、照樣檢查：
 *   - 末端的署名 a[data-owner-line]（中英文頁同一句、不翻譯）
 *   - 互連列沒有英文站名時的 span.ptf-site__name[lang="zh-Hant"]
 *   - 語系列的一筆：帶 data-ptf-lang、lang 是 FOOTER_LANGUAGES 裡的語言、字剛好是那個語言的語名（英文頁上的「中文」）。
 *     只拿掉字、標籤留著，屬性照查
 * 前兩種的字與 lang 由 pocketoolFooterProblems 對過。剩下的字與 aria-label、title、alt 不能有中文與全形標點：
 * 本站專屬區（slot）或共用部分冒出一個漢字都會紅。
 */
export function englishFooterChinese(html) {
  const clean = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '')
  const start = clean.search(/<footer\b[^>]*\sdata-pocketool-footer\b/i)
  const end = clean.lastIndexOf('</footer>')
  if (start === -1 || end < start) return ['找不到 <footer data-pocketool-footer>']
  const footer = clean.slice(start, end)
    .replace(/<(a|span)\b([^>]*)>([^<]*)<\/\1>/gi, (whole, tag, attrs, text) => {
      if (!/\sdata-ptf-lang\b/i.test(attrs)) return whole
      const name = NAME_OF_LANG.get(attrOf(attrs, 'lang'))
      return name !== undefined && text.trim() === name ? `<${tag}${attrs}></${tag}>` : whole
    })
    .replace(/<a\b([^>]*)>[^<]*<\/a>/gi, (whole, attrs) => (/\sdata-owner-line\b/i.test(attrs) ? '' : whole))
    .replace(/<span\b([^>]*)>[^<]*<\/span>/gi, (whole, attrs) => (hasClass(attrs, 'ptf-site__name') && attrOf(attrs, 'lang') === 'zh-Hant' ? '' : whole))
  const text = footer.replace(/<[^>]+>/g, ' ')
  const attrText = [...footer.matchAll(/\s(?:aria-label|title|alt)="([^"]*)"/g)].map((m) => m[1]).join(' ')
  return [...`${text} ${attrText}`.matchAll(/[^\s]*[\p{Script=Han}　-〿＀-￯][^\s]*/gu)].map((m) => m[0])
}
