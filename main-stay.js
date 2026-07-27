import { fetchStay } from './cms.js';
import DOMPurify from 'dompurify';

(async function initStayList() {
  const container = document.getElementById('stay-grid-container');
  if (!container) return;

  const stayData = await fetchStay(100);

  const stripHtml = (value = '') => value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const addImageParams = (url) => {
    if (!url) return './images/P8217785.jpg';
    return `${url}${url.includes('?') ? '&' : '?'}fm=webp&w=1000&q=82`;
  };

  const publicStayData = Array.isArray(stayData)
    ? stayData
        .filter((item) => item.isPublic !== false)
        .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    : [];

  if (publicStayData.length === 0) {
    const previewCards = [
      { image: './images/R0334248.jpg', category: '季節限定' },
      { image: './images/P8217785.jpg', category: '季節限定' },
      { image: './images/P1011277.jpg', category: '通年開催' },
      { image: './images/PC032939.jpg', category: '通年開催' },
      { image: './images/DSC_5792.jpg', category: '季節限定' },
      { image: './images/stay/stay-landscape-drive.jpg', category: '通年開催' },
    ];

    const previewHtml = previewCards.map((card, index) => `
      <a class="program-card is-preview" href="stay-detail.html?preview=1" aria-label="詳細レイアウト確認用プログラム ${index + 1}">
        <div class="program-img">
          <img src="${card.image}" alt="">
        </div>
        <span class="program-badge${card.category.includes('通年') ? ' is-annual' : ''}">${card.category}</span>
        <div class="program-content">
          <h2 class="program-title">プログラム掲載準備中</h2>
          <div class="program-meta-list">
            <span>microCMS公開後に日程を表示</span>
            <span>料金を表示</span>
          </div>
        </div>
      </a>
    `).join('');

    container.innerHTML = DOMPurify.sanitize(`
      <p class="stay-preview-note">表示レイアウト確認用：microCMSで公開したプログラムに自動で置き換わります。</p>
      <div class="stay-program-grid">${previewHtml}</div>
    `);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'stay-program-grid';

  publicStayData.forEach((item) => {
    const category = item.category || '体験プログラム';
    const title = item.title || item.stayProgram || '体験・滞在プログラム';
    const imageUrl = addImageParams(item.heroImage?.url || item.image?.url);
    const dates = stripHtml(item.infoDates || item.date || '日程は詳細ページへ');
    const price = stripHtml(item.infoPrice || item.price || '料金は詳細ページへ');
    const duration = stripHtml(item.infoDuration || item.duration || '');
    const isAnnual = category.includes('通年') || category.includes('年間') || category.includes('定期');

    const html = `
      <a href="stay-detail.html?id=${encodeURIComponent(item.id)}" class="program-card">
        <div class="program-img">
          <img src="${imageUrl}" alt="${title}">
        </div>
        <span class="program-badge${isAnnual ? ' is-annual' : ''}">${category}</span>
        <div class="program-content">
          <h2 class="program-title">${title}</h2>
          <div class="program-meta-list">
            <span>${dates}</span>
            ${duration ? `<span>${duration}</span>` : ''}
            <span>${price}</span>
          </div>
        </div>
      </a>
    `;

    grid.insertAdjacentHTML('beforeend', DOMPurify.sanitize(html));
  });

  container.replaceChildren(grid);
})();
