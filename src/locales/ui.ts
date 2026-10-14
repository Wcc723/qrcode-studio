/**
 * 全站共用元件的文案：「?」、隱私那一行、產生器、外觀設定、預覽與下載、手機預覽列。
 *
 * 這份是繁中（原本寫在元件裡的那一句，一個字都沒改），會進 entry chunk。英文在 ui.en.ts，只有英文頁 import，
 * 由英文頁用 provideUiCopy() 交給底下的元件：繁中頁的訪客不必多下載英文字串。元件一律用 useUiCopy() 取。
 * 批次頁的字在 src/pure/batch/copy.ts，條碼產生器的在 src/locales/barcode.ts（都在各自的 chunk）。
 */
import { inject, provide, type InjectionKey } from 'vue'
import type { ErrorCorrectionLevel } from '@/types'
import type { Locale } from '@/i18n/locale'

/** 「?」按鈕的無障礙名稱 */
export const helpTipName: Record<Locale, (name: string) => string> = {
  'zh-TW': name => `${name}的說明`,
  en: name => `More about ${name}`,
}

export interface PrivacyCopy {
  /** 「?」的名稱：掃描是圖片，其他是內容 */
  name: { scan: string; other: string }
  /** 看得到的那一行 */
  line: { scan: string; other: string }
  generate: string
  barcode: string
  batch: string
  scan: string
  /** 統計那一段：前半、連結文字、後半 */
  stats: { before: string; link: string; after: string }
}

export const privacyCopy: PrivacyCopy = {
  name: { scan: '圖片不上傳', other: '內容不上傳' },
  line: { scan: '在你的瀏覽器裡讀取，圖片不上傳', other: '只在你的瀏覽器產生，內容不上傳' },
  generate: '你輸入的網址、WiFi 密碼、聯絡資訊與 LOGO 圖片，都只在你的瀏覽器裡轉成圖片，不會上傳到任何伺服器，本站也不會保存。',
  barcode: '你輸入的條碼內容只在你的瀏覽器裡轉成圖片，不會上傳到任何伺服器，本站也不會保存。',
  batch: '你貼上的清單與做好的圖片只在這個分頁的記憶體裡，ZIP 也是在你的瀏覽器裡打包、直接下載，印標籤紙也是在你的瀏覽器裡排版、列印，不會上傳到任何伺服器，不會存進網址、Cookie 或瀏覽器的儲存空間，關掉分頁就什麼都不剩。勾選「記住這台印表機的位移」時，只會存位移的兩個數字。',
  scan: '讀取用的程式由本站提供，直接在你的瀏覽器裡執行。圖片與讀出來的內容只在這個分頁開著的時候存在，不會上傳，也不會存進 Cookie 或瀏覽器的儲存空間，關掉分頁就什麼都不剩。',
  stats: { before: '網站用流量統計工具（Google Analytics、Cloudflare Web Analytics）計算瀏覽量，統計資料不包含你輸入或丟進來的內容，詳見', link: '隱私權政策', after: '。' },
}

export interface GeneratorCopy {
  input: string
  look: string
  preview: string
  downloadHelpName: string
  downloadHelp: { strong: string; text: string }[]
  copyHelp: string
  url: { label: string; help: string }
}

export const generatorCopy: GeneratorCopy = {
  input: '輸入內容',
  look: '外觀',
  preview: '預覽與下載',
  downloadHelpName: '下載格式',
  downloadHelp: [
    { strong: 'PNG', text: '：一般用途都用它，可以透明背景。' },
    { strong: 'SVG', text: '：放多大都清楚，印刷或交給設計師排版用。' },
    { strong: 'JPG', text: '：只有對方只收 JPG 時才用，不能透明背景。' },
  ],
  copyHelp: '「複製」會把 PNG 圖片複製起來，可以直接貼進聊天或文件。',
  url: {
    label: '網址',
    help: '開頭沒有 https:// 的話會自動補上。網址越長，QR Code 的圖案越密，要印得小可以先換成短網址；網址後面 ? 開頭、用來分辨來源的那一段（例如 ?utm_source=poster）會原樣放進去。',
  },
}

export interface StyleCopy {
  colorName: string
  color: string
  colorHelp: string
  dotColor: string
  bgColor: string
  transparent: string
  transparentNote: string
  gradient: string
  gradientColor: string
  logoName: string
  logo: string
  logoHelp: string
  /** 第二段：前半、連到教學的文字、後半（英文沒有教學可連，只有一句） */
  logoHelp2: { before: string; link?: { to: string; text: string }; after: string }
  removeLogo: string
  ecName: string
  ec: string
  ecHelp: string
  ecHelp2: { before: string; link?: { to: string; text: string }; after: string }
  ecLabel: Record<ErrorCorrectionLevel, string>
  sizeName: string
  size: (px: number) => { label: string; value: string }
  sizeHelp: string
}

