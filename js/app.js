/* ================================================================
   GravityLab — app.js
   Vanilla JS: zero deps, progressive enhancement
   ================================================================ */

'use strict';

// ── Helpers ─────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ID de la escena que se está editando (null si estamos creando)
let editingSceneId = null;

// ================================================================
// 1. NAVBAR — scroll shadow + hamburger toggle
// ================================================================
(function initNavbar() {
  const navbar = $('#navbar');
  const burger = $('#nav-hamburger');
  const links = $('.nav-links');

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
// 1.5 THEME TOGGLE — Light / Dark mode
// ================================================================
(function initTheme() {
  const btn = $('#btn-theme');
  const body = document.body;
  if (!btn) return;

  // Cargar preferencia
  const saved = localStorage.getItem('gl-theme');
  if (saved === 'light') body.classList.add('light-theme');

  btn.addEventListener('click', () => {
    const isLight = body.classList.toggle('light-theme');
    localStorage.setItem('gl-theme', isLight ? 'light' : 'dark');

    // Feedback visual opcional: rotar icono
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      svg.style.transform = isLight ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  });
})();

// ================================================================
// 2. MODALS SYSTEM — Footer links
// ================================================================
(function initModals() {
  const modal = $('#info-modal');
  const title = $('#modal-title');
  const body = $('#modal-body');
  const closeBtn = $('#modal-close');
  const overlay = $('#modal-overlay');

  if (!modal) return;

  const openModal = (type) => {
    let content = { title: '', html: '' };

    switch (type) {
      case 'doc':
        content.title = 'Documentación';
        content.html = `
          <p>Bienvenido a la guía oficial de <strong>GravityLab</strong>. Aquí aprenderás a dominar las leyes de la física digital.</p>
          <ul>
            <li><strong>Crear escenas:</strong> Usa el formulario principal para definir la gravedad y el fondo.</li>
            <li><strong>Lanzar:</strong> Pulsa el botón de cohete para entrar en el simulador interactivo.</li>
            <li><strong>Interacción:</strong> Dentro del simulador, puedes arrastrar los elementos con el ratón.</li>
          </ul>
        `;
        break;
      case 'api':
        content.title = 'API de GravityLab';
        content.html = `
          <p>Nuestra API REST permite integrar GravityLab en tus propios proyectos.</p>
          <p><code>GET /api/scenes.php</code> - Lista todas las escenas.</p>
          <p><code>POST /api/scenes.php</code> - Crea una nueva escena (JSON).</p>
          <p>Usa el encabezado <code>Content-Type: application/json</code> para tus peticiones.</p>
        `;
        break;
      case 'about':
        content.title = 'Acerca de GravityLab';
        content.html = `
          <p><strong>GravityLab</strong> nació como un experimento para unir el arte visual con la física de partículas.</p>
          <p>Desarrollado con pasión, utiliza tecnologías modernas como <strong>Matter.js</strong> para las colisiones y un backend robusto en PHP/MySQL.</p>
        `;
        break;
      case 'contact':
        content.title = 'Contacto';
        content.html = `
          <p>¿Tienes alguna duda o sugerencia? ¡Nos encantaría escucharte!</p>
          <p>📧 Email: <strong>soporte@gravitylab.test</strong></p>
          <p>📍 Ubicación: El Vacío Digital, Sector 7-G.</p>
        `;
        break;
    }

    title.textContent = content.title;
    body.innerHTML = content.html;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  // Eventos de apertura
  $('#link-doc')?.addEventListener('click', (e) => { e.preventDefault(); openModal('doc'); });
  $('#link-api')?.addEventListener('click', (e) => { e.preventDefault(); openModal('api'); });
  $('#link-about')?.addEventListener('click', (e) => { e.preventDefault(); openModal('about'); });
  $('#link-contact')?.addEventListener('click', (e) => { e.preventDefault(); openModal('contact'); });

  // Eventos de cierre
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();

// ================================================================
// 3. ACTIVE NAV LINK — highlight on scroll section
// ================================================================
(function initScrollSpy() {
  const sections = $$('section[id], main[id]');
  const navLinks = $$('.nav-link');

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
  const chips = $$('.chip');
  const countBadge = $('#total-count');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cards = $$('.scene-card:not(.scene-card-add)');
      chips.forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');

      const filter = chip.dataset.filter;
      let visible = 0;

      cards.forEach(card => {
        const isPublic = card.querySelector('.badge-public') !== null;
        const show =
          filter === 'todas' ? true :
            filter === 'publicas' ? isPublic :
              filter === 'privadas' ? !isPublic : true;

        card.style.display = show ? '' : 'none';
        card.style.opacity = show ? '1' : '0';
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

  const countBadge = $('#total-count');

  input.addEventListener('input', () => {
    const cards = $$('.scene-card:not(.scene-card-add)');
    const q = input.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach(card => {
      const title = ($('.scene-title', card)?.textContent || '').toLowerCase();
      const desc = ($('.scene-desc', card)?.textContent || '').toLowerCase();
      const show = q === '' || title.includes(q) || desc.includes(q);

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
  const grid = $('#scenes-grid');
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
  const gy = $('#f-gravedad-y');
  const gx = $('#f-gravedad-x');
  const gyVal = $('#gy-val');
  const gxVal = $('#gx-val');
  const arrow = $('#gravity-arrow');

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
    const mag = Math.min(Math.sqrt(gxv * gxv + gyv * gyv) / 3, 1);
    const len = 8 + mag * 34;
    arrow.style.height = `${len}px`;
    arrow.style.transform = `translate(-50%, 0) rotate(${angle}deg)`;
    arrow.style.opacity = mag > 0.05 ? '1' : '0.2';
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
  const hexInput = $('#f-fondo-color-text');
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
  const btn = $('#toggle-publica');
  const label = $('#toggle-label');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const checked = btn.getAttribute('aria-checked') === 'true';
    btn.setAttribute('aria-checked', String(!checked));
    if (label) label.textContent = !checked ? 'Pública' : 'Privada';
  });
})();

// ================================================================
// 9. FORM SUBMIT — POST real a api/scenes.php
// ================================================================
(function initForm() {
  const form = $('#form-nueva-escena');
  const submitBtn = $('#btn-submit-form');
  const successMsg = $('#success-msg');
  if (!form) return;

  // Mostrar error inline bajo el campo
  function showFieldError(fieldId, msg) {
    const field = $('#' + fieldId);
    if (!field) return;
    field.setCustomValidity(msg);
    field.reportValidity();
  }

  // Resetear todo el formulario a valores iniciales
  function resetForm() {
    form.reset();
    editingSceneId = null; // Volvemos a modo creación

    // Restaurar textos de la interfaz
    const titleEl = $('.form-title');
    const btnText = $('.btn-submit .btn-text');
    if (titleEl) titleEl.textContent = 'Nueva Escena de Gravedad';
    if (btnText) btnText.textContent = '✦ Crear Escena';

    if (successMsg) successMsg.hidden = true;

    const toggle = $('#toggle-publica');
    const label = $('#toggle-label');
    if (toggle) toggle.setAttribute('aria-checked', 'false');
    if (label) label.textContent = 'Privada';

    const gy = $('#f-gravedad-y');
    const gx = $('#f-gravedad-x');
    const gyVal = $('#gy-val');
    const gxVal = $('#gx-val');
    if (gy) { gy.value = '1.00'; gy.dispatchEvent(new Event('input')); }
    if (gx) { gx.value = '0.00'; gx.dispatchEvent(new Event('input')); }
    if (gyVal) gyVal.textContent = '1.00';
    if (gxVal) gxVal.textContent = '0.00';

    const col = $('#f-fondo-color');
    const hex = $('#f-fondo-color-text');
    if (col) col.value = '#0f0f1a';
    if (hex) hex.value = '#0f0f1a';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validación front-end del campo requerido
    const nombreEl = $('#f-nombre');
    if (!nombreEl || nombreEl.value.trim() === '') {
      showFieldError('f-nombre', 'Por favor introduce un nombre.');
      return;
    }
    nombreEl.setCustomValidity('');

    // Estado de carga
    submitBtn?.classList.add('loading');
    if (submitBtn) submitBtn.disabled = true;

    // Construir payload
    const toggleBtn = $('#toggle-publica');
    const esPublica = toggleBtn?.getAttribute('aria-checked') === 'true';

    const payload = {
      nombre: nombreEl.value.trim(),
      descripcion: ($('#f-descripcion')?.value ?? '').trim(),
      fondo_color: $('#f-fondo-color')?.value ?? '#0f0f1a',
      fondo_imagen: ($('#f-fondo-imagen')?.value ?? '').trim(),
      gravedad_y: parseFloat($('#f-gravedad-y')?.value ?? '1.00'),
      gravedad_x: parseFloat($('#f-gravedad-x')?.value ?? '0.00'),
      es_publica: esPublica,
    };

    try {
      const url = editingSceneId ? `api/scenes.php?id=${editingSceneId}` : 'api/scenes.php';
      const method = editingSceneId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        // Éxito — mostrar banner y reiniciar tras 3s
        if (successMsg) {
          const modeText = editingSceneId ? 'actualizada' : 'creada';
          const p = successMsg.querySelector('p');
          if (p) p.textContent = `¡Escena ${modeText} con éxito!`;

          successMsg.hidden = false;
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Recargar escenas y reiniciar
        loadScenes();
        setTimeout(resetForm, 3000);
      } else {
        // Errores de validación del servidor
        const msgs = json.errors ?? [json.message ?? 'Error desconocido.'];
        // Mostrar el primer error en el campo nombre si es de nombre, resto como alert
        if (msgs[0]?.toLowerCase().includes('nombre')) {
          showFieldError('f-nombre', msgs[0]);
        } else {
          alert('⚠ ' + msgs.join('\n'));
        }
      }
    } catch (err) {
      // Error de red o servidor caído
      alert('❌ No se pudo contactar con el servidor.\n\nAsegúrate de que PHP y MySQL están activos e importa database.sql si aún no lo has hecho.');
      console.error('[GravityLab] fetch error:', err);
    } finally {
      submitBtn?.classList.remove('loading');
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Limpiar validación nativa al escribir
  $$('.form-input, .form-textarea', form).forEach(el => {
    el.addEventListener('input', () => el.setCustomValidity(''));
  });
})();

// ================================================================
// 10. SCENE CARD KEYBOARD — Enter/Space to "open"
// ================================================================
(function initCardInteraction() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.scene-card:not(.scene-card-add)');
      if (card) {
        e.preventDefault();
        const launchBtn = card.querySelector('.btn-launch');
        launchBtn?.click();
      }
    }
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

// ================================================================
// 12. DYNAMIC SCENE LOADING
// ================================================================

/**
 * GravityLab app.js v3
 * Elimina una escena tras confirmar.
 */
window.deleteScene = async function (id) {
  console.log("[GravityLab] Intentando eliminar escena ID:", id);
  if (!confirm('¿Estás seguro de que quieres eliminar esta escena?')) return;

  try {
    const res = await fetch(`api/scenes.php?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    console.log("[GravityLab] Respuesta de eliminación:", json);

    if (json.success) {
      loadScenes(); // Recargar cuadrícula
    } else {
      alert("Error: " + (json.message || "No se pudo eliminar."));
    }
  } catch (err) {
    console.error("[GravityLab] Delete error:", err);
    alert("Error de conexión al intentar eliminar.");
  }
};

/**
 * Carga una escena en el formulario para edición.
 */
window.editScene = async function (id) {
  try {
    const res = await fetch(`api/scenes.php?id=${id}`);
    const json = await res.json();

    if (!json.success) {
      alert("No se pudo cargar la escena: " + json.message);
      return;
    }

    const scene = json.data;
    editingSceneId = id;

    // Cambiar visual del formulario
    $('.form-title').textContent = 'Editar Escena: ' + scene.nombre;
    $('.btn-submit .btn-text').textContent = '💾 Guardar Cambios';

    // Rellenar campos
    $('#f-nombre').value = scene.nombre;
    $('#f-descripcion').value = scene.descripcion || '';
    $('#f-fondo-color').value = scene.fondo_color;
    $('#f-fondo-color-text').value = scene.fondo_color;
    $('#f-fondo-imagen').value = scene.fondo_imagen || '';
    $('#f-gravedad-y').value = scene.gravedad_y;
    $('#f-gravedad-x').value = scene.gravedad_x;

    // Actualizar badges de rango
    $('#gy-val').textContent = parseFloat(scene.gravedad_y).toFixed(2);
    $('#gx-val').textContent = parseFloat(scene.gravedad_x).toFixed(2);

    // Actualizar flecha preview
    $('#gravity-arrow').style.setProperty('--gy', scene.gravedad_y);
    $('#gravity-arrow').style.setProperty('--gx', scene.gravedad_x);

    // Actualizar toggle publico
    const toggle = $('#toggle-publica');
    const isPublic = Boolean(Number(scene.es_publica));
    toggle.setAttribute('aria-checked', String(isPublic));
    $('#toggle-label').textContent = isPublic ? 'Pública' : 'Privada';

    // Scroll al formulario
    $('#nueva-escena').scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    console.error("[GravityLab] Edit load error:", err);
    alert("Error de conexión al cargar datos.");
  }
};

async function loadScenes() {
  try {
    const res = await fetch('api/scenes.php');
    const json = await res.json();
    if (!json.success) return;

    const grid = $('#scenes-grid');
    if (!grid) return;

    // Actualizar contadores globales
    const totalCount = json.data.length;
    const totalViews = json.data.reduce((acc, s) => acc + (parseInt(s.vistas) || 0), 0);
    const publicCount = json.data.filter(s => Boolean(Number(s.es_publica))).length;

    const heroCountEl = $('#hero-scenes-count');
    if (heroCountEl) heroCountEl.textContent = totalCount;

    const heroViewsEl = $('#hero-views-count');
    if (heroViewsEl) {
      heroViewsEl.textContent = totalViews >= 1000 ? (totalViews / 1000).toFixed(1) + 'k' : totalViews;
    }

    const heroPublicEl = $('#hero-public-count');
    if (heroPublicEl) heroPublicEl.textContent = publicCount;

    const totalCountEl = $('#total-count');
    if (totalCountEl) totalCountEl.textContent = `${totalCount} escena${totalCount !== 1 ? 's' : ''}`;

    const addCardHtml = `
      <article class="scene-card scene-card-add" role="listitem" tabindex="0" id="escena-add-card">
        <a href="#nueva-escena" class="add-card-inner" id="add-card-link">
          <div class="add-card-icon">+</div>
          <p class="add-card-text">Crear nueva escena</p>
        </a>
      </article>
    `;

    // Escapar texto para prevenir XSS
    const escapeHTML = str => String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));

    const cardsHtml = json.data.map(scene => {
      const badgeClass = scene.es_publica ? 'badge-public' : 'badge-private';
      const badgeText = scene.es_publica ? 'Pública' : 'Privada';
      const descLine = scene.descripcion ? escapeHTML(scene.descripcion) : 'Sin descripción';
      return `
        <article class="scene-card" role="listitem" tabindex="0" id="escena-${scene.id}">
          <div class="scene-card-header" style="--card-color:${escapeHTML(scene.fondo_color)}">
            <span class="scene-icon">🌌</span>
            <div class="scene-badges">
              <span class="badge ${badgeClass}">${badgeText}</span>
              <span class="badge badge-views">👁 ${scene.vistas || 0}</span>
            </div>
          </div>
          <div class="scene-card-body">
            <h3 class="scene-title">${escapeHTML(scene.nombre)}</h3>
            <p class="scene-desc">${descLine}</p>
            <div class="scene-meta">
              <span class="meta-item">↕ g_y: ${scene.gravedad_y}</span>
              <span class="meta-item">↔ g_x: ${scene.gravedad_x}</span>
            </div>
          </div>
          <div class="scene-card-footer">
            <div class="scene-color-strip" style="background:${escapeHTML(scene.fondo_color)}"></div>
            <div class="scene-actions">
              <button class="btn-card btn-edit" onclick="editScene(${scene.id})">✏️ Editar</button>
              <button class="btn-card btn-launch" onclick="window.location.href='simulador.html?id=${scene.id}'">🚀 Lanzar</button>
              <button class="btn-card btn-delete" onclick="deleteScene(${scene.id})">🗑</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    grid.innerHTML = cardsHtml + addCardHtml;

    // Disparar input search para re-filtrar si había búsqueda
    $('#search-input')?.dispatchEvent(new Event('input'));

  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// Cargar en el inicio
document.addEventListener('DOMContentLoaded', loadScenes);

console.info('%c🪐 GravityLab JS loaded', 'color:#a855f7;font-weight:bold;font-size:14px');
