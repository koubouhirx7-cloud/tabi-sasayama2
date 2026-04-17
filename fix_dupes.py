import glob
import re

for f_name in glob.glob('*.html'):
    with open(f_name, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to eliminate duplicate spacing:
    # find <a href="voices.html">お客様の声</a> followed by whitespace and another <a href="voices.html"
    
    fixed = re.sub(r'(<a href="voices\.html">\S+</a>)\s+(<a href="voices\.html" class="active">)', r'\2', content)
    fixed = re.sub(r'(<a href="voices\.html">\S+</a>)\s+(<a href="voices\.html">\S+</a>)', r'\1', fixed)
    
    if fixed != content:
        with open(f_name, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"Fixed dupes in {f_name}")
