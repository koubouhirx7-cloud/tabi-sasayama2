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
    placeholder: 'ここに入力...',
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
  async  function uploadMediaIfBase64(dataUrl, filename) {
    if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl; // return as is if empty or absolute URL
    
    const base64Data = dataUrl.split(',')[1];
    return fetch('/api/upload-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64: base64Data, name: filename })
    })
    .then(r => r.json())
    .then(d => {
      if (!d.success) throw new Error(d.message || 'アップロード失敗');
      return d.url;
    });
  }

  // Utility: Add gallery image to UI with remove button
  function addGalleryImageToUI(url) {
    if (!currentGalleryDataUrls.includes(url)) {
      currentGalleryDataUrls.push(url);
    }
    
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.margin = '4px 8px 4px 0';
    
    const img = document.createElement('img');
    img.src = url;
    img.style.height = '60px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '4px';
    
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '✕';
    removeBtn.style.position = 'absolute';
    removeBtn.style.top = '-8px';
    removeBtn.style.right = '-8px';
    removeBtn.style.background = 'rgba(255,0,0,0.85)';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '50%';
    removeBtn.style.width = '20px';
    removeBtn.style.height = '20px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.fontSize = '12px';
    removeBtn.style.fontWeight = 'bold';
    removeBtn.style.display = 'flex';
    removeBtn.style.alignItems = 'center';
    removeBtn.style.justifyContent = 'center';
    removeBtn.style.padding = '0';
    removeBtn.style.zIndex = '10';
    
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const index = currentGalleryDataUrls.indexOf(url);
      if (index > -1) {
        currentGalleryDataUrls.splice(index, 1);
      }
      wrapper.remove();
      updatePreview();
    });
    
    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    els.galleryThumbnails.appendChild(wrapper);
  }

  let currentImageDataUrl = '';
  let currentGalleryDataUrls = [];

  function updatePreview() {
    try {
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
    } catch(err) {
      console.error('Preview Update Error:', err);
      // Optional: alert out to user if debugging is severely needed
      // alert('ライブプレビューの更新でエラーが発生しました: ' + err.message);
    }
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

  els.galleryInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Do NOT overwrite existing array; just append
    for (let file of files) {
      const url = await compressImage(file);
      addGalleryImageToUI(url);
      updatePreview();
    }
    els.galleryInput.value = ''; // Reset input to allow adding the same file again if deleted
  });

  // --- Initial Render ---
  updatePreview();

  // --- Edit Mode Selector ---
  const selectExisting = document.getElementById('select-existing');
  let currentEditId = null;
  const submitBtn = document.getElementById('btn-submit');
  const unpublishBtn = document.getElementById('btn-unpublish');

  if (unpublishBtn) {
    unpublishBtn.addEventListener('click', async () => {
      if (!currentEditId) return;
      if (!confirm('本当にこのプログラムの公開を停止して下書きに戻しますか？\n（サイト上から非表示になります）')) return;

      const originalText = unpublishBtn.textContent;
      unpublishBtn.textContent = '処理中...';
      unpublishBtn.disabled = true;

      try {
        const res = await fetch('/api/unpublish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: 'stay', id: currentEditId })
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

  try {
    const existingList = await fetchStay(50); // Get up to 50 existing stays
    existingList.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      const statusText = item.publishedAt ? `[体験・滞在] ` : `[体験・滞在 / 下書き] `;
      option.textContent = `${statusText}${item.title}`;
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
      if (unpublishBtn) unpublishBtn.style.display = 'none';
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
        
        if (unpublishBtn) {
          unpublishBtn.style.display = detail.publishedAt ? 'block' : 'none';
        }
        
        if (detail.heroImage && detail.heroImage.url) {
          currentImageDataUrl = detail.heroImage.url;
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
              addGalleryImageToUI(g.url);
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
  // --- Submit button ---
  const draftBtn = document.getElementById('btn-draft');

  async function submitArticle(isDraft) {
    const btn = isDraft ? draftBtn : submitBtn;
    const originalText = btn.textContent;
    btn.textContent = '画像をサーバーへ保存中...';
    submitBtn.disabled = true;
    if (draftBtn) draftBtn.disabled = true;

    try {
      // 1. Upload Media
      const realImage = await uploadMediaIfBase64(currentImageDataUrl, 'stay-main.jpg');
      
      const realGallery = [];
      for (let i = 0; i < currentGalleryDataUrls.length; i++) {
        const gUrl = await uploadMediaIfBase64(currentGalleryDataUrls[i], `gallery-${i}.jpg`);
        // microCMS expects an array of string URLs for multiple image fields
        realGallery.push(typeof gUrl === 'string' ? gUrl : gUrl.url); 
      }

      // 2. Prepare Payload
      const data = {
        title: els.title.value,
        subtitle: els.subtitle.value,
        heroImage: realImage,
        gallery: realGallery,
        infoDates: els.infoDates.value,
        infoCapacity: els.infoCapacity.value,
        infoDecision: els.infoDecision.value,
        aboutBody: editors.about.root.innerHTML,
        scheduleBody: editors.schedule.root.innerHTML,
        includesBody: editors.includes.root.innerHTML,
        infoPrice: editors.price.root.innerHTML,
        infoCancel: editors.cancel.root.innerHTML,
        isDraft
      };

      if (currentEditId) {
        data.id = currentEditId;
      }

      btn.textContent = 'データ保存中...';
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
        const detailMessage = typeof resJson.error === 'object' ? JSON.stringify(resJson.error) : (resJson.error || '');
        throw new Error((resJson.message || '通信エラー') + (detailMessage ? '\n詳細: ' + detailMessage : ''));
      }
      
      alert(isDraft ? `下書きを保存しました！` : `プログラムが正常にmicroCMSへ${currentEditId ? '上書き保存' : '公開保存'}されました！`);
      console.log('Success:', resJson);
    } catch(err) {
      alert('エラーが発生しました: ' + err.message);
      console.error(err);
    } finally {
      submitBtn.textContent = currentEditId ? '編集内容を上書き保存する' : '保存する（新規公開）';
      if (draftBtn) draftBtn.textContent = '下書きとして保存する';
      submitBtn.disabled = false;
      if (draftBtn) draftBtn.disabled = false;
    }
  }

  submitBtn.addEventListener('click', () => submitArticle(false));
  if (draftBtn) draftBtn.addEventListener('click', () => submitArticle(true));

  // --- Template UI Logic (microCMS Sync) ---
  const selectTemplate = document.getElementById('select-template');
  const btnSaveTemplate = document.getElementById('btn-save-template');
  const btnLoadTemplate = document.getElementById('btn-load-template');
  const btnDeleteTemplate = document.getElementById('btn-delete-template');
  let currentTemplates = [];

  async function getTemplates() {
    try {
      const res = await fetch('/api/get-content?endpoint=stay-templates&limit=100', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load templates');
      const json = await res.json();
      return json.contents || [];
    } catch(err) {
      console.error(err);
      return [];
    }
  }

  async function saveTemplate(template) {
    const res = await fetch('/api/manage-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
    return res.json();
  }

  async function deleteTemplate(id) {
    const res = await fetch(`/api/manage-templates?id=${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
  }

  async function renderTemplatesDropdown() {
    if (!selectTemplate) return;
    selectTemplate.innerHTML = '<option value="">読込中...</option>';
    selectTemplate.disabled = true;
    
    currentTemplates = await getTemplates();
    
    selectTemplate.innerHTML = '<option value="">▼ 呼び出すテンプレートを選択</option>';
    currentTemplates.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      selectTemplate.appendChild(opt);
    });
    selectTemplate.disabled = false;
  }

  if (btnSaveTemplate) {
    btnSaveTemplate.addEventListener('click', async () => {
      const name = prompt('現在の基本情報（日程、定員、判断、料金、キャンセル等）を\nテンプレートとして保存します。\nテンプレート名を入力してください：');
      if (!name) return;

      const template = {
        name: name,
        infoDates: els.infoDates.value,
        infoCapacity: els.infoCapacity.value,
        infoDecision: els.infoDecision.value,
        infoPrice: editors.price.root.innerHTML,
        infoCancel: editors.cancel.root.innerHTML
      };

      const originalText = btnSaveTemplate.textContent;
      btnSaveTemplate.textContent = '保存中...';
      btnSaveTemplate.disabled = true;

      try {
        await saveTemplate(template);
        alert('テンプレートをクラウドに保存しました！他のマシンからも呼び出せます。');
        await renderTemplatesDropdown();
      } catch (err) {
        alert('保存エラー: microCMS側で「滞在基本テンプレート(stay-templates)」のAPIを指示通り作成しているか確認してください。\n詳細: ' + err.message);
      } finally {
        btnSaveTemplate.textContent = originalText;
        btnSaveTemplate.disabled = false;
      }
    });
  }

  if (btnLoadTemplate) {
    btnLoadTemplate.addEventListener('click', () => {
      const selectedId = selectTemplate.value;
      if (!selectedId) {
        alert('テンプレートを選択してください');
        return;
      }
      const template = currentTemplates.find(t => t.id === selectedId);
      if (!template) return;

      if (!confirm(`「${template.name}」の内容を表示中の入力欄に上書きしますか？`)) return;

      els.infoDates.value = template.infoDates || '';
      els.infoCapacity.value = template.infoCapacity || '';
      els.infoDecision.value = template.infoDecision || '';
      editors.price.clipboard.dangerouslyPasteHTML(template.infoPrice || '');
      editors.cancel.clipboard.dangerouslyPasteHTML(template.infoCancel || '');
      updatePreview();
    });
  }

  if (btnDeleteTemplate) {
    btnDeleteTemplate.addEventListener('click', async () => {
      const selectedId = selectTemplate.value;
      if (!selectedId) {
        alert('削除するテンプレートを選択してください');
        return;
      }
      
      const template = currentTemplates.find(t => t.id === selectedId);
      if (!confirm(`テンプレート「${template?.name}」を完全に削除しますか？`)) return;
      
      const originalText = btnDeleteTemplate.textContent;
      btnDeleteTemplate.textContent = '削除中...';
      btnDeleteTemplate.disabled = true;

      try {
        await deleteTemplate(selectedId);
        alert('削除しました。');
        await renderTemplatesDropdown();
      } catch(err) {
        alert('削除エラー: ' + err.message);
      } finally {
        btnDeleteTemplate.textContent = originalText;
        btnDeleteTemplate.disabled = false;
      }
    });
  }

  // Initial render
  renderTemplatesDropdown();

  // --- Media Modal Logic ---
  const btnOpenMediaMain = document.getElementById('btn-open-media-main');
  const btnOpenMediaGallery = document.getElementById('btn-open-media-gallery');
  const btnsOpenMediaQuill = document.querySelectorAll('.btn-open-media-quill');
  const mediaModal = document.getElementById('media-modal');
  const mediaModalClose = document.getElementById('media-modal-close');
  const mediaModalBody = document.getElementById('media-modal-body');

  let activeMediaTarget = null; // 'main', 'gallery', or editor name ('about')

  async function openMediaModal(target) {
    activeMediaTarget = target;
    mediaModal.style.display = 'flex';
    mediaModalBody.innerHTML = '<div class="media-loading">画像一覧を取得中...</div>';
    
    // fetch logic is already higher above so we don't need to replace it here... wait!
    // I am doing endline 444 so let's preserve everything correctly down to btn assignments.

    
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
          if (activeMediaTarget === 'main') {
            currentImageDataUrl = m.url;
            p.thumbnail.src = currentImageDataUrl;
            p.thumbnail.style.display = 'inline-block';
            els.removeImgBtn.style.display = 'block';
            els.eyecatchText.style.display = 'none';
          } else if (activeMediaTarget === 'gallery') {
            addGalleryImageToUI(m.url);
          } else {
            // Quill editor target (about, schedule, includes, price, cancel)
            const quillEditor = editors[activeMediaTarget];
            if (quillEditor) {
              const range = quillEditor.getSelection(true);
              quillEditor.insertEmbed(range.index, 'image', m.url);
            }
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

  btnOpenMediaMain.addEventListener('click', (e) => { e.preventDefault(); openMediaModal('main'); });
  btnOpenMediaGallery.addEventListener('click', (e) => { e.preventDefault(); openMediaModal('gallery'); });
  btnsOpenMediaQuill.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openMediaModal(btn.getAttribute('data-target'));
    });
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

  const compressImage = (file, maxWidth = 1000) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = event => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = error => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  };

  const PERSONA_PROMPTS = {
    casual_sns: "あなたは丹波篠山が大好きな現地ライターです。読者に語りかけるような、SNSやブログにぴったりのカジュアルで親しみやすいトーンで記事を書いてください。適度に絵文字😊や感嘆符！を使用してください。",
    poetic_traveler: "あなたは旅情を大切にする旅行作家です。写真から読み取れる情景や空気感、時間の流れをノスタルジックで詩的な表現を用いて文章にしてください。",
    program_intro: "あなたは丹波篠山の体験・滞在プログラムの企画・案内人です。提供された写真とタイムライン（現場メモ）をもとに、参加者が「ここに行ってみたい！体験してみたい！」と感じるような、魅力的で分かりやすいプログラムの紹介文を生成してください。"
  };

  // Initialize and update prompt text area
  pmInputSystemPrompt.value = PERSONA_PROMPTS[pmInputPersona.value];
  pmInputPersona.addEventListener('change', () => {
    pmInputSystemPrompt.value = PERSONA_PROMPTS[pmInputPersona.value] || PERSONA_PROMPTS.program_intro;
  });

  btnOpenPhotoMode.addEventListener('click', (e) => {
    e.preventDefault();
    photoModeModal.style.display = 'flex';
  });
  
  photoModeClose.addEventListener('click', () => photoModeModal.style.display = 'none');
  
  pmUploadZone.addEventListener('click', () => pmInputPhotos.click());

  pmInputPhotos.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      alert('推奨枚数の上限(5枚)を超えています。最初の5枚のみ処理します。');
      files.splice(5);
    }
    pmSelectedImages = [];
    pmThumbnailContainer.innerHTML = '';

    for (const file of files) {
      try {
        const base64Data = await compressImage(file, 1000);
        pmSelectedImages.push({
          data: base64Data.split(',')[1],
          mimeType: 'image/jpeg',
          fileName: file.name
        });
        
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '60px';
        wrapper.style.height = '60px';
        wrapper.innerHTML = `
          <img src="${base64Data}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">
          <button style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; cursor:pointer;">×</button>
        `;
        wrapper.querySelector('button').addEventListener('click', (ev) => {
          ev.stopPropagation();
          wrapper.remove();
          pmSelectedImages = pmSelectedImages.filter(img => img.fileName !== file.name);
        });
        pmThumbnailContainer.appendChild(wrapper);
      } catch (err) {
        console.error('Image compression failed', err);
      }
    }
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
      const systemPrompt = pmInputSystemPrompt.value.trim() || PERSONA_PROMPTS[personaId] || PERSONA_PROMPTS.program_intro;
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

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      pmGeneratedTitle = data.title;
      pmGeneratedHtml = `<h2>${data.title}</h2>\n${data.story}`;
      
      pmOutputContainer.innerHTML = `
        <h3 style="font-size:1.1rem; margin-top:0; color:#4c1d95;">${data.title}</h3>
        <div style="font-size:0.95rem; line-height:1.6;">${data.story}</div>
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
      // Append to "About" section in Quill editor
      const currentAbout = editors.about.root.innerHTML;
      editors.about.clipboard.dangerouslyPasteHTML(currentAbout + pmGeneratedHtml);
    }
    
    // Set first image as main eyecatch image
    if (pmSelectedImages.length > 0) {
      const firstImage = pmSelectedImages[0];
      const dataUrl = `data:${firstImage.mimeType};base64,${firstImage.data}`;
      currentImageDataUrl = dataUrl;
      p.thumbnail.src = dataUrl;
      p.thumbnail.style.display = 'inline-block';
      els.removeImgBtn.style.display = 'block';
      els.eyecatchText.style.display = 'none';
    }

    updatePreview();
    photoModeModal.style.display = 'none';
    alert('入力フォームの「プログラムについて」に反映しました！');
  });

});
