# QR Code 工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打造一個純前端、保護隱私、永久免費、無浮水印、現代化且 SEO 友善的繁中 QR Code 產生器，部署於 GitHub Pages。

**Architecture:** Vite + Vue 3 以 `vite-ssg` 把每條 Vue Router 路由在建置時預渲染成靜態 HTML。QR 以 `qr-code-styling` 在瀏覽器即時生成（零後端、零上傳）。payload 建構為純函式、與渲染（composable）及 UI 完全解耦；首頁與 7 個類型 landing page 共用 `GeneratorTool`。

**Tech Stack:** Vue 3 (`<script setup>` + TS)、Vite、vite-ssg、Vue Router、qr-code-styling、UnoCSS、@unhead/vue、vue-i18n、Vitest + @vue/test-utils、GitHub Actions → GitHub Pages。

**Spec:** `docs/superpowers/specs/2026-05-29-qrcode-tool-design.md`

---

## 慣例（所有任務適用）

- 套件管理用 `npm`。測試框架用 Vitest（pure 函式用 node 環境；元件用 happy-dom）。
- 每個任務最後都 commit。commit message 用 Conventional Commits（`feat:` / `test:` / `chore:` / `ci:`）。
- 純函式放 `src/pure/`，無任何 DOM 依賴 → 用 node 環境測試。
- `qr-code-styling` 依賴 DOM/canvas，**只能在 client 端建立**（`onMounted` 內、動態 import），避免 SSG 預渲染時報錯。
- 顏色一律用 hex 字串；`bgColor` 允許特殊值 `'transparent'`。

---

## 檔案結構（先鎖定分工）

```
qrcode-tool/
  package.json
  vite.config.ts            Vite + Vue + UnoCSS 設定
  uno.config.ts             UnoCSS preset + Trust Blue 主題 token
  vitest.config.ts          測試環境設定
  tsconfig.json
  index.html
  public/
    CNAME                   自訂網域（部署用，內容待填）
    robots.txt
  scripts/
    gen-sitemap.mjs         建置後產生 sitemap.xml
  src/
    main.ts                 ViteSSG 進入點，安裝外掛
    App.vue                 RouterView + DefaultLayout
    router.ts               由 siteConfig 產生路由
    types.ts                共用型別（QrType / QrStyleOptions ...）
    config/
      qr-types.ts           7 種類型的 metadata + SEO 文案（landing 資料來源）
      site.ts               站台常數（網址、品牌、預設語系）
    pure/
      buildUrl.ts  buildText.ts  buildWifi.ts  buildVCard.ts
      buildEmail.ts  buildPhone.ts  buildSms.ts
      index.ts              依 QrType 分派到對應 builder
    composables/
      useQrCode.ts          包 qr-code-styling
      useSeoHead.ts         每頁 head + JSON-LD
    components/
      GeneratorTool.vue     組合工具（props: defaultType）
      QrTypeTabs.vue
      QrPreview.vue
      StylePanel.vue
      DownloadBar.vue
      AdSlot.vue
      SeoContent.vue
      inputs/
        UrlInput.vue WifiInput.vue VCardInput.vue EmailInput.vue
        PhoneInput.vue SmsInput.vue TextInput.vue
        index.ts            type → input 元件對照表
    layouts/
      DefaultLayout.vue     header / footer / nav
    pages/
      HomePage.vue
      TypeLandingPage.vue   吃 qr-types config 的單一 landing 模板
      GuidePage.vue         吃 guide 內容
      AboutPage.vue PrivacyPage.vue FaqPage.vue NotFoundPage.vue
    content/
      guides.ts             教學文章內容（標題/slug/HTML 段落）
    styles/
      main.css              全域樣式（字體、reset 補充）
    locales/
      zh-TW.ts              v1 文案
    test/
      （對應各 pure 函式與元件的測試）
  .github/workflows/deploy.yml
```

---

### Task 1: 專案骨架與工具鏈

**Files:**
- Create: `package.json`, `vite.config.ts`, `uno.config.ts`, `vitest.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `src/main.ts`, `src/App.vue`, `src/router.ts`, `src/styles/main.css`, `src/pages/HomePage.vue`, `src/pages/NotFoundPage.vue`

- [ ] **Step 1: 初始化專案與安裝相依套件**

Run:
```bash
cd /Users/casper/Github/2026-qrcode-tool
npm init -y
npm pkg set type="module"
npm install vue@^3 vue-router@^4 qr-code-styling@^1.9 @unhead/vue@^2 vue-i18n@^11
npm install -D vite @vitejs/plugin-vue vite-ssg typescript vue-tsc unocss vitest @vue/test-utils happy-dom @types/node
```
Expected: 套件安裝成功，`package.json` 出現上述相依。

- [ ] **Step 2: 設定 npm scripts**

Run:
```bash
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="vite-ssg build && node scripts/gen-sitemap.mjs"
npm pkg set scripts.preview="vite preview"
npm pkg set scripts.test="vitest run"
npm pkg set scripts.typecheck="vue-tsc --noEmit"
```

- [ ] **Step 3: 建立 `.gitignore`**

```
node_modules
dist
.superpowers
*.local
.DS_Store
```

- [ ] **Step 4: 建立 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": ["node"],
    "skipLibCheck": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "scripts/**/*.mjs"]
}
```

- [ ] **Step 5: 建立 `uno.config.ts`（Trust Blue 主題）**

```ts
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
```

- [ ] **Step 6: 建立 `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/',
  plugins: [vue(), UnoCSS()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  ssgOptions: { script: 'async', formatting: 'minify' },
})
```

- [ ] **Step 7: 建立 `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'happy-dom',
    environmentMatchGlobs: [['src/pure/**', 'node']],
    globals: true,
  },
})
```

- [ ] **Step 8: 建立 `index.html`**

```html
<!doctype html>
<html lang="zh-Hant-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 9: 建立 `src/styles/main.css`**

```css
:root { color-scheme: light; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: ui-sans-serif, system-ui, "Noto Sans TC", "PingFang TC", sans-serif;
  color: #1e293b;
  background: #ffffff;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
```

- [ ] **Step 10: 建立最小可跑的 `router.ts` / `App.vue` / `main.ts` / 首頁 / 404**

`src/router.ts`:
```ts
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/:pathMatch(.*)*', name: 'notfound', component: NotFoundPage },
]
```

`src/App.vue`:
```vue
<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>
<template>
  <DefaultLayout><RouterView /></DefaultLayout>
</template>
```

> 注意：`DefaultLayout` 於 Task 12 建立。在 Task 1 先以暫時版本讓專案能跑——建立 `src/layouts/DefaultLayout.vue` 暫時內容：
```vue
<template><main><slot /></main></template>
```

`src/main.ts`:
```ts
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router'
import 'uno.css'
import './styles/main.css'

export const createApp = ViteSSG(App, { routes })
```

`src/pages/HomePage.vue`:
```vue
<template>
  <section class="max-w-screen-lg mx-auto px-4 py-10">
    <h1 class="text-3xl font-700">QR Code 產生器</h1>
    <p class="text-muted mt-2">骨架建立成功。</p>
  </section>
</template>
```

`src/pages/NotFoundPage.vue`:
```vue
<template>
  <section class="max-w-screen-lg mx-auto px-4 py-20 text-center">
    <h1 class="text-3xl font-700">404</h1>
    <RouterLink to="/" class="text-brand">回首頁</RouterLink>
  </section>
</template>
```

- [ ] **Step 11: 驗證 dev、build、測試骨架可跑**

Run:
```bash
npm run dev -- --port 5199 &
sleep 4 && curl -s http://localhost:5199/ | grep -q "id=\"app\"" && echo "DEV OK"; kill %1
npm run build
```
Expected：`DEV OK`；`npm run build` 在 `dist/` 產出 `index.html`（含預渲染的「QR Code 產生器」字樣）。
Run: `grep -q "QR Code 產生器" dist/index.html && echo "SSG OK"`
Expected: `SSG OK`

- [ ] **Step 12: git init 與首次 commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite + Vue + vite-ssg + UnoCSS project"
```

---

### Task 2: payload 純函式 — URL 與 Text

**Files:**
- Create: `src/pure/buildUrl.ts`, `src/pure/buildText.ts`
- Test: `src/pure/buildUrl.test.ts`, `src/pure/buildText.test.ts`

- [ ] **Step 1: 寫失敗測試 `buildUrl.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildUrl } from './buildUrl'

describe('buildUrl', () => {
  it('保留已含協定的網址', () => {
    expect(buildUrl({ url: 'https://example.com' })).toBe('https://example.com')
  })
  it('沒有協定時自動補 https://', () => {
    expect(buildUrl({ url: 'example.com' })).toBe('https://example.com')
  })
  it('去除前後空白', () => {
    expect(buildUrl({ url: '  example.com  ' })).toBe('https://example.com')
  })
  it('空字串回傳空字串', () => {
    expect(buildUrl({ url: '' })).toBe('')
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run src/pure/buildUrl.test.ts`
Expected: FAIL（找不到 `./buildUrl`）

- [ ] **Step 3: 實作 `buildUrl.ts`**

```ts
export interface UrlInputData { url: string }

export function buildUrl({ url }: UrlInputData): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || /^(mailto|tel|sms):/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}
```

- [ ] **Step 4: 寫失敗測試 `buildText.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildText } from './buildText'

describe('buildText', () => {
  it('原樣回傳文字', () => {
    expect(buildText({ text: 'Hello 世界\n第二行' })).toBe('Hello 世界\n第二行')
  })
  it('空字串回傳空字串', () => {
    expect(buildText({ text: '' })).toBe('')
  })
})
```

- [ ] **Step 5: 實作 `buildText.ts`**

```ts
export interface TextInputData { text: string }
export function buildText({ text }: TextInputData): string {
  return text
}
```

- [ ] **Step 6: 執行全部測試確認通過**

Run: `npx vitest run src/pure/buildUrl.test.ts src/pure/buildText.test.ts`
Expected: PASS（共 6 例）

- [ ] **Step 7: Commit**

