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
      toolbar: [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image', 'video'],
        ['clean']
      ]
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

  // Load Existing Articles for Edit Dropdown
  try {
    const existingList = await fetchAllNews(50); // Get recent 50
    existingList.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      const dateStr = item.publishedAt ? item.publishedAt.substring(0, 10).replace(/-/g, '.') : '';
      option.textContent = `[${dateStr}] ${item.title}`;
      selectExisting.appendChild(option);
    });
  } catch (err) {
    console.warn('Failed to load existing news for edit selector', err);
  }

  // Load today's date if empty
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
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
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentEyecatchDataUrl = event.target.result;
        thumbnailPreview.src = currentEyecatchDataUrl;
        thumbnailPreview.style.display = 'inline-block';
        removeImgBtn.style.display = 'block';
        eyecatchText.style.display = 'none';
        updatePreview();
      };
      reader.readAsDataURL(file);
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

  // Handle Edit Selection
  selectExisting.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (!id) {
      // Revert to Create Mode
      currentEditId = null;
      submitBtn.textContent = '記事を公開エリアへ保存';
      titleInput.value = '';
      dateInput.value = new Date().toISOString().split('T')[0];
      quill.clipboard.dangerouslyPasteHTML('<p>ここに本文を入力します。</p>');
      updatePreview();
      return;
    }

    // Set to Edit Mode
    selectExisting.disabled = true;
    try {
      const detail = await fetchNewsDetail(id);
      if (detail) {
        currentEditId = detail.id;
        submitBtn.textContent = '編集内容を上書き保存する';
        
        titleInput.value = detail.title || '';
        if (detail.publishedAt) dateInput.value = detail.publishedAt.split('T')[0];
        if (detail.category && detail.category.length > 0) categoryInput.value = detail.category[0];
        
        quill.clipboard.dangerouslyPasteHTML(detail.body || '');
        updatePreview();
      }
    } catch(err) {
      alert('記事データの取得に失敗しました');
    } finally {
      selectExisting.disabled = false;
    }
  });

  submitBtn.addEventListener('click', async () => {
    const data = {
      title: titleInput.value,
      publishedAt: new Date(dateInput.value).toISOString(),
      category: [categoryInput.value],
      eyecatch: currentEyecatchDataUrl, // In Phase 2, this will be uploaded to microCMS media first
      body: quill.root.innerHTML
    };

    if (currentEditId) {
      data.id = currentEditId;
    }

    submitBtn.textContent = '保存中...';
    submitBtn.disabled = true;

    try {
      // call Vercel Serverless Function
      // credentials:'same-origin' ensures browser forwards any stored auth context
      const endpoint = currentEditId ? '/api/update-news' : '/api/create-news';
      const method = currentEditId ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method: method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const resJson = await res.json();
      
      if (!res.ok) {
        throw new Error(resJson.message || '通信エラー');
      }
      
      alert(`記事が正常にmicroCMSへ${currentEditId ? '上書き保存' : '公開保存'}されました！\n(※現在はシステム上画像のアップロード機能は一部制限されています)`);
      console.log('Success:', resJson);
      
      // Reset form on success
      if (!currentEditId) {
        titleInput.value = '';
        quill.clipboard.dangerouslyPasteHTML('');
        updatePreview();
      }
      
    } catch(err) {
      alert('エラーが発生しました: ' + err.message);
      console.error(err);
    } finally {
      submitBtn.textContent = currentEditId ? '編集内容を上書き保存する' : '記事を公開エリアへ保存';
      submitBtn.disabled = false;
    }
  });
});
