import { fetchVoices } from './cms.js';
import { initTranslate } from './translate.js';

initTranslate();

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('voices-container');
  if (!container) return;

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });

  // Navigation Logic
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('active');
      hamburger.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  try {
    const voices = await fetchVoices(100);
    
    if (!voices || voices.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:#888; width:100%;">現在掲載中のお客様の声はありません。しばらくお待ちください。</p>';
      return;
    }

    container.innerHTML = '';
    
    voices.forEach((voice, index) => {
      const origin = voice.fromOrigin || '';
      const age = voice.age || '';
      const gender = voice.gender || '';
      const metaText = origin || age || gender ? `【${origin} ${age} ${gender}】` : '';
      
      const programName = voice.stayProgram || '体験プログラム';
      const comment = (voice.comment || '').replace(/\n/g, '<br>');
      const purpose = voice.purpose || '';
      
        const rawComment = voice.comment || '';
        let headline = purpose;
        if (!headline) {
          const sentences = rawComment.split('。');
          headline = sentences[0] ? sentences[0] + '。' : '丹波篠山での滞在について';
        }

        const imgHtml = voice.image?.url 
          ? `<div class="voice-image"><img src="${voice.image.url}?fm=webp&w=800&q=80" alt="お客様スナップ" loading="lazy"></div>` 
          : '';

        const html = `
          <article class="voice-row fade-in" style="transition-delay: ${index * 0.1}s">
            <div class="voice-text">
              <div class="voice-headline">${headline}</div>
              <div class="voice-meta-group">
                参加プログラム：${programName}<br>
                地域：${origin || '未設定'}<br>
                ${age} ${gender}
              </div>
              <div class="voice-full-comment">
                ${rawComment.replace(/\n/g, '<br>')}
              </div>
            </div>
            ${imgHtml}
          </article>
        `;
      container.insertAdjacentHTML('beforeend', html);
    });

    document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

  } catch (err) {
    console.error('Error fetching voices:', err);
    container.innerHTML = '<p style="text-align:center; color:#e00;">読み込み中にエラーが発生しました。</p>';
  }
});
