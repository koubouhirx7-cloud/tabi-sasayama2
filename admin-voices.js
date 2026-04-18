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

  // Utility: Image Compression
  function compressImage(file, maxSize = 1200, quality = 0.8) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
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
      currentEyecatchDataUrl = await compressImage(file);
      thumbnailPreview.src = currentEyecatchDataUrl;
      thumbnailPreview.style.display = 'inline-block';
      removeImgBtn.style.display = 'block';
      eyecatchText.style.display = 'none';
      updatePreview();
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
});
