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
      
      const imgHtml = voice.image?.url 
        ? `<img src="${voice.image.url}?fm=webp&w=600&q=80" alt="お客様スナップ" loading="lazy">` 
        : '';

      const html = `
        <article class="voice-list-card fade-in" style="transition-delay: ${index * 0.1}s">
          ${imgHtml}
          <div class="voice-list-content">
            <div style="font-size: 0.85rem; color: var(--color-primary); margin-bottom: 0.5rem; font-weight: 500;">${metaText}</div>
            <h2 class="program-name">${programName}</h2>
            ${purpose ? `<p style="font-size: 0.9rem; margin-bottom: 1rem; color: #555;"><strong>参加目的:</strong> ${purpose}</p>` : ''}
            <div class="comment">${comment}</div>
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
