<script setup lang="ts">
/**
 * 英文的批次頁（/en/batch/）：Bulk QR code and barcode generator，跟繁中的 /batch/ 成對。
 * 工具是同一個 BatchTool（英文版：美國 Letter 的標籤紙、英寸、英文字型），說明文章與常見問題是給美國使用者寫的
 * （inventory、storage bins、asset tags、moving boxes），不是繁中頁的翻譯。
 * 規格數字從 paper.ts 與 validateBarcode.ts 帶，不寫死（src/batch-gates.test.ts 會掃）。
 */
import BatchTool from '@/components/batch/BatchTool.vue'
import ToolZone from '@/components/ToolZone.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { provideUiCopy } from '@/locales/ui'
import { uiCopyEn } from '@/locales/ui.en'
import { publisher, site } from '@/config/site'
import { BATCH_MAX_ROWS } from '@/pure/batch/rows'
import { formatCount } from '@/pure/batch/sequence'
import { BARCODE_MIN_X_MM, CALIBRATION_IN, PRINTER_EDGE_FROM_MM, PRINTER_EDGE_MM } from '@/pure/batch/paper'
import { inches } from '@/pure/batch/copy'
import { CODE128_MAX_LENGTH, CODE39_MAX_LENGTH } from '@/pure/validateBarcode'

const max = formatCount(BATCH_MAX_ROWS)
const code128MinMm = BARCODE_MIN_X_MM.code128
const edgeRange = `${inches(PRINTER_EDGE_FROM_MM)} to ${inches(PRINTER_EDGE_MM)} inch`

// link：答案後面接一段文字與連結（站內用 RouterLink，hub 的英文頁用一般連結），不走 v-html
interface BatchFaq { q: string; a: string; link?: { lead: string; to?: string; href?: string; text: string } }
const faqs: BatchFaq[] = [
  { q: 'How do I make QR codes from an Excel or CSV file?', a: 'Select the cells in Excel or Google Sheets (header row included, if you like) and copy them, choose "Paste from Excel or CSV" on this page and paste. Pick the code column, the file name column and the code type, then click Download ZIP. For a CSV file, open it in Excel or Google Sheets first and copy the cells. No add-ins, barcode fonts or formulas needed.' },
  { q: 'How many codes can I make at once?', a: `Up to ${max} per batch, as PNG or SVG. Everything is generated in your browser, so bigger batches and larger images take longer; a progress bar shows how far along it is, and you can cancel at any time. For more, split the list into batches.` },
  { q: 'Is my list uploaded?', a: 'No. Your list and the finished images stay in this tab\'s memory, the ZIP is built in your browser and downloaded directly, and none of it is saved in the URL, cookies or browser storage. If you tick "Remember this printer\'s offset", only the two offset numbers are saved in this browser, never your list. The site\'s analytics record only a rough count range (such as 51 to 200), the code type and whether you downloaded PNG or SVG or printed labels, never the list or the file names.', link: { lead: ' See the ', href: publisher.privacyUrlEn, text: 'Pocketool privacy policy' } },
  { q: 'Why are some rows marked red?', a: `That row cannot be made into a code, and the red text says why: the content is too long for a QR code; an EAN-13, EAN-8 or ITF-14 number has letters in it (spaces and dashes are removed for you), the wrong number of digits or a check digit that does not match; Code 128 is longer than ${CODE128_MAX_LENGTH} characters or Code 39 longer than ${CODE39_MAX_LENGTH}; there are characters the barcode cannot hold, such as accented letters, or # @ & in Code 39; or the cell is empty. Choose "Skip rows with problems" to make the rest now, or fix the spreadsheet and paste it again. Repeated values are only flagged and still generated.` },
  { q: 'Do I need to work out EAN-13 check digits?', a: 'No. Enter 12 digits and the 13th is added for you; enter all 13 and the check digit is verified, with the correct digit shown when it does not match. Sequences work the same way, so every number in a run of in-store codes gets its own check digit.' },
  { q: 'How are the files named?', a: 'When you paste from a spreadsheet, choose a file name column such as the asset tag. For one-per-line lists and sequences, use the content itself or a number (001, 002…). Characters that file names cannot contain (/ \\ : * ? " < > |) become underscores, and repeated names get (2), (3) added.' },
  { q: 'Can I print on Avery labels?', a: 'Yes. Choose "Print labels" as the output, pick a Letter sheet laid out like Avery 5160, 5163, 5167 or 22806 (or an A4 sheet, or a custom size), and add up to three lines of text to each label. Then click Print labels to print from your browser. This site does not create PDF files; to save one, choose "Save as PDF" in the print dialog.' },
  { q: 'What if the labels print out of line?', a: `Print the alignment test page on plain paper first and measure its ruler: it should be exactly ${CALIBRATION_IN} inches. If it is shorter, your print settings are scaling the page, so set the scale to "Actual size" or 100% and the margins to "None", not "Fit to page". If the size is right but everything sits off to one side, hold the test page over a label sheet against the light, enter the difference under "Offset adjustment" and print again. Tick "Remember this printer's offset" to keep it for next time.` },
  { q: 'Can I use a half-used label sheet?', a: 'Yes. Enter the first unused label under "Start at label", counting left to right and top to bottom. The labels before it stay blank. Only the first sheet is affected; the next sheet starts at label 1.' },
  { q: 'Why are there no colors or logos?', a: 'Black and white scans best on labels and barcodes, so bulk codes are always black on white.', link: { lead: ' For a single color QR code with your logo, use the ', to: '/en/', text: 'free QR code generator' } },
]

