import { fetchVoices, fetchVoicesDetail } from './cms.js';
import { handleError, notifyDiscord } from './admin-error.js';

document.addEventListener('DOMContentLoaded', async () => {

  // Elements: Inputs
  const ageInput = document.getElementById('input-age');
  const genderInput = document.getElementById('input-gender');
  const originInput = document.getElementById('input-origin');
  const programInput = document.getElementById('input-program');
  const purposeInput = document.getElementById('input-purpose');

  const imageInput = document.getElementById('input-image');
  const thumbnailPreview = document.getElementById('eyecatch-thumbnail');
  const removeImgBtn = document.getElementById('btn-remove-image');
  const eyecatchText = document.getElementById('eyecatch-text');

  // Initialize Quill Editor
  const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'ここに紹介文や感想を入力します...',
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

  let currentEyecatchDataUrl = '';
  let currentEditId = null;

  // Elements: Preview
  const previewMeta = document.getElementById('preview-meta');
  const previewHeadline = document.getElementById('preview-headline');
  const previewCover = document.getElementById('preview-cover');
  const previewComment = document.getElementById('preview-comment');
  const previewPurpose = document.getElementById('preview-purpose');

  // Elements: Edit Mode
  const selectExisting = document.getElementById('select-existing');
  const submitBtn = document.getElementById('btn-submit');
  const draftBtn = document.getElementById('btn-draft');
  const unpublishBtn = document.getElementById('btn-unpublish');

  // Load Existing Voices for Edit Dropdown
  async function loadArticleList() {
    try {
      const existingList = await fetchVoices(100);
      while (selectExisting.options.length > 1) selectExisting.remove(1);
      existingList.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        const statusText = item.publishedAt ? '' : '[下書き] ';
        const prog = item.stayProgram || '不明プラン';
        const name = `${item.fromOrigin || ''} ${item.age || ''} ${item.gender || ''}`;
        option.textContent = `${statusText}${name}様 (${prog})`;
        selectExisting.appendChild(option);
      });
    } catch (err) {
      notifyDiscord('お客様の声リスト読み込みエラー', err?.message || String(err), 'warn');
    }
  }

  loadArticleList();

  // Reset scroll after async init completes
  requestAnimationFrame(() => {
    const leftPane = document.querySelector('.admin-pane-left');
    if (leftPane) leftPane.scrollTop = 0;
  });

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
    if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
    const res = await fetch('/api/upload-media', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: dataUrl, filename })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '画像アップロードに失敗しました');
    return json.data.url;
  }

  // Update logic
  function updatePreview() {
    const age = ageInput.value || '';
    const gender = genderInput.value || '';
    const origin = originInput.value || '';

    const metaText = [origin ? origin + '在住' : '', age, gender].filter(Boolean).join('・');
    previewMeta.textContent = metaText ? `【${metaText}】` : '';

    previewHeadline.textContent = programInput.value || 'プラン未設定';

    const quillHtml = quill.root.innerHTML;
    if (quillHtml === '<p><br></p>' || !quillHtml) {
      previewComment.innerHTML = 'ここに感想が表示されます。';
    } else {
      previewComment.innerHTML = quillHtml;
    }

    previewPurpose.innerHTML = (purposeInput.value || '未設定').replace(/\n/g, '<br>');

    previewCover.src = currentEyecatchDataUrl;
    const coverWrapper = document.getElementById('preview-cover-wrapper');
    if (coverWrapper) {
      coverWrapper.style.display = currentEyecatchDataUrl ? 'block' : 'none';
    }
  }

  // Handle Visual Image Upload
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
        eyecatchText.textContent = '画像を選択するかドロップ';
        alert('画像の圧縮に失敗しました。別の画像をお試しください。\n詳細: ' + err.message);
      }
    }
  });

  // Handle Image Removal
  removeImgBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    currentEyecatchDataUrl = '';
    imageInput.value = '';
    thumbnailPreview.style.display = 'none';
    removeImgBtn.style.display = 'none';
    eyecatchText.style.display = 'block';
    updatePreview();
  });

  // Attach event listeners for real-time reactivity
  [ageInput, genderInput, originInput, programInput, purposeInput].forEach(el => {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
  });

  quill.on('text-change', () => {
    updatePreview();
  });

  updatePreview();

  // Handle unpublish
  if (unpublishBtn) {
    unpublishBtn.addEventListener('click', async () => {
      if (!currentEditId) return;
      if (!confirm('本当に公開を停止して下書きに戻しますか？')) return;
      unpublishBtn.textContent = '処理中...';
      unpublishBtn.disabled = true;
      try {
        const res = await fetch('/api/unpublish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: 'voices', id: currentEditId })
        });
        if (!res.ok) throw new Error('通信エラー');
        alert('下書き状態に戻りました。');
        window.location.reload();
      } catch (err) {
        handleError('公開停止エラー', err);
      } finally {
        unpublishBtn.textContent = '非表示にする（下書きに戻す）';
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
      currentEditId = null;
      submitBtn.textContent = 'お客様の声を公開する';
      ageInput.value = '30代';
      genderInput.value = '女性';
      originInput.value = '';
      programInput.value = '';
      purposeInput.value = '';
      quill.clipboard.dangerouslyPasteHTML('');
      currentEyecatchDataUrl = '';
      thumbnailPreview.style.display = 'none';
      removeImgBtn.style.display = 'none';
      eyecatchText.style.display = 'block';
      const isPublicCheckbox = document.getElementById('input-isPublic');
      if (isPublicCheckbox) isPublicCheckbox.checked = true;
      if (unpublishBtn) unpublishBtn.style.display = 'none';
      const dangerZone = document.getElementById('danger-zone');
      if (dangerZone) dangerZone.style.display = 'none';
      updatePreview();
      return;
    }

    selectExisting.disabled = true;
    try {
      const detail = await fetchVoicesDetail(id);
      if (detail) {
        currentEditId = detail.id;
        submitBtn.textContent = '編集内容を上書き保存する';

        const dangerZone = document.getElementById('danger-zone');
        if (dangerZone) dangerZone.style.display = 'block';

        ageInput.value = detail.age || '30代';
        genderInput.value = detail.gender || '女性';
        originInput.value = detail.fromOrigin || '';
        programInput.value = detail.stayProgram || '';
        purposeInput.value = detail.purpose || '';
        quill.clipboard.dangerouslyPasteHTML(detail.comment || '');

        const isPublicCheckbox = document.getElementById('input-isPublic');
        if (isPublicCheckbox) {
          isPublicCheckbox.checked = detail.isPublic !== false;
        }

        if (unpublishBtn) {
          unpublishBtn.style.display = detail.publishedAt ? 'block' : 'none';
        }

        if (detail.image && detail.image.url) {
          currentEyecatchDataUrl = detail.image.url;
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
        updatePreview();
      }
    } catch(err) {
      handleError('データ取得エラー', err);
    } finally {
      selectExisting.disabled = false;
    }
  });

  async function submitData(isDraft) {
    const btn = isDraft ? draftBtn : submitBtn;
    const originalText = btn.textContent;
    btn.textContent = '保存中...';
    submitBtn.disabled = true;
    if (draftBtn) draftBtn.disabled = true;

    try {
      const realImageUrl = await uploadMediaIfBase64(currentEyecatchDataUrl, 'voice-gallery.jpg');

      const data = {
        age: ageInput.value,
        gender: genderInput.value,
        stayProgram: programInput.value,
        fromOrigin: originInput.value,
        purpose: purposeInput.value,
        comment: quill.root.innerHTML,
        isPublic: document.getElementById('input-isPublic') ? document.getElementById('input-isPublic').checked : true,
        isDraft
      };

      if (realImageUrl) {
        data.image = realImageUrl;
      }

      if (currentEditId) {
        data.id = currentEditId;
      }

      const endpoint = currentEditId ? '/api/update-voice' : '/api/create-voice';
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

      alert(isDraft ? `下書きを保存しました！` : `正常に${currentEditId ? '上書き保存' : '公開保存'}されました！`);

      if (!currentEditId) {
        originInput.value = '';
        programInput.value = '';
        purposeInput.value = '';
        quill.clipboard.dangerouslyPasteHTML('');
        currentEyecatchDataUrl = '';
        updatePreview();
      }

    } catch(err) {
      handleError('保存エラー', err);
    } finally {
      submitBtn.textContent = currentEditId ? '編集内容を上書き保存する' : 'お客様の声を公開する';
      if (draftBtn) draftBtn.textContent = '下書きとして保存する';
      submitBtn.disabled = false;
      if (draftBtn) draftBtn.disabled = false;
    }
  }

  submitBtn.addEventListener('click', () => submitData(false));
  if (draftBtn) draftBtn.addEventListener('click', () => submitData(true));

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
      const res = await fetch('/api/get-media', { credentials: 'include' });
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
      notifyDiscord('メディア読み込みエラー', err?.message || String(err));
      mediaModalBody.innerHTML = `<div class="media-loading" style="color:red;">画像の読み込みに失敗しました: ${err.message}</div>`;
    }
  }

  btnOpenMedia.addEventListener('click', (e) => { e.preventDefault(); openMediaModal('eyecatch'); });
  if (btnOpenMediaQuill) {
    btnOpenMediaQuill.addEventListener('click', (e) => { e.preventDefault(); openMediaModal('quill'); });
  }

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
  let pmGeneratedHighlights = [];

  const PERSONA_PROMPTS = {
    tour_report: "あなたは丹波篠山の魅力を伝えるプロの旅行プランナー・現地案内人です。提供された写真とタイムライン・メモをもとに、オーダーメイドツアー（カスタムメイド）の実施レポートとして、どのようなご要望に対してどのような特別な体験を提供し、お客様にどれほど満足いただけたかを、見出し(H2, H3等)と段落を用いた構成に沿って、詳しく伝える魅力的なレポート記事を書いてください。",
    customer_voice: "あなたは体験プログラムに参加したお客様（ゲスト）です。提供された写真とメモ（アンケート回答など）をもとに、「お客様の声（体験談）」として、感動したポイントやリアルな感想を、感謝の気持ちを込めた一人称視点の文章で代筆してください。",
    casual_sns: "あなたは丹波篠山が大好きな現地ライターです。読者に語りかけるような、SNSやブログにぴったりのカジュアルで親しみやすいトーンで記事を書いてください。適度に絵文字😊や感嘆符！を使用してください。"
  };

  // Initialize and update prompt text area
  pmInputSystemPrompt.value = PERSONA_PROMPTS[pmInputPersona.value] || PERSONA_PROMPTS.tour_report;
  pmInputPersona.addEventListener('change', () => {
    pmInputSystemPrompt.value = PERSONA_PROMPTS[pmInputPersona.value] || PERSONA_PROMPTS.tour_report;
  });

  btnOpenPhotoMode.addEventListener('click', (e) => {
    e.preventDefault();
    photoModeModal.style.display = 'flex';
  });

  photoModeClose.addEventListener('click', () => photoModeModal.style.display = 'none');

  // File input already covers the upload zone via CSS (position:absolute, opacity:0)

  pmInputPhotos.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - pmSelectedImages.length;
    if (remaining <= 0) {
      alert('写真は最大5枚までです。不要な写真を削除してから追加してください。');
      pmInputPhotos.value = '';
      return;
    }
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
      alert('メモを入力してください。'); return;
    }

    pmLoading.style.display = 'flex';
    pmBtnApply.style.display = 'none';

    try {
      const personaId = pmInputPersona.value;
      const personaName = pmInputPersona.options[pmInputPersona.selectedIndex].text;

      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: pmSelectedImages,
          timelineText,
          personaId,
          personaName,
          articleLength: document.querySelector('input[name="pm-length"]:checked')?.value || 'medium'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API Error (${response.status})`);
      }
      const data = await response.json();

      pmGeneratedTitle = data.title;
      pmGeneratedHighlights = data.highlights || [];
      pmGeneratedHtml = data.story;

      let tagsHtml = '';
      if (data.highlights) {
        tagsHtml = data.highlights.map(tag => `<span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:12px; font-size:0.8rem; margin-right:5px;">#${tag}</span>`).join('');
      }

      pmOutputContainer.innerHTML = `
        <h3 style="margin-top:0;">${data.title || ''}</h3>
        <div style="margin-bottom:15px;">${tagsHtml}</div>
        <div style="font-size:0.95rem; line-height:1.6;">${pmGeneratedHtml}</div>
      `;
      pmBtnApply.style.display = 'block';

    } catch (err) {
      handleError('AI記事生成エラー', err);
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
      if (pmGeneratedTitle) programInput.value = pmGeneratedTitle;

      // 3. 1枚目をアイキャッチに設定
      if (imageUrls.length > 0) {
        currentEyecatchDataUrl = imageUrls[0];
        thumbnailPreview.src = imageUrls[0];
        thumbnailPreview.style.display = 'inline-block';
        removeImgBtn.style.display = 'block';
        eyecatchText.style.display = 'none';
      }

      // 4. タイトル＋ハイライト＋写真を段落間に配置して記事を構築
      if (pmGeneratedHtml) {
        const remainingImages = imageUrls.slice(1);
        const titleHtml = pmGeneratedTitle ? `<h2><strong>${pmGeneratedTitle}</strong></h2>` : '';

        // Highlights
        let highlightsHtml = '';
        if (pmGeneratedHighlights && pmGeneratedHighlights.length > 0) {
          highlightsHtml = `<h3>✨ 今回の体験のハイライト</h3><ul>` +
            pmGeneratedHighlights.map(h => `<li>${h}</li>`).join('') +
            `</ul>`;
        }

        // Split paragraphs
        const rawChunks = pmGeneratedHtml
          .split(/<br\s*\/?>/gi)
          .flatMap(chunk => chunk.split('</p>'))
          .map(s => s.trim().replace(/^<p>/i, '').replace(/^\s*/, ''))
          .filter(s => s.trim());
        const paragraphs = rawChunks.map(s => '<p>' + s + '</p>');

        const result = [];
        if (titleHtml) result.push(titleHtml);
        if (highlightsHtml) result.push(highlightsHtml);

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
          paragraphs.forEach(p => result.push(p));
          remainingImages.forEach(url => {
            result.push(`<p><img src="${url}" alt="写真" style="max-width:100%; height:auto; border-radius:8px; margin:16px 0;"></p>`);
          });
        }

        const finalHtml = result.join('\n');
        const currentHtml = quill.root.innerHTML;
        const cleanHtml = currentHtml === '<p><br></p>' || currentHtml === '<p>ここに紹介文や感想を入力します...</p>' ? '' : currentHtml;
        quill.clipboard.dangerouslyPasteHTML(cleanHtml + finalHtml);
      }

      updatePreview();
      photoModeModal.style.display = 'none';
      alert(`入力フォームに反映しました！\n（写真${imageUrls.length}枚を記事内に配置しました）`);

    } catch (err) {
      handleError('画像アップロードエラー', err);
    } finally {
      pmBtnApply.disabled = false;
      pmBtnApply.textContent = 'この内容を入稿画面に反映する';
    }
  });

  // --- Delete Content Logic ---
  const btnOpenDeleteModal = document.getElementById('btn-open-delete-modal');
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');
  const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  const inputDeleteConfirm = document.getElementById('input-delete-confirm');
  const deleteTargetTitle = document.getElementById('delete-target-title');

  if (btnOpenDeleteModal) {
    btnOpenDeleteModal.addEventListener('click', (e) => {
      e.preventDefault();
      if (!currentEditId) return;
      const voiceName = `${originInput.value || ''} ${ageInput.value || ''} ${genderInput.value || ''}`;
      const progName = programInput.value || '不明';
      deleteTargetTitle.textContent = `${voiceName.trim() || '無題'}様 (${progName})`;
      inputDeleteConfirm.value = '';
      btnConfirmDelete.disabled = true;
      btnConfirmDelete.style.cursor = 'not-allowed';
      btnConfirmDelete.style.opacity = '0.5';
      deleteConfirmModal.style.display = 'flex';
    });
  }

  const closeDeleteModal = () => {
    deleteConfirmModal.style.display = 'none';
  };

  if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
  if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);
  deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) closeDeleteModal();
  });

  if (inputDeleteConfirm) {
    inputDeleteConfirm.addEventListener('input', (e) => {
      if (e.target.value.trim() === '削除') {
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.style.cursor = 'pointer';
        btnConfirmDelete.style.opacity = '1';
      } else {
        btnConfirmDelete.disabled = true;
        btnConfirmDelete.style.cursor = 'not-allowed';
        btnConfirmDelete.style.opacity = '0.5';
      }
    });
  }

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
      if (!currentEditId) return;
      if (inputDeleteConfirm.value.trim() !== '削除') return;

      const originalText = btnConfirmDelete.textContent;
      btnConfirmDelete.textContent = '削除中...';
      btnConfirmDelete.disabled = true;

      try {
        const res = await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: 'voices', id: currentEditId })
        });
        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.message || '通信エラー');

        alert('事例を完全に削除しました。');
        deleteConfirmModal.style.display = 'none';

        // 編集モードを抜けて新規作成に戻す
        selectExisting.value = '';
        selectExisting.dispatchEvent(new Event('change'));

        // リストを再読込
        loadArticleList();
      } catch (err) {
        handleError('削除エラー', err);
      } finally {
        btnConfirmDelete.textContent = originalText;
        btnConfirmDelete.disabled = false;
      }
    });
  }

});
