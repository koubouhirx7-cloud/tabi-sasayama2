export function initTranslate() {
  const nav = document.querySelector('.nav-links');
  if (!nav || document.querySelector('.custom-lang-switch')) return;

  // Check current language state from cookie
  const isEn = document.cookie.includes('googtrans=/ja/en');

  // Create Custom Toggle UI
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-lang-switch';
  wrapper.style.marginLeft = '1rem';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '0.2rem';
  wrapper.innerHTML = `
    <button class="lang-btn ${!isEn ? 'active' : ''}" data-lang="ja">JP</button>
    <span class="lang-sep">|</span>
    <button class="lang-btn ${isEn ? 'active' : ''}" data-lang="en">EN</button>
  `;
  nav.appendChild(wrapper);

  // Hidden Google Widget placeholder
  const widget = document.createElement('div');
  widget.id = 'google_translate_element';
  widget.style.display = 'none';
  document.body.appendChild(widget);

  window.googleTranslateElementInit = function() {
    new window.google.translate.TranslateElement({
      pageLanguage: 'ja',
      includedLanguages: 'en',
      autoDisplay: false
    }, 'google_translate_element');
  };

  const script = document.createElement('script');
  script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.head.appendChild(script);

  // Events for Custom UI
  wrapper.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetLang = e.target.getAttribute('data-lang');
      
      if (targetLang === 'ja') {
        // Revert to Japanese
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=" + location.hostname + "; path=/";
        location.reload();
      } else {
        // Translate to English
        document.cookie = \`googtrans=/ja/\${targetLang}; path=/\`;
        document.cookie = \`googtrans=/ja/\${targetLang}; domain=\${location.hostname}; path=/\`;
        
        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
          combo.value = targetLang;
          combo.dispatchEvent(new Event('change'));
          // Update UI
          wrapper.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
        } else {
          location.reload();
        }
      }
    });
  });
}
