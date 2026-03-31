import { fetchAllNews } from './cms.js';

(async function initNewsList() {
  const container = document.getElementById('news-grid-container');
  const catFilterList = document.getElementById('category-filter-list');
  const archFilterList = document.getElementById('archive-filter-list');
  
  if (!container) return;

  const newsData = await fetchAllNews();
  
  const urlParams = new URLSearchParams(window.location.search);
  let currentCategory = urlParams.get('cat') || 'すべて';
  let currentArchive = urlParams.get('arc') || 'すべて';

  function extractFilters() {
    const cats = new Set();
    const archives = new Set();
    
    // Sort logic to ensure correct newest-first dates
    newsData.sort((a,b) => new Date(b.date || b.publishedAt) - new Date(a.date || a.publishedAt));

    newsData.forEach(item => {
      if (item.category) cats.add(item.category);
      const d = new Date(item.date || item.publishedAt);
      const ym = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      archives.add(ym);
    });

    if (catFilterList) {
      catFilterList.innerHTML = `<li><a href="#" class="active" data-cat="すべて">すべて</a></li>`;
      if (cats.size === 0) {
        cats.add('お知らせ');
        cats.add('イベント情報');
        cats.add('レポート');
      }
      cats.forEach(c => {
        catFilterList.insertAdjacentHTML('beforeend', `<li><a href="#" data-cat="${c}">${c}</a></li>`);
      });
      catFilterList.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          catFilterList.querySelectorAll('a').forEach(l => l.classList.remove('active'));
          a.classList.add('active');
          currentCategory = a.getAttribute('data-cat');
          renderNews();
        });
      });
    }

    if (archFilterList) {
      archFilterList.innerHTML = `<li><a href="#" class="active" data-arc="すべて">すべて</a></li>`;
      if (archives.size === 0) {
        archives.add('2026年3月');
        archives.add('2026年2月');
        archives.add('2026年1月');
      }
      archives.forEach(arc => {
         archFilterList.insertAdjacentHTML('beforeend', `<li><a href="#" data-arc="${arc}">${arc}</a></li>`);
      });
      archFilterList.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          archFilterList.querySelectorAll('a').forEach(l => l.classList.remove('active'));
          a.classList.add('active');
          currentArchive = a.getAttribute('data-arc');
          renderNews();
        });
      });
    }
  }

  function renderNews() {
    container.innerHTML = '';
    
    if (!newsData || newsData.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">現在表示できる記事がありません。</p>';
      return;
    }

    const filtered = newsData.filter(item => {
      const matchCat = currentCategory === 'すべて' || item.category === currentCategory;
      const d = new Date(item.date || item.publishedAt);
      const ym = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      const matchArc = currentArchive === 'すべて' || ym === currentArchive;
      return matchCat && matchArc;
    });

    if (filtered.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">該当する記事が見つかりませんでした。</p>';
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

  if (newsData && newsData.length > 0) {
    extractFilters();
  }
  
  renderNews();

})();
