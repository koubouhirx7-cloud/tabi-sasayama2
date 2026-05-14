import os
import glob
import re

header_html = """    <header class="header">
      <div class="container nav-container">
        <a href="index.html" class="logo">丹波篠山ローカルトラベル</a>
        <button class="hamburger" aria-label="メニューを開く">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav class="nav-links">
          <a href="index.html">ホーム</a>
          <a href="stay.html">体験と滞在</a>
          <a href="education.html">教育プログラム</a>
          <a href="customize.html">カスタムと事例</a>
          <a href="news.html">最新情報</a>
          <a href="about.html">旅作り</a>
          <a href="contact.html">お問い合わせ</a>
        </nav>
      </div>
    </header>"""

footer_html = """    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-left">
            <div class="footer-logo">一般社団法人ウイズささやま</div>
            <div class="footer-info">
              〒669-2321 兵庫県丹波篠山市黒岡191 丹波篠山市民センター内<br>
              TEL: 079-552-7373 / FAX: 079-552-4680<br>
              兵庫県知事登録旅行業 地域-797号<br>
              営業時間：平日9:00-17:00（土日祝定休）
            </div>
          </div>
          
          <div class="footer-nav">
            <div class="footer-nav-col">
              <a href="index.html">＞ホーム</a>
              <a href="stay.html">＞体験と滞在</a>
              <a href="education.html">＞教育プログラム</a>
              <a href="customize.html">＞カスタムと事例</a>
              <a href="news.html">＞最新情報</a>
              <a href="about.html">＞旅作り</a>
              <a href="contact.html">＞お問い合わせ</a>
            </div>
            <div class="footer-nav-col">
              <a href="company.html">＞会社案内・旅行業登録</a>
              <a href="#">＞プライバシーポリシー</a>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; 2026 一般社団法人ウイズささやま All Rights Reserved.</p>
        </div>
      </div>
    </footer>"""

html_files = glob.glob('*.html')
for f in html_files:
    if f == 'index.html':
        continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace header
    content = re.sub(r'<header class="header">.*?</header>', header_html, content, flags=re.DOTALL)
    
    # Replace footer
    content = re.sub(r'<footer class="footer">.*?</footer>', footer_html, content, flags=re.DOTALL)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
