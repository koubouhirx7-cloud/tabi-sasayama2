import { fetchNewsDetail } from './cms.js';

(async function initNewsDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  
  if (!id) return; // IDがない場合は静的プレースホルダーのままとする

  const article = await fetchNewsDetail(id);
  if (!article) return; // 取得失敗時

  const dateObj = new Date(article.date || article.publishedAt);
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');

  const elCat = document.getElementById('detail-category');
  const elDate = document.getElementById('detail-date');
  const elTitle = document.getElementById('detail-title');
  const elCover = document.getElementById('detail-cover');
  const elCoverContainer = document.getElementById('detail-cover-container');
  const elBody = document.getElementById('detail-body');

  if (elCat) {
    if (article.category) {
      elCat.textContent = article.category;
      elCat.style.display = '';
    } else {
      elCat.style.display = 'none';
    }
  }
  
  if (elDate) elDate.textContent = `${y}年${m}月${d}日`;
  if (elTitle) elTitle.textContent = article.title;
  
  if (elCoverContainer && elCover) {
    if (article.eyecatch) {
      elCover.src = article.eyecatch.url;
      elCover.alt = article.title;
      elCoverContainer.style.display = '';
    } else {
      elCoverContainer.style.display = 'none';
    }
  }

  if (elBody) {
    elBody.innerHTML = article.body;
    elBody.innerHTML += `
      <div class="back-to-list">
        <a href="news.html">← News一覧に戻る</a>
      </div>
    `;
  }
  
  document.title = `${article.title} | 一般社団法人ウイズささやま`;
})();
