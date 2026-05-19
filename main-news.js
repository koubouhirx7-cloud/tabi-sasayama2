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
  let currentPage = 1;

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
          currentPage = 1;
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
          currentPage = 1;
          renderNews();
        });
      });
    }
  }

  function renderNews() {
    container.innerHTML = '';
    const paginationContainer = document.getElementById('news-pagination');
    if (paginationContainer) paginationContainer.innerHTML = '';
    
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

    const itemsPerPage = window.innerWidth <= 1024 ? 6 : 9;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    
    // Ensure currentPage doesn't exceed totalPages after resize
    if (currentPage > totalPages) {
      currentPage = totalPages || 1;
    }

    const displayData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    displayData.forEach((item, index) => {
      const delay = (index % itemsPerPage) * 0.1;
      const dateObj = new Date(item.date || item.publishedAt);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      
      const imgUrl = item.eyecatch ? item.eyecatch.url + '?fm=webp&w=800&q=80' : '/images/PB182518.jpg';
      const category = item.category || 'お知らせ';
      const title = item.title || 'タイトル未設定'; // undefined防止用
      
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
            <h3 class="news-title">${title}</h3>
          </div>
        </a>
      `;
      container.insertAdjacentHTML('beforeend', html);
    });

    // Pagination rendering
    if (totalPages > 1 && paginationContainer) {
      const btnPrev = document.createElement('button');
      btnPrev.className = 'pagination-btn';
      btnPrev.textContent = '前へ';
      if (currentPage === 1) btnPrev.disabled = true;
      btnPrev.addEventListener('click', () => {
        if (currentPage > 1) { 
          currentPage--; renderNews(); window.scrollTo({top: 0, behavior: 'smooth'}); 
        }
      });
      paginationContainer.appendChild(btnPrev);

      for (let i = 1; i <= totalPages; i++) {
        const btnNum = document.createElement('button');
        btnNum.className = 'pagination-btn' + (i === currentPage ? ' active' : '');
        btnNum.textContent = i;
        btnNum.addEventListener('click', () => {
          currentPage = i; renderNews(); window.scrollTo({top: 0, behavior: 'smooth'});
        });
        paginationContainer.appendChild(btnNum);
      }

      const btnNext = document.createElement('button');
      btnNext.className = 'pagination-btn';
      btnNext.textContent = '次へ';
      if (currentPage === totalPages) btnNext.disabled = true;
      btnNext.addEventListener('click', () => {
        if (currentPage < totalPages) { 
          currentPage++; renderNews(); window.scrollTo({top: 0, behavior: 'smooth'}); 
        }
      });
      paginationContainer.appendChild(btnNext);
    }
  }

  if (newsData && newsData.length > 0) {
    extractFilters();
  }
  
  renderNews();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderNews();
    }, 200);
  });

})();
