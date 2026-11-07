// 此檔由共用頁尾正本同步（版本 1.3.0），不要在這裡改。
// 口袋工具共用頁尾的資料（契約見共用頁尾文件）。
// 純資料加純函式、零相依：元件 PocketoolFooter.vue 與建置稽核 pocketool-footer.audit.mjs 都讀這一份，Node 可以直接 import。
//
// 規則：
// - 字跟著語系：站名、短說明、連結列與版權句依 locale 顯示；zh-Hans 用繁中的字（不轉簡體），
//   共用的區塊（互連列、字標與網站資訊、版權句）標 lang="zh-Hant"，本站專屬區不標。
// - 連結目標：有同語系版本就連過去，沒有就連繁中版，<a> 標 hreflang（文字不是頁面語言時另標 lang）。
// - 站名用各站的正式名稱；某語系沒有正式名稱時先用英文名，沒有英文名才用繁中名。
// - 網址只放可以索引的最終網址（不經轉址）。noindex 的語系版本不放（只對 Google 標 noindex 的也算），那些語系一律連繁中版。
// - 語系列（選用）：本站有好幾種語言時，站把「這一頁在各語言的去處」傳進來（languages），版權句上面畫一列；
//   去處由站自己算（每站的對應規則不同），這裡只檢查格式、決定 hreflang 與標記。

/** 改這個資料夾的任何一個檔都要升版：minor 是加站、加語系、加欄位，patch 是改字或改樣式，major 是改結構或屬性 */
export const POCKETOOL_FOOTER_VERSION = '1.3.0'

export const POCKETOOL_ORIGIN = 'https://www.pocketool.app'

/** hub 的 site key。在 hub 上，hub 自己的頁寫站內路徑、其他站的 www 絕對網址帶 target="_self" */
export const POCKETOOL_HUB_SITE = 'pocket-tool-blog'

/** 元件接受的語系 */
export const POCKETOOL_FOOTER_LOCALES = ['zh-Hant', 'zh-Hans', 'en', 'ja', 'ko']

/**
 * 連結目標沒有頁面語系的版本時，改連哪一個語言的版本（現在一律連繁中版）。
 * 要讓日文、韓文頁改連英文版，只改這裡的 ja、ko，兩列與字標會一起換。
 */
export const POCKETOOL_TARGET_FALLBACK = { 'zh-Hant': 'zh-Hant', 'zh-Hans': 'zh-Hant', en: 'zh-Hant', ja: 'zh-Hant', ko: 'zh-Hant' }

/**
 * 頁尾最後一行的經營者署名：固定字句，兩個半形空格，所有語系相同、不翻譯，
 * 連繁中的 hub 關於頁（不帶尾斜線）、同分頁開。hub 上寫站內路徑 /about（交給 VitePress 的 router）。
 */
export const POCKETOOL_OWNER_LINE = {
  text: '六角學院 卡斯伯 經營',
  href: 'https://www.pocketool.app/about',
  hubHref: '/about',
  lang: 'zh-Hant',
}

/**
 * 「口袋工具的站」互連列，順序就是畫面上的順序。
 * key 是站的代號（元件的 site prop）；href 是 POCKETOOL_ORIGIN 之後的路徑，key 是語言；
 * name 是各語言的正式站名；desc 是一句短說明（四個語言都要有，描述的是那個語言的頁會連到的版本）。
 */
