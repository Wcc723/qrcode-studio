// 教學文章本文（HTML）。只給 GuidePage（動態載入）用，不要從首頁或 layout import。
// 本文裡的站內連結寫成 href="/..."、圖片寫成 src="/..."，GuidePage 會用 withBase() 補上子路徑前綴。
//
// 寫作規則：
// - 數字要有出處：規格數字引用 DENSO WAVE 官方網站；版本、模組數與容量是用
//   qrcode-generator（本站實際使用的編碼器）算出來的，示意圖由
//   scripts/figures/gen-guide-figures.mjs 產生，改了圖要一起對照文章。
// - 描述本站工具的行為時，以程式碼為準（例如 LOGO 大小上限、PNG 尺寸範圍、預設容錯等級）。
// - 不用破折號「——」。
export const guideBodies: Record<string, string> = {
  'what-is-qr-code': `
<p>QR Code 是 Quick Response Code 的縮寫，中文常叫「行動條碼」或「二維條碼」。它在 1994 年由日本 DENSO 的開發部門（也就是今天的 DENSO WAVE）發表，開發時最重視的就是「讀得快」，Quick Response 指的正是這件事；另一個目標是存下比一維條碼多得多的資料，連日文漢字與假名都要能放。和商品包裝上只在橫向記錄資料的一維條碼不同，QR Code 在橫向與直向都存資料，所以同樣大小能放進多得多的內容：一整串網址、WiFi 帳密、一張電子名片都裝得下。</p>
<p>如果你要做的是結帳時嗶一下的那種直條條碼（EAN-13、Code 128），那是另一種東西，請改用<a href="/barcode/">一維條碼產生器</a>。</p>

<h2>一張 QR Code 由哪些部分組成</h2>
<p>把 QR Code 放大看，它是由一格一格的黑白方塊組成，每一格叫做一個「模組」。這些模組分成兩類：一類是固定的圖形，負責讓相機找到並對齊這張碼；另一類才是真正的資料。下面這張圖是本站網址 <code>https://www.pocketool.app/qrcode-studio/</code> 以容錯等級 M 編出來的 QR Code，我們把固定圖形分色標出來：</p>
<figure>
<img src="/guides/anatomy.svg" width="280" height="280" alt="QR Code 構造示意圖：三個角落的定位圖形為橘色、連接定位圖形的時序圖形為藍色、右下方的校正圖形為綠色、格式資訊為粉紅色，其餘黑色模組是資料與錯誤更正碼" loading="lazy">
<figcaption>版本 3（29×29 模組）的 QR Code。橘：定位圖形；藍：時序圖形；綠：校正圖形；粉紅：格式資訊；黑：資料與錯誤更正碼。這張圖可以直接掃。</figcaption>
</figure>
<ul>
<li><strong>定位圖形</strong>：三個角落的「回」字形方塊。它的黑白寬度比例固定是 1:1:3:1:1，開發者當年挑這個形狀，是因為它最不容易出現在一般的文件與印刷品上。相機看到這三個就知道 QR Code 在哪裡、朝哪個方向，所以不管斜著、倒著拍，360 度都讀得出來；第四個角刻意空著，用來判斷方向。</li>
<li><strong>時序圖形</strong>：連接定位圖形、黑白交錯的一排點，讓解碼器算出每一格模組的位置。</li>
<li><strong>校正圖形</strong>：版本 2 以上才有的小方塊，讓相機在紙張彎曲、拍攝角度歪斜時還能校正變形。版本越大，校正圖形越多。</li>
<li><strong>格式資訊</strong>：記錄這張碼用的是哪一個容錯等級與遮罩樣式。編碼器會從 8 種遮罩裡挑一種套上去，避免出現大片全黑或全白、讓相機難以判讀的區域。</li>
<li><strong>資料與錯誤更正碼</strong>：剩下的模組。錯誤更正碼讓 QR Code 在部分髒污、破損時仍能還原，這也是中間能放 LOGO 的原因，細節見<a href="/guide/error-correction/">容錯等級怎麼選</a>。</li>
</ul>
<p>另外，QR Code 四周需要一圈至少 4 個模組寬的空白，叫做「靜區」。它不是設計上的留白，而是讓相機分辨碼的邊界。印刷時被裁掉或貼著圖案，就常常掃不到，<a href="/guide/qr-code-svg/">印刷教學</a>裡有示意圖。</p>

<h2>版本與容量：一張 QR Code 能放多少字</h2>
<p>QR Code 有 40 種尺寸，官方稱為「版本」。版本 1 是 21×21 模組，每升一個版本每邊多 4 個模組，到版本 40 是 177×177 模組。內容越多，就需要越大的版本；本站的產生器會自動挑選裝得下內容的最小版本，你不需要自己選。</p>
<p>能裝多少，還要看內容是哪一種字元。純數字最省空間；只有大寫英文、數字與少數符號（空白、$、%、*、+、-、.、/、:）時會用「英數模式」；只要出現小寫英文或中文，就要用「位元組模式」。一般網址帶有小寫字母，所以都是位元組模式。中文以 UTF-8 編碼，一個中文字佔 3 個位元組，所以同樣的空間，能放的中文字大約是英文字母的三分之一。</p>
<p>下表是容錯等級 M（本站預設）時，幾個版本的最大容量：</p>
<div class="table-wrap"><table>
<thead><tr><th>版本</th><th>模組數</th><th>純數字</th><th>大寫英數</th><th>位元組（網址等）</th><th>中文約</th></tr></thead>
<tbody>
<tr><td>1</td><td>21×21</td><td>34</td><td>20</td><td>14</td><td>4 字</td></tr>
<tr><td>2</td><td>25×25</td><td>63</td><td>38</td><td>26</td><td>8 字</td></tr>
<tr><td>3</td><td>29×29</td><td>101</td><td>61</td><td>42</td><td>14 字</td></tr>
<tr><td>5</td><td>37×37</td><td>202</td><td>122</td><td>84</td><td>28 字</td></tr>
<tr><td>10</td><td>57×57</td><td>513</td><td>311</td><td>213</td><td>71 字</td></tr>
<tr><td>20</td><td>97×97</td><td>1,600</td><td>970</td><td>666</td><td>222 字</td></tr>
<tr><td>40</td><td>177×177</td><td>5,596</td><td>3,391</td><td>2,331</td><td>777 字</td></tr>
</tbody>
</table></div>
<p>最大的版本 40 搭配最低的容錯等級 L，可以放 7,089 個數字或 2,953 個位元組，這就是常見「QR Code 最多能放多少」的答案。不過實務上很少需要這麼多：版本越大、模組越密，印小了就難掃。超過容量時，本站的產生器會直接提示，而不是做出一張掃不出來的圖。內容很長時，比較好的做法是把內容放在網頁上，QR Code 只放網址。</p>

<h2>靜態 QR Code 與動態 QR Code</h2>
<ul>
<li><strong>靜態 QR Code</strong>：內容直接編碼在圖裡，掃描時不需要經過任何伺服器。永久有效、不會被收回，也沒有人能統計誰掃了它。本站產生的都是靜態 QR Code。</li>
<li><strong>動態 QR Code</strong>：圖裡其實是服務商的一個短網址，掃描後再轉到你設定的目的地。好處是可以事後改目的地、看掃描次數；代價是完全依賴那家服務，一旦方案到期或服務關閉，印出去的 QR Code 就全部失效。</li>
</ul>
<p>名片、WiFi、固定的官網連結這類長期不變的內容，用靜態 QR Code 最安心。如果目的地可能會變，可以讓 QR Code 指向你自己網站上的固定網址，要改時改網站就好，不必重印。</p>

<h2>常見用途</h2>
<p>最常見的是把網址變成 QR Code（<a href="/url/">網址 QR Code</a>），其他像是讓客人掃碼連上<a href="/wifi/">WiFi</a>、把聯絡方式存成<a href="/vcard/">電子名片</a>、掃碼直接寄信或撥號、活動報名、產品說明書、餐廳的線上菜單等，在台灣幾乎隨處可見。</p>

<h2>掃描 QR Code 安全嗎</h2>
<p>QR Code 本身只是資料，不會自己執行任何程式；風險在於它把你帶去哪裡。常見的詐騙手法是在停車繳費機、海報上貼一張假的 QR Code 貼紙，把人導到仿冒的付款或登入頁面。掃描前先看清楚跳出來的網址是不是你預期的網域，不要在來路不明的頁面輸入帳號密碼或信用卡，就能避開大部分風險。手機怎麼掃、電腦裡的圖片怎麼讀，請看<a href="/guide/scan-qr-code/">如何掃描 QR Code</a>；本站的<a href="/scan/">QR Code 掃描器</a>解碼後只顯示文字與網站主機，不會自動開啟連結。</p>

<h2>參考資料</h2>
<ul>
<li>DENSO WAVE：<a href="https://www.qrcode.com/en/history/" target="_blank" rel="noopener">History of QR Code</a>（發表年份、開發目的與定位圖形的由來）</li>
<li>DENSO WAVE：<a href="https://www.qrcode.com/en/about/version.html" target="_blank" rel="noopener">Information capacity and versions of QR Code</a>（版本與模組數）</li>
</ul>
`,

  'error-correction': `
<p>QR Code 可以缺一角、沾到咖啡，甚至中間蓋一個 LOGO 還掃得出來，靠的是內建的<strong>錯誤更正碼</strong>（Reed-Solomon 碼）。產生 QR Code 時，編碼器除了你的資料，還會額外加上一段更正碼；掃描時就算部分模組讀錯或讀不到，解碼器也能用更正碼把原本的資料算回來。</p>
<p>更正碼要放多少，由「容錯等級」決定。QR Code 規格定義了四個等級，依 DENSO WAVE 官方說明，大約可以還原的比例如下：</p>
<ul>
<li><strong>L</strong>：約 7%</li>
<li><strong>M</strong>：約 15%</li>
<li><strong>Q</strong>：約 25%</li>
<li><strong>H</strong>：約 30%</li>
</ul>
<p>這裡的比例指的是「碼字」（每 8 個位元一組）能被還原的比例，不是圖面上可以隨便塗掉的面積；而且三個角落的定位圖形不在保護範圍內，被擋住的話相機根本找不到這張碼。</p>

<h2>錯誤更正碼怎麼運作</h2>
<p>把資料切成一個個碼字之後，編碼器會用數學運算算出一組額外的「檢查碼字」附在後面。解碼時，如果某幾個碼字讀錯了，解碼器可以從這組檢查碼字反推出正確的值。規則是：每多 2 個檢查碼字，就能多修正 1 個讀錯的碼字；如果已經知道哪幾個位置壞了（例如被 LOGO 整塊蓋住、讀不到），同樣數量的檢查碼字能修補的量還會更多。容錯等級越高，檢查碼字占的比例越大，能修的就越多。</p>
<p>版本較大的 QR Code 會把資料分成好幾個區塊，各自帶一組檢查碼字，擺放時再把不同區塊的碼字交錯排列。這樣一塊集中的髒污會分散到好幾個區塊，每個區塊只壞一點點，都還在能修的範圍內，比全部集中在同一個區塊安全得多。</p>

<h2>同一個網址，四種等級長什麼樣</h2>
<p>下面四張都是這篇文章的網址 <code>https://www.pocketool.app/qrcode-studio/guide/error-correction/</code>（63 個位元組），分別用 L、M、Q、H 產生。內容一模一樣，但更正碼越多，需要的空間越大，編碼器就得改用更大的版本：</p>
<div class="fig-grid">
<figure><img src="/guides/ec-l.svg" width="240" height="240" alt="容錯等級 L 的 QR Code，版本 4，33×33 模組" loading="lazy"><figcaption>L：版本 4，33×33</figcaption></figure>
<figure><img src="/guides/ec-m.svg" width="240" height="240" alt="容錯等級 M 的 QR Code，版本 5，37×37 模組" loading="lazy"><figcaption>M：版本 5，37×37</figcaption></figure>
<figure><img src="/guides/ec-q.svg" width="240" height="240" alt="容錯等級 Q 的 QR Code，版本 6，41×41 模組" loading="lazy"><figcaption>Q：版本 6，41×41</figcaption></figure>
<figure><img src="/guides/ec-h.svg" width="240" height="240" alt="容錯等級 H 的 QR Code，版本 7，45×45 模組" loading="lazy"><figcaption>H：版本 7，45×45</figcaption></figure>
</div>
<p>四張都可以掃，你可以拿手機試試看。從 L 到 H，每邊的模組數從 33 格增加到 45 格。換個角度看：如果尺寸固定，容錯越高能放的內容就越少。以版本 10（57×57 模組）為例，位元組模式的容量是 L 271、M 213、Q 151、H 119 個位元組，H 只裝得下 L 的四成多。</p>

<h2>容錯越高一定越好嗎</h2>
<p>不一定。模組變多，代表印在同樣大小的紙上，每一格都會變小。假設把上面的 QR Code 印成 2 公分寬：L 的每一格約 0.61 毫米，H 只剩約 0.44 毫米。格子越小，手機要靠得越近、對焦越準才讀得到，印刷的墨點暈開也更容易讓相鄰模組黏在一起。所以容錯等級是在「抗污損」與「圖案密度」之間取捨，夠用就好。</p>
<p>如果掃描不穩，先把圖印大一點、四周留足白邊，效果通常比一味把容錯拉高更明顯。</p>
<p>另外兩個常見的誤解：一是「H 等級代表可以塗掉三成面積」，其實定位圖形、時序圖形這些固定圖形不在保護範圍內，塗到它們就可能整張失效；二是「容錯越高掃得越快」，實際上剛好相反，圖案越密，相機越需要清楚的影像才讀得出來。</p>

<h2>依使用情境怎麼選</h2>
<div class="table-wrap"><table>
<thead><tr><th>情境</th><th>建議等級</th><th>原因</th></tr></thead>
<tbody>
<tr><td>簡報、網頁、手機螢幕上顯示</td><td>L 或 M</td><td>畫面乾淨不會髒，圖案越簡單越好掃</td></tr>
<tr><td>名片、傳單、一般室內印刷</td><td>M</td><td>最常見的平衡點，也是本站預設</td></tr>
<tr><td>戶外海報、貼紙、商品包裝</td><td>Q</td><td>會被刮、被雨淋或磨損</td></tr>
<tr><td>中間要放 LOGO</td><td>H</td><td>LOGO 蓋掉的模組要靠更正碼補回來</td></tr>
</tbody>
</table></div>
<p>DENSO WAVE 的官方說明也是類似的建議：容易弄髒的工廠環境選 Q 或 H，環境乾淨、資料量大時選 L，而 M 是最常被選用的等級。</p>

<h2>本站產生器怎麼處理容錯等級</h2>
<ul>
<li>預設是 <strong>M</strong>，可以在「容錯等級」選單改成 L、Q 或 H。</li>
<li>上傳 LOGO 時會<strong>自動切換成 H</strong>。LOGO 的大小也會跟著容錯等級自動調整：最多只會蓋掉「容錯比例的三成」那麼多模組，也就是 H 等級時最多約 9% 的模組，遠低於 H 能還原的 30%，保留了髒污或反光的餘裕。</li>
<li>上傳 LOGO 後如果把等級改回 L，LOGO 會自動縮到很小（最多蓋掉約 2% 的模組），因為 L 能補回的本來就不多。想要 LOGO 大一點，就維持 H。</li>
<li>內容超過該等級的最大容量時，產生器會提示你縮短內容或調低等級。</li>
</ul>
<p>想進一步了解 LOGO 的擺放與配色，請看<a href="/guide/qr-with-logo/">如何在 QR Code 中加入 LOGO</a>。調好之後，可以直接到<a href="/">QR Code 產生器</a>試做，下載後再用手機實際掃一次。</p>

<h2>參考資料</h2>
<ul>
<li>DENSO WAVE：<a href="https://www.qrcode.com/en/about/error_correction.html" target="_blank" rel="noopener">Error correction feature</a>（四個等級的還原比例與選用建議）</li>
</ul>
`,

  'qr-with-logo': `
<p>在 QR Code 正中間放上品牌 LOGO，是讓人一眼認出「這是誰的碼」最直接的方法，也能提高大家願意掃的意願。蓋掉一塊還能掃，是因為 QR Code 內建錯誤更正碼：被 LOGO 擋住的模組，解碼器會用更正碼算回來。原理與四個容錯等級的差別，請先看<a href="/guide/error-correction/">容錯等級怎麼選</a>。</p>
<p>這篇整理加 LOGO 時真正會影響掃描成功率的幾件事，以及本站產生器實際怎麼處理 LOGO。</p>

<h2>本站產生器怎麼放 LOGO</h2>
<p>在<a href="/">QR Code 產生器</a>的「加入 LOGO」選一張圖片後，會發生這幾件事：</p>
<ol>
<li><strong>容錯等級自動切到 H</strong>：H 大約能還原 30% 的碼字，是四個等級裡最多的。</li>
<li><strong>LOGO 放在正中央，後面的模組會被清掉</strong>：LOGO 周圍另外留一小圈空白，讓 LOGO 與模組分開，不會糊成一團。</li>
<li><strong>LOGO 大小自動控制</strong>：最多只蓋掉「容錯比例的三成」那麼多模組。H 等級時約是 9%，只用掉 H 能還原份量的三分之一左右，剩下的留給印刷髒污、反光與拍攝角度。</li>
<li><strong>橫長或直長的 LOGO 會依比例縮小</strong>：可以蓋掉的模組數是固定的，長條形的圖只能縮得更小才放得進去，所以建議用方形或接近方形的圖示版本。</li>
</ol>
<p>如果上傳 LOGO 之後又把容錯等級改回 M 或 L，LOGO 會自動變小（M 約 4.5%、L 約 2% 的模組），這是為了讓圖依然掃得出來。</p>

<h2>LOGO 圖檔怎麼準備</h2>
<ul>
<li><strong>用圖示版本，不要用整條橫式標誌</strong>：原因如上，方形的圖放得最大。</li>
<li><strong>去背 PNG 或單色底都可以</strong>：LOGO 後面的模組已經清空，去背的圖會直接落在 QR Code 的背景色上。</li>
<li><strong>不要有細小文字</strong>：LOGO 在 QR Code 裡通常只有指甲大小，細字印出來看不清楚，反而顯得髒。</li>
<li><strong>解析度夠</strong>：下載 SVG 時，檔案裡的 LOGO 仍是你上傳的那張圖。上傳 PNG 或 JPG 的話，放大印刷時 LOGO 會比方塊先糊，建議上傳寬度 500 像素以上的圖。</li>
</ul>

<h2>顏色與對比</h2>
<p>加了 LOGO 之後，最常見的掃不到原因反而不是 LOGO，而是顏色：</p>
<ul>
<li><strong>深色方塊、淺色背景</strong>：相機是靠明暗差判讀模組，前景至少要比背景深很多。黑、深藍、深綠、深咖啡都很安全。</li>
<li><strong>避免反白</strong>：淺色方塊配深色背景雖然好看，但不少掃描器讀不了這種反轉的 QR Code。</li>
<li><strong>漸層兩端都要夠深</strong>：本站可以設定漸層，記得兩個顏色都要是深色，淺的那端會讓部分模組讀不到。</li>
<li><strong>透明背景要看放在哪裡</strong>：選「透明」下載後，QR Code 會直接疊在你的設計上。底下如果是照片、花紋或深色，對比就沒了；放在白色或淺色的素面上才安全。</li>
</ul>

<h2>三個不能動的地方</h2>
<p>不管 LOGO 多漂亮，下面三件事都要守住：</p>
<ul>
<li><strong>三個角落的定位圖形不能蓋、不能改色到看不出來</strong>：它們不受錯誤更正碼保護，被擋住相機就找不到這張碼。</li>
<li><strong>四周的靜區要留</strong>：至少 4 個模組寬的空白，不要讓文字、圖案貼上來，細節見<a href="/guide/qr-code-svg/">印刷教學</a>。</li>
<li><strong>不要拉伸變形</strong>：排版時請等比例縮放，壓扁的 QR Code 模組不再是正方形，掃描會很吃力。</li>
</ul>

<h2>在設計軟體裡自己貼 LOGO 要注意</h2>
<p>很多人的做法是先下載一張沒有 LOGO 的 QR Code，再到 Illustrator、Canva 之類的設計軟體裡把 LOGO 貼上去。這樣做最常出問題，因為產生器沒有機會幫你把關：</p>
<ul>
<li><strong>產生時就要選 H</strong>：本站預設是 M，只有上傳 LOGO 時才會自動切到 H。如果打算事後自己貼 LOGO，產生前請先手動把容錯等級改成 H，否則能補回的模組只有一半。</li>
<li><strong>LOGO 面積不要超過 QR Code 的一成左右</strong>：本站自動放 LOGO 時，H 等級最多蓋掉約 9% 的模組，自己貼的時候可以用這個比例當上限。</li>
<li><strong>只放正中央</strong>：不要為了構圖把 LOGO 移到角落，那裡是定位圖形。</li>
</ul>
<p>比較省事的方法，是直接在本站上傳 LOGO，讓產生器自動處理大小與容錯等級，再下載 SVG 交給設計軟體排版。</p>

<h2>印刷前的檢查清單</h2>
<ol>
<li>下載後先把圖檔丟進本站的<a href="/scan/">QR Code 掃描器</a>，確認解得出來、內容正確。</li>
<li>用 iPhone 相機、Android 相機與 LINE 各掃一次，三種都要能讀。</li>
<li>印一張實際尺寸的樣張，站在使用者會站的距離、在現場的光線下掃。</li>
<li>確認網址是會長期存在的網址，靜態 QR Code 印出去之後就改不了內容。</li>
</ol>
<p>需要印在名片、海報或包裝上，請下載 <a href="/guide/qr-code-svg/">SVG 向量檔</a>，放大也不會失真。準備好了就到<a href="/">產生器</a>動手做吧。</p>
`,

  'scan-qr-code': `
<p>現在的手機幾乎都能用內建相機直接掃 QR Code，多數情況不必另外安裝 App。以下整理 iPhone、Android、LINE 與電腦的掃描方式，以及掃不到時可以檢查的地方。各家介面會隨系統版本調整，操作步驟以官方說明為準，文末附上來源連結。</p>

<h2>iPhone 怎麼掃 QR Code</h2>
<p>依 Apple 官方說明，iPhone 有兩種掃法：</p>
<ol>
<li><strong>用「相機」App</strong>：打開相機，停在「拍照」模式，讓 QR Code 出現在觀景窗裡，畫面上會跳出連結（新版 iOS 顯示在螢幕底部），點一下就會開啟。</li>
<li><strong>用「控制中心」的「掃描條碼」</strong>：打開控制中心，點「掃描條碼」控制項目再對準 QR Code。如果控制中心裡沒有這個按鈕，可以在自訂控制項目時把它加進去。這個掃描器可以開手電筒，光線不足時比較好用。</li>
</ol>
<p>如果相機對準了卻完全沒反應，到「設定」>「相機」看看掃描條碼的選項是不是被關掉了，或是改用控制中心的掃描條碼試試。</p>

<h2>Android 怎麼掃 QR Code</h2>
<p>Android 手機的品牌多，入口不完全一樣，常見的有三種：</p>
<ul>
<li><strong>內建相機</strong>：多數品牌的相機 App 對準 QR Code 就會跳出連結。以 Google Pixel 為例，要先在相機的「設定」>「更多設定」確認「相機掃描建議」是開啟的，接著對準 QR Code，等畫面出現連結後點一下。</li>
<li><strong>快速設定的「掃描 QR code」</strong>：從螢幕頂端往下滑，打開快速設定面板，部分機型有「掃描 QR code」的按鈕，沒看到的話可以在編輯快速設定時加進去。</li>
<li><strong>Google 智慧鏡頭（Google Lens）</strong>：在 Google App 的搜尋列點相機圖示，也能辨識 QR Code，連手機相簿裡的截圖都可以讀。</li>
</ul>

<h2>用 LINE 掃描 QR Code</h2>
<p>在台灣，很多人習慣用 LINE 掃碼，因為 LINE 的掃描器除了加好友，也能開啟一般網址。依 LINE 官方說明，LINE 正逐步更新介面，入口有兩種：</p>
<ul>
<li><strong>新版介面</strong>：點「聊天」，再點畫面上方的加入好友圖示，選「掃描行動條碼」。</li>
<li><strong>舊版介面</strong>：在「主頁」或聊天列表，點搜尋欄位右側的掃描圖示。</li>
</ul>
<p>想讓別人掃你的 LINE，或把官方帳號做成 QR Code，請看<a href="/guide/line-qr-code/">LINE QR Code 怎麼做</a>。</p>

<h2>電腦（Windows／Mac）怎麼掃 QR Code</h2>
<p>電腦通常沒有好用的鏡頭掃描功能，要看 QR Code 在哪裡：</p>
<ul>
<li><strong>QR Code 顯示在螢幕上</strong>：最快的方法是拿手機對著螢幕掃。</li>
<li><strong>QR Code 是一張圖片或截圖</strong>：例如同事傳來的截圖、郵件附件裡的票券。這時可以用本站的<a href="/scan/">QR Code 掃描器</a>，把圖片拖進去或直接貼上截圖，在瀏覽器內就能解碼，圖片不會上傳到伺服器。Chrome 內建的 Google 智慧鏡頭也能辨識圖片，但圖片會送到 Google 處理，內容敏感時要留意。</li>
</ul>

<h2>掃到之後會發生什麼</h2>
<p>手機讀到 QR Code 之後，會依內容的格式決定要做什麼。這也是為什麼同樣是 QR Code，有的打開網頁、有的直接問你要不要連 WiFi：</p>
<ul>
<li><strong>網址</strong>：跳出連結，點了用瀏覽器開啟（<a href="/url/">網址 QR Code</a>）。</li>
<li><strong>WiFi</strong>：詢問是否加入這個無線網路，不用手動輸入密碼（<a href="/wifi/">WiFi QR Code</a>）。</li>
<li><strong>電子名片</strong>：顯示聯絡人資料，可以直接存進通訊錄（<a href="/vcard/">電子名片 QR Code</a>）。</li>
<li><strong>電話、Email、簡訊</strong>：分別帶到撥號、寄信與簡訊畫面，並預先填好號碼或內容，但都要你自己按下才會送出（<a href="/phone/">電話</a>、<a href="/email/">Email</a>、<a href="/sms/">簡訊</a>）。</li>
<li><strong>純文字</strong>：直接把文字顯示出來，不會連到任何地方（<a href="/text/">純文字 QR Code</a>）。</li>
</ul>

<h2>掃不到怎麼辦</h2>
<div class="table-wrap"><table>
<thead><tr><th>狀況</th><th>可以試試</th></tr></thead>
<tbody>
<tr><td>一直對不到焦</td><td>先靠近 QR Code，再慢慢往後拉，讓整張碼完整出現在畫面裡</td></tr>
<tr><td>反光、陰影、太暗</td><td>換個角度避開反光，或開手電筒；QR Code 在螢幕上時把螢幕亮度調高</td></tr>
<tr><td>畫面霧霧的</td><td>用柔軟的布擦一下鏡頭</td></tr>
<tr><td>QR Code 印得很小、很密</td><td>靠近一點；如果是你自己做的，印大一點或縮短內容，見<a href="/guide/qr-code-svg/">印刷尺寸教學</a></td></tr>
<tr><td>顏色很淡或是反白</td><td>淺色方塊、深色背景的碼部分掃描器讀不了，換用 Google 智慧鏡頭或本站掃描器試試</td></tr>
<tr><td>四周貼著文字或圖案</td><td>QR Code 需要一圈空白（靜區），被擋住時試著只拍碼的部分</td></tr>
</tbody>
</table></div>

<h2>掃描安全提醒</h2>
<p>QR Code 本身只是一段文字，風險來自它指向的網站。掃描後先看清楚跳出來的網址，確認是你預期的網域再點；停車繳費機、公共海報上的 QR Code 要特別留意是不是被貼了假的貼紙。不要在來路不明的頁面輸入帳號密碼或信用卡資料。本站的<a href="/scan/">QR Code 掃描器</a>只會先顯示完整文字與網站主機，不會自動開啟任何連結。</p>
<p>想自己<strong>製作</strong> QR Code？用<a href="/">免費 QR Code 產生器</a>，在瀏覽器內生成、不傳雲端，可加 LOGO、下載 PNG 與 SVG。</p>

<h2>參考資料</h2>
<ul>
<li>Apple 支援：<a href="https://support.apple.com/zh-tw/guide/iphone/iphe8bda8762/ios" target="_blank" rel="noopener">使用 iPhone 相機掃描行動條碼</a></li>
<li>Pixel 相機說明：<a href="https://support.google.com/pixelcamera/answer/16561572?hl=zh-Hant" target="_blank" rel="noopener">使用 Pixel 手機掃描 QR code</a></li>
<li>LINE 支援中心：<a href="https://help.line.me/line/smartphone/?contentId=200000585&amp;lang=zh-Hant" target="_blank" rel="noopener">加入好友的方法</a>（掃描行動條碼的入口）</li>
</ul>
`,

  'line-qr-code': `
<p>大家說「LINE QR Code」，通常指的是兩件不同的事：一是<strong>分享自己的 LINE</strong>，讓對方掃了加你好友；二是店家或品牌<strong>把 LINE 官方帳號做成 QR Code</strong>，印在海報、桌卡與包裝上。兩者的取得方式與注意事項不太一樣，以下分開說明。LINE 正逐步更新 App 介面，下面的步驟同時列出新舊兩種入口，以 LINE 官方說明為準。</p>

<h2>分享個人 LINE：顯示你的行動條碼</h2>
<p>對方就在你面前時，最快的方法是讓他掃你的行動條碼：</p>
<ul>
<li><strong>新版介面</strong>：點「聊天」，再點畫面上方的加入好友圖示，選「顯示行動條碼」。</li>
<li><strong>舊版介面</strong>：在「主頁」點加入好友的圖示，選「行動條碼」，再選「顯示行動條碼」。</li>
</ul>
<p>對方用 LINE 的掃描器掃你手機上的行動條碼後，會在他的畫面點「加入好友」。依 LINE 的說明，這時你這邊不會自動加回對方，而是可以在「您可能認識的人」名單裡找到他再加入（新版介面在「聊天」上方的圖示 >「加入好友」裡）。如果掃完之後傳個貼圖給你，你也能直接從聊天室把他加入。</p>
<p>在同一個畫面點「複製連結」，就能把加好友的連結用訊息傳給不在身邊的人。LINE 官方特別提醒兩件事：</p>
<ol>
<li><strong>連結一旦公開，任何 LINE 用戶都能用它加你好友</strong>，所以不要分享給不認識的人。</li>
<li><strong>點「更新」後，舊的連結會立即失效</strong>。這是被陌生人加好友時的補救方法，但也代表：如果你把個人行動條碼或連結印在名片、海報上，之後只要按過一次更新，印出去的 QR Code 就全部不能用了。</li>
</ol>
<p>所以個人行動條碼比較適合當面分享，不建議大量印刷。需要在公開場合讓人加你，請改用官方帳號。</p>

<h2>LINE 官方帳號：取得加入好友的行動條碼與網址</h2>
<p>LINE 官方帳號可以在管理後台（LINE Official Account Manager）取得官方產生的 QR Code：依序點「主頁」、左側選單「增加好友人數」內的「增加好友工具」，再點「建立加入好友行動條碼」，就能下載圖檔。在手機版的管理 App 裡，入口是「主頁」>「增加好友人數」>「建立加入好友行動條碼」，可以儲存行動條碼。</p>
<p>如果想用自己的設計重新製作，需要的是官方帳號的<strong>加入好友網址</strong>，常見有兩種形式：</p>
<ul>
<li>後台提供的短網址，通常是 <code>https://lin.ee/</code> 開頭。</li>
<li>用官方帳號的 ID 組成的網址：<code>https://line.me/R/ti/p/%40你的ID</code>。依 LINE 開發者文件，ID 前面的 @ 要寫成 <code>%40</code>，例如 ID 是 @123abcde，網址就是 <code>https://line.me/R/ti/p/%40123abcde</code>。</li>
</ul>

<h2>個人行動條碼與官方帳號比一比</h2>
<div class="table-wrap"><table>
<thead><tr><th></th><th>個人行動條碼</th><th>官方帳號的加入好友 QR Code</th></tr></thead>
<tbody>
<tr><td>適合誰</td><td>一般使用者，當面交換 LINE</td><td>店家、品牌、社群經營者</td></tr>
<tr><td>取得方式</td><td>LINE App 的「顯示行動條碼」</td><td>官方帳號後台的「增加好友工具」</td></tr>
<tr><td>連結會不會變</td><td>按「更新」後舊連結立即失效</td><td>用官方帳號的固定網址，長期有效</td></tr>
<tr><td>適合印刷嗎</td><td>不建議</td><td>適合，海報、桌卡、包裝都可以</td></tr>
</tbody>
</table></div>

<h2>為什麼要自己做一張</h2>
<p>後台下載的 QR Code 是標準的黑白方塊，功能完全沒問題。會想自己做，通常是為了：</p>
<ul>
<li>換成品牌色，或在中間加上店家 LOGO，讓客人一眼知道是哪一家。</li>
<li>需要 SVG 向量檔，交給設計師排版或大尺寸印刷。</li>
<li>想放的其實不是加好友，而是官方帳號的某個活動頁、LINE 群組或 LIFF 頁面網址。</li>
</ul>

<h2>用本站把 LINE 連結做成 QR Code</h2>
<ol>
<li>打開<a href="/url/">網址 QR Code 產生器</a>，貼上 lin.ee 或 line.me 的網址。</li>
<li>在「前景色」選品牌色（記得要夠深），需要的話上傳 LOGO，容錯等級會自動切到 H。細節見<a href="/guide/qr-with-logo/">加 LOGO 的教學</a>。</li>
<li>要印刷就下載 SVG，只在網路上用下載 PNG 即可。</li>
<li>用手機相機與 LINE 的掃描器各掃一次。裝了 LINE 的手機，用相機掃到 line.me 或 lin.ee 的網址，通常會直接打開 LINE 的加入好友畫面。</li>
</ol>
<p>整個過程在你的瀏覽器內完成，網址不會上傳到本站伺服器，也沒有浮水印。</p>

<h2>印出去之前確認這三件事</h2>
<ul>
<li><strong>網址會長期有效</strong>：靜態 QR Code 印出去就改不了，請用官方帳號的固定網址，不要用個人行動條碼的連結。</li>
<li><strong>尺寸夠大</strong>：桌卡、名片至少 2 到 3 公分寬，海報要讓人站在遠處也掃得到，換算方式見<a href="/guide/qr-code-svg/">印刷尺寸教學</a>。</li>
<li><strong>旁邊寫上用途</strong>：例如「掃碼加入官方 LINE，領取會員優惠」，客人知道掃了會得到什麼，掃描意願會高很多。</li>
</ul>
<p>反過來，要用 LINE 掃別人的 QR Code，入口整理在<a href="/guide/scan-qr-code/">如何掃描 QR Code</a>。</p>

<h2>參考資料</h2>
<ul>
<li>LINE 支援中心：<a href="https://help.line.me/line/smartphone/?contentId=200000585&amp;lang=zh-Hant" target="_blank" rel="noopener">加入好友的方法</a>（顯示行動條碼、複製連結與「更新」）</li>
<li>LINE 官方帳號支援中心：<a href="https://help2.line.me/official_account_tw/web/categoryId/20006388/3/pc?lang=zh-Hant" target="_blank" rel="noopener">如何確認加入好友的行動條碼</a></li>
<li>LINE Developers：<a href="https://developers.line.biz/en/docs/line-login/using-line-url-scheme/" target="_blank" rel="noopener">Using LINE features with the LINE URL scheme</a>（line.me/R/ti/p/ 網址格式）</li>
</ul>
`,

  'qr-code-svg': `
<p>要把 QR Code 印在名片、傳單、海報或包裝上，檔案格式與尺寸決定了它印出來掃不掃得到。這篇說明 SVG、PNG、JPG 三種格式該怎麼選，並用實際數字算出不同印刷尺寸需要多少像素、每一格模組有多大，以及最容易被忽略的四周留白。</p>

<h2>SVG、PNG、JPG 差在哪</h2>
<ul>
<li><strong>SVG（向量）</strong>：用座標描述每一個方塊，放到多大都一樣銳利，檔案也小。印刷、大圖輸出、交給設計師排版都用它。Illustrator、Figma、Inkscape 都能直接開啟編輯，新版的 Word 與 PowerPoint 也能插入 SVG。</li>
<li><strong>PNG（點陣）</strong>：由固定數量的像素組成，適合網頁、社群貼文、簡報與小尺寸列印。支援透明背景。</li>
<li><strong>JPG（點陣、有損壓縮）</strong>：壓縮會在方塊邊緣產生雜點，而且不支援透明背景。除非系統只收 JPG，否則 QR Code 優先用 PNG 或 SVG。</li>
</ul>
<p>本站的<a href="/">QR Code 產生器</a>三種都能免費下載。PNG 與 JPG 的寬度由「尺寸」滑桿決定，範圍 200 到 2000 像素，預設 1000 像素；SVG 則沒有解析度的問題。</p>

<h2>小圖放大會怎樣</h2>
<p>下面左邊是一張只有 96 像素寬的 PNG，右邊是同一張 QR Code 的 SVG，兩張都被放大成同樣大小顯示：</p>
<div class="fig-grid fig-grid-2">
<figure><img src="/guides/upscale-demo.png" width="240" height="240" alt="96 像素的 PNG QR Code 被放大顯示，方塊邊緣模糊" loading="lazy" class="fig-smooth"><figcaption>PNG（96 像素）放大：邊緣糊成灰色</figcaption></figure>
<figure><img src="/guides/upscale-demo.svg" width="240" height="240" alt="同一張 QR Code 的 SVG 版本，放大後方塊邊緣依然銳利" loading="lazy"><figcaption>SVG：放多大都一樣銳利</figcaption></figure>
</div>
<p>螢幕上看起來只是有點糊，印出來時這些灰邊會讓相鄰的方塊黏在一起，掃描成功率明顯下降。拿網頁上截下來的小圖去印刷，就是最常見的失敗原因。</p>

<h2>印多大、需要多少像素</h2>
<p>印刷常用的解析度是每英吋 300 點（300 dpi）。換算方式是「公分 ÷ 2.54 × 300」，所以本站 PNG 預設的 1000 像素，以 300 dpi 印大約是 8.5 公分；最大的 2000 像素大約是 16.9 公分。再大就請用 SVG。</p>
<p>另一個要看的是每一格模組的大小。下表以一個常見長度的網址為例（版本 4，33×33 模組），列出不同印刷寬度的換算：</p>
<div class="table-wrap"><table>
<thead><tr><th>印刷寬度</th><th>300 dpi 需要的像素</th><th>本站 PNG 夠嗎</th><th>每格模組</th><th>大約的掃描距離</th></tr></thead>
<tbody>
<tr><td>2 公分</td><td>236</td><td>夠</td><td>0.61 毫米</td><td>20 公分內</td></tr>
<tr><td>3 公分</td><td>354</td><td>夠</td><td>0.91 毫米</td><td>30 公分內</td></tr>
<tr><td>5 公分</td><td>591</td><td>夠</td><td>1.5 毫米</td><td>50 公分內</td></tr>
<tr><td>10 公分</td><td>1,181</td><td>夠（尺寸調到 1200 以上）</td><td>3.0 毫米</td><td>1 公尺內</td></tr>
<tr><td>30 公分</td><td>3,543</td><td>不夠，請用 SVG</td><td>9.1 毫米</td><td>3 公尺內</td></tr>
</tbody>
</table></div>
<p>掃描距離那一欄用的是業界常用的經驗法則：掃描距離大約是 QR Code 寬度的 10 倍。這不是規格，只是估算的起點，內容越長、模組越多，就要印得更大；海報、看板請一定用實際尺寸的樣張，在現場距離測試。</p>

<h2>別忘了四周的靜區</h2>
<figure>
<img src="/guides/quiet-zone.svg" width="280" height="280" alt="QR Code 四周以淡黃色標出的靜區，寬度為 4 個模組" loading="lazy">
<figcaption>淡黃色就是靜區：四周至少 4 個模組寬的空白，左邊的細線標出了 4 格。</figcaption>
</figure>
<p>依 DENSO WAVE 的規格說明，QR Code 四周需要至少 4 個模組寬的空白，讓相機分辨碼從哪裡開始。本站下載的圖只在外圍留了一圈窄白邊，所以排版時請在四周自己再留空間：以上表 2 公分寬的 QR Code 來說，4 個模組約 2.4 毫米，每一邊都要留。常見的失敗是把 QR Code 貼著裁切線、邊框或文字，或放在花紋與照片上。</p>

<h2>放在螢幕與簡報上的 QR Code</h2>
<p>不印刷、只放在簡報、網頁或活動大螢幕上時，下載 PNG 就夠了，本站預設的 1000 像素在任何螢幕上都很清楚。真正要注意的是<strong>顯示出來的大小</strong>：同樣套用「掃描距離約為寬度 10 倍」的估算，坐在 5 公尺外的觀眾，投影出來的 QR Code 寬度最好有 50 公分左右；只放在投影片角落的一小塊，後排的人根本掃不到。另外，投影與螢幕常有反光，建議把 QR Code 放在白色或很淺的底上，並在畫面上停留足夠久，讓大家有時間拿出手機。</p>
<p>如果簡報背景是深色或有圖案，可以下載透明背景的 PNG 放在一塊白色方框上，不要直接疊在深色背景上，否則明暗關係會反過來，不少掃描器讀不了。</p>

<h2>印刷前的小檢查</h2>
<ul>
<li><strong>等比例縮放</strong>：在排版軟體裡縮放時鎖定長寬比，不要把 QR Code 拉成長方形。</li>
<li><strong>深色方塊、淺色背景</strong>：送印時方塊用純黑或夠深的顏色，背景維持白或很淺的顏色。</li>
<li><strong>加了 LOGO 的 SVG</strong>：LOGO 仍是你上傳的那張圖，請上傳解析度夠的檔案，說明見<a href="/guide/qr-with-logo/">加 LOGO 的教學</a>。</li>
<li><strong>先掃一次再送印</strong>：可以把檔案丟進<a href="/scan/">QR Code 掃描器</a>確認內容，再印一張樣張用手機實際掃。</li>
</ul>
<p>許多線上工具把 SVG 下載放在付費方案裡，本站的 SVG 完全免費、沒有浮水印，而且在你的瀏覽器內產生、不傳雲端。現在就到<a href="/">QR Code 產生器</a>下載向量檔吧。</p>

<h2>參考資料</h2>
<ul>
<li>DENSO WAVE：<a href="https://www.qrcode.com/en/howto/code.html" target="_blank" rel="noopener">QR Code area</a>（四周需要 4 個模組寬的空白）</li>
</ul>
`,
}
