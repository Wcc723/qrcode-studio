import { describe, it, expect } from 'vitest'
import {
  validateBarcode, gtinCheckDigit, ean13CheckDigit, ean8CheckDigit, itf14CheckDigit,
  code39CheckChar, CODE39_CHARSET, CODE39_MAX_LENGTH, CODE128_MAX_LENGTH,
} from './validateBarcode'

const ok = (normalized: string, appendedCheckDigit = false) => ({ ok: true, normalized, appendedCheckDigit })
const err = (code: string, error: string) => ({ ok: false, code, error })

describe('gtinCheckDigit（GS1 mod-10，最右資料位權重 3，往左交替）', () => {
  it('EAN-13 的 12 位資料位：544900000099 → 6', () => { expect(gtinCheckDigit('544900000099')).toBe('6') })
  it('EAN-13 的 12 位資料位：400638133393 → 1', () => { expect(gtinCheckDigit('400638133393')).toBe('1') })
  it('EAN-8 的 7 位資料位：5512345 → 7', () => { expect(gtinCheckDigit('5512345')).toBe('7') })
  it('ITF-14 的 13 位資料位：1540014128876 → 3', () => { expect(gtinCheckDigit('1540014128876')).toBe('3') })
  it('全為 0 時檢查碼為 0（不是 10）', () => {
    expect(gtinCheckDigit('000000000000')).toBe('0')
    expect(gtinCheckDigit('0000000')).toBe('0')
    expect(gtinCheckDigit('0000000000000')).toBe('0')
  })
  it('999999999999 → 4', () => { expect(gtinCheckDigit('999999999999')).toBe('4') })
})

describe('ean13CheckDigit', () => {
  it('978020137962 → 4（ISBN-13 9780201379624）', () => { expect(ean13CheckDigit('978020137962')).toBe('4') })
  it('544900000099 → 6', () => { expect(ean13CheckDigit('544900000099')).toBe('6') })
  it('007567816412 → 5（UPC-A 零擴充，前導 0 要算進去）', () => { expect(ean13CheckDigit('007567816412')).toBe('5') })
  it('001234567890 → 5', () => { expect(ean13CheckDigit('001234567890')).toBe('5') })
})

describe('ean8CheckDigit', () => {
  it('9638507 → 4', () => { expect(ean8CheckDigit('9638507')).toBe('4') })
  it('5512345 → 7', () => { expect(ean8CheckDigit('5512345')).toBe('7') })
  it('7351353 → 7', () => { expect(ean8CheckDigit('7351353')).toBe('7') })
  it('2088650 → 9', () => { expect(ean8CheckDigit('2088650')).toBe('9') })
  it('1234567 → 0', () => { expect(ean8CheckDigit('1234567')).toBe('0') })
})

describe('itf14CheckDigit', () => {
  it('1540014128876 → 3', () => { expect(itf14CheckDigit('1540014128876')).toBe('3') })
  it('1061414100041 → 5', () => { expect(itf14CheckDigit('1061414100041')).toBe('5') })
  it('0001234567890 → 5', () => { expect(itf14CheckDigit('0001234567890')).toBe('5') })
})

describe('權重起點回歸測試（經典 off-by-one）', () => {
  it('EAN-13：最左位權重是 1（12 位為偶數），5449000000996 才會成立', () => {
    expect(gtinCheckDigit('544900000099')).toBe('6')
    expect(gtinCheckDigit('544900000099')).not.toBe('4')
  })
  it('EAN-8：最左位權重是 3（7 位為奇數），55123457 才會成立', () => {
    expect(gtinCheckDigit('5512345')).toBe('7')
    expect(gtinCheckDigit('5512345')).not.toBe('3')
  })
  it('ITF-14：最左位權重是 3（13 位為奇數），15400141288763 才會成立', () => {
    expect(gtinCheckDigit('1540014128876')).toBe('3')
    expect(gtinCheckDigit('1540014128876')).not.toBe('9')
  })
})

