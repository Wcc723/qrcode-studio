import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetIcons()],
  theme: {
    colors: {
      // 主色：糖果橘
      brand: { DEFAULT: '#FF7A1A', 600: '#FF7A1A', 700: '#E85D00', 50: '#FFE8C2' },
      ink: '#16130f',          // 近黑（暖）
      muted: '#7a6c57',        // 暖灰棕，cream 上可讀
      line: '#efe2cc',         // 細分隔線（暖米）
      // 糖果配色
      pop: {
        pink: '#FF5DA2',
        mint: '#36D399',
        sky: '#38BDF8',
        sun: '#FFD12E',
        tang: '#FF7A1A',
      },
    },
    fontFamily: {
      display: '"Fredoka","Baloo 2",ui-rounded,"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif',
      sans: '"Nunito",ui-rounded,"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif',
    },
    borderRadius: { xl: '16px', '2xl': '20px', '3xl': '26px' },
  },
  shortcuts: {
    // 卡片：白底 + 粗黑框 + 硬陰影
    'card': 'bg-white border-3 border-ink rounded-[20px] shadow-[5px_5px_0_#16130f]',
    // 可點貼紙：滑入抬升、按下壓回
    'sticker': 'card transition-all duration-150 hover:-translate-y-1 hover:shadow-[7px_7px_0_#16130f] active:translate-y-0 active:shadow-[3px_3px_0_#16130f] cursor-pointer',
    // 主按鈕：糖果黃 + 黑框 + 硬陰影 + 彈跳
    'btn-primary': 'inline-flex items-center justify-center gap-1 font-display font-600 text-ink bg-pop-sun border-2 border-ink rounded-xl px-5 py-2.5 shadow-[3px_3px_0_#16130f] transition-all duration-150 cursor-pointer select-none hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#16130f] active:translate-y-0 active:shadow-[1px_1px_0_#16130f] disabled:opacity-45 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-[3px_3px_0_#16130f]',
    // 輸入框：白底 + 黑框 + 橘色 focus ring
    'input-base': 'w-full bg-white border-2 border-ink rounded-xl px-3 py-2 text-ink placeholder-stone-400 focus:outline-none focus:ring-3 focus:ring-brand/40 transition',
    // 小貼紙標籤
    'chip': 'inline-flex items-center gap-1 text-xs font-700 text-ink border-2 border-ink rounded-full px-2.5 py-0.5',
  },
})