export const POCKETOOL_SITES = [
  {
    key: 'pocket-tool-blog',
    name: { 'zh-Hant': '口袋工具', en: 'Pocketool' },
    href: { 'zh-Hant': '/', en: '/en/' },
    desc: { 'zh-Hant': '所有工具與文章', en: 'All tools and articles', ja: 'ツールと記事の一覧', ko: '도구와 글 모음' },
  },
  {
    key: 'pocket-time',
    // 只有繁中版可以索引
    name: { 'zh-Hant': '口袋時間', en: 'Pocket Time' },
    href: { 'zh-Hant': '/time/zh-tw/' },
    desc: { 'zh-Hant': '農民曆、好日子、行事曆', en: 'Taiwan almanac and holidays', ja: '台湾の旧暦カレンダーと祝日', ko: '대만 음력 달력과 공휴일' },
  },
  {
    key: 'compound-calculator',
    // 只放繁中版（日文、韓文版是 noindex）
    name: { 'zh-Hant': '社畜人生計算機', en: 'Office Life Calculator' },
    href: { 'zh-Hant': '/compound-calculator/' },
    desc: { 'zh-Hant': '薪資、勞退、房貸試算', en: 'Taiwan pay and loan calculators', ja: '台湾の給与・ローン計算', ko: '대만 급여·대출 계산' },
  },
  {
    key: 'office-tools',
    // 英文、韓文版是 noindex，不放（那些語系連繁中版）；日文版是獨立的日本市場，照放
    name: { 'zh-Hant': '行政小幫手', en: 'Office Tools', ja: '事務ツール' },
    href: { 'zh-Hant': '/office-tools/', ja: '/office-tools/ja/' },
    desc: { 'zh-Hant': '行事曆、民國日期、桌牌', en: 'Admin tools for Taiwan offices', ja: '和暦変換・祝日一覧', ko: '대만 사무 도구' },
  },
  {
    key: 'taiwan-zipcode',
    // 只有繁中站名
    name: { 'zh-Hant': '台灣郵遞區號查詢' },
    href: { 'zh-Hant': '/zipcode/' },
    desc: { 'zh-Hant': '3+3 郵遞區號、地址英譯', en: 'Taiwan postal codes', ja: '台湾の郵便番号', ko: '대만 우편번호' },
  },
  {
    key: 'qrcode-studio',
    name: { 'zh-Hant': 'QR Code 製造機', en: 'QR Code Maker' },
    href: { 'zh-Hant': '/qrcode-studio/', en: '/qrcode-studio/en/' },
    desc: { 'zh-Hant': 'QR Code 與條碼產生', en: 'QR code and barcode maker', ja: 'QRコード・バーコード作成', ko: 'QR 코드·바코드 생성' },
  },
  {
    key: 'kaomoji-garden',
    // zh-hans、日文、韓文版不放（noindex）
    name: { 'zh-Hant': '顏文字花園', en: 'Kaomoji Garden' },
    href: { 'zh-Hant': '/kaomoji/zh', en: '/kaomoji/en' },
    desc: { 'zh-Hant': '顏文字、符號、Emoji', en: 'Kaomoji, symbols and emoji', ja: '顔文字・特殊文字・絵文字', ko: '카오모지·특수문자·이모지' },
  },
  {
    key: 'pixel-smith',
    name: { 'zh-Hant': 'Pixel Smith', en: 'Pixel Smith' },
    href: { 'zh-Hant': '/pixel-smith/', en: '/pixel-smith/en/' },
    desc: { 'zh-Hant': '浮水印、HEIC 轉檔、修圖', en: 'Watermark, HEIC and photo tools', ja: '透かし・HEIC変換・写真編集', ko: '워터마크·HEIC 변환·사진 편집' },
  },
  {
    key: 'device-tester',
    // /device-tester/ 是語言選擇頁，連各語系的工具索引
    name: { 'zh-Hant': 'Device Tester', en: 'Device Tester' },
    href: { 'zh-Hant': '/device-tester/zh-tw/', en: '/device-tester/en/' },
    desc: { 'zh-Hant': '滑鼠、鍵盤、鏡頭測試', en: 'Mouse, keyboard and webcam tests', ja: 'マウス・キーボード・カメラのテスト', ko: '마우스·키보드·웹캠 테스트' },
  },
  {
    key: 'vocab',
    // 只有繁中版；單字頁與遊戲畫面不給索引，連首頁
    name: { 'zh-Hant': '口袋單字王', en: 'Pocket Word King' },
    href: { 'zh-Hant': '/vocab/zh-tw/' },
    desc: { 'zh-Hant': '英文單字遊戲與模擬考', en: 'English word games and mock tests', ja: '英単語ゲームと模擬試験', ko: '영어 단어 게임과 모의고사' },
  },
]

