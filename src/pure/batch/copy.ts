/**
 * 批次頁（/batch/、/en/batch/）的畫面文案：工具卡、檢查結果、下載、印標籤紙、對位測試頁。
 *
 * 繁中是原本寫在元件與 composable 裡的字串，一個字都沒改；英文是給美國使用者寫的（inventory、storage bins、
 * asset tags），不是逐字翻譯。純函式自己的錯誤訊息（連號、範本、逐列檢查、自訂尺寸、匯出）寫在各自的檔案裡，
 * 中英並排。這份只在批次頁的 chunk 裡（src/batch-gates.test.ts 驗批次的模組不被別頁 import）。
 *
 * 規格數字一律從 paper.ts 帶，不寫死（batch-gates.test.ts 會掃）；英文版的長度換成英寸，條碼的窄條維持 mm 並附 mil。
 */
import type { ErrorCorrectionLevel } from '@/types'
import type { Locale } from '@/i18n/locale'
import {
  CALIBRATION_IN, CALIBRATION_MM, MIN_LABEL_FONT_PT, MM_PER_IN, OFFSET_LIMIT_IN, OFFSET_LIMIT_MM, OFFSET_STEP_IN, OFFSET_STEP_MM,
  PRINTER_EDGE_FROM_MM, PRINTER_EDGE_MM, PRINTER_EDGE_RANGE, type PaperId,
} from './paper'
import { formatCount, MAX_PAD } from './sequence'

export type InputModeKey = 'paste' | 'lines' | 'sequence'

