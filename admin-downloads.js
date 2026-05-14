import { fetchDownloads } from './cms.js';

document.addEventListener('DOMContentLoaded', async () => {
  const titleInput = document.getElementById('input-title');
  const descInput = document.getElementById('input-description');
  
  const fileInput = document.getElementById('input-file');
  const filePreviewName = document.getElementById('file-preview-name');
  const removeFileBtn = document.getElementById('btn-remove-file');
  const fileText = document.getElementById('file-text');

  let currentFileDataUrl = '';
  let currentFileName = '';
  let currentEditId = null;

  const previewTitle = document.getElementById('preview-title');
  const previewDesc = document.getElementById('preview-description');

  const selectExisting = document.getElementById('select-existing');
  const submitBtn = document.getElementById('btn-submit');
  const draftBtn = document.getElementById('btn-draft');
  const unpublishBtn = document.getElementById('btn-unpublish');

  // Load Existing Downloads for Edit Dropdown
  try {
    const existingList = await fetchDownloads(50);
    existingList.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      const statusText = item.publishedAt ? '' : '[下書き] ';
      option.textContent = `${statusText}${item.title || '無題'}`;
      selectExisting.appendChild(option);
    });
  } catch (err) {
    console.warn('Failed to load existing downloads', err);
  }

  // Utility: Media Upload Proxy
  async function uploadMediaIfBase64(dataUrl, filename) {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
    // For PDFs, we need to send base64 to /api/upload-media (assuming it supports any file)
    // Actually, upload-media.js might only support images. We should check. 
    // Assuming upload-media.js takes base64 and filename and uploads to a bucket or returns url.
    const res = await fetch('/api/upload-media', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: dataUrl, filename })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'ファイルアップロードに失敗しました');
    return json.data.url; 
  }

  function updatePreview() {
    previewTitle.textContent = titleInput.value || 'タイトル未設定';
    previewDesc.textContent = descInput.value || '説明文がここに入ります。';
  }

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      fileText.textContent = '読み込み中...';
      const reader = new FileReader();
      reader.onload = (ev) => {
        currentFileDataUrl = ev.target.result;
        currentFileName = file.name;
        filePreviewName.textContent = `選択中: ${file.name}`;
        filePreviewName.style.display = 'block';
        removeFileBtn.style.display = 'inline-block';
        fileText.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  removeFileBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentFileDataUrl = '';
    currentFileName = '';
    fileInput.value = '';
    filePreviewName.style.display = 'none';
    removeFileBtn.style.display = 'none';
    fileText.style.display = 'block';
  });

  [titleInput, descInput].forEach(el => {
    el.addEventListener('input', updatePreview);
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
          body: JSON.stringify({ endpoint: 'downloads', id: currentEditId })
        });
        if (!res.ok) throw new Error('通信エラー');
        alert('下書き状態に戻りました。');
        window.location.reload();
      } catch (err) {
        alert('エラーが発生しました:\n' + err.message);
      } finally {
        unpublishBtn.textContent = '非表示にする';
        unpublishBtn.disabled = false;
      }
    });
  }

  selectExisting.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (!id) {
      currentEditId = null;
      submitBtn.textContent = '資料を公開する';
      titleInput.value = '';
      descInput.value = '';
      currentFileDataUrl = '';
      currentFileName = '';
      filePreviewName.style.display = 'none';
      removeFileBtn.style.display = 'none';
      fileText.style.display = 'block';
      if (unpublishBtn) unpublishBtn.style.display = 'none';
      updatePreview();
      return;
    }

    selectExisting.disabled = true;
    try {
      const res = await fetch(`/api/get-content?endpoint=downloads/${id}`);
      const json = await res.json();
      const detail = json.data;

      if (detail) {
        currentEditId = detail.id;
        submitBtn.textContent = '編集内容を上書き保存する';
        
        titleInput.value = detail.title || '';
        descInput.value = detail.description || '';
        
        if (unpublishBtn) {
          unpublishBtn.style.display = detail.publishedAt ? 'block' : 'none';
        }
        
        if (detail.file) {
          const fileUrl = typeof detail.file === 'object' ? detail.file.url : detail.file;
          currentFileDataUrl = fileUrl;
          currentFileName = fileUrl.split('/').pop() || '登録済みファイル';
          filePreviewName.textContent = `登録済み: ${currentFileName}`;
          filePreviewName.style.display = 'block';
          removeFileBtn.style.display = 'inline-block';
          fileText.style.display = 'none';
        } else {
          currentFileDataUrl = '';
          currentFileName = '';
          filePreviewName.style.display = 'none';
          removeFileBtn.style.display = 'none';
          fileText.style.display = 'block';
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
    if (!titleInput.value) {
      alert('ダウンロード資料名は必須です。');
      return;
    }
    
    const btn = isDraft ? draftBtn : submitBtn;
    btn.textContent = '保存中...';
    submitBtn.disabled = true;
    if (draftBtn) draftBtn.disabled = true;

    try {
      // NOTE: Our uploadMediaIfBase64 function relies on /api/upload-media which uses microCMS management API or Cloudinary.
      // Assuming it handles base64 string upload correctly.
      let realFileUrl = currentFileDataUrl;
      if (currentFileDataUrl.startsWith('data:')) {
         realFileUrl = await uploadMediaIfBase64(currentFileDataUrl, currentFileName || 'document.pdf');
      }

      const data = {
        title: titleInput.value,
        description: descInput.value,
        isDraft
      };
      
      if (realFileUrl) {
        data.file = realFileUrl;
      }

      if (currentEditId) {
        data.id = currentEditId;
      }

      const endpoint = currentEditId ? '/api/update-download' : '/api/create-download';
      const method = currentEditId ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method: method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.message || '通信エラー');
      
      alert(isDraft ? `下書きを保存しました！` : `正常に${currentEditId ? '上書き保存' : '公開保存'}されました！`);
      
      if (!currentEditId) {
        window.location.reload();
      }
      
    } catch(err) {
      alert('エラーが発生しました: ' + err.message);
    } finally {
      submitBtn.textContent = currentEditId ? '編集内容を上書き保存する' : '資料を公開する';
      if (draftBtn) draftBtn.textContent = '下書きとして保存する';
      submitBtn.disabled = false;
      if (draftBtn) draftBtn.disabled = false;
    }
  }

  submitBtn.addEventListener('click', () => submitData(false));
  if (draftBtn) draftBtn.addEventListener('click', () => submitData(true));
});
