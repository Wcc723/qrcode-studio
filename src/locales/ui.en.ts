/**
 * 全站共用元件的英文文案（結構與繁中那份一樣，見 ui.ts）。只有英文頁 import 這份，再用 provideUiCopy 交給底下的元件，
 * 所以它跟著英文頁的 chunk 走，不進 entry chunk：繁中頁的訪客不必多下載英文字串。
 */
import type { GeneratorCopy, PreviewCopy, PrivacyCopy, StyleCopy, UiCopy } from './ui'

const privacyCopyEn: PrivacyCopy = {
  name: { scan: 'Images stay on your device', other: 'Nothing is uploaded' },
  line: { scan: 'Read in your browser, images are never uploaded', other: 'Made in your browser, nothing is uploaded' },
  generate: 'The link and the logo you add are turned into an image right here in your browser. Nothing is sent to a server, and this site keeps none of it.',
  barcode: 'What you type is turned into a barcode right here in your browser. Nothing is sent to a server, and this site keeps none of it.',
  batch: 'Your list and the finished images live only in this tab\'s memory. The ZIP is built in your browser and downloaded straight to your device, and label sheets are laid out and printed from your browser too. Nothing is uploaded or saved in the URL, cookies or browser storage, so closing the tab clears it all. If you tick "Remember this printer\'s offset", only the two offset numbers are saved.',
  scan: 'The reader runs right here in your browser. Images and what they contain exist only while this tab is open: nothing is uploaded or saved, and closing the tab clears it all.',
  stats: { before: 'The site counts page views with Google Analytics and Cloudflare Web Analytics. Those statistics never include what you type, paste or drop in. See the ', link: 'Pocketool privacy policy', after: '.' },
}

const generatorCopyEn: GeneratorCopy = {
  input: 'Your link',
  look: 'Style',
  preview: 'Preview and download',
  downloadHelpName: 'file formats',
  downloadHelp: [
    { strong: 'PNG', text: ': the everyday choice for web pages, documents and chat. Supports a transparent background.' },
    { strong: 'SVG', text: ': sharp at any size. Use it for print, signs and anything a designer will lay out.' },
    { strong: 'JPG', text: ': only when a form or app accepts nothing else. No transparent background.' },
  ],
  copyHelp: '"Copy" puts the PNG image on your clipboard, ready to paste into a chat, an email or a document.',
  url: {
    label: 'Website URL',
    help: 'If the link does not start with https://, it is added for you. Longer links make a denser pattern, so if the code will be printed small, shorten the link first. Tracking tags after the ? (such as ?utm_source=flyer) are kept exactly as typed.',
  },
}

const styleCopyEn: StyleCopy = {
  colorName: 'colors',
  color: 'Colors',
  colorHelp: 'Phone cameras read the contrast between light and dark, so keep dark squares on a light background, and keep both ends of a gradient dark. Light squares on a dark background (inverted) fail on many scanner apps.',
  dotColor: 'Square color',
  bgColor: 'Background',
  transparent: 'Transparent background',
  transparentNote: 'JPG cannot be transparent, so a JPG download gets a white background. For a transparent background, download PNG or SVG. The quiet zone around a transparent code is transparent too, so place it on a plain white or light surface.',
  gradient: 'Use a gradient',
  gradientColor: 'Second gradient color',
  logoName: 'logo',
  logo: 'Add a logo',
  logoHelp: 'Your logo is read in your browser and never uploaded. Adding one switches error correction to the highest level (H) automatically. The logo sits in the center and covers at most about 9% of the squares, so the code still scans normally.',
  logoHelp2: { before: 'A PNG with a transparent background and a simple shape works best. Scan it with your phone before you print a batch.', after: '' },
  removeLogo: 'Remove logo',
  ecName: 'error correction',
  ec: 'Error correction',
  ecHelp: 'How much of the code can be dirty, worn or covered by a logo and still scan: about 7%, 15%, 25% and 30% for L, M, Q and H. Higher levels add more, smaller squares. M suits most uses, Q is better for stickers and anything outdoors, and adding a logo switches to H for you.',
  ecHelp2: { before: 'If in doubt, keep M.', after: '' },
  ecLabel: { L: 'Low: simplest pattern (screens)', M: 'Medium: everyday use (recommended)', Q: 'Quartile: stickers, outdoors', H: 'High: codes with a logo' },
  sizeName: 'image size',
  size: px => ({ label: 'Image size: ', value: `${px} px` }),
  sizeHelp: 'Width and height of the PNG and JPG download, from 200 to 2000 pixels, including the blank margin (quiet zone) of at least 4 squares on every side. At print quality (300 dpi), 1000 pixels prints about 3.3 inches wide and 2000 pixels about 6.7 inches. For anything larger, download the SVG, which stays sharp at any size.',
}

const previewCopyEn: PreviewCopy = {
  demo: 'Sample',
  hint: 'Your QR code appears here as you type',
  download: 'Download ',
  copy: 'Copy',
  copied: 'Copied',
  copiedMessage: 'QR code image copied. Paste it into a chat, an email or a document.',
  copyFailed: 'Copying did not work. Please download the PNG instead.',
  dockExpand: 'Full preview',
  dockFormats: 'More formats',
  capacity: 'Too long for a QR code. Shorten the content or lower the error correction level.',
  size: 'The image is too small for this content and its quiet zone. Make the image larger or shorten the content.',
}

export const uiCopyEn: UiCopy = {
  privacy: privacyCopyEn,
  generator: generatorCopyEn,
  style: styleCopyEn,
  preview: previewCopyEn,
}
