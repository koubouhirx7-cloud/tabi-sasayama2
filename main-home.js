import { fetchNews, fetchStay } from './cms.js';

/**
 * main-home.js — ウイズささやま ホームページ
 * chinotabi.jp スタイルの固定背景スクロール制御
 */

(function () {
  'use strict';

  /* ────────────────────────────────────────────
     1. 固定背景パネルの切り替え
     各 .fullscreen-section の data-bg 属性値に
     対応する #bg-{n} パネルをアクティブ化する
     ──────────────────────────────────────────── */
  const bgPanels = document.querySelectorAll('.bg-panel');
  const sections = document.querySelectorAll('[data-bg]');

  function updateBackground() {
    const scrollY    = window.scrollY;
    const winHeight  = window.innerHeight;
    const midY       = scrollY + winHeight * 0.5;   // 画面の中央Y座標

    let activeBg = 1; // デフォルトは最初の背景

    sections.forEach(section => {
      const rect    = section.getBoundingClientRect();
      const top     = scrollY + rect.top;
      const bottom  = top + rect.height;

      if (midY >= top && midY < bottom) {
        activeBg = parseInt(section.dataset.bg, 10);
      }
    });

    bgPanels.forEach(panel => {
      const panelNum = parseInt(panel.id.replace('bg-', ''), 10);
      panel.classList.toggle('active', panelNum === activeBg);
    });
  }

  // 初期表示
  updateBackground();

  /* ────────────────────────────────────────────
     2. ヘッダー スクロール効果
     ──────────────────────────────────────────── */
  const header = document.getElementById('site-header');

  function updateHeader() {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  updateHeader();

  /* ────────────────────────────────────────────
     3. フェードイン IntersectionObserver
     ──────────────────────────────────────────── */
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -80px 0px', threshold: 0.1 }
  );
  fadeEls.forEach(el => fadeObserver.observe(el));

  /* ────────────────────────────────────────────
     4. ハンバーガーメニュー
     ──────────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('active');
      hamburger.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // メニュー内リンクをクリックしたら閉じる
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ────────────────────────────────────────────
     5. スクロールイベント（rAF スロットリング）
     ──────────────────────────────────────────── */
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateBackground();
        updateHeader();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ────────────────────────────────────────────
     6. 白背景セクション到達時は
        固定背景ステージを非表示にする
        （より自然な白へのトランジション）
     ──────────────────────────────────────────── */
  const bgStage      = document.querySelector('.bg-stage');
  const sectionWhite = document.querySelector('.section-white');

  if (bgStage && sectionWhite) {
    const whiteObserver = new IntersectionObserver(
      ([entry]) => {
        // 白セクションが画面の上向かいから完全に見えたら背景を隠す
        bgStage.style.opacity = entry.isIntersecting ? '0' : '1';
      },
      { threshold: 0.15 }
    );
    whiteObserver.observe(sectionWhite);
  }

  /* ────────────────────────────────────────────
     7. モバイル: 100vh を実際の vh で補正
     ──────────────────────────────────────────── */
  function setVH() {
    document.documentElement.style.setProperty(
      '--vh', `${window.innerHeight * 0.01}px`
    );
  }
  setVH();
  window.addEventListener('resize', setVH, { passive: true });

})();

// --- CMS Fetch & Render ---
(async function initCMS() {
  const stayContainer = document.getElementById('stay-container');
  const newsContainer = document.getElementById('news-container');

  if (stayContainer) {
    const stays = await fetchStay(6);
    if (stays && stays.length > 0) {
      stayContainer.innerHTML = '';
      stays.forEach((stay, index) => {
        const delay = (index % 3) * 0.1;
        const imgUrl = stay.image ? stay.image.url : '/images/PB182518.jpg';
        const excerpt = stay.description ? stay.description.substr(0, 40) + '...' : '';
        const html = `
          <a href="stay.html" class="content-card fade-in is-visible" style="transition-delay:${delay}s">
            <div class="card-img-wrap"><img src="${imgUrl}" alt="${stay.title}" /></div>
            <div class="card-body">
              <span class="card-tag-en">STAY</span>
              <h3 class="card-title">${stay.title}</h3>
              <p class="card-desc">${excerpt}</p>
              <span class="card-arrow">→</span>
            </div>
          </a>
        `;
        stayContainer.insertAdjacentHTML('beforeend', html);
      });
    }
  }

  if (newsContainer) {
    const news = await fetchNews(3);
    if (news && news.length > 0) {
      newsContainer.innerHTML = '';
      
      // --- デザイン確認用: 記事が少ない場合はダミーで複製して3つ並びを見せる ---
      const displayNews = [...news];
      if (displayNews.length > 0 && displayNews.length < 3) {
        while (displayNews.length < 3) {
          displayNews.push(displayNews[0]);
        }
      }

      displayNews.forEach((item, index) => {
        const delay = (index % 3) * 0.1;
        const dateObj = new Date(item.date || item.publishedAt);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        
        // サムネイル画像の取得（なければデフォルト画像）
        const imgUrl = item.eyecatch ? item.eyecatch.url : '/images/P6170310.jpg';
        
        // カテゴリー名の取得（なければ'NEWS'）
        const catName = (item.category && item.category.length > 0) ? item.category[0].name : 'NEWS';

        const html = `
          <a href="news-detail.html?id=${item.id}" class="content-card fade-in is-visible" style="transition-delay:${delay}s">
            <div class="card-img-wrap"><img src="${imgUrl}" alt="${item.title}" /></div>
            <div class="card-body">
              <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
                <span class="card-tag-en" style="margin-bottom: 0;">${catName}</span>
                <span style="font-size: 0.85rem; color: #888;">${y}.${m}.${d}</span>
              </div>
              <h3 class="card-title">${item.title}</h3>
              <span class="card-arrow">→</span>
            </div>
          </a>
        `;
        newsContainer.insertAdjacentHTML('beforeend', html);
      });
    }
  }
})();