```bash
git add src/pure/buildUrl.ts src/pure/buildText.ts src/pure/buildUrl.test.ts src/pure/buildText.test.ts
git commit -m "feat: add url and text payload builders"
```

---

### Task 3: payload 純函式 — WiFi（含特殊字元跳脫）

**Files:**
- Create: `src/pure/buildWifi.ts`
- Test: `src/pure/buildWifi.test.ts`

- [ ] **Step 1: 寫失敗測試 `buildWifi.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildWifi } from './buildWifi'

describe('buildWifi', () => {
  it('產生 WPA 標準字串', () => {
    expect(buildWifi({ ssid: 'MyNet', password: 'pass123', encryption: 'WPA', hidden: false }))
      .toBe('WIFI:T:WPA;S:MyNet;P:pass123;H:false;;')
  })
  it('開放網路 (nopass) 不含密碼且 T 為 nopass', () => {
    expect(buildWifi({ ssid: 'Free', password: '', encryption: 'nopass', hidden: false }))
      .toBe('WIFI:T:nopass;S:Free;P:;H:false;;')
  })
  it('跳脫特殊字元 \\ ; , : "', () => {
    expect(buildWifi({ ssid: 'a;b,c', password: 'p:q"r\\s', encryption: 'WPA', hidden: true }))
      .toBe('WIFI:T:WPA;S:a\\;b\\,c;P:p\\:q\\"r\\\\s;H:true;;')
  })
  it('SSID 為空回傳空字串', () => {
    expect(buildWifi({ ssid: '', password: 'x', encryption: 'WPA', hidden: false })).toBe('')
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run src/pure/buildWifi.test.ts`
Expected: FAIL

- [ ] **Step 3: 實作 `buildWifi.ts`**

```ts
export type WifiEncryption = 'WPA' | 'WEP' | 'nopass'
export interface WifiInputData {
  ssid: string
  password: string
  encryption: WifiEncryption
  hidden: boolean
}

function esc(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

export function buildWifi({ ssid, password, encryption, hidden }: WifiInputData): string {
  if (!ssid.trim()) return ''
  const t = encryption
  const p = encryption === 'nopass' ? '' : esc(password)
  return `WIFI:T:${t};S:${esc(ssid)};P:${p};H:${hidden};;`
}
```

- [ ] **Step 4: 執行確認通過**

Run: `npx vitest run src/pure/buildWifi.test.ts`
Expected: PASS（4 例）

- [ ] **Step 5: Commit**

```bash
git add src/pure/buildWifi.ts src/pure/buildWifi.test.ts
git commit -m "feat: add wifi payload builder with escaping"
```

---

### Task 4: payload 純函式 — vCard / Email / Phone / SMS

**Files:**
- Create: `src/pure/buildVCard.ts`, `src/pure/buildEmail.ts`, `src/pure/buildPhone.ts`, `src/pure/buildSms.ts`
- Test: 對應 `*.test.ts`

- [ ] **Step 1: 寫失敗測試 `buildVCard.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildVCard } from './buildVCard'

describe('buildVCard', () => {
  it('產生 vCard 3.0', () => {
    const out = buildVCard({
      firstName: '小明', lastName: '王', phone: '0912345678',
      email: 'a@b.com', org: 'ACME', title: 'PM',
      address: '台北市', website: 'https://acme.com',
    })
    expect(out).toContain('BEGIN:VCARD')
    expect(out).toContain('VERSION:3.0')
    expect(out).toContain('N:王;小明;;;')
    expect(out).toContain('FN:小明 王')
    expect(out).toContain('TEL:0912345678')
    expect(out).toContain('EMAIL:a@b.com')
    expect(out).toContain('ORG:ACME')
    expect(out).toContain('TITLE:PM')
    expect(out).toContain('URL:https://acme.com')
    expect(out).toContain('ADR:;;台北市;;;;')
    expect(out.trim().endsWith('END:VCARD')).toBe(true)
  })
  it('省略空欄位', () => {
    const out = buildVCard({ firstName: 'A', lastName: '', phone: '', email: '', org: '', title: '', address: '', website: '' })
    expect(out).toContain('FN:A')
    expect(out).not.toContain('TEL:')
    expect(out).not.toContain('ORG:')
  })
  it('完全空白回傳空字串', () => {
    expect(buildVCard({ firstName: '', lastName: '', phone: '', email: '', org: '', title: '', address: '', website: '' })).toBe('')
  })
})
```

- [ ] **Step 2: 實作 `buildVCard.ts`**

```ts
export interface VCardInputData {
  firstName: string; lastName: string; phone: string; email: string
  org: string; title: string; address: string; website: string
}

export function buildVCard(d: VCardInputData): string {
  const hasAny = Object.values(d).some(v => v.trim() !== '')
  if (!hasAny) return ''
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  lines.push(`N:${d.lastName};${d.firstName};;;`)
  lines.push(`FN:${[d.firstName, d.lastName].filter(Boolean).join(' ')}`)
  if (d.org) lines.push(`ORG:${d.org}`)
  if (d.title) lines.push(`TITLE:${d.title}`)
  if (d.phone) lines.push(`TEL:${d.phone}`)
  if (d.email) lines.push(`EMAIL:${d.email}`)
  if (d.address) lines.push(`ADR:;;${d.address};;;;`)
  if (d.website) lines.push(`URL:${d.website}`)
  lines.push('END:VCARD')
  return lines.join('\n')
}
```

- [ ] **Step 3: 寫失敗測試 `buildEmail.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildEmail } from './buildEmail'

describe('buildEmail', () => {
  it('產生含主旨與內文的 mailto', () => {
    expect(buildEmail({ to: 'a@b.com', subject: 'Hi there', body: 'line1 line2' }))
      .toBe('mailto:a@b.com?subject=Hi%20there&body=line1%20line2')
  })
  it('只有收件者', () => {
    expect(buildEmail({ to: 'a@b.com', subject: '', body: '' })).toBe('mailto:a@b.com')
  })
  it('收件者為空回傳空字串', () => {
    expect(buildEmail({ to: '', subject: 'x', body: '' })).toBe('')
  })
})
```

- [ ] **Step 4: 實作 `buildEmail.ts`**

```ts
export interface EmailInputData { to: string; subject: string; body: string }

export function buildEmail({ to, subject, body }: EmailInputData): string {
  if (!to.trim()) return ''
  const params: string[] = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  return `mailto:${to.trim()}${params.length ? '?' + params.join('&') : ''}`
}
```

- [ ] **Step 5: 寫失敗測試 `buildPhone.test.ts` 與 `buildSms.test.ts`**

`buildPhone.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildPhone } from './buildPhone'

describe('buildPhone', () => {
  it('產生 tel:', () => {
    expect(buildPhone({ number: '0912345678' })).toBe('tel:0912345678')
  })
  it('移除號碼中的空白與連字號', () => {
    expect(buildPhone({ number: '09 1234-5678' })).toBe('tel:0912345678')
  })
  it('空字串回傳空字串', () => {
    expect(buildPhone({ number: '' })).toBe('')
  })
})
```

`buildSms.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildSms } from './buildSms'

describe('buildSms', () => {
  it('產生 SMSTO: 含訊息', () => {
    expect(buildSms({ number: '0912345678', message: 'hello' })).toBe('SMSTO:0912345678:hello')
  })
  it('只有號碼', () => {
    expect(buildSms({ number: '0912345678', message: '' })).toBe('SMSTO:0912345678:')
  })
  it('號碼為空回傳空字串', () => {
    expect(buildSms({ number: '', message: 'x' })).toBe('')
  })
})
```

- [ ] **Step 6: 實作 `buildPhone.ts` 與 `buildSms.ts`**

`buildPhone.ts`:
```ts
export interface PhoneInputData { number: string }
export function buildPhone({ number }: PhoneInputData): string {
  const cleaned = number.replace(/[\s-]/g, '')
  return cleaned ? `tel:${cleaned}` : ''
}
```

`buildSms.ts`:
```ts
export interface SmsInputData { number: string; message: string }
export function buildSms({ number, message }: SmsInputData): string {
  const cleaned = number.replace(/[\s-]/g, '')
  return cleaned ? `SMSTO:${cleaned}:${message}` : ''
}
```

- [ ] **Step 7: 執行全部 pure 測試確認通過**

Run: `npx vitest run src/pure/`
Expected: PASS（全綠）

- [ ] **Step 8: Commit**

```bash
git add src/pure/buildVCard.ts src/pure/buildEmail.ts src/pure/buildPhone.ts src/pure/buildSms.ts src/pure/*.test.ts
git commit -m "feat: add vcard/email/phone/sms payload builders"
```

---

### Task 5: 共用型別、builder 分派與類型設定

**Files:**
- Create: `src/types.ts`, `src/pure/index.ts`, `src/config/qr-types.ts`, `src/config/site.ts`
- Test: `src/pure/index.test.ts`

- [ ] **Step 1: 建立 `src/types.ts`**

```ts
export type QrType = 'url' | 'text' | 'wifi' | 'vcard' | 'email' | 'phone' | 'sms'
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export interface QrStyleOptions {
  width: number
  margin: number
  errorCorrectionLevel: ErrorCorrectionLevel
  dotColor: string
  bgColor: string            // 允許 'transparent'
  useGradient: boolean
  gradientColor: string
  gradientType: 'linear' | 'radial'
  logoDataUrl: string | null
  logoSize: number           // 0–0.4，對應 qr-code-styling imageSize
}

export const defaultStyle: QrStyleOptions = {
  width: 1000,
  margin: 8,
  errorCorrectionLevel: 'M',
  dotColor: '#1e293b',
  bgColor: '#ffffff',
  useGradient: false,
  gradientColor: '#4f46e5',
  gradientType: 'linear',
  logoDataUrl: null,
  logoSize: 0.3,
}
```

