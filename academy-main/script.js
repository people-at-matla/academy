'use strict';

/* ════════════════════════════════════════════════════════════════════════════
   Shared localStorage keys & Menner Readiness Formula
   ════════════════════════════════════════════════════════════════════════════ */
const MATLA_PASSMARK_KEY      = 'matla_passmark';
const MATLA_ANNOUNCEMENTS_KEY = 'matla_announcements';
const MATLA_LIVE_STREAM_KEY   = 'matla_live_stream';
const MATLA_SMS_KEY           = 'matla_sales_managers';

function calcMennerScore(student) {
  var leads         = parseFloat(student.leads);
  var conversions   = parseFloat(student.conversions);
  var weeklyAcadAvg = parseFloat(student.weeklyAcademicAvg);
  var finalExam1    = parseFloat(student.finalExam1);
  var finalExam2    = parseFloat(student.finalExam2);
  var inputs = [leads, conversions, weeklyAcadAvg, finalExam1, finalExam2];
  if (inputs.some(function(v){ return isNaN(v) || v < 0; })) {
    return { error: 'Invalid Input' };
  }
  var leadScore     = leads / 20;
  var convScore     = leads > 0 ? conversions / leads : 0;
  var salesScore    = leadScore * convScore;
  var finalExamAvg  = (finalExam1 + finalExam2) / 2;
  var academicScore = (weeklyAcadAvg + finalExamAvg) / 2;
  var finalScore    = salesScore * academicScore;
  var status;
  if (finalScore >= 0.845)     status = 'Promoted';
  else if (finalScore >= 0.50) status = 'Ready for Final';
  else                         status = 'Not Ready';
  return {
    salesScore:    Math.round(salesScore    * 1000) / 1000,
    academicScore: Math.round(academicScore * 1000) / 1000,
    finalScore:    Math.round(finalScore    * 1000) / 1000,
    status: status
  };
}

/* ════════════════════════════════════════════════════════════════════════════
   ThemeManager
   ════════════════════════════════════════════════════════════════════════════ */
class ThemeManager {
    static THEMES = ['light', 'dark', 'grey', 'blue'];
    static ICONS  = { light:'fa-moon', dark:'fa-sun', grey:'fa-circle-half-stroke', blue:'fa-water' };

    static apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('matla-theme', theme);
        const btn = document.getElementById('navThemeBtn');
        if (btn) {
            const ico = btn.querySelector('i');
            if (ico) ico.className = `fas ${this.ICONS[theme] || 'fa-circle-half-stroke'}`;
        }
    }

    static init() {
        const saved = localStorage.getItem('matla-theme') || 'light';
        this.apply(saved);
    }

    static cycle() {
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        const idx = this.THEMES.indexOf(cur);
        this.apply(this.THEMES[(idx + 1) % this.THEMES.length]);
    }
}

/* ════════════════════════════════════════════════════════════════════════════
   NavigationManager
   ════════════════════════════════════════════════════════════════════════════ */
class NavigationManager {
    constructor() {
        this.page    = window.location.pathname.split('/').pop() || 'home.html';
        this.profile = this._loadProfile();
    }

    _loadProfile() {
        // Compute real programme progress from course localStorage data
        function lsJ(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch(e) { return {}; } }
        const sales  = lsJ('matla_crs_sales');
        const rma    = lsJ('matla_crs_rma');
        const cap    = lsJ('matla_crs_capital');
        const fais   = lsJ('matla_crs_fais');
        const fin    = lsJ('matla_crs_fin_lit');
        const w1Ass  = lsJ('matla_assess_w1');

        const salesF = Math.min(((sales.completed || []).length) / 6,  1);
        const rmaF   = Math.max(Math.min(((rma.completed||[]).length)/7,1), Math.min(((cap.completed||[]).length)/7,1));
        const faisF  = Math.min(((fais.completed || []).length) / 7,  1);
        const finF   = Math.min(((fin.completed  || []).length) / 8,  1);
        const w1F    = (salesF + rmaF + faisF + finF) / 4;
        let   prg    = Math.round(w1F * 25);
        if (w1Ass.submitted) prg = Math.min(prg + 5, 30);

        // Derive current module label from actual progress
        let module = 'Sales Mod 1';
        if (salesF < 1) {
            module = 'Sales M' + Math.min((sales.completed||[]).length + 1, 6);
        } else if (rmaF < 1) {
            const n = Math.max((rma.completed||[]).length, (cap.completed||[]).length) + 1;
            module = 'Product M' + Math.min(n, 7);
        } else if (faisF < 1) {
            module = 'FAIS M' + Math.min((fais.completed||[]).length + 1, 7);
        } else if (finF < 1) {
            module = 'FinLit M' + Math.min((fin.completed||[]).length + 1, 8);
        } else if (!w1Ass.submitted) {
            module = 'W1 Assessment';
        } else {
            module = 'Week 2';
        }

        const d = {
            name:     'Student',
            email:    localStorage.getItem('userEmail') || 'student@matla.co.za',
            progress: prg,
            module:   module
        };
        try {
            const stored = JSON.parse(localStorage.getItem('matlaProfile') || '{}');
            // Use stored name/email/level/xp but always use freshly-computed progress & module
            return Object.assign({}, d, stored, { progress: prg, module: module });
        }
        catch { return d; }
    }

    _initials() {
        return (this.profile.name || 'ST')
            .split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || 'ST';
    }

    _crumb() {
        const map = {
            'home.html':        'Home',
            '':                 'Home',
            'courses.html':     'Courses',
            'dashboard.html':   'Dashboard',
            'meneer-ai.html':   'Meneer AI',
            'profile.html':     'Profile',
            'assessments.html': 'Assessments',
            'export.html':      'Export',
            'graduation.html':  'Graduation',
            'cover.html':       'Cover Letter'
        };
        return map[this.page] || 'Page';
    }

