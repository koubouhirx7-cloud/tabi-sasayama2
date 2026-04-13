export function initTranslate() {
  const nav = document.querySelector('.nav-links');
  if (!nav || document.getElementById('google_translate_element')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'translate-widget-wrap';
  wrapper.style.marginLeft = 'auto'; // Push to the right if needed

  const widget = document.createElement('div');
  widget.id = 'google_translate_element';
  wrapper.appendChild(widget);
  
  nav.appendChild(wrapper);

  window.googleTranslateElementInit = function() {
    new window.google.translate.TranslateElement({
      pageLanguage: 'ja',
      includedLanguages: 'en', // Fluently supports English per request
      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
  };

  const script = document.createElement('script');
  script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.head.appendChild(script);
}
