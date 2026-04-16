import { fetchStay, fetchStayDetail } from './cms.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Elements: Simple Inputs
  const els = {
    title: document.getElementById('input-title'),
    subtitle: document.getElementById('input-subtitle'),
    infoDates: document.getElementById('input-info-dates'),
    infoCapacity: document.getElementById('input-info-capacity'),
    infoDecision: document.getElementById('input-info-decision'),
    imageInput: document.getElementById('input-image'),
    removeImgBtn: document.getElementById('btn-remove-image'),
    eyecatchText: document.getElementById('eyecatch-text'),
    galleryInput: document.getElementById('input-gallery'),
    galleryThumbnails: document.getElementById('gallery-thumbnails')
  };

  // Elements: Previews
  const p = {
    title: document.getElementById('preview-title'),
    subtitle: document.getElementById('preview-subtitle'),
    image: document.getElementById('preview-image'),
    thumbnail: document.getElementById('preview-thumbnail'),
    infoDates: document.getElementById('preview-info-dates'),
    infoCapacity: document.getElementById('preview-info-capacity'),
    infoDecision: document.getElementById('preview-info-decision'),
    about: document.getElementById('preview-about'),
    gallery: document.getElementById('preview-gallery'),
    schedule: document.getElementById('preview-schedule'),
    includes: document.getElementById('preview-includes'),
    price: document.getElementById('preview-price'),
    cancel: document.getElementById('preview-cancel')
  };

  // Setup multiple Quill Editors
  const editorConfig = {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'clean']
      ]
    }
  };

  const editors = {
    about: new Quill('#editor-about', editorConfig),
    schedule: new Quill('#editor-schedule', editorConfig),
    includes: new Quill('#editor-includes', editorConfig),
    price: new Quill('#editor-price', editorConfig),
    cancel: new Quill('#editor-cancel', editorConfig)
  };

  // Provide some initial content
  editors.about.clipboard.dangerouslyPasteHTML('<p>丹波篠山の豊かな自然と文化に触れる体験です。</p>');
  editors.schedule.clipboard.dangerouslyPasteHTML('<ul><li>1日目：到着、オリエンテーション</li><li>2日目：農業体験</li><li>3日目：解散</li></ul>');
  editors.includes.clipboard.dangerouslyPasteHTML('<p>宿泊費、食費（朝2・夕2）、体験料</p>');
  editors.price.clipboard.dangerouslyPasteHTML('<p class="price-highlight">35,000円（税込）</p>');
  editors.cancel.clipboard.dangerouslyPasteHTML('<table class="cancel-table"><tr><td>7日前〜</td><td>30%</td></tr><tr><td>前日</td><td>50%</td></tr><tr><td>当日</td><td>100%</td></tr></table>');

  // Auto-link paste matcher for all editors
  const Delta = Quill.import('delta');
  const matcher = function(node, delta) {
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
  };

  Object.values(editors).forEach(quill => {
    quill.clipboard.addMatcher(Node.TEXT_NODE, matcher);
  });

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

  let currentImageDataUrl = '';
  let currentGalleryDataUrls = [];

  function updatePreview() {
    p.title.textContent = els.title.value || 'タイトル未入力';
    p.subtitle.textContent = els.subtitle.value;
    p.infoDates.textContent = els.infoDates.value;
    p.infoCapacity.textContent = els.infoCapacity.value;
    p.infoDecision.textContent = els.infoDecision.value;
    
    p.image.src = currentImageDataUrl;
    
    // Gallery
    if (currentGalleryDataUrls.length > 0) {
      p.gallery.style.display = 'grid'; // CSS dictates grid-template-columns
      p.gallery.innerHTML = currentGalleryDataUrls.map(url => `<img src="${url}" alt="gallery">`).join('');
    } else {
      p.gallery.style.display = 'none';
      p.gallery.innerHTML = '';
    }
    
    p.about.innerHTML = editors.about.root.innerHTML;
    p.schedule.innerHTML = editors.schedule.root.innerHTML;
    p.includes.innerHTML = editors.includes.root.innerHTML;
    p.price.innerHTML = editors.price.root.innerHTML;
    p.cancel.innerHTML = editors.cancel.root.innerHTML;
  }

  // Bind Standard Inputs
  Object.values(els).forEach(input => {
    if(input && input.type !== 'file') input.addEventListener('input', updatePreview);
  });

  // Bind Quill Editors
  Object.values(editors).forEach(quill => {
    quill.on('text-change', updatePreview);
  });

  // Image Upload
  els.imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      els.eyecatchText.textContent = '圧縮処理中...';
      currentImageDataUrl = await compressImage(file);
      p.thumbnail.src = currentImageDataUrl;
      p.thumbnail.style.display = 'inline-block';
      els.removeImgBtn.style.display = 'block';
      els.eyecatchText.style.display = 'none';
      updatePreview();
    }
  });

  // Handle Image Removal
  els.removeImgBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // prevent file input click
    currentImageDataUrl = '';
    els.imageInput.value = '';
    p.thumbnail.style.display = 'none';
    els.removeImgBtn.style.display = 'none';
    els.eyecatchText.style.display = 'block';
    updatePreview();
  });

  // Gallery Upload
  els.galleryInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Overwrite existing array
    currentGalleryDataUrls = [];
    els.galleryThumbnails.innerHTML = '';

    for (let file of files) {
      const url = await compressImage(file);
      currentGalleryDataUrls.push(url);
      
      const img = document.createElement('img');
      img.src = url;
      img.style.height = '60px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '4px';
      els.galleryThumbnails.appendChild(img);
      
      updatePreview();
    }
  });

  // --- Initial Render ---
  updatePreview();

  // --- Edit Mode Selector ---
  const selectExisting = document.getElementById('select-existing');
  let currentEditId = null;
  const submitBtn = document.getElementById('btn-submit');

  try {
    const existingList = await fetchStay(50); // Get up to 50 existing stays
    existingList.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `[体験・滞在] ${item.title}`;
      selectExisting.appendChild(option);
    });
  } catch(err) {
    console.warn('Failed to load existing stays for selector', err);
  }

  selectExisting.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (!id) {
      currentEditId = null;
      submitBtn.textContent = '保存する（新規公開）';
      // simple reset
      els.title.value = '';
      els.subtitle.value = '';
      currentImageDataUrl = '';
      p.thumbnail.style.display = 'none';
      els.removeImgBtn.style.display = 'none';
      els.eyecatchText.style.display = 'block';
      currentGalleryDataUrls = [];
      els.galleryThumbnails.innerHTML = '';
      
      updatePreview();
      return;
    }

    selectExisting.disabled = true;
    try {
      const detail = await fetchStayDetail(id);
      if (detail) {
        currentEditId = detail.id;
        submitBtn.textContent = '編集内容を上書き保存する';
        
        els.title.value = detail.title || '';
        els.subtitle.value = detail.subtitle || '';
        els.infoDates.value = detail.infoDates || '';
        els.infoCapacity.value = detail.infoCapacity || '';
        els.infoDecision.value = detail.infoDecision || '';
        
        if (detail.image && detail.image.url) {
          currentImageDataUrl = detail.image.url;
          p.thumbnail.src = currentImageDataUrl;
          p.thumbnail.style.display = 'inline-block';
          els.removeImgBtn.style.display = 'block';
          els.eyecatchText.style.display = 'none';
        } else {
          currentImageDataUrl = '';
          p.thumbnail.style.display = 'none';
          els.removeImgBtn.style.display = 'none';
          els.eyecatchText.style.display = 'block';
        }

        currentGalleryDataUrls = [];
        els.galleryThumbnails.innerHTML = '';
        if (detail.gallery && detail.gallery.length > 0) {
          detail.gallery.forEach(g => {
            if (g && g.url) {
              currentGalleryDataUrls.push(g.url);
              const img = document.createElement('img');
              img.src = g.url;
              img.style.height = '60px';
              img.style.objectFit = 'cover';
              img.style.borderRadius = '4px';
              els.galleryThumbnails.appendChild(img);
            }
          });
        }
        
        editors.about.clipboard.dangerouslyPasteHTML(detail.aboutBody || '');
        editors.schedule.clipboard.dangerouslyPasteHTML(detail.scheduleBody || '');
        editors.includes.clipboard.dangerouslyPasteHTML(detail.includesBody || '');
        editors.price.clipboard.dangerouslyPasteHTML(detail.infoPrice || '');
        editors.cancel.clipboard.dangerouslyPasteHTML(detail.infoCancel || '');
        
        updatePreview();
      }
    } catch(err) {
      alert('プログラムデータの取得に失敗しました');
    } finally {
      selectExisting.disabled = false;
    }
  });


  // --- Submit button ---
  submitBtn.addEventListener('click', async () => {
    submitBtn.textContent = '画像をサーバーへ保存中...';
    submitBtn.disabled = true;

    try {
      // 1. Upload Media
      const realImage = await uploadMediaIfBase64(currentImageDataUrl, 'stay-main.jpg');
      
      const realGallery = [];
      for (let i = 0; i < currentGalleryDataUrls.length; i++) {
        const gUrl = await uploadMediaIfBase64(currentGalleryDataUrls[i], `gallery-${i}.jpg`);
        // If data from microCMS already, it might be an object or string
        realGallery.push(typeof gUrl === 'string' ? { url: gUrl } : gUrl); 
      }

      // 2. Prepare Payload
      const data = {
        title: els.title.value,
        subtitle: els.subtitle.value,
        image: realImage,
        gallery: realGallery,
        infoDates: els.infoDates.value,
        infoCapacity: els.infoCapacity.value,
        infoDecision: els.infoDecision.value,
        aboutBody: editors.about.root.innerHTML,
        scheduleBody: editors.schedule.root.innerHTML,
        includesBody: editors.includes.root.innerHTML,
        infoPrice: editors.price.root.innerHTML,
        infoCancel: editors.cancel.root.innerHTML
      };

      if (currentEditId) {
        data.id = currentEditId;
      }

      submitBtn.textContent = 'データ保存中...';
      const endpoint = currentEditId ? '/api/update-stay' : '/api/create-stay';
      const method = currentEditId ? 'PATCH' : 'POST';

      // credentials:'same-origin' ensures browser forwards any stored auth context
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
      
      alert(`プログラムが正常にmicroCMSへ${currentEditId ? '上書き保存' : '公開保存'}されました！`);
      console.log('Success:', resJson);
    } catch(err) {
      alert('エラーが発生しました: ' + err.message);
      console.error(err);
    } finally {
      submitBtn.textContent = currentEditId ? '編集内容を上書き保存する' : '保存する（新規公開）';
      submitBtn.disabled = false;
    }
  });
});
