import os
import glob
import re

directory = "/Volumes/ハイランダー/Antigraviti/Antigraviti/ウィズささやまさんv2/with-sasayama/"
files = glob.glob(os.path.join(directory, "*.html"))

pattern = re.compile(r'^\s*兵庫県知事登録旅行業 地域-797号<br>\s*\n', re.MULTILINE)

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = pattern.sub('', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {os.path.basename(filepath)}")

