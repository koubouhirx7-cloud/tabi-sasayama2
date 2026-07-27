export function initTranslate() {

  // ─── 1. Helper functions ──────────────────────────────────────────────
  function clearGoogTransCookies() {
    const exp = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0';
    // All domain variants including parent domains
    const domainVariants = [''];
    const parts = location.hostname.split('.');
    while (parts.length >= 2) {
      const d = parts.join('.');
      domainVariants.push(d, '.' + d);
      parts.shift();
    }

    // Collect all cookies starting with 'goog' or containing 'trans' / 'google'
    const cookiesToClear = ['googtrans'];
    try {
      document.cookie.split(';').forEach(c => {
        const name = c.trim().split('=')[0];
        if (name && (name.startsWith('goog') || name.toLowerCase().includes('trans') || name.toLowerCase().includes('google'))) {
          if (!cookiesToClear.includes(name)) {
            cookiesToClear.push(name);
          }
        }
      });
    } catch (_) {}

    cookiesToClear.forEach(cookieName => {
      domainVariants.forEach(domain => {
        const dp = domain ? `; domain=${domain}` : '';
        document.cookie = `${cookieName}=; ${exp}; path=/${dp}`;
        document.cookie = `${cookieName}=; ${exp}; path=/${dp}; Secure; SameSite=Lax`;
        document.cookie = `${cookieName}=; ${exp}; path=/${dp}; Secure; SameSite=None`;
        document.cookie = `${cookieName}=; ${exp}${dp}`;
      });
    });
  }

  function clearGoogStorage() {
    try {
      // Clear localStorage keys starting with goog/trans/google
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('goog') || key.toLowerCase().includes('trans') || key.toLowerCase().includes('google'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (_) {}
    try {
      // Clear sessionStorage keys starting with goog/trans/google (exclude our own switches)
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key !== 'lang_reverting' && key !== 'lang-switch-scroll') {
          if (key.startsWith('goog') || key.toLowerCase().includes('trans') || key.toLowerCase().includes('google')) {
            sessionStorage.removeItem(key);
          }
        }
      }
    } catch (_) {}
  }

  // ─── 2. First-visit check (prevents inherited parent domain cookies) ────
  try {
    if (!localStorage.getItem('satoyama_visited')) {
      localStorage.setItem('satoyama_visited', '1');
      const hasGoogleCookie = document.cookie.split(';').some(c => c.trim().startsWith('googtrans='));
      if (hasGoogleCookie) {
        clearGoogTransCookies();
        clearGoogStorage();
        // Force a clean reload if we detected and cleared an inherited cookie
        location.reload();
        return;
      }
    }
  } catch (_) {}

  // ─── 3. Post-reload cleanup ────────────────────────────────────────────
  // Strip the lang_reset param added during JA revert reloads
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('lang_reset')) {
      url.searchParams.delete('lang_reset');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  } catch (_) {}

  // Restore scroll position after a language-switch reload
  const savedScroll = sessionStorage.getItem('lang-switch-scroll');
  if (savedScroll !== null) {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, parseInt(savedScroll, 10));
    sessionStorage.removeItem('lang-switch-scroll');
    setTimeout(() => { document.documentElement.style.scrollBehavior = ''; }, 100);
  }

  // ─── 4. If this is a JA-revert reload, apply immediate protection ──────
  const isReverting = sessionStorage.getItem('lang_reverting') === '1';
  if (isReverting) {
    sessionStorage.removeItem('lang_reverting');

    // Inject notranslate signals synchronously to prevent browser auto-translation
    try {
      document.documentElement.setAttribute('translate', 'no');
      if (!document.querySelector('meta[name="google"][content="notranslate"]')) {
        const meta = document.createElement('meta');
        meta.name = 'google';
        meta.content = 'notranslate';
        document.head.appendChild(meta);
      }
    } catch (_) {}

    // Make absolutely sure all cookies and storage are wiped
    clearGoogTransCookies();
    clearGoogStorage();

    // Prevent any cached widget script initialization
    window.googleTranslateElementInit = function () {};
  }

  // ─── 5. Build Custom Toggle UI ─────────────────────────────────────────
  const nav = document.querySelector('.nav-links');
  if (!nav || document.querySelector('.custom-lang-switch')) return;

  // Determine current language strictly from cookie
  const isEn = document.cookie.split(';').some(c => c.trim() === 'googtrans=/ja/en');

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-lang-switch';
  wrapper.style.cssText = 'margin-left:1rem;display:flex;align-items:center;gap:0.2rem;';
  wrapper.innerHTML = `
    <button class="lang-btn ${!isEn ? 'active' : ''}" data-lang="ja">JP</button>
    <span class="lang-sep">|</span>
    <button class="lang-btn ${isEn ? 'active' : ''}" data-lang="en">EN</button>
  `;
  nav.appendChild(wrapper);

  // ─── 6. Google Translate widget (only when NOT in a revert-reload) ─────
  if (!isReverting) {
    // Make sure no notranslate properties are blocking English translation if we want it
    try {
      document.documentElement.removeAttribute('translate');
      const meta = document.querySelector('meta[name="google"][content="notranslate"]');
      if (meta) meta.remove();
    } catch (_) {}

    const widget = document.createElement('div');
    widget.id = 'google_translate_element';
    widget.style.display = 'none';
    document.body.appendChild(widget);

    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement({
        pageLanguage: 'ja',
        includedLanguages: 'en',
        autoDisplay: false
      }, 'google_translate_element');
    };

    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }

  // Suppress Google Translate banner
  new MutationObserver(() => {
    const banner = document.querySelector('.goog-te-banner-frame');
    if (banner) banner.style.setProperty('display', 'none', 'important');
    if (document.body.style.top && document.body.style.top !== '0px') {
      document.body.style.setProperty('top', '0px', 'important');
    }
    if (document.body.style.marginTop && document.body.style.marginTop !== '0px') {
      document.body.style.setProperty('margin-top', '0px', 'important');
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

  // ─── 7. Button click handlers ──────────────────────────────────────────
  wrapper.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetLang = btn.getAttribute('data-lang');

      if (targetLang === 'ja') {
        // ── Revert to Japanese ──
        sessionStorage.setItem('lang-switch-scroll', String(Math.round(window.scrollY)));
        sessionStorage.setItem('lang_reverting', '1');

        // Immediately disable the running Google Translate widget and its scripts to prevent rewrite
        try {
          document.documentElement.setAttribute('translate', 'no');
          const meta = document.createElement('meta');
          meta.name = 'google';
          meta.content = 'notranslate';
          document.head.appendChild(meta);

          const combo = document.querySelector('.goog-te-combo');
          if (combo) combo.remove();

          window.google = undefined;
          window.googleTranslateElementInit = undefined;

          document.querySelectorAll('script').forEach(s => {
            if (s.src && (s.src.includes('translate.google.com') || s.src.includes('translate_a'))) {
              s.remove();
            }
          });
        } catch (_) {}

        // Clear all cookies and storage immediately
        clearGoogTransCookies();
        clearGoogStorage();

        // Fade and reload
        document.body.style.transition = 'opacity 0.15s';
        document.body.style.opacity = '0';
        setTimeout(() => {
          // Double check clear right before reload
          clearGoogTransCookies();
          clearGoogStorage();
          try {
            const u = new URL(window.location.href);
            u.searchParams.set('lang_reset', Date.now().toString());
            window.location.href = u.toString();
          } catch (_) {
            window.location.reload();
          }
        }, 150);

      } else {
        // ── Switch to English ──
        document.cookie = `googtrans=/ja/${targetLang}; path=/`;
        document.cookie = `googtrans=/ja/${targetLang}; domain=${location.hostname}; path=/`;
        document.cookie = `googtrans=/ja/${targetLang}; domain=.${location.hostname}; path=/`;

        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
          combo.value = targetLang;
          combo.dispatchEvent(new Event('change'));
          wrapper.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        } else {
          location.reload();
        }
      }
    });
  });
}