const steps = [
  'Choose how to add your list: paste from Excel or CSV, enter one item per line, or set up a number sequence.',
  'To turn IDs into links, add a template such as https://example.com/asset/{id}.',
  'Pick QR code or a barcode type, and check the results for any red rows.',
  'Choose PNG or SVG and click Download ZIP, or choose Print labels, pick your sheet and click Print labels.',
]

// 底下的共用元件（產生器、外觀、預覽、隱私那一行）拿英文的文案；英文字串跟著這一頁的 chunk，不進 entry
provideUiCopy(uiCopyEn)

useSeoHead({
  title: 'Bulk QR Code Generator and Barcode Maker from Excel or CSV',
  description: 'Free bulk QR code and barcode generator: paste from Excel or CSV, download a ZIP of PNG or SVG files, or print labels on Avery-size sheets. No upload.',
  path: '/en/batch',
  appName: 'Bulk QR Code and Barcode Generator',
  appType: 'WebApplication',
  locale: 'en',
  // 圖上的字在 scripts/brand/cards.mjs（og-en-batch.png）：替代文字以大標開頭，寫著橫幅、每個小標籤，最後一句講右邊的圖，只用 ASCII
  ogImage: {
    path: '/og-en-batch.png', width: 1200, height: 630,
    alt: 'Bulk QR Code Generator: Barcodes and labels from Excel or CSV. Get a ZIP of PNG or SVG files or print Letter labels, with no upload. On the right is a QR code card tucked into an orange pocket',
  },
  breadcrumbs: [
    { name: site.nameEn, url: `${site.url}/en/` },
    { name: 'Bulk QR Code and Barcode Generator', url: `${site.url}/en/batch/` },
  ],
})
</script>

