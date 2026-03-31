import { fetchStayDetail } from './cms.js';

document.addEventListener('DOMContentLoaded', async () => {
  // URLのクエリパラメータから取得 (?id=...)
  const params = new URLSearchParams(window.location.search);
  const stayId = params.get('id');

  if (!stayId) {
    // IDがない場合は詳細ページとして機能しないため、一覧へ戻すなどの処理にするかアラートを出す
    console.warn('STAY IDが指定されていません。');
    return;
  }

  // 読み込み中の表示を適宜行う
  const titleEl = document.querySelector('.detail-title-card h1');
  const subTitleEl = document.querySelector('.detail-title-card p');
  if (titleEl) titleEl.textContent = '読み込み中...';

  try {
    const data = await fetchStayDetail(stayId);

    if (!data) {
      if (titleEl) titleEl.textContent = 'データが見つかりませんでした';
      return;
    }

    // 取得したデータを画面上の各IDへ反映
    if (titleEl) titleEl.textContent = data.title || '';
    
    // マイクロCMSのフィールド「description」をサブタイトルとして利用（設定されていない場合はsubtitle）
    if (subTitleEl) subTitleEl.textContent = data.subtitle || data.description || '';

    // メイン画像（基本は heroImage, もし無ければ image を使用）
    const heroImg = document.querySelector('.detail-header img');
    const imageUrl = data.heroImage?.url || data.image?.url;
    if (heroImg && imageUrl) {
      heroImg.src = imageUrl;
    }

    // プログラムについて (リッチエディタ。基本は aboutBody, 無ければ body を使用)
    const aboutBody = document.getElementById('mcs-about-body');
    const aboutHtml = data.aboutBody || data.body;
    if (aboutBody && aboutHtml) {
      aboutBody.innerHTML = aboutHtml;
    }

    // 行程スケジュール (リッチエディタ)
    const scheduleList = document.getElementById('mcs-schedule-list');
    if (scheduleList && data.scheduleBody) {
      scheduleList.innerHTML = data.scheduleBody;
    }

    // 料金に含まれるもの (リッチエディタ)
    const includesBody = document.getElementById('mcs-includes-body');
    if (includesBody && data.includesBody) {
      includesBody.innerHTML = data.includesBody;
    }

    // 基本情報群
    const infoDates = document.getElementById('mcs-info-dates');
    if (infoDates && data.infoDates) infoDates.innerHTML = data.infoDates; // HTML許容でセット

    const infoCapacity = document.getElementById('mcs-info-capacity');
    if (infoCapacity && data.infoCapacity) infoCapacity.innerHTML = data.infoCapacity; // HTML許容

    const infoDecision = document.getElementById('mcs-info-decision');
    if (infoDecision && data.infoDecision) infoDecision.innerHTML = data.infoDecision.replace(/\n/g, '<br>'); // テキストエリアの改行対応

    const infoPrice = document.getElementById('mcs-info-price');
    if (infoPrice && data.infoPrice) {
      infoPrice.innerHTML = data.infoPrice; // リッチエディタ
    }

    const infoCancel = document.getElementById('mcs-info-cancel');
    if (infoCancel && data.infoCancel) {
      infoCancel.innerHTML = data.infoCancel; // リッチエディタ
    }

    // ページタイトル（ブラウザのタブ名）も動的に変更する
    if (data.title) {
      document.title = `${data.title} | Stay | 一般社団法人ウイズささやま`;
      
      // 申し込み・カスタマイズ相談ボタンにお問い合わせソース（ツアー名）を付与
      const applyBtn = document.getElementById('mcs-apply-link');
      if (applyBtn) {
        applyBtn.href = `company-contact.html?type=apply&tour=${encodeURIComponent(data.title)}`;
      }
      const customBtn = document.getElementById('mcs-custom-link');
      if (customBtn) {
        customBtn.href = `company-contact.html?type=customize&tour=${encodeURIComponent(data.title)}`;
      }
    }

  } catch (error) {
    console.error('STAYデータ表示中にエラーが発生しました', error);
    if (titleEl) titleEl.textContent = 'エラーが発生しました';
  }
});
