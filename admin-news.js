document.addEventListener('DOMContentLoaded', () => {
  // Elements: Inputs
  const titleInput = document.getElementById('input-title');
  const dateInput = document.getElementById('input-date');
  const categoryInput = document.getElementById('input-category');
  const imageInput = document.getElementById('input-image');
  const bodyInput = document.getElementById('input-body');

  // Elements: Preview
  const titlePreview = document.getElementById('preview-title');
  const datePreview = document.getElementById('preview-date');
  const categoryPreview = document.getElementById('preview-category');
  const imagePreview = document.getElementById('preview-cover');
  const bodyPreview = document.getElementById('preview-body');

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
    imagePreview.src = imageInput.value || '';
    imagePreview.style.display = imageInput.value ? 'block' : 'none';
    bodyPreview.innerHTML = bodyInput.value;
  }

  // Attach event listeners for real-time reactivity
  [titleInput, dateInput, categoryInput, imageInput, bodyInput].forEach(el => {
    el.addEventListener('input', updatePreview);
  });

  // Initial render
  updatePreview();

  // Submit button mock
  const submitBtn = document.getElementById('btn-submit');
  submitBtn.addEventListener('click', async () => {
    const data = {
      title: titleInput.value,
      publishedAt: new Date(dateInput.value).toISOString(),
      category: [categoryInput.value],
      eyecatch: { url: imageInput.value },
      body: bodyInput.value
    };

    submitBtn.textContent = '保存中...';
    submitBtn.disabled = true;

    try {
      // In Phase 2, this will hit our secure Vercel API
      // const res = await fetch('/api/create-news', { ... })
      
      console.log('Publish Data Payload:', data);
      
      // Simulate network request
      await new Promise(r => setTimeout(r, 1000));
      
      alert('記事が保存されました！（※現在はUIプレビュー版のため実際には送信されていません。Phase 2でAPI連携を行います）');
    } catch(err) {
      alert('エラーが発生しました: ' + err.message);
    } finally {
      submitBtn.textContent = '記事を公開エリアへ保存';
      submitBtn.disabled = false;
    }
  });
});
