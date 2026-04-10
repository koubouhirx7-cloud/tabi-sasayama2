import { fetchStay } from './cms.js';

(async function initStayList() {
  const container = document.getElementById('stay-grid-container');
  if (!container) return;

  const stayData = await fetchStay(100);

  function renderStay() {
    container.innerHTML = '';
    
    if (!stayData || stayData.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.1rem; padding: 4rem 0;">現在提供中のプログラムはありません。公開をお待ちください。</p>';
      return;
    }

    // カテゴリごとにグループ化 (APIの取得順＝microCMSでの並び順)
    const categories = [];
    const grouped = {};

    stayData.forEach(item => {
      const cat = item.category || 'その他プログラム';
      if (!grouped[cat]) {
        grouped[cat] = [];
        categories.push(cat); // 初めて出たカテゴリを追加
      }
      grouped[cat].push(item);
    });

    categories.forEach(cat => {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'stay-category-section fade-in is-visible';
      sectionEl.style.marginBottom = '4rem';

      const titleEl = document.createElement('h2');
      titleEl.textContent = cat;
      titleEl.className = 'stay-category-title';
      titleEl.style.borderBottom = '2px solid var(--color-primary)';
      titleEl.style.paddingBottom = '0.5rem';
      titleEl.style.marginBottom = '1.5rem';
      titleEl.style.color = 'var(--color-primary)';
      titleEl.style.fontFamily = 'var(--font-display)';
      sectionEl.appendChild(titleEl);

      const gridEl = document.createElement('div');
      gridEl.className = 'program-grid';

      grouped[cat].forEach((item, index) => {
        const delay = (index % 3) * 0.1;
        
        const fetchedImg = item.heroImage?.url || item.image?.url;
        const imgUrl = fetchedImg ? fetchedImg + '?fm=webp&w=800&q=80' : '/images/P8217785.jpg';
        
        let plainPrice = '個別にお問合せください';
        if (item.infoPrice) {
          plainPrice = item.infoPrice.replace(/<[^>]+>/g, '').substring(0, 30);
        }
        
        const dates = item.infoDates || '個別にお問合せください';
        const capacity = item.infoCapacity || '個別にお問合せください';

        let tagsHtml = '';
        if (item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
          tagsHtml = item.tags.map(tag => `<span class="prog-tag">#${tag}</span>`).join('');
        } else {
          tagsHtml = `<span class="prog-tag">#体験プログラム</span>`;
        }

        const html = `
          <a href="stay-detail.html?id=${item.id}" class="card program-card" style="animation-delay: ${delay}s">
            <div class="program-img">
              <img src="${imgUrl}" alt="${item.title}" />
            </div>
            <div class="program-content">
              <div class="program-tags">
                ${tagsHtml}
              </div>
              <h3 class="program-title">${item.title}</h3>
              <p class="program-meta">🗓 日程: ${dates}</p>
              <p class="program-meta">💰 価格: ${plainPrice}</p>
              <p class="program-meta">👥 定員: ${capacity}</p>
            </div>
          </a>
        `;
        gridEl.insertAdjacentHTML('beforeend', html);
      });

      sectionEl.appendChild(gridEl);
      container.appendChild(sectionEl);
    });
  }

  // 初期描画
  renderStay();
})();
