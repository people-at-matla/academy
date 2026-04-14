/**
 * MatlaDB — Centralized localStorage database for Matla Academy
 * Single source of truth for all users: students, L&D, IT, superadmins.
 *
 * Usage (any page):
 *   <script src="db.js"></script>
 *   MatlaDB.getByEmail('user@mail.com')
 */
(function (win) {
  'use strict';

  const KEY_USERS   = 'matla_db_users';
  const KEY_SESSION = 'matla_db_session';   // Academy session (student/staff)
  const KEY_ADMIN   = 'matla_admin_session'; // Admin portal session
  const SUPERADMINS = ['tshepangm@matlalife.co.za', 'nkululeko.gumata@gmail.com'];
  const ADMIN_ROLES = ['superadmin', 'L&D', 'IT'];

  /* ── Encode / decode password ── */
  function enc(p) {
    if (!p) return "";
    try { return btoa(unescape(encodeURIComponent(p))); } catch { return btoa(p); }
  }
  function dec(p) {
    if (!p) return "";
    try {
      const raw = atob(p);
      try { return decodeURIComponent(escape(raw)); } catch { return raw; }
    } catch { return p; }
  }

  /* ── Hash password with SHA-256 (async, browser-native) ── */
  async function hashPassword(plain) {
    if (!plain) return "";
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  /* ── Verify password — supports legacy base64 and new SHA-256 hex ── */
  async function verifyPassword(plain, stored) {
    if (!stored || !plain) return false;
    const isHash = /^[0-9a-f]{64}$/.test(stored);
    if (!isHash) return dec(stored) === plain; // legacy base64 path
    return (await hashPassword(plain)) === stored;
  }

  /* ── Raw read/write ── */
  function readAll() {
    try { return JSON.parse(localStorage.getItem(KEY_USERS) || '[]'); }
    catch { return []; }
  }
  function writeAll(arr) {
    localStorage.setItem(KEY_USERS, JSON.stringify(arr));
  }

  /* ── Public API ── */
  const DB = {

    /** Return copy of all users */
    getAll() { return readAll(); },

    /** Find user by email (case-insensitive) */
    getByEmail(email) {
      if (!email) return null;
      const e = email.toLowerCase().trim();
      return readAll().find(u => (u.email || '').toLowerCase() === e) || null;
    },

    /** Insert or update a user record.
     *  Matches on email. Returns the saved user. */
    upsert(user) {
      if (!user || !user.email) return null;
      const all  = readAll();
      const idx  = all.findIndex(u => (u.email || '').toLowerCase() === user.email.toLowerCase().trim());
      if (idx >= 0) {
        all[idx] = Object.assign({}, all[idx], user);
      } else {
        user.id = user.id || ('u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));
        all.push(user);
      }
      writeAll(all);
      return idx >= 0 ? all[idx] : all[all.length - 1];
    },

    /** Set password for a user (stored as SHA-256 hex). */
    async setPassword(email, plainPassword) {
      const all = readAll();
      const idx = all.findIndex(u => (u.email || '').toLowerCase() === email.toLowerCase().trim());
      if (idx < 0) return false;
      all[idx].password = await hashPassword(plainPassword);
      writeAll(all);
      return true;
    },

    /** Validate login. Returns user record on success, null on failure. */
    validateLogin(email, plainPassword) {
      const u = this.getByEmail(email);
      if (!u) return null;
      // Superadmins can use any password in demo mode
      if (SUPERADMINS.includes((email || '').toLowerCase().trim())) return u;
      if (!u.password) return null;
      try { return dec(u.password) === plainPassword ? u : null; }
      catch { return null; }
    },

    /** Async login validation with SHA-256 support and legacy migration. */
    async validateLoginAsync(email, plainPassword) {
      const u = this.getByEmail(email);
      if (!u) return null;
      if (SUPERADMINS.includes((email || '').toLowerCase().trim())) return u;
      if (!u.password) return null;
      const ok = await verifyPassword(plainPassword, u.password);
      if (!ok) return null;
      // Migrate legacy base64 to SHA-256 transparently on first successful login
      if (!/^[0-9a-f]{64}$/.test(u.password)) await this.setPassword(email, plainPassword);
      return u;
    },

    /** Check if email belongs to admin role (L&D, IT, superadmin) */
    isAdmin(email) {
      if (SUPERADMINS.includes((email || '').toLowerCase().trim())) return true;
      const u = this.getByEmail(email);
      return u ? ADMIN_ROLES.includes(u.role) && u.approved !== false : false;
    },

    isSuperAdmin(email) {
      return SUPERADMINS.includes((email || '').toLowerCase().trim());
    },

    /** Get current Academy session user (reads matla_db_session) */
    getCurrentUser() {
      try {
        const s = JSON.parse(localStorage.getItem(KEY_SESSION) || '{}');
        if (!s.email) return null;
        return this.getByEmail(s.email);
      } catch { return null; }
    },

    /** Start Academy session after login */
    startSession(email, role) {
      const session = { email: email.toLowerCase().trim(), role, loginAt: Date.now() };
      localStorage.setItem(KEY_SESSION, JSON.stringify(session));
      // Also set legacy key
      localStorage.setItem('userEmail', email.toLowerCase().trim());
      // Sync matlaProfile from DB record
      const u = this.getByEmail(email);
      if (u) {
        const prof = {
          name:     (u.firstName || '') + ' ' + (u.lastName || ''),
          email:    u.email,
          empNo:    u.empId || '',
          mobile:   u.phone || '',
          progress: u.progress || 0,
          xp:       u.xp || 0,
          level:    u.level || 1,
          role:     u.role || 'student',
        };
        // Merge existing matlaProfile fields
        try {
          const existing = JSON.parse(localStorage.getItem('matlaProfile') || '{}');
          localStorage.setItem('matlaProfile', JSON.stringify(Object.assign({}, existing, prof)));
        } catch {
          localStorage.setItem('matlaProfile', JSON.stringify(prof));
        }
      }
    },

    /** End Academy session */
    endSession() {
      localStorage.removeItem(KEY_SESSION);
      localStorage.removeItem('userEmail');
    },

    /** Get current admin portal session */
    getAdminSession() {
      try {
        const s = JSON.parse(localStorage.getItem(KEY_ADMIN) || '{}');
        if (!s.email || Date.now() - (s.loginAt || 0) > 8 * 3600000) return null;
        return s;
      } catch { return null; }
    },

    /** Start admin portal session */
    startAdminSession(email, role) {
      const session = { email: email.toLowerCase().trim(), role, loginAt: Date.now() };
      localStorage.setItem(KEY_ADMIN, JSON.stringify(session));
      // Ensure user exists in DB
      const u = this.getByEmail(email);
      if (!u) {
        const n = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        this.upsert({
          email: email.toLowerCase().trim(),
          firstName: n.split(' ')[0] || n,
          lastName:  n.split(' ').slice(1).join(' ') || '',
          role: SUPERADMINS.includes(email.toLowerCase().trim()) ? 'superadmin' : role,
          approved: true,
          registeredAt: new Date().toISOString(),
          department: 'Management',
          jobTitle: 'Superadmin',
          empId: 'SYS',
        });
      }
    },

    /**
     * Sync current logged-in student's course progress from legacy localStorage
     * keys into their DB record. Call this from any Academy page.
     */
    syncProgress(email) {
      if (!email) {
        email = localStorage.getItem('userEmail');
      }
      if (!email) return;
      function lsJ(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }
      const courses = {
        sales:   lsJ('matla_crs_sales'),
        rma:     lsJ('matla_crs_rma'),
        capital: lsJ('matla_crs_capital_legacy'),
        fais:    lsJ('matla_crs_fais'),
        fin:     lsJ('matla_crs_fin_lit'),
      };
      const assessment = lsJ('matla_assess_w1');
      const prof = lsJ('matlaProfile');
      this.upsert({
        email,
        courses,
        assessment,
        progress:  prof ? (prof.progress || 0) : 0,
        xp:        prof ? (prof.xp || 0) : 0,
        level:     prof ? (prof.level || 1) : 1,
        lastSeen:  Date.now(),
      });
    },

    /** Get all students with progress data merged in */
    getAllWithProgress() {
      return readAll().map(u => {
        const c = u.courses || {};
        const a = u.assessment || {};
        return Object.assign({}, u, {
          _s:   c.sales   || {},
          _r:   c.rma     || {},
          _cap: c.capital || {},
          _f:   c.fais    || {},
          _fn:  c.fin     || {},
          _a1:  a,
          _pro: { progress: u.progress || 0, xp: u.xp || 0, level: u.level || 1 },
        });
      });
    },

    /** Remove all demo/seeded records (keeps superadmins) */
    clearDemo() {
      const all = readAll().filter(u => u._isDemo !== true);
      writeAll(all);
    },

    /** Seed demo student records */
    seedDemo(count) {
      count = count || 10;
      const depts = ['Sales','Operations','Compliance','Finance','HR'];
      const names = [
        ['Thabo','Mokoena'],['Naledi','Dlamini'],['Sipho','Nkosi'],['Lerato','Molefe'],
        ['Kagiso','Sithole'],['Ayanda','Mthembu'],['Zanele','Ndlovu'],['Bonga','Khumalo'],
        ['Phindile','Mahlangu'],['Sifiso','Shabalala'],['Nomsa','Vilakazi'],['Thandeka','Zwane'],
      ];
      const all = readAll();
      for (let i = 0; i < count; i++) {
        const nm = names[i % names.length];
        const email = (nm[0].toLowerCase() + '.' + nm[1].toLowerCase() + i + '@matlalife.co.za');
        if (all.some(u => u.email === email)) continue;
        const modules = [2,3,4,5];
        const mS = modules[i % 4];
        all.push({
          id: 'demo_' + i + '_' + Date.now(),
          firstName: nm[0], lastName: nm[1], email,
          role: 'student', approved: true, _isDemo: true,
          department: depts[i % depts.length],
          jobTitle: 'Junior Financial Advisor',
          empId: 'ML-' + String(100 + i).padStart(4, '0'),
          registeredAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
          lastSeen: Date.now() - Math.random() * 7 * 86400000,
          progress: Math.round(mS / 6 * 20),
          xp: mS * 100,
          courses: {
            sales: { completed: Array.from({length: mS}, (_, j) => j), xp: mS * 100 },
            rma:   { completed: [], xp: 0 },
          },
          assessment: i < 6 ? {
            submitted: true, score: 60 + Math.floor(Math.random() * 30),
            passed: i < 5, submittedAt: Date.now() - Math.random() * 14 * 86400000,
            answers: {1:'B',2:'C',3:'C',4:'B',5:'D',6:'C',7:'B',8:'A',9:'C',10:'B'},
          } : {},
        });
      }
      writeAll(all);
    },

    SUPERADMINS,
    ADMIN_ROLES,
    KEY_USERS,
    KEY_SESSION,
    KEY_ADMIN,
  };

  win.MatlaDB = DB;

})(window);
