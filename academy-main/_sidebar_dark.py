css = """
/* ════════════════════════════════════════════════════════════════════════════
   SIDEBAR — ALWAYS DARK (final word, beats every per-theme rule above)
   Written last so source-order + !important wins unconditionally.
   ════════════════════════════════════════════════════════════════════════════ */

/* 1. Sidebar shell background — covers every possible [data-theme] value */
.sidebar,
[data-theme] .sidebar,
[data-theme="light"]    .sidebar,
[data-theme="dark"]     .sidebar,
[data-theme="ocean"]    .sidebar,
[data-theme="forest"]   .sidebar,
[data-theme="sunset"]   .sidebar,
[data-theme="midnight"] .sidebar,
[data-theme="blue"]     .sidebar,
[data-theme="grey"]     .sidebar,
[data-theme="yellow"]   .sidebar,
[data-theme="high-contrast"] .sidebar {
    background: linear-gradient(160deg, #0f172a 0%, #1a2744 55%, #0f1a35 100%) !important;
    color: #e2e8f0 !important;
    color-scheme: dark !important;
    border-right-color: rgba(255,255,255,0.07) !important;
}

/* 2. Force all CSS variables inside the sidebar to dark values */
.sidebar *,
[data-theme] .sidebar * {
    --color-text-primary:    #e2e8f0 !important;
    --color-text-secondary:  #94a3b8 !important;
    --color-text-tertiary:   #64748b !important;
    --color-bg-primary:      #0f172a !important;
    --color-bg-secondary:    rgba(255,255,255,0.06) !important;
    --color-bg-tertiary:     rgba(255,255,255,0.1) !important;
    --color-border:          rgba(255,255,255,0.08) !important;
    --color-border-dark:     rgba(255,255,255,0.14) !important;
    --matla-blue:            #60a5fa !important;
    --color-text-inverse:    #0f172a !important;
}

/* 3. Explicit colour lock on every sb-* element */
.sidebar .sb-inner               { background: transparent !important; }
.sidebar .sb-head                { border-bottom-color: rgba(255,255,255,0.08) !important; }
.sidebar .sb-brandname           { color: #e2e8f0 !important; }
.sidebar .sb-close-btn           { color: rgba(255,255,255,0.5) !important; }
.sidebar .sb-close-btn:hover     { background: rgba(255,255,255,0.1) !important; color: #e2e8f0 !important; }

.sidebar .sb-profile             { border-bottom-color: rgba(255,255,255,0.08) !important; }
.sidebar .sb-av                  { background: linear-gradient(135deg,#1e40af,#3b82f6) !important; color: #fff !important; }
.sidebar .sb-dot                 { background: #10b981 !important; border-color: #0f172a !important; }
.sidebar .sb-pname               { color: #e2e8f0 !important; }
.sidebar .sb-pemail              { color: #94a3b8 !important; }

.sidebar .sb-search-wrap         { border-bottom-color: rgba(255,255,255,0.08) !important; }
.sidebar .sb-search              { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.1) !important; color: #e2e8f0 !important; }
.sidebar .sb-search:focus        { background: rgba(255,255,255,0.1) !important; border-color: rgba(59,130,246,0.5) !important; }
.sidebar .sb-sicon               { color: rgba(255,255,255,0.35) !important; }

.sidebar .sb-glabel              { color: rgba(255,255,255,0.35) !important; }
.sidebar .sb-item                { color: rgba(255,255,255,0.7) !important; background: transparent !important; }
.sidebar .sb-item:hover          { background: rgba(255,255,255,0.08) !important; color: #e2e8f0 !important; }
.sidebar .sb-item.sb-active      { background: rgba(59,130,246,0.2) !important; color: #93c5fd !important; }
.sidebar .sb-item.sb-active i    { color: #60a5fa !important; }
.sidebar .sb-item i              { color: inherit !important; }

.sidebar .sb-stats               { border-color: rgba(255,255,255,0.08) !important; background: transparent !important; }
.sidebar .sb-stat                { border-right-color: rgba(255,255,255,0.08) !important; background: transparent !important; }
.sidebar .sb-sv                  { color: #e2e8f0 !important; }
.sidebar .sb-sl                  { color: #94a3b8 !important; }

.sidebar .sb-export-btn          { background: rgba(59,130,246,0.15) !important; color: #93c5fd !important; border-color: rgba(59,130,246,0.25) !important; }
.sidebar .sb-export-btn:hover    { background: rgba(59,130,246,0.25) !important; }
.sidebar .sb-signout-btn         { background: rgba(239,68,68,0.1) !important; color: #fca5a5 !important; border-color: rgba(239,68,68,0.2) !important; }
.sidebar .sb-signout-btn:hover   { background: rgba(239,68,68,0.2) !important; }
"""

with open('styles.css', 'a', encoding='utf-8') as f:
    f.write(css)
print('Done.')
