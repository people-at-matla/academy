css = r"""

/* ═══════════════════════════════════════════════════════════════════════════
   SCRIPT.JS COMPONENT STYLES
   Nav · Sidebar · Footer · Floating Chat · Toasts · Dashboard
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Nav content padding ─────────────────────────────────────────────────── */
.nav-content { padding: 0 1.5rem; }

/* ── Nav left zone ───────────────────────────────────────────────────────── */
.nav-left {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
}

/* ── Hamburger button ────────────────────────────────────────────────────── */
.nav-hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    transition: background 0.2s;
    flex-shrink: 0;
}
.nav-hamburger:hover { background: rgba(0,0,0,0.06); }
.nav-hamburger span {
    display: block;
    width: 20px;
    height: 2px;
    background: currentColor;
    border-radius: 2px;
    transition: transform 0.25s ease, opacity 0.25s ease;
}

/* ── Nav brand / logo ────────────────────────────────────────────────────── */
.nav-brand {
    display: flex;
    align-items: center;
    text-decoration: none;
    flex-shrink: 0;
}
.nav-logo-img {
    height: 32px;
    width: auto;
    object-fit: contain;
}
.nav-logo-fallback {
    display: none;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: #fff;
    font-weight: 800;
    font-size: 0.85rem;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
}
.nav-sep {
    color: rgba(0,0,0,0.25);
    font-size: 1rem;
    font-weight: 300;
    user-select: none;
}
.nav-crumb {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-text-secondary, #4b5563);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
}

/* ── Nav center zone ─────────────────────────────────────────────────────── */
.nav-center {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-shrink: 0;
}
@media (max-width: 768px) { .nav-center { display: none; } }

/* ── Nav pills ───────────────────────────────────────────────────────────── */
.nav-pill {
    display: flex;
    align-items: center;
    gap: 0.38rem;
    padding: 0.3rem 0.75rem;
    border-radius: 99px;
    font-size: 0.78rem;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid transparent;
}
.nav-date-pill {
    background: rgba(30,64,175,0.08);
    color: #1e40af;
    border-color: rgba(30,64,175,0.15);
}
.nav-mod-pill {
    background: rgba(16,185,129,0.09);
    color: #059669;
    border-color: rgba(16,185,129,0.18);
}
[data-theme="dark"] .nav-date-pill { background: rgba(96,165,250,0.12); color: #93c5fd; border-color: rgba(96,165,250,0.2); }
[data-theme="dark"] .nav-mod-pill  { background: rgba(52,211,153,0.12); color: #6ee7b7; border-color: rgba(52,211,153,0.2); }

/* ── Nav progress ring ───────────────────────────────────────────────────── */
.nav-ring-wrap {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
}
.nav-ring-pct {
    position: absolute;
    font-size: 0.58rem;
    font-weight: 700;
    color: #f59e0b;
    line-height: 1;
}

/* ── Nav right zone ──────────────────────────────────────────────────────── */
.nav-right {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
}

/* ── Nav icon buttons (bell, theme) ─────────────────────────────────────── */
.nav-icon-btn {
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 10px;
    cursor: pointer;
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.9rem;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.nav-icon-btn:hover {
    background: var(--color-bg-secondary, #f3f4f6);
    color: var(--color-text-primary, #111827);
    border-color: var(--color-border-dark, #d1d5db);
}

/* Badge on bell */
.nav-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    background: #ef4444;
    color: #fff;
    font-size: 0.62rem;
    font-weight: 700;
    border-radius: 99px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
    line-height: 1;
    pointer-events: none;
}

/* ── Nav user chip ───────────────────────────────────────────────────────── */
.nav-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.7rem 0.3rem 0.35rem;
    border-radius: 99px;
    border: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-bg-secondary, #f9fafb);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    user-select: none;
    position: relative;
}
.nav-chip:hover { background: var(--color-bg-tertiary, #f3f4f6); border-color: var(--color-border-dark, #d1d5db); }
.nav-chip-av {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.nav-chip-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
    white-space: nowrap;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
}
@media (max-width: 500px) { .nav-chip-name { display: none; } }
.nav-chip-caret {
    font-size: 0.6rem;
    color: var(--color-text-tertiary, #9ca3af);
    transition: transform 0.2s;
}

/* ── Nav user dropdown ───────────────────────────────────────────────────── */
.nav-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 1.5rem;
    min-width: 180px;
    background: var(--color-bg-primary, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    padding: 0.5rem;
    z-index: 2000;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px) scale(0.97);
    transition: opacity 0.18s ease, transform 0.18s ease;
}
.nav-dropdown.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
}
.nav-dropdown a {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.55rem 0.75rem;
    border-radius: 8px;
    font-size: 0.84rem;
    font-weight: 500;
    color: var(--color-text-primary, #111827);
    text-decoration: none;
    transition: background 0.15s;
}
.nav-dropdown a:hover { background: var(--color-bg-secondary, #f3f4f6); }
.nav-dropdown a i { width: 16px; color: var(--color-text-secondary, #6b7280); font-size: 0.82rem; }
.nav-dd-sep {
    height: 1px;
    background: var(--color-border, #e5e7eb);
    margin: 0.35rem 0.5rem;
}

/* ── Notification panel ──────────────────────────────────────────────────── */
.nav-notif-panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 1.5rem;
    width: 300px;
    background: var(--color-bg-primary, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.14);
    z-index: 2000;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px) scale(0.97);
    transition: opacity 0.18s ease, transform 0.18s ease;
    overflow: hidden;
}
.nav-notif-panel.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
}
.nnp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.9rem 1rem 0.7rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-text-primary, #111827);
}
.nnp-header button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-tertiary, #9ca3af);
    font-size: 0.82rem;
    padding: 4px;
    border-radius: 6px;
    transition: background 0.15s;
}
.nnp-header button:hover { background: var(--color-bg-secondary, #f3f4f6); color: var(--color-text-primary, #111827); }
.nnp-list { padding: 0.4rem 0; }
.nnp-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.65rem 1rem;
    transition: background 0.15s;
    cursor: default;
}
.nnp-item:hover { background: var(--color-bg-secondary, #f9fafb); }
.nnp-unread { background: rgba(59,130,246,0.04); }
.nnp-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    flex-shrink: 0;
    margin-top: 1px;
}
.nnp-award { background: rgba(245,158,11,0.12); color: #d97706; }
.nnp-cal   { background: rgba(59,130,246,0.12);  color: #2563eb; }
.nnp-star  { background: rgba(139,92,246,0.12);  color: #7c3aed; }
.nnp-body { flex: 1; min-width: 0; }
.nnp-body strong { display: block; font-size: 0.82rem; font-weight: 700; color: var(--color-text-primary, #111827); margin-bottom: 1px; }
.nnp-body p { font-size: 0.77rem; color: var(--color-text-secondary, #6b7280); margin: 0; line-height: 1.4; }

/* ════════════════════════════════════════════════════════════════════════════
   SIDEBAR inner components
   ════════════════════════════════════════════════════════════════════════════ */
.sb-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.12) transparent;
}
.sb-inner::-webkit-scrollbar { width: 4px; }
.sb-inner::-webkit-scrollbar-track { background: transparent; }
.sb-inner::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }

/* Header */
.sb-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.2rem 0.9rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
}
.sb-brand { display: flex; align-items: center; gap: 0.6rem; }
.sb-logo  { height: 28px; width: auto; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.9; }
.sb-brandname { font-size: 0.9rem; font-weight: 700; color: #e2e8f0; letter-spacing: 0.01em; }
.sb-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(255,255,255,0.5);
    font-size: 1rem;
    padding: 4px 6px;
    border-radius: 6px;
    transition: background 0.15s, color 0.15s;
}
.sb-close-btn:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }

/* Profile card */
.sb-profile {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 1rem 1.2rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
}
.sb-av-wrap { position: relative; flex-shrink: 0; }
.sb-av {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: #fff;
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255,255,255,0.2);
}
.sb-dot {
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #10b981;
    border: 2px solid #0f172a;
}
.sb-pinfo { flex: 1; min-width: 0; }
.sb-pname  { font-size: 0.84rem; font-weight: 700; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sb-pemail { font-size: 0.72rem; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px; }
.sb-ring {
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.sb-ring span {
    position: absolute;
    font-size: 0.55rem;
    font-weight: 700;
    color: #f59e0b;
    line-height: 1;
}

/* Search */
.sb-search-wrap {
    position: relative;
    padding: 0.75rem 1.2rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
}
.sb-sicon {
    position: absolute;
    left: 1.9rem;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255,255,255,0.35);
    font-size: 0.8rem;
    pointer-events: none;
}
.sb-search {
    width: 100%;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 9px;
    padding: 0.5rem 0.75rem 0.5rem 2.2rem;
    font-size: 0.82rem;
    color: #e2e8f0;
    outline: none;
    transition: background 0.2s, border-color 0.2s;
}
.sb-search::placeholder { color: rgba(255,255,255,0.3); }
.sb-search:focus { background: rgba(255,255,255,0.1); border-color: rgba(59,130,246,0.5); }

/* Navigation */
.sb-nav { flex: 1; padding: 0.5rem 0.8rem; overflow-y: auto; }
.sb-group { margin-bottom: 0.25rem; }
.sb-glabel {
    display: block;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    padding: 0.6rem 0.55rem 0.3rem;
}
.sb-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.55rem 0.75rem;
    border-radius: 9px;
    font-size: 0.84rem;
    font-weight: 500;
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
    margin-bottom: 1px;
}
.sb-item i { width: 18px; text-align: center; font-size: 0.85rem; flex-shrink: 0; }
.sb-item span { flex: 1; }
.sb-item:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }
.sb-item.sb-active { background: rgba(59,130,246,0.2); color: #93c5fd; font-weight: 700; }
.sb-item.sb-active i { color: #60a5fa; }
.sb-badge {
    font-size: 0.6rem;
    font-weight: 700;
    background: linear-gradient(135deg, #3b82f6, #1e40af);
    color: #fff;
    padding: 1px 6px;
    border-radius: 99px;
}

/* Quick stats */
.sb-stats {
    display: flex;
    gap: 0;
    border-top: 1px solid rgba(255,255,255,0.08);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
}
.sb-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.7rem 0.5rem;
    border-right: 1px solid rgba(255,255,255,0.08);
}
.sb-stat:last-child { border-right: none; }
.sb-sv { font-size: 0.95rem; font-weight: 800; color: #e2e8f0; line-height: 1; }
.sb-sl { font-size: 0.62rem; color: #94a3b8; margin-top: 2px; }

/* Footer actions */
.sb-foot {
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-shrink: 0;
}
.sb-export-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.55rem;
    border-radius: 9px;
    background: rgba(59,130,246,0.15);
    color: #93c5fd;
    font-size: 0.82rem;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid rgba(59,130,246,0.25);
    transition: background 0.2s;
}
.sb-export-btn:hover { background: rgba(59,130,246,0.25); }
.sb-signout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 9px;
    background: rgba(239,68,68,0.1);
    color: #fca5a5;
    font-size: 0.82rem;
    font-weight: 600;
    border: 1px solid rgba(239,68,68,0.2);
    cursor: pointer;
    transition: background 0.2s;
    width: 100%;
}
.sb-signout-btn:hover { background: rgba(239,68,68,0.2); }

/* ════════════════════════════════════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════════════════════════════════════ */
#main-footer {
    background: linear-gradient(135deg, #0f172a 0%, #1a2744 60%, #0f172a 100%);
    color: #cbd5e1;
    margin-top: auto;
}
.footer-wrap { max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; }
.footer-top {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 3rem;
    padding: 3.5rem 0 2.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
}
@media (max-width: 768px) {
    .footer-top { grid-template-columns: 1fr; gap: 2rem; }
}

/* Brand column */
.footer-brand-col { display: flex; flex-direction: column; gap: 0.75rem; }
.footer-logo-img  { height: 36px; width: auto; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.85; }
.footer-logo-fallback {
    font-size: 1.25rem;
    font-weight: 900;
    color: #e2e8f0;
    letter-spacing: 2px;
    display: none;
}
.footer-tagline { font-size: 0.84rem; color: #94a3b8; line-height: 1.65; max-width: 260px; }
.footer-social { display: flex; gap: 0.6rem; margin-top: 0.25rem; }
.footer-social a {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.82rem;
    text-decoration: none;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.footer-social a:hover { background: rgba(59,130,246,0.2); color: #93c5fd; border-color: rgba(59,130,246,0.3); }

/* Links grid */
.footer-links-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
@media (max-width: 480px) { .footer-links-grid { grid-template-columns: repeat(2, 1fr); } }
.footer-col { display: flex; flex-direction: column; gap: 0.5rem; }
.footer-col h4 {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #e2e8f0;
    margin-bottom: 0.25rem;
}
.footer-col a {
    font-size: 0.84rem;
    color: #94a3b8;
    text-decoration: none;
    transition: color 0.2s;
    line-height: 1.4;
}
.footer-col a:hover { color: #e2e8f0; }

/* Bottom bar */
.footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 0;
    font-size: 0.78rem;
    color: #64748b;
    flex-wrap: wrap;
    gap: 0.5rem;
}
.footer-badges { display: flex; align-items: center; gap: 0.4rem; }
.footer-badges i { color: #3b82f6; }

/* ════════════════════════════════════════════════════════════════════════════
   FLOATING CHAT WIDGET
   ════════════════════════════════════════════════════════════════════════════ */
.fch-widget {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 900;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.65rem;
}

/* FAB trigger */
.fch-fab {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(30,64,175,0.45);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
    flex-shrink: 0;
}
.fch-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(30,64,175,0.55); }
.fch-dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 10px;
    height: 10px;
    background: #f59e0b;
    border: 2px solid #fff;
    border-radius: 50%;
    animation: fchPulse 2s infinite;
}
@keyframes fchPulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.25); }
}

/* Panel */
.fch-panel {
    display: none;
    flex-direction: column;
    width: 310px;
    max-height: 420px;
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    box-shadow: 0 12px 40px rgba(0,0,0,0.16);
    overflow: hidden;
    transform-origin: bottom right;
    animation: fchOpen 0.22s cubic-bezier(0.34,1.2,0.64,1) both;
}
.fch-panel.open { display: flex; }
@keyframes fchOpen {
    from { opacity:0; transform: scale(0.88) translateY(12px); }
    to   { opacity:1; transform: scale(1) translateY(0); }
}

/* Panel header */
.fch-hdr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.9rem 1rem;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: #fff;
    flex-shrink: 0;
}
.fch-hdr-info { display: flex; align-items: center; gap: 0.65rem; }
.fch-av-sm {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    flex-shrink: 0;
}
.fch-title { font-size: 0.9rem; font-weight: 700; line-height: 1.2; }
.fch-sub   { font-size: 0.7rem; opacity: 0.8; line-height: 1.2; }
.fch-close-btn {
    background: rgba(255,255,255,0.15);
    border: none;
    color: #fff;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
}
.fch-close-btn:hover { background: rgba(255,255,255,0.25); }

/* Message area */
.fch-msgs {
    flex: 1;
    overflow-y: auto;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    background: #f8fafc;
    scrollbar-width: thin;
}
.fch-bubble { display: flex; max-width: 90%; }
.fch-ai   { align-self: flex-start; }
.fch-user { align-self: flex-end; flex-direction: row-reverse; }
.fch-binner {
    padding: 0.55rem 0.8rem;
    border-radius: 14px;
    font-size: 0.82rem;
    line-height: 1.5;
}
.fch-ai .fch-binner {
    background: #ffffff;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-bottom-left-radius: 4px;
}
.fch-user .fch-binner {
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: #fff;
    border-bottom-right-radius: 4px;
}
.fch-binner a { color: #3b82f6; font-weight: 600; text-decoration: none; }
.fch-user .fch-binner a { color: #bfdbfe; }

/* Typing indicator */
.fch-typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0.55rem 0.9rem;
}
.fch-typing span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #9ca3af;
    animation: fchTyp 1.2s infinite;
}
.fch-typing span:nth-child(2) { animation-delay: 0.2s; }
.fch-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes fchTyp {
    0%,60%,100% { transform: translateY(0); }
    30%          { transform: translateY(-4px); }
}

/* Input row */
.fch-input-row {
    display: flex;
    gap: 0.4rem;
    padding: 0.6rem;
    background: #fff;
    border-top: 1px solid #e5e7eb;
    flex-shrink: 0;
}
.fch-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 99px;
    font-size: 0.82rem;
    outline: none;
    background: #f9fafb;
    color: #374151;
    transition: border-color 0.2s;
}
.fch-input:focus { border-color: #3b82f6; background: #fff; }
.fch-send-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 0.82rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.15s;
}
.fch-send-btn:hover { transform: scale(1.08); }

/* ════════════════════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ════════════════════════════════════════════════════════════════════════════ */
.matla-toast {
    position: fixed;
    bottom: 5.5rem;
    right: 1.5rem;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.7rem 1.1rem;
    border-radius: 12px;
    font-size: 0.84rem;
    font-weight: 500;
    color: #fff;
    box-shadow: 0 6px 24px rgba(0,0,0,0.2);
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
    max-width: 280px;
}
.matla-toast.show { opacity: 1; transform: translateY(0); }
.matla-toast-success { background: #059669; }
.matla-toast-error   { background: #dc2626; }
.matla-toast-info    { background: #1e40af; }

/* ════════════════════════════════════════════════════════════════════════════
   DASHBOARD WELCOME SECTION
   ════════════════════════════════════════════════════════════════════════════ */
.dw-wrap { padding: 1rem; }
.dw-hero {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}
.dw-av {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: #fff;
    font-size: 1.4rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(30,64,175,0.3);
}
.dw-info { flex: 1; min-width: 0; }
.dw-info h1 {
    font-size: clamp(1.2rem, 3vw, 1.75rem);
    font-weight: 800;
    color: var(--color-text-primary, #111827);
    margin-bottom: 0.25rem;
}
.dw-info p { font-size: 0.88rem; color: var(--color-text-secondary, #6b7280); margin-bottom: 0.75rem; }
.dw-bar {
    height: 8px;
    background: var(--color-bg-tertiary, #e5e7eb);
    border-radius: 99px;
    overflow: hidden;
    margin-bottom: 0.4rem;
}
.dw-fill {
    height: 100%;
    background: linear-gradient(90deg, #1e40af, #3b82f6);
    border-radius: 99px;
    transition: width 0.8s ease;
}
.dw-pct { font-size: 0.8rem; color: var(--color-text-secondary, #6b7280); }

.dw-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
}
@media (max-width: 600px) { .dw-stats { grid-template-columns: repeat(2, 1fr); } }
.dw-stat {
    background: var(--color-bg-secondary, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    text-align: center;
    transition: transform 0.2s ease;
}
.dw-stat:hover { transform: translateY(-2px); }
.dw-stat i { font-size: 1.1rem; color: #3b82f6; }
.dw-stat span { font-size: 1.3rem; font-weight: 800; color: var(--color-text-primary, #111827); }
.dw-stat label { font-size: 0.74rem; color: var(--color-text-secondary, #6b7280); }

.dw-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.dw-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.3rem;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    border: none;
    cursor: pointer;
}
.dw-btn:hover { transform: translateY(-2px); }
.dw-primary  { background: linear-gradient(135deg, #1e40af, #3b82f6); color: #fff; box-shadow: 0 4px 14px rgba(30,64,175,0.3); }
.dw-secondary { background: linear-gradient(135deg, #065f46, #10b981); color: #fff; box-shadow: 0 4px 14px rgba(16,185,129,0.3); }
.dw-ghost    { background: var(--color-bg-secondary, #f3f4f6); color: var(--color-text-primary, #374151); border: 1px solid var(--color-border, #e5e7eb); }

/* Body offset for fixed nav */
body { padding-top: var(--nav-h, 70px); }
.enhanced-nav ~ section,
.enhanced-nav ~ main,
body > section:first-of-type { margin-top: 0; }
"""

with open('styles.css', 'a', encoding='utf-8') as f:
    f.write(css)

print('CSS appended successfully.')
