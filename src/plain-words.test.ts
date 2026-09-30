// @vitest-environment node
/**
 * 用字：畫面上先寫使用者聽得懂的說法，只有工程師懂的詞不要回來（規則見 AGENTS.md「用字」）。
 *
 * 掃的是工具區與一般頁面的原始檔：元件、設定、composable、純函式、版面，以及頁面（關於頁、隱私權頁除外）。
 * 關於頁的授權段落與隱私權頁要求準確，允許原詞放在括號裡；教學本文（src/content/）同樣允許括號原詞，都不掃。
 * 註解不算：只看會進畫面的字串與模板文字。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

function walk(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const rel = `${dir}/${name}`
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel]
  })
}

const EXCLUDED = new Set(['src/pages/AboutPage.vue', 'src/pages/PrivacyPage.vue'])

const SOURCES = [
  ...walk('src/components').filter((f) => f.endsWith('.vue')),
  ...walk('src/config').filter((f) => f.endsWith('.ts')),
  ...walk('src/composables').filter((f) => f.endsWith('.ts')),
  ...walk('src/pure').filter((f) => f.endsWith('.ts')),
  ...walk('src/layouts').filter((f) => f.endsWith('.vue')),
  ...walk('src/pages').filter((f) => f.endsWith('.vue')),
].filter((f) => !/\.test\.ts$/.test(f) && !EXCLUDED.has(f))

/** 這些詞改用白話，畫面上不再出現（括號裡也不要）。「半角」是台灣少用的說法，一律寫「半形」。 */
const BANNED = ['通訊協定', '網站主機', '符號學', '演算法', '算圖', '半角', '前景色', '可列印的 ASCII', '第一版']

/** 拿掉註解：區塊註解、HTML 註解，以及前面是行首或空白的 `//` 行註解（`https://` 前面是冒號，不會被誤砍） */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
}

describe('畫面上不用只有工程師懂的詞', () => {
  it('有掃到東西（清單不能是空的）', () => {
    expect(SOURCES.length).toBeGreaterThan(40)
    expect(SOURCES).toContain('src/components/StylePanel.vue')
    expect(SOURCES).toContain('src/pages/ScanPage.vue')
    expect(SOURCES).not.toContain('src/pages/AboutPage.vue')
  })

  it('去掉註解之後，拿掉的只有註解', () => {
    expect(stripComments("const a = 'https://x.tw/' // 演算法")).toBe("const a = 'https://x.tw/' ")
    expect(stripComments('<!-- 符號學 --><p>讀取中</p>')).toBe('<p>讀取中</p>')
    expect(stripComments('/** 算圖 */\nconst b = 1')).toBe('\nconst b = 1')
  })

  it.each(SOURCES)('%s', (file) => {
    const text = stripComments(readFileSync(join(root, file), 'utf8'))
    const found = BANNED.filter((w) => text.includes(w))
    expect(found, `${file} 還有：${found.join('、')}`).toEqual([])
  })
})
