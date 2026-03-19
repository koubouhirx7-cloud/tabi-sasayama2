// Navigation scroll effect
const header = document.querySelector('.header');

// サブページ（page-headerや固定背景セクションが無いページ）は常にscrolledスタイル
const isSubPage = document.querySelector('.page-header, .lp-header, .detail-header, .article-header') !== null;
if (isSubPage && header) {
  header.classList.add('scrolled');
}

window.addEventListener('scroll', () => {
  if (isSubPage) {
    header.classList.add('scrolled');
    return;
  }
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}, { passive: true });

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if(hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

// Fade-in Intersection Observer
const observerOptions = {
  root: null,
  rootMargin: '0px 0px -100px 0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(element => {
  observer.observe(element);
});

// Parallax Effect
const parallaxElements = document.querySelectorAll('.parallax');

// Simple raf throttle
let ticking = false;

const updateParallax = () => {
  const windowHeight = window.innerHeight;

  parallaxElements.forEach(el => {
    const speed = parseFloat(el.dataset.speed) || 0.1;
    
    // For hero image (which is always at the top), simple scrollY is smoother
    if(el.classList.contains('hero-image')) {
      const yPos = window.scrollY * speed;
      el.style.transform = `translate3d(0, ${yPos}px, 0) scale(1.05)`;
      return;
    }

    // For other elements, calculate distance from center of viewport
    const rect = el.getBoundingClientRect();
    const elCenter = rect.top + rect.height / 2;
    const windowCenter = windowHeight / 2;
    
    // Calculate offset based on distance from viewport center
    const offset = (elCenter - windowCenter) * speed;
    
    el.style.transform = `translate3d(0, ${offset}px, 0)`;
  });
  
  ticking = false;
};

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(updateParallax);
    ticking = true;
  }
}, { passive: true });

// Trigger once on load
updateParallax();
