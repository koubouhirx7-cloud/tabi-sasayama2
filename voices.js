import { fetchVoices } from './cms.js';
import DOMPurify from 'dompurify';
import { initTranslate } from './translate.js';

initTranslate();

const PAGE_SIZE = 6;
const PLACEHOLDER_CARDS = [
  {
    title: 'microCMS投稿表示枠',
    excerpt: '公開した事例の写真・日付・本文の抜粋が表示されます。'
  },
  {
    title: 'microCMS投稿表示枠',
    excerpt: '事例を公開すると、この枠へ自動的に反映されます。'
  },
  {
    title: 'microCMS投稿表示枠',
    excerpt: 'カードの大きさと並びを確認するための表示枠です。'
  },
  {
    title: 'microCMS投稿表示枠',
    excerpt: '公開した事例の写真・日付・本文の抜粋が表示されます。'
  },
  {
    title: 'microCMS投稿表示枠',
    excerpt: '事例を公開すると、この枠へ自動的に反映されます。'
  },
  {
    title: 'microCMS投稿表示枠',
    excerpt: 'カードの大きさと並びを確認するための表示枠です。'
  }
];

function stripHtml(value = '') {
  const template = document.createElement('template');
  template.innerHTML = DOMPurify.sanitize(value);
  return (template.content.textContent || '').replace(/\s+/g, ' ').trim();
}

function truncateText(value, maxLength = 74) {
  if (!value) return '';
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function formatDate(item) {
  const rawDate = item.publishedAt || item.createdAt || item.updatedAt;
  if (!rawDate) return 'Story';

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return 'Story';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}.${month}`;
}

function getTitle(item) {
  return item.title || item.stayProgram || '丹波篠山でつくる旅のストーリー';
}

function getExcerpt(item) {
  const purpose = stripHtml(item.purpose || '');
  const comment = stripHtml(item.comment || '');
  return truncateText(purpose || comment || 'ご相談から提案、当日、その後までの流れを紹介します。');
}

function getImageUrl(item) {
  if (item.image?.url) {
    const separator = item.image.url.includes('?') ? '&' : '?';
    return `${item.image.url}${separator}fm=webp&w=900&h=600&fit=crop&q=82`;
  }
  if (typeof item.image === 'string' && item.image) return item.image;
  return '';
}

function renderCard(item, index, total, page) {
  const title = getTitle(item);
  const imageUrl = getImageUrl(item);
  const dateLabel = formatDate(item);
  const absoluteIndex = page * PAGE_SIZE + index;
  const number = String(total - absoluteIndex).padStart(2, '0');
  const visual = imageUrl
    ? `
      <div class="story-card-visual">
        <span class="story-card-date">${dateLabel}</span>
        <img src="${imageUrl}" alt="${title}の様子" loading="lazy">
      </div>
    `
    : `
      <div class="story-card-visual is-empty">
        <span class="story-card-date">${dateLabel}</span>
      </div>
    `;

  const card = `
    <article class="story-card fade-in">
      ${visual}
      <div class="story-card-body">
        <h3 class="story-card-title">${title}</h3>
        <p class="story-card-excerpt">${getExcerpt(item)}</p>
        <span class="story-card-number">${number}</span>
      </div>
    </article>
  `;

  if (!item.id) return card;
  const detailUrl = `./customize-detail.html?id=${encodeURIComponent(item.id)}&no=${number}`;
  return `<a class="story-card-link" href="${detailUrl}" aria-label="${title}の詳細を読む">${card}</a>`;
}

function renderPlaceholderCard(item, index) {
  return `
    <article class="story-card is-placeholder fade-in">
      <div class="story-card-visual is-empty">
        <span class="story-card-date">準備中</span>
      </div>
      <div class="story-card-body">
        <h3 class="story-card-title">${item.title}</h3>
        <p class="story-card-excerpt">${item.excerpt}</p>
        <span class="story-card-number">${String(PLACEHOLDER_CARDS.length - index).padStart(2, '0')}</span>
      </div>
    </article>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('voices-container');
  const pagination = document.getElementById('voices-pagination');
  const status = document.getElementById('voices-status');
  const detailPreview = document.getElementById('voices-detail-preview');
  if (!container) return;

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });

  let voices = [];
  let currentPage = 0;
  let isPlaceholder = false;

  function observeCards() {
    container.querySelectorAll('.fade-in').forEach((element) => {
      element.classList.remove('is-visible');
      fadeObserver.observe(element);
    });
  }

  function renderPagination() {
    if (!pagination) return;

    const pageCount = isPlaceholder ? 1 : Math.max(1, Math.ceil(voices.length / PAGE_SIZE));
    pagination.innerHTML = DOMPurify.sanitize(
      Array.from({ length: pageCount }, (_, pageIndex) => `
        <button
          class="case-page-dot"
          type="button"
          data-page="${pageIndex}"
          aria-label="${pageIndex + 1}ページ目を表示"
          ${pageIndex === currentPage ? 'aria-current="page"' : ''}
        ></button>
      `).join('')
    );

    pagination.querySelectorAll('.case-page-dot').forEach((button) => {
      button.addEventListener('click', () => {
        const nextPage = Number(button.dataset.page);
        if (!Number.isInteger(nextPage) || nextPage === currentPage) return;
        currentPage = nextPage;
        renderCards();
      });
    });
  }

  function renderCards() {
    if (isPlaceholder) {
      container.innerHTML = DOMPurify.sanitize(PLACEHOLDER_CARDS.map(renderPlaceholderCard).join(''));
    } else {
      const pageItems = voices.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
      container.innerHTML = DOMPurify.sanitize(
        pageItems.map((voice, index) => renderCard(voice, index, voices.length, currentPage)).join('')
      );
    }

    renderPagination();
    observeCards();
  }

  try {
    const allVoices = await fetchVoices(100);
    voices = (allVoices || [])
      .filter((voice) => voice.isPublic !== false)
      .sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0));

    if (voices.length === 0) {
      isPlaceholder = true;
      if (status) {
        status.textContent = '現在公開中の事例はありません。下の6枠はmicroCMS投稿後のカード配置を確認するための表示です。';
        status.style.display = 'block';
      }
      if (detailPreview) detailPreview.style.display = 'inline-flex';
    } else {
      isPlaceholder = false;
      if (status) {
        status.textContent = '';
        status.style.display = 'none';
      }
      if (detailPreview) detailPreview.style.display = 'none';
    }

    renderCards();
  } catch (err) {
    console.error('Error fetching voices:', err);
    if (status) {
      status.textContent = '事例を読み込めませんでした。microCMSの設定または通信状況を確認してください。';
      status.style.display = 'block';
    }
    if (detailPreview) detailPreview.style.display = 'none';
    if (pagination) pagination.innerHTML = '';
    container.innerHTML = DOMPurify.sanitize(`
      <article class="story-card is-placeholder">
        <div class="story-card-visual is-empty">
          <span class="story-card-date">Error</span>
        </div>
        <div class="story-card-body">
          <h3 class="story-card-title">事例を読み込めませんでした</h3>
          <p class="story-card-excerpt">microCMSの設定または通信状況を確認してください。</p>
          <span class="story-card-number">--</span>
        </div>
      </article>
    `);
  }
});
