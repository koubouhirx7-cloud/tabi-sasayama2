import { fetchAllNews } from './cms.js';
import DOMPurify from 'dompurify';
import { newsPreviewArticles } from './news-preview-data.js';

(async function initNewsList() {
  const container = document.getElementById('news-grid-container');
  const catFilterList = document.getElementById('category-filter-list');
  const archFilterList = document.getElementById('archive-filter-list');
  const paginationContainer = document.getElementById('news-pagination');

  if (!container) return;

  const cmsNewsData = await fetchAllNews();
  const isPreviewMode = cmsNewsData.length === 0;
  const newsData = isPreviewMode ? newsPreviewArticles : cmsNewsData;
  document.body.classList.toggle('news-preview-mode', isPreviewMode);
  const urlParams = new URLSearchParams(window.location.search);
  let currentCategory = urlParams.get('cat') || 'すべて';
  let currentArchive = urlParams.get('arc') || 'すべて';
  let currentPage = 1;

  const getArticleDate = (item) => {
    const value = item.date || item.publishedAt || item.createdAt || item.updatedAt;
    const date = value ? new Date(value) : new Date(0);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  };

  const getArticleCategory = (item) => {
    const value = item.category;
    if (Array.isArray(value)) {
      return value.find((category) => typeof category === 'string' && category.trim())
        || 'お知らせ';
    }
    if (value && typeof value === 'object') {
      return value.name || value.title || value.label || 'お知らせ';
    }
    return typeof value === 'string' && value.trim() ? value : 'お知らせ';
  };

  const updateUrl = () => {
    const params = new URLSearchParams();
    if (currentCategory !== 'すべて') params.set('cat', currentCategory);
    if (currentArchive !== 'すべて') params.set('arc', currentArchive);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  };

  const bindFilterLinks = (list, attribute, onSelect) => {
    if (!list) return;
    list.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        onSelect(link.getAttribute(attribute));
        currentPage = 1;
        updateUrl();
        renderNews();
      });
    });
  };

  function renderFilters() {
    const categories = [...new Set(
      newsData.map(getArticleCategory)
    )];
    const years = [...new Set(
      newsData
        .map((item) => getArticleDate(item).getFullYear())
        .filter((year) => year > 1970)
    )].sort((a, b) => b - a);

    if (catFilterList) {
      const displayCategories = categories.length
        ? categories
        : ['お知らせ', '旅の記録', '新しいプロジェクト'];
      const categoryItems = ['すべて', ...displayCategories]
        .map((category) => `
          <li>
            <a
              href="#"
              class="${currentCategory === category ? 'active' : ''}"
              data-cat="${category}"
            >${category}</a>
          </li>
        `)
        .join('');
      catFilterList.innerHTML = DOMPurify.sanitize(categoryItems);
      bindFilterLinks(catFilterList, 'data-cat', (value) => {
        currentCategory = value || 'すべて';
        renderFilters();
      });
    }

    if (archFilterList) {
      const displayYears = years.length ? years : [new Date().getFullYear()];
      const archiveItems = ['すべて', ...displayYears.map((year) => `${year}年`)]
        .map((archive) => `
          <li>
            <a
              href="#"
              class="${currentArchive === archive ? 'active' : ''}"
              data-arc="${archive}"
            >${archive}</a>
          </li>
        `)
        .join('');
      archFilterList.innerHTML = DOMPurify.sanitize(archiveItems);
      bindFilterLinks(archFilterList, 'data-arc', (value) => {
        currentArchive = value || 'すべて';
        renderFilters();
      });
    }
  }

  function renderPagination(totalPages) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    if (totalPages < 1) return;

    for (let page = 1; page <= totalPages; page += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `pagination-btn${page === currentPage ? ' active' : ''}`;
      button.textContent = String(page);
      button.setAttribute('aria-label', `${page}ページ目`);
      button.setAttribute('aria-current', page === currentPage ? 'page' : 'false');
      button.addEventListener('click', () => {
        currentPage = page;
        renderNews();
        document.querySelector('.news-index')?.scrollIntoView({ behavior: 'smooth' });
      });
      paginationContainer.appendChild(button);
    }
  }

  function renderNews() {
    const filtered = newsData
      .filter((item) => {
        const categoryMatches =
          currentCategory === 'すべて' || getArticleCategory(item) === currentCategory;
        const year = getArticleDate(item).getFullYear();
        const archiveMatches =
          currentArchive === 'すべて' || `${year}年` === currentArchive;
        return categoryMatches && archiveMatches;
      })
      .sort((a, b) => getArticleDate(b) - getArticleDate(a));

    if (filtered.length === 0) {
      const message = '選択した条件に該当する記事はありません。';
      container.innerHTML = `<p class="news-empty">${message}</p>`;
      renderPagination(0);
      return;
    }

    const itemsPerPage = 5;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * itemsPerPage;
    const displayData = filtered.slice(start, start + itemsPerPage);

    const rows = displayData.map((item) => {
      const date = formatDate(getArticleDate(item));
      const category = getArticleCategory(item);
      const title = item.title || 'タイトル未設定';
      const id = encodeURIComponent(item.id || '');
      return `
        <a class="news-row" href="news-detail.html?id=${id}">
          <time class="news-date">${date}</time>
          <h2 class="news-title">${title}</h2>
          <span class="news-category">${category}</span>
        </a>
      `;
    }).join('');

    container.innerHTML = DOMPurify.sanitize(rows);
    renderPagination(totalPages);
  }

  renderFilters();
  renderNews();
})();