    /* ────────────────── Top Navigation ────────────────── */
    renderTopNav() {
        const nav = document.querySelector('.enhanced-nav');
        if (!nav) return;

        const p    = this.profile;
        const prg  = p.progress || 0;
        const C    = 2 * Math.PI * 16;
        const off  = (C - (prg / 100) * C).toFixed(2);
        const date = new Date().toLocaleDateString('en-ZA', { weekday:'short', day:'numeric', month:'short' });
        const ini  = this._initials();

        nav.innerHTML = `
<div class="nav-content">

  <div class="nav-left">
    <button class="nav-hamburger" onclick="toggleSidebar()" aria-label="Open menu">
      <i class="fas fa-chevron-right"></i>
    </button>
    <a href="home.html" class="nav-brand">
      <img src="Matla Academy .png" alt="Matla" class="nav-logo-img"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <span class="nav-logo-fallback">M</span>
    </a>
    <span class="nav-sep">/</span>
    <span class="nav-crumb">${this._crumb()}</span>
  </div>

  <div class="nav-center">
    <button class="nav-pill nav-date-pill" id="calToggle" onclick="toggleCalPanel()" title="View calendar">
      <i class="fas fa-calendar-alt"></i>${date}
    </button>
    <button class="nav-ring-wrap" id="progToggle" onclick="toggleProgPanel()" title="View your progress" style="border:none;background:none;cursor:pointer;padding:0;">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="3"/>
        <circle cx="20" cy="20" r="16" fill="none" stroke="#f59e0b" stroke-width="3"
                stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${off}"
                stroke-linecap="round" transform="rotate(-90 20 20)"/>
      </svg>
      <span class="nav-ring-pct">${prg}%</span>
    </button>
    <button class="nav-pill nav-mod-pill" id="modToggle" onclick="toggleModPanel()" title="Current module">
      <i class="fas fa-book-open"></i>${p.module}
    </button>
  </div>

  <div class="nav-right">
    <button class="nav-icon-btn" id="notifToggle" onclick="toggleNotifPanel()" title="Notifications">
      <i class="fas fa-bell"></i>
      <span class="nav-badge">3</span>
    </button>
    <button class="nav-icon-btn" id="navThemeBtn" onclick="ThemeManager.cycle()" title="Switch theme">
      <i class="fas fa-moon"></i>
    </button>
    <div class="nav-chip" id="navChip" onclick="toggleUserMenu()">
      <div class="nav-chip-av">${ini}</div>
      <span class="nav-chip-name">${(p.name || 'Student').split(' ')[0]}</span>
      <i class="fas fa-chevron-down nav-chip-caret"></i>
    </div>
  </div>

</div>

<div class="nav-dropdown" id="navDropdown">
  <a href="profile.html"><i class="fas fa-user-circle"></i>Profile</a>
  <a href="dashboard.html"><i class="fas fa-tachometer-alt"></i>Dashboard</a>
  <a href="export.html"><i class="fas fa-download"></i>Export Data</a>
  <div class="nav-dd-sep"></div>
  <a href="#" onclick="signOut();return false;"><i class="fas fa-sign-out-alt"></i>Sign Out</a>
</div>

<div class="nav-notif-panel" id="notifPanel">
  <div class="nnp-header">
    <span>Notifications</span>
    <button onclick="toggleNotifPanel()"><i class="fas fa-times"></i></button>
  </div>
  <div class="nnp-list">
    <div class="nnp-item nnp-unread">
      <i class="fas fa-trophy nnp-icon nnp-award"></i>
      <div class="nnp-body"><strong>Achievement Unlocked!</strong><p>You completed Module 1 with 96%.</p></div>
    </div>
    <div class="nnp-item nnp-unread">
      <i class="fas fa-calendar-check nnp-icon nnp-cal"></i>
      <div class="nnp-body"><strong>Webinar Tomorrow</strong><p>JFA Live Q&amp;A at 10:00 AM.</p></div>
    </div>
    <div class="nnp-item">
      <i class="fas fa-star nnp-icon nnp-star"></i>
      <div class="nnp-body"><strong>New Course Live</strong><p>Advanced Portfolio Management available.</p></div>
    </div>
  </div>
</div>

<div class="nav-cal-panel" id="calPanel"></div>

<div class="nav-prog-panel" id="progPanel"></div>

<div class="nav-mod-panel" id="modPanel"></div>`;
    }

    /* ────────────────── Sidebar ────────────────────────── */
    renderSidebar() {
        const el = document.getElementById('sidebar');
        if (!el) return;

        const p   = this.profile;
        const ini = this._initials();
        const prg = p.progress || 0;
        const C14 = (2 * Math.PI * 14).toFixed(2);
        const off = (2 * Math.PI * 14 * (1 - prg / 100)).toFixed(2);

        const groups = [
            { label: 'Main', items: [
                { icon:'fa-home',           label:'Home',         href:'index.html'       },
                { icon:'fa-tachometer-alt', label:'Dashboard',    href:'dashboard.html'   },
                { icon:'fa-book',           label:'Courses',      href:'courses.html'     },
                { icon:'fa-robot',          label:'Meneer AI',    href:'meneer-ai.html',  badge:'AI' },
            ]},
            { label: 'Progress', items: [
                { icon:'fa-clipboard-check',label:'Assessments',  href:'assessments.html' },
                { icon:'fa-graduation-cap', label:'Graduation',   href:'graduation.html'  },
            ]},
            { label: 'Account', items: [
                { icon:'fa-user-circle',    label:'Profile',      href:'profile.html'     },
                { icon:'fa-download',       label:'Export Data',  href:'export.html'      },
            ]},
        ];

        const navHTML = groups.map(g => `
<div class="sb-group" data-group>
  <span class="sb-glabel">${g.label}</span>
  ${g.items.map(it => `<a href="${it.href}" class="sb-item${this.page === it.href ? ' sb-active' : ''}">
    <i class="fas ${it.icon}"></i><span>${it.label}</span>${it.badge ? `<span class="sb-badge">${it.badge}</span>` : ''}
  </a>`).join('')}
</div>`).join('');

        el.innerHTML = `
<div class="sb-inner">

  <div class="sb-head">
    <div class="sb-brand">
      <img src="Matla Academy .png" alt="Matla" class="sb-logo" onerror="this.style.display='none'">
      <span class="sb-brandname">Matla Academy</span>
    </div>
    <button class="sb-close-btn" onclick="toggleSidebar()" aria-label="Close">
      <i class="fas fa-times"></i>
    </button>
  </div>

  <div class="sb-profile">
    <div class="sb-av-wrap">
      <div class="sb-av">${ini}</div>
      <span class="sb-dot"></span>
    </div>
    <div class="sb-pinfo">
      <div class="sb-pname">${p.name || 'Student'}</div>
      <div class="sb-pemail">${p.email || ''}</div>
    </div>
    <div class="sb-ring" title="${prg}% done">
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="3"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" stroke-width="3"
                stroke-dasharray="${C14}" stroke-dashoffset="${off}"
                stroke-linecap="round" transform="rotate(-90 18 18)"/>
      </svg>
      <span>${prg}%</span>
    </div>
  </div>

  <div class="sb-search-wrap">
    <i class="fas fa-search sb-sicon"></i>
    <input class="sb-search" type="text" placeholder="Search menu…" oninput="filterSidebarNav(this.value)">
  </div>

  <nav class="sb-nav">${navHTML}</nav>

  <div class="sb-stats">
    <div class="sb-stat"><span class="sb-sv">${p.xp || 0}</span><span class="sb-sl">XP</span></div>
    <div class="sb-stat"><span class="sb-sv">Lvl ${p.level || 1}</span><span class="sb-sl">Level</span></div>
    <div class="sb-stat"><span class="sb-sv">${prg}%</span><span class="sb-sl">Progress</span></div>
  </div>

  ${p.teamName ? `<div style="padding:.4rem 1rem .6rem;font-size:.72rem;color:rgba(255,255,255,.5)"><i class="fas fa-users" style="margin-right:.3rem"></i>${p.teamName}</div>` : ''}

  <div id="watchLiveWrap" style="padding:.5rem 1rem;display:none">
    <button onclick="openLiveStream()" class="watch-live-btn" style="width:100%;padding:.6rem;background:#dc2626;color:#fff;border:none;border-radius:.5rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem">
      <i class="fas fa-circle" style="font-size:.5rem;animation:live-pulse 2s infinite"></i> Watch Live
    </button>
  </div>

  <div class="sb-foot">
    <a href="export.html" class="sb-export-btn"><i class="fas fa-file-export"></i>Export Progress</a>
    <button class="sb-signout-btn" onclick="signOut()"><i class="fas fa-sign-out-alt"></i>Sign Out</button>
  </div>

</div>`;
    }

