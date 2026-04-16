document.addEventListener('DOMContentLoaded', () => {
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

  let currentImageDataUrl = 'https://images.unsplash.com/photo-1596422846543-74c6e271ffd6?auto=format&fit=crop&w=1200&q=80';
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
  els.imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentImageDataUrl = event.target.result;
        p.thumbnail.src = currentImageDataUrl;
        p.thumbnail.style.display = 'inline-block';
        els.removeImgBtn.style.display = 'block';
        els.eyecatchText.style.display = 'none';
        updatePreview();
      };
      reader.readAsDataURL(file);
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
  els.galleryInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Append to existing array if you want cumulative uploads, or overwrite. Let's overwrite for simplicity like eyecatch.
    currentGalleryDataUrls = [];
    els.galleryThumbnails.innerHTML = '';

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target.result;
        currentGalleryDataUrls.push(url);
        
        const img = document.createElement('img');
        img.src = url;
        img.style.height = '60px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px';
        els.galleryThumbnails.appendChild(img);
        
        updatePreview();
      };
      reader.readAsDataURL(file);
    });
  });

  updatePreview();

  // Submit button mock
  const submitBtn = document.getElementById('btn-submit');
  submitBtn.addEventListener('click', () => {
    alert('保存処理が走ります！(現在はUI確認用のデモ版です)');
  });
});
