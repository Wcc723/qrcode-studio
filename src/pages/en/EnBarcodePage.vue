<script setup lang="ts">
/**
 * 英文的條碼產生器（/en/barcode/），跟繁中的 /barcode/ 成對。工具是同一個 BarcodeTool（英文文案），
 * 說明文章與常見問題是給美國使用者寫的，不是繁中頁的翻譯。
 */
import BarcodeTool from '@/components/barcode/BarcodeTool.vue'
import ToolZone from '@/components/ToolZone.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { provideUiCopy } from '@/locales/ui'
import { uiCopyEn } from '@/locales/ui.en'
import { site } from '@/config/site'

const faqs = [
  { q: 'What is the difference between a barcode and a QR code?', a: 'A barcode (a linear or 1D barcode) is a row of bars that holds a short ID, usually a dozen or two digits or characters; the item name and price come from the store\'s or warehouse\'s own system. A QR code is a square, two-dimensional code that holds a whole link, text or contact details, so a phone can open it directly. It also holds far more and copes better with damage.' },
  { q: 'What is the EAN-13 check digit? Do I have to calculate it?', a: 'No. The 13th digit of an EAN-13 is a check digit calculated from the first 12 with the GS1 formula, so a mistyped number gets caught. Enter the first 12 digits and the tool adds it and shows the full number; enter all 13 and it is verified, with the correct digit shown if it does not match.' },
  { q: 'Can I make a UPC-A barcode?', a: 'Not yet: UPC-A is not one of the types here. A 12-digit UPC-A number can be written as an EAN-13 by adding a 0 in front, and many scanners read EAN-13 as well, but if a retailer asks for UPC-A specifically, use a tool that prints the UPC-A symbol.' },
  { q: 'Where do I get barcode numbers for products I sell in stores?', a: 'From GS1 US, or the GS1 office in your country. Retailers expect product numbers registered to your company; this tool draws the barcode for a number you already have. For codes used only inside your own business, EAN-13 numbers starting with 20 to 29 are restricted circulation numbers: GS1 never issues them as product numbers, and the GS1 office in each country decides how they may be used.' },
  { q: 'Why can\'t I make a colored barcode or add a logo?', a: 'Because it would stop scanning. Most checkout and handheld scanners use red light, and red, orange and yellow look almost the same as white paper under it, so red bars are as good as no bars. A barcode also has no built-in error correction like a QR code, so any covered or faint bar can break it. That is why the barcode itself is always black on white.' },
  { q: 'My printed barcode will not scan. What went wrong?', a: 'Most often the blank space on the left and right (the quiet zone) was trimmed off, or the barcode was printed too small. The images here already include the required blank space, so do not crop along the bars. For print, download the SVG, which carries its real size.' },
  { q: 'Why does my PNG stop scanning after I put it in Word?', a: 'A PNG does not remember how big it should print, so resizing it freely in a document squeezes the bars. When the size has to be exact, download the SVG, whose width and height are stored in millimeters, so it places at the standard size in design and layout apps.' },
]

const steps = [
  'Choose a barcode type. Not sure? Start with Code 128, or EAN-13 for retail products.',
  'Type the content. The preview, check digit and any error message update as you type.',
  'Download a PNG to use right away, or an SVG for print.',
]

// 底下的共用元件（產生器、外觀、預覽、隱私那一行）拿英文的文案；英文字串跟著這一頁的 chunk，不進 entry
provideUiCopy(uiCopyEn)

useSeoHead({
  title: 'Barcode Generator: Free Code 128, EAN-13 and ITF-14 Barcodes',
  description: 'Make a barcode online: Code 128, EAN-13, EAN-8, Code 39 or ITF-14. The check digit is calculated for you. Download a print-ready PNG or a true-size SVG.',
  path: '/en/barcode',
  appName: 'Barcode Generator',
  appType: 'WebApplication',
  locale: 'en',
  ogImage: { path: '/og-en-barcode.png', width: 1200, height: 630, alt: 'Barcode Generator: Code 128, EAN-13, ITF-14 online, check digit included' },
  breadcrumbs: [
    { name: site.nameEn, url: `${site.url}/en/` },
    { name: 'Barcode Generator', url: `${site.url}/en/barcode/` },
  ],
})
</script>

