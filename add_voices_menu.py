import os
import glob

html_files = glob.glob('*.html')

for html_file in html_files:
    if html_file == 'voices.html' or html_file == 'index.html':  
        # voices.html is already correct, index.html is already done via multi_replace but wait, let me check index.html footer
        pass

    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to replace <a href="news.html">最新情報</a> with <a href="news.html">最新情報</a>\n          <a href="voices.html">お客様の声</a>
    # Note: spacing might vary, let's use a regex instead.
    import re
    # We find `<a href="news.html">最新情報</a>` and if it doesn't already have `voices.html` following it somewhere nearby, we add it.
    
    # Simple regex replace:
    new_content = re.sub(r'(<a\s+href="news\.html"[^>]*>最新情報</a>)', r'\1\n          <a href="voices.html">お客様の声</a>', content)
    
    if new_content != content:
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {html_file}")

