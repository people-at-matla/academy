/**
 * course-injector.js
 * Matla Academy — Admin Content Injection System
 * Reads admin-authored notes, text overrides, and video URLs from localStorage
 * and injects them into course pages at runtime.
 * Also enforces superadmin privileges (unlock all, no limits).
 */
(function () {
  'use strict';

  // ── Inject CSS for admin-added elements ──────────────────
  const style = document.createElement('style');
  style.textContent = `
    .acn-banner {
      margin: 1.25rem 1.5rem;
      background: rgba(245,158,11,0.08);
      border: 1px solid rgba(245,158,11,0.28);
      border-left: 3px solid #f59e0b;
      border-radius: 10px;
      padding: 0.875rem 1.125rem;
      display: flex; align-items: flex-start; gap: 0.75rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.88rem; color: #92400e;
      animation: acnIn 0.4s ease both;
    }
    [data-theme="dark"] .acn-banner { color: #fde68a; }
    [data-theme="grey"] .acn-banner { color: #fde68a; }
    [data-theme="blue"] .acn-banner { color: #fde68a; }
    @keyframes acnIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
    .acn-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 0.05rem; }
    .acn-body strong { display: block; font-weight: 700; margin-bottom: 0.2rem; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .amn-banner {
      margin: 0 0 1rem;
      background: rgba(37,99,235,0.07);
      border: 1px solid rgba(37,99,235,0.2);
      border-left: 3px solid #2563eb;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.84rem; color: #1e40af;
      display: flex; align-items: flex-start; gap: 0.625rem;
    }
    [data-theme="dark"] .amn-banner, [data-theme="grey"] .amn-banner, [data-theme="blue"] .amn-banner { color: #93c5fd; background: rgba(37,99,235,0.1); border-color: rgba(37,99,235,0.3); }
    .amv-wrap {
      margin: 0 0 1.25rem;
      border-radius: 12px; overflow: hidden;
      background: #000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    .amv-label {
      background: rgba(0,0,0,0.6);
      color: #fbbf24; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      padding: 0.4rem 0.875rem;
      display: flex; align-items: center; gap: 0.4rem;
    }
    .amv-frame { position: relative; padding-top: 56.25%; }
    .amv-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
    .amv-player { width: 100%; display: block; max-height: 360px; }
    .sa-mode-badge {
      position: fixed; bottom: 1rem; right: 1rem; z-index: 9999;
      background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4);
      border-radius: 50px; padding: 0.3rem 0.875rem;
      font-family: 'DM Sans', sans-serif; font-size: 0.7rem; font-weight: 700;
      color: #fbbf24; display: flex; align-items: center; gap: 0.4rem;
      box-shadow: 0 4px 16px rgba(245,158,11,0.15);
      animation: badgeFloat 3s ease-in-out infinite alternate;
    }
    @keyframes badgeFloat { from{transform:translateY(0)} to{transform:translateY(-4px)} }
    .crs-module[data-sa-unlocked] > .crs-mod-hd { opacity: 1 !important; }
    .crs-module[data-sa-unlocked] > * { pointer-events: all !important; }
    .sa-override-content {
      margin: 0 0 1rem;
      padding: 1rem;
      background: rgba(139,92,246,0.07);
      border: 1px solid rgba(139,92,246,0.2);
      border-radius: 10px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem; line-height: 1.7; color: inherit;
    }
    [data-theme="dark"] .sa-override-content,[data-theme="grey"] .sa-override-content { color: #e2e8f0; }
  `;
  document.head.appendChild(style);

  // ── Run after DOM ready ───────────────────────────────────
  function run() {
    const courseKey = (typeof STORAGE_KEY !== 'undefined') ? STORAGE_KEY : detectCourseKey();
    if (!courseKey) return;
    const courseId = courseKey.replace('matla_crs_', '');

    // Load admin edits
    let edits = {};
    try { edits = JSON.parse(localStorage.getItem('matla_admin_course_edits') || '{}'); } catch {}
    const courseEdits = edits[courseId] || {};

    // Course-level admin note banner
    if (courseEdits.courseNote) {
      const target = document.querySelector('.crs-hero, .crs-main > *:first-child, main > *:first-child');
      if (target) {
        const banner = document.createElement('div');
        banner.className = 'acn-banner';
        banner.innerHTML = `<span class="acn-icon">📌</span><div class="acn-body"><strong>Admin Note</strong>${escHtml(courseEdits.courseNote)}</div>`;
        target.insertAdjacentElement('afterend', banner);
      }
    }

    // Per-module injections
    const modules = document.querySelectorAll('section.crs-module, .crs-module');
    modules.forEach(function (section, idx) {
      const modEdits = (courseEdits.modules || {})[String(idx)] || {};
      const content  = section.querySelector('.crs-content');

      // Text override (replaces existing content with admin text)
      if (modEdits.textOverride && content) {
        const ov = document.createElement('div');
        ov.className = 'sa-override-content';
        ov.innerHTML = modEdits.textOverride.replace(/\n/g, '<br>');
        content.insertAdjacentElement('afterbegin', ov);
      }

      // Admin module note banner
      if (modEdits.adminNote && content) {
        const note = document.createElement('div');
        note.className = 'amn-banner';
        note.innerHTML = `<span>💬</span><div><strong>Admin:</strong> ${escHtml(modEdits.adminNote)}</div>`;
        content.insertAdjacentElement('afterbegin', note);
      }

      // Video injection
      if (modEdits.videoUrl && content) {
        const videoWrap = document.createElement('div');
        videoWrap.className = 'amv-wrap';
        const url = modEdits.videoUrl.trim();
        const ytId = extractYouTubeId(url);
        const vimeoId = extractVimeoId(url);

        if (ytId) {
          videoWrap.innerHTML = `
            <div class="amv-label">🎥 Module Video</div>
            <div class="amv-frame"><iframe src="https://www.youtube.com/embed/${ytId}?rel=0" allowfullscreen allow="autoplay; encrypted-media"></iframe></div>`;
        } else if (vimeoId) {
          videoWrap.innerHTML = `
            <div class="amv-label">🎥 Module Video</div>
            <div class="amv-frame"><iframe src="https://player.vimeo.com/video/${vimeoId}" allowfullscreen></iframe></div>`;
        } else {
          videoWrap.innerHTML = `
            <div class="amv-label">🎥 Module Video</div>
            <video class="amv-player" src="${escHtml(url)}" controls playsinline></video>`;
        }
        content.insertAdjacentElement('beforebegin', videoWrap);
      }
    });

    // ── Superadmin privileges ──────────────────────────────
    const isSuper = localStorage.getItem('matla_superadmin_active') === 'true';
    if (!isSuper) return;

    // Add superadmin badge
    const badge = document.createElement('div');
    badge.className = 'sa-mode-badge';
    badge.innerHTML = '🛡️ Superadmin Mode · All modules unlocked';
    document.body.appendChild(badge);

    // Unlock all locked modules (disable pointer-events blocks, opacity fades, etc.)
    modules.forEach(function (section) {
      section.setAttribute('data-sa-unlocked', '1');
      section.style.opacity = '1';
      section.style.pointerEvents = 'all';
      // Remove any lock overlays
      section.querySelectorAll('[class*="lock"], [id*="lock"]').forEach(function(el) {
        el.style.display = 'none';
      });
      // Enable all buttons
      section.querySelectorAll('button[disabled], button.disabled').forEach(function(btn) {
        btn.disabled = false;
        btn.classList.remove('disabled');
      });
    });

    // Enable all module nav items in sidebar
    document.querySelectorAll('.crs-sidebar-item, .mod-nav-item').forEach(function (item) {
      item.classList.remove('locked', 'disabled');
      item.style.opacity = '1';
      item.style.pointerEvents = 'all';
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  function detectCourseKey() {
    const path = window.location.pathname;
    if (path.includes('sales-training')) return 'matla_crs_sales';
    if (path.includes('product-rma'))    return 'matla_crs_rma';
    if (path.includes('capital-legacy')) return 'matla_crs_capital';
    if (path.includes('fais'))           return 'matla_crs_fais';
    if (path.includes('financial'))      return 'matla_crs_fin_lit';
    return null;
  }

  function extractYouTubeId(url) {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function extractVimeoId(url) {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m ? m[1] : null;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
