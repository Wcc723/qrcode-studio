export interface Guide { slug: string; title: string; description: string; bodyHtml: string }

export const guides: Guide[] = [
  {
    slug: 'what-is-qr-code',
    title: '什麼是 QR Code？原理、用途與安全性完整介紹',
    description: 'QR Code（行動條碼）是什麼？一次看懂二維條碼的運作原理、容量、靜態與動態差異、常見用途與掃描安全注意事項。',
    bodyHtml:
      '<p>QR Code（Quick Response Code，快速回應碼）是一種<strong>二維條碼／行動條碼</strong>，由日本 Denso Wave 公司於 1994 年發明。它用黑白方塊矩陣儲存資料，相機一掃即可讀出，能存放網址、文字、聯絡資訊、WiFi 帳密等內容，比傳統一維條碼容量更大、容錯更強。</p>' +
      '<h2>QR Code 的運作原理</h2>' +
      '<p>圖案四角的三個「回」字形是<strong>定位點</strong>，讓相機從任何角度都能辨識方向；其餘方塊則編碼實際資料與糾錯碼。即使圖案有部分髒污或被遮擋，也能靠糾錯機制還原，這也是為什麼能在中間放 LOGO 仍可掃描。</p>' +
      '<h2>靜態 QR Code 與動態 QR Code 的差別</h2>' +
      '<ul><li><strong>靜態 QR Code</strong>：內容直接編碼在圖中，永久有效、不需聯網、不會失效，也不會被收回或追蹤。本站產生的都是靜態 QR Code。</li><li><strong>動態 QR Code</strong>：圖中其實是一個轉址連結，可事後修改目標、統計掃描次數，但仰賴服務商的伺服器；一旦對方收費或停止服務，QR 就會失效。</li></ul>' +
      '<p>若只是要長期不變的網址、名片或 WiFi，<strong>靜態 QR Code 最安心</strong>，免費又不會過期。</p>' +
      '<h2>常見用途</h2>' +
      '<p>網址導流、<a href="/wifi/">WiFi 掃碼連線</a>、<a href="/vcard/">電子名片</a>、行動支付、餐廳點餐、活動報名、產品溯源等，生活中幾乎隨處可見。</p>' +
      '<h2>掃描 QR Code 安全嗎？</h2>' +
      '<p>QR Code 本身只是資料，風險來自「掃到後連去的網站」。掃描前可先看預覽網址、不隨意在不明頁面輸入帳密或付款，就能避開多數釣魚風險。延伸閱讀：<a href="/guide/scan-qr-code/">如何掃描 QR Code</a>。</p>' +
      '<p>想自己做一張？<a href="/">免費 QR Code 產生器</a>不傳雲端、無浮水印，馬上開始。</p>',
  },
  {
    slug: 'error-correction',
    title: 'QR Code 容錯等級怎麼選？L/M/Q/H 一次搞懂',
    description: '容錯等級（L/M/Q/H）影響 QR Code 的抗污損能力與圖案密度。本文教你依用途與是否加 LOGO 正確挑選容錯等級。',
    bodyHtml:
      '<p>QR Code 內建<strong>糾錯（容錯）機制</strong>：即使圖案有部分破損、髒污或被 LOGO 遮住，也能正確還原資料。容錯等級分為四級，等級越高、可修復的比例越大，但圖案也會越密。</p>' +
      '<h2>四種容錯等級</h2>' +
      '<ul><li><strong>L（低，約 7%）</strong>：圖最簡潔，適合乾淨、近距離掃描的螢幕或文件。</li><li><strong>M（中，約 15%）</strong>：最常用的平衡點，本站預設值，適合大多數情況。</li><li><strong>Q（較高，約 25%）</strong>：戶外、可能磨損或要加小 LOGO 時適用。</li><li><strong>H（最高，約 30%）</strong>：抗污損最強，<strong>加入 LOGO 時建議使用</strong>。</li></ul>' +
      '<h2>怎麼選？</h2>' +
      '<p>一般網址、文字選 <strong>M</strong> 即可；要印在包裝、招牌或戶外環境，提高到 <strong>Q</strong>；<a href="/guide/qr-with-logo/">中間要放 LOGO</a> 則用 <strong>H</strong>，本站在你上傳 LOGO 時會自動升到 H。</p>' +
      '<h2>容錯越高一定越好嗎？</h2>' +
      '<p>不一定。等級越高，相同資料需要的方塊越多、圖案越密，在小尺寸或低解析列印時反而更難掃。建議「夠用就好」，並把<strong>尺寸調大、留足白邊</strong>，掃描成功率會比一味拉高容錯更有效。</p>' +
      '<p><a href="/">立即製作 QR Code</a>，可自由調整容錯等級與尺寸。</p>',
  },
  {
    slug: 'qr-with-logo',
    title: '如何在 QR Code 中加入 LOGO 又能正常掃描？',
    description: '在 QR Code 加 LOGO 會影響掃描嗎？教你用容錯等級、覆蓋比例與留白做出可正常掃描的品牌造型 QR Code。',
    bodyHtml:
      '<p>在 QR Code 中央放上品牌 <strong>LOGO</strong>，能大幅提升辨識度與點擊意願，是常見的造型 QR Code 做法。只要掌握幾個原則，加了 LOGO 也能正常掃描。</p>' +
      '<h2>三個關鍵原則</h2>' +
      '<ul><li><strong>提高容錯等級到 H</strong>：容錯 H 可修復約 30% 的圖案，足以容納中央 LOGO。本站上傳 LOGO 時會<strong>自動把容錯升到 H</strong>。</li><li><strong>控制 LOGO 覆蓋比例</strong>：LOGO 建議不超過整體面積的兩成，太大會破壞定位與資料區。</li><li><strong>保留乾淨白邊</strong>：LOGO 周圍留一點背景留白，與方塊區隔，辨識更穩。</li></ul>' +
      '<h2>顏色與對比也很重要</h2>' +
      '<p>前景（方塊）與背景要有足夠對比，建議深色方塊配淺色背景；避免淺色方塊配深背景，否則相機不易辨識。可在<a href="/">產生器</a>中自訂顏色或漸層，但別讓顏色太淺。容錯細節可參考<a href="/guide/error-correction/">容錯等級怎麼選</a>。</p>' +
      '<h2>務必實機測試</h2>' +
      '<p>加 LOGO、改顏色後，<strong>一定要用手機相機實際掃過一次</strong>再拿去印刷，確認在預定的尺寸與距離下都掃得到。需要印刷請下載 <a href="/guide/qr-code-svg/">SVG 向量檔</a>，放大不失真。</p>' +
      '<p><a href="/">免費製作可加 LOGO 的 QR Code</a>，不傳雲端、無浮水印。</p>',
  },
  {
    slug: 'scan-qr-code',
    title: '如何掃描 QR Code？手機相機、LINE、電腦掃描教學',
    description: 'QR Code 怎麼掃？教你用 iPhone／Android 內建相機、LINE 行動條碼掃描器，以及在電腦（Windows/Mac）掃描或讀取 QR Code 的方法。',
    bodyHtml:
      '<p>現在掃描 QR Code 幾乎不用另外安裝 App，手機內建相機就能掃。以下整理 iPhone、Android、LINE 與電腦的掃描方式。</p>' +
      '<h2>iPhone 怎麼掃 QR Code</h2>' +
      '<p>打開內建<strong>「相機」App</strong>，對準 QR Code 約 2～3 秒，畫面上方會跳出連結或動作提示，點一下即可。若沒反應，到「設定 → 相機」確認已開啟「掃描 QR Code」。</p>' +
      '<h2>Android 怎麼掃 QR Code</h2>' +
      '<p>多數 Android 內建相機或 Google Lens 都支援，對準後點提示即可。部分機型可在快速設定面板找到「掃描 QR Code」捷徑。</p>' +
      '<h2>用 LINE 掃描 QR Code（最方便）</h2>' +
      '<p>LINE 內建行動條碼掃描器，免裝額外 App：打開 LINE → 點主頁搜尋列旁的<strong>掃描圖示</strong>（或「加入好友 → 行動條碼」）→ 對準即可。LINE 掃描也能用來開啟一般網址 QR Code，是台灣最多人用的掃描方式之一。延伸閱讀：<a href="/guide/line-qr-code/">LINE QR Code 怎麼做</a>。</p>' +
      '<h2>電腦（Windows / Mac）怎麼掃 QR Code</h2>' +
      '<ul><li><strong>螢幕上的 QR Code</strong>：用手機相機直接對螢幕掃即可。</li><li><strong>圖片檔中的 QR Code</strong>：可用線上 QR 讀取工具上傳圖片解碼，或用手機相簿「實況文字／Google Lens」辨識。</li></ul>' +
      '<h2>掃描安全提醒</h2>' +
      '<p>掃描前先看清楚跳出的網址，<strong>不要在不明頁面輸入帳密或刷卡</strong>，即可避開多數釣魚風險。</p>' +
      '<p>想自己<strong>製作</strong> QR Code？用<a href="/">免費 QR Code 產生器</a>，不傳雲端、可加 LOGO、下載 PNG/SVG。</p>',
  },
  {
    slug: 'line-qr-code',
    title: 'LINE QR Code 怎麼做？製作與分享行動條碼教學',
    description: 'LINE QR Code 怎麼產生與分享？教你取得個人 LINE 行動條碼、把官網或活動連結做成 QR Code，以及用 LINE 掃描 QR Code 的方法。',
    bodyHtml:
      '<p>「LINE QR Code」常指兩件事：分享自己的 LINE 讓人加好友，或把連結（含 LINE 官方帳號、活動頁）做成 QR Code 導流。以下分別說明。</p>' +
      '<h2>取得並分享你的 LINE 行動條碼</h2>' +
      '<p>打開 LINE →「主頁 → 加入好友 → 行動條碼」，切到<strong>「我的 QR 碼」</strong>即可顯示你的個人行動條碼，按分享或截圖傳給對方，對方掃描就能加你好友。LINE 官方帳號則可在管理後台取得專屬加入連結與 QR。</p>' +
      '<h2>把 LINE 連結做成可自訂的 QR Code</h2>' +
      '<p>如果你有 LINE 官方帳號的加入連結（如 <code>https://lin.ee/xxxx</code>）或任何活動頁，想要<strong>自訂顏色、加上品牌 LOGO</strong>、印在海報或包裝上，可以用<a href="/url/">網址 QR Code 產生器</a>把連結轉成漂亮的 QR Code，免費下載 PNG 或 SVG。</p>' +
      '<h2>用 LINE 掃描別人的 QR Code</h2>' +
      '<p>LINE 內建掃描器：點搜尋列旁的掃描圖示，對準即可，不只能加好友，也能<a href="/guide/scan-qr-code/">掃描一般網址 QR Code</a>。</p>' +
      '<h2>小提醒</h2>' +
      '<p>個人 LINE 行動條碼可在 LINE 內重設更新；若把官方帳號連結做成靜態 QR Code 印出，連結請固定不變，以免日後失效。</p>' +
      '<p><a href="/url/">立即把你的 LINE 連結做成 QR Code</a>，可加 LOGO、免費下載。</p>',
  },
  {
    slug: 'qr-code-svg',
    title: 'QR Code 下載 SVG 向量檔：印刷不失真完整教學',
    description: '需要印刷用的 QR Code？本文說明 SVG 向量與 PNG 點陣的差別、何時該用 SVG，以及如何免費下載高解析、放大不失真的 QR Code。',
    bodyHtml:
      '<p>要把 QR Code 印在名片、海報、包裝或大圖輸出，檔案格式很關鍵。選對格式才不會印出來模糊、掃不到。</p>' +
      '<h2>SVG 向量 vs PNG 點陣</h2>' +
      '<ul><li><strong>SVG（向量）</strong>：用數學描述線條，<strong>無限放大都不失真</strong>，檔案小、最適合印刷與大圖輸出，設計軟體（Illustrator、Figma）也能直接編輯。</li><li><strong>PNG（點陣）</strong>：由像素組成，放太大會出現鋸齒、變模糊；適合螢幕、網頁與一般小尺寸使用。</li></ul>' +
      '<h2>什麼時候該用 SVG？</h2>' +
      '<p>只要會<strong>印刷或可能放大</strong>——名片、傳單、海報、招牌、產品包裝、大型看板——都建議用 SVG。許多工具把 SVG 鎖在付費方案，<a href="/">本站則完全免費提供 SVG 下載</a>、無浮水印。</p>' +
      '<h2>印刷前的小技巧</h2>' +
      '<ul><li>保留四周白邊（安靜區），別讓圖案貼著裁切線。</li><li>前景深、背景淺，維持足夠對比。</li><li><a href="/guide/qr-with-logo/">加 LOGO</a> 時把容錯升到 H，並實機掃描測試。</li></ul>' +
      '<p><a href="/">免費製作並下載 SVG QR Code</a>，瀏覽器內生成、不傳雲端。</p>',
  },
]
export const guideBySlug = Object.fromEntries(guides.map(g => [g.slug, g]))