/** 「網站資訊」連結列的七個連結。hub 的頁有繁中與英文兩版；卡斯伯 Blog 是外站、只有繁中 */
export const POCKETOOL_INFO_LINKS = [
  { key: 'about', href: { 'zh-Hant': '/about', en: '/en/about' }, label: { 'zh-Hant': '關於', en: 'About', ja: 'Pocketoolについて', ko: 'Pocketool 소개' } },
  { key: 'editorial-policy', href: { 'zh-Hant': '/editorial-policy', en: '/en/editorial-policy' }, label: { 'zh-Hant': '編輯方針', en: 'Editorial Policy', ja: '編集方針', ko: '편집 방침' } },
  { key: 'privacy', href: { 'zh-Hant': '/privacy', en: '/en/privacy' }, label: { 'zh-Hant': '隱私權政策', en: 'Privacy Policy', ja: 'プライバシーポリシー', ko: '개인정보 처리방침' } },
  { key: 'terms', href: { 'zh-Hant': '/terms', en: '/en/terms' }, label: { 'zh-Hant': '服務條款', en: 'Terms of Service', ja: '利用規約', ko: '이용약관' } },
  { key: 'disclaimer', href: { 'zh-Hant': '/disclaimer', en: '/en/disclaimer' }, label: { 'zh-Hant': '免責聲明', en: 'Disclaimer', ja: '免責事項', ko: '면책 조항' } },
  { key: 'contact', href: { 'zh-Hant': '/contact', en: '/en/contact' }, label: { 'zh-Hant': '聯絡', en: 'Contact', ja: 'お問い合わせ', ko: '문의' } },
  { key: 'blog', url: 'https://www.casper.tw/', urlLang: 'zh-Hant', external: true, label: { 'zh-Hant': '卡斯伯 Blog', en: 'Casper Blog', ja: 'Casper Blog', ko: 'Casper Blog' } },
]

/**
 * 各語言的固定字：三條 nav 的 aria-label（互連列的也是畫面上的小標）、字標連結的 aria-label、版權句（手機在第一句後換行）。
 * 年份是常數，跨年要改。
 */
export const POCKETOOL_FOOTER_COPY = {
  'zh-Hant': { sites: '口袋工具的站', info: '網站資訊', languages: '語言', home: '口袋工具 Pocketool 首頁', note: '工具結果僅供參考。', copyright: '© 2026 口袋工具 Pocketool' },
  en: { sites: 'Pocketool sites', info: 'Site information', languages: 'Language', home: 'Pocketool home', note: 'Tool results are for reference only.', copyright: '© 2026 Pocketool' },
  ja: { sites: 'Pocketoolのサイト', info: 'サイト情報', languages: '言語', home: 'Pocketool ホーム', note: 'ツールの結果は参考情報です。', copyright: '© 2026 Pocketool' },
  ko: { sites: 'Pocketool 사이트', info: '사이트 정보', languages: '언어', home: 'Pocketool 홈', note: '도구 결과는 참고용입니다.', copyright: '© 2026 Pocketool' },
}

/** 字標的站徽（放在 hub 的 /brand/，檔名上線後不改；稽核會比對 src 與 srcset） */
const MARK_64 = '/brand/pocketool-mark-64.webp'
const MARK_96 = '/brand/pocketool-mark-96.webp'

/** 畫面上的字用哪個語言：zh-Hans 用繁中 */
export function pocketoolFooterTextLocale(locale) {
  return locale === 'zh-Hans' ? 'zh-Hant' : locale
}

function pick(map, keys) {
  for (const key of keys) if (map[key] !== undefined) return key
  return null
}

const filled = (value) => typeof value === 'string' && value.trim() !== ''

/**
 * 語系列：站傳進來的每一筆是 { lang, label, href, current }，順序就是畫面上的順序。
 * - lang 是那個語言的 BCP 47 代碼（也是去處的 hreflang），label 是那個語言自己的名稱（「English」「한국어」），字照那個語言畫。
 * - current 是這一頁的語言：畫成純文字、標 aria-current，不需要 href；其他每一筆都要有 href（站內絕對路徑或完整網址）。
 * - 空陣列就不畫；只有一筆沒有切換的意義，也算錯。lang 重複、current 超過一筆、少了字或網址都丟錯（預渲染在建置時失敗）。
 */
export function pocketoolFooterLanguages(languages = []) {
  if (!Array.isArray(languages)) throw new Error('[pocketool-footer] languages 要是陣列')
  if (languages.length === 0) return []
  if (languages.length === 1) throw new Error('[pocketool-footer] languages 只有一筆：只有一種語言的站不要傳')
  const seen = new Set()
  let currents = 0
  return languages.map((item, i) => {
    const where = `[pocketool-footer] languages 第 ${i + 1} 筆`
    if (!item || !filled(item.lang) || !filled(item.label)) throw new Error(`${where}要有 lang 與 label`)
    if (seen.has(item.lang)) throw new Error(`${where}的 lang（${item.lang}）重複了`)
    seen.add(item.lang)
    const current = item.current === true
    if (current) currents += 1
    if (currents > 1) throw new Error(`${where}：current 只能有一筆`)
    if (!current && !filled(item.href)) throw new Error(`${where}（${item.lang}）不是目前的語言，要有 href`)
    return { lang: item.lang, label: item.label.trim(), href: current ? undefined : item.href, hreflang: current ? undefined : item.lang, current }
  })
}

