export interface Guide { slug: string; title: string; description: string; bodyHtml: string }

export const guides: Guide[] = [
  {
    slug: 'what-is-qr-code', title: '什麼是 QR Code？原理與用途完整介紹',
    description: 'QR Code 是什麼？一次看懂二維條碼的原理、容量、容錯與常見用途。',
    bodyHtml: '<p>QR Code（Quick Response Code）是一種二維條碼，可儲存網址、文字、聯絡資訊等資料……</p>',
  },
  {
    slug: 'error-correction', title: 'QR Code 容錯等級怎麼選？L/M/Q/H 一次搞懂',
    description: '容錯等級影響 QR Code 的抗污損能力與密度，本文教你如何依用途挑選。',
    bodyHtml: '<p>容錯等級分為 L(7%)、M(15%)、Q(25%)、H(30%)，等級越高越耐損但圖越密……</p>',
  },
  {
    slug: 'qr-with-logo', title: '如何在 QR Code 中加入 LOGO 又能正常掃描',
    description: '加入 LOGO 會影響掃描嗎？教你用容錯等級與覆蓋比例做出可掃的品牌 QR Code。',
    bodyHtml: '<p>在 QR Code 中央放 LOGO 時，建議把容錯等級提高到 H，並控制 LOGO 覆蓋比例……</p>',
  },
]
export const guideBySlug = Object.fromEntries(guides.map(g => [g.slug, g]))