- [ ] **Step 2: 寫失敗測試 `src/pure/index.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildPayload } from './index'

describe('buildPayload 分派', () => {
  it('url', () => { expect(buildPayload('url', { url: 'example.com' })).toBe('https://example.com') })
  it('wifi', () => {
    expect(buildPayload('wifi', { ssid: 'N', password: 'p', encryption: 'WPA', hidden: false }))
      .toBe('WIFI:T:WPA;S:N;P:p;H:false;;')
  })
  it('phone', () => { expect(buildPayload('phone', { number: '0912345678' })).toBe('tel:0912345678') })
})
```

- [ ] **Step 3: 實作 `src/pure/index.ts`**

```ts
import type { QrType } from '@/types'
import { buildUrl, type UrlInputData } from './buildUrl'
import { buildText, type TextInputData } from './buildText'
import { buildWifi, type WifiInputData } from './buildWifi'
import { buildVCard, type VCardInputData } from './buildVCard'
import { buildEmail, type EmailInputData } from './buildEmail'
import { buildPhone, type PhoneInputData } from './buildPhone'
import { buildSms, type SmsInputData } from './buildSms'

export type PayloadInputMap = {
  url: UrlInputData; text: TextInputData; wifi: WifiInputData; vcard: VCardInputData
  email: EmailInputData; phone: PhoneInputData; sms: SmsInputData
}

const builders = {
  url: buildUrl, text: buildText, wifi: buildWifi, vcard: buildVCard,
  email: buildEmail, phone: buildPhone, sms: buildSms,
} as const

export function buildPayload<T extends QrType>(type: T, data: PayloadInputMap[T]): string {
  return (builders[type] as (d: PayloadInputMap[T]) => string)(data)
}

export * from './buildUrl'; export * from './buildText'; export * from './buildWifi'
export * from './buildVCard'; export * from './buildEmail'; export * from './buildPhone'; export * from './buildSms'
```

- [ ] **Step 4: 建立 `src/config/site.ts`**

```ts
export const site = {
  name: 'QRTool',
  // 自訂網域上線前先用佔位字串；部署設定時改成正式網址（無結尾斜線）
  url: 'https://qrtool.example',
  defaultLocale: 'zh-TW',
  description: '免費線上 QR Code 產生器，瀏覽器內生成、不上傳、可自訂顏色與 LOGO，免費下載 PNG / SVG。',
}
```

- [ ] **Step 5: 建立 `src/config/qr-types.ts`（landing 資料來源）**

```ts
import type { QrType } from '@/types'

export interface FaqItem { q: string; a: string }
export interface QrTypeMeta {
  type: QrType
  path: string            // 路由路徑，'' 代表首頁
  label: string           // tab 顯示
  routeName: string
  h1: string
  title: string           // <title>
  description: string     // meta description
  intro: string           // landing 頁開頭段落
  steps: string[]         // 使用步驟
  faqs: FaqItem[]
}

export const qrTypes: QrTypeMeta[] = [
  {
    type: 'url', path: '/url', routeName: 'url', label: '網址',
    h1: '網址 QR Code 產生器',
    title: '網址 QR Code 產生器｜免費、不上傳、可加 LOGO',
    description: '把網址轉成 QR Code，瀏覽器內即時生成、不上傳，免費下載 PNG / SVG，可自訂顏色與 LOGO。',
    intro: '輸入任何網址，立即產生可掃描的 QR Code。常用於名片、海報、產品包裝與線上線下導流。',
    steps: ['貼上或輸入網址', '自訂顏色、加入 LOGO（可選）', '下載 PNG 或 SVG'],
    faqs: [
      { q: '產生的 QR Code 會過期嗎？', a: '不會。這是靜態 QR Code，內容直接編碼在圖中，永久有效、不需聯網、不會失效。' },
      { q: '我的網址會被上傳嗎？', a: '不會。整個產生過程都在你的瀏覽器完成，不會傳送到任何伺服器。' },
    ],
  },
  {
    type: 'wifi', path: '/wifi', routeName: 'wifi', label: 'WiFi',
    h1: 'WiFi QR Code 產生器',
    title: 'WiFi QR Code 產生器｜掃碼免輸密碼連線',
    description: '產生 WiFi QR Code，訪客掃碼即可自動連線，免手動輸入密碼。免費、不上傳、可下載 PNG / SVG。',
    intro: '輸入網路名稱與密碼，產生 WiFi QR Code。貼在店面或會議室，客人掃一下就能連上網。',
    steps: ['輸入 SSID 與密碼、選擇加密方式', '自訂外觀（可選）', '下載並張貼'],
    faqs: [
      { q: '支援哪些加密方式？', a: '支援 WPA/WPA2、WEP，以及開放網路（無密碼）。' },
      { q: '密碼安全嗎？', a: '密碼只在你的瀏覽器內編碼成圖片，不會上傳；但任何掃描到該圖的人都能連線，請張貼於受控場所。' },
    ],
  },
  {
    type: 'vcard', path: '/vcard', routeName: 'vcard', label: '電子名片',
    h1: '電子名片 vCard QR Code 產生器',
    title: '電子名片 QR Code 產生器｜vCard 一掃存聯絡人',
    description: '產生 vCard 電子名片 QR Code，掃碼即可把姓名、電話、Email 一鍵存入手機通訊錄。免費、不上傳。',
    intro: '輸入聯絡資訊，產生電子名片 QR Code。對方掃描後可直接把你存進通訊錄，適合放在名片或 Email 簽名檔。',
    steps: ['填寫姓名、電話、Email 等資訊', '自訂外觀（可選）', '下載並印在名片上'],
    faqs: [
      { q: '掃描後能直接存通訊錄嗎？', a: '可以。採用標準 vCard 3.0 格式，iOS 與 Android 相機掃描後皆可一鍵加入聯絡人。' },
      { q: '可以放公司與職稱嗎？', a: '可以，支援公司、職稱、地址、網站等欄位，留空則自動省略。' },
    ],
  },
  {
    type: 'text', path: '/text', routeName: 'text', label: '純文字',
    h1: '純文字 QR Code 產生器',
    title: '文字 QR Code 產生器｜任意文字轉 QR',
    description: '把任意文字轉成 QR Code，瀏覽器內即時生成、不上傳，免費下載 PNG / SVG。',
    intro: '輸入任何文字內容並產生 QR Code，適合留言、序號、說明或活動暗號。',
    steps: ['輸入文字', '自訂外觀（可選）', '下載 PNG 或 SVG'],
    faqs: [
      { q: '可以放多長的文字？', a: 'QR Code 容量有限，文字越長圖越密。過長時建議提高容錯或縮短內容；超出容量會提示。' },
    ],
  },
  {
    type: 'email', path: '/email', routeName: 'email', label: 'Email',
    h1: 'Email QR Code 產生器',
    title: 'Email QR Code 產生器｜掃碼直接寄信',
    description: '產生 Email QR Code，掃碼自動開啟郵件 App 並帶入收件者、主旨與內文。免費、不上傳。',
    intro: '輸入收件者、主旨與內文，產生可直接寄信的 QR Code，方便客服與表單回收。',
    steps: ['輸入收件者、主旨、內文', '自訂外觀（可選）', '下載並使用'],
    faqs: [
      { q: '掃描後會自動寄出嗎？', a: '不會自動寄出，只會開啟郵件 App 並帶入內容，由使用者確認後送出。' },
    ],
  },
  {
    type: 'phone', path: '/phone', routeName: 'phone', label: '電話',
    h1: '電話 QR Code 產生器',
    title: '電話 QR Code 產生器｜掃碼一鍵撥號',
    description: '產生電話 QR Code，掃碼即可一鍵撥號。免費、不上傳，可下載 PNG / SVG。',
    intro: '輸入電話號碼，產生可一鍵撥號的 QR Code，適合店家、傳單與服務專線。',
    steps: ['輸入電話號碼', '自訂外觀（可選）', '下載並張貼'],
    faqs: [
      { q: '支援市話與分機嗎？', a: '支援。可輸入含區碼的市話；部分裝置支援分機，建議實機測試。' },
    ],
  },
  {
    type: 'sms', path: '/sms', routeName: 'sms', label: '簡訊',
    h1: '簡訊 SMS QR Code 產生器',
    title: '簡訊 QR Code 產生器｜掃碼帶入號碼與訊息',
    description: '產生簡訊 QR Code，掃碼自動開啟簡訊並帶入號碼與內容。免費、不上傳。',
    intro: '輸入號碼與訊息，產生簡訊 QR Code，常用於活動報名、投票與回覆關鍵字。',
    steps: ['輸入號碼與訊息內容', '自訂外觀（可選）', '下載並使用'],
    faqs: [
      { q: '掃描後會自動送出簡訊嗎？', a: '不會。只會開啟簡訊 App 並帶入號碼與內容，由使用者確認後送出。' },
    ],
  },
]

export const qrTypeByPath = Object.fromEntries(qrTypes.map(t => [t.path, t]))
export const qrTypeByType = Object.fromEntries(qrTypes.map(t => [t.type, t])) as Record<QrType, QrTypeMeta>
```

- [ ] **Step 6: 執行測試確認通過**

Run: `npx vitest run src/pure/index.test.ts`
Expected: PASS（3 例）

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/pure/index.ts src/pure/index.test.ts src/config/
git commit -m "feat: add shared types, payload dispatcher, and qr-type config"
```

---

### Task 6: `useQrCode` composable（包 qr-code-styling）

**Files:**
- Create: `src/composables/useQrCode.ts`
- Test: `src/composables/mapOptions.test.ts`

> qr-code-styling 需 DOM/canvas，僅能在 client 端建立。把「設定映射」抽成純函式 `mapToQrOptions` 以便測試；DOM 操作放 `onMounted`。

- [ ] **Step 1: 寫失敗測試 `mapOptions.test.ts`（測純映射）**

```ts
import { describe, it, expect } from 'vitest'
import { mapToQrOptions } from './useQrCode'
import { defaultStyle } from '@/types'