/**
 * 算出某一站、某一語系的頁尾要畫什麼。元件照這個畫，稽核照這個對，兩邊不會各自分歧。
 * 不認識的站或語系直接丟錯：預渲染會在建置時失敗，不會默默畫錯。languages 是選用的語系列（見 pocketoolFooterLanguages）。
 */
export function pocketoolFooterModel(site, locale, languages = []) {
  if (!POCKETOOL_SITES.some((s) => s.key === site)) {
    throw new Error(`[pocketool-footer] 不認識的站：${site}（要是 ${POCKETOOL_SITES.map((s) => s.key).join('、')}）`)
  }
  if (!POCKETOOL_FOOTER_LOCALES.includes(locale)) {
    throw new Error(`[pocketool-footer] 不認識的語系：${locale}（要是 ${POCKETOOL_FOOTER_LOCALES.join('、')}）`)
  }
  const text = pocketoolFooterTextLocale(locale)
  const onHub = site === POCKETOOL_HUB_SITE
  const targetKeys = [locale, POCKETOOL_TARGET_FALLBACK[locale], 'zh-Hant']
  const nameKeys = [text, 'en', 'zh-Hant']
  const copy = POCKETOOL_FOOTER_COPY[text]
  /** 頁面語言以外的目標才標 hreflang */
  const hreflangFor = (lang) => (lang === locale ? undefined : lang)
  /** 口袋工具網域上的路徑：hub 自己的頁在 hub 上寫站內路徑；其他站的 www 絕對網址在 hub 上帶 target="_self"（不讓 VitePress 的 router 攔） */
  const www = (path, ownedByHub) => {
    if (onHub && ownedByHub) return { href: path, target: undefined }
    return { href: `${POCKETOOL_ORIGIN}${path}`, target: onHub ? '_self' : undefined }
  }

  const sites = POCKETOOL_SITES.map((s) => {
    const targetLang = pick(s.href, targetKeys)
    const nameLang = pick(s.name, nameKeys)
    return {
      key: s.key,
      name: s.name[nameLang],
      nameLang: nameLang === text ? undefined : nameLang,
      desc: s.desc[text],
      ...www(s.href[targetLang], s.key === POCKETOOL_HUB_SITE),
      hreflang: hreflangFor(targetLang),
      current: s.key === site,
    }
  })

  const info = POCKETOOL_INFO_LINKS.map((l) => {
    if (l.url) {
      return { key: l.key, label: l.label[text], href: l.url, target: undefined, hreflang: hreflangFor(l.urlLang), external: Boolean(l.external) }
    }
    const targetLang = pick(l.href, targetKeys)
    return { key: l.key, label: l.label[text], ...www(l.href[targetLang], true), hreflang: hreflangFor(targetLang), external: false }
  })

  const hubHome = POCKETOOL_SITES.find((s) => s.key === POCKETOOL_HUB_SITE)
  const brandLang = pick(hubHome.href, targetKeys)
  const markBase = onHub ? '' : POCKETOOL_ORIGIN

  return {
    version: POCKETOOL_FOOTER_VERSION,
    site,
    locale,
    /** 共用區塊（.ptf__sites、.ptf__row、.ptf__copy）的 lang：只有簡中頁要標（字是繁中）。<footer> 與本站專屬區不標 */
    lang: locale === 'zh-Hans' ? 'zh-Hant' : undefined,
    sitesLabel: copy.sites,
    sites,
    brand: {
      ...www(hubHome.href[brandLang], true),
      hreflang: hreflangFor(brandLang),
      label: copy.home,
      /** 字標的中文「口袋工具」只在繁中、簡中頁出現；外語頁只寫 Pocketool */
      zh: text === 'zh-Hant',
      mark: `${markBase}${MARK_64}`,
      srcset: `${markBase}${MARK_64} 64w, ${markBase}${MARK_96} 96w`,
    },
    infoLabel: copy.info,
    info,
    languagesLabel: copy.languages,
    languages: pocketoolFooterLanguages(languages),
    note: copy.note,
    copyright: copy.copyright,
    owner: {
      text: POCKETOOL_OWNER_LINE.text,
      href: onHub ? POCKETOOL_OWNER_LINE.hubHref : POCKETOOL_OWNER_LINE.href,
      lang: POCKETOOL_OWNER_LINE.lang,
    },
  }
}
