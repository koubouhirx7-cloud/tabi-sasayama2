import { fetchNewsDetail, fetchAllNews } from './cms.js';

(async function initNewsDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const draftKey = urlParams.get('draftKey');
  
  if (!id) return; // IDがない場合は静的プレースホルダーのままとする

  // 詳細記事と、サイドバー用の全記事を並行して取得
  const [article, allNews] = await Promise.all([
    fetchNewsDetail(id, draftKey),
    fetchAllNews()
  ]);
  
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
      elCover.src = article.eyecatch.url + '?fm=webp&w=1200&q=80';
      elCover.alt = article.title;
    } else {
      elCover.src = '/images/P6170310.jpg';
      elCover.alt = 'アイキャッチ画像';
    }
    elCoverContainer.style.display = '';
  }

  if (elBody) {
    let optimizedContent = article.body || '';
    optimizedContent = optimizedContent.replace(/(src="https:\/\/images\.microcms-assets\.io\/[^"]+)"/g, '$1?fm=webp&w=1000&q=80"');
    elBody.innerHTML = optimizedContent;
    elBody.innerHTML += `
      <div class="back-to-list">
        <a href="news.html">← News一覧に戻る</a>
      </div>
    `;
  }

  // 動的SEOタグの更新
  document.title = `${article.title} | 最新情報 | 丹波篠山で田舎・農業体験`;
  if (article.body) {
    const plainText = article.body.replace(/<[^>]+>/g, '').substring(0, 120) + '...';
    document.querySelector('meta[name="description"]')?.setAttribute('content', plainText);
  }
  if (article.eyecatch) {
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', article.eyecatch.url);
  }

  // --- サイドバー生成処理 ---
  if (allNews && allNews.length > 0) {
    const cats = new Set();
    const archives = new Set();
    
    allNews.forEach(item => {
      if (item.category) cats.add(item.category);
      const bd = new Date(item.date || item.publishedAt);
      const ym = `${bd.getFullYear()}年${bd.getMonth() + 1}月`;
      archives.add(ym);
    });

    const catFilterList = document.getElementById('category-filter-list');
    const archFilterList = document.getElementById('archive-filter-list');

    if (catFilterList) {
      catFilterList.innerHTML = `<li><a href="news.html?cat=${encodeURIComponent('すべて')}" data-cat="すべて">すべて</a></li>`;
      if (cats.size === 0) {
        cats.add('お知らせ');
        cats.add('イベント情報');
        cats.add('レポート');
      }
      cats.forEach(c => {
        catFilterList.insertAdjacentHTML('beforeend', `<li><a href="news.html?cat=${encodeURIComponent(c)}" data-cat="${c}">${c}</a></li>`);
      });
    }

    if (archFilterList) {
      archFilterList.innerHTML = `<li><a href="news.html?arc=${encodeURIComponent('すべて')}" data-arc="すべて">すべて</a></li>`;
      if (archives.size === 0) {
        archives.add('2026年3月');
        archives.add('2026年2月');
        archives.add('2026年1月');
      }
      archives.forEach(arc => {
        archFilterList.insertAdjacentHTML('beforeend', `<li><a href="news.html?arc=${encodeURIComponent(arc)}" data-arc="${arc}">${arc}</a></li>`);
      });
    }
  }
})();
