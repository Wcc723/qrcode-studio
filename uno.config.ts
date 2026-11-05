import { defineConfig, presetUno, presetIcons, transformerVariantGroup } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    // 圖示用 Lucide（ISC 授權，@iconify-json/lucide 是 devDependency）：建置時只把用到的圖示轉成
    // CSS mask，顏色跟著 currentColor。不設 cdn、不開 autoInstall：瀏覽器執行時不向任何第三方取圖，
    // 圖示集沒裝好時 seo:audit 會因為 CSS 裡找不到 i-lucide-* 規則而擋下 build。
    presetIcons({
      scale: 1.2,
      extraProperties: { 'display': 'inline-block', 'vertical-align': '-0.15em', 'flex-shrink': '0' },
    }),
  ],
  content: {
    pipeline: {
      include: [
        // UnoCSS 預設只掃 .vue、.html 這類檔案；類型圖示的 class 寫在 src/config/qr-types.ts 的 icon 欄位
        /\.(vue|svelte|[jt]sx|vine.ts|mdx?|astro|elm|php|phtml|marko|html)($|\?)/,
        /src\/config\/[\w-]+\.ts($|\?)/,
      ],
    },
  },
  // 讓 `[&_a]:(text-brand underline)`、`file:(mr-2 px-3)` 這類 variant group 在 build 時展開。
  // 少了它，括號裡的 class 會被瀏覽器當成一般 class 套在外層元素上：教學與類型頁的本文
  // 整段變成底線＋等寬字，上傳 LOGO 的檔案欄位整個變黃。
  transformers: [transformerVariantGroup()],
  // 2026-11 改版（口袋工具家族的樣子）：細框白卡、柔和陰影、淡色圓底，主按鈕是實心深橘。
  // 粗黑框加硬陰影的貼紙風格整站拿掉；字型用系統字（本站不載 webfont）。
  theme: {
    colors: {
      // 品牌：糖果橘只當色塊；當字色在白底只有 2.45:1，字與主按鈕改用深一階的橘 link（白底 5.2:1）
      brand: { DEFAULT: '#FF7A1A', 600: '#FF7A1A', 700: '#E85D00', 50: '#FFEDD9' },
      ink: '#211a13',          // 近黑（暖）
      muted: '#5c5044',        // 暖灰棕，紙白與工具區底色上都在 7:1 以上
      link: { DEFAULT: '#C2410C', 700: '#9A3412' },
      line: { DEFAULT: '#e8dcc9', strong: '#cdbfa9' },  // 卡片框線／欄位框線
      paper: '#fffcf7',        // 頁面底色
      zone: '#fff4e6',         // 工具區的底：接在標題區下面，跟說明文章的紙白分得開
      hero: '#fce4c8',         // 首頁橫幅與工具頁標題區的暖杏色
      sunk: '#f6f0e6',
      mintd: '#1f7a52',        // 薄荷綠的深色（隱私那一行的鎖、打勾）
      // 淡色圓底（徽章、選取狀態的底）：原本的糖果色降成淡色，名字不變
      pop: {
        pink: '#ffe4ef',
        mint: '#e3f6ec',
        sky: '#e3f2fb',
        sun: '#fff5cc',
        tang: '#ffedd9',
      },
    },
    fontFamily: {
      display: '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif',
      sans: '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif',
    },
    borderRadius: { xl: '12px', '2xl': '16px', '3xl': '20px' },
  },
  shortcuts: {
    // 卡片：白底 + 細框 + 柔和陰影（工具卡、預覽框）
    'card': 'bg-white border border-line rounded-[20px] shadow-[0_10px_30px_rgb(120_72_20/0.10)]',
    // 可點的卡片：滑入框線變品牌橘
    'sticker': 'bg-white border border-line rounded-2xl transition-colors duration-150 hover:border-brand hover:shadow-[0_4px_14px_rgb(194_65_12/0.12)] cursor-pointer',
    // 主按鈕：實心深橘、白字（每個工具只有一顆，例如下載 PNG、產生、讀取）
    'btn-primary': 'inline-flex items-center justify-center gap-1.5 font-700 text-white bg-link border border-link-700 rounded-xl px-5 py-2.5 min-h-11 transition-colors duration-150 cursor-pointer select-none hover:bg-link-700 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-link',
    // 次要按鈕：白底細框（其他格式、複製、清除）
    'btn-secondary': 'inline-flex items-center justify-center gap-1.5 font-700 text-ink bg-white border border-line-strong rounded-xl px-4 py-2 min-h-11 transition-colors duration-150 cursor-pointer select-none hover:border-link hover:text-link-700 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:border-line-strong disabled:hover:text-ink',
    // 輸入框：白底 + 細框 + 橘色 focus ring
    'input-base': 'w-full bg-white border border-line-strong rounded-xl px-3.5 py-2.5 text-ink placeholder-stone-400 focus:outline-none focus:border-link focus:ring-3 focus:ring-link/40 transition',
    // 小標籤
    'chip': 'inline-flex items-center gap-1 text-xs font-700 text-ink border border-line-strong rounded-full px-2.5 py-0.5 min-h-6',
    // 淡色圓底徽章：裡面放一個 aria-hidden 的單色 Lucide 圖示，底色由使用處加 bg-pop-*（淡色）。
    'icon-badge-base': 'inline-flex items-center justify-center shrink-0 rounded-full text-ink',
    'icon-badge': 'icon-badge-base w-8 h-8 text-[15px]',
    'icon-badge-sm': 'icon-badge-base w-7 h-7 text-[14px]',
    'icon-badge-lg': 'icon-badge-base w-14 h-14 text-[26px]',
    // 插圖的圓底（軟陶插圖放在裡面，alt="" 的裝飾圖）
    'art-bubble': 'flex-none inline-flex items-center justify-center rounded-full bg-[#fff0dc] overflow-hidden',
  },
})
