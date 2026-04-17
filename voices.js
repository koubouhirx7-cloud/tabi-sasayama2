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
      const name = voice.name || 'ゲストさん';
      const programName = voice.stayProgram?.title || '丹波篠山の体験';
      const comment = (voice.comment || '').replace(/\n/g, '<br>');
      
      let starsHtml = '';
      const score = voice.score || 5;
      for (let i = 0; i < 5; i++) {
        starsHtml += i < score ? '<span style="color:#f5c518;">★</span>' : '<span style="color:#ccc;">★</span>';
      }

      const imgHtml = voice.image?.url 
        ? `<img src="${voice.image.url}?fm=webp&w=600&q=80" alt="体験プログラム画像" loading="lazy">` 
        : '';

      const html = `
        <article class="voice-list-card fade-in" style="transition-delay: ${index * 0.1}s">
          ${imgHtml}
          <div class="voice-list-content">
            <div class="stars">${starsHtml}</div>
            <h2 class="program-name">${programName}</h2>
            <div class="comment">${comment}</div>
            <div class="name-info">— ${name}</div>
          </div>
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
