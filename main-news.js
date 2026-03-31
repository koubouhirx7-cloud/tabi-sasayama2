import { fetchAllNews } from './cms.js';

(async function initNewsList() {
  const container = document.getElementById('news-grid-container');
  const tags = document.querySelectorAll('.category-nav .tag');
  
  if (!container) return;

  const newsData = await fetchAllNews();
  
  function renderNews(categoryFilter = 'すべて') {
    container.innerHTML = '';
    
    if (!newsData || newsData.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">現在表示できる記事がありません。</p>';
      return;
    }

    const filtered = categoryFilter === 'すべて' 
      ? newsData 
      : newsData.filter(n => (n.category === categoryFilter));

    if (filtered.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">該当する記事が見つかりませんでした。</p>';
      return;
    }

    filtered.forEach((item, index) => {
      const delay = (index % 4) * 0.1;
      const dateObj = new Date(item.date || item.publishedAt);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      
      const imgUrl = item.eyecatch ? item.eyecatch.url : '/images/PB182518.jpg';
      const category = item.category || 'お知らせ';
      
      const html = `
        <a href="news-detail.html?id=${item.id}" class="news-card fade-in is-visible" style="animation-delay: ${delay}s">
          <div class="news-img">
            <img src="${imgUrl}" alt="${category}" />
          </div>
          <div class="news-content">
            <div class="news-meta">
              <span class="news-category">${category}</span>
              <span class="news-date">${y}.${m}.${d}</span>
            </div>
            <h3 class="news-title">${item.title}</h3>
          </div>
        </a>
      `;
      container.insertAdjacentHTML('beforeend', html);
    });
  }

  // 取得した直後に初回レンダリングを実行（空の場合は内部で「記事がありません」を表示）
  renderNews('すべて');

  tags.forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.preventDefault();
      tags.forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      
      const categoryToFilter = tag.textContent.trim();
      renderNews(categoryToFilter);
    });
  });

})();
