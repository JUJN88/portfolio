/* ============================================================
   祝光军作品集网站 · 交互脚本 v2
   ============================================================ */

'use strict';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   1. 导航栏：滚动变背景 + 当前区段高亮 + 向下隐藏
   ============================================================ */
(function initNav() {
  const nav = $('#nav');
  const links = $$('.nav-links a');
  const sections = $$('section[id]');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 50);
    // 向下滚动超过200px后隐藏，向上时显示
    nav.style.transform = (scrollY > lastScroll && scrollY > 200)
      ? 'translateY(-100%)' : '';
    lastScroll = scrollY;
    // 高亮当前区段
    let current = '';
    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop - 100) current = sec.id;
    });
    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }, { passive: true });

  // 移动端汉堡菜单
  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  menuBtn.addEventListener('click', () => {
    const isOpen = navLinks.dataset.open === '1';
    if (isOpen) {
      navLinks.style.cssText = '';
      navLinks.dataset.open = '0';
    } else {
      navLinks.style.cssText = `
        display:flex;flex-direction:column;
        position:fixed;top:${nav.offsetHeight}px;left:0;right:0;
        background:rgba(9,9,15,0.98);padding:24px 28px;gap:22px;
        border-bottom:1px solid rgba(255,255,255,0.08);z-index:999;
      `;
      navLinks.dataset.open = '1';
    }
  });
  // 点击链接后关闭菜单
  links.forEach(a => {
    a.addEventListener('click', () => {
      navLinks.style.cssText = '';
      navLinks.dataset.open = '0';
    });
  });
})();

/* ============================================================
   2. Intersection Observer：元素入屏动效
   ============================================================ */
(function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  $$('.reveal-up, .reveal-left, .reveal-right').forEach(el => obs.observe(el));
})();

/* ============================================================
   3. Hero 视差：背景图随滚动轻微偏移
   ============================================================ */
(function initHeroParallax() {
  const bg = $('#heroBg');
  if (!bg) return;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroH = bg.parentElement.offsetHeight;
    if (scrollY < heroH) {
      bg.style.transform = `scale(1.04) translateY(${scrollY * 0.2}px)`;
    }
  }, { passive: true });
})();

/* ============================================================
   4. 首屏 Hero 动效（延迟触发）
   ============================================================ */
(function initHeroEntrance() {
  $$('.hero .reveal-up').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 300 + i * 160);
  });
})();

/* ============================================================
   5. 工作历程：可折叠 Accordion
   ============================================================ */
(function initCareerAccordion() {
  const cards = $$('.career-card');
  cards.forEach(card => {
    const header = card.querySelector('.career-header');
    const toggle = card.querySelector('.career-toggle');
    if (!header) return;

    header.addEventListener('click', () => {
      const isOpen = card.classList.contains('open');

      // 关闭其他（手风琴模式：同时只开一个）
      // 若需要允许多个同时展开，注释掉下面这行
      cards.forEach(c => { if (c !== card) c.classList.remove('open'); });
      if (toggle) {
        cards.forEach(c => {
          const t = c.querySelector('.career-toggle');
          if (t && c !== card) t.setAttribute('aria-expanded', 'false');
        });
      }

      card.classList.toggle('open', !isOpen);
      if (toggle) toggle.setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();

/* ============================================================
   6. 技能进度条（如果页面里有的话，向后兼容）
   ============================================================ */
(function initSkillBars() {
  const items = $$('.skill-bar-item');
  if (!items.length) return;
  items.forEach(item => {
    const fill = item.querySelector('.skill-bar-fill');
    if (!fill) return;
    fill.style.setProperty('--skill-w', fill.dataset.level + '%');
  });
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('animated'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  items.forEach(item => obs.observe(item));
})();

/* ============================================================
   7. 作品筛选
   ============================================================ */
(function initFilter() {
  const filterBtns = $$('.filter-btn');
  const cards = $$('.work-card');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      cards.forEach((card, i) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !match);
        if (match) {
          card.style.animationDelay = (i % 3) * 0.06 + 's';
        }
      });
    });
  });
})();

/* ============================================================
   8. 灯箱
   ============================================================ */
(function initLightbox() {
  const lb = $('#lightbox');
  const lbImg = $('#lightboxImg');
  const lbTitle = $('#lightboxTitle');
  const lbDesc = $('#lightboxDesc');
  const closeBtn = $('#lightboxClose');
  const prevBtn = $('#lightboxPrev');
  const nextBtn = $('#lightboxNext');

  let works = [];
  let cur = 0;

  function buildList() {
    works = [];
    $$('.work-card:not(.hidden)').forEach(card => {
      const img = card.querySelector('.work-thumb img');
      works.push({
        src: img ? img.src : '',
        title: card.querySelector('.work-title')?.textContent || '',
        desc: card.querySelector('.work-desc')?.textContent || '',
        card
      });
    });
  }

  function show(idx) {
    if (!works.length) return;
    cur = ((idx % works.length) + works.length) % works.length;
    const w = works[cur];
    lbImg.style.opacity = '0';
    lbImg.style.transform = 'scale(0.96)';
    setTimeout(() => {
      lbImg.src = w.src;
      lbImg.alt = w.title;
      lbTitle.textContent = w.title;
      lbDesc.textContent = w.desc;
      lbImg.style.transition = 'opacity 0.3s, transform 0.3s';
      lbImg.style.opacity = '1';
      lbImg.style.transform = 'scale(1)';
    }, 80);
  }

  function open(idx) { buildList(); show(idx); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.work-zoom-btn');
    if (!btn) return;
    buildList();
    const card = btn.closest('.work-card');
    const idx = works.findIndex(w => w.card === card);
    open(idx >= 0 ? idx : 0);
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(cur - 1));
  nextBtn.addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
})();

/* ============================================================
   9. 鼠标跟随光效
   ============================================================ */
(function initCursorGlow() {
  const glow = document.createElement('div');
  glow.style.cssText = `pointer-events:none;position:fixed;z-index:9999;
    width:380px;height:380px;border-radius:50%;
    background:radial-gradient(circle,rgba(30,111,217,0.055) 0%,transparent 70%);
    transform:translate(-50%,-50%);transition:left 0.12s ease,top 0.12s ease;
    will-change:left,top;`;
  document.body.appendChild(glow);
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
})();

/* ============================================================
   10. 滚动进度条
   ============================================================ */
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.style.cssText = `position:fixed;top:0;left:0;height:2px;
    background:linear-gradient(90deg,#1e6fd9,#4d9bff);z-index:9998;
    transform-origin:left;transform:scaleX(0);transition:transform 0.1s linear;`;
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
  }, { passive: true });
})();

/* ============================================================
   11. 平滑滚动
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

console.log('%c祝光军作品集 ✦ v2 加载完成', 'color:#1e6fd9;font-size:14px;font-weight:bold;');