/** 「第幾列」的說法：繁中貼上是列、每行一筆是行、連號是筆；英文分單複數 */
export interface LineUnit { one: string; many: string }
export const LINE_UNITS: Record<Locale, Record<InputModeKey, LineUnit>> = {
  'zh-TW': { paste: { one: '列', many: '列' }, lines: { one: '行', many: '行' }, sequence: { one: '筆', many: '筆' } },
  en: { paste: { one: 'row', many: 'rows' }, lines: { one: 'line', many: 'lines' }, sequence: { one: 'item', many: 'items' } },
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const plural = (n: number, u: LineUnit) => (n === 1 ? u.one : u.many)
/** 英文版的長度：mm 換成英寸，最多三位小數 */
export const inches = (mm: number, digits = 2) => Math.round((mm / MM_PER_IN) * 10 ** digits) / 10 ** digits
const mil = (mm: number) => Math.round(mm / 0.0254)
const PAPER_NAME: Record<PaperId, string> = { a4: 'A4', letter: 'Letter' }

export interface HelpItem { strong: string; text: string }

/* ======================================================================
 * 工具卡（BatchTool.vue）與狀態（useBatch.ts）
 * ==================================================================== */

export interface BatchCopy {
  modeOptions: Record<InputModeKey, string>
  outputZip: string
  outputLabel: string
  ecLabel: Record<ErrorCorrectionLevel, string>
  qrRule: string
  qrAbout: string
  input: {
    title: string; modeName: string; mode: string; modeHelp: HelpItem[]
    pasteLabel: string; pastePlaceholder: string; pasteHint: string
    hasHeader: string; contentCol: string; nameCol: string; serial: string
    linesLabel: string; linesPlaceholder: string; linesHint: string; linesTab: string
    fileName: string; useLine: string
    prefix: string; suffix: string; suffixPlaceholder: string; start: string; step: string
    until: string; count: string; end: string; pad: string; useSequence: string
    padHint: string
    listSep: string
    sequenceTotal: (n: number) => string
    gtinHint: (symbology: string, digits: number) => string
    gtinStoreHint: string
    templateName: string; templateLabel: string; templateHelp: [string, string, string]; templatePlaceholder: string
    insert: string; templateExample: string
  }
  code: {
    title: string; helpName: string; helpHead: string; helpEnd: string; legend: string
    ecName: string; ec: string; ecHelp: string
  }
  output: {
    title: string; helpName: string; helpHead: string; help: [string, string]; legend: string
    formatName: string; formatHead: string; formatHelp: [string, string]; formatLegend: string
    sizeName: string; size: string; sizeHelp: string; sizeOption: (px: number) => string
    scaleName: string; scale: string; scaleHelp: string
    labelHint: string
  }
  check: {
    title: string; empty: string
    total: (n: number, u: LineUnit) => string
    ready: (n: number) => string
    failed: (n: number, u: LineUnit) => string
    duplicates: (n: number) => string
    sep: string
    appended: (n: number, digits: number) => string
    storeCode: string
    code39Shift: (n: number) => string
    issueLine: (line: number, u: LineUnit) => string
    quote: [string, string]
    issueSep: string
    moreIssues: (n: number, u: LineUnit) => string
    onErrorLegend: (u: LineUnit) => string
    onErrorBlock: string
    onErrorSkip: (u: LineUnit) => string
    duplicateTitle: string
    duplicateLine: (lines: number[], more: boolean, u: LineUnit) => string
    duplicateMore: (n: number) => string
  }
  download: {
    title: string
    previewEmpty: (n: number) => string
    button: (n: number, format: 'png' | 'svg') => string
    cancel: string
    progressLabel: (percent: number) => string
    progress: (done: number, total: number) => string
    footer: (max: number, firstName: string | undefined) => string
    previewQr: (line: number) => string
    previewBarcode: (line: number) => string
    previewMore: (shown: number, total: number) => string
  }
  state: {
    columnHead: (letter: string, head: string) => string
    columnSample: (letter: string, sample: string) => string
    tooMany: (max: number, n: string) => string
    tooManyTruncated: (max: number) => string
    emptySequence: string
    emptyList: string
    fixFirst: (n: number, u: LineUnit) => string
    nothingReady: string
    downloaded: (n: number, format: 'png' | 'svg', skipped: number, u: LineUnit) => string
    cancelled: string
    failed: string
  }
}

export const batchCopy: Record<Locale, BatchCopy> = {
  'zh-TW': {
    modeOptions: { paste: '從 Excel 貼上', lines: '每行一筆', sequence: '連號' },
    outputZip: '下載 ZIP',
    outputLabel: '印成 A4 標籤紙',
    ecLabel: { L: '低：圖案最簡單（螢幕上用）', M: '中：一般用途（建議）', Q: '較高：戶外、貼紙', H: '最高：容易磨損的地方' },
    qrRule: '可以放網址或文字，中文也可以；內容越長，方塊越多越細。',
    qrAbout: '：網址、文字、Google 表單連結，手機相機就能掃。',
    input: {
      title: '輸入清單',
      modeName: '輸入方式',
      mode: '輸入方式',
      modeHelp: [
        { strong: '從 Excel 貼上', text: '：在 Excel 或 Google 試算表選取整塊儲存格（可以含欄名那一列）複製後貼上，再選哪一欄要做成碼、哪一欄當檔名。' },
        { strong: '每行一筆', text: '：一行一個網址或編號，空白行會略過。' },
        { strong: '連號', text: '：前綴加數字加後綴，例如 TP-0001 到 TP-0500，不必先在 Excel 拉好。' },
      ],
      pasteLabel: '貼上 Excel 的儲存格',
      pastePlaceholder: '財產編號\t名稱\t保管單位\nTP-0001\t筆記型電腦\t總務處\nTP-0002\t投影機\t教務處',
      pasteHint: '欄與欄之間是 Tab（直接從試算表複製就是），儲存格裡有換行也沒關係。',
      hasHeader: '第一列是欄名（不做成碼）',
      contentCol: '內容欄（做成碼的那一欄）',
      nameCol: '檔名欄',
      serial: '流水號（001、002…）',
      linesLabel: '一行一筆',
      linesPlaceholder: 'https://example.com/menu/table-01\nhttps://example.com/menu/table-02',
      linesHint: '一行做成一張，空白行會略過。',
      linesTab: '有幾行裡有 Tab，看起來是從試算表貼了好幾欄。要選哪一欄做成碼，請改用「從 Excel 貼上」。',
      fileName: '檔名',
      useLine: '用這一行的內容',
      prefix: '前綴',
      suffix: '後綴',
      suffixPlaceholder: '（選填）',
      start: '起始值',
      step: '增量',
      until: '做到哪裡',
      count: '數量',
      end: '結束值',
      pad: '補零到幾位',
      useSequence: '用連號',
      padHint: `補零：4 位時 1 會寫成 0001，0 或留白就不補（最多 ${MAX_PAD} 位）。`,
      listSep: '、',
      sequenceTotal: n => `（共 ${formatCount(n)} 筆）`,
      gtinHint: (symbology, digits) => `${symbology} 請讓連號產生 ${digits} 位數字，每一筆的檢查碼會自動算好補上。`,
      gtinStoreHint: '例如店內碼：前綴 20、補零 10 位。',
      templateName: '內容範本',
      templateLabel: '內容範本（選填）',
      templateHelp: [
        '每一張都是同一個網址、只有最後的編號不一樣時用：把網址貼進來，編號的位置改成 {編號}，例如 https://example.com/asset/{編號}。',
        'Google 表單的預填連結也可以：在表單的「取得預先填入的連結」隨便填一個示範值、複製連結，把網址裡的示範值換成 {編號}。',
        '範本是網址時，代入的值會自動轉成網址可用的寫法，空白、中文、& 這些字不會把網址弄壞。不需要就留白，每一列的值會直接做成碼。',
      ],
      templatePlaceholder: 'https://example.com/asset/{編號}',
      insert: '插入',
      templateExample: '第一張的內容：',
    },
    code: {
      title: '碼的種類',
      helpName: '碼的種類',
      helpHead: 'QR Code 或條碼',
      helpEnd: '不確定用哪個：要給手機掃開網頁就選 QR Code；財產、倉儲這類給掃描槍讀編號的選 Code 128；商品零售結帳用 EAN-13。',
      legend: '碼的種類',
      ecName: '耐髒程度',
      ec: '耐髒程度（容錯等級）',
      ecHelp: '被弄髒、磨損還掃不掃得出來：L、M、Q、H 被遮住約 7%、15%、25%、30% 還能掃。等級越高，方塊越多越細；一般用途維持 M，貼在戶外或容易磨損的標籤選 Q。',
    },
    output: {
      title: '輸出方式',
      helpName: '輸出方式',
      helpHead: '下載圖檔，或直接印在標籤紙上',
      help: [
        '下載 ZIP：每一筆一個圖檔，打包成一個 ZIP，適合放進 Word、簡報或送印刷廠。',
        '印成 A4 標籤紙：照鶴屋、龍德的標籤紙型號排好，碼旁邊可以加一到三行字，用瀏覽器直接印在貼紙上；可以從第幾格開始印，用掉一半的標籤紙也能接著用。',
      ],
      legend: '輸出方式',
      formatName: '下載格式',
      formatHead: '每一張的檔案格式',
      formatHelp: [
        'PNG 是一般圖片，Word、簡報、通訊軟體都能直接用。SVG 是向量圖，放大縮小都不會糊，適合送印刷與排版軟體；條碼的 SVG 帶有毫米尺寸，置入排版軟體就是標準大小。',
        '全部的檔案會打包成一個 ZIP，解壓縮後就是一張一張的圖。',
      ],
      formatLegend: '下載格式',
      sizeName: '圖片大小',
      size: '圖片大小',
      sizeHelp: '每張 PNG 的寬高（像素），四周至少 4 格小方塊寬的留白（靜區）也算在裡面。以一般印刷品的精細度（300 dpi）換算，600 像素大約可以印 5 公分、1000 像素大約 8.5 公分。SVG 是向量圖，這個數字只是置入文件時的預設大小。',
      sizeOption: px => `${px} × ${px} 像素`,
      scaleName: 'PNG 清晰度',
      scale: 'PNG 清晰度',
      scaleHelp: '網頁用、一般列印、高品質印刷分別讓最細的線佔 2、4、8 像素。PNG 檔不會記錄該印多大，拉進 Word 這類軟體隨手縮放，線會被壓得太細而掃不到；需要精確尺寸時請下載 SVG。',
      labelHint: '標籤紙型號、從第幾格開始、每格的字與位移，在下方「印成 A4 標籤紙」設定。',
    },
    check: {
      title: '檢查結果',
      empty: '輸入清單之後，這裡會逐列檢查：太長、位數不對、檢查碼（條碼最後一位）不符、不支援的字元、空白。',
      total: (n, u) => `共 ${formatCount(n)} ${u.one}：`,
      ready: n => `${formatCount(n)} 筆可以產生`,
      failed: (n, u) => `${formatCount(n)} ${u.one}有問題`,
      duplicates: n => `${formatCount(n)} 組內容重複`,
      sep: '、',
      appended: (n, digits) => `${formatCount(n)} 筆只有 ${digits} 位，已自動補上檢查碼，下面的預覽與檔名都是補好的完整號碼。`,
      storeCode: '20 到 29 開頭的 EAN-13 是店內碼，只在你自己的店裡有效，不能拿去通路上架；要上架請向 GS1 台灣申請正式的商品條碼。',
      code39Shift: n => `有 ${formatCount(n)} 筆內容含 $ / + % 這幾個符號，有些掃描器會把它們跟下一個字合在一起讀，讀出來可能跟你輸入的不一樣。要給機器讀取時，請先實際掃一張，或改用 Code 128。`,
      issueLine: (line, u) => `第 ${line} ${u.one}`,
      quote: ['「', '」'],
      issueSep: '：',
      moreIssues: (n, u) => `還有 ${formatCount(n)} ${u.one}有問題沒列出來。`,
      onErrorLegend: u => `有問題的${u.one}要怎麼處理`,
      onErrorBlock: '全部修好才產生',
      onErrorSkip: u => `略過有問題的${u.one}`,
      duplicateTitle: '內容重複（只是提醒，照樣會產生）：',
      duplicateLine: (lines, more, u) => `第 ${lines.join('、')}${more ? ' 等' : ''} ${u.one}都是`,
      duplicateMore: n => `還有 ${formatCount(n)} 組。`,
    },
    download: {
      title: '預覽與下載',
      previewEmpty: n => `可以產生的前 ${n} 張會顯示在這裡。`,
      button: (n, format) => (n ? `下載 ZIP（${formatCount(n)} 張 ${format === 'png' ? 'PNG' : 'SVG'}）` : '下載 ZIP'),
      cancel: '取消',
      progressLabel: percent => `正在產生，已完成 ${percent}%`,
      progress: (done, total) => `正在產生 ${formatCount(done)} / ${formatCount(total)} 張…`,
      footer: (max, first) => `一次最多 ${formatCount(max)} 筆；更多請分批產生。檔名${first ? `像是 ${first}` : '來自檔名欄或流水號'}，重複的會自動加上 (2)、(3)。`,
      previewQr: line => `第 ${line} 筆的 QR Code`,
      previewBarcode: line => `第 ${line} 筆的條碼`,
      previewMore: (shown, total) => `預覽前 ${shown} 張，下載的 ZIP 裡有全部 ${formatCount(total)} 張。`,
    },
    state: {
      columnHead: (letter, head) => `${letter} 欄：${head}`,
      columnSample: (letter, sample) => `${letter} 欄${sample ? `（例：${sample}）` : ''}`,
      tooMany: (max, n) => `一次最多 ${formatCount(max)} 筆，目前有 ${n} 筆，請分批產生。`,
      tooManyTruncated: max => `超過 ${formatCount(max)}`,
      emptySequence: '請設定連號。',
      emptyList: '請先貼上清單。',
      fixFirst: (n, u) => `有 ${formatCount(n)} ${u.one}要先修正，或改選「略過有問題的${u.one}」。`,
      nothingReady: '沒有可以產生的列。',
      downloaded: (n, format, skipped, u) => `已下載 ${formatCount(n)} 張${format === 'png' ? ' PNG' : ' SVG'}${skipped ? `，略過 ${formatCount(skipped)} ${u.one}有問題的` : ''}。`,
      cancelled: '已取消，沒有下載任何檔案。',
      failed: '產生失敗，請減少筆數再試一次。',
    },
  },
  en: {
    modeOptions: { paste: 'Paste from Excel or CSV', lines: 'One per line', sequence: 'Number sequence' },
    outputZip: 'Download ZIP',
    outputLabel: 'Print labels',
    ecLabel: { L: 'Low: simplest pattern (screens)', M: 'Medium: everyday use (recommended)', Q: 'Quartile: stickers, outdoors', H: 'High: labels that get worn' },
    qrRule: 'Links or any text. The longer the content, the more and smaller the squares.',
    qrAbout: ': links, text and Google Forms links. Any phone camera can scan it.',
    input: {
      title: 'Your list',
      modeName: 'input options',
      mode: 'Input',
      modeHelp: [
        { strong: 'Paste from Excel or CSV', text: ': select the cells in Excel or Google Sheets (header row included, if you like), copy and paste them here, then pick which column goes into each code and which one names the files. For a CSV file, open it in Excel or Google Sheets first and copy the cells.' },
        { strong: 'One per line', text: ': one link or ID per line. Blank lines are skipped.' },
        { strong: 'Number sequence', text: ': a prefix, a number and a suffix, such as TP-0001 to TP-0500, without filling a spreadsheet first.' },
      ],
      pasteLabel: 'Paste cells from Excel or Google Sheets',
      pastePlaceholder: 'Asset tag\tItem\tLocation\nA-1001\tLaptop\tFront office\nA-1002\tProjector\tRoom 204',
      pasteHint: 'Columns are separated by tabs, which is what you get when you copy from a spreadsheet. Line breaks inside a cell are fine.',
      hasHeader: 'First row is a header (not turned into a code)',
      contentCol: 'Code column (what goes into each code)',
      nameCol: 'File name column',
      serial: 'Numbered (001, 002…)',
      linesLabel: 'One per line',
      linesPlaceholder: 'https://example.com/menu/table-01\nhttps://example.com/menu/table-02',
      linesHint: 'Each line becomes one code. Blank lines are skipped.',
      linesTab: 'Some lines contain tabs, so it looks like several spreadsheet columns were pasted. To choose which column goes into the codes, switch to "Paste from Excel or CSV".',
      fileName: 'File names',
      useLine: 'Use the line itself',
      prefix: 'Prefix',
      suffix: 'Suffix',
      suffixPlaceholder: '(optional)',
      start: 'Start',
      step: 'Step',
      until: 'Stop at',
      count: 'Count',
      end: 'End number',
      pad: 'Zero padding (digits)',
      useSequence: 'Use the sequence',
      padHint: `With 4 digits, 1 becomes 0001. Leave it blank or 0 for no padding (up to ${MAX_PAD} digits).`,
      listSep: ', ',
      sequenceTotal: n => ` (${formatCount(n)} in total)`,
      gtinHint: (symbology, digits) => `For ${symbology}, make the sequence produce ${digits} digits. The check digit is calculated and added to each one.`,
      gtinStoreHint: ' For in-store codes, for example, use prefix 20 and zero padding 10.',
      templateName: 'template',
      templateLabel: 'URL template (optional)',
      templateHelp: [
        'Use this when every code is the same link with a different ID at the end: paste the link and put {id} where the ID goes, for example https://example.com/asset/{id}.',
        'Google Forms pre-filled links work too: in your form, choose "Get pre-filled link", enter a sample answer, copy the link and replace the sample answer in the URL with {id}.',
        'When the template is a link, each value is encoded for URLs, so spaces, & and other symbols will not break it. Leave the field blank to put each value in its code as it is.',
      ],
      templatePlaceholder: 'https://example.com/asset/{id}',
      insert: 'Insert ',
      templateExample: 'First code: ',
    },
    code: {
      title: 'Code type',
      helpName: 'code types',
      helpHead: 'QR code or barcode',
      helpEnd: 'Not sure? To open a web page from a phone, choose QR code. For inventory, storage bins and asset tags read with a barcode scanner, choose Code 128. For retail checkout, use EAN-13.',
      legend: 'Code type',
      ecName: 'error correction',
      ec: 'Error correction',
      ecHelp: 'How much of the code can be dirty or worn and still scan: about 7%, 15%, 25% and 30% for L, M, Q and H. Higher levels add more, smaller squares. M suits most uses; choose Q for labels that live outdoors or get handled a lot.',
    },
    output: {
      title: 'Output',
      helpName: 'output options',
      helpHead: 'Download image files, or print straight onto label sheets',
      help: [
        'Download ZIP: one image file per item, all in a single ZIP, ready for Word, slides or a print shop.',
        'Print labels: lays the codes out on US Letter label sheets in the same sizes as common Avery products (or on A4), adds one to three lines of text to each label and prints from your browser. You can start at any label, so a half-used sheet still works.',
      ],
      legend: 'Output',
      formatName: 'file formats',
      formatHead: 'File format for each code',
      formatHelp: [
        'PNG is a regular image that works in Word, slides and chat apps. SVG is a vector image that stays sharp at any size, best for print and design software; barcode SVGs carry their real size, so they place at the standard size.',
        'All the files come in one ZIP. Unzip it to get one image per item.',
      ],
      formatLegend: 'File format',
      sizeName: 'image size',
      size: 'Image size',
      sizeHelp: 'Width and height of each PNG in pixels, including the blank margin (quiet zone) of at least 4 squares on every side. At print quality (300 dpi), 600 pixels prints about 2 inches wide and 1000 pixels about 3.3 inches. SVG is a vector image, so this only sets its default size in documents.',
      sizeOption: px => `${px} × ${px} px`,
      scaleName: 'PNG resolution',
      scale: 'PNG resolution',
      scaleHelp: 'Web, standard print and high-quality print make the narrowest bar 2, 4 and 8 pixels wide. A PNG does not remember how big it should print, and resizing it in Word or a similar app can make the bars too thin to scan. When the size must be exact, download SVG.',
      labelHint: 'Choose the label sheet, starting label, text and offset under "Print labels" below.',
    },
    check: {
      title: 'Check',
      empty: 'Once you add a list, every row is checked here: too long, the wrong number of digits, a check digit (the last digit of a barcode) that does not match, characters a barcode cannot hold, and blanks.',
      total: (n, u) => `${formatCount(n)} ${plural(n, u)}: `,
      ready: n => `${formatCount(n)} ready`,
      failed: n => `${formatCount(n)} with problems`,
      duplicates: n => `${formatCount(n)} ${n === 1 ? 'value appears' : 'values appear'} more than once`,
      sep: ', ',
      appended: (n, digits) => `${formatCount(n)} had only ${digits} digits, so the check digit was added. The preview and file names below use the complete numbers.`,
      storeCode: 'EAN-13 numbers starting with 20 to 29 are for use inside your own business only, not for products sold through retailers. For retail products, get official barcodes from GS1 US (or the GS1 office in your country).',
      code39Shift: n => `${formatCount(n)} contain $ / + % characters. Some scanners read them together with the next character, so what they read may not match your list. If a machine will read these, test-scan one first or switch to Code 128.`,
      issueLine: (line, u) => `${cap(u.one)} ${line}`,
      quote: [' "', '"'],
      issueSep: ': ',
      moreIssues: (n, u) => `${formatCount(n)} more ${plural(n, u)} with problems are not listed.`,
      onErrorLegend: u => `What to do with ${u.many} that have problems`,
      onErrorBlock: 'Fix them all first',
      onErrorSkip: u => `Skip ${u.many} with problems`,
      duplicateTitle: 'Duplicates (just a heads-up, they are still generated):',
      duplicateLine: (lines, more, u) => `${cap(lines.length === 1 ? u.one : u.many)} ${lines.join(', ')}${more ? ' and more' : ''} are all`,
      duplicateMore: n => `${formatCount(n)} more.`,
    },
    download: {
      title: 'Preview and download',
      previewEmpty: n => `The first ${n} codes appear here.`,
      button: (n, format) => (n ? `Download ZIP (${formatCount(n)} ${format === 'png' ? 'PNG' : 'SVG'} ${n === 1 ? 'file' : 'files'})` : 'Download ZIP'),
      cancel: 'Cancel',
      progressLabel: percent => `Generating, ${percent}% done`,
      progress: (done, total) => `Generating ${formatCount(done)} of ${formatCount(total)}…`,
      footer: (max, first) => `Up to ${formatCount(max)} at a time; split bigger lists into batches. File names ${first ? `look like ${first}` : 'come from the file name column or a number'}, and repeated names get (2), (3) added.`,
      previewQr: line => `QR code ${line}`,
      previewBarcode: line => `Barcode ${line}`,
      previewMore: (shown, total) => `Showing the first ${shown}. The ZIP contains all ${formatCount(total)}.`,
    },
    state: {
      columnHead: (letter, head) => `Column ${letter}: ${head}`,
      columnSample: (letter, sample) => `Column ${letter}${sample ? ` (e.g. ${sample})` : ''}`,
      tooMany: (max, n) => `You can make up to ${formatCount(max)} at a time, and this list has ${n}. Please split it into batches.`,
      tooManyTruncated: max => `more than ${formatCount(max)}`,
      emptySequence: 'Set up the sequence first.',
      emptyList: 'Paste your list first.',
      fixFirst: (n, u) => `Fix ${formatCount(n)} ${plural(n, u)} first, or choose "Skip ${u.many} with problems".`,
      nothingReady: 'There is nothing to generate yet.',
      downloaded: (n, format, skipped, u) => `Downloaded ${formatCount(n)} ${format === 'png' ? 'PNG' : 'SVG'} ${n === 1 ? 'file' : 'files'}${skipped ? `, skipping ${formatCount(skipped)} ${plural(skipped, u)} with problems` : ''}.`,
      cancelled: 'Cancelled. Nothing was downloaded.',
      failed: 'Something went wrong. Try again with fewer items.',
    },
  },
}

/* ======================================================================
 * 印標籤紙（LabelPrint.vue、LabelSheets.vue、CalibrationRuler.vue、useBatchLabels.ts）
 * ==================================================================== */

export interface LabelGridInfo {
  per: number; columns: number; rows: number
  widthMm: number; heightMm: number; topMm: number; leftMm: number; rightMm: number; bottomMm: number
  colGapMm: number; rowGapMm: number
}

export interface LabelCopy {
  title: string
  sheetName: string; sheet: string; sheetHelp: [string, string]
  custom: string
  sheetInfo: (g: LabelGridInfo) => string
  customLegend: string
  customFields: Record<'columns' | 'rows' | 'labelWidthMm' | 'labelHeightMm' | 'topMm' | 'leftMm' | 'colGapMm' | 'rowGapMm', string>
  paperLabel: string
  paperOptions: Record<PaperId, string>
  avoidEdge: string
  start: string; copies: string
  startHint: (start: number, row: number, column: number) => string
  copiesHint: (max: number) => string
  linesName: string; linesHead: string; linesHelp: (u: LineUnit) => [string, string]; linesGroup: string
  lineLabel: (i: number) => string
  lineNone: string
  lineValue: Record<InputModeKey, string>
  font: string; fontMissingSuffix: string
  fontMissing: (label: string, note: string) => string
  offsetName: string; offsetHead: string; offsetHelp: [string, string, string]
  offsetX: string; offsetY: string; remember: string
  /** 位移欄位的單位與範圍（英文版用英寸） */
  offsetInput: { min: number; max: number; step: number }
  targetName: string; target: string; targetHelp: string
  targetLabels: string; targetTest: string
  printButton: (target: 'labels' | 'test', sheets: number, blocked: boolean, paper: PaperId) => string
  summary: (n: number, copies: number, sheets: number, paper: PaperId) => string
  printTips: (paper: PaperId) => string
  printHelpName: string; printHelp: [string, string]
  // 排好之後的畫面（LabelSheets.vue）
  sheetAria: (page: number, paper: PaperId) => string
  codeName: (kind: 'qr' | 'barcode', line: number | null, u: LineUnit) => string
  testAria: string
  testInfo: (sheetName: string, per: number, x: number, y: number) => string
  testHow: string
  more: (shown: number, total: number) => string
  showAll: string
  ruler: { aria: string; caption: string }
  // 狀態與提醒（useBatchLabels.ts）
  sheetTitle: (brand: string, model: string) => string
  customTitle: string
  blocked: Record<'no-room' | 'barcode-narrow' | 'barcode-short' | 'qr-tiny', string>
  blockedOther: string
  whichLines: (lines: readonly number[], u: LineUnit) => string
  notice: {
    noRoom: (which: string) => string
    narrow: (which: string, xMm: number, symbology: string, minMm: number, ean: boolean) => string
    short: (which: string) => string
    qrTiny: (which: string, moduleMm: number) => string
    thin: (which: string, xMm: number, warnMm: number | undefined, itf: boolean) => string
    qrSmall: (which: string, moduleMm: number) => string
    truncated: (which: string) => string
    edgeAvoided: (n: number) => string
    edgeWarn: (n: number) => string
  }
  tooManyCells: (max: number, n: number) => string
  someBlocked: string
}

const fmt = (n: number) => n.toFixed(2).replace(/0$/, '')
const signedIn = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}`
const signedMm = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`
/** 英文版：「Rows 3, 5 and 8」；超過 8 個只列前 8 個再寫還有幾個 */
function whichLinesEn(lines: readonly number[], u: LineUnit): string {
  const sorted = [...lines].sort((a, b) => a - b)
  if (sorted.length === 1) return `${cap(u.one)} ${sorted[0]}`
  const shown = sorted.slice(0, 8)
  const more = sorted.length - shown.length
  return `${cap(u.many)} ${shown.join(', ')}${more ? ` and ${formatCount(more)} more` : ''}`
}

