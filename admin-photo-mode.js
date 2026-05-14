let selectedImages = [];

document.addEventListener('DOMContentLoaded', () => {
  const photoInput = document.getElementById('input-photos');
  const uploadZone = document.getElementById('photo-upload-zone');
  const thumbnailContainer = document.getElementById('thumbnail-container');
  const generateBtn = document.getElementById('btn-generate');
  const copyHtmlBtn = document.getElementById('btn-copy-html');
  
  // Elements
  const timelineInput = document.getElementById('input-timeline');
  const personaSelect = document.getElementById('input-persona');
  
  const generatedContainer = document.getElementById('generated-container');
  const loadingOverlay = document.getElementById('loading-overlay');
  const initialState = document.getElementById('initial-state');
  
  const outputTitle = document.getElementById('output-title');
  const outputHighlights = document.getElementById('output-highlights');
  const outputBody = document.getElementById('output-body');
  
  // Persona System Prompts
  const PERSONA_PROMPTS = {
    casual_sns: "あなたは丹波篠山が大好きな現地ライターです。読者に語りかけるような、SNSやブログにぴったりのカジュアルで親しみやすいトーンで記事を書いてください。適度に絵文字😊や感嘆符！を使用してください。",
    formal_report: "あなたは公式なイベントのレポーターです。丁寧な言葉遣い（です・ます調）で、参加したプログラムの様子や現地の魅力を客観的かつ魅力的にレポートしてください。",
    poetic_traveler: "あなたは旅情を大切にする旅行作家です。写真から読み取れる情景や空気感、時間の流れをノスタルジックで詩的な表現を用いて文章にしてください。"
  };

  // Image handling
  uploadZone.addEventListener('click', () => photoInput.click());
  
  photoInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    
    // limit to 5
    if (files.length > 5) {
      alert('推奨枚数の上限(5枚)を超えています。処理が重くなるため、最初の5枚のみ処理します。');
      files.splice(5);
    }

    selectedImages = [];
    thumbnailContainer.innerHTML = '';

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        
        selectedImages.push({
          data: base64Data.split(',')[1], // remove data:image/jpeg;base64,
          mimeType: file.type,
          fileName: file.name
        });
        
        const wrapper = document.createElement('div');
        wrapper.className = 'thumbnail-wrapper';
        wrapper.innerHTML = `
          <img src="${base64Data}" alt="thumbnail">
          <button class="thumbnail-remove" title="削除">×</button>
        `;
        
        wrapper.querySelector('.thumbnail-remove').addEventListener('click', (ev) => {
          ev.stopPropagation();
          wrapper.remove();
          selectedImages = selectedImages.filter(img => img.fileName !== file.name);
        });
        
        thumbnailContainer.appendChild(wrapper);
      };
      reader.readAsDataURL(file);
    }
  });

  // Generate Button
  generateBtn.addEventListener('click', async () => {
    if (selectedImages.length === 0) {
      alert('少なくとも1枚の写真を選択してください。');
      return;
    }
    
    const timelineText = timelineInput.value.trim();
    if (!timelineText) {
      alert('タイムライン情報（現場メモ）を入力してください。');
      return;
    }

    const personaId = personaSelect.value;
    const personaName = personaSelect.options[personaSelect.selectedIndex].text;
    const systemPrompt = PERSONA_PROMPTS[personaId];

    // UI Updates
    initialState.style.display = 'none';
    generatedContainer.style.display = 'block';
    loadingOverlay.style.display = 'flex';
    copyHtmlBtn.style.display = 'none';
    document.getElementById('copy-hint').style.display = 'none';

    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: selectedImages,
          timelineText,
          personaName,
          systemPrompt
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'API Error');
      }

      const data = await response.json();
      
      // Update UI with generated data
      outputTitle.textContent = data.title;
      
      outputHighlights.innerHTML = '';
      if (data.highlights && Array.isArray(data.highlights)) {
        data.highlights.forEach(tag => {
          const span = document.createElement('span');
          span.className = 'highlight-tag';
          span.textContent = '#' + tag;
          outputHighlights.appendChild(span);
        });
      }
      
      // Simple format converting markdown or \n to HTML
      let htmlBody = data.story;
      // if it has paragraphs already as text
      htmlBody = htmlBody.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
      if (!htmlBody.startsWith('<p>')) {
        htmlBody = '<p>' + htmlBody + '</p>';
      }
      
      outputBody.innerHTML = htmlBody;
      
      // Store raw HTML for copying
      window.__generatedHtml = `<h2>${data.title}</h2>\n${htmlBody}`;
      
      copyHtmlBtn.style.display = 'block';
      document.getElementById('copy-hint').style.display = 'block';
      
    } catch (error) {
      console.error(error);
      alert('記事生成中にエラーが発生しました: ' + error.message);
      generatedContainer.style.display = 'none';
      initialState.style.display = 'block';
    } finally {
      loadingOverlay.style.display = 'none';
    }
  });

  // Copy HTML
  copyHtmlBtn.addEventListener('click', () => {
    if (window.__generatedHtml) {
      navigator.clipboard.writeText(window.__generatedHtml)
        .then(() => alert('HTMLをクリップボードにコピーしました！お知らせ入稿画面の本文に貼り付けてください。'))
        .catch(err => alert('コピーに失敗しました。'));
    }
  });

});
