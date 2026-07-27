import { fetchVoicesDetail } from './cms.js';
import DOMPurify from 'dompurify';
import { initTranslate } from './translate.js';

initTranslate();

const params = new URLSearchParams(window.location.search);
const contentId = params.get('id');
const isPreview = params.get('preview') === '1';
const displayNumber = (params.get('no') || '01').padStart(2, '0').slice(-2);

function formatDate(item) {
  const rawDate = item.publishedAt || item.createdAt || item.updatedAt;
  if (!rawDate) return isPreview ? 'PREVIEW' : '';

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getTitle(item) {
  return item.title || item.stayProgram || '丹波篠山でつくる旅のストーリー';
}

function toRichHtml(value, fallback = '') {
  if (!value) return fallback ? `<p>${fallback}</p>` : '';
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return fallback ? `<p>${fallback}</p>` : '';
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
}

function collectImages(item) {
  const candidates = [
    ...(Array.isArray(item.gallery) ? item.gallery : []),
    ...(Array.isArray(item.images) ? item.images : []),
    ...(Array.isArray(item.photos) ? item.photos : []),
    item.image
  ].filter(Boolean);

  const seen = new Set();
  return candidates
    .map((image) => {
      if (typeof image === 'string') return image;
      return image?.url || '';
    })
    .filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

function resizeImageUrl(url) {
  if (!url || !url.includes('microcms-assets.io')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}fm=webp&w=1000&h=760&fit=crop&q=84`;
}

function renderGallery(item, title) {
  const images = collectImages(item);

  if (images.length === 0) {
    return `
      <div class="case-gallery-grid">
        ${Array.from({ length: 4 }, () => '<div class="case-gallery-item is-empty"></div>').join('')}
      </div>
      <div class="case-gallery-dots" aria-hidden="true">
        ${Array.from({ length: 4 }, () => '<span class="case-gallery-dot"></span>').join('')}
      </div>
    `;
  }

  const visibleImages = images.slice(0, 4);
  return `
    <div class="case-gallery-grid ${visibleImages.length === 1 ? 'is-single' : ''}">
      ${visibleImages.map((url, index) => `
        <figure class="case-gallery-item">
          <img
            src="${resizeImageUrl(url)}"
            alt="${title}の記録写真${index + 1}"
            ${index === 0 ? '' : 'loading="lazy"'}
          >
        </figure>
      `).join('')}
    </div>
    <div class="case-gallery-dots" aria-hidden="true">
      ${Array.from({ length: Math.max(visibleImages.length, 1) }, () => '<span class="case-gallery-dot"></span>').join('')}
    </div>
  `;
}

function renderFactRow(label, value) {
  if (!value) return '';
  return `
    <div class="case-fact-row">
      <div class="case-fact-label">${label}</div>
      <div class="case-fact-body">${toRichHtml(value)}</div>
    </div>
  `;
}

function renderDetail(item) {
  const title = getTitle(item);
  const comment = item.comment || item.customerVoice || item.voice || '';
  const participantMeta = [item.fromOrigin, item.age, item.gender].filter(Boolean).join(' / ');
  const request = item.request || item.requestContent || item.purpose || '';
  const proposal = item.proposal || item.plan || item.suggestion || item.itinerary || '';
  const onTheDay = item.onTheDay || item.dayOf || item.day || item.result || '';
  const facts = [
    renderFactRow('ご依頼', request),
    renderFactRow('提案', proposal),
    renderFactRow('当日', onTheDay)
  ].join('');

  document.title = `${title}｜事例紹介・ストーリー｜ウイズささやま`;

  return `
    <p class="case-detail-preview-note" ${isPreview ? 'style="display:block"' : ''}>
      microCMS投稿後の表示確認用プレビュー
    </p>
    <header class="case-detail-heading">
      <span class="case-detail-number">${displayNumber}</span>
      <h1 class="case-detail-title">${title}</h1>
      <time class="case-detail-date">${formatDate(item)}</time>
    </header>

    ${comment || participantMeta ? `
      <section class="case-voice" aria-labelledby="case-voice-title">
        <div class="case-voice-label">
          <span id="case-voice-title">参加者の声</span>
          <span class="case-voice-icon" aria-hidden="true"></span>
        </div>
        <div class="case-voice-content">
          ${toRichHtml(comment)}
          ${participantMeta ? `<p class="case-voice-meta">（${participantMeta}）</p>` : ''}
        </div>
      </section>
    ` : ''}

    <div class="case-detail-content">
      <section class="case-gallery" aria-label="事例の写真">
        ${renderGallery(item, title)}
      </section>
      <section class="case-facts" aria-label="事例の概要">
        ${facts || renderFactRow('概要', item.body || item.summary || 'microCMSの記事内容がここに表示されます。')}
      </section>
    </div>

    <a class="case-detail-back" href="./customize.html">事例紹介一覧へ戻る</a>
  `;
}

function renderError(message) {
  return `
    <div class="case-detail-error">
      <p>${message}</p>
      <a class="case-detail-back" href="./customize.html">事例紹介一覧へ戻る</a>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('case-detail');
  if (!container) return;

  if (isPreview) {
    const previewItem = {
      title: '事例記事の詳細レイアウト',
      comment: 'microCMSに登録された参加者の声が、この位置に読みやすく表示されます。',
      fromOrigin: '表示確認用',
      purpose: 'ご依頼の背景や、旅で実現したいことを表示します。',
      proposal: '目的に合わせて組み立てた行程や、地域とのつなぎ方を表示します。',
      onTheDay: '当日の様子や、その後につながった出来事を表示します。'
    };
    container.innerHTML = DOMPurify.sanitize(renderDetail(previewItem));
    return;
  }

  if (!contentId) {
    container.innerHTML = DOMPurify.sanitize(renderError('表示する事例が指定されていません。'));
    return;
  }

  try {
    const item = await fetchVoicesDetail(contentId, params.get('draftKey'));
    if (!item || item.isPublic === false) {
      container.innerHTML = DOMPurify.sanitize(renderError('この事例は現在表示できません。'));
      return;
    }

    container.innerHTML = DOMPurify.sanitize(renderDetail(item));
  } catch (error) {
    console.error('Error fetching voice detail:', error);
    container.innerHTML = DOMPurify.sanitize(renderError('事例を読み込めませんでした。'));
  }
});
