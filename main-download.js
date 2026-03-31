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
      const fileUrl = item.file?.url ? item.file.url : '#';
      
      // ボタンのテキストも必要に応じて変えられますが、一旦固定で「PDFをダウンロード」
      // ※もしPDFがない場合はアラートか非表示にするなど工夫も可能
      
      const html = `
        <div class="download-card fade-in is-visible" style="animation-delay: ${delay}s">
          <div class="dl-content">
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
          <a href="${fileUrl}" class="btn-dl" target="_blank" rel="noopener noreferrer">PDFをダウンロード</a>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
    });
  }

  // 取得完了後に描画
  renderDownloads();
})();