    /* ────────────────── Footer ─────────────────────────── */
    renderFooter() {
        const el = document.getElementById('main-footer');
        if (!el) return;

        el.innerHTML = `
<div class="footer-wrap">
  <div class="footer-top">

    <div class="footer-brand-col">
      <img src="Matla Academy .png" alt="Matla Academy" class="footer-logo-img"
           onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
      <span class="footer-logo-fallback">MATLA</span>
      <p class="footer-tagline">South Africa's premier JFA training platform.<br>FSCA-accredited &middot; AI-powered &middot; 100% online.</p>
      <div class="footer-social">
        <a href="#" title="Facebook" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
        <a href="#" title="LinkedIn" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
        <a href="#" title="Twitter/X" aria-label="X"><i class="fab fa-x-twitter"></i></a>
        <a href="#" title="Instagram" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
      </div>
    </div>

    <div class="footer-links-grid">
      <div class="footer-col">
        <h4>Platform</h4>
        <a href="index.html">Home</a>
        <a href="courses.html">Courses</a>
        <a href="dashboard.html">Dashboard</a>
        <a href="meneer-ai.html">Meneer AI</a>
        <a href="assessments.html">Assessments</a>
      </div>
      <div class="footer-col">
        <h4>Progress</h4>
        <a href="graduation.html">Graduation</a>
        <a href="cover.html">Cover Letter</a>
        <a href="export.html">Export Data</a>
        <a href="profile.html">My Profile</a>
      </div>
      <div class="footer-col">
        <h4>Support</h4>
        <a href="#">Help Centre</a>
        <a href="#">Contact Us</a>
        <a href="#">FSCA Info</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Use</a>
      </div>
    </div>

  </div>
  <div class="footer-bottom">
    <span>&copy; ${new Date().getFullYear()} Matla Academy. All rights reserved.</span>
    <span class="footer-badges">
      <i class="fas fa-shield-alt"></i> FSCA Accredited &nbsp;&middot;&nbsp;
      <i class="fas fa-lock"></i> Secure Platform
    </span>
  </div>
</div>`;
    }

    /* ────────────────── Floating elements ──────────────── */
    renderFloatingElements() {
        const old = document.getElementById('floatingElements');
        if (old) old.remove();

        const wrap = document.createElement('div');
        wrap.id = 'floatingElements';

        if (this.page !== 'meneer-ai.html') {
            wrap.innerHTML = `
<div id="fchatWidget" class="fch-widget">
  <div class="fch-panel" id="fchatPanel">
    <div class="fch-hdr">
      <div class="fch-hdr-info">
        <div class="fch-av-sm"><i class="fas fa-headset"></i></div>
        <div>
          <div class="fch-title">Live Support</div>
          <div class="fch-sub"><span class="fch-online-dot"></span>Support Team &middot; AI-assisted</div>
        </div>
      </div>
      <button class="fch-close-btn" onclick="toggleFChat()"><i class="fas fa-times"></i></button>
    </div>
    <div class="fch-msgs" id="fchatMsgs">
      <div class="fch-bubble fch-ai">
        <div class="fch-binner">Hi! Welcome to Matla Academy support. How can we help you today?</div>
      </div>
    </div>
    <div class="fch-input-row">
      <input type="text" id="fchatInput" class="fch-input" placeholder="Type your message&hellip;"
             onkeydown="if(event.key==='Enter')fchatSend()">
      <button class="fch-send-btn" onclick="fchatSend()"><i class="fas fa-paper-plane"></i></button>
    </div>
  </div>
  <button class="fch-fab" onclick="toggleFChat()" title="Live Support">
    <i class="fas fa-headset" id="fchatFabIcon"></i>
    <span class="fch-dot"></span>
  </button>
</div>`;
        }

        document.body.appendChild(wrap);
    }

    /* ────────────────── Course filtering ───────────────── */
    filterCourses(query) {
        const q = (query || '').toLowerCase();
        document.querySelectorAll('#courseGrid .course-card').forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    }
}