export const styleCopy: StyleCopy = {
  colorName: '顏色',
  color: '顏色',
  colorHelp: '相機靠明暗差判讀：請維持深色的方塊、淺色的背景，用漸層時兩端的顏色也都要夠深。淺色方塊配深色背景（反白）很多掃描器讀不出來。',
  dotColor: '方塊顏色',
  bgColor: '背景顏色',
  transparent: '透明背景',
  transparentNote: 'JPG 不支援透明，下載 JPG 時會改用白色背景；要透明背景請下載 PNG 或 SVG。透明的 PNG、SVG 連四周留白也是透明的，請放在白色或淺色的素面上。',
  gradient: '使用漸層',
  gradientColor: '漸層的第二個顏色',
  logoName: '加入 LOGO',
  logo: '加入 LOGO',
  logoHelp: 'LOGO 圖片只在你的瀏覽器裡讀取，不會上傳。加入後會自動調成最耐髒的等級（H），LOGO 放在正中央，蓋掉的方塊最多約 9%，一般都能正常掃描。',
  logoHelp2: { before: '建議用去背的 PNG、筆畫簡單的圖形，印出來之前先用手機實際掃一次。完整說明見', link: { to: '/guide/qr-with-logo/', text: '加 LOGO 的教學' }, after: '。' },
  removeLogo: '移除 LOGO',
  ecName: '耐髒程度',
  ec: '耐髒程度（容錯等級）',
  ecHelp: '被弄髒、磨損或中間蓋了 LOGO，還掃不掃得出來：L、M、Q、H 被遮住約 7%、15%、25%、30% 還能掃。等級越高，方塊越多越細；一般用途維持 M，戶外、貼紙這類容易磨損的地方選 Q，加入 LOGO 時會自動調成 H。',
  ecHelp2: { before: '比較與實際圖例見', link: { to: '/guide/error-correction/', text: '容錯等級怎麼選' }, after: '。' },
  ecLabel: { L: '低：圖案最簡單（螢幕上用）', M: '中：一般用途（建議）', Q: '較高：戶外、貼紙', H: '最高：要加 LOGO' },
  sizeName: '圖片大小',
  size: px => ({ label: '圖片大小：', value: `${px} 像素` }),
  sizeHelp: '下載的 PNG 與 JPG 的寬高，200 到 2000 像素，四周至少 4 格小方塊寬的留白（靜區）也算在裡面，圖片小或內容長時留白會更寬。以一般印刷品的精細度（300 dpi，每英吋 300 點）換算，1000 像素大約可以印 8.5 公分，2000 像素大約 16.9 公分；要印得更大請下載 SVG 向量檔，放多大都不會糊。',
}

export interface PreviewCopy {
  demo: string
  hint: string
  download: string
  copy: string
  copied: string
  copiedMessage: string
  copyFailed: string
  dockExpand: string
  dockFormats: string
  /** 預覽列按鈕兩行字之間給報讀器的停頓（看不到）：繁中是全形逗號 */
  dockSep: string
  capacity: string
  size: string
}

export const previewCopy: PreviewCopy = {
  demo: '示範',
  hint: '輸入內容後即時預覽',
  download: '下載 ',
  copy: '複製',
  copied: '已複製',
  copiedMessage: '已複製 QR Code 圖片，可以直接貼進聊天或文件。',
  copyFailed: '複製沒有成功，請改用下載 PNG。',
  dockExpand: '看大圖',
  dockFormats: '其他下載格式',
  dockSep: '，',
  capacity: '內容過長，超出 QR Code 容量。請縮短內容，或把耐髒程度調低。',
  size: '圖片太小，放不下這些內容和四周的留白。請把圖片大小調大，或縮短內容。',
}

export interface UiCopy {
  privacy: PrivacyCopy
  generator: GeneratorCopy
  style: StyleCopy
  preview: PreviewCopy
}

export const uiCopyZh: UiCopy = { privacy: privacyCopy, generator: generatorCopy, style: styleCopy, preview: previewCopy }

const UI_COPY_KEY: InjectionKey<UiCopy> = Symbol('qrcode-studio-ui-copy')

/** 英文頁在 setup 裡呼叫，底下的元件就拿到英文那一份 */
export function provideUiCopy(copy: UiCopy): void {
  provide(UI_COPY_KEY, copy)
}

/** 共用元件取文案；沒有 provide 時（繁中頁、單獨掛元件的測試）是繁中 */
export function useUiCopy(): UiCopy {
  return inject(UI_COPY_KEY, uiCopyZh)
}