describe('validateBarcode / ean13', () => {
  it('13 位完整碼通過：5449000000996', () => { expect(validateBarcode('ean13', '5449000000996')).toEqual(ok('5449000000996')) })
  it('13 位完整碼通過：4006381333931', () => { expect(validateBarcode('ean13', '4006381333931')).toEqual(ok('4006381333931')) })
  it('ISBN-13 通過：9780201379624', () => { expect(validateBarcode('ean13', '9780201379624')).toEqual(ok('9780201379624')) })
  it('前導 0 不會被吃掉：0075678164125', () => { expect(validateBarcode('ean13', '0075678164125')).toEqual(ok('0075678164125')) })
  it('12 位自動補檢查碼：544900000099 → 5449000000996', () => { expect(validateBarcode('ean13', '544900000099')).toEqual(ok('5449000000996', true)) })
  it('12 位含前導 0 自動補：001234567890 → 0012345678905', () => { expect(validateBarcode('ean13', '001234567890')).toEqual(ok('0012345678905', true)) })
  it('12 位全 0 自動補 0：000000000000 → 0000000000000', () => { expect(validateBarcode('ean13', '000000000000')).toEqual(ok('0000000000000', true)) })
  it('13 位全 0 通過：0000000000000', () => { expect(validateBarcode('ean13', '0000000000000')).toEqual(ok('0000000000000')) })
  it('去掉連字號後驗證：978-0-201-37962-4', () => { expect(validateBarcode('ean13', '978-0-201-37962-4')).toEqual(ok('9780201379624')) })
  it('去掉空白後驗證：5449 0000 0099 6', () => { expect(validateBarcode('ean13', '5449 0000 0099 6')).toEqual(ok('5449000000996')) })
  it('檢查碼錯誤要明確報錯：5449000000990', () => {
    expect(validateBarcode('ean13', '5449000000990')).toEqual(err('checkDigit',
      '檢查碼不符。EAN-13 前 12 位算出的檢查碼應該是 6，你輸入的是 0。請確認號碼，或只輸入前 12 位讓工具自動補。'))
  })
  it('檢查碼錯誤（另一組）：4006381333930', () => {
    expect(validateBarcode('ean13', '4006381333930')).toEqual(err('checkDigit',
      '檢查碼不符。EAN-13 前 12 位算出的檢查碼應該是 1，你輸入的是 0。請確認號碼，或只輸入前 12 位讓工具自動補。'))
  })
  it('長度 5 位報長度錯', () => {
    expect(validateBarcode('ean13', '12345')).toEqual(err('length',
      'EAN-13 需要 12 位數字（工具會自動補上檢查碼）或 13 位完整條碼。目前有 5 位。'))
  })
  it('長度 14 位報長度錯', () => {
    expect(validateBarcode('ean13', '54490000009960')).toEqual(err('length',
      'EAN-13 需要 12 位數字（工具會自動補上檢查碼）或 13 位完整條碼。目前有 14 位。'))
  })
  it('把 0 打成字母 O 要報字元錯：54490000O996', () => {
    expect(validateBarcode('ean13', '54490000O996')).toEqual(err('charset',
      'EAN-13 只能輸入數字 0 到 9。不支援的字元：「O」。'))
  })
  it('中文輸入報字元錯，超過 3 個只列前 3 個並附總數', () => {
    expect(validateBarcode('ean13', '中文條碼')).toEqual(err('charset',
      'EAN-13 只能輸入數字 0 到 9。不支援的字元：「中」、「文」、「條」（共 4 個）。'))
  })
  it('全形數字報字元錯', () => {
    expect(validateBarcode('ean13', '５４４９')).toEqual(err('charset',
      'EAN-13 只能輸入數字 0 到 9。不支援的字元：「５」、「４」、「９」。'))
  })
  it('空字串報空值錯', () => { expect(validateBarcode('ean13', '')).toEqual(err('empty', '請輸入條碼內容。')) })
  it('只有空白報空值錯', () => { expect(validateBarcode('ean13', '   ')).toEqual(err('empty', '請輸入條碼內容。')) })
  it('只有連字號（正規化後成空字串）報空值錯', () => { expect(validateBarcode('ean13', '-')).toEqual(err('empty', '請輸入條碼內容。')) })
})

