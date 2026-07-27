import { fetchStayDetail } from './cms.js';
import DOMPurify from 'dompurify';

const previewStay = {
  title: '人生一度は里山で暮らす',
  subtitle: '自然と地域の暮らしを体験する、丹波篠山の滞在プログラム',
  aboutBody: `
    <p>丹波篠山の里山に滞在し、人との交流や、いつもの暮らしを楽しむプログラムです。</p>
    <p>地域を歩き、季節の仕事にふれ、その土地で受け継がれてきた知恵を学びます。観光だけでは見えない、里山の日常をゆっくりと体験してください。</p>
  `,
  heroImage: { url: './images/P1011277.jpg' },
  gallery: [
    { url: './images/DSC_5792.jpg' },
    { url: './images/PC032939.jpg' },
  ],
  infoDates: '通年開催（ご希望の日程を確認して調整します）',
  infoCapacity: '2〜10名程度',
  infoDecision: '開催日の14日前までにご連絡します。',
  scheduleBody: `
    <p>13:00　丹波篠山市内に集合・オリエンテーション</p>
    <p>14:00　地域散策と季節の里山体験</p>
    <p>17:00　宿へ移動・地域の方との交流</p>
    <p>翌日 10:00　振り返り後、現地解散</p>
  `,
  infoPrice: '<p>お一人様 18,000円〜</p><p>体験内容・人数・宿泊条件によりお見積もりします。</p>',
  includesBody: '<p>ガイド料、体験料、プログラム内の移動費</p>',
  infoCancel: '<p>7日前から30％、前日50％、当日100％</p>',
  infoAccess: 'JR篠山口駅または丹波篠山市内（詳細はお申し込み後にご案内します）',
};

const sanitizeHtml = (value = '') => DOMPurify.sanitize(value);
const plainText = (value = '') => String(value).replace(/<[^>]+>/g, '').trim();

function withImageParams(url, width = 900) {
  if (!url || url.startsWith('./') || url.startsWith('/')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}fm=webp&w=${width}&q=82`;
}

function normalizeImageUrl(image) {
  if (typeof image === 'string') return image;
  return image?.url || '';
}

function setRichValue(id, rowId, value, options = {}) {
  const element = document.getElementById(id);
  const row = document.getElementById(rowId);
  const safeValue = options.newlines
    ? sanitizeHtml(String(value || '').replace(/\n/g, '<br>'))
    : sanitizeHtml(value || '');

  if (!element || !row) return;
  if (!plainText(safeValue)) {
    row.hidden = true;
    element.innerHTML = '';
    return;
  }

  row.hidden = false;
  element.innerHTML = safeValue;
}

function renderGallery(data) {
  const gallery = document.getElementById('mcs-gallery');
  const dots = document.getElementById('gallery-dots');
  if (!gallery || !dots) return;

  const heroUrl = normalizeImageUrl(data.heroImage || data.image);
  const galleryUrls = Array.isArray(data.gallery)
    ? data.gallery.map(normalizeImageUrl).filter(Boolean)
    : [];
  const urls = [...new Set([heroUrl, ...galleryUrls].filter(Boolean))].slice(0, 6);

  gallery.replaceChildren();
  dots.replaceChildren();

  if (urls.length === 0) {
    gallery.hidden = true;
    dots.hidden = true;
    return;
  }

  gallery.hidden = false;
  dots.hidden = false;

  urls.forEach((url, index) => {
    const image = document.createElement('img');
    image.src = withImageParams(url, 900);
    image.alt = `${data.title || '体験・滞在プログラム'}の写真 ${index + 1}`;
    gallery.appendChild(image);

    const dot = document.createElement('span');
    dots.appendChild(dot);
  });
}

function renderStay(data, isPreview = false) {
  const title = data.title || data.stayProgram || '体験・滞在プログラム';
  const subtitle = data.subtitle || data.description || '';
  const titleElement = document.getElementById('stay-detail-title');
  const subtitleElement = document.getElementById('stay-detail-subtitle');
  const aboutElement = document.getElementById('mcs-about-body');

  titleElement.textContent = title;
  subtitleElement.textContent = plainText(subtitle);
  subtitleElement.hidden = !plainText(subtitle);

  const aboutHtml = data.aboutBody || data.body || '';
  aboutElement.innerHTML = plainText(aboutHtml)
    ? sanitizeHtml(aboutHtml)
    : '<p>プログラムの詳しい内容は準備中です。</p>';

  renderGallery(data);

  setRichValue('mcs-info-dates', 'row-dates', data.infoDates || data.date);
  setRichValue('mcs-info-capacity', 'row-capacity', data.infoCapacity || data.capacity);
  setRichValue('mcs-info-decision', 'row-decision', data.infoDecision, { newlines: true });
  setRichValue('mcs-schedule-list', 'row-schedule', data.scheduleBody || data.schedule);
  setRichValue('mcs-info-price', 'row-price', data.infoPrice || data.price);
  setRichValue('mcs-includes-body', 'row-includes', data.includesBody || data.includes);
  setRichValue('mcs-info-cancel', 'row-cancel', data.infoCancel || data.cancel);
  setRichValue(
    'mcs-info-access',
    'row-access',
    data.infoAccess || data.access || '詳細はお申し込み後にご案内します。'
  );

  const previewNote = document.getElementById('detail-preview-note');
  previewNote.classList.toggle('is-visible', isPreview);

  const applyButton = document.getElementById('mcs-apply-link');
  const customButton = document.getElementById('mcs-custom-link');
  applyButton.href = `stay-apply.html?tour=${encodeURIComponent(title)}`;
  customButton.href = `contact.html?type=customize&tour=${encodeURIComponent(title)}`;

  document.title = `${title} | 丹波篠山で田舎・農業体験`;
  const description = plainText(subtitle || aboutHtml).slice(0, 120);
  if (description) {
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }

  const ogImage = normalizeImageUrl(data.heroImage || data.image);
  if (ogImage) {
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', ogImage);
  }
}

function renderError() {
  const article = document.getElementById('stay-detail-article');
  article.innerHTML = `
    <div class="detail-error">
      <p>プログラム情報を取得できませんでした。</p>
      <p><a href="stay.html">体験・滞在プログラム一覧へ戻る</a></p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const stayId = params.get('id');
  const draftKey = params.get('draftKey');
  const isPreview = params.get('preview') === '1' || !stayId;

  if (isPreview) {
    renderStay(previewStay, true);
    return;
  }

  try {
    const data = await fetchStayDetail(stayId, draftKey);
    if (!data) {
      renderError();
      return;
    }
    renderStay(data);
  } catch (error) {
    console.error('STAYデータ表示中にエラーが発生しました', error);
    renderError();
  }
});
