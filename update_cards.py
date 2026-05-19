import re

files_to_update = ['stay.html', 'index.html']

for filename in files_to_update:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to find the <div class="program-grid"> ... </div>
    match = re.search(r'(<div class="program-grid">)(.*?)( +</div>\s*(?:<!-- NEWS セクション|<div class="center-btn">|</div>\s*</section>|</div>\s*</div>\s*</section>))', content, re.DOTALL)
    if match:
        prefix = match.group(1)
        cards_html = match.group(2)
        suffix = match.group(3)
        
        # In case it already has 6 cards, let's just make sure we extract the first 3 or just duplicate the content if there are 3.
        # Currently there are 3 cards. If we just double cards_html, it will be 6.
        # But let's check count first:
        card_count = cards_html.count('class="card program-card')
        if card_count == 3:
            # Let's slightly change the delay for the duplicated cards
            cards_html_2 = cards_html.replace('animation-delay: 0.2s', 'animation-delay: 0.6s').replace('animation-delay: 0.4s', 'animation-delay: 0.8s').replace('fade-in">', 'fade-in" style="animation-delay: 0.5s">', 1)
            new_cards_html = cards_html + cards_html_2
            new_content = content[:match.start()] + prefix + new_cards_html + suffix + content[match.end():]
            
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename} with 6 background cards.")
        else:
            print(f"{filename} already has {card_count} cards, skipping duplication.")

