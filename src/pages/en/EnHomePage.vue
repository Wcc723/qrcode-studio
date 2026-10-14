<script setup lang="ts">
/**
 * 英文首頁（/en/）：網址 QR Code 產生器。跟繁中首頁成對（src/i18n/pairs.ts），工具是同一個 GeneratorTool，
 * 只開網址一種（英文版還沒有其他類型頁）。說明文章是給美國使用者寫的，不是繁中首頁的翻譯。
 */
import GeneratorTool from '@/components/GeneratorTool.vue'
import ToolZone from '@/components/ToolZone.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { provideUiCopy } from '@/locales/ui'
import { uiCopyEn } from '@/locales/ui.en'
import { site } from '@/config/site'

const steps = [
  'Paste the link: a website, menu, review page, sign-up form or social profile.',
  'Pick the colors, add your logo if you like, and choose how big the image should be.',
  'Download a PNG for screens and documents, or an SVG for anything you print.',
]

const tips = [
  { strong: 'Keep it dark on light.', text: ' Phone cameras read contrast, so dark squares on a white or pale background scan best. Light squares on a dark background fail on many scanner apps.' },
  { strong: 'Leave the white margin.', text: ' The blank border around the code (the quiet zone) is part of it. Do not crop it off or place the code on a busy photo.' },
  { strong: 'Print it big enough.', text: ' As a rule of thumb, print it at least 0.8 inch (2 cm) wide, and larger when people will scan it from across a room.' },
  { strong: 'Test before you print a batch.', text: ' Scan it with a phone or two, especially after adding a logo.' },
]

const faqs = [
  { q: 'Is this QR code generator really free?', a: 'Yes. There is no sign-up, no watermark and no limit on how many codes you make. The PNG, SVG and JPG downloads are free for personal and commercial use.' },
  { q: 'Do the QR codes expire?', a: 'No. They are static QR codes: your link is stored in the pattern itself, with no redirect service in between, so there is nothing to expire. As long as your link works, the code works.' },
  { q: 'Is my link uploaded anywhere?', a: 'No. The code is drawn right in your browser, and the link and logo you add never leave your device.' },
  { q: 'Can I add my logo?', a: 'Yes. Upload your logo and it is placed in the center. Error correction switches to the highest level automatically so the code still scans. Scan it with your phone before you print.' },
  { q: 'Which file should I download for printing?', a: 'SVG. It is a vector file that stays sharp at any size, which suits flyers, posters, packaging and signs. Use PNG for web pages, slides and documents.' },
  { q: 'Can I see how many people scanned my code?', a: 'Not with these codes. Counting scans needs a dynamic code that sends every scan through someone else\'s server first. If you need numbers, add UTM tags to your link (for example ?utm_source=flyer) and check your website analytics.' },
]

// 底下的共用元件（產生器、外觀、預覽、隱私那一行）拿英文的文案；英文字串跟著這一頁的 chunk，不進 entry
provideUiCopy(uiCopyEn)

useSeoHead({
  title: 'Free QR Code Generator: Add a Logo, Download SVG or PNG',
  description: 'Make a QR code for any link in your browser. Add a logo and colors, then download PNG, SVG or JPG for free. No sign-up, no watermark, never expires.',
  path: '/en/',
  appName: site.nameEn,
  locale: 'en',
  ogImage: { path: '/og-en.png', width: 1200, height: 630, alt: 'Free QR Code Generator: Online, no sign-up, add a logo' },
})
</script>
<template>
  <div>
    <ToolZone lead="Paste a link, add your logo, download PNG or SVG">
      <template #title>Free <span class="px-1 rounded" style="background:linear-gradient(transparent 58%, #FFD12E 58%)">QR Code</span> Generator</template>
      <GeneratorTool default-type="url" only="url" />
    </ToolZone>

    <!-- 說明文章：文件樣式，跟上面的工具區分開 -->
    <article class="max-w-[720px] mx-auto px-4 mt-10 text-ink/85 font-600 leading-relaxed" data-test="doc">
      <p class="zone-label"><span class="icon-badge-sm bg-pop-sky"><span class="i-lucide-book-open" aria-hidden="true" /></span>How it works</p>
      <p class="text-lg text-ink" data-test="doc-lead">Make a QR code for your website, menu, form or social profile in seconds: paste the link, pick your colors, add your logo and download a high-resolution PNG or a vector SVG. Everything happens in your browser, nothing is uploaded, and the code never expires.</p>

      <h2 class="text-2xl font-800 text-ink mt-8">Make a QR code in three steps</h2>
      <ol class="doc-steps">
        <li v-for="(s, i) in steps" :key="i">
          <span class="step-no">{{ i + 1 }}</span>
          <span>{{ s }}</span>
        </li>
      </ol>

      <h2 class="text-2xl font-800 text-ink mt-10">Static QR codes that keep working</h2>
      <p class="mt-3">Many QR code generators make <strong>dynamic</strong> codes: the code points to the generator's own short link, which then forwards people to yours, and it stops working if that service shuts down or your plan ends. The codes made here are <strong>static</strong>. Your link is stored in the pattern itself, so the code works for as long as your link does, on business cards, product packaging, table tents and storefront signs.</p>
      <p class="mt-3">Because nothing sits between the code and your link, there is no scan counter either. To see how many visits come from a printed code, add UTM tags to the link before you make the code.</p>

      <h2 class="text-2xl font-800 text-ink mt-10">Need dozens or hundreds of codes?</h2>
      <p class="mt-3">Use the <RouterLink to="/en/batch/" class="text-link underline underline-offset-2 font-700">bulk QR code generator</RouterLink>: paste a list from Excel or a CSV file, or number a sequence, and download every code in one ZIP. It also prints QR code labels and barcode labels straight onto US Letter label sheets for inventory, storage bins and asset tags.</p>

      <h2 class="text-2xl font-800 text-ink mt-10">Need a barcode instead?</h2>
      <p class="mt-3">For the striped kind of code on products and shelf tags (Code 128, EAN-13 and others), use the <RouterLink to="/en/barcode/" class="text-link underline underline-offset-2 font-700">barcode generator</RouterLink>. A QR code holds a whole link or a paragraph of text that any phone can open; a barcode holds a short ID that a scanner reads into your inventory or checkout system.</p>

      <h2 class="text-2xl font-800 text-ink mt-10">Tips for a QR code that scans</h2>
      <ul class="list-disc pl-5 mt-3 space-y-2">
        <li v-for="tip in tips" :key="tip.strong"><strong class="text-ink">{{ tip.strong }}</strong>{{ tip.text }}</li>
      </ul>

      <h2 class="text-2xl font-800 text-ink mt-10">FAQ</h2>
      <div class="doc-faq">
        <details v-for="(f, i) in faqs" :key="i">
          <summary>{{ f.q }}<span class="i-lucide-chevron-down faq-chevron" aria-hidden="true" /></summary>
          <p>{{ f.a }}</p>
        </details>
      </div>
    </article>
  </div>
</template>
