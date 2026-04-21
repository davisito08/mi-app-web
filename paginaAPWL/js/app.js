/* ================================================================
   GravityLab — app.js
   Vanilla JS: zero deps, progressive enhancement
   ================================================================ */

'use strict';

// ── Helpers ─────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ================================================================
// 1. NAVBAR — scroll shadow + hamburger toggle
// ================================================================
(function initNavbar() {
  const navbar = $('#navbar');
  const burger = $('#nav-hamburger');
  const links  = $('.nav-links');

  // Scroll: add .scrolled class
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger
  if (burger && links) {
    burger.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on nav-link click (mobile)
    $$('.nav-link', links).forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();

// ================================================================
// 2. ACTIVE NAV LINK — highlight on scroll section
// ================================================================
(function initScrollSpy() {
  const sections   = $$('section[id], main[id]');
  const navLinks   = $$('.nav-link');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(l => {
          const href = l.getAttribute('href');
          l.classList.toggle('active', href === `#${id}`);
        });
      }
    });
  }, { threshold: 0.35, rootMargin: `-${68}px 0px 0px 0px` });

  sections.forEach(s => observer.observe(s));
})();

// ================================================================
// 3. FILTER CHIPS — filter scene cards by visibility
// ================================================================
(function initFilterChips() {
  const chips      = $$('.chip');
  const cards      = $$('.scene-card:not(.scene-card-add)');
  const countBadge = $('#total-count');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');

      const filter = chip.dataset.filter;
      let visible = 0;

      cards.forEach(card => {
        const isPublic = card.querySelector('.badge-public') !== null;
        const show =
          filter === 'todas'   ? true :
          filter === 'publicas'  ? isPublic :
          filter === 'privadas'  ? !isPublic : true;

        card.style.display = show ? '' : 'none';
        card.style.opacity  = show ? '1' : '0';
        if (show) visible++;
      });

      if (countBadge) {
        countBadge.textContent = `${visible} escena${visible !== 1 ? 's' : ''}`;
      }
    });
  });
})();

// ================================================================
// 4. SEARCH — live filter by scene title / description
// ================================================================
(function initSearch() {
  const input = $('#search-input');
  if (!input) return;

  const cards      = $$('.scene-card:not(.scene-card-add)');
  const countBadge = $('#total-count');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach(card => {
      const title = ($('.scene-title', card)?.textContent || '').toLowerCase();
      const desc  = ($('.scene-desc',  card)?.textContent || '').toLowerCase();
      const show  = q === '' || title.includes(q) || desc.includes(q);

      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (countBadge && q !== '') {
      countBadge.textContent = `${visible} resultado${visible !== 1 ? 's' : ''}`;
    } else if (countBadge) {
      countBadge.textContent = `${cards.length} escenas`;
    }
  });
})();

// ================================================================
// 5. VIEW TOGGLE — grid / list layout
// ================================================================
(function initViewToggle() {
  const btnGrid = $('#view-grid');
  const btnList = $('#view-list');
  const grid    = $('#scenes-grid');
  if (!btnGrid || !btnList || !grid) return;

  btnGrid.addEventListener('click', () => {
    btnGrid.classList.add('active');
    btnList.classList.remove('active');
    btnGrid.setAttribute('aria-pressed', 'true');
    btnList.setAttribute('aria-pressed', 'false');
    grid.classList.remove('scenes-list');
  });

  btnList.addEventListener('click', () => {
    btnList.classList.add('active');
    btnGrid.classList.remove('active');
    btnList.setAttribute('aria-pressed', 'true');
    btnGrid.setAttribute('aria-pressed', 'false');
    grid.classList.add('scenes-list');
  });
})();

// ================================================================
// 6. GRAVITY RANGE SLIDERS — live value badges + arrow preview
// ================================================================
(function initRangeSliders() {
  const gy     = $('#f-gravedad-y');
  const gx     = $('#f-gravedad-x');
  const gyVal  = $('#gy-val');
  const gxVal  = $('#gx-val');
  const arrow  = $('#gravity-arrow');

  function fmt(v) { return parseFloat(v).toFixed(2); }

  function updateRangeTrack(range) {
    const min = +range.min, max = +range.max, val = +range.value;
    const pct = ((val - min) / (max - min)) * 100;
    range.style.background = `linear-gradient(to right,
      var(--clr-primary) 0%,
      var(--clr-primary) ${pct}%,
      var(--clr-surface-3) ${pct}%)`;
  }

  function updateArrow() {
    if (!arrow) return;
    const gyv = gy ? +gy.value : 1;
    const gxv = gx ? +gx.value : 0;
    const angle = Math.atan2(gxv, gyv) * (180 / Math.PI);
    const mag   = Math.min(Math.sqrt(gxv * gxv + gyv * gyv) / 3, 1);
    const len   = 8 + mag * 34;
    arrow.style.height    = `${len}px`;
    arrow.style.transform = `translate(-50%, 0) rotate(${angle}deg)`;
    arrow.style.opacity   = mag > 0.05 ? '1' : '0.2';
  }

  if (gy) {
    updateRangeTrack(gy);
    gy.addEventListener('input', () => {
      if (gyVal) gyVal.textContent = fmt(gy.value);
      updateRangeTrack(gy);
      updateArrow();
    });
  }

  if (gx) {
    updateRangeTrack(gx);
    gx.addEventListener('input', () => {
      if (gxVal) gxVal.textContent = fmt(gx.value);
      updateRangeTrack(gx);
      updateArrow();
    });
  }

  updateArrow();
})();

