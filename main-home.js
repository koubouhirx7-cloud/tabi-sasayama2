import { fetchNews, fetchStay, fetchVoices } from './cms.js';
import { initTranslate } from './translate.js';
initTranslate();

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

  let activeBg = 1; // グローバルで保持し、リセットさせない

  function updateBackground() {
    const scrollY    = window.scrollY;
    const winHeight  = window.innerHeight;
    const midY       = scrollY + winHeight * 0.5;   // 画面の中央Y座標

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

  const headerLogo = document.getElementById('header-logo');

  function updateHeader() {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
      if (headerLogo) headerLogo.src = '/images/logo.png?v=2';
    } else {
      header.classList.remove('scrolled');
      if (headerLogo) headerLogo.src = '/images/logo-white.png?v=2';
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
     6. モバイル: 100vh を実際の vh で補正
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
  const voicesContainer = document.getElementById('voices-list');

  // 1. 体験・滞在プログラム (STAY) の取得・レンダリング
  if (stayContainer) {
    try {
      const allStays = await fetchStay(100);
      const stays = allStays ? allStays.filter(s => s.isPublic !== false).slice(0, 6) : [];
      
      if (stays && stays.length > 0) {
        stayContainer.innerHTML = '';
        stays.forEach((stay, index) => {
          const delay = (index % 3) * 0.1;
          const imgUrl = stay.heroImage?.url 
            ? stay.heroImage.url + '?fm=webp&w=800&q=80' 
            : '/images/PB182518.jpg';
          
          // スキーマ推奨のsubtitleを優先し、従来のdescriptionも安全にサポート
          const desc = stay.subtitle || stay.description || '';
          const excerpt = typeof desc === 'string' 
            ? desc.slice(0, 40) + (desc.length > 40 ? '...' : '') 
            : '';
          
          // 日程情報の判定を型安全に実行
          const datesText = typeof stay.infoDates === 'string' ? stay.infoDates : '';
          const isNenchu = datesText.includes('通年') || datesText.trim() === '';
          const typeBadge = isNenchu
            ? '<span class="card-badge card-badge--year">通年開催</span>'
            : '<span class="card-badge card-badge--limited">限定開催</span>';
          
          // 日程バッジ
          const dateBadge = datesText && !isNenchu
            ? `<span class="card-date-badge">${datesText}</span>`
            : '';
            
          const html = `
            <a href="stay-detail.html?id=${stay.id}" class="content-card fade-in is-visible" style="transition-delay:${delay}s">
              <div class="card-img-wrap">
                <img src="${imgUrl}" alt="${stay.title || ''}" />
                <div class="card-badges">
                  ${typeBadge}
                  ${dateBadge}
                </div>
              </div>
              <div class="card-body">
                <span class="card-tag-en">STAY</span>
                <h3 class="card-title">${stay.title || 'タイトル未設定'}</h3>
                <p class="card-desc">${excerpt}</p>
                <span class="card-arrow">→</span>
              </div>
            </a>
          `;
          stayContainer.insertAdjacentHTML('beforeend', html);
        });
      } else {
        stayContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 1rem; padding: 2rem 0;">提供中のプログラムはありません。</p>';
      }
    } catch (error) {
      console.error('STAYレンダリングエラー:', error);
      stayContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444; font-size: 1rem; padding: 2rem 0;">プログラム情報の読み込みに失敗しました。</p>';
    }
  }

  // 2. 最新情報 (NEWS) の取得・レンダリング
  if (newsContainer) {
    try {
      const allNews = await fetchNews(3);
      const news = allNews ? allNews.filter(n => n.isPublic !== false) : [];
      
      if (news && news.length > 0) {
        newsContainer.innerHTML = '';
        
        news.forEach((item) => {
          const rawDate = item.date || item.publishedAt;
          const dateObj = rawDate ? new Date(rawDate) : new Date();
          const y = isNaN(dateObj.getTime()) ? new Date().getFullYear() : dateObj.getFullYear();
          const m = String(isNaN(dateObj.getTime()) ? new Date().getMonth() + 1 : dateObj.getMonth() + 1).padStart(2, '0');
          const d = String(isNaN(dateObj.getTime()) ? new Date().getDate() : dateObj.getDate()).padStart(2, '0');
          
          const html = `
            <li class="news-item fade-in is-visible">
              <a href="news-detail.html?id=${item.id}">
                <time class="news-date">${y}.${m}.${d}</time>
                <span class="news-title">${item.title || 'タイトル未設定'}</span>
                <span class="news-arrow">→</span>
              </a>
            </li>
          `;
          newsContainer.insertAdjacentHTML('beforeend', html);
        });
      } else {
        newsContainer.innerHTML = '<li style="text-align:center; color:#666; padding: 1.5rem 0;">現在お知らせはありません。</li>';
      }
    } catch (error) {
      console.error('NEWSレンダリングエラー:', error);
      newsContainer.innerHTML = '<li style="text-align:center; color:#ef4444; padding: 1.5rem 0;">お知らせの読み込みに失敗しました。</li>';
    }
  }

  // 3. お客様の声 (VOICES) の取得・レンダリング
  if (voicesContainer) {
    try {
      const allVoices = await fetchVoices(5);
      const voices = allVoices ? allVoices.filter(v => v.isPublic !== false) : [];
      
      if (voices && voices.length > 0) {
        voicesContainer.innerHTML = '';
        
        voices.forEach((voice) => {
          const origin = voice.fromOrigin || '';
          const age = voice.age || '';
          const gender = voice.gender || '';
          const metaText = origin || age || gender ? `【${origin} ${age} ${gender}】` : '';
          const programName = voice.stayProgram || '体験プログラム';
          const rawComment = typeof voice.comment === 'string' ? voice.comment : '';
          const purpose = voice.purpose || '';
          const shortComment = rawComment.length > 80 ? rawComment.slice(0, 80) + '...' : rawComment;
          
          const imgHtml = voice.image?.url 
            ? `<img src="${voice.image.url}?fm=webp&w=400&h=300&fit=crop" loading="lazy" alt="お客様スナップ">` 
            : '';

          const html = `
            <a href="customize.html" class="voice-list-card fade-in is-visible">
              ${imgHtml}
              <div class="voice-list-content">
                <div class="meta">${metaText}</div>
                <h2 class="program-name">${programName}</h2>
                <div class="comment">${shortComment}</div>
                ${purpose ? `<div class="purpose"><strong>参加目的:</strong> ${purpose}</div>` : ''}
              </div>
            </a>
          `;
          voicesContainer.insertAdjacentHTML('beforeend', html);
        });
      } else {
        voicesContainer.innerHTML = '<p style="text-align: center; width: 100%; color: #666; grid-column: 1 / -1; padding: 2rem 0;">（ただいまお客様の声を準備中です）</p>';
      }
    } catch (error) {
      console.error('VOICESレンダリングエラー:', error);
      voicesContainer.innerHTML = '<p style="text-align: center; width: 100%; color: #ef4444; grid-column: 1 / -1; padding: 2rem 0;">お客様の声を読み込めませんでした。</p>';
    }
  }
})();
