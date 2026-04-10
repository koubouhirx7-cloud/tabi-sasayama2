import { fetchStay } from './cms.js';

(async function initStayList() {
  const container = document.getElementById('stay-grid-container');
  if (!container) return;

  const stayData = await fetchStay(100);

  function renderStay(categoryFilter = 'すべて') {
    container.innerHTML = '';
    
    if (!stayData || stayData.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 1.1rem; padding: 4rem 0;">現在提供中のプログラムはありません。公開をお待ちください。</p>';
      return;
    }

    let displayData = [...stayData];
    

    
    // 最大6件(2行x3列)に制限
    displayData = displayData.slice(0, 6);

    if (displayData.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">該当するプログラムは見つかりませんでした。</p>';
      return;
    }

    displayData.forEach((item, index) => {
      const delay = (index % 3) * 0.1;
      
      const fetchedImg = item.heroImage?.url || item.image?.url;
      const imgUrl = fetchedImg ? fetchedImg + '?fm=webp&w=800&q=80' : '/images/P8217785.jpg';
      
      // 価格がリッチテキストの場合のプレーンテキスト抽出
      let plainPrice = '個別にお問合せください';
      if (item.infoPrice) {
        plainPrice = item.infoPrice.replace(/<[^>]+>/g, '').substring(0, 30);
      }
      
      const dates = item.infoDates || '個別にお問合せください';
      const capacity = item.infoCapacity || '個別にお問合せください';

      // microCMSの `tags` フィールド（複数選択）から取得。なければ既存の表示を残す
      let tagsHtml = '';
      if (item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
        tagsHtml = item.tags.map(tag => `<span class="prog-tag">#${tag}</span>`).join('');
      } else {
        tagsHtml = `<span class="prog-tag">#体験プログラム</span>`;
      }

      const html = `
        <a href="stay-detail.html?id=${item.id}" class="card program-card fade-in is-visible" style="animation-delay: ${delay}s">
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
      container.insertAdjacentHTML('beforeend', html);
    });
  }

  // 取得できたら描画
  renderStay('すべて');

  // タグフィルタのUIがあればUIだけ切り替える（将来拡張用）
  const filterTags = document.querySelectorAll('.filter-tags .tag');
  if (filterTags.length > 0) {
    filterTags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        filterTags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
      });
    });
  }
})();
