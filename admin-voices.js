import { fetchVoices } from './cms.js';

document.addEventListener('DOMContentLoaded', async () => {

  // Elements: Inputs
  const ageInput = document.getElementById('input-age');
  const genderInput = document.getElementById('input-gender');
  const originInput = document.getElementById('input-origin');
  const programInput = document.getElementById('input-program');
  const purposeInput = document.getElementById('input-purpose');
  const commentInput = document.getElementById('input-comment');
  
  const imageInput = document.getElementById('input-image');
  const thumbnailPreview = document.getElementById('eyecatch-thumbnail');
  const removeImgBtn = document.getElementById('btn-remove-image');
  const eyecatchText = document.getElementById('eyecatch-text');

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
  try {
    const existingList = await fetchVoices(50);
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
    console.warn('Failed to load existing voices for edit selector', err);
  }

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
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
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
    const origin = originInput.value || '地域未設定';
    previewMeta.textContent = `【${origin} / ${age} / ${gender}】`;
    previewHeadline.textContent = programInput.value || 'プラン未設定';
    previewComment.innerHTML = (commentInput.value || 'ここに感想が表示されます。').replace(/\n/g, '<br>');
    previewPurpose.textContent = purposeInput.value || '未設定';

    previewCover.src = currentEyecatchDataUrl;
    previewCover.style.display = currentEyecatchDataUrl ? 'block' : 'none';
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
  [ageInput, genderInput, originInput, programInput, purposeInput, commentInput].forEach(el => {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
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
        alert('エラーが発生しました:\n' + err.message);
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
      commentInput.value = '';
      currentEyecatchDataUrl = '';
      thumbnailPreview.style.display = 'none';
      removeImgBtn.style.display = 'none';
      eyecatchText.style.display = 'block';
      if (unpublishBtn) unpublishBtn.style.display = 'none';
      updatePreview();
      return;
    }

    selectExisting.disabled = true;
    try {
      // NOTE: For detail, we can do a generic fetch using /api/get-content
      const res = await fetch(`/api/get-content?endpoint=voices/${id}`);
      const json = await res.json();
      const detail = json.data;

      if (detail) {
        currentEditId = detail.id;
        submitBtn.textContent = '編集内容を上書き保存する';
        
        ageInput.value = detail.age || '30代';
        genderInput.value = detail.gender || '女性';
        originInput.value = detail.fromOrigin || '';
        programInput.value = detail.stayProgram || '';
        purposeInput.value = detail.purpose || '';
        commentInput.value = detail.comment || '';
        
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
      alert('データの取得に失敗しました');
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
        comment: commentInput.value,
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
        credentials: 'same-origin',
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
        commentInput.value = '';
        currentEyecatchDataUrl = '';
        updatePreview();
      }
      
    } catch(err) {
      alert('エラーが発生しました: ' + err.message);
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
  const mediaModal = document.getElementById('media-modal');
  const mediaModalClose = document.getElementById('media-modal-close');
  const mediaModalBody = document.getElementById('media-modal-body');

  btnOpenMedia.addEventListener('click', async (e) => {
    e.preventDefault();
    mediaModal.style.display = 'flex';
    mediaModalBody.innerHTML = '<div class="media-loading">画像一覧を取得中...</div>';
    
    try {
      const res = await fetch('/api/get-media', { credentials: 'same-origin' });
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
          currentEyecatchDataUrl = m.url;
          thumbnailPreview.src = currentEyecatchDataUrl;
          thumbnailPreview.style.display = 'inline-block';
          removeImgBtn.style.display = 'block';
          eyecatchText.style.display = 'none';
          updatePreview();
          mediaModal.style.display = 'none';
        });
        grid.appendChild(item);
      });
      mediaModalBody.innerHTML = '';
      mediaModalBody.appendChild(grid);
    } catch (err) {
      mediaModalBody.innerHTML = `<div class="media-loading" style="color:red;">画像の読み込みに失敗しました: ${err.message}</div>`;
    }
  });

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



  const PERSONA_PROMPTS = {
    casual_sns: "あなたは丹波篠山が大好きな現地ライターです。読者に語りかけるような、SNSやブログにぴったりのカジュアルで親しみやすいトーンで記事を書いてください。適度に絵文字😊や感嘆符！を使用してください。",
    formal_report: "あなたは公式なイベントのレポーターです。丁寧な言葉遣い（です・ます調）で、参加したプログラムの様子や現地の魅力を客観的かつ魅力的にレポートしてください。",
    poetic_traveler: "あなたは旅情を大切にする旅行作家です。写真から読み取れる情景や空気感、時間の流れをノスタルジックで詩的な表現を用いて文章にしてください。",
    customer_voice: "あなたは体験プログラムに参加したお客様（ゲスト）です。提供された写真とメモ（アンケート回答など）をもとに、「お客様の声（体験談）」として、感動したポイントやリアルな感想を、感謝の気持ちを込めた一人称視点の文章で代筆してください。"
  };

  // Initialize and update prompt text area
  pmInputSystemPrompt.value = PERSONA_PROMPTS[pmInputPersona.value] || PERSONA_PROMPTS.customer_voice;
  pmInputPersona.addEventListener('change', () => {
    pmInputSystemPrompt.value = PERSONA_PROMPTS[pmInputPersona.value] || PERSONA_PROMPTS.customer_voice;
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
      const systemPrompt = pmInputSystemPrompt.value.trim() || PERSONA_PROMPTS[personaId] || PERSONA_PROMPTS.customer_voice;
      const personaName = pmInputPersona.options[pmInputPersona.selectedIndex].text;
      
      const apiKey = localStorage.getItem('geminiApiKey') || '';

      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Gemini-API-Key': apiKey
        },
        body: JSON.stringify({
          images: pmSelectedImages,
          timelineText,
          personaName,
          systemPrompt
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API Error (${response.status})`);
      }
      const data = await response.json();
      
      pmGeneratedTitle = data.title;
      // Extract main text without title or tags for customer voice
      let htmlBody = data.story;
      // Strip HTML if necessary for textarea, but let's just use plain text conversion
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlBody.replace(/<br>/g, '\n').replace(/<\/p><p>/g, '\n\n');
      pmGeneratedHtml = tempDiv.textContent || tempDiv.innerText || "";
      
      pmOutputContainer.innerHTML = `
        <div style="font-size:0.95rem; line-height:1.6; white-space:pre-wrap;">${pmGeneratedHtml}</div>
      `;
      pmBtnApply.style.display = 'block';

    } catch (err) {
      alert('生成に失敗しました: ' + err.message);
    } finally {
      pmLoading.style.display = 'none';
    }
  });

  pmBtnApply.addEventListener('click', () => {
    if (pmGeneratedHtml) {
      commentInput.value = pmGeneratedHtml + (commentInput.value ? '\n\n' + commentInput.value : '');
    }
    
    // Set eyecatch image to the first uploaded photo
    if (pmSelectedImages.length > 0) {
        const firstImage = pmSelectedImages[0];
        const dataUrl = `data:${firstImage.mimeType};base64,${firstImage.data}`;
        currentEyecatchDataUrl = dataUrl;
        thumbnailPreview.src = dataUrl;
        thumbnailPreview.style.display = 'inline-block';
        removeImgBtn.style.display = 'block';
        eyecatchText.style.display = 'none';
    }

    updatePreview();
    photoModeModal.style.display = 'none';
    alert('入力フォームに反映しました！');
  });

});
