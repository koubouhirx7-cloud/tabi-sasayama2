import { fetchStay } from './cms.js';

(async function initStayList() {
  const container = document.getElementById('stay-grid-container');
  if (!container) return;

  const stayData = await fetchStay(100);

  let currentCategory = 'すべて';

  function extractFilters() {
    const cats = new Set();
    stayData.forEach(item => {
      // ユーザーが microCMS で category を追加した場合に抽出
      if (item.category) cats.add(item.category);
    });

    const filterContainer = document.querySelector('.filter-tags');
    if (filterContainer) {
      if (cats.size > 0) {
        filterContainer.style.display = 'flex';
        filterContainer.innerHTML = `<span class="tag active" data-cat="すべて">すべて</span>`;
        cats.forEach(c => {
          filterContainer.insertAdjacentHTML('beforeend', `<span class="tag" data-cat="${c}">${c}</span>`);
        });

        filterContainer.querySelectorAll('.tag').forEach(tag => {
          tag.addEventListener('click', (e) => {
            e.preventDefault();
            filterContainer.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            currentCategory = tag.getAttribute('data-cat');
            renderStay();
          });
        });
      } else {
        filterContainer.style.display = 'none';
      }
    }
  }

  function renderStay() {
    container.innerHTML = '';
    
    if (!stayData || stayData.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 1.1rem; padding: 4rem 0;">現在提供中のプログラムはありません。公開をお待ちください。</p>';
      return;
    }

    let displayData = stayData.filter(item => {
      if (currentCategory === 'すべて') return true;
      return item.category === currentCategory;
    });

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

  // タグと初期描画
  extractFilters();
  renderStay();
})();