const EDGE_RANGE_EN = `${inches(PRINTER_EDGE_FROM_MM)} to ${inches(PRINTER_EDGE_MM)} in (${PRINTER_EDGE_FROM_MM} to ${PRINTER_EDGE_MM} mm)`

export const labelCopy: Record<Locale, LabelCopy> = {
  'zh-TW': {
    title: '印成 A4 標籤紙',
    sheetName: '標籤紙型號',
    sheet: '標籤紙型號',
    sheetHelp: [
      '型號印在標籤紙的包裝上，例如鶴屋 L3464、龍德 LD-8108。格子的位置照兩家官網提供的 Word 範本設定；同樣格數的型號，邊界可能差到 2 mm，請選跟手上一樣的型號。',
      '格子尺寸寫成寬 × 高（mm）。全版切割是整張紙都是標籤、四邊沒有留白。找不到你的型號就選「自訂尺寸」，用尺量第一張標籤離紙的上緣與左緣、標籤的寬高與標籤之間的空隙。',
    ],
    custom: '自訂尺寸',
    sheetInfo: (g) => {
      const gaps = [g.colGapMm ? `欄距 ${g.colGapMm}` : '', g.rowGapMm ? `列距 ${g.rowGapMm}` : ''].filter(Boolean).join('、')
      return `每張 ${g.per} 格（${g.columns} 欄 × ${g.rows} 列），每格寬 ${g.widthMm} × 高 ${g.heightMm} mm；`
        + `邊界：上 ${g.topMm}、左 ${g.leftMm}、右 ${g.rightMm}、下 ${g.bottomMm} mm${gaps ? `；${gaps} mm` : ''}。`
    },
    customLegend: '自訂尺寸（mm）',
    customFields: { columns: '欄數', rows: '列數', labelWidthMm: '單格寬', labelHeightMm: '單格高', topMm: '上邊界', leftMm: '左邊界', colGapMm: '欄距', rowGapMm: '列距' },
    paperLabel: '紙張',
    paperOptions: { a4: 'A4', letter: 'Letter' },
    avoidEdge: '最外圈的格子往內縮，避開印表機印不到的紙邊',
    start: '從第幾格開始印',
    copies: '每筆印幾份',
    startHint: (start, row, column) => (start === 1
      ? '從左上角第 1 格開始。用掉一部分的標籤紙，填第一張還沒用的格子號碼，前面的格子會留白。'
      : `第 ${start} 格是第 ${row} 列第 ${column} 欄，前面 ${start - 1} 格留白（只有第一張）。`),
    copiesHint: max => `每一筆連續印幾張一樣的（最多 ${max} 份），例如一張貼設備、一張貼財產卡。`,
    linesName: '每格的字',
    linesHead: '每格的字（最多三行）',
    linesHelp: u => [
      '從貼上的欄位選要印在碼旁邊的字，例如財產編號、品名、保管單位；第一行粗一點。格子寬時字在 QR Code 右邊，窄時在下面；條碼的號碼固定印在條碼下方。',
      `每一行依長度自動縮小，縮到最小還放不下就截斷、以「…」結尾，上面會列出是哪幾${u.one}。`,
    ],
    linesGroup: '每格的字',
    lineLabel: i => `第 ${i} 行`,
    lineNone: '（不印）',
    lineValue: { paste: '內容欄的值', lines: '這一行的內容', sequence: '連號' },
    font: '字型',
    fontMissingSuffix: '（這台電腦沒有）',
    fontMissing: (label, note) => `這台電腦沒有${label}，預覽與列印${note}。要印出${label}，請用有這套字型的 Windows 電腦列印。`,
    offsetName: '位移微調',
    offsetHead: '位移微調（mm）',
    offsetHelp: [
      `印出來整批往同一個方向偏時用：內容偏左，「左右」填正數往右移；偏上，「上下」填正數往下移。最多 ±${OFFSET_LIMIT_MM} mm，可以填到 ${OFFSET_STEP_MM} mm。`,
      '先在下面選「對位測試頁」用白紙印一張，疊在標籤紙上對著光看，格線離標籤的切線差多少就填多少，再印一次確認。',
      '勾選「記住這台印表機的位移」時，只在這台電腦的瀏覽器存左右、上下兩個數字，不存清單；取消勾選就刪掉。',
    ],
    offsetX: '左右（正數往右）',
    offsetY: '上下（正數往下）',
    remember: '記住這台印表機的位移',
    offsetInput: { min: -OFFSET_LIMIT_MM, max: OFFSET_LIMIT_MM, step: OFFSET_STEP_MM },
    targetName: '要印什麼',
    target: '要印什麼',
    targetHelp: `對位測試頁只印每一格的框線與格號，中間有一把 ${CALIBRATION_MM / 10} 公分校正尺。第一次用某個型號、或換了印表機時，先用白紙印這一頁，疊在標籤紙上對著光看：格線落在標籤的切線上，再放標籤紙印；校正尺量起來不是剛好 ${CALIBRATION_MM / 10} 公分，就是列印設定有縮放。`,
    targetLabels: '標籤',
    targetTest: '對位測試頁',
    printButton: (target, sheets, blocked) => (target === 'test'
      ? '印對位測試頁（1 張 A4）'
      : sheets && !blocked ? `列印標籤（${formatCount(sheets)} 張 A4）` : '列印標籤'),
    summary: (n, copies, sheets) => `共 ${formatCount(n)} 筆${copies > 1 ? ` × ${copies} 份` : ''}，印 ${formatCount(sheets)} 張 A4。`,
    printTips: () => '列印時紙張選 A4、縮放選「實際大小（100%）」、邊界選「無」，不要選「符合頁面大小」。',
    printHelpName: '列印設定',
    printHelp: [
      'Edge 與 Chrome：列印視窗按「更多設定」，縮放選「預設」或自訂 100，不要選「符合頁面大小」「符合可列印區域」這類自動縮放；邊界選「無」，「頁首和頁尾」取消勾選。標籤紙放進印表機前，先看紙匣上的圖示，確認要印的那一面朝哪裡、紙的上緣朝哪裡。',
      `印出來後量一下對位測試頁的校正尺：剛好 ${CALIBRATION_MM / 10} 公分就是實際大小。想存成 PDF，在「目的地」選「另存為 PDF」即可，本站不另外產生 PDF 檔。`,
    ],
    sheetAria: page => `第 ${page} 張 A4`,
    codeName: (kind, line, u) => `第 ${line ?? ''} ${u.one}的${kind === 'qr' ? ' QR Code' : '條碼'}`,
    testAria: '對位測試頁',
    testInfo: (sheetName, per, x, y) => `對位測試頁｜${sheetName}（${per} 格）｜位移：左右 ${signedMm(x)} mm、上下 ${signedMm(y)} mm`,
    testHow: '用白紙印這一頁，疊在標籤紙上對著光看，格線要落在標籤的切線上。差多少就在「位移微調」填多少，再印一次確認。',
    more: (shown, total) => `螢幕上先預覽前 ${shown} 張，列印時會印出全部 ${formatCount(total)} 張。`,
    showAll: '顯示全部',
    ruler: { aria: `${CALIBRATION_MM / 10} 公分校正尺`, caption: `校正尺：剛好 ${CALIBRATION_MM / 10} 公分就是實際大小列印` },
    sheetTitle: (brand, model) => `${brand} ${model}`,
    customTitle: '自訂尺寸',
    blocked: { 'no-room': '放不下碼，不會印', 'barcode-narrow': '條碼太窄，不會印', 'barcode-short': '條碼太矮，不會印', 'qr-tiny': 'QR Code 太小，不會印' },
    blockedOther: '不會印',
    whichLines: (lines, u) => {
      const sorted = [...lines].sort((a, b) => a - b)
      const shown = sorted.slice(0, 8).join('、')
      return `第 ${shown}${sorted.length > 8 ? ` 等 ${formatCount(sorted.length)}` : ''} ${u.one}`
    },
    notice: {
      noRoom: which => `${which}：格子扣掉四周的留白之後放不下碼。請選大一點的標籤紙，或減少每格的文字。`,
      narrow: (which, xMm, symbology, minMm, ean) => `${which}：條碼在這個格子裡太窄，最細的線只有 ${fmt(xMm)} mm，${symbology} 至少要 ${minMm} mm${ean ? '（標準尺寸的 80%）' : ''}才掃得到。請選寬一點的標籤紙、縮短內容，或改用 QR Code。`,
      short: which => `${which}：條碼太矮，掃描時要對得很準。請減少每格的文字行數，或選高一點的標籤紙。`,
      qrTiny: (which, moduleMm) => `${which}：QR Code 的小方塊只有 ${fmt(moduleMm)} mm，印出來手機很難掃。請縮短內容、把耐髒程度調低、減少每格的文字，或選大一點的標籤紙。`,
      thin: (which, xMm, warnMm, itf) => {
        const advice = itf
          ? `外箱給物流掃描時建議 ${warnMm} mm 以上（選 2 欄的大標籤）`
          : `建議 ${warnMm} mm 以上，比較舊的掃描槍可能要多掃幾次`
        return `${which}：條碼最細的線只有 ${fmt(xMm)} mm，${advice}。整批印之前請先實際掃一張。`
      },
      qrSmall: (which, moduleMm) => `${which}：QR Code 的小方塊只有 ${fmt(moduleMm)} mm，手機要靠近一點才掃得到。整批印之前請先實際掃一張。`,
      truncated: which => `${which}的字太長，縮到最小字級（${MIN_LABEL_FONT_PT} pt）還放不下，已截斷，標籤上會以「…」結尾。可以改短、少印一行，或選寬一點的標籤紙。`,
      edgeAvoided: n => `這個型號有 ${n} 格貼近紙邊，多數印表機印不到紙邊 ${PRINTER_EDGE_RANGE}：這幾格的碼與字已經自動往內縮，避開印不到的範圍。`,
      edgeWarn: n => `這個型號有 ${n} 格貼近紙邊，多數印表機印不到紙邊 ${PRINTER_EDGE_RANGE}，碼與字可能被切掉。印表機能無邊界列印時才關掉內縮。`,
    },
    tooManyCells: (max, n) => `一次最多印 ${formatCount(max)} 格，目前要 ${formatCount(n)} 格（含留白的格子與每筆的份數），請分批列印。`,
    someBlocked: '有些標籤印出來會掃不到，請先照上面的說明調整。',
  },
  en: {
    title: 'Print labels',
    sheetName: 'label sheets',
    sheet: 'Label sheet',
    sheetHelp: [
      'Pick the sheet that matches the product number on your label pack. The Letter options are laid out like the Avery templates with the same number (this tool is not affiliated with Avery). Sheets with the same number of labels can still have different margins, so choose the exact one.',
      'Sizes are width × height. If your sheet is not listed, choose "Custom size" and measure the distance from the top and left edges of the sheet to the first label, the label size, and the gaps between labels.',
    ],
    custom: 'Custom size',
    sheetInfo: (g) => {
      const gaps = [g.colGapMm ? `column gap ${inches(g.colGapMm, 3)}` : '', g.rowGapMm ? `row gap ${inches(g.rowGapMm, 3)}` : ''].filter(Boolean).join(', ')
      return `${g.per} per sheet (${g.columns} columns × ${g.rows} rows), each ${inches(g.widthMm, 3)} × ${inches(g.heightMm, 3)} in. `
        + `Margins: top ${inches(g.topMm, 3)}, left ${inches(g.leftMm, 3)}, right ${inches(g.rightMm, 3)}, bottom ${inches(g.bottomMm, 3)} in${gaps ? `; ${gaps} in` : ''}.`
    },
    customLegend: 'Custom size (inches)',
    customFields: { columns: 'Columns', rows: 'Rows', labelWidthMm: 'Label width', labelHeightMm: 'Label height', topMm: 'Top margin', leftMm: 'Left margin', colGapMm: 'Column gap', rowGapMm: 'Row gap' },
    paperLabel: 'Paper',
    paperOptions: { letter: 'Letter (8.5 × 11 in)', a4: 'A4 (210 × 297 mm)' },
    avoidEdge: 'Pull the outer labels in, away from the edge most printers cannot reach',
    start: 'Start at label',
    copies: 'Copies of each',
    startHint: (start, row, column) => (start === 1
      ? 'Starts at the top left (label 1). On a partly used sheet, enter the first unused label and the ones before it stay blank.'
      : `Label ${start} is row ${row}, column ${column}. The ${start - 1} before it stay blank (first sheet only).`),
    copiesHint: max => `How many identical labels to print for each item (up to ${max}), for example one for the item and one for its storage bin.`,
    linesName: 'label text',
    linesHead: 'Text on each label (up to three lines)',
    linesHelp: u => [
      'Choose what to print next to the code from your columns, such as an asset tag, item name or location. The first line is bold. On wide labels the text sits to the right of a QR code, on narrow ones below it; a barcode always has its number printed underneath.',
      `Each line shrinks to fit. If it still does not fit at the smallest size, it is cut off with "…" and the ${u.many} affected are listed above.`,
    ],
    linesGroup: 'Text on each label',
    lineLabel: i => `Line ${i}`,
    lineNone: '(none)',
    lineValue: { paste: 'Code column value', lines: 'The line itself', sequence: 'Sequence number' },
    font: 'Font',
    fontMissingSuffix: ' (not on this device)',
    fontMissing: (label, note) => `${label} is not installed on this device, so the preview and printout ${note}. To print in ${label}, use a computer that has it.`,
    offsetName: 'offset',
    offsetHead: 'Offset adjustment (inches)',
    offsetHelp: [
      `Use this when everything prints shifted in the same direction: if it sits too far left, enter a positive number under "Left/right" to move it right; if it sits too high, enter a positive number under "Up/down" to move it down. Up to ±${OFFSET_LIMIT_IN} in, in steps of ${OFFSET_STEP_IN} in.`,
      'First choose "Alignment test page" below and print it on plain paper. Hold it over a label sheet against the light, enter how far the lines are from the label edges, then print again to check.',
      'With "Remember this printer\'s offset" ticked, only the two numbers are saved in this browser, never your list. Untick it to delete them.',
    ],
    offsetX: 'Left/right (+ moves right)',
    offsetY: 'Up/down (+ moves down)',
    remember: 'Remember this printer\'s offset',
    offsetInput: { min: -OFFSET_LIMIT_IN, max: OFFSET_LIMIT_IN, step: OFFSET_STEP_IN },
    targetName: 'what to print',
    target: 'What to print',
    targetHelp: `The alignment test page prints only the outline and number of each label, with a ${CALIBRATION_IN}-inch ruler in the middle. The first time you use a sheet, or with a new printer, print it on plain paper and hold it over a label sheet against the light: when the lines sit on the label edges, load the labels and print. If the ruler does not measure exactly ${CALIBRATION_IN} inches, your print settings are scaling the page.`,
    targetLabels: 'Labels',
    targetTest: 'Alignment test page',
    printButton: (target, sheets, blocked, paper) => (target === 'test'
      ? `Print test page (1 ${PAPER_NAME[paper]} sheet)`
      : sheets && !blocked ? `Print labels (${formatCount(sheets)} ${PAPER_NAME[paper]} ${sheets === 1 ? 'sheet' : 'sheets'})` : 'Print labels'),
    summary: (n, copies, sheets, paper) => `${formatCount(n)} ${n === 1 ? 'item' : 'items'}${copies > 1 ? ` × ${copies} copies` : ''} on ${formatCount(sheets)} ${PAPER_NAME[paper]} ${sheets === 1 ? 'sheet' : 'sheets'}.`,
    printTips: paper => `When you print, set the paper size to ${PAPER_NAME[paper]}, scale to "Actual size" or 100% and margins to "None". Do not use "Fit to page".`,
    printHelpName: 'print settings',
    printHelp: [
      'In Chrome and Edge, open "More settings" in the print dialog, set Scale to "Default" or a custom 100 (not "Fit to page" or "Fit to printable area"), set Margins to "None" and untick "Headers and footers". In Safari, set Scale to 100%. Before loading the label sheet, check the icon on your printer tray to see which side gets printed and which edge goes in first.',
      `Then measure the ruler on the test page: exactly ${CALIBRATION_IN} inches means actual size. To save a PDF, choose "Save as PDF" as the destination; this site does not create PDF files itself.`,
    ],
    sheetAria: (page, paper) => `${PAPER_NAME[paper]} sheet ${page}`,
    codeName: (kind, line, u) => `${kind === 'qr' ? 'QR code' : 'Barcode'} for ${u.one} ${line ?? ''}`,
    testAria: 'Alignment test page',
    testInfo: (sheetName, per, x, y) => `Alignment test page | ${sheetName} (${per} labels) | Offset: left/right ${signedIn(inches(x, 3))} in, up/down ${signedIn(inches(y, 3))} in`,
    testHow: 'Print this page on plain paper and hold it over a label sheet against the light: the lines should sit on the label edges. Enter any difference under "Offset adjustment" and print again to check.',
    more: (shown, total) => `Showing the first ${shown} sheets. Printing prints all ${formatCount(total)}.`,
    showAll: 'Show all',
    ruler: { aria: `${CALIBRATION_IN}-inch ruler`, caption: `Exactly ${CALIBRATION_IN} in means actual size` },
    sheetTitle: (brand, model) => (brand === 'Avery' ? `Avery ${model} size` : model),
    customTitle: 'Custom size',
    blocked: { 'no-room': 'Code does not fit, not printed', 'barcode-narrow': 'Barcode too narrow, not printed', 'barcode-short': 'Barcode too short, not printed', 'qr-tiny': 'QR code too small, not printed' },
    blockedOther: 'Not printed',
    whichLines: whichLinesEn,
    notice: {
      noRoom: which => `${which}: the code does not fit once the label's inner margin is taken off. Choose a bigger label or less text per label.`,
      narrow: (which, xMm, symbology, minMm, ean) => `${which}: the barcode is too narrow for this label. Its narrowest bar would be only ${fmt(xMm)} mm (${mil(xMm)} mil), and ${symbology} needs at least ${minMm} mm (${mil(minMm)} mil)${ean ? ', 80% of the standard size,' : ''} to scan. Choose a wider label, shorten the content or use a QR code.`,
      short: which => `${which}: the barcode is too short, so scanning it would take careful aiming. Use fewer lines of text or a taller label.`,
      qrTiny: (which, moduleMm) => `${which}: the QR code squares would be only ${fmt(moduleMm)} mm, too small for most phones. Shorten the content, lower the error correction, use less text or choose a bigger label.`,
      thin: (which, xMm, warnMm, itf) => {
        const advice = itf
          ? `For shipping cartons, ${warnMm} mm or more is recommended (choose a 2-column label)`
          : `${warnMm} mm (${mil(warnMm ?? 0)} mil) or more is recommended, and older scanners may need a few tries`
        return `${which}: the narrowest bar is only ${fmt(xMm)} mm (${mil(xMm)} mil). ${advice}. Test-scan one before printing the whole batch.`
      },
      qrSmall: (which, moduleMm) => `${which}: the QR code squares are only ${fmt(moduleMm)} mm, so phones need to get close. Test-scan one before printing the whole batch.`,
      truncated: which => `${which}: the text is too long even at the smallest size (${MIN_LABEL_FONT_PT} pt), so it is cut off and ends with "…". Shorten it, print one line fewer or choose a wider label.`,
      edgeAvoided: n => `${n} labels on this sheet sit close to the edge, and most printers cannot print the outer ${EDGE_RANGE_EN} of the page. The codes and text in those labels have been pulled in automatically.`,
      edgeWarn: n => `${n} labels on this sheet sit close to the edge, and most printers cannot print the outer ${EDGE_RANGE_EN} of the page, so codes and text may get cut off. Only turn the pull-in off if your printer prints edge to edge.`,
    },
    tooManyCells: (max, n) => `You can print up to ${formatCount(max)} labels at a time, and this needs ${formatCount(n)} (counting blank labels and copies). Please print in batches.`,
    someBlocked: 'Some labels would not scan. Adjust the settings as described above first.',
  },
}
