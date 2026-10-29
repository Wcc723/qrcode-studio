// 此檔由共用頁尾正本同步（版本 1.0.2），不要在這裡改。
// 口袋工具共用頁尾的建置稽核（契約見共用頁尾文件的「建置稽核」）。
// 純 JS、零相依，只 import 同資料夾的資料檔；各站的 build 稽核逐頁呼叫。
//
//   import { pocketoolFooterProblems } from '<這個資料夾>/pocketool-footer.audit.mjs'
//   for (const problem of pocketoolFooterProblems(html, { site: 'pocket-time', locale: 'zh-Hant' })) fail(problem)
//
// 檢查（期望值都由 pocketoolFooterModel 算，跟元件畫的同一份）：
// 1. 整頁剛好一個帶 data-pocketool-footer 的元素，是 <footer>、版本等於資料檔，而且是整頁最後一個 <footer>
//    （body 尾端 Teleport 出來、帶 <footer> 的 modal 也算，會誤報）；<footer> 不帶 lang
// 2. 共用區塊（互連列、字標與網站資訊那一列、版權句）的 lang：簡中頁是 zh-Hant，其他語系沒有
// 3. 互連列 <nav aria-label="…">：每站一個連結、順序、href、hreflang、target、站名與短說明、站名的 lang；
//    目前這站 aria-current="true"，共用部分的其他連結都沒有 aria-current（本站專屬區不管）
// 4. 字標：href、hreflang、target、aria-label，站徽 img.ptf__mark 的 src 與 srcset；「網站資訊」連結列：href、hreflang、target、字
// 5. 版權句；互連列、網站資訊、署名的先後順序
// 6. 署名：整頁剛好一條 data-owner-line、字、href、lang 與 hreflang、沒有 target 與 rel、
//    在這個頁尾裡，而且它之後到 </footer> 沒有看得到的字（只有圖沒有字不算）
import { POCKETOOL_FOOTER_VERSION, pocketoolFooterModel } from './pocketool-footer-data.mjs'

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#x27': "'" }
const decode = (s) => s.replace(/&(amp|lt|gt|quot|apos|nbsp|#39|#x27);/gi, (_, name) => ENTITIES[name.toLowerCase()])

/** 注解、script、style、template 拿掉（裡面的字不算畫面） */
function clean(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<template\b[\s\S]*?<\/template>/gi, '')
}

/** 開標籤的屬性：有引號、單引號、沒引號、只有名字（值是空字串）都認得；值解開 HTML 實體 */
export function attrsOf(tag) {
  const attrs = new Map()
  const body = tag.replace(/^<[a-z][\w-]*/i, '').replace(/\/?>$/, '')
  for (const m of body.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attrs.set(m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4] ?? ''))
  }
  return attrs
}

export function textOf(fragment) {
  return decode(fragment.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
}

/** 從 start（開標籤的 <）找到同名元素的結尾（含結尾標籤），會算巢狀 */
function elementEnd(html, start, tag) {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi')
  re.lastIndex = start
  let depth = 0
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] ? -1 : 1
    if (depth === 0) return m.index + m[0].length
  }
  return html.length
}

/** 第一個屬性符合條件的 tag 元素：{ index, open, attrs, html, inner } */
function findElement(html, tag, test) {
  for (const m of html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))) {
    const attrs = attrsOf(m[0])
    if (!test(attrs)) continue
    const end = elementEnd(html, m.index, tag)
    const whole = html.slice(m.index, end)
    return { index: m.index, open: m[0], attrs, html: whole, inner: whole.slice(m[0].length, whole.length - `</${tag}>`.length) }
  }
  return null
}

function anchorsIn(html) {
  return [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => {
    const open = m[0].slice(0, m[0].indexOf('>') + 1)
    return { index: m.index, open, attrs: attrsOf(open), inner: m[1] }
  })
}

const hasClass = (attrs, name) => (attrs.get('class') ?? '').split(/\s+/).includes(name)
/** srcset 的候選逗號分隔、空白多寡不算差別（壓縮 HTML 可能改空白） */
const normalizeSrcset = (value) => (value === undefined ? undefined : value.split(',').map((c) => c.trim().replace(/\s+/g, ' ')).filter(Boolean).join(', '))

const spansIn = (html) => [...html.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi)].map((m) => ({ attrs: attrsOf(m[0].slice(0, m[0].indexOf('>') + 1)), inner: m[1] }))
const shown = (value) => (value === undefined ? '（沒有）' : `"${value}"`)