<template>
  <div>
    <ToolZone lead="Paste from Excel or CSV, get a ZIP or print labels">
      <template #title>Bulk QR Code and Barcode Generator</template>
      <BatchTool />
    </ToolZone>

    <article class="max-w-[720px] mx-auto px-4 mt-10 text-ink/85 font-600 leading-relaxed" data-test="doc">
      <p class="zone-label"><span class="icon-badge-sm bg-pop-sky"><span class="i-lucide-book-open" aria-hidden="true" /></span>How it works</p>
      <p class="text-lg text-ink" data-test="doc-lead">
        Turn a whole list into QR codes or barcodes in one go. Paste cells from Excel, Google Sheets or a CSV file, enter one item per line, or number a sequence, then download every code as a PNG or SVG file in a single ZIP.
        This free bulk barcode generator also handles Code 128, EAN-13, EAN-8, Code 39 and ITF-14, adds check digits for you and flags problem rows before you print. Your list is processed in your browser and never uploaded.
        You can also print QR code labels and barcode labels straight onto US Letter sheets in common Avery sizes, starting from any label on the sheet.
      </p>

      <h2 class="text-2xl font-800 text-ink mt-8">Three ways to add your list</h2>
      <ul class="list-disc pl-5 mt-3 space-y-2">
        <li><strong class="text-ink">Paste from Excel or CSV</strong>: select the cells in Excel or Google Sheets, header row included if you like, then copy and paste. The tool works out whether the first row is a header; you pick the column that goes into each code and the one that names the files. A CSV file works the same way once you open it in a spreadsheet.</li>
        <li><strong class="text-ink">One per line</strong>: one link or ID per line, with blank lines skipped. Handy when you already have a list of URLs.</li>
        <li><strong class="text-ink">Number sequence</strong>: set a prefix, start, count or end number, step, zero padding and suffix, such as BIN-0001 to BIN-0500. The first three and the last value appear as you type, with no need to fill a spreadsheet first.</li>
      </ul>

      <h2 class="text-2xl font-800 text-ink mt-10">Popular uses</h2>
      <h3 class="text-xl font-700 text-ink mt-6">Inventory and storage bins</h3>
      <p class="mt-3">Number your bins and shelves with a sequence (for example BIN-001 to BIN-200) and choose Code 128 for a handheld scanner, or QR code if people will scan with a phone. Add a second line of text such as the aisle or the contents so the label reads at a glance.</p>

      <h3 class="text-xl font-700 text-ink mt-6">Asset tags for equipment</h3>
      <p class="mt-3">Copy the asset tag column from your equipment list, header included, and choose it as the code column. For a scanner that types the ID into your system, choose Code 128. To open each item's record with a phone camera instead, choose QR code and use a template such as <code>https://your-site.example/asset/{id}</code>.</p>

      <h3 class="text-xl font-700 text-ink mt-6">Moving boxes</h3>
      <p class="mt-3">Number the boxes and print QR code labels with the room and a short list of contents on each one. Link each code to a shared sheet or form with the full packing list, and anyone unpacking can see what is inside without opening the box.</p>

      <h3 class="text-xl font-700 text-ink mt-6">Product barcodes and in-store codes</h3>
      <p class="mt-3">For codes used only inside your own business, you can use EAN-13 numbers starting with 20 to 29. GS1 sets these aside as restricted circulation numbers: they are never issued as product GTINs, and the GS1 office in each country decides how they may be used. Choose a sequence with prefix 20 and zero padding 10, and every check digit is calculated for you. To sell through retailers, you need official numbers from GS1 US or the GS1 office in your country; this tool draws the barcodes for numbers you already have.</p>

      <h3 class="text-xl font-700 text-ink mt-6">Google Forms with each code's ID filled in</h3>
      <ol class="list-decimal pl-5 mt-3 space-y-1">
        <li>In Google Forms, choose "Get pre-filled link", type a sample answer such as TEST in the ID question, and copy the link.</li>
        <li>Paste the link into the template and replace TEST at the end with <code>{id}</code>, for example <code>…&amp;entry.123456789={id}</code>.</li>
        <li>Paste your list of IDs or set up a sequence. Each QR code opens the form with its own ID already filled in.</li>
      </ol>
      <p class="mt-3">When the template is a link, each value is encoded for URLs, so spaces and symbols such as &amp; will not break it.</p>

      <h2 class="text-2xl font-800 text-ink mt-10">Print QR code labels and barcode labels on Letter sheets</h2>
      <p class="mt-3">Choose "Print labels" as the output and your list is laid out on label sheets, ready to print from your browser, with no mail merge in Word. Each label gets a code plus one to three lines of text, such as an asset tag, an item name and a location; text shrinks to fit and is cut off only when it is too long, with the affected rows listed.</p>
      <ul class="list-disc pl-5 mt-3 space-y-2">
        <li><strong class="text-ink">Avery-compatible sizes</strong>: US Letter sheets laid out like Avery 5160 (30 per sheet, 2⅝ × 1 inch), 5163 (10 per sheet, 4 × 2 inch), 5167 (80 per sheet, 1¾ × ½ inch) and 22806 (12 square labels, 2 × 2 inch), plus an A4 sheet of 21 labels and a custom size for anything else.</li>
        <li><strong class="text-ink">Start at any label</strong>: on a partly used sheet, enter the first unused label and the ones before it stay blank.</li>
        <li><strong class="text-ink">Several copies of each</strong>: print two of the same label in a row, for example one for the item and one for its box.</li>
        <li><strong class="text-ink">Safe edges</strong>: most printers cannot print the outer {{ edgeRange }} of the page, so codes and text in labels that touch the edge are pulled in automatically.</li>
        <li><strong class="text-ink">No labels that will not scan</strong>: if a barcode would be squeezed too thin for its label, for example a Code 128 bar narrower than {{ code128MinMm }} mm, the tool explains why and turns off printing instead of wasting a sheet.</li>
      </ul>
      <p class="mt-3 text-sm text-muted">Avery is a trademark of Avery Products Corporation. This site is not affiliated with Avery; the product numbers only describe sheets with the same layout.</p>

      <h3 class="text-xl font-700 text-ink mt-6">Line it up before you print</h3>
      <ol class="list-decimal pl-5 mt-3 space-y-1">
        <li>Under "What to print", choose "Alignment test page" and print it on plain paper. It shows only the label outlines, their numbers and a {{ CALIBRATION_IN }}-inch ruler.</li>
        <li>Measure the ruler. If it is not exactly {{ CALIBRATION_IN }} inches, your print settings are scaling the page: set the scale to "Actual size" or 100% and the margins to "None", and avoid "Fit to page".</li>
        <li>Hold the test page over a label sheet against the light. The lines should sit on the label edges. If everything is off in one direction, enter the difference under "Offset adjustment" and print the test page again. Tick "Remember this printer's offset" to keep it.</li>
        <li>Once it lines up, load the label sheet, switch back to "Labels" and click Print labels.</li>
      </ol>

      <h2 class="text-2xl font-800 text-ink mt-10">Barcode or QR code?</h2>
      <p class="mt-3">Use a barcode when a scanner reads an ID into your inventory, asset or checkout system: Code 128 is the most versatile, and EAN-13 is for retail products. Use a QR code when people should open a web page, form or manual with their phone camera. You can make both from the same list: make the QR codes once, then switch to Code 128 and make them again.</p>
      <p class="mt-3">For a single code, use the <RouterLink to="/en/barcode/" class="text-link underline underline-offset-2 font-700">barcode generator</RouterLink> or the <RouterLink to="/en/" class="text-link underline underline-offset-2 font-700">free QR code generator</RouterLink>, which also lets you pick colors and add a logo.</p>

      <h2 class="text-2xl font-800 text-ink mt-10">Printed codes never expire, so pick links you can keep</h2>
      <p class="mt-3">These are static QR codes: the link is stored in the code itself, with no redirect service in between, so a printed label never stops working because some service shut down. The link inside still has to keep working, though. Use addresses you control for the long run, avoid link shorteners and pages you might move later, because changing the link means reprinting every label.</p>

      <h2 class="text-2xl font-800 text-ink mt-10">How to make QR codes in bulk</h2>
      <ol class="doc-steps">
        <li v-for="(s, i) in steps" :key="i">
          <span class="step-no">{{ i + 1 }}</span>
          <span>{{ s }}</span>
        </li>
      </ol>

      <h2 class="text-2xl font-800 text-ink mt-10">FAQ</h2>
      <div class="doc-faq">
        <details v-for="(f, i) in faqs" :key="i">
          <summary>{{ f.q }}<span class="i-lucide-chevron-down faq-chevron" aria-hidden="true" /></summary>
          <p>{{ f.a }}<template v-if="f.link">{{ f.link.lead }}<RouterLink v-if="f.link.to" :to="f.link.to" class="text-link underline underline-offset-2 font-700">{{ f.link.text }}</RouterLink><a v-else :href="f.link.href" class="text-link underline underline-offset-2 font-700">{{ f.link.text }}</a>.</template></p>
        </details>
      </div>
    </article>
  </div>
</template>