/* ════════════════════════════════════════════════════════════════════════════
   Global helpers (exposed as window globals for inline onclick handlers)
   ════════════════════════════════════════════════════════════════════════════ */
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.querySelector('.sidebar-overlay');
    if (!sb) return;
    const open = sb.classList.toggle('open');
    if (ov) ov.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
}

function toggleUserMenu() {
    const dd = document.getElementById('navDropdown');
    if (!dd) return;
    dd.classList.toggle('open');
    if (dd.classList.contains('open')) {
        const close = e => {
            const chip = document.getElementById('navChip');
            if (!dd.contains(e.target) && (!chip || !chip.contains(e.target))) {
                dd.classList.remove('open');
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    }
}

function toggleNotifPanel() {
    const panel  = document.getElementById('notifPanel');
    const toggle = document.getElementById('notifToggle');
    if (!panel) return;
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
        const close = e => {
            if (!panel.contains(e.target) && (!toggle || !toggle.contains(e.target))) {
                panel.classList.remove('open');
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    }
}

/* ── Calendar panel ─────────────────────────────────────────────────────── */
const _cal = { open: false, expanded: false, y: new Date().getFullYear(), m: new Date().getMonth() };

const _calEvts = (() => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const d = n => { const x = new Date(t); x.setDate(x.getDate() + n); return x; };
    return [
        { date: d(0),  label: 'JFA Live Q&A',        time: '10:00 AM', col: '#2563eb' },
        { date: d(2),  label: 'Module 2 Assessment',  time: '2:00 PM',  col: '#d97706' },
        { date: d(4),  label: 'Leadership Workshop',  time: '9:00 AM',  col: '#16a34a' },
        { date: d(6),  label: 'Mentorship Session',   time: '11:00 AM', col: '#7c3aed' },
        { date: d(10), label: 'Portfolio Review',     time: '3:00 PM',  col: '#e85d2a' },
        { date: d(13), label: 'Certification Prep',   time: '10:30 AM', col: '#2563eb' },
    ];
})();

function toggleCalPanel() {
    const panel  = document.getElementById('calPanel');
    const toggle = document.getElementById('calToggle');
    if (!panel) return;
    _cal.open = !_cal.open;
    if (_cal.open) {
        renderCalendar();
        panel.classList.add('open');
        const close = e => {
            if (!panel.contains(e.target) && (!toggle || !toggle.contains(e.target))) {
                _cal.open = false;
                _cal.expanded = false;
                panel.classList.remove('open');
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    } else {
        _cal.expanded = false;
        panel.classList.remove('open');
    }
}

function renderCalendar() {
    const panel = document.getElementById('calPanel');
    if (!panel) return;
    const y = _cal.y, m = _cal.m;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const mNames = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    const dNames = ['S','M','T','W','T','F','S'];
    const firstWd = new Date(y, m, 1).getDay();
    const daysInMo = new Date(y, m + 1, 0).getDate();

    let cells = '';
    for (let i = 0; i < firstWd; i++) cells += '<div class="ncp-day ncp-day-empty"></div>';
    for (let d = 1; d <= daysInMo; d++) {
        const dt = new Date(y, m, d);
        const isToday  = dt.getTime() === today.getTime();
        const hasEvt   = _calEvts.some(e => e.date.getTime() === dt.getTime());
        const isPast   = dt < today && !isToday;
        cells += `<div class="ncp-day${isToday ? ' ncp-today' : ''}${hasEvt ? ' ncp-has-evt' : ''}${isPast ? ' ncp-past' : ''}">${d}</div>`;
    }

    const upcoming = _calEvts.filter(e => e.date >= today).sort((a, b) => a.date - b.date);
    const evtHTML = upcoming.map(e => {
        const isTd = e.date.getTime() === today.getTime();
        const ds = isTd ? 'Today' : e.date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
        return `<div class="ncp-evt-item">
  <span class="ncp-evt-dot" style="background:${e.col}"></span>
  <div class="ncp-evt-body">
    <span class="ncp-evt-label">${e.label}</span>
    <span class="ncp-evt-time">${ds} · ${e.time}</span>
  </div>
</div>`;
    }).join('') || '<p class="ncp-no-evts">No upcoming events</p>';

    panel.innerHTML = `
<div class="ncp-top">
  <button class="ncp-nav-btn" onclick="calPrevMonth()"><i class="fas fa-chevron-left"></i></button>
  <span class="ncp-month-label">${mNames[m]} ${y}</span>
  <button class="ncp-nav-btn" onclick="calNextMonth()"><i class="fas fa-chevron-right"></i></button>
</div>
<div class="ncp-days-hdr">${dNames.map(n => `<span>${n}</span>`).join('')}</div>
<div class="ncp-grid">${cells}</div>
<button class="ncp-expand-bar" onclick="calToggleExpand()">
  <span>${_cal.expanded ? 'Hide events' : 'Upcoming events'}</span>
  <i class="fas fa-chevron-${_cal.expanded ? 'up' : 'down'}"></i>
</button>
<div class="ncp-events-wrap${_cal.expanded ? ' ncp-events-open' : ''}">${evtHTML}</div>`;
}

function calPrevMonth() {
    _cal.m--; if (_cal.m < 0) { _cal.m = 11; _cal.y--; } renderCalendar();
}
function calNextMonth() {
    _cal.m++; if (_cal.m > 11) { _cal.m = 0; _cal.y++; } renderCalendar();
}
function calToggleExpand() {
    _cal.expanded = !_cal.expanded;
    const panel = document.getElementById('calPanel');
    if (!panel) return;
    const wrap = panel.querySelector('.ncp-events-wrap');
    const bar  = panel.querySelector('.ncp-expand-bar');
    if (wrap) wrap.classList.toggle('ncp-events-open', _cal.expanded);
    if (bar) {
        const sp = bar.querySelector('span');
        const ic = bar.querySelector('i');
        if (sp) sp.textContent = _cal.expanded ? 'Hide events' : 'Upcoming events';
        if (ic) ic.className  = `fas fa-chevron-${_cal.expanded ? 'up' : 'down'}`;
    }
}

/* ── Progress Panel ──────────────────────────────────────────────────────── */
function toggleProgPanel() {
    const panel  = document.getElementById('progPanel');
    const toggle = document.getElementById('progToggle');
    if (!panel) return;
    const opening = !panel.classList.contains('open');
    // close other panels
    ['notifPanel','calPanel','modPanel'].forEach(id => {
        const p = document.getElementById(id);
        if (p) p.classList.remove('open');
    });
    if (opening) {
        renderProgPanel();
        panel.classList.add('open');
        const close = e => {
            if (!panel.contains(e.target) && (!toggle || !toggle.contains(e.target))) {
                panel.classList.remove('open');
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    } else {
        panel.classList.remove('open');
    }
}

function renderProgPanel() {
    const panel = document.getElementById('progPanel');
    if (!panel) return;
    let prg = 0, xp = 0, streak = 0;
    try {
        const p = JSON.parse(localStorage.getItem('matlaProfile') || '{}');
        prg = p.progress || 42;
        const cs = JSON.parse(localStorage.getItem('matla_crs_sales') || '{}');
        xp = cs.xp || 0;
        streak = parseInt(localStorage.getItem('matla_streak') || '3');
    } catch {}

    const C = 2 * Math.PI * 24;
    const off = (C - (prg / 100) * C).toFixed(2);
    const weeks = [
        { label: 'Week 1', done: 1, total: 4, color: '#2563eb' },
        { label: 'Week 2', done: 0, total: 4, color: '#7c3aed', locked: true },
        { label: 'Week 3', done: 0, total: 4, color: '#0891b2', locked: true },
        { label: 'Week 4', done: 0, total: 4, color: '#d97706', locked: true },
    ];

    panel.innerHTML = `
<div class="npp-header">
  <span><i class="fas fa-chart-line" style="margin-right:0.4rem;color:#f59e0b;"></i>Your Progress</span>
  <button onclick="toggleProgPanel()"><i class="fas fa-times"></i></button>
</div>
<div class="npp-body">
  <div class="npp-overview">
    <div class="npp-ring-wrap">
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="5"/>
        <circle cx="30" cy="30" r="24" fill="none" stroke="#f59e0b" stroke-width="5"
                stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${off}"
                stroke-linecap="round" transform="rotate(-90 30 30)"/>
      </svg>
      <div class="npp-ring-val">${prg}%</div>
    </div>
    <div class="npp-overview-text">
      <div class="npp-overview-pct">${prg}% Complete</div>
      <div class="npp-overview-sub">JFA → FA Programme</div>
      <div class="npp-streak"><i class="fas fa-fire" style="color:#ea580c;"></i> ${streak}-day streak</div>
    </div>
  </div>

  <div class="npp-weeks">
    ${weeks.map(w => `
    <div class="npp-week${w.locked ? ' npp-week-locked' : ''}">
      <div class="npp-week-label">
        <span>${w.label}</span>
        <span style="color:${w.locked ? 'var(--color-text-secondary,#9ca3af)' : w.color};">${w.locked ? '🔒 Locked' : w.done + '/' + w.total + ' courses'}</span>
      </div>
      <div class="npp-week-bar-wrap">
        <div class="npp-week-bar" style="width:${w.locked ? 0 : (w.done/w.total*100)}%;background:${w.color};"></div>
      </div>
    </div>`).join('')}
  </div>

  <div class="npp-xp-row">
    <div class="npp-xp-block">
      <div class="npp-xp-val">${xp}</div>
      <div class="npp-xp-lbl">XP Earned</div>
    </div>
    <div class="npp-xp-block">
      <div class="npp-xp-val">1</div>
      <div class="npp-xp-lbl">Course Done</div>
    </div>
    <div class="npp-xp-block">
      <div class="npp-xp-val">${streak}</div>
      <div class="npp-xp-lbl">Day Streak</div>
    </div>
  </div>

  <div class="npp-next">
    <span class="npp-next-lbl">Up next</span>
    <a href="courses.html" class="npp-next-link">
      <i class="fas fa-layer-group"></i> Product Knowledge
      <i class="fas fa-arrow-right" style="margin-left:auto;font-size:0.75rem;"></i>
    </a>
  </div>
  <a href="dashboard.html" class="npp-dash-btn">View Full Dashboard</a>
</div>`;
}

/* ── Module Panel ────────────────────────────────────────────────────────── */
function toggleModPanel() {
    const panel  = document.getElementById('modPanel');
    const toggle = document.getElementById('modToggle');
    if (!panel) return;
    const opening = !panel.classList.contains('open');
    ['notifPanel','calPanel','progPanel'].forEach(id => {
        const p = document.getElementById(id);
        if (p) p.classList.remove('open');
    });
    if (opening) {
        renderModPanel();
        panel.classList.add('open');
        const close = e => {
            if (!panel.contains(e.target) && (!toggle || !toggle.contains(e.target))) {
                panel.classList.remove('open');
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    } else {
        panel.classList.remove('open');
    }
}

function renderModPanel() {
    const panel = document.getElementById('modPanel');
    if (!panel) return;
    let modName = 'Module 2';
    try { const p = JSON.parse(localStorage.getItem('matlaProfile') || '{}'); modName = p.module || 'Module 2'; } catch {}

    const topics = [
        { icon: 'fa-layer-group', label: 'Matla Product Suite Overview' },
        { icon: 'fa-shield-alt',  label: 'Life Cover Fundamentals' },
        { icon: 'fa-coins',       label: 'Funeral Cover Structures' },
        { icon: 'fa-chart-bar',   label: 'Premium Calculation Basics' },
        { icon: 'fa-users',       label: 'Group vs. Individual Cover' },
        { icon: 'fa-file-alt',    label: 'Policy Documentation' },
        { icon: 'fa-question-circle', label: 'Client FAQ Handling' },
    ];

    panel.innerHTML = `
<div class="nmp-header">
  <span><i class="fas fa-book-open" style="margin-right:0.4rem;color:#059669;"></i>${modName}</span>
  <button onclick="toggleModPanel()"><i class="fas fa-times"></i></button>
</div>
<div class="nmp-body">
  <div class="nmp-course-row">
    <div class="nmp-course-icon" style="background:linear-gradient(135deg,#0e7490,#0891b2);">
      <i class="fas fa-layer-group"></i>
    </div>
    <div>
      <div class="nmp-course-name">Product Knowledge</div>
      <div class="nmp-course-meta">Week 1 · Tuesday · 50 min · 7 topics</div>
    </div>
  </div>

  <div class="nmp-prog-row">
    <span>Progress: 35%</span>
    <span style="color:var(--color-text-secondary,#9ca3af);">2 / 7 topics</span>
  </div>
  <div class="nmp-bar-wrap">
    <div class="nmp-bar-fill" style="width:35%;background:linear-gradient(90deg,#0e7490,#0891b2);"></div>
  </div>

  <div class="nmp-topics">
    ${topics.map((t, i) => `
    <div class="nmp-topic${i < 2 ? ' done' : ''}">
      <i class="fas ${i < 2 ? 'fa-check-circle' : 'fa-circle'}" style="color:${i < 2 ? '#10b981' : 'var(--color-border,#d1d5db)'};font-size:0.75rem;flex-shrink:0;"></i>
      <i class="fas ${t.icon}" style="color:var(--color-text-secondary,#6b7280);font-size:0.75rem;flex-shrink:0;"></i>
      <span>${t.label}</span>
    </div>`).join('')}
  </div>

  <a href="courses.html" class="nmp-cta-btn">
    <i class="fas fa-play"></i> Continue Course
  </a>
</div>`;
}

function filterSidebarNav(q) {
    const lo = (q || '').toLowerCase();
    document.querySelectorAll('.sb-item').forEach(it => {
        const txt = (it.querySelector('span') || {}).textContent || '';
        it.style.display = txt.toLowerCase().includes(lo) ? '' : 'none';
    });
    document.querySelectorAll('[data-group]').forEach(g => {
        const any = [...g.querySelectorAll('.sb-item')].some(i => i.style.display !== 'none');
        g.style.display = any ? '' : 'none';
    });
}

function signOut() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
}

function toggleFChat() {
    // Block chat while an assessment exam is actively running
    const examEl = document.getElementById('examInterface');
    if (examEl && examEl.style.display !== 'none' && examEl.style.display !== '') {
        showNotification('Live support is unavailable while your assessment is in progress. Complete or submit the exam first.', 'info');
        return;
    }
    const panel = document.getElementById('fchatPanel');
    const icon  = document.getElementById('fchatFabIcon');
    const dot   = document.querySelector('.fch-dot');
    if (!panel) return;
    const open = panel.classList.toggle('open');
    if (icon) icon.className = open ? 'fas fa-times' : 'fas fa-headset';
    if (dot)  dot.style.display = open ? 'none' : '';
}

function fchatSend() {
    const input = document.getElementById('fchatInput');
    const msgs  = document.getElementById('fchatMsgs');
    if (!input || !msgs) return;
    const text = input.value.trim();
    if (!text) return;

    msgs.innerHTML += `<div class="fch-bubble fch-user"><div class="fch-binner">${_esc(text)}</div></div>`;
    input.value = '';
    msgs.scrollTop = msgs.scrollHeight;

    const tid = 'ftyp_' + Date.now();
    msgs.innerHTML += `<div class="fch-bubble fch-ai" id="${tid}"><div class="fch-binner fch-typing"><span></span><span></span><span></span></div></div>`;
    msgs.scrollTop = msgs.scrollHeight;

    setTimeout(() => {
        const tyEl = document.getElementById(tid);
        if (tyEl) tyEl.remove();
        const replies = [
            `Thanks for reaching out! A support agent will follow up shortly. For course questions, try <a href="meneer-ai.html">Meneer AI &rarr;</a>`,
            `Got it! Our team has been notified. In the meantime, <a href="meneer-ai.html">Meneer AI</a> can answer most course &amp; JFA questions instantly.`,
            `We've received your message. Typical response time is under 2 hours. Need quick help? <a href="meneer-ai.html">Ask Meneer AI &rarr;</a>`,
            `Thanks! If this is urgent, please email <strong>support@matla.co.za</strong>. Otherwise we'll get back to you soon.`,
        ];
        msgs.innerHTML += `<div class="fch-bubble fch-ai"><div class="fch-binner">${replies[Math.floor(Math.random() * replies.length)]}</div></div>`;
        msgs.scrollTop = msgs.scrollHeight;
    }, 1200);
}

function _esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showNotification(msg, type) {
    type = type || 'info';
    const icons = { success:'check-circle', error:'exclamation-circle', info:'info-circle' };
    const t = document.createElement('div');
    t.className = `matla-toast matla-toast-${type}`;
    t.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i>${msg}`;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 350);
    }, 3500);
}

/* ════════════════════════════════════════════════════════════════════════════
   Smart navbar — hide on scroll down, show on scroll up
   ════════════════════════════════════════════════════════════════════════════ */
(function initSmartNav() {
    var lastY = 0, ticking = false;
    var THRESHOLD = 80;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                var nav = document.querySelector('.enhanced-nav');
                if (nav) {
                    var y = window.scrollY;
                    nav.classList.toggle('nav-hidden', y > lastY && y > THRESHOLD);
                    lastY = y;
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
})();

/* ════════════════════════════════════════════════════════════════════════════
   Canvas rain animation (hero page)
   ════════════════════════════════════════════════════════════════════════════ */
function initRain() {
    var canvas = document.getElementById('rainCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    var drops = [];
    for (var i = 0; i < 80; i++) {
        drops.push({
            x:     Math.random() * canvas.width,
            y:     Math.random() * canvas.height,
            speed: 2 + Math.random() * 4,
            len:   10 + Math.random() * 20,
            op:    0.05 + Math.random() * 0.12
        });
    }

    (function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drops.forEach(function (d) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - 1, d.y + d.len);
            ctx.strokeStyle = 'rgba(100,160,255,' + d.op + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
            d.y += d.speed;
            if (d.y > canvas.height) { d.y = -d.len; d.x = Math.random() * canvas.width; }
        });
        requestAnimationFrame(draw);
    })();
}

/* ════════════════════════════════════════════════════════════════════════════
   Intersection observer — scroll-triggered animations
   ════════════════════════════════════════════════════════════════════════════ */
function initScrollAnimations() {
    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(
        '.animate-on-scroll, .how-step, .t-card, .overview-card'
    ).forEach(function (el) { obs.observe(el); });
}

/* ════════════════════════════════════════════════════════════════════════════
   Home page features
   ════════════════════════════════════════════════════════════════════════════ */
function initHomePage() {
    // Re-engagement banner
    var pro = {};
    try { pro = JSON.parse(localStorage.getItem('matlaProfile') || '{}'); } catch (e) {}
    if (pro.name) {
        var banner = document.getElementById('reengageBanner');
        var nameEl = document.getElementById('reengageName');
        if (banner && nameEl) { nameEl.textContent = pro.name; banner.style.display = 'flex'; }
    }

    // Typewriter subtitle
    var tw = document.getElementById('typewriter');
    if (tw) {
        var phrases = [
            'Become a certified Job Financial Advisor',
            'Study at your own pace, anywhere',
            'Get certified in weeks, not years',
            'Launch your career in financial services'
        ];
        var idx = 0, ch = 0, del = false;
        (function step() {
            var p = phrases[idx];
            tw.textContent = del ? p.slice(0, --ch) : p.slice(0, ++ch);
            if (!del && ch === p.length) { del = true; setTimeout(step, 1800); return; }
            if (del && ch === 0)         { del = false; idx = (idx + 1) % phrases.length; }
            setTimeout(step, del ? 38 : 68);
        })();
    }

    // Overview filter tabs
    document.querySelectorAll('.ov-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.ov-tab').forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var cat = tab.dataset.cat || 'all';
            document.querySelectorAll('.overview-card').forEach(function (card) {
                card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
            });
        });
    });

    // Back-to-top button
    var btt = document.getElementById('backToTop');
    if (btt) {
        window.addEventListener('scroll', function () {
            var pct = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
            btt.classList.toggle('visible', pct > 0.6);
        }, { passive: true });
        btt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }

    // Testimonials carousel
    var track = document.querySelector('.t-track');
    var cards = document.querySelectorAll('.t-card');
    if (track && cards.length) {
        var cur = 0, autoTimer;
        function goTo(n) {
            cur = (n + cards.length) % cards.length;
            track.style.transform = 'translateX(-' + (cur * 100) + '%)';
            document.querySelectorAll('.t-dot').forEach(function (d, i) {
                d.classList.toggle('active', i === cur);
            });
        }
        function startAuto() { autoTimer = setInterval(function () { goTo(cur + 1); }, 5000); }
        function stopAuto()  { clearInterval(autoTimer); }
        window['tPrev'] = function () { stopAuto(); goTo(cur - 1); startAuto(); };
        window['tNext'] = function () { stopAuto(); goTo(cur + 1); startAuto(); };
        window['tGoTo'] = function (n) { stopAuto(); goTo(n);      startAuto(); };
        document.querySelectorAll('.t-dot').forEach(function (d, i) {
            d.addEventListener('click', function () { window.tGoTo(i); });
        });
        startAuto();
    }
}

/* ════════════════════════════════════════════════════════════════════════════
   Dashboard page
   ════════════════════════════════════════════════════════════════════════════ */
function initDashboard() {
    var sec = document.getElementById('dashboardWelcomeSection');
    if (!sec) return;
    var pro = {};
    try { pro = JSON.parse(localStorage.getItem('matlaProfile') || '{}'); } catch (e) {}
    var nm  = pro.name || 'Student';
    var prg = pro.progress || 42;
    var ini = nm.split(' ').map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase() || 'ST';

    sec.innerHTML = `
<div class="dw-wrap">
  <div class="dw-hero">
    <div class="dw-av">${ini}</div>
    <div class="dw-info">
      <h1>Welcome back, ${_esc(nm)}!</h1>
      <p>${_esc(localStorage.getItem('userEmail') || '')}</p>
      <div class="dw-bar"><div class="dw-fill" style="width:${prg}%"></div></div>
      <p class="dw-pct">${prg}% of JFA Programme complete</p>
    </div>
  </div>
  <div class="dw-stats">
    <div class="dw-stat"><i class="fas fa-book"></i><span>4</span><label>Modules</label></div>
    <div class="dw-stat"><i class="fas fa-star"></i><span>92%</span><label>Avg Score</label></div>
    <div class="dw-stat"><i class="fas fa-fire"></i><span>12</span><label>Day Streak</label></div>
    <div class="dw-stat"><i class="fas fa-clock"></i><span>48h</span><label>Study Time</label></div>
  </div>
  <div class="dw-actions">
    <a href="courses.html" class="dw-btn dw-primary"><i class="fas fa-play"></i>Continue Learning</a>
    <a href="meneer-ai.html" class="dw-btn dw-secondary"><i class="fas fa-robot"></i>Ask Meneer AI</a>
    <a href="assessments.html" class="dw-btn dw-ghost"><i class="fas fa-clipboard-check"></i>Assessments</a>
  </div>
</div>`;
}

/* ════════════════════════════════════════════════════════════════════════════
   Bootstrap — wire everything up on DOMContentLoaded
   ════════════════════════════════════════════════════════════════════════════ */
var navigationManager = new NavigationManager();

/* ════════════════════════════════════════════════════════════════════════════
   Page Transition Loader
   The circular dark-navy chevron button spins as a full-screen overlay
   whenever the user navigates between pages.
   ════════════════════════════════════════════════════════════════════════════ */
(function initPageLoader() {
    // Inject loader element
    var loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.innerHTML =
        '<div class="pl-btn"><i class="fas fa-chevron-right"></i></div>' +
        '<div class="pl-label">Loading</div>';
    document.body.appendChild(loader);

    // Show loader on any internal-page link click (capture phase so it fires first)
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href');
        if (!href) return;
        // Skip anchors, external URLs, mailto/tel, and new-tab links
        if (
            href.charAt(0) === '#' ||
            href.indexOf('://') !== -1 ||
            href.indexOf('mailto:') === 0 ||
            href.indexOf('tel:') === 0 ||
            href.indexOf('javascript:') === 0 ||
            link.target === '_blank'
        ) return;
        loader.classList.add('pl-active');
    }, true);

    // Safety: hide loader if the browser fires load (e.g. back-forward cache)
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) loader.classList.remove('pl-active');
    });
})();

document.addEventListener('DOMContentLoaded', function () {
    ThemeManager.init();
    navigationManager.renderTopNav();
    navigationManager.renderSidebar();
    navigationManager.renderFooter();
    navigationManager.renderFloatingElements();

    // Measure real nav height and set --nav-h CSS variable
    (function setNavH() {
        function update() {
            var nav = document.querySelector('.enhanced-nav');
            var h   = nav ? (nav.getBoundingClientRect().height || 70) : 70;
            document.documentElement.style.setProperty('--nav-h', h + 'px');
            document.body.style.setProperty('--nav-h', h + 'px');
        }
        update();
        setTimeout(update, 120);
        window.addEventListener('resize', update, { passive: true });
    })();

    // Page-specific initialisation
    // (home.html handles its own carousel/tabs/typewriter inline; skip to avoid duplicates)
    var pg = window.location.pathname.split('/').pop() || 'home.html';
    if (pg === 'dashboard.html') initDashboard();

    initScrollAnimations();
    // home.html has its own inline rain animation; only init here on other pages
    if (pg !== 'home.html' && pg !== '') initRain();

    // Live stream + notification badge initial state
    if (typeof updateWatchLiveBtn === 'function') updateWatchLiveBtn();
    if (typeof updateNotifBadge  === 'function') updateNotifBadge();
});

/* ============================================================
   LIVE STREAM (Student Side)
============================================================ */
function updateWatchLiveBtn(){
  var wrap=document.getElementById("watchLiveWrap");
  if(!wrap)return;
  var s=null;
  try{s=JSON.parse(localStorage.getItem(MATLA_LIVE_STREAM_KEY)||"null");}catch(e){}
  wrap.style.display=(s&&s.active)?"block":"none";
}
function openLiveStream(){
  var s=null;
  try{s=JSON.parse(localStorage.getItem(MATLA_LIVE_STREAM_KEY)||"null");}catch(e){}
  if(!s||!s.active){alert("No live stream is currently active.");return;}
  var url=s.url||s.rawUrl||"";
  if(!url){return;}
  // Non-embeddable (Zoom/Teams): open in new tab
  if(url.indexOf("youtube.com/embed")===-1&&url.indexOf("vimeo.com")===-1){
    alert("Opening stream in new tab: "+s.title);
    window.open(url,"_blank");
    return;
  }
  // YouTube embed: show modal
  var existing=document.getElementById("liveStreamModal");
  if(existing)existing.remove();
  var modal=document.createElement("div");
  modal.id="liveStreamModal";
  modal.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center";
  var inner=document.createElement("div");
  inner.style.cssText="width:100%;max-width:900px;padding:0 1rem";
  var hdr=document.createElement("div");
  hdr.style.cssText="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;color:#fff";
  var titleSpan=document.createElement("span");
  titleSpan.style.fontWeight="600";
  titleSpan.textContent=s.title||"Live Stream";
  var closeBtn=document.createElement("button");
  closeBtn.textContent="Close";
  closeBtn.style.cssText="background:rgba(255,255,255,.15);border:none;color:#fff;padding:.35rem .8rem;border-radius:.4rem;cursor:pointer";
  closeBtn.onclick=function(){modal.remove();};
  hdr.appendChild(titleSpan);hdr.appendChild(closeBtn);
  var aspect=document.createElement("div");
  aspect.style.cssText="position:relative;width:100%;padding-bottom:56.25%";
  var iframe=document.createElement("iframe");
  iframe.src=url;
  iframe.allow="autoplay;fullscreen";
  iframe.setAttribute("allowfullscreen","");
  iframe.style.cssText="position:absolute;inset:0;width:100%;height:100%;border:none;border-radius:.75rem";
  aspect.appendChild(iframe);
  inner.appendChild(hdr);inner.appendChild(aspect);
  modal.appendChild(inner);
  modal.addEventListener("click",function(e){if(e.target===modal)modal.remove();});
  document.body.appendChild(modal);
}

/* ============================================================
   STUDENT NOTIFICATION BELL
============================================================ */
function getUnreadCount(userEmail){
  var list=[];
  try{list=JSON.parse(localStorage.getItem(MATLA_ANNOUNCEMENTS_KEY)||"[]");}catch(e){}
  var profile={};
  try{profile=JSON.parse(localStorage.getItem("matlaProfile")||"{}");}catch(e){}
  var smName=profile.smName||"";
  return list.filter(function(a){
    if(a.readBy&&a.readBy.indexOf(userEmail)!==-1)return false;
    if(a.audience==="all")return true;
    if(a.audience==="student:"+userEmail)return true;
    if(a.audience.startsWith("team:")){
      var sms=[];try{sms=JSON.parse(localStorage.getItem(MATLA_SMS_KEY)||"[]");}catch(e){}
      var sm=sms.find(function(s){return "team:"+s.id===a.audience;});
      return sm&&sm.name===smName;
    }
    return false;
  }).length;
}
function updateNotifBadge(){
  var session=typeof MatlaDB!=="undefined"?MatlaDB.getCurrentUser():null;
  if(!session)return;
  var cnt=getUnreadCount(session.email);
  var badge=document.getElementById("notifPip")||document.getElementById("notifBadge");
  if(!badge)return;
  if(cnt>0){
    badge.textContent=cnt>9?"9+":String(cnt);
    badge.style.display="";
    badge.classList.remove("hidden");
  }else{
    badge.style.display="none";
    badge.classList.add("hidden");
  }
}

/* ============================================================
   BROADCAST CHANNEL + STORAGE LISTENERS
============================================================ */
(function setupStudentSync(){
  try{
    var bc=new BroadcastChannel("matla-academy");
    bc.addEventListener("message",function(e){
      if(!e.data)return;
      if(e.data.type==="stream_start"||e.data.type==="stream_end"){
        updateWatchLiveBtn();
      }
      if(e.data.type==="announcement"){
        updateNotifBadge();
      }
      if(e.data.type==="passmark_updated"&&e.data.value!==undefined){
        localStorage.setItem(MATLA_PASSMARK_KEY,String(e.data.value));
      }
    });
  }catch(ex){}
  window.addEventListener("storage",function(e){
    if(e.key===MATLA_LIVE_STREAM_KEY)updateWatchLiveBtn();
    if(e.key===MATLA_ANNOUNCEMENTS_KEY)updateNotifBadge();
  });
})();