describe('validateBarcode / ean8', () => {
  it('8 位完整碼通過：96385074', () => { expect(validateBarcode('ean8', '96385074')).toEqual(ok('96385074')) })
  it('8 位完整碼通過：55123457', () => { expect(validateBarcode('ean8', '55123457')).toEqual(ok('55123457')) })
  it('8 位完整碼通過：73513537', () => { expect(validateBarcode('ean8', '73513537')).toEqual(ok('73513537')) })
  it('8 位完整碼通過：20886509', () => { expect(validateBarcode('ean8', '20886509')).toEqual(ok('20886509')) })
  it('7 位自動補檢查碼：5512345 → 55123457', () => { expect(validateBarcode('ean8', '5512345')).toEqual(ok('55123457', true)) })
  it('7 位自動補檢查碼：1234567 → 12345670', () => { expect(validateBarcode('ean8', '1234567')).toEqual(ok('12345670', true)) })
  it('7 位全 0 自動補 0：0000000 → 00000000', () => { expect(validateBarcode('ean8', '0000000')).toEqual(ok('00000000', true)) })
  it('檢查碼錯誤要明確報錯：55123450', () => {
    expect(validateBarcode('ean8', '55123450')).toEqual(err('checkDigit',
      '檢查碼不符。EAN-8 前 7 位算出的檢查碼應該是 7，你輸入的是 0。請確認號碼，或只輸入前 7 位讓工具自動補。'))
  })
  it('拿 EAN-13 長度餵 EAN-8 報長度錯', () => {
    expect(validateBarcode('ean8', '5449000000996')).toEqual(err('length',
      'EAN-8 需要 7 位數字（工具會自動補上檢查碼）或 8 位完整條碼。目前有 13 位。'))
  })
  it('6 位報長度錯', () => {
    expect(validateBarcode('ean8', '551234')).toEqual(err('length',
      'EAN-8 需要 7 位數字（工具會自動補上檢查碼）或 8 位完整條碼。目前有 6 位。'))
  })
  it('9 位報長度錯', () => {
    expect(validateBarcode('ean8', '551234567')).toEqual(err('length',
      'EAN-8 需要 7 位數字（工具會自動補上檢查碼）或 8 位完整條碼。目前有 9 位。'))
  })
  it('字母報字元錯', () => {
    expect(validateBarcode('ean8', '963850A4')).toEqual(err('charset',
      'EAN-8 只能輸入數字 0 到 9。不支援的字元：「A」。'))
  })
  it('空字串報空值錯', () => { expect(validateBarcode('ean8', '')).toEqual(err('empty', '請輸入條碼內容。')) })
})

describe('validateBarcode / itf14', () => {
  it('14 位完整碼通過：15400141288763', () => { expect(validateBarcode('itf14', '15400141288763')).toEqual(ok('15400141288763')) })
  it('14 位完整碼通過：10614141000415', () => { expect(validateBarcode('itf14', '10614141000415')).toEqual(ok('10614141000415')) })
  it('13 位自動補檢查碼：1540014128876 → 15400141288763', () => { expect(validateBarcode('itf14', '1540014128876')).toEqual(ok('15400141288763', true)) })
  it('13 位全 0 自動補 0：0000000000000 → 00000000000000', () => { expect(validateBarcode('itf14', '0000000000000')).toEqual(ok('00000000000000', true)) })
  it('14 位全 0 通過：00000000000000', () => { expect(validateBarcode('itf14', '00000000000000')).toEqual(ok('00000000000000')) })
  it('去掉前後空白後自動補：" 1540014128876 "', () => { expect(validateBarcode('itf14', ' 1540014128876 ')).toEqual(ok('15400141288763', true)) })
  it('檢查碼錯誤要明確報錯：15400141288760', () => {
    expect(validateBarcode('itf14', '15400141288760')).toEqual(err('checkDigit',
      '檢查碼不符。ITF-14 前 13 位算出的檢查碼應該是 3，你輸入的是 0。請確認號碼，或只輸入前 13 位讓工具自動補。'))
  })
  it('12 位報長度錯', () => {
    expect(validateBarcode('itf14', '154001412887')).toEqual(err('length',
      'ITF-14 需要 13 位數字（工具會自動補上檢查碼）或 14 位完整條碼。目前有 12 位。'))
  })
  it('15 位報長度錯', () => {
    expect(validateBarcode('itf14', '154001412887631')).toEqual(err('length',
      'ITF-14 需要 13 位數字（工具會自動補上檢查碼）或 14 位完整條碼。目前有 15 位。'))
  })
  it('字母報字元錯', () => {
    expect(validateBarcode('itf14', '1540014128876X')).toEqual(err('charset',
      'ITF-14 只能輸入數字 0 到 9。不支援的字元：「X」。'))
  })
  it('空字串報空值錯', () => { expect(validateBarcode('itf14', '')).toEqual(err('empty', '請輸入條碼內容。')) })
})