<template>
  <div>
    <ToolZone lead="Code 128, EAN-13 and more, check digits included">
      <template #title>Barcode Generator (Code 128, EAN-13)</template>
      <BarcodeTool />
    </ToolZone>

    <article class="max-w-[720px] mx-auto px-4 mt-10" data-test="doc">
      <p class="zone-label"><span class="icon-badge-sm bg-pop-sky"><span class="i-lucide-book-open" aria-hidden="true" /></span>How it works</p>
      <p class="text-lg text-ink font-600 leading-relaxed" data-test="doc-lead">
        Make a barcode for free in Code 128, EAN-13, EAN-8, Code 39 or ITF-14.
        It is drawn right in your browser with nothing uploaded, the check digit is calculated for you, and you can download a PNG or an SVG that is ready to print.
      </p>

      <h2 class="text-2xl font-800 text-ink mt-8">Barcodes and QR codes: what is the difference?</h2>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        A <strong class="text-ink">barcode</strong> is the row of bars on product packaging and shelf tags. It holds a short ID, usually a dozen or two digits or characters, and your store or warehouse system looks up the rest. Common types are EAN-13, EAN-8, Code 128, Code 39 and ITF-14.
      </p>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        A <strong class="text-ink">QR code</strong> is a square grid that holds a whole link, text, Wi-Fi details or contact card, so a phone can open it without any lookup. It holds much more and keeps working when part of it is damaged.
      </p>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        For product packaging, inventory labels and asset tags read by a scanner, use this barcode generator.
        To open a web page from a phone camera, use the <RouterLink to="/en/" class="text-link underline font-700">free QR code generator</RouterLink> instead.
      </p>
      <p class="text-ink/80 font-600 mt-3 leading-relaxed">
        Need a whole list at once, such as every asset tag or a run of in-store codes? The <RouterLink to="/en/batch/" class="text-link underline font-700">bulk barcode generator</RouterLink> turns a list from Excel or a CSV file into a ZIP of barcodes, works out every EAN-13 check digit, and prints barcode labels on Letter sheets.
      </p>

      <h3 class="text-xl font-700 text-ink mt-8">Which barcode type should I use?</h3>
      <ul class="list-disc pl-5 mt-3 space-y-1 text-ink/80 font-600 leading-relaxed">
        <li><strong class="text-ink">Code 128</strong>: the everyday choice for shipping, warehouses, inventory and asset tags. It takes letters, numbers and symbols and prints the shortest for the same content. Pick this one if you are not sure.</li>
        <li><strong class="text-ink">EAN-13</strong>: the international retail product barcode used at checkout. Thirteen digits, the last one a check digit worked out from the others to catch typos.</li>
        <li><strong class="text-ink">EAN-8</strong>: the short version of EAN-13 for packs too small for a full barcode.</li>
        <li><strong class="text-ink">Code 39</strong>: the oldest letters-and-numbers barcode and the most compatible with old equipment, but about 30% wider than Code 128 for the same content.</li>
        <li><strong class="text-ink">ITF-14</strong>: for outer cases and shipping cartons. Thick bars that scan from a distance, with the thick frame (bearer bar) the standard calls for.</li>
      </ul>

      <h3 class="text-xl font-700 text-ink mt-8">How to make a barcode</h3>
      <ol class="doc-steps text-ink/85 font-600">
        <li v-for="(s, i) in steps" :key="i">
          <span class="step-no">{{ i + 1 }}</span>
          <span>{{ s }}</span>
        </li>
      </ol>

      <h3 class="text-xl font-700 text-ink mt-8">FAQ</h3>
      <div class="doc-faq text-ink/85 font-600">
        <details v-for="(f, i) in faqs" :key="i">
          <summary>{{ f.q }}<span class="i-lucide-chevron-down faq-chevron" aria-hidden="true" /></summary>
          <p>{{ f.a }}</p>
        </details>
      </div>
    </article>
  </div>
</template>
