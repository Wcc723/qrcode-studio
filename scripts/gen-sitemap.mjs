// Placeholder sitemap generator — will be implemented in a later task
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const site = 'https://qrtool.example'
const routes = ['/', '/url', '/wifi', '/vcard', '/text', '/email', '/phone', '/sms']

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url><loc>${site}${r}</loc></url>`).join('\n')}
</urlset>`

writeFileSync(join(process.cwd(), 'dist', 'sitemap.xml'), xml)
console.log('sitemap.xml generated')