describe('validateBarcode / code39', () => {
  it('大寫英數與連字號通過：ABC-1234', () => { expect(validateBarcode('code39', 'ABC-1234')).toEqual(ok('ABC-1234')) })
  it('含半角空白通過：HELLO WORLD', () => { expect(validateBarcode('code39', 'HELLO WORLD')).toEqual(ok('HELLO WORLD')) })
  it('小寫自動轉大寫：abc-123 → ABC-123', () => { expect(validateBarcode('code39', 'abc-123')).toEqual(ok('ABC-123')) })
  it('小寫混空白與點：a-b c.d → A-B C.D', () => { expect(validateBarcode('code39', 'a-b c.d')).toEqual(ok('A-B C.D')) })
  it('7 個合法符號全用上：A B-C.D$E/F+G%H', () => { expect(validateBarcode('code39', 'A B-C.D$E/F+G%H')).toEqual(ok('A B-C.D$E/F+G%H')) })
  it('成對的 * 視為起始／結束符號並剝除：*ABC-1234* → ABC-1234', () => { expect(validateBarcode('code39', '*ABC-1234*')).toEqual(ok('ABC-1234')) })
  it('前後空白會被去掉：「  ABC  」→ ABC', () => { expect(validateBarcode('code39', '  ABC  ')).toEqual(ok('ABC')) })
  it('剛好 48 字元通過', () => { expect(validateBarcode('code39', 'A'.repeat(48))).toEqual(ok('A'.repeat(48))) })
  it('49 字元報長度錯', () => {
    expect(validateBarcode('code39', 'A'.repeat(49))).toEqual(err('length',
      'Code 39 最多 48 個字元，目前有 49 個。請縮短內容，或改用 Code 128。'))
  })
  it('內容中間夾 * 報專屬錯誤：A*B', () => {
    expect(validateBarcode('code39', 'A*B')).toEqual(err('code39Star',
      'Code 39 的 * 是起始/結束符號，由工具自動加上，不能出現在內容裡。請移除 *，或改成成對的 *內容* 形式。'))
  })
  it('只有開頭的 * 也報專屬錯誤：*ABC', () => {
    expect(validateBarcode('code39', '*ABC')).toEqual(err('code39Star',
      'Code 39 的 * 是起始/結束符號，由工具自動加上，不能出現在內容裡。請移除 *，或改成成對的 *內容* 形式。'))
  })
  it('底線不在 43 字元集內：ABC_123', () => {
    expect(validateBarcode('code39', 'ABC_123')).toEqual(err('charset',
      'Code 39 只支援數字、大寫英文與 - . $ / + % 和半角空白。不支援的字元：「_」。'))
  })
  it('# 與 ! 不在字元集內，兩個都列出', () => {
    expect(validateBarcode('code39', 'ab#c!d')).toEqual(err('charset',
      'Code 39 只支援數字、大寫英文與 - . $ / + % 和半角空白。不支援的字元：「#」、「!」。'))
  })
  it('中文報字元錯', () => {
    expect(validateBarcode('code39', '中')).toEqual(err('charset',
      'Code 39 只支援數字、大寫英文與 - . $ / + % 和半角空白。不支援的字元：「中」。'))
  })
  it('內部 tab 以 U+ 形式顯示', () => {
    expect(validateBarcode('code39', 'A\tB')).toEqual(err('charset',
      'Code 39 只支援數字、大寫英文與 - . $ / + % 和半角空白。不支援的字元：「U+0009」。'))
  })
  it('空字串報空值錯', () => { expect(validateBarcode('code39', '')).toEqual(err('empty', '請輸入條碼內容。')) })
  it('只有 ** 剝除後成空字串，報空值錯', () => { expect(validateBarcode('code39', '**')).toEqual(err('empty', '請輸入條碼內容。')) })
})

