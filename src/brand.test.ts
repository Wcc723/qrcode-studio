// @vitest-environment node
/**
 * 產品名與站徽的護欄。
 *
 * 產品名只有一個開關（src/config/site.ts 的 name），其餘都要從它取：頁首、頁尾、title 後綴、og:site_name、
 * JSON-LD、manifest、favicon.svg 的替代文字。舊名 QR Code Studio 只留在 site.ts 的 formerNames
 * （JSON-LD alternateName 與關於頁更新紀錄的「原名」從那裡取），原始碼其他地方寫死舊名就擋下來。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { site } from '@/config/site'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

function walk(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const rel = `${dir}/${name}`
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel]
  })
}

describe('產品名只有一個開關', () => {
  const sources = [
    'index.html',
    ...walk('src').filter((f) => /\.(vue|ts)$/.test(f) && !/\.test\.ts$/.test(f) && !f.endsWith('.d.ts')),
  ]

  it('有掃到東西（清單不能是空的）', () => {
    expect(sources.length).toBeGreaterThan(40)
  })

  it('舊名 QR Code Studio 只寫在 site.ts 的 formerNames', () => {
    const offenders = sources.filter((f) => f !== 'src/config/site.ts' && read(f).includes('QR Code Studio'))
    expect(offenders).toEqual([])
  })

  it('新名不寫死在頁面與元件裡（一律用 site.name）', () => {
    const offenders = sources.filter((f) => f !== 'src/config/site.ts' && read(f).includes(site.name))
    expect(offenders).toEqual([])
  })

  it('頁尾與關於頁用同一句商標聲明', () => {
    expect(read('src/layouts/DefaultLayout.vue')).toContain('{{ site.trademark }}')
    expect(read('src/pages/AboutPage.vue')).toContain('{{ site.trademark }}')
  })
})
