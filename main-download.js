import { fetchDownloads } from './cms.js';

(async function initDownloadList() {
  const container = document.getElementById('download-list-container');
  if (!container) return;

  const downloadData = await fetchDownloads(100);

  function renderDownloads() {
    container.innerHTML = '';
    
    if (!downloadData || downloadData.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.1rem; padding: 3rem 0;">現在提供中のダウンロード資料はありません。</p>';
      return;
    }

    downloadData.forEach((item, index) => {
      const delay = (index % 5) * 0.1;
      
      const title = item.title || 'カタログ';
      const description = item.description || '';
      let fileUrl = '#';
      if (item.file) {
        if (typeof item.file === 'object' && item.file.url) {
          fileUrl = item.file.url; // 従来通りファイル型の場合
        } else if (typeof item.file === 'string') {
          fileUrl = item.file; // テキストフィールドでURLを直接入れた場合
        }
      }
      
      // ボタンのテキストも必要に応じて変えられますが、Googleドライブ等を開く想定で「資料を開く」に変更
      
      const html = `
        <div class="download-card fade-in is-visible" style="animation-delay: ${delay}s">
          <div class="dl-content">
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
          <a href="${fileUrl}" class="btn-dl" target="_blank" rel="noopener noreferrer">資料をみる（ダウンロード）</a>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
    });
  }

  // 取得完了後に描画
  renderDownloads();
})();
