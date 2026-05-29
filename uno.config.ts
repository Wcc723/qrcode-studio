import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetIcons()],
  theme: {
    colors: {
      brand: { DEFAULT: '#4f46e5', 600: '#4f46e5', 700: '#4338ca', 50: '#eef2ff' },
      ink: '#1e293b',
      muted: '#64748b',
      line: '#e2e8f0',
    },
    borderRadius: { xl: '14px' },
  },
  shortcuts: {
    'btn-primary': 'bg-brand text-white font-600 rounded-xl px-5 py-2.5 hover:bg-brand-700 transition cursor-pointer',
    'card': 'bg-white border border-line rounded-xl shadow-[0_6px_20px_rgba(30,41,99,.08)]',
    'input-base': 'w-full bg-slate-50 border border-line rounded-lg px-3 py-2 focus:(outline-none border-brand) transition',
  },
})
