import { describe, it, expect } from 'vitest'
import { applyTemplate, checkTemplate, TEMPLATE_TOKEN } from './template'

describe('checkTemplate', () => {
  it('留白表示不套範本', () => {
    expect(checkTemplate('')).toEqual({ ok: true, isUrl: false, empty: true })
    expect(checkTemplate('   ')).toEqual({ ok: true, isUrl: false, empty: true })
  })

  it('網址範本與一般文字範本', () => {
    expect(checkTemplate('https://example.com/asset/{編號}')).toEqual({ ok: true, isUrl: true, empty: false })
    expect(checkTemplate('HTTP://EXAMPLE.COM/{編號}')).toMatchObject({ ok: true, isUrl: true })
    expect(checkTemplate('ASSET-{編號}')).toEqual({ ok: true, isUrl: false, empty: false })
  })

  it('沒有 {編號} 時每一張都會一樣，擋下來', () => {
    const r = checkTemplate('https://example.com/asset/')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain(TEMPLATE_TOKEN)
    expect(checkTemplate('https://example.com/{編碼}').ok).toBe(false)
  })

  it('中文輸入法的全形大括號也認得', () => {
    expect(checkTemplate('https://example.com/｛編號｝').ok).toBe(true)
  })
})

describe('applyTemplate', () => {
  it('留白時內容就是值本身，不轉碼', () => {
    expect(applyTemplate('', 'A 01/中')).toBe('A 01/中')
  })

  it('網址範本：值先轉成網址可用的寫法再代入', () => {
    expect(applyTemplate('https://example.com/asset/{編號}', 'TP-0001')).toBe('https://example.com/asset/TP-0001')
    expect(applyTemplate('https://example.com/asset/{編號}', 'A 01/中')).toBe('https://example.com/asset/A%2001%2F%E4%B8%AD')
    // & 與 = 不會把查詢字串拆壞
    expect(applyTemplate('https://example.com/?id={編號}&from=label', 'a&b=c')).toBe('https://example.com/?id=a%26b%3Dc&from=label')
  })

  it('Google 表單預填網址', () => {
    const tpl = 'https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.123456789={編號}'
    expect(applyTemplate(tpl, '會員 0007')).toBe('https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.123456789=%E6%9C%83%E5%93%A1%200007')
  })

  it('一般文字範本照字面代入，可以出現好幾次；全形大括號也換', () => {
    expect(applyTemplate('ASSET-{編號}-{編號}', 'a b')).toBe('ASSET-a b-a b')
    expect(applyTemplate('NO.｛編號｝', '7')).toBe('NO.7')
  })

  it('值裡的 $& 不會被當成特殊替換符號', () => {
    expect(applyTemplate('X-{編號}', '$&$1')).toBe('X-$&$1')
  })

  it('落單的 surrogate 不會讓轉碼丟錯', () => {
    expect(applyTemplate('https://e.com/{編號}', 'a\uD800b')).toBe('https://e.com/a%EF%BF%BDb')
  })

  it('範本前後的空白去掉', () => {
    expect(applyTemplate('  https://e.com/{編號}  ', '1')).toBe('https://e.com/1')
  })
})