describe('mapToQrOptions', () => {
  it('基本映射：尺寸、容錯、顏色、邊距', () => {
    const o = mapToQrOptions('https://x.com', { ...defaultStyle, width: 500, errorCorrectionLevel: 'H', dotColor: '#000', bgColor: '#fff', margin: 4 })
    expect(o.width).toBe(500)
    expect(o.height).toBe(500)
    expect(o.data).toBe('https://x.com')
    expect(o.margin).toBe(4)
    expect(o.qrOptions?.errorCorrectionLevel).toBe('H')
    expect(o.dotsOptions?.color).toBe('#000')
    expect(o.backgroundOptions?.color).toBe('#fff')
  })
  it('透明背景對應 rgba 0 alpha', () => {
    const o = mapToQrOptions('x', { ...defaultStyle, bgColor: 'transparent' })
    expect(o.backgroundOptions?.color).toBe('rgba(0,0,0,0)')
  })
  it('啟用漸層時帶入 gradient', () => {
    const o = mapToQrOptions('x', { ...defaultStyle, useGradient: true, dotColor: '#111', gradientColor: '#4f46e5', gradientType: 'linear' })
    expect(o.dotsOptions?.gradient?.type).toBe('linear')
    expect(o.dotsOptions?.gradient?.colorStops?.[0]?.color).toBe('#111')
    expect(o.dotsOptions?.gradient?.colorStops?.[1]?.color).toBe('#4f46e5')
  })
  it('有 LOGO 時帶入 image 與 imageOptions', () => {
    const o = mapToQrOptions('x', { ...defaultStyle, logoDataUrl: 'data:image/png;base64,AAA', logoSize: 0.25 })
    expect(o.image).toBe('data:image/png;base64,AAA')
    expect(o.imageOptions?.imageSize).toBe(0.25)
    expect(o.imageOptions?.hideBackgroundDots).toBe(true)
  })
  it('無 LOGO 時 image 為 undefined', () => {
    const o = mapToQrOptions('x', { ...defaultStyle, logoDataUrl: null })
    expect(o.image).toBeUndefined()
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run src/composables/mapOptions.test.ts`
Expected: FAIL

- [ ] **Step 3: 實作 `src/composables/useQrCode.ts`**

```ts
import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { Options as QrOptions } from 'qr-code-styling'
import type { QrStyleOptions } from '@/types'

export function mapToQrOptions(data: string, s: QrStyleOptions): QrOptions {
  const bg = s.bgColor === 'transparent' ? 'rgba(0,0,0,0)' : s.bgColor
  const opts: QrOptions = {
    width: s.width,
    height: s.width,
    type: 'canvas',
    data: data || ' ',
    margin: s.margin,
    qrOptions: { errorCorrectionLevel: s.errorCorrectionLevel },
    dotsOptions: { color: s.dotColor, type: 'square' },
    backgroundOptions: { color: bg },
  }
  if (s.useGradient) {
    opts.dotsOptions!.gradient = {
      type: s.gradientType,
      rotation: 0,
      colorStops: [
        { offset: 0, color: s.dotColor },
        { offset: 1, color: s.gradientColor },
      ],
    }
  }
  if (s.logoDataUrl) {
    opts.image = s.logoDataUrl
    opts.imageOptions = { crossOrigin: 'anonymous', margin: 4, imageSize: s.logoSize, hideBackgroundDots: true }
  }
  return opts
}

export function useQrCode(data: Ref<string>, style: Ref<QrStyleOptions>) {
  const container = ref<HTMLElement | null>(null)
  let instance: import('qr-code-styling').default | null = null

  async function ensureInstance() {
    if (instance || typeof window === 'undefined') return
    const { default: QRCodeStyling } = await import('qr-code-styling')
    instance = new QRCodeStyling(mapToQrOptions(data.value, style.value))
    if (container.value) instance.append(container.value)
  }

  function update() {
    instance?.update(mapToQrOptions(data.value, style.value))
  }

  onMounted(async () => {
    await ensureInstance()
    update()
  })

  watch([data, style], () => update(), { deep: true })

  onBeforeUnmount(() => { instance = null })

  async function download(extension: 'png' | 'svg' | 'jpeg') {
    await ensureInstance()
    instance?.download({ name: 'qrcode', extension })
  }

  return { container, download }
}
```

- [ ] **Step 4: 執行確認映射測試通過**

Run: `npx vitest run src/composables/mapOptions.test.ts`
Expected: PASS（5 例）

- [ ] **Step 5: Commit**

```bash
git add src/composables/useQrCode.ts src/composables/mapOptions.test.ts
git commit -m "feat: add useQrCode composable wrapping qr-code-styling"
```

---

### Task 7: `QrPreview` 元件（sticky 即時預覽 + 信任徽章）

**Files:**
- Create: `src/components/QrPreview.vue`
- Test: `src/components/QrPreview.test.ts`

- [ ] **Step 1: 寫失敗測試 `QrPreview.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import QrPreview from './QrPreview.vue'

vi.mock('qr-code-styling', () => ({
  default: class { append() {} update() {} download() {} },
}))

describe('QrPreview', () => {
  it('顯示信任徽章與預覽容器', () => {
    const wrapper = mount(QrPreview, { props: { data: 'https://x.com' } })
    expect(wrapper.text()).toContain('不上傳')
    expect(wrapper.find('[data-test="qr-container"]').exists()).toBe(true)
  })
  it('data 為空時顯示提示', () => {
    const wrapper = mount(QrPreview, { props: { data: '' } })
    expect(wrapper.text()).toContain('輸入內容')
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run src/components/QrPreview.test.ts`
Expected: FAIL

- [ ] **Step 3: 實作 `QrPreview.vue`**

```vue
<script setup lang="ts">
import { toRef } from 'vue'
import { useQrCode } from '@/composables/useQrCode'
import type { QrStyleOptions } from '@/types'
import { defaultStyle } from '@/types'

const props = defineProps<{ data: string; style?: QrStyleOptions }>()
const dataRef = toRef(props, 'data')
const styleRef = toRef(() => props.style ?? defaultStyle)
const { container, download } = useQrCode(dataRef, styleRef)
defineExpose({ download })
</script>

<template>
  <div class="card p-5 sticky top-4">
    <div class="text-xs text-muted mb-3 flex items-center gap-1">🔒 不上傳・瀏覽器內生成</div>
    <div class="relative aspect-square w-full bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden">
      <div v-show="data" ref="container" data-test="qr-container" class="[&>canvas]:max-w-full [&>canvas]:h-auto" />
      <p v-if="!data" class="text-muted text-sm">輸入內容後即時預覽</p>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 執行確認通過**

Run: `npx vitest run src/components/QrPreview.test.ts`
Expected: PASS（2 例）

- [ ] **Step 5: Commit**

```bash
git add src/components/QrPreview.vue src/components/QrPreview.test.ts
git commit -m "feat: add QrPreview component with sticky live preview"
```

---

### Task 8: 輸入元件（7 種類型）

**Files:**
- Create: `src/components/inputs/UrlInput.vue`, `WifiInput.vue`, `VCardInput.vue`, `EmailInput.vue`, `PhoneInput.vue`, `SmsInput.vue`, `TextInput.vue`, `src/components/inputs/index.ts`
- Test: `src/components/inputs/UrlInput.test.ts`, `WifiInput.test.ts`

> 每個輸入元件用 `v-model` 維護自己的欄位狀態，並把「組好的 payload 字串」透過 `update:payload` 事件吐出（呼叫對應 pure builder）。

- [ ] **Step 1: 寫失敗測試 `UrlInput.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UrlInput from './UrlInput.vue'

describe('UrlInput', () => {
  it('輸入網址時 emit 組好的 payload', async () => {
    const wrapper = mount(UrlInput)
    await wrapper.find('input').setValue('example.com')
    const events = wrapper.emitted('update:payload')
    expect(events?.at(-1)?.[0]).toBe('https://example.com')
  })
})
```

- [ ] **Step 2: 寫失敗測試 `WifiInput.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WifiInput from './WifiInput.vue'

describe('WifiInput', () => {
  it('填寫後 emit WIFI payload', async () => {
    const wrapper = mount(WifiInput)
    await wrapper.find('[data-test="ssid"]').setValue('MyNet')
    await wrapper.find('[data-test="password"]').setValue('pass123')
    const events = wrapper.emitted('update:payload')
    expect(events?.at(-1)?.[0]).toContain('WIFI:T:WPA;S:MyNet;P:pass123;')
  })
})
```

- [ ] **Step 3: 執行確認失敗**

Run: `npx vitest run src/components/inputs/`
Expected: FAIL

- [ ] **Step 4: 實作 `UrlInput.vue`**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { buildUrl } from '@/pure/buildUrl'
const emit = defineEmits<{ 'update:payload': [string] }>()
const url = ref('')
watch(url, () => emit('update:payload', buildUrl({ url: url.value })), { immediate: true })
</script>
<template>
  <label class="block">
    <span class="text-sm text-muted">網址</span>
    <input v-model="url" class="input-base mt-1" type="url" placeholder="https://example.com" />
  </label>
</template>
```

- [ ] **Step 5: 實作 `TextInput.vue`**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { buildText } from '@/pure/buildText'
const emit = defineEmits<{ 'update:payload': [string] }>()
const text = ref('')
watch(text, () => emit('update:payload', buildText({ text: text.value })), { immediate: true })
</script>
<template>
  <label class="block">
    <span class="text-sm text-muted">文字內容</span>
    <textarea v-model="text" rows="4" class="input-base mt-1" placeholder="輸入任意文字" />
  </label>
</template>
```

- [ ] **Step 6: 實作 `WifiInput.vue`**

```vue
<script setup lang="ts">
import { reactive, watch } from 'vue'
import { buildWifi, type WifiEncryption } from '@/pure/buildWifi'
const emit = defineEmits<{ 'update:payload': [string] }>()
const f = reactive({ ssid: '', password: '', encryption: 'WPA' as WifiEncryption, hidden: false })
watch(f, () => emit('update:payload', buildWifi({ ...f })), { immediate: true, deep: true })
</script>
<template>
  <div class="space-y-3">
    <label class="block"><span class="text-sm text-muted">網路名稱 (SSID)</span>
      <input v-model="f.ssid" data-test="ssid" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">密碼</span>
      <input v-model="f.password" data-test="password" class="input-base mt-1" :disabled="f.encryption === 'nopass'" /></label>
    <div class="flex gap-3">
      <label class="block flex-1"><span class="text-sm text-muted">加密</span>
        <select v-model="f.encryption" class="input-base mt-1">
          <option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">無密碼</option>
        </select></label>
      <label class="flex items-end gap-2 pb-2"><input v-model="f.hidden" type="checkbox" /><span class="text-sm text-muted">隱藏網路</span></label>
    </div>
  </div>
</template>
```

- [ ] **Step 7: 實作 `VCardInput.vue`**

```vue
<script setup lang="ts">
import { reactive, watch } from 'vue'
import { buildVCard } from '@/pure/buildVCard'
const emit = defineEmits<{ 'update:payload': [string] }>()
const f = reactive({ firstName: '', lastName: '', phone: '', email: '', org: '', title: '', address: '', website: '' })
watch(f, () => emit('update:payload', buildVCard({ ...f })), { immediate: true, deep: true })
</script>
<template>
  <div class="grid grid-cols-2 gap-3">
    <label class="block"><span class="text-sm text-muted">名</span><input v-model="f.firstName" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">姓</span><input v-model="f.lastName" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">電話</span><input v-model="f.phone" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">Email</span><input v-model="f.email" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">公司</span><input v-model="f.org" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">職稱</span><input v-model="f.title" class="input-base mt-1" /></label>
    <label class="block col-span-2"><span class="text-sm text-muted">地址</span><input v-model="f.address" class="input-base mt-1" /></label>
    <label class="block col-span-2"><span class="text-sm text-muted">網站</span><input v-model="f.website" class="input-base mt-1" /></label>
  </div>
</template>
```

- [ ] **Step 8: 實作 `EmailInput.vue`**

```vue
<script setup lang="ts">
import { reactive, watch } from 'vue'
import { buildEmail } from '@/pure/buildEmail'
const emit = defineEmits<{ 'update:payload': [string] }>()
const f = reactive({ to: '', subject: '', body: '' })
watch(f, () => emit('update:payload', buildEmail({ ...f })), { immediate: true, deep: true })
</script>
<template>
  <div class="space-y-3">
    <label class="block"><span class="text-sm text-muted">收件者</span><input v-model="f.to" class="input-base mt-1" type="email" /></label>
    <label class="block"><span class="text-sm text-muted">主旨</span><input v-model="f.subject" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">內文</span><textarea v-model="f.body" rows="3" class="input-base mt-1" /></label>
  </div>
</template>
```

- [ ] **Step 9: 實作 `PhoneInput.vue` 與 `SmsInput.vue`**

`PhoneInput.vue`:
```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { buildPhone } from '@/pure/buildPhone'
const emit = defineEmits<{ 'update:payload': [string] }>()
const number = ref('')
watch(number, () => emit('update:payload', buildPhone({ number: number.value })), { immediate: true })
</script>
<template>
  <label class="block"><span class="text-sm text-muted">電話號碼</span>
    <input v-model="number" class="input-base mt-1" type="tel" placeholder="0912345678" /></label>
</template>
```

`SmsInput.vue`:
```vue
<script setup lang="ts">
import { reactive, watch } from 'vue'
import { buildSms } from '@/pure/buildSms'
const emit = defineEmits<{ 'update:payload': [string] }>()
const f = reactive({ number: '', message: '' })
watch(f, () => emit('update:payload', buildSms({ ...f })), { immediate: true, deep: true })
</script>
<template>
  <div class="space-y-3">
    <label class="block"><span class="text-sm text-muted">號碼</span><input v-model="f.number" class="input-base mt-1" type="tel" /></label>
    <label class="block"><span class="text-sm text-muted">訊息</span><textarea v-model="f.message" rows="3" class="input-base mt-1" /></label>
  </div>
</template>
```

- [ ] **Step 10: 建立 `src/components/inputs/index.ts`（type → 元件對照）**

```ts
import type { QrType } from '@/types'
import type { Component } from 'vue'
import UrlInput from './UrlInput.vue'
import TextInput from './TextInput.vue'
import WifiInput from './WifiInput.vue'
import VCardInput from './VCardInput.vue'
import EmailInput from './EmailInput.vue'
import PhoneInput from './PhoneInput.vue'
import SmsInput from './SmsInput.vue'

export const inputComponents: Record<QrType, Component> = {
  url: UrlInput, text: TextInput, wifi: WifiInput, vcard: VCardInput,
  email: EmailInput, phone: PhoneInput, sms: SmsInput,
}
```

- [ ] **Step 11: 執行測試確認通過**

Run: `npx vitest run src/components/inputs/`
Expected: PASS（2 例）

- [ ] **Step 12: Commit**

```bash
git add src/components/inputs/
git commit -m "feat: add input components for all 7 qr types"
```

---

### Task 9: `StylePanel` 元件（顏色 / 漸層 / LOGO / 容錯 / 尺寸）

**Files:**
- Create: `src/components/StylePanel.vue`
- Test: `src/components/StylePanel.test.ts`

> 用 `v-model` 對外綁定 `QrStyleOptions`。LOGO 上傳讀成 dataURL；上傳後自動把容錯升到 `H`。

- [ ] **Step 1: 寫失敗測試 `StylePanel.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StylePanel from './StylePanel.vue'
import { defaultStyle } from '@/types'

describe('StylePanel', () => {
  it('改變前景色時 emit 更新後的 style', async () => {
    const wrapper = mount(StylePanel, { props: { modelValue: { ...defaultStyle } } })
    await wrapper.find('[data-test="dotColor"]').setValue('#ff0000')
    const events = wrapper.emitted('update:modelValue')
    expect((events?.at(-1)?.[0] as any).dotColor).toBe('#ff0000')
  })
  it('切換透明背景', async () => {
    const wrapper = mount(StylePanel, { props: { modelValue: { ...defaultStyle } } })
    await wrapper.find('[data-test="transparent"]').setValue(true)
    const events = wrapper.emitted('update:modelValue')
    expect((events?.at(-1)?.[0] as any).bgColor).toBe('transparent')
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run src/components/StylePanel.test.ts`
Expected: FAIL

- [ ] **Step 3: 實作 `StylePanel.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { QrStyleOptions, ErrorCorrectionLevel } from '@/types'

const props = defineProps<{ modelValue: QrStyleOptions }>()
const emit = defineEmits<{ 'update:modelValue': [QrStyleOptions] }>()

function patch(part: Partial<QrStyleOptions>) {
  emit('update:modelValue', { ...props.modelValue, ...part })
}

const transparent = computed({
  get: () => props.modelValue.bgColor === 'transparent',
  set: (v: boolean) => patch({ bgColor: v ? 'transparent' : '#ffffff' }),
})

function onLogo(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => patch({ logoDataUrl: String(reader.result), errorCorrectionLevel: 'H' })
  reader.readAsDataURL(file)
}

const ecLevels: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']
const ecLabel: Record<ErrorCorrectionLevel, string> = {
  L: '低（圖最簡潔）', M: '中（建議）', Q: '較高', H: '最高（適合加 LOGO）',
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <label class="text-sm text-muted">前景色</label>
      <input data-test="dotColor" type="color" :value="modelValue.dotColor" @input="patch({ dotColor: ($event.target as HTMLInputElement).value })" />
      <label class="text-sm text-muted ml-2">背景色</label>
      <input type="color" :value="modelValue.bgColor === 'transparent' ? '#ffffff' : modelValue.bgColor" :disabled="transparent" @input="patch({ bgColor: ($event.target as HTMLInputElement).value })" />
      <label class="flex items-center gap-1 text-sm text-muted ml-2">
        <input data-test="transparent" type="checkbox" v-model="transparent" />透明
      </label>
    </div>

    <label class="flex items-center gap-2 text-sm text-muted">
      <input type="checkbox" :checked="modelValue.useGradient" @change="patch({ useGradient: ($event.target as HTMLInputElement).checked })" />
      使用漸層
      <input v-if="modelValue.useGradient" type="color" :value="modelValue.gradientColor" @input="patch({ gradientColor: ($event.target as HTMLInputElement).value })" />
    </label>

    <label class="block">
      <span class="text-sm text-muted">加入 LOGO</span>
      <input type="file" accept="image/*" class="block mt-1 text-sm" @change="onLogo" />
      <button v-if="modelValue.logoDataUrl" class="text-xs text-brand mt-1" @click="patch({ logoDataUrl: null })">移除 LOGO</button>
    </label>

    <label class="block">
      <span class="text-sm text-muted">容錯等級</span>
      <select class="input-base mt-1" :value="modelValue.errorCorrectionLevel" @change="patch({ errorCorrectionLevel: ($event.target as HTMLSelectElement).value as ErrorCorrectionLevel })">
        <option v-for="lv in ecLevels" :key="lv" :value="lv">{{ ecLabel[lv] }}</option>
      </select>
    </label>

    <label class="block">
      <span class="text-sm text-muted">尺寸：{{ modelValue.width }}px</span>
      <input type="range" min="200" max="2000" step="100" class="w-full" :value="modelValue.width" @input="patch({ width: Number(($event.target as HTMLInputElement).value) })" />
    </label>
  </div>
</template>
```

- [ ] **Step 4: 執行確認通過**

Run: `npx vitest run src/components/StylePanel.test.ts`
Expected: PASS（2 例）

- [ ] **Step 5: Commit**

```bash
git add src/components/StylePanel.vue src/components/StylePanel.test.ts
git commit -m "feat: add StylePanel for colors/gradient/logo/error-correction/size"
```

---

### Task 10: `DownloadBar` 元件（PNG / SVG / JPG）

**Files:**
- Create: `src/components/DownloadBar.vue`
- Test: `src/components/DownloadBar.test.ts`

- [ ] **Step 1: 寫失敗測試 `DownloadBar.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DownloadBar from './DownloadBar.vue'

describe('DownloadBar', () => {
  it('點 PNG 時呼叫 download(\'png\')', async () => {
    const download = vi.fn()
    const wrapper = mount(DownloadBar, { props: { download, disabled: false } })
    await wrapper.find('[data-test="dl-png"]').trigger('click')
    expect(download).toHaveBeenCalledWith('png')
  })
  it('disabled 時按鈕停用', () => {
    const wrapper = mount(DownloadBar, { props: { download: vi.fn(), disabled: true } })
    expect(wrapper.find('[data-test="dl-png"]').attributes('disabled')).toBeDefined()
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run src/components/DownloadBar.test.ts`
Expected: FAIL

- [ ] **Step 3: 實作 `DownloadBar.vue`**

```vue
<script setup lang="ts">
defineProps<{ download: (ext: 'png' | 'svg' | 'jpeg') => void; disabled: boolean }>()
</script>
<template>
  <div class="flex gap-2 mt-4">
    <button data-test="dl-png" class="btn-primary flex-1" :disabled="disabled" @click="download('png')">⬇ PNG</button>
    <button data-test="dl-svg" class="btn-primary flex-1" :disabled="disabled" @click="download('svg')">⬇ SVG</button>
    <button data-test="dl-jpg" class="btn-primary flex-1" :disabled="disabled" @click="download('jpeg')">⬇ JPG</button>
  </div>
</template>
```

- [ ] **Step 4: 執行確認通過**

Run: `npx vitest run src/components/DownloadBar.test.ts`
Expected: PASS（2 例）

- [ ] **Step 5: Commit**

```bash
git add src/components/DownloadBar.vue src/components/DownloadBar.test.ts
git commit -m "feat: add DownloadBar component"
```

---

### Task 11: `QrTypeTabs` 與 `GeneratorTool` 組合

**Files:**
- Create: `src/components/QrTypeTabs.vue`, `src/components/GeneratorTool.vue`
- Test: `src/components/GeneratorTool.test.ts`

- [ ] **Step 1: 實作 `QrTypeTabs.vue`**

```vue
<script setup lang="ts">
import type { QrType } from '@/types'
import { qrTypes } from '@/config/qr-types'
defineProps<{ modelValue: QrType }>()
const emit = defineEmits<{ 'update:modelValue': [QrType] }>()
</script>
<template>
  <div class="flex flex-wrap gap-2">
    <button v-for="t in qrTypes" :key="t.type"
      class="px-3 py-1.5 rounded-full text-sm transition"
      :class="modelValue === t.type ? 'bg-brand text-white' : 'bg-brand-50 text-brand hover:bg-brand/10'"
      @click="emit('update:modelValue', t.type)">{{ t.label }}</button>
  </div>
</template>
```

- [ ] **Step 2: 寫失敗測試 `GeneratorTool.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GeneratorTool from './GeneratorTool.vue'

vi.mock('qr-code-styling', () => ({
  default: class { append() {} update() {} download() {} },
}))

describe('GeneratorTool', () => {
  it('依 defaultType 預選類型並顯示對應輸入', () => {
    const wrapper = mount(GeneratorTool, { props: { defaultType: 'wifi' } })
    expect(wrapper.find('[data-test="ssid"]').exists()).toBe(true)
  })
  it('預設 url 類型', () => {
    const wrapper = mount(GeneratorTool, { props: { defaultType: 'url' } })
    expect(wrapper.find('input[type="url"]').exists()).toBe(true)
  })
})
```

- [ ] **Step 3: 執行確認失敗**

Run: `npx vitest run src/components/GeneratorTool.test.ts`
Expected: FAIL

- [ ] **Step 4: 實作 `GeneratorTool.vue`（雙欄分割版面）**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { QrType, QrStyleOptions } from '@/types'
import { defaultStyle } from '@/types'
import QrTypeTabs from './QrTypeTabs.vue'
import QrPreview from './QrPreview.vue'
import StylePanel from './StylePanel.vue'
import DownloadBar from './DownloadBar.vue'
import { inputComponents } from './inputs'

const props = withDefaults(defineProps<{ defaultType?: QrType }>(), { defaultType: 'url' })
const current = ref<QrType>(props.defaultType)
const payload = ref('')
const style = ref<QrStyleOptions>({ ...defaultStyle })
const previewRef = ref<InstanceType<typeof QrPreview> | null>(null)

const activeInput = computed(() => inputComponents[current.value])
function onType(t: QrType) { current.value = t; payload.value = '' }
function download(ext: 'png' | 'svg' | 'jpeg') { previewRef.value?.download(ext) }
</script>

<template>
  <div class="card p-5 md:p-6">
    <QrTypeTabs :model-value="current" @update:model-value="onType" />
    <div class="grid md:grid-cols-[1fr_auto] gap-6 mt-5">
      <div class="space-y-5 min-w-0">
        <component :is="activeInput" :key="current" @update:payload="payload = $event" />
        <hr class="border-line" />
        <StylePanel v-model="style" />
      </div>
      <div class="md:w-72">
        <QrPreview ref="previewRef" :data="payload" :style="style" />
        <DownloadBar :download="download" :disabled="!payload" />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: 執行確認通過**

Run: `npx vitest run src/components/GeneratorTool.test.ts`
Expected: PASS（2 例）

- [ ] **Step 6: Commit**

```bash
git add src/components/QrTypeTabs.vue src/components/GeneratorTool.vue src/components/GeneratorTool.test.ts
git commit -m "feat: add QrTypeTabs and GeneratorTool composition"
```

---

### Task 12: `DefaultLayout` + `AdSlot`（Trust Blue 視覺）

**Files:**
- Modify: `src/layouts/DefaultLayout.vue`（取代 Task 1 暫時版）
- Create: `src/components/AdSlot.vue`
- Test: `src/components/AdSlot.test.ts`

- [ ] **Step 1: 寫失敗測試 `AdSlot.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdSlot from './AdSlot.vue'

describe('AdSlot', () => {
  it('未啟用時顯示佔位、不渲染廣告腳本', () => {
    const wrapper = mount(AdSlot, { props: { slotId: 'demo' } })
    expect(wrapper.find('[data-test="ad-placeholder"]').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: 實作 `AdSlot.vue`（預留版位，預設停用）**

```vue
<script setup lang="ts">
// AdSense 上線審核通過後，把 enabled 改 true 並填入 client/slot
defineProps<{ slotId: string }>()
const enabled = false
</script>
<template>
  <div class="my-6">
    <div v-if="!enabled" data-test="ad-placeholder"
      class="border border-dashed border-line rounded-lg text-muted text-xs flex items-center justify-center h-20 bg-slate-50">
      廣告版位（待 AdSense 審核啟用）
    </div>
    <!-- enabled 時在此插入 <ins class="adsbygoogle" ...> 與初始化腳本 -->
  </div>
</template>
```

- [ ] **Step 3: 取代 `DefaultLayout.vue`**

```vue
<script setup lang="ts">
import { qrTypes } from '@/config/qr-types'
import { site } from '@/config/site'
</script>
<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-line">
      <div class="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 font-700 text-ink">
          <span class="w-5 h-5 rounded-md bg-brand inline-block" />{{ site.name }}
        </RouterLink>
        <nav class="hidden md:flex gap-4 text-sm text-muted">
          <RouterLink v-for="t in qrTypes.slice(0, 4)" :key="t.type" :to="t.path" class="hover:text-brand">{{ t.label }}</RouterLink>
          <RouterLink to="/faq" class="hover:text-brand">FAQ</RouterLink>
        </nav>
      </div>
    </header>
    <main class="flex-1"><slot /></main>
    <footer class="border-t border-line mt-12">
      <div class="max-w-screen-lg mx-auto px-4 py-8 text-sm text-muted flex flex-wrap gap-x-6 gap-y-2 justify-between">
        <span>© {{ site.name }} · 瀏覽器內生成，不上傳你的資料</span>
        <span class="flex gap-4">
          <RouterLink to="/about" class="hover:text-brand">關於</RouterLink>
          <RouterLink to="/privacy" class="hover:text-brand">隱私權</RouterLink>
          <RouterLink to="/faq" class="hover:text-brand">常見問題</RouterLink>
        </span>
      </div>
    </footer>
  </div>
</template>
```

- [ ] **Step 4: 執行確認通過**

Run: `npx vitest run src/components/AdSlot.test.ts`
Expected: PASS（1 例）

- [ ] **Step 5: Commit**

```bash
git add src/layouts/DefaultLayout.vue src/components/AdSlot.vue src/components/AdSlot.test.ts
git commit -m "feat: add DefaultLayout (Trust Blue) and reserved AdSlot"
```

---

### Task 13: SEO head composable（含 JSON-LD）

**Files:**
- Create: `src/composables/useSeoHead.ts`
- Test: `src/composables/useSeoHead.test.ts`

> 用 `@unhead/vue` 設定每頁 title/description/canonical/OG，並注入 JSON-LD。把「組 JSON-LD 物件」抽成純函式測試。

- [ ] **Step 1: 寫失敗測試 `useSeoHead.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildSoftwareAppLd, buildFaqLd } from './useSeoHead'

describe('JSON-LD builders', () => {
  it('SoftwareApplication 結構正確', () => {
    const ld = buildSoftwareAppLd({ name: 'QRTool', url: 'https://x.tw/url', description: 'desc' })
    expect(ld['@type']).toBe('SoftwareApplication')
    expect(ld.offers.price).toBe('0')
    expect(ld.applicationCategory).toBe('UtilitiesApplication')
  })
  it('FAQPage 結構正確', () => {
    const ld = buildFaqLd([{ q: '問?', a: '答' }])
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('答')
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run src/composables/useSeoHead.test.ts`
Expected: FAIL

- [ ] **Step 3: 實作 `useSeoHead.ts`**

```ts
import { useHead } from '@unhead/vue'
import { site } from '@/config/site'
import type { FaqItem } from '@/config/qr-types'

export function buildSoftwareAppLd(p: { name: string; url: string; description: string }) {
  return {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: p.name, url: p.url, description: p.description,
    applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
  }
}

export function buildFaqLd(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

export function useSeoHead(opts: { title: string; description: string; path: string; faqs?: FaqItem[] }) {
  const url = `${site.url}${opts.path}`
  const scripts = [
    { type: 'application/ld+json', children: JSON.stringify(buildSoftwareAppLd({ name: opts.title, url, description: opts.description })) },
  ]
  if (opts.faqs?.length) {
    scripts.push({ type: 'application/ld+json', children: JSON.stringify(buildFaqLd(opts.faqs)) })
  }
  useHead({
    title: opts.title,
    meta: [
      { name: 'description', content: opts.description },
      { property: 'og:title', content: opts.title },
      { property: 'og:description', content: opts.description },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    link: [
      { rel: 'canonical', href: url },
      { rel: 'alternate', hreflang: 'zh-Hant-TW', href: url },
    ],
    script: scripts,
  })
}
```

- [ ] **Step 4: 執行確認通過**

Run: `npx vitest run src/composables/useSeoHead.test.ts`
Expected: PASS（2 例）

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSeoHead.ts src/composables/useSeoHead.test.ts
git commit -m "feat: add useSeoHead composable with JSON-LD builders"
```

---

### Task 14: 首頁、類型 landing 模板、SeoContent、路由接線

**Files:**
- Create: `src/components/SeoContent.vue`, `src/pages/TypeLandingPage.vue`
- Modify: `src/pages/HomePage.vue`, `src/router.ts`
- Test: `src/router.test.ts`

- [ ] **Step 1: 實作 `SeoContent.vue`（landing 內容區）**

```vue
<script setup lang="ts">
import type { QrTypeMeta } from '@/config/qr-types'
defineProps<{ meta: QrTypeMeta }>()
</script>
<template>
  <article class="max-w-screen-lg mx-auto px-4 mt-10 prose-sm">
    <h2 class="text-xl font-700 text-ink">關於{{ meta.label }} QR Code</h2>
    <p class="text-muted mt-2">{{ meta.intro }}</p>
    <h3 class="text-lg font-600 text-ink mt-6">使用步驟</h3>
    <ol class="list-decimal pl-5 text-muted mt-2 space-y-1">
      <li v-for="(s, i) in meta.steps" :key="i">{{ s }}</li>
    </ol>
    <h3 class="text-lg font-600 text-ink mt-6">常見問題</h3>
    <div class="mt-2 space-y-3">
      <details v-for="(f, i) in meta.faqs" :key="i" class="card p-4">
        <summary class="font-600 cursor-pointer">{{ f.q }}</summary>
        <p class="text-muted mt-2">{{ f.a }}</p>
      </details>
    </div>
  </article>
</template>
```

- [ ] **Step 2: 實作 `TypeLandingPage.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { qrTypeByPath } from '@/config/qr-types'
import GeneratorTool from '@/components/GeneratorTool.vue'
import SeoContent from '@/components/SeoContent.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'

const route = useRoute()
const meta = computed(() => qrTypeByPath[route.path])
useSeoHead({
  title: meta.value.title, description: meta.value.description,
  path: meta.value.path, faqs: meta.value.faqs,
})
</script>
<template>
  <div class="py-8">
    <header class="max-w-screen-lg mx-auto px-4 mb-5">
      <h1 class="text-2xl md:text-3xl font-700 text-ink">{{ meta.h1 }}</h1>
      <p class="text-muted mt-2">{{ meta.description }}</p>
    </header>
    <div class="max-w-screen-lg mx-auto px-4">
      <GeneratorTool :default-type="meta.type" />
      <AdSlot slot-id="landing-below-tool" />
    </div>
    <SeoContent :meta="meta" />
  </div>
</template>
```

- [ ] **Step 3: 改寫 `HomePage.vue`**

```vue
<script setup lang="ts">
import GeneratorTool from '@/components/GeneratorTool.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
import { qrTypes } from '@/config/qr-types'

useSeoHead({
  title: '免費 QR Code 產生器｜可加 LOGO、不上傳、免費下載 PNG/SVG',
  description: site.description, path: '/',
  faqs: [
    { q: 'QR Code 會過期嗎？', a: '不會。本工具產生的是靜態 QR Code，內容直接編碼在圖中，永久有效。' },
    { q: '需要付費或註冊嗎？', a: '完全免費、免註冊、無浮水印，可直接下載 PNG 與 SVG。' },
    { q: '我的資料會被上傳嗎？', a: '不會。所有產生過程都在你的瀏覽器內完成，不會送到任何伺服器。' },
  ],
})
</script>
<template>
  <div class="py-8">
    <header class="max-w-screen-lg mx-auto px-4 mb-5 text-center">
      <h1 class="text-3xl md:text-4xl font-800 text-ink">免費 QR Code 產生器</h1>
      <p class="text-muted mt-3">瀏覽器內即時生成、不上傳、可自訂顏色與 LOGO，免費下載 PNG / SVG。</p>
    </header>
    <div class="max-w-screen-lg mx-auto px-4">
      <GeneratorTool default-type="url" />
      <AdSlot slot-id="home-below-tool" />
      <nav class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        <RouterLink v-for="t in qrTypes" :key="t.type" :to="t.path" class="card p-4 hover:border-brand transition">
          <div class="font-600 text-ink">{{ t.label }} QR Code</div>
          <div class="text-xs text-muted mt-1">{{ t.intro.slice(0, 24) }}…</div>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 改寫 `router.ts`（由 config 產生類型路由）**

```ts
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import TypeLandingPage from '@/pages/TypeLandingPage.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import { qrTypes } from '@/config/qr-types'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  ...qrTypes.map<RouteRecordRaw>(t => ({ path: t.path, name: t.routeName, component: TypeLandingPage })),
  { path: '/:pathMatch(.*)*', name: 'notfound', component: NotFoundPage },
]
```

- [ ] **Step 5: 寫測試 `router.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { routes } from './router'

describe('routes', () => {
  it('包含首頁與 7 個類型 landing', () => {
    const paths = routes.map(r => r.path)
    expect(paths).toContain('/')
    for (const p of ['/url', '/wifi', '/vcard', '/text', '/email', '/phone', '/sms']) {
      expect(paths).toContain(p)
    }
  })
})
```

- [ ] **Step 6: 執行測試 + 建置驗證每條 landing 預渲染**

Run: `npx vitest run src/router.test.ts`
Expected: PASS

Run: `npm run build`
Run: `for p in url wifi vcard text email phone sms; do test -f dist/$p/index.html && echo "$p OK" || echo "$p MISSING"; done`
Expected: 7 個皆 `OK`
Run: `grep -q "WiFi QR Code 產生器" dist/wifi/index.html && echo "META OK"`
Expected: `META OK`

- [ ] **Step 7: Commit**

```bash
git add src/components/SeoContent.vue src/pages/TypeLandingPage.vue src/pages/HomePage.vue src/router.ts src/router.test.ts
git commit -m "feat: add home + type landing pages with SEO content and routing"
```

---

### Task 15: 內容/合規頁、i18n、sitemap、robots

**Files:**
- Create: `src/content/guides.ts`, `src/pages/GuidePage.vue`, `src/pages/AboutPage.vue`, `src/pages/PrivacyPage.vue`, `src/pages/FaqPage.vue`, `src/locales/zh-TW.ts`, `scripts/gen-sitemap.mjs`, `public/robots.txt`
- Modify: `src/router.ts`, `src/main.ts`

- [ ] **Step 1: 建立 `src/content/guides.ts`**

```ts
export interface Guide { slug: string; title: string; description: string; bodyHtml: string }

export const guides: Guide[] = [
  {
    slug: 'what-is-qr-code', title: '什麼是 QR Code？原理與用途完整介紹',
    description: 'QR Code 是什麼？一次看懂二維條碼的原理、容量、容錯與常見用途。',
    bodyHtml: '<p>QR Code（Quick Response Code）是一種二維條碼，可儲存網址、文字、聯絡資訊等資料……</p>',
  },
  {
    slug: 'error-correction', title: 'QR Code 容錯等級怎麼選？L/M/Q/H 一次搞懂',
    description: '容錯等級影響 QR Code 的抗污損能力與密度，本文教你如何依用途挑選。',
    bodyHtml: '<p>容錯等級分為 L(7%)、M(15%)、Q(25%)、H(30%)，等級越高越耐損但圖越密……</p>',
  },
  {
    slug: 'qr-with-logo', title: '如何在 QR Code 中加入 LOGO 又能正常掃描',
    description: '加入 LOGO 會影響掃描嗎？教你用容錯等級與覆蓋比例做出可掃的品牌 QR Code。',
    bodyHtml: '<p>在 QR Code 中央放 LOGO 時，建議把容錯等級提高到 H，並控制 LOGO 覆蓋比例……</p>',
  },
]
export const guideBySlug = Object.fromEntries(guides.map(g => [g.slug, g]))
```

- [ ] **Step 2: 建立 `GuidePage.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { guideBySlug } from '@/content/guides'
import { useSeoHead } from '@/composables/useSeoHead'
const route = useRoute()
const g = computed(() => guideBySlug[route.params.slug as string])
useSeoHead({ title: g.value.title, description: g.value.description, path: `/guide/${g.value.slug}` })
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-2xl md:text-3xl font-700 text-ink">{{ g.title }}</h1>
    <div class="mt-4 text-muted leading-7" v-html="g.bodyHtml" />
    <RouterLink to="/" class="btn-primary inline-block mt-8">開始製作 QR Code</RouterLink>
  </article>
</template>
```

- [ ] **Step 3: 建立 `AboutPage.vue` / `PrivacyPage.vue` / `FaqPage.vue`**

`AboutPage.vue`:
```vue
<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
useSeoHead({ title: `關於 ${site.name}`, description: `${site.name} 是免費、不上傳、保護隱私的線上 QR Code 產生器。`, path: '/about' })
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-2xl font-700 text-ink">關於 {{ site.name }}</h1>
    <p class="text-muted mt-4 leading-7">{{ site.name }} 致力於提供乾淨、快速、免費且保護隱私的 QR Code 工具。所有 QR Code 都在你的瀏覽器內生成，不會上傳任何資料，也沒有浮水印。</p>
  </article>
</template>
```

`PrivacyPage.vue`:
```vue
<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
useSeoHead({ title: '隱私權政策｜不上傳你的資料', description: '本工具完全在瀏覽器內生成 QR Code，不會收集或上傳你輸入的任何內容。', path: '/privacy' })
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-2xl font-700 text-ink">隱私權政策</h1>
    <p class="text-muted mt-4 leading-7">你輸入的所有內容（網址、密碼、聯絡資訊等）都只在你的瀏覽器內處理並生成 QR Code，不會傳送到任何伺服器，我們也不會儲存。網站未來可能顯示第三方廣告（Google AdSense），其 Cookie 政策請參閱該服務說明。</p>
  </article>
</template>
```

`FaqPage.vue`:
```vue
<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
const faqs = [
  { q: 'QR Code 會過期嗎？', a: '不會。靜態 QR Code 內容直接編碼在圖中，永久有效。' },
  { q: '需要付費或註冊嗎？', a: '完全免費、免註冊、無浮水印。' },
  { q: '可以加上 LOGO 嗎？', a: '可以。上傳 LOGO 後會自動提高容錯等級以確保可掃描。' },
  { q: '資料會被上傳嗎？', a: '不會，全部在瀏覽器內生成。' },
]
useSeoHead({ title: '常見問題 FAQ｜QR Code 產生器', description: '關於本 QR Code 產生器的常見問題：是否免費、會不會過期、能否加 LOGO、資料是否上傳。', path: '/faq', faqs })
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-2xl font-700 text-ink">常見問題</h1>
    <div class="mt-6 space-y-3">
      <details v-for="(f, i) in faqs" :key="i" class="card p-4">
        <summary class="font-600 cursor-pointer">{{ f.q }}</summary>
        <p class="text-muted mt-2">{{ f.a }}</p>
      </details>
    </div>
  </article>
</template>
```

- [ ] **Step 4: 建立 `src/locales/zh-TW.ts` 並在 `main.ts` 安裝 vue-i18n（僅 zh-TW）**

`src/locales/zh-TW.ts`:
```ts
export default {
  download: { png: '下載 PNG', svg: '下載 SVG' },
  common: { free: '免費', noUpload: '不上傳' },
}
```

修改 `src/main.ts`：
```ts
import { ViteSSG } from 'vite-ssg'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import { routes } from './router'
import zhTW from './locales/zh-TW'
import 'uno.css'
import './styles/main.css'

export const createApp = ViteSSG(App, { routes }, ({ app }) => {
  const i18n = createI18n({ legacy: false, locale: 'zh-TW', fallbackLocale: 'zh-TW', messages: { 'zh-TW': zhTW } })
  app.use(i18n)
})
```

- [ ] **Step 5: 把 guide 與合規頁加入 `router.ts`**

在 `routes` 陣列（404 之前）加入：
```ts
  { path: '/guide/:slug', name: 'guide', component: () => import('@/pages/GuidePage.vue') },
  { path: '/about', name: 'about', component: () => import('@/pages/AboutPage.vue') },
  { path: '/privacy', name: 'privacy', component: () => import('@/pages/PrivacyPage.vue') },
  { path: '/faq', name: 'faq', component: () => import('@/pages/FaqPage.vue') },
```

> 因 `/guide/:slug` 是動態路由，需告訴 vite-ssg 要預渲染哪些路徑。修改 `src/main.ts` 的 `ViteSSG(...)` 第二參數加入 `includedRoutes`：
```ts
export const createApp = ViteSSG(
  App,
  {
    routes,
    async includedRoutes(paths) {
      const { guides } = await import('./content/guides')
      const dynamic = guides.map(g => `/guide/${g.slug}`)
      return [...paths.filter(p => !p.includes(':')), ...dynamic]
    },
  },
  ({ app }) => { /* i18n 安裝同 Step 4 */ },
)
```

- [ ] **Step 6: 建立 `public/robots.txt` 與 `scripts/gen-sitemap.mjs`**

`public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://qrtool.example/sitemap.xml
```

`scripts/gen-sitemap.mjs`:
```js
import { writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SITE_URL || 'https://qrtool.example'
const dist = 'dist'

function walk(dir, prefix = '') {
  const urls = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      urls.push(...walk(full, `${prefix}/${entry}`))
    } else if (entry === 'index.html') {
      urls.push(prefix === '' ? '/' : prefix)
    }
  }
  return urls
}

const urls = [...new Set(walk(dist))].sort()
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${BASE}${u === '/' ? '/' : u + '/'}</loc></url>`).join('\n')}
</urlset>
`
writeFileSync(join(dist, 'sitemap.xml'), xml)
console.log(`sitemap.xml written with ${urls.length} urls`)
```

- [ ] **Step 7: 建置驗證全站頁面 + sitemap**

Run: `npm run build`
Run: `for p in guide/what-is-qr-code guide/error-correction guide/qr-with-logo about privacy faq; do test -f dist/$p/index.html && echo "$p OK" || echo "$p MISSING"; done`
Expected: 全部 `OK`
Run: `test -f dist/sitemap.xml && grep -c "<url>" dist/sitemap.xml`
Expected: 檔案存在，URL 數 ≥ 14（首頁 + 7 類型 + 3 guide + about/privacy/faq）

- [ ] **Step 8: 執行完整測試套件**

Run: `npm run test`
Expected: 全綠

- [ ] **Step 9: Commit**

```bash
git add src/content/ src/pages/ src/locales/ src/router.ts src/main.ts scripts/gen-sitemap.mjs public/robots.txt
git commit -m "feat: add guide/legal pages, i18n, sitemap and robots"
```

---

### Task 16: GitHub Actions 部署 + 自訂網域

**Files:**
- Create: `.github/workflows/deploy.yml`, `public/CNAME`
- Modify: `src/config/site.ts`, `public/robots.txt`, `scripts/gen-sitemap.mjs`（填入正式網址）

- [ ] **Step 1: 建立 `public/CNAME`**

> 內容為你的自訂網域（無 `https://`、無斜線）。例如：
```
qrtool.example
```
（部署前改成實際購買的網域。）

- [ ] **Step 2: 把正式網址填回三處**

- `src/config/site.ts` 的 `url`
- `public/robots.txt` 的 `Sitemap:`
- 設定 GitHub Actions 環境變數 `SITE_URL`（見下一步）

- [ ] **Step 3: 建立 `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run test
      - run: npm run build
        env:
          SITE_URL: https://qrtool.example
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: 本機完整驗證（建置 + 測試 + 預覽掃描）**

Run: `npm run test && npm run build`
Expected: 測試全綠、`dist/` 完整（含 `CNAME`、`sitemap.xml`、`robots.txt`）
Run: `test -f dist/CNAME && echo "CNAME OK"`
Run: `npm run preview -- --port 5198 &` 然後在手機/相機實際掃描首頁與各類型產生的 QR（含含 LOGO、高容錯）確認可讀；完成後 `kill %1`
Expected: 各類型 QR 皆能被手機相機正確辨識

- [ ] **Step 5: Commit 與推送**

```bash
git add .github/workflows/deploy.yml public/CNAME src/config/site.ts public/robots.txt
git commit -m "ci: add GitHub Pages deploy workflow and custom domain"
```

> 推送前置作業（人工，於 GitHub 與 DNS 設定）：
> 1. 建立 GitHub repo，`git remote add origin ...`，`git push -u origin main`。
> 2. GitHub repo → Settings → Pages → Source 選 **GitHub Actions**。
> 3. DNS：自訂網域 CNAME 指向 `<username>.github.io`（或 apex 用 A record 指向 GitHub Pages IP）。
> 4. Settings → Pages 填入自訂網域並勾選 **Enforce HTTPS**。
> 5. 推送後確認 Action 成功、網站可用、Lighthouse（行動版）SEO 與效能 ≥ 95。

---

## Self-Review（撰寫者自檢）

**1. Spec coverage（spec 各節 → 對應任務）**
- 純靜態 QR（client-side）→ Task 6 `useQrCode`（client-only、動態 import）✅
- 7 種內容類型 → Task 2–4 builders、Task 8 inputs ✅
- 進階客製化（顏色/漸層/LOGO/容錯/尺寸）→ Task 9 `StylePanel`（LOGO 自動升 H）✅
- 即時預覽（sticky）→ Task 7 `QrPreview` + Task 11 雙欄版面 ✅
- 輸出 PNG/SVG/JPG → Task 10 `DownloadBar` ✅
- 免費 + 廣告版位 → Task 12 `AdSlot`（預留、預設停用）✅
- 繁中優先 + i18n 預留 → Task 15 vue-i18n（僅 zh-TW）✅
- 自訂網域 → Task 16 `CNAME` + site.url ✅
- Trust Blue 視覺 → Task 1 `uno.config` token + Task 12 layout ✅
- 雙欄分割版面 → Task 11 `GeneratorTool` grid ✅
- SEO：每頁 meta/canonical/OG/JSON-LD → Task 13 `useSeoHead`；landing 放大器 → Task 5 config + Task 14；sitemap/robots → Task 15；hreflang → Task 13 ✅
- 部署 GitHub Actions → Task 16 ✅
- 測試策略（pure 單元 + 元件 + 建置 smoke）→ Task 2–11 單元/元件、Task 14/15 建置驗證 ✅
- 完成定義（實機掃描）→ Task 16 Step 4 ✅

**2. Placeholder scan**：所有 code step 皆含完整程式碼；無 TBD/TODO/「之後補」。`guides.ts` 內文為精簡但完整可上線的段落（非 placeholder，後續可擴充）。✅

**3. Type consistency**：`QrType`、`QrStyleOptions`、`defaultStyle`（Task 5）貫穿 Task 6–14;`update:payload` 事件契約於 Task 8 定義、Task 11 消費;`buildPayload`/各 builder 簽名一致;`useSeoHead` 參數（title/description/path/faqs）於 Task 13 定義、Task 14/15 使用一致。✅

**已知人工前置**：購買網域、GitHub repo/Pages/DNS 設定、AdSense 審核啟用——皆於 Task 16 註明，非程式碼缺口。
