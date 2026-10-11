/**
 * 頁尾的「回報問題」（照口袋工具的頁尾連結契約）：網址只帶 site=qrcode-studio、另開分頁、不帶 referrer，
 * 點下去才補目前頁面的 pathname（產生器與掃描器的內容不在網址上，? 與 # 也不帶）。
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { publisher } from '@/config/site'

const CONTRACT = /^https:\/\/www\.pocketool\.app\/feedback\/(en\/)?\?site=[a-z0-9-]+$/

function mountLayout() {
  return mount(DefaultLayout, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, RouterView: true } } })
}

describe('頁尾的回報問題', () => {
  it('網址合契約，另開分頁、不帶 referrer，class 不含 feedback', () => {
    expect(publisher.reportUrl).toMatch(CONTRACT)
    const a = mountLayout().get('footer a[data-test="report-link"]')
    expect(a.attributes('href')).toBe('https://www.pocketool.app/feedback/?site=qrcode-studio')
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('rel')?.split(' ')).toEqual(expect.arrayContaining(['nofollow', 'noopener']))
    expect(a.attributes('referrerpolicy')).toBe('no-referrer')
    expect(a.text()).toBe('回報問題（另開分頁）')
    expect(a.attributes('class') ?? '').not.toMatch(/feedback/)
  })

  it('點下去只補 pathname：網址上的 ? 與 # 不外流', async () => {
    history.replaceState(null, '', '/qrcode-studio/wifi/?ssid=x#preview')
    const a = mountLayout().get('footer a[data-test="report-link"]')
    a.element.addEventListener('click', (e) => e.preventDefault())
    await a.trigger('click')
    expect((a.element as HTMLAnchorElement).href).toBe(`${publisher.reportUrl}&path=${encodeURIComponent('/qrcode-studio/wifi/')}`)
  })
})
