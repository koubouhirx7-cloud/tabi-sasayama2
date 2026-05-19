import { fetchAllNews, fetchNewsDetail } from './cms.js';

document.addEventListener('DOMContentLoaded', async () => {

  // Elements: Inputs
  const titleInput = document.getElementById('input-title');
  const dateInput = document.getElementById('input-date');
  const categoryInput = document.getElementById('input-category');
  const imageInput = document.getElementById('input-image');
  const thumbnailPreview = document.getElementById('eyecatch-thumbnail');
  const removeImgBtn = document.getElementById('btn-remove-image');
  const eyecatchText = document.getElementById('eyecatch-text');

  // Initialize Quill Editor
  const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'ここに本文を入力します...',
    modules: {
      toolbar: {
        container: [
          [{ 'header': [2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image', 'video'],
          ['clean']
        ],
        handlers: {
          image: function() {
            const quillInstance = this.quill;
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/png, image/jpeg, image/webp');
            input.click();
            input.onchange = async () => {
              const file = input.files[0];
              if (!file) return;
              try {
                const range = quillInstance.getSelection(true);
                quillInstance.insertText(range.index, '🚀 画像をアップロード中...', 'color', 'blue');
                
                const dataUrl = await compressImage(file, 1200, 0.8);
                const realUrl = await uploadMediaIfBase64(dataUrl, file.name);
                
                quillInstance.deleteText(range.index, 17);
                quillInstance.insertEmbed(range.index, 'image', realUrl);
              } catch(e) {
                alert('画像のアップロードに失敗しました: ' + e.message);
              }
            };
          }
        }
      }
    }
  });

  // Auto-recognize URLs when pasting plain text
  const Delta = Quill.import('delta');
  quill.clipboard.addMatcher(Node.TEXT_NODE, function(node, delta) {
    if (typeof node.data !== 'string') return delta;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (node.data.match(urlRegex)) {
      const newDelta = new Delta();
      let lastIndex = 0;
      node.data.replace(urlRegex, (match, p1, offset) => {
        if (offset > lastIndex) {
          newDelta.insert(node.data.substring(lastIndex, offset));
        }
        newDelta.insert(match, { link: match });
        lastIndex = offset + match.length;
      });
      if (lastIndex < node.data.length) {
        newDelta.insert(node.data.substring(lastIndex));
      }
      return newDelta;
    }
    return delta;
  });

  // Set default Quill content
  quill.clipboard.dangerouslyPasteHTML('<p>ここに本文を入力します。</p>');

  // Base64 storage for the eyecatch image data to send to API later
  let currentEyecatchDataUrl = '';

  // Elements: Preview
  const titlePreview = document.getElementById('preview-title');
  const datePreview = document.getElementById('preview-date');
  const categoryPreview = document.getElementById('preview-category');
  const imagePreview = document.getElementById('preview-cover');
  const bodyPreview = document.getElementById('preview-body');

  // Elements: Edit Mode
  const selectExisting = document.getElementById('select-existing');
  let currentEditId = null;
  let globalArticleList = [];

  // Load Existing Articles for Edit Dropdown（下書き含む・管理APIで取得）
  async function loadArticleList() {
    try {
      const res = await fetch('/api/list-news-all', { credentials: 'include' });
      if (!res.ok) throw new Error('list fetch failed');
      const data = await res.json();
      const items = data.contents || data || [];
      globalArticleList = items;
      // 既存のオプションを削除してリセット
      while (selectExisting.options.length > 1) selectExisting.remove(1);
      items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        const dateStr = item.publishedAt ? item.publishedAt.substring(0, 10).replace(/-/g, '.') : (item.createdAt ? item.createdAt.substring(0, 10).replace(/-/g, '.') : '');
        const statusText = item.publishedAt ? `[公開 ${dateStr}] ` : `[下書き ${dateStr}] `;
        option.textContent = `${statusText}${item.title}`;
        selectExisting.appendChild(option);
      });
    } catch (err) {
      // フォールバック：公開記事のみ
      try {
        const existingList = await fetchAllNews(50);
        globalArticleList = existingList;
        existingList.forEach(item => {
          const option = document.createElement('option');
          option.value = item.id;
          const dateStr = item.publishedAt ? item.publishedAt.substring(0, 10).replace(/-/g, '.') : '';
          
          let statusText = ``;
          if (item.isPublic === false) {
            statusText = `[非公開] `;
          } else if (item.isPublic === undefined || item.isPublic === null) {
            statusText = item.publishedAt ? `[旧:公開済] ` : `[旧:下書き] `;
          }
          
          if (item.draftKey) {
            option.dataset.draftkey = item.draftKey;
          }
          
          option.textContent = `${statusText}${dateStr} ${item.title}`;
          selectExisting.appendChild(option);
        });
      } catch(e) {
        console.warn('Failed to load article list', e);
      }
    }
  }
  loadArticleList();

  setTimeout(() => {
    const leftPane = document.querySelector('.admin-pane-left');
    if (leftPane) leftPane.scrollTop = 0;
    window.scrollTo(0, 0);
  }, 100);
  setTimeout(() => {
    const leftPane = document.querySelector('.admin-pane-left');
    if (leftPane) leftPane.scrollTop = 0;
  }, 500);

  // Load today's date if empty
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Utility: Image Compression
  function compressImage(file, maxSize = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = (err) => { console.error('FileReader error:', err); reject(err); };
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = (err) => { console.error('Image load error:', err); reject(new Error('画像の読み込みに失敗しました')); };
        img.onload = () => {
          try {
            let { width, height } = img;
            if (width > maxSize || height > maxSize) {
              if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; } 
              else { width = Math.round(width * maxSize / height); height = maxSize; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (canvasErr) {
            console.error('Canvas error:', canvasErr);
            reject(canvasErr);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Utility: Media Upload Proxy
  async function uploadMediaIfBase64(dataUrl, filename) {
    if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl; // return as is if empty or absolute URL
    const res = await fetch('https://tabi-sasayama2.vercel.app/api/upload-media', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: dataUrl, filename })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '画像アップロードに失敗しました');
    return json.data.url; 
  }

  // Update logic
  function updatePreview() {
    titlePreview.textContent = titleInput.value || 'タイトル未入力';
    // Format Date from YYYY-MM-DD to YYYY.MM.DD
    datePreview.textContent = dateInput.value ? dateInput.value.replace(/-/g, '.') : '';
    categoryPreview.textContent = categoryInput.value;
    imagePreview.src = currentEyecatchDataUrl;
    imagePreview.style.display = currentEyecatchDataUrl ? 'block' : 'none';
    bodyPreview.innerHTML = quill.root.innerHTML;
  }

  // Handle Visual Image Upload (Eyecatch)
  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      eyecatchText.textContent = '圧縮処理中...';
      try {
        currentEyecatchDataUrl = await compressImage(file);
        thumbnailPreview.src = currentEyecatchDataUrl;
        thumbnailPreview.style.display = 'inline-block';
        removeImgBtn.style.display = 'block';
        eyecatchText.style.display = 'none';
        updatePreview();
      } catch (err) {
        console.error('Image compression failed:', err);
        eyecatchText.textContent = 'クリックまたはドラッグ＆ドロップで画像を選択';
        alert('画像の圧縮に失敗しました。別の画像をお試しください。\n詳細: ' + err.message);
      }
    }
  });

  // Handle Image Removal
  removeImgBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // prevent file input click
    currentEyecatchDataUrl = '';
    imageInput.value = '';
    thumbnailPreview.style.display = 'none';
    removeImgBtn.style.display = 'none';
    eyecatchText.style.display = 'block';
    updatePreview();
  });

  // Attach event listeners for real-time reactivity
  [titleInput, dateInput, categoryInput].forEach(el => {
    el.addEventListener('input', updatePreview);
  });

  quill.on('text-change', () => {
    updatePreview();
  });

  // Initial render
  updatePreview();

  // Submit button mock
  const submitBtn = document.getElementById('btn-submit');
  const unpublishBtn = document.getElementById('btn-unpublish');

  if (unpublishBtn) {
    unpublishBtn.addEventListener('click', async () => {
      if (!currentEditId) return;
      if (!confirm('本当にこの記事の公開を停止して下書きに戻しますか？\n（サイト上から非表示になります）')) return;

      const originalText = unpublishBtn.textContent;
      unpublishBtn.textContent = '処理中...';
      unpublishBtn.disabled = true;

      try {
        const res = await fetch('https://tabi-sasayama2.vercel.app/api/unpublish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: 'news', id: currentEditId })
        });
        const resJson = await res.json();
        
        if (!res.ok) throw new Error(resJson.message || '通信エラー');
        
        alert('公開を停止しました。下書き状態に戻りました。');
        window.location.reload();
      } catch (err) {
        alert('管理用APIキーが未設定か、エラーが発生しました:\n' + err.message);
      } finally {
        unpublishBtn.textContent = originalText;
        unpublishBtn.disabled = false;
      }
    });
  }

  // Handle Edit Selection
  selectExisting.addEventListener('change', async (e) => {
    requestAnimationFrame(() => {
      const leftPane = document.querySelector('.admin-pane-left');
      if (leftPane) leftPane.scrollTop = 0;
    });

    const id = e.target.value;
    if (!id) {
      // Revert to Create Mode
      currentEditId = null;
      submitBtn.textContent = '記事を公開エリアへ保存';
      titleInput.value = '';
      dateInput.value = new Date().toISOString().split('T')[0];
      currentEyecatchDataUrl = '';
      thumbnailPreview.style.display = 'none';
      removeImgBtn.style.display = 'none';
      eyecatchText.style.display = 'block';
      if (isPublicCheckbox) isPublicCheckbox.checked = true;
      if (unpublishBtn) unpublishBtn.style.display = 'none';

      quill.clipboard.dangerouslyPasteHTML('<p>ここに本文を入力します。</p>');
      updatePreview();
      return;
    }

    // Set to Edit Mode
    selectExisting.disabled = true;
    try {
      const detail = globalArticleList.find(item => item.id === id);
      if (detail) {
        currentEditId = detail.id;
        submitBtn.textContent = '編集内容を上書き保存する';
        
        titleInput.value = detail.title || '';
        if (detail.publishedAt) dateInput.value = detail.publishedAt.split('T')[0];
        if (detail.category && detail.category.length > 0) categoryInput.value = detail.category[0];
        
        if (isPublicCheckbox) {
          isPublicCheckbox.checked = detail.isPublic !== false;
        }

        if (unpublishBtn) {
          unpublishBtn.style.display = detail.publishedAt ? 'block' : 'none';
        }
        
        if (detail.eyecatch && detail.eyecatch.url) {
          currentEyecatchDataUrl = detail.eyecatch.url;
          thumbnailPreview.src = currentEyecatchDataUrl;
          thumbnailPreview.style.display = 'inline-block';
          removeImgBtn.style.display = 'block';
          eyecatchText.style.display = 'none';
        } else {
          currentEyecatchDataUrl = '';
          thumbnailPreview.style.display = 'none';
          removeImgBtn.style.display = 'none';
          eyecatchText.style.display = 'block';
        }

        quill.clipboard.dangerouslyPasteHTML(detail.body || '');
        updatePreview();
      }
    } catch(err) {
      alert('記事データの取得に失敗しました');
    } finally {
      selectExisting.disabled = false;
      setTimeout(() => {
        const leftPane = document.querySelector('.admin-pane-left');
        if (leftPane) leftPane.scrollTop = 0;
      }, 50);
    }
  });

  const draftBtn = document.getElementById('btn-draft');

  async function submitArticle(isDraft) {
    const btn = isDraft ? draftBtn : submitBtn;
    const originalText = btn.textContent;
    btn.textContent = '画像をサーバーへ保存中...';
    submitBtn.disabled = true;
    if (draftBtn) draftBtn.disabled = true;

    try {
      // 1. Upload Images to MicroCMS Media API if needed
      const realEyecatchUrl = await uploadMediaIfBase64(currentEyecatchDataUrl, 'news-eyecatch.jpg');

      // 2. Prepare payload
      const data = {
        title: titleInput.value,
        category: [categoryInput.value],
        eyecatch: realEyecatchUrl,
        body: quill.root.innerHTML,
        isPublic: isPublicCheckbox ? isPublicCheckbox.checked : true,
        isDraft
      };

      // 下書きの場合は publishedAt を送らない（microCMSが拒否するため）
      if (!isDraft && dateInput.value) {
        data.publishedAt = new Date(dateInput.value).toISOString();
      }

      if (currentEditId) {
        data.id = currentEditId;
      }

      btn.textContent = 'データ保存中...';

      // 3. call Vercel Serverless Function
      // credentials:'same-origin' ensures browser forwards any stored auth context
      const endpoint = currentEditId ? '/api/update-news' : '/api/create-news';
      const method = currentEditId ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method: method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const resJson = await res.json();
      if (!res.ok) {
        const detailMessage = typeof resJson.error === 'object' ? JSON.stringify(resJson.error) : (resJson.error || '');
        throw new Error((resJson.message || '通信エラー') + (detailMessage ? '\n詳細: ' + detailMessage : ''));
      }
      
      alert(isDraft ? `下書きを保存しました！` : `記事が正常にmicroCMSへ${currentEditId ? '上書き保存' : '公開保存'}されました！`);
      console.log('Success:', resJson);

      if (isDraft) {
        // 下書き保存：フォームをリセットせずIDを設定（次回保存でPATCHに切り替わる）
        if (!currentEditId && resJson.id) {
          currentEditId = resJson.id;
          submitBtn.textContent = '編集内容を上書き保存する';
        }
        // ドロップダウンを更新
        loadArticleList();
      } else {
        // 公開保存：新規の場合のみフォームをリセット
        if (!currentEditId) {
          titleInput.value = '';
          quill.clipboard.dangerouslyPasteHTML('');
          updatePreview();
        }
        loadArticleList();
      }
      
    } catch(err) {
      alert('エラーが発生しました: ' + err.message);
      console.error(err);
    } finally {
      submitBtn.textContent = currentEditId ? '編集内容を上書き保存する' : '記事を公開エリアへ保存';
      if (draftBtn) draftBtn.textContent = '下書きとして保存する';
      submitBtn.disabled = false;
      if (draftBtn) draftBtn.disabled = false;
    }
  }

  submitBtn.addEventListener('click', () => submitArticle(false));
  if (draftBtn) draftBtn.addEventListener('click', () => submitArticle(true));

  // --- Media Modal Logic ---
  const btnOpenMedia = document.getElementById('btn-open-media');
  const btnOpenMediaQuill = document.getElementById('btn-open-media-quill');
  const mediaModal = document.getElementById('media-modal');
  const mediaModalClose = document.getElementById('media-modal-close');
  const mediaModalBody = document.getElementById('media-modal-body');

  let activeMediaTarget = null; // 'eyecatch' or 'quill'

  async function openMediaModal(target) {
    activeMediaTarget = target;
    mediaModal.style.display = 'flex';
    mediaModalBody.innerHTML = '<div class="media-loading">画像一覧を取得中...</div>';
    
    try {
      const res = await fetch('https://tabi-sasayama2.vercel.app/api/get-media', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || '取得エラー');
      
      const mediaList = json.data.media || [];
      if (mediaList.length === 0) {
        mediaModalBody.innerHTML = '<div class="media-loading">アップロードされた画像がありません。</div>';
        return;
      }
      
      const grid = document.createElement('div');
      grid.className = 'media-grid';
      mediaList.forEach(m => {
        const item = document.createElement('div');
        item.className = 'media-grid-item';
        item.innerHTML = `<img src="${m.url}?w=300&h=300&fit=crop" loading="lazy" alt="Media">`;
        item.addEventListener('click', () => {
          if (activeMediaTarget === 'eyecatch') {
            currentEyecatchDataUrl = m.url;
            thumbnailPreview.src = currentEyecatchDataUrl;
            thumbnailPreview.style.display = 'inline-block';
            removeImgBtn.style.display = 'block';
            eyecatchText.style.display = 'none';
          } else if (activeMediaTarget === 'quill') {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', m.url);
          }
          updatePreview();
          mediaModal.style.display = 'none';
        });
        grid.appendChild(item);
      });
      
      mediaModalBody.innerHTML = '';
      mediaModalBody.appendChild(grid);
    } catch (err) {
      console.error(err);
      mediaModalBody.innerHTML = `<div class="media-loading" style="color:red;">画像の読み込みに失敗しました: ${err.message}</div>`;
    }
  }

  btnOpenMedia.addEventListener('click', (e) => { e.preventDefault(); openMediaModal('eyecatch'); });
  if (btnOpenMediaQuill) btnOpenMediaQuill.addEventListener('click', (e) => { e.preventDefault(); openMediaModal('quill'); });

  mediaModalClose.addEventListener('click', () => mediaModal.style.display = 'none');
  mediaModal.addEventListener('click', (e) => {
    if (e.target === mediaModal) mediaModal.style.display = 'none';
  });

  // --- Photo Mode Logic ---
  const btnOpenPhotoMode = document.getElementById('btn-open-photo-mode');
  const photoModeModal = document.getElementById('photo-mode-modal');
  const photoModeClose = document.getElementById('photo-mode-modal-close');
  const pmUploadZone = document.getElementById('pm-upload-zone');
  const pmInputPhotos = document.getElementById('pm-input-photos');
  const pmThumbnailContainer = document.getElementById('pm-thumbnail-container');
  const pmBtnGenerate = document.getElementById('pm-btn-generate');
  const pmInputTimeline = document.getElementById('pm-input-timeline');
  const pmInputPersona = document.getElementById('pm-input-persona');
  const pmInputSystemPrompt = document.getElementById('pm-input-system-prompt');
  const pmLoading = document.getElementById('pm-loading');
  const pmOutputContainer = document.getElementById('pm-output-container');
  const pmBtnApply = document.getElementById('pm-btn-apply');

  let pmSelectedImages = [];
  let pmGeneratedTitle = '';
  let pmGeneratedHtml = '';

  // pmCompressImage is no longer needed - reuse compressImage for photo mode too

  const PERSONA_PROMPTS = {
    casual_sns: "あなたは丹波篠山が大好きな現地ライターです。読者に語りかけるような、SNSやブログにぴったりのカジュアルで親しみやすいトーンで記事を書いてください。適度に絵文字😊や感嘆符！を使用してください。",
    formal_report: "あなたは公式なイベントのレポーターです。丁寧な言葉遣い（です・ます調）で、参加したプログラムの様子や現地の魅力を客観的かつ魅力的にレポートしてください。",
    poetic_traveler: "あなたは旅情を大切にする旅行作家です。写真から読み取れる情景や空気感、時間の流れをノスタルジックで詩的な表現を用いて文章にしてください。"
  };

  // Initialize and update prompt text area
  pmInputSystemPrompt.value = PERSONA_PROMPTS[pmInputPersona.value];
  pmInputPersona.addEventListener('change', () => {
    pmInputSystemPrompt.value = PERSONA_PROMPTS[pmInputPersona.value] || PERSONA_PROMPTS.casual_sns;
  });

  btnOpenPhotoMode.addEventListener('click', (e) => {
    e.preventDefault();
    photoModeModal.style.display = 'flex';
  });
  
  photoModeClose.addEventListener('click', () => photoModeModal.style.display = 'none');
  
  // File input already covers the upload zone via CSS (position:absolute, opacity:0)
  // No extra JS click handler needed — it would conflict and cancel the first native click

  pmInputPhotos.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - pmSelectedImages.length;
    if (remaining <= 0) {
      alert('写真は最大5枚までです。不要な写真を削除してから追加してください。');
      pmInputPhotos.value = '';
      return;
    }
    const toProcess = files.slice(0, remaining);
    if (files.length > remaining) {
      alert(`あと${remaining}枚まで追加できます。最初の${remaining}枚のみ処理します。`);
    }

    for (const file of files.slice(0, remaining)) {
      try {
        const base64Data = await compressImage(file, 1000, 0.8);
        const uniqueName = file.name + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        pmSelectedImages.push({
          data: base64Data.split(',')[1],
          mimeType: 'image/jpeg',
          fileName: uniqueName
        });
        
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '60px';
        wrapper.style.height = '60px';
        wrapper.innerHTML = `
          <img src="${base64Data}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">
          <button style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; cursor:pointer; width:18px; height:18px; font-size:11px; line-height:1; padding:0;">×</button>
        `;
        const capturedName = uniqueName;
        wrapper.querySelector('button').addEventListener('click', (ev) => {
          ev.stopPropagation();
          wrapper.remove();
          pmSelectedImages = pmSelectedImages.filter(img => img.fileName !== capturedName);
        });
        pmThumbnailContainer.appendChild(wrapper);
      } catch (err) {
        console.error('Image compression failed', err);
      }
    }
    pmInputPhotos.value = '';
  });

  pmBtnGenerate.addEventListener('click', async () => {
    if (pmSelectedImages.length === 0) {
      alert('写真を最低1枚選択してください。'); return;
    }
    const timelineText = pmInputTimeline.value.trim();
    if (!timelineText) {
      alert('タイムライン情報（現場メモ）を入力してください。'); return;
    }

    pmLoading.style.display = 'flex';
    pmBtnApply.style.display = 'none';
    
    try {
      const personaId = pmInputPersona.value;
      const systemPrompt = pmInputSystemPrompt.value.trim() || PERSONA_PROMPTS[personaId];
      const personaName = pmInputPersona.options[pmInputPersona.selectedIndex].text;
      
      const apiKey = localStorage.getItem('geminiApiKey') || '';

      const response = await fetch('https://tabi-sasayama2.vercel.app/api/generate-article', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Gemini-API-Key': apiKey
        },
        body: JSON.stringify({
          images: pmSelectedImages,
          timelineText,
          personaName,
          systemPrompt,
          articleLength: document.querySelector('input[name="pm-length"]:checked')?.value || 'medium'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API Error (${response.status})`);
      }
      const data = await response.json();
      
      pmGeneratedTitle = data.title;
      let htmlBody = data.story;
      htmlBody = htmlBody.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
      if (!htmlBody.startsWith('<p>')) htmlBody = '<p>' + htmlBody + '</p>';
      
      let tagsHtml = '';
      if (data.highlights) {
        tagsHtml = data.highlights.map(tag => `<span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:12px; font-size:0.8rem; margin-right:5px;">#${tag}</span>`).join('');
      }

      pmGeneratedHtml = htmlBody;
      pmOutputContainer.innerHTML = `
        <h3 style="margin-top:0;">${data.title}</h3>
        <div style="margin-bottom:15px;">${tagsHtml}</div>
        <div style="font-size:0.95rem; line-height:1.6;">${htmlBody}</div>
      `;
      pmBtnApply.style.display = 'block';

    } catch (err) {
      alert('生成に失敗しました: ' + err.message);
    } finally {
      pmLoading.style.display = 'none';
    }
  });

  pmBtnApply.addEventListener('click', async () => {
    pmBtnApply.disabled = true;
    pmBtnApply.textContent = '画像をアップロード中...';

    try {
      // 1. 全画像をmicroCMSにアップロードしてURLを取得
      const imageUrls = [];
      for (let i = 0; i < pmSelectedImages.length; i++) {
        const img = pmSelectedImages[i];
        const dataUrl = `data:${img.mimeType};base64,${img.data}`;
        const realUrl = await uploadMediaIfBase64(dataUrl, img.fileName || `photo-${i}.jpg`);
        imageUrls.push(realUrl);
      }

      // 2. タイトルを反映
      if (pmGeneratedTitle) titleInput.value = pmGeneratedTitle;

      // 3. 1枚目をアイキャッチに設定
      if (imageUrls.length > 0) {
        currentEyecatchDataUrl = imageUrls[0];
        thumbnailPreview.src = imageUrls[0];
        thumbnailPreview.style.display = 'inline-block';
        removeImgBtn.style.display = 'block';
        eyecatchText.style.display = 'none';
      }

      // 4. タイトル＋写真を段落間に均等配置して記事を構築
      if (pmGeneratedHtml) {
        const remainingImages = imageUrls.slice(1);
        const titleHtml = pmGeneratedTitle ? `<h2><strong>${pmGeneratedTitle}</strong></h2>` : '';

        // <br> と </p> の両方で分割して山次な分割点を確保
        const rawChunks = pmGeneratedHtml
          .split(/<br\s*\/?>/gi)
          .flatMap(chunk => chunk.split('</p>'))
          .map(s => s.trim().replace(/^<p>/i, '').replace(/^\s*/, ''))
          .filter(s => s.trim());
        const paragraphs = rawChunks.map(s => '<p>' + s + '</p>');

        const result = titleHtml ? [titleHtml] : [];

        if (remainingImages.length > 0 && paragraphs.length > 1) {
          const insertInterval = Math.max(1, Math.floor(paragraphs.length / (remainingImages.length + 1)));
          let imgIdx = 0;
          paragraphs.forEach((para, i) => {
            result.push(para);
            if (imgIdx < remainingImages.length && (i + 1) % insertInterval === 0 && i < paragraphs.length - 1) {
              result.push(`<p><img src="${remainingImages[imgIdx]}" alt="写真" style="max-width:100%; height:auto; border-radius:8px; margin:16px 0;"></p>`);
              imgIdx++;
            }
          });
          while (imgIdx < remainingImages.length) {
            result.push(`<p><img src="${remainingImages[imgIdx]}" alt="写真" style="max-width:100%; height:auto; border-radius:8px; margin:16px 0;"></p>`);
            imgIdx++;
          }
        } else {
          // 段落が少ない場合は末尾にまとめて追加
          paragraphs.forEach(p => result.push(p));
          remainingImages.forEach(url => {
            result.push(`<p><img src="${url}" alt="写真" style="max-width:100%; height:auto; border-radius:8px; margin:16px 0;"></p>`);
          });
        }

        const finalHtml = result.join('\n');
        const currentHtml = quill.root.innerHTML;
        const cleanHtml = currentHtml === '<p><br></p>' || currentHtml === '<p>ここに本文を入力します。</p>' ? '' : currentHtml;
        quill.clipboard.dangerouslyPasteHTML(cleanHtml + finalHtml);
      }

      updatePreview();
      photoModeModal.style.display = 'none';
      alert(`入力フォームに反映しました！\n（写真${imageUrls.length}枚を記事内に配置しました）`);

    } catch (err) {
      alert('画像のアップロードに失敗しました: ' + err.message);
      console.error(err);
    } finally {
      pmBtnApply.disabled = false;
      pmBtnApply.textContent = '記事と画像をエディタに反映する';
    }
  });

});