/** 一條連結的 href、hreflang、target 跟期望一樣嗎 */
function linkProblems(where, attrs, expected) {
  const problems = []
  if (attrs.get('href') !== expected.href) problems.push(`${where}的 href 是 ${shown(attrs.get('href'))}，應該是 "${expected.href}"`)
  if (attrs.get('hreflang') !== expected.hreflang) problems.push(`${where}的 hreflang 是 ${shown(attrs.get('hreflang'))}，應該是 ${shown(expected.hreflang)}`)
  if (attrs.get('target') !== expected.target) problems.push(`${where}的 target 是 ${shown(attrs.get('target'))}，應該是 ${shown(expected.target)}`)
  if (attrs.has('rel')) problems.push(`${where}不加 rel（同網域、同分頁開）`)
  return problems
}

/**
 * 一個預渲染 HTML 的共用頁尾有沒有照契約。回傳問題清單，空陣列就是過。
 * site 是這一站的代號（元件的 site prop），locale 是這一頁給元件的語系（zh-Hant、zh-Hans、en、ja、ko）。
 */
export function pocketoolFooterProblems(html, { site, locale }) {
  let model
  try {
    model = pocketoolFooterModel(site, locale)
  } catch (error) {
    return [error.message]
  }
  const page = clean(html)
  const marked = [...page.matchAll(/<([a-z][\w-]*)\b[^>]*\sdata-pocketool-footer\b[^>]*>/gi)]
  if (marked.length !== 1) return [`共用頁尾（data-pocketool-footer）要剛好一個，實際 ${marked.length} 個`]
  const [open, tag] = marked[0]
  if (tag.toLowerCase() !== 'footer') return [`data-pocketool-footer 要在 <footer> 上，現在在 <${tag}>`]

  const problems = []
  const rootAttrs = attrsOf(open)
  if (rootAttrs.get('data-pocketool-footer') !== POCKETOOL_FOOTER_VERSION) {
    problems.push(`共用頁尾的版本是 ${shown(rootAttrs.get('data-pocketool-footer'))}，資料檔是 "${POCKETOOL_FOOTER_VERSION}"（重新同步或重新建置）`)
  }
  if (rootAttrs.has('lang')) problems.push(`<footer> 不加 lang（現在是 ${shown(rootAttrs.get('lang'))}；簡中頁的 lang 標在共用的區塊上，本站專屬區不標）`)
  const start = marked[0].index
  const end = elementEnd(page, start, 'footer')
  if (/<footer\b/i.test(page.slice(end))) problems.push('共用頁尾要是整頁最後一個 <footer>')
  const footer = page.slice(start, end)
  // 本站專屬區（slot）是各站自己的內容（站內導覽可能有 aria-current="page"），下面只看共用的部分
  const local = findElement(footer, 'div', (a) => hasClass(a, 'ptf__local'))
  const shared = local ? footer.slice(0, local.index) + footer.slice(local.index + local.html.length) : footer

  // 共用區塊的 lang
  for (const [tag, name, label] of [['nav', 'ptf__sites', '互連列'], ['div', 'ptf__row', '字標與網站資訊那一列'], ['p', 'ptf__copy', '版權句']]) {
    const block = findElement(shared, tag, (a) => hasClass(a, name))
    if (!block) problems.push(`頁尾找不到${label} <${tag} class="${name}">`)
    else if (block.attrs.get('lang') !== model.lang) problems.push(`${label}（.${name}）的 lang 是 ${shown(block.attrs.get('lang'))}，應該是 ${shown(model.lang)}`)
  }

  // 互連列
  const sitesNav = findElement(shared, 'nav', (a) => a.get('aria-label') === model.sitesLabel)
  if (!sitesNav) problems.push(`頁尾找不到互連列 <nav aria-label="${model.sitesLabel}">`)
  else {
    const links = anchorsIn(sitesNav.inner)
    if (links.length !== model.sites.length) {
      problems.push(`互連列要有 ${model.sites.length} 個連結，實際 ${links.length} 個`)
    } else {
      model.sites.forEach((expected, i) => {
        const actual = links[i]
        const where = `互連列第 ${i + 1} 個（${expected.key}）`
        problems.push(...linkProblems(where, actual.attrs, expected))
        const current = actual.attrs.get('aria-current')
        if (expected.current && current !== 'true') problems.push(`${where}是目前這站，要有 aria-current="true"`)
        if (!expected.current && current !== undefined) problems.push(`${where}不是目前這站，不能有 aria-current`)
        const spans = spansIn(actual.inner)
        const name = spans[0] ? textOf(spans[0].inner) : ''
        const desc = spans[1] ? textOf(spans[1].inner) : ''
        if (name !== expected.name) problems.push(`${where}的站名是「${name}」，應該是「${expected.name}」`)
        if (spans[0] && spans[0].attrs.get('lang') !== expected.nameLang) problems.push(`${where}站名的 lang 是 ${shown(spans[0].attrs.get('lang'))}，應該是 ${shown(expected.nameLang)}`)
        if (desc !== expected.desc) problems.push(`${where}的短說明是「${desc}」，應該是「${expected.desc}」`)
      })
    }
  }
  const currents = anchorsIn(shared).filter((a) => a.attrs.has('aria-current'))
  const expectedCurrent = model.sites.filter((s) => s.current).length
  if (sitesNav && currents.length !== expectedCurrent) problems.push(`頁尾裡有 aria-current 的連結要剛好 ${expectedCurrent} 個，實際 ${currents.length} 個`)

  // 字標
  const brand = anchorsIn(shared).find((a) => a.attrs.get('aria-label') === model.brand.label)
  if (!brand) problems.push(`頁尾找不到字標連結（aria-label="${model.brand.label}"）`)
  else {
    problems.push(...linkProblems('字標', brand.attrs, model.brand))
    const mark = [...brand.inner.matchAll(/<img\b[^>]*>/gi)].map((m) => attrsOf(m[0])).find((a) => hasClass(a, 'ptf__mark'))
    if (!mark) problems.push('字標裡找不到站徽 <img class="ptf__mark">')
    else {
      if (mark.get('src') !== model.brand.mark) problems.push(`站徽的 src 是 ${shown(mark.get('src'))}，應該是 "${model.brand.mark}"`)
      if (normalizeSrcset(mark.get('srcset')) !== normalizeSrcset(model.brand.srcset)) problems.push(`站徽的 srcset 是 ${shown(mark.get('srcset'))}，應該是 "${model.brand.srcset}"`)
    }
  }

  // 網站資訊
  const infoNav = findElement(shared, 'nav', (a) => a.get('aria-label') === model.infoLabel)
  if (!infoNav) problems.push(`頁尾找不到網站資訊 <nav aria-label="${model.infoLabel}">`)
  else {
    const links = anchorsIn(infoNav.inner)
    if (links.length !== model.info.length) problems.push(`網站資訊要有 ${model.info.length} 個連結，實際 ${links.length} 個`)
    else {
      model.info.forEach((expected, i) => {
        const actual = links[i]
        const where = `網站資訊第 ${i + 1} 個（${expected.key}）`
        problems.push(...linkProblems(where, actual.attrs, expected))
        const label = textOf(actual.inner)
        if (label !== expected.label) problems.push(`${where}的字是「${label}」，應該是「${expected.label}」`)
      })
    }
  }
  if (sitesNav && infoNav && sitesNav.index > infoNav.index) problems.push('互連列要在網站資訊上面')

  // 版權句
  const squash = (s) => s.replace(/\s+/g, '')
  const copyright = `${model.note}${model.copyright}`
  if (!squash(textOf(shared)).includes(squash(copyright))) problems.push(`頁尾沒有版權句「${model.note}${model.copyright}」`)

  // 署名
  const owners = [...page.matchAll(/<a\b([^>]*\bdata-owner-line\b[^>]*)>([\s\S]*?)<\/a>/gi)]
  if (owners.length !== 1) problems.push(`署名（data-owner-line）要剛好一條，實際 ${owners.length} 條`)
  else {
    const [whole, , inner] = owners[0]
    const attrs = attrsOf(whole.slice(0, whole.indexOf('>') + 1))
    const text = textOf(inner)
    if (text !== model.owner.text) problems.push(`署名的字不對：${text}`)
    if (attrs.get('href') !== model.owner.href) problems.push(`署名的 href 是 ${shown(attrs.get('href'))}，應該是 "${model.owner.href}"`)
    if (attrs.get('lang') !== model.owner.lang || attrs.get('hreflang') !== model.owner.lang) problems.push('署名的 lang 與 hreflang 都要是 zh-Hant')
    if (attrs.has('target') || attrs.has('rel')) problems.push('署名同分頁開，不加 target、rel')
    const ownerStart = owners[0].index
    const ownerEnd = ownerStart + whole.length
    if (ownerStart < start || ownerEnd > end) problems.push('署名要在共用頁尾裡')
    else {
      if (textOf(page.slice(ownerEnd, end))) problems.push('署名後面還有字，它要是頁尾最後一行')
      if (infoNav && !footer.slice(0, ownerStart - start).includes(infoNav.html)) problems.push('署名要在網站資訊下面')
    }
  }
  return problems
}