// ================================================================
// 7. COLOR PICKER — sync hex text input ↔ color input
// ================================================================
(function initColorSync() {
  const colorInput = $('#f-fondo-color');
  const hexInput   = $('#f-fondo-color-text');
  if (!colorInput || !hexInput) return;

  colorInput.addEventListener('input', () => {
    hexInput.value = colorInput.value;
  });

  hexInput.addEventListener('input', () => {
    const v = hexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      colorInput.value = v;
    }
  });
})();

// ================================================================
// 8. VISIBILITY TOGGLE BUTTON
// ================================================================
(function initToggle() {
  const btn   = $('#toggle-publica');
  const label = $('#toggle-label');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const checked = btn.getAttribute('aria-checked') === 'true';
    btn.setAttribute('aria-checked', String(!checked));
    if (label) label.textContent = !checked ? 'Pública' : 'Privada';
  });
})();

// ================================================================
// 9. FORM SUBMIT — fake async + success message
// ================================================================
(function initForm() {
  const form    = $('#form-nueva-escena');
  const submitBtn = $('#btn-submit-form');
  const successMsg = $('#success-msg');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    const nombre = $('#f-nombre');
    if (!nombre || nombre.value.trim() === '') {
      nombre?.focus();
      nombre?.setCustomValidity('Por favor introduce un nombre.');
      nombre?.reportValidity();
      return;
    }
    nombre?.setCustomValidity('');

    // Loading state
    submitBtn?.classList.add('loading');
    submitBtn && (submitBtn.disabled = true);

    // Simulate async request
    setTimeout(() => {
      submitBtn?.classList.remove('loading');
      submitBtn && (submitBtn.disabled = false);

      if (successMsg) {
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Reset after 3s
      setTimeout(() => {
        form.reset();
        if (successMsg) successMsg.hidden = true;

        // Reset toggle label
        const toggle = $('#toggle-publica');
        const label  = $('#toggle-label');
        if (toggle) toggle.setAttribute('aria-checked', 'false');
        if (label)  label.textContent = 'Privada';

        // Reset sliders
        const gy = $('#f-gravedad-y');
        const gx = $('#f-gravedad-x');
        const gyVal = $('#gy-val');
        const gxVal = $('#gx-val');
        if (gy) { gy.value = '1.00'; gy.dispatchEvent(new Event('input')); }
        if (gx) { gx.value = '0.00'; gx.dispatchEvent(new Event('input')); }
        if (gyVal) gyVal.textContent = '1.00';
        if (gxVal) gxVal.textContent = '0.00';

        // Reset color
        const col  = $('#f-fondo-color');
        const hex  = $('#f-fondo-color-text');
        if (col) col.value = '#0f0f1a';
        if (hex) hex.value = '#0f0f1a';

        // Scroll back to form top
        document.getElementById('nueva-escena')?.scrollIntoView({ behavior: 'smooth' });
      }, 3000);
    }, 1800);
  });

  // Clear native validity on typing
  $$('.form-input, .form-textarea', form).forEach(el => {
    el.addEventListener('input', () => el.setCustomValidity(''));
  });
})();

// ================================================================
// 10. SCENE CARD KEYBOARD — Enter/Space to "open"
// ================================================================
(function initCardInteraction() {
  $$('.scene-card:not(.scene-card-add)').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const launchBtn = card.querySelector('.btn-launch');
        launchBtn?.click();
      }
    });
  });
})();

// ================================================================
// 11. LIST VIEW STYLES (injected dynamically)
// ================================================================
(function injectListStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .scenes-list {
      grid-template-columns: 1fr !important;
    }
    .scenes-list .scene-card {
      flex-direction: row;
      align-items: center;
    }
    .scenes-list .scene-card-header {
      width: 90px;
      min-width: 90px;
      height: 90px;
      border-radius: 0;
      flex-shrink: 0;
    }
    .scenes-list .scene-card-body {
      flex-direction: row;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .scenes-list .scene-desc { display: none; }
    .scenes-list .scene-card-footer {
      border-top: none;
      border-left: 1px solid var(--clr-border);
      padding-left: 1rem;
      flex-shrink: 0;
    }
    .scenes-list .scene-color-strip { display: none; }
    @media (max-width: 600px) {
      .scenes-list .scene-card { flex-direction: column; }
      .scenes-list .scene-card-header { width: 100%; }
      .scenes-list .scene-card-footer { border-left: none; border-top: 1px solid var(--clr-border); }
    }
  `;
  document.head.appendChild(style);
})();

console.info('%c🪐 GravityLab JS loaded', 'color:#a855f7;font-weight:bold;font-size:14px');
