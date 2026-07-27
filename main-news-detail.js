import { fetchNewsDetail } from './cms.js';
import DOMPurify from 'dompurify';
import { getNewsPreviewArticle } from './news-preview-data.js';

(async function initNewsDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const draftKey = urlParams.get('draftKey');

  const elCategory = document.getElementById('detail-category');
  const elDate = document.getElementById('detail-date');
  const elTitle = document.getElementById('detail-title');
  const elCover = document.getElementById('detail-cover');
  const elCoverContainer = document.getElementById('detail-cover-container');
  const elContent = document.querySelector('.detail-content');
  const elBody = document.getElementById('detail-body');
  const elArticle = document.querySelector('.detail-inner');

  const showMessage = (message) => {
    if (elTitle) elTitle.textContent = '最新情報';
    if (elCategory) elCategory.style.display = 'none';
    if (elDate) elDate.style.display = 'none';
    if (elCoverContainer) elCoverContainer.hidden = true;
    elContent?.classList.remove('has-cover');
    if (elBody) {
      elBody.innerHTML = DOMPurify.sanitize(`
        <p class="detail-message">${message}</p>
        <div class="back-to-list"><a href="news.html">← 最新情報一覧へ戻る</a></div>
      `);
    }
  };

  if (!id) {
    showMessage('表示する記事が選択されていません。');
    return;
  }

  const article = id.startsWith('preview-')
    ? getNewsPreviewArticle(id)
    : await fetchNewsDetail(id, draftKey);
  if (!article) {
    showMessage('記事を読み込めませんでした。公開状態をご確認ください。');
    return;
  }

  const dateValue =
    article.date || article.publishedAt || article.createdAt || article.updatedAt;
  const date = dateValue ? new Date(dateValue) : new Date(0);
  const validDate = !Number.isNaN(date.getTime()) && date.getFullYear() > 1970;
  const formattedDate = validDate
    ? `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
    : '';

  const category = article.category || 'お知らせ';
  const title = article.title || 'タイトル未設定';
  elArticle?.classList.toggle('is-preview-article', Boolean(article.isPreview));

  if (elCategory) {
    elCategory.textContent = category;
    elCategory.style.display = '';
  }

  if (elDate) {
    elDate.textContent = formattedDate;
    elDate.style.display = formattedDate ? '' : 'none';
  }

  if (elTitle) elTitle.textContent = title;

  if (article.eyecatch?.url && elCover && elCoverContainer) {
    const coverUrl = article.eyecatch.url;
    elCover.src = coverUrl.includes('images.microcms-assets.io')
      ? `${coverUrl}?fm=webp&w=900&q=82`
      : coverUrl;
    elCover.alt = title;
    elCoverContainer.hidden = false;
    elContent?.classList.add('has-cover');
  } else if (elCoverContainer) {
    elCoverContainer.hidden = true;
    elContent?.classList.remove('has-cover');
  }

  if (elBody) {
    let optimizedContent = article.body || '<p>本文は準備中です。</p>';
    optimizedContent = optimizedContent.replace(
      /(src="https:\/\/images\.microcms-assets\.io\/[^"]+)"/g,
      '$1?fm=webp&w=1200&q=82"'
    );
    elBody.innerHTML = DOMPurify.sanitize(optimizedContent);
    elBody.insertAdjacentHTML(
      'beforeend',
      '<div class="back-to-list"><a href="news.html">← 最新情報一覧へ戻る</a></div>'
    );
  }

  document.title = `${title}｜最新情報｜ウイズささやま`;

  if (article.body) {
    const plainText = article.body
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
    if (plainText) {
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', plainText);
    }
  }

  if (article.eyecatch?.url) {
    document
      .querySelector('meta[property="og:image"]')
      ?.setAttribute('content', article.eyecatch.url);
  }
})();