describe('validateBarcode / code128', () => {
  it('混合大小寫、空白與符號通過：Hello World $19.99', () => { expect(validateBarcode('code128', 'Hello World $19.99')).toEqual(ok('Hello World $19.99')) })
  it('大小寫與連字號通過：ABC-abc-1234', () => { expect(validateBarcode('code128', 'ABC-abc-1234')).toEqual(ok('ABC-abc-1234')) })
  it('邊界字元 ! (0x21) 與 ~ (0x7E) 通過，前後空白被去掉', () => { expect(validateBarcode('code128', ' A1!~ ')).toEqual(ok('A1!~')) })
  it('斜線與貨幣符號通過：$1.00 / 2 kg', () => { expect(validateBarcode('code128', '$1.00 / 2 kg')).toEqual(ok('$1.00 / 2 kg')) })
  it('前後空白會被去掉：「  padded  」→ padded', () => { expect(validateBarcode('code128', '  padded  ')).toEqual(ok('padded')) })
  it('剛好 80 字元通過', () => { expect(validateBarcode('code128', 'a'.repeat(80))).toEqual(ok('a'.repeat(80))) })
  it('81 字元報長度錯', () => {
    expect(validateBarcode('code128', 'a'.repeat(81))).toEqual(err('length',
      'Code 128 最多 80 個字元，目前有 81 個。請縮短內容，太寬的條碼不容易掃描。'))
  })
  it('中文報字元錯並建議改用 QR Code', () => {
    expect(validateBarcode('code128', '中文')).toEqual(err('charset',
      'Code 128 只支援可列印的 ASCII 字元。不支援的字元：「中」、「文」。中文或全形符號請改用 QR Code。'))
  })
  it('帶重音的拉丁字母也不行：café', () => {
    expect(validateBarcode('code128', 'café')).toEqual(err('charset',
      'Code 128 只支援可列印的 ASCII 字元。不支援的字元：「é」。中文或全形符號請改用 QR Code。'))
  })
  it('內部 tab 以 U+ 形式顯示', () => {
    expect(validateBarcode('code128', 'a\tb')).toEqual(err('charset',
      'Code 128 只支援可列印的 ASCII 字元。不支援的字元：「U+0009」。中文或全形符號請改用 QR Code。'))
  })
  it('空字串報空值錯', () => { expect(validateBarcode('code128', '')).toEqual(err('empty', '請輸入條碼內容。')) })
  it('只有空白報空值錯', () => { expect(validateBarcode('code128', '   ')).toEqual(err('empty', '請輸入條碼內容。')) })
})

describe('常數', () => {
  it('Code 39 字元集剛好 43 個字元', () => { expect(CODE39_CHARSET.length).toBe(43) })
  it('Code 39 字元集內容與 mod-43 權值順序一致', () => {
    expect(CODE39_CHARSET).toBe('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%')
  })
  it('長度上限', () => {
    expect(CODE39_MAX_LENGTH).toBe(48)
    expect(CODE128_MAX_LENGTH).toBe(80)
  })
})

describe('code39CheckChar（mod-43，預設不啟用）', () => {
  it('CODE39 → W（值和 75，75 % 43 = 32，第 32 個字元是 W）', () => { expect(code39CheckChar('CODE39')).toBe('W') })
  it('159 → F（值和 15）', () => { expect(code39CheckChar('159')).toBe('F') })
  it('ABC-1234 → -（值和 79，79 % 43 = 36）', () => { expect(code39CheckChar('ABC-1234')).toBe('-') })
})
