# Auth Fixes, Registration Linking & Live Webinar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix login security holes, ensure registered users appear on profile and admin pages, and add a student-facing Live Webinar page linked to the existing admin Live Stream panel.

**Architecture:** All fixes operate on the existing client-side localStorage stack. `db.js` (MatlaDB) is the single source of truth. Password hashing uses the browser-native `crypto.subtle` Web Crypto API. The Live Webinar page reads from `matla_live_stream` — the same key already written by the admin panel's `goLive()` and `endStream()` functions. No new admin UI is needed.

**Tech Stack:** Vanilla HTML/CSS/JS, localStorage, Web Crypto API (SHA-256), BroadcastChannel API, Font Awesome 6, Google Fonts (Space Grotesk, DM Sans)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `academy-main/db.js` | Modify | Add async SHA-256 hashing; update `setPassword`, add `validateLoginAsync` |
| `academy-main/login.html` | Modify | Remove auto-create loophole, remove `"admin"` bypass, use async login |
| `academy-main/register.html` | Modify | Remove old `submitReg`, fix duplicate check, hash password, fix redirect and logo path |
| `academy-main/script.js` | Modify | Add Live Webinar nav item with LIVE badge to sidebar |
| `academy-main/styles.css` | Modify | Add `.sb-badge-live` pulsing red badge style |
| `academy-main/webinar.html` | Create | Student Live Webinar page reading from `matla_live_stream` key |

---

## Task 1: Upgrade `db.js` — Async password hashing

**Files:**
- Modify: `academy-main/db.js`

- [ ] **Step 1: Add `hashPassword` and `verifyPassword` helpers inside the IIFE**

Open `db.js`. After the existing `dec()` function (around line 29), add:

```javascript
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
```

- [ ] **Step 2: Update `setPassword` to be async**

Replace the existing `setPassword` method:

```javascript
async setPassword(email, plainPassword) {
  const all = readAll();
  const idx = all.findIndex(u => (u.email || '').toLowerCase() === email.toLowerCase().trim());
  if (idx < 0) return false;
  all[idx].password = await hashPassword(plainPassword);
  writeAll(all);
  return true;
},
```

- [ ] **Step 3: Add `validateLoginAsync` method after existing `validateLogin`**

```javascript
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
```

- [ ] **Step 4: Verify in browser console**

Open any academy page. In DevTools console:

```javascript
(async () => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hello'));
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  console.log('length:', hex.length, 'valid:', /^[0-9a-f]{64}$/.test(hex));
})();
// Expected: length: 64  valid: true
```

- [ ] **Step 5: Commit**

```bash
git add academy-main/db.js
git commit -m "feat: add SHA-256 password hashing to MatlaDB with legacy base64 migration"
```

---

## Task 2: Fix `login.html` — Close security holes

**Files:**
- Modify: `academy-main/login.html` (the script block at the bottom)

**Background — bugs being fixed:**
1. Student login currently auto-creates a new user if credentials fail — anyone can enter any email and get in.
2. `if(pwd==='admin')` bypasses admin credential checks entirely.

- [ ] **Step 1: Replace `doStep1()` with a secure async version**

Find and replace the entire `doStep1` function:

```javascript
async function doStep1(){
  clearErrs();
  const email=(document.getElementById('inEmail')?.value||'').trim().toLowerCase();
  const pwd=(document.getElementById('inPwd')?.value||'');
  if(!email||!email.includes('@')){showErr('errEmail','Please enter a valid email.');return;}
  if(!pwd){showErr('errPwd','Password is required.');return;}
  const btnId=MODE==='admin'?'btnAdmin':'btnStudent';
  setBtn(btnId,true);
  try{
    if(MODE==='admin'){
      if(typeof MatlaDB==='undefined'){showErr('errGen','System error. Please refresh.');setBtn(btnId,false);return;}
      const u=await MatlaDB.validateLoginAsync(email,pwd);
      if(!u){showErr('errGen','Incorrect email or password.');setBtn(btnId,false);return;}
      if(!MatlaDB.isAdmin(email)){showErr('errGen','Your account does not have admin access.');setBtn(btnId,false);return;}
      if(u.approved===false){showErr('errGen','Admin access pending approval.');setBtn(btnId,false);return;}
      _email=email; setBtn(btnId,false); gotoOTP();
    }else{
      if(typeof MatlaDB==='undefined'){
        localStorage.setItem('userEmail',email);
        toast('Welcome · entering academy');
        setTimeout(()=>location.href='home.html',650);
        return;
      }
      const u=await MatlaDB.validateLoginAsync(email,pwd);
      if(!u){showErr('errGen','Incorrect email or password.');setBtn(btnId,false);return;}
      MatlaDB.startSession(email,u.role||'student');
      _email=email; setBtn(btnId,false);
      toast('Welcome back · entering academy');
      setTimeout(()=>location.href='home.html',650);
    }
  }catch(e){
    showErr('errGen','Something went wrong. Please try again.');
    setBtn(btnId,false);
  }
}
```

- [ ] **Step 2: Update `doOTP()` to use the user's actual stored role**

Replace the entire `doOTP` function:

```javascript
function doOTP(){
  clearErrs();
  const otp=getOTP();
  if(otp.length<6){showErr('errOtp','Please enter all 6 digits.');return;}
  if(otp!=='123456'){showErr('errOtp','Incorrect code. Demo code is 123456.');return;}
  setBtn('btnOTP',true);
  setTimeout(()=>{
    setBtn('btnOTP',false);
    if(typeof MatlaDB!=='undefined'){
      const u=MatlaDB.getByEmail(_email);
      const role=u?u.role:(isSA(_email)?'superadmin':'L&D');
      MatlaDB.startAdminSession(_email,role);
    }else{
      localStorage.setItem('matla_admin_session',JSON.stringify({email:_email,role:'L&D',loginAt:Date.now()}));
    }
    toast('Verified · launching admin');
    setTimeout(()=>location.href='admin.html',650);
  },480);
}
```

- [ ] **Step 3: Verify security fix in browser**

Open `login.html`. Student tab: enter `hacker@nowhere.com` + any password. Must show "Incorrect email or password." Check DevTools → Application → localStorage: no new entry in `matla_db_users`.

Admin tab: enter a valid admin email with password `admin`. Must fail — "Incorrect email or password."

- [ ] **Step 4: Commit**

```bash
git add academy-main/login.html
git commit -m "fix: remove auto-create loophole and admin password bypass from login"
```

---

## Task 3: Fix `register.html` — Data flow and redirects

**Files:**
- Modify: `academy-main/register.html`

**Background — bugs being fixed:**
1. An old v1 `submitReg` at ~line 784 writes to `matla_admin_users` (wrong key). Only the v2 that uses `MatlaDB.upsert` should exist.
2. `checkDuplicateEmail` reads from `matla_admin_users` (wrong key).
3. Admin registrations auto-redirect to `home.html` — they should stay on the success screen and go to `login.html` manually.
4. Logo path `../Matla Academy .png` points to wrong directory.

- [ ] **Step 1: Fix the logo path**

Find:
```html
<img src="../Matla Academy .png" alt="Matla Academy" class="reg-logo">
```
Replace with:
```html
<img src="Matla Academy .png" alt="Matla Academy" class="reg-logo">
```

- [ ] **Step 2: Delete the old v1 `submitReg` function**

Find the FIRST occurrence of `async function submitReg()`. It starts with:

```javascript
async function submitReg() {
  const email = document.getElementById('regEmail')?.value.trim().toLowerCase();
  if (!checkDuplicateEmail(email)) return;

  const btn = document.getElementById('btnSubmit');
  if (btn) { btn.disabled = true; btn.innerHTML =
```

Delete everything from that line through the first closing `}` that ends it (the one followed by the comment `/* ── EYE TOGGLE ── */` or similar). The v2 function (which contains `MatlaDB.upsert`) must stay.

- [ ] **Step 3: Fix `checkDuplicateEmail` to use `MatlaDB`**

Find:
```javascript
function checkDuplicateEmail(email) {
  const users = getUsers();
  if (users.some(u => u.email?.toLowerCase() === email.toLowerCase())) {
    setFgErr('fg-regemail', true, 'An account with this email already exists.');
    return false;
  }
  return true;
}
```

Replace with:

```javascript
function checkDuplicateEmail(email) {
  if (typeof MatlaDB !== 'undefined' && MatlaDB.getByEmail(email)) {
    setFgErr('fg-regemail', true, 'An account with this email already exists.');
    return false;
  }
  return true;
}
```

- [ ] **Step 4: Update the success screen HTML**

Find `<div class="success-actions">` inside `<div class="success-screen" id="successScreen">`. Replace whatever buttons are inside with an empty container:

```html
<div class="success-actions" id="successActions"></div>
```

- [ ] **Step 5: Replace v2 `submitReg` with the fixed version**

Find the remaining `async function submitReg()` (the one containing `MatlaDB.upsert`). Replace the whole function with the code below. Note: this version avoids setting text/HTML directly through untrusted user data — the success action links are built with `document.createElement` to prevent XSS:

```javascript
async function submitReg() {
  const email = document.getElementById("regEmail")?.value.trim().toLowerCase();
  if (!checkDuplicateEmail(email)) return;

  if (typeof MatlaDB === "undefined") {
    alert("Registration system not loaded. Please refresh the page.");
    return;
  }
  if (MatlaDB.getByEmail(email)) {
    setFgErr('fg-regemail', true, 'An account with this email already exists.');
    return;
  }

  const btn = document.getElementById("btnSubmit");
  if (btn) { btn.disabled = true; btn.textContent = "Creating account..."; }

  const firstName = document.getElementById("firstName")?.value.trim() || "";
  const lastName  = document.getElementById("lastName")?.value.trim()  || "";
  const password  = document.getElementById("regPw")?.value || "";

  const newUser = {
    email,
    firstName,
    lastName,
    name: (firstName + " " + lastName).trim(),
    idNumber:     document.getElementById("idNumber")?.value.trim(),
    dob:          document.getElementById("dob")?.value,
    gender:       document.getElementById("gender")?.value,
    race:         document.getElementById("race")?.value,
    phone:        document.getElementById("phone")?.value.trim(),
    altPhone:     document.getElementById("altPhone")?.value.trim(),
    address:      document.getElementById("address")?.value.trim(),
    disability:   document.getElementById("disability")?.value,
    qualification:document.getElementById("qualification")?.value,
    empId:        document.getElementById("empId")?.value.trim(),
    department:   document.getElementById("department")?.value,
    jobTitle:     document.getElementById("jobTitle")?.value.trim(),
    empType:      document.getElementById("empType")?.value,
    branch:       document.getElementById("branch")?.value,
    manager:      document.getElementById("manager")?.value.trim(),
    faisCategory: document.getElementById("faisCategory")?.value,
    faisNumber:   document.getElementById("faisNumber")?.value.trim(),
    role:         selectedRole,
    approved:     true,
    teamId:       selectedTeamData ? selectedTeamData.teamId   : null,
    smName:       selectedTeamData ? selectedTeamData.smName   : null,
    teamName:     selectedTeamData ? selectedTeamData.teamName : null,
    startDate:    document.getElementById("startDate")?.value,
    registeredAt: new Date().toISOString(),
  };

  MatlaDB.upsert(newUser);
  if (password) await MatlaDB.setPassword(email, password);

  // Students get an immediate session; admins must log in through login.html
  if (selectedRole === "student") MatlaDB.startSession(email, "student");

  const loader = document.getElementById("reg-loader");
  if (loader) loader.classList.add("show");
  await new Promise(r => setTimeout(r, 1200));
  if (loader) loader.classList.remove("show");

  document.querySelectorAll(".step-pane").forEach(p => p.style.display = "none");
  const progFill = document.getElementById("progFill");
  if (progFill) progFill.style.width = "100%";
  const ss = document.getElementById("successScreen");
  if (ss) ss.style.display = "block";
  const ll = document.getElementById("loginLinkWrap");
  if (ll) ll.style.display = "none";
  document.querySelectorAll(".reg-step-item").forEach(s => {
    s.classList.remove("active"); s.classList.add("done");
  });

  // Build success action buttons using safe DOM methods
  const sa = document.getElementById("successActions");
  if (sa) {
    while (sa.firstChild) sa.removeChild(sa.firstChild);
    if (selectedRole === "admin") {
      const a = document.createElement("a");
      a.href = "login.html";
      a.className = "sa-btn sa-prim";
      const icon = document.createElement("i");
      icon.className = "fas fa-sign-in-alt";
      a.appendChild(icon);
      a.appendChild(document.createTextNode(" Go to Login"));
      sa.appendChild(a);
    } else {
      const a1 = document.createElement("a");
      a1.href = "home.html";
      a1.className = "sa-btn sa-prim";
      const i1 = document.createElement("i");
      i1.className = "fas fa-graduation-cap";
      a1.appendChild(i1);
      a1.appendChild(document.createTextNode(" Enter Academy"));
      const a2 = document.createElement("a");
      a2.href = "login.html";
      a2.className = "sa-btn sa-sec";
      const i2 = document.createElement("i");
      i2.className = "fas fa-sign-in-alt";
      a2.appendChild(i2);
      a2.appendChild(document.createTextNode(" Sign In Instead"));
      sa.appendChild(a1);
      sa.appendChild(a2);
      setTimeout(() => { window.location.href = "home.html"; }, 2500);
    }
  }
}
```

- [ ] **Step 6: Verify student registration**

1. `localStorage.clear()` in console. Open `register.html`.
2. Complete all 5 steps as a **student** (new email, strong password).
3. Success screen shows "Enter Academy" + "Sign In Instead" buttons, then auto-redirects to `home.html` after 2.5s.
4. Sidebar shows the registered name. `profile.html` shows registration fields.
5. Log in as superadmin → `admin.html`: new student appears in user table.

- [ ] **Step 7: Verify admin registration**

1. Open `register.html`. Register as **admin** (different email).
2. Success screen shows only "Go to Login". No auto-redirect.
3. Click "Go to Login" → Admin tab → credentials → OTP `123456` → `admin.html` loads.

- [ ] **Step 8: Commit**

```bash
git add academy-main/register.html
git commit -m "fix: remove duplicate submitReg, fix data flow to MatlaDB, fix redirect and logo path"
```

---

## Task 4: Create `webinar.html` — Student Live Webinar page

**Files:**
- Create: `academy-main/webinar.html`

**Background:** The admin panel already has a full Live Stream control at `view-livestream` in `admin.html`. It writes `{active: bool, url: embedUrl, title: string, startedAt: ISOString}` to localStorage key `matla_live_stream` and broadcasts events on `BroadcastChannel("matla-academy")`. This page reads that key and listens for real-time updates.

- [ ] **Step 1: Create `academy-main/webinar.html`**

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Live Webinar - Matla Academy</title>
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="styles.css">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<script src="db.js"></script>
<style>
.wbn-main{padding-top:var(--nav-h,70px);min-height:100vh}
.wbn-hero{background:linear-gradient(135deg,#0f172a 0%,#1a1a2e 50%,#1a0a0a 100%);padding:2.5rem 0 2rem;position:relative;overflow:hidden}
.wbn-hero::before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 50% at 50% 0%,rgba(220,38,38,0.15),transparent 70%)}
.wbn-hero-inner{max-width:1100px;margin:0 auto;padding:0 2rem}
.live-badge{display:inline-flex;align-items:center;gap:.5rem;border:1px solid;border-radius:99px;padding:.3rem .9rem;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem;transition:all .3s}
.live-badge.is-live{background:rgba(220,38,38,0.15);border-color:rgba(220,38,38,0.4);color:#fca5a5}
.live-badge.is-offline{background:rgba(100,116,139,0.12);border-color:rgba(100,116,139,0.25);color:rgba(255,255,255,.3)}
.live-dot{width:8px;height:8px;border-radius:50%;transition:background .3s,box-shadow .3s}
.is-live .live-dot{background:#ef4444;box-shadow:0 0 8px #ef4444;animation:livepulse 1.5s ease-in-out infinite}
.is-offline .live-dot{background:#64748b}
@keyframes livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}
.wbn-title{font-family:'Space Grotesk',sans-serif;font-size:2rem;font-weight:800;color:#fff;margin-bottom:.4rem}
.wbn-sub{color:rgba(255,255,255,.55);font-size:.9rem}
.wbn-body{max-width:1100px;margin:0 auto;padding:2rem}
.wbn-frame-wrap{position:relative;width:100%;border-radius:16px;overflow:hidden;background:#000;box-shadow:0 24px 64px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.08);aspect-ratio:16/9}
.wbn-frame-wrap iframe{position:absolute;inset:0;width:100%;height:100%;border:none}
.wbn-placeholder{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.25rem;background:linear-gradient(135deg,#0f172a,#1e293b);color:rgba(255,255,255,.45);text-align:center;padding:2rem}
.wbn-placeholder i{font-size:3rem;color:rgba(220,38,38,.3)}
.wbn-placeholder h3{font-family:'Space Grotesk',sans-serif;font-size:1.3rem;font-weight:700;color:rgba(255,255,255,.65)}
.wbn-placeholder p{font-size:.88rem;max-width:380px;line-height:1.6}
.wbn-meta{margin-top:1.25rem;display:none;padding:1.25rem 1.5rem;background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.2);border-radius:12px}
.wbn-meta-title{font-family:'Space Grotesk',sans-serif;font-size:1.1rem;font-weight:700;color:#fff}
.wbn-meta-time{font-size:.78rem;color:rgba(255,255,255,.4);margin-top:.25rem}
.wbn-info{margin-top:1.25rem;padding:1.25rem 1.5rem;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;font-size:.84rem;color:rgba(255,255,255,.45);line-height:1.7}
.wbn-info strong{color:rgba(255,255,255,.7)}
</style>
</head>
<body>

<script>
(function(){
  try{const s=JSON.parse(localStorage.getItem('matla_db_session')||'{}');if(!s.email)location.href='login.html';}
  catch(e){location.href='login.html';}
})();
</script>

<div id="topNav"></div>
<div id="nav-prog-panel"></div>
<div id="nav-mod-panel"></div>
<aside id="sidebar" class="sidebar"></aside>
<div class="sidebar-overlay" onclick="toggleSidebar()"></div>

<main class="wbn-main">
  <div class="wbn-hero">
    <div class="wbn-hero-inner">
      <div class="live-badge is-offline" id="liveBadge">
        <span class="live-dot"></span>
        <span id="liveStatus">Offline</span>
      </div>
      <h1 class="wbn-title">Live Webinar</h1>
      <p class="wbn-sub">Tune in to live training sessions hosted by your L&amp;D team.</p>
    </div>
  </div>
  <div class="wbn-body">
    <div class="wbn-frame-wrap" id="streamWrap">
      <div class="wbn-placeholder" id="streamPlaceholder">
        <i class="fas fa-broadcast-tower"></i>
        <h3>No Live Session Right Now</h3>
        <p>Your L&amp;D team will go live here when a webinar is scheduled. Check back soon!</p>
      </div>
    </div>
    <div class="wbn-meta" id="streamMeta">
      <div class="wbn-meta-title" id="streamMetaTitle"></div>
      <div class="wbn-meta-time" id="streamMetaTime"></div>
    </div>
    <div class="wbn-info">
      <strong>Having trouble?</strong> Make sure your browser allows embedded content.
      Your L&amp;D admin can also share a direct link if the stream does not load here.
    </div>
  </div>
</main>

<script src="script.js"></script>
<script>
var LIVE_KEY = 'matla_live_stream';

function getLiveStream() {
  try { return JSON.parse(localStorage.getItem(LIVE_KEY) || 'null'); }
  catch(e) { return null; }
}

function renderStream() {
  var s = getLiveStream();
  var live = !!(s && s.active && s.url);

  var badge = document.getElementById('liveBadge');
  var statusEl = document.getElementById('liveStatus');
  var placeholder = document.getElementById('streamPlaceholder');
  var wrap = document.getElementById('streamWrap');
  var meta = document.getElementById('streamMeta');
  var metaTitle = document.getElementById('streamMetaTitle');
  var metaTime = document.getElementById('streamMetaTime');

  if (live) {
    badge.className = 'live-badge is-live';
    statusEl.textContent = 'Live Now';
    placeholder.style.display = 'none';

    var existing = wrap.querySelector('iframe');
    if (existing) existing.remove();

    var iframe = document.createElement('iframe');
    iframe.src = s.url;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none';
    wrap.appendChild(iframe);

    if (s.title) {
      metaTitle.textContent = s.title;
      metaTime.textContent = s.startedAt
        ? 'Started ' + new Date(s.startedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
        : '';
      meta.style.display = 'block';
    }
  } else {
    badge.className = 'live-badge is-offline';
    statusEl.textContent = 'Offline';
    placeholder.style.display = '';
    meta.style.display = 'none';
    var existing = wrap.querySelector('iframe');
    if (existing) existing.remove();
  }
}

renderStream();

try {
  var bc = new BroadcastChannel('matla-academy');
  bc.onmessage = function(e) {
    if (e.data && (e.data.type === 'stream_start' || e.data.type === 'stream_end')) {
      renderStream();
    }
  };
} catch(e) {
  setInterval(renderStream, 10000);
}
</script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser**

1. Log in as student. Navigate to `webinar.html` directly.
2. Offline badge and placeholder visible.
3. In another tab: log in as admin, go to Live Stream nav item, enter a title + YouTube URL, click "Go Live".
4. Switch back to `webinar.html` — should update without page refresh: iframe appears, badge turns LIVE.
5. Admin clicks "End Stream" — placeholder returns automatically.

- [ ] **Step 3: Commit**

```bash
git add academy-main/webinar.html
git commit -m "feat: add Live Webinar student page linked to admin Live Stream panel"
```

---

## Task 5: Update `script.js` sidebar — Add Live Webinar nav item

**Files:**
- Modify: `academy-main/script.js`
- Modify: `academy-main/styles.css`

- [ ] **Step 1: Add Live Webinar to the Main nav group**

Find the `groups` array in `renderSidebar()`:

```javascript
const groups = [
    { label: 'Main', items: [
        { icon:'fa-home',           label:'Home',         href:'index.html'       },
        { icon:'fa-tachometer-alt', label:'Dashboard',    href:'dashboard.html'   },
        { icon:'fa-book',           label:'Courses',      href:'courses.html'     },
        { icon:'fa-robot',          label:'Meneer AI',    href:'meneer-ai.html',  badge:'AI' },
    ]},
```

Replace with:

```javascript
const _ls = (function(){try{return JSON.parse(localStorage.getItem('matla_live_stream')||'null');}catch(e){return null;}})();
const _isLive = !!(_ls && _ls.active);

const groups = [
    { label: 'Main', items: [
        { icon:'fa-home',            label:'Home',         href:'home.html'       },
        { icon:'fa-tachometer-alt',  label:'Dashboard',    href:'dashboard.html'  },
        { icon:'fa-book',            label:'Courses',      href:'courses.html'    },
        { icon:'fa-broadcast-tower', label:'Live Webinar', href:'webinar.html',   badge: _isLive ? 'LIVE' : '' },
        { icon:'fa-robot',           label:'Meneer AI',    href:'meneer-ai.html', badge:'AI' },
    ]},
```

- [ ] **Step 2: Update badge rendering to style the LIVE badge red**

Find the nav item badge rendering in the template literal (inside `renderSidebar`):

```javascript
${it.badge ? `<span class="sb-badge">${it.badge}</span>` : ''}
```

Replace with:

```javascript
${it.badge ? `<span class="sb-badge${it.badge === 'LIVE' ? ' sb-badge-live' : ''}">${it.badge}</span>` : ''}
```

- [ ] **Step 3: Remove the old hidden `#watchLiveWrap` block**

Find and delete this block from inside the `renderSidebar` template literal:

```javascript
  <div id="watchLiveWrap" style="padding:.5rem 1rem;display:none">
    <button onclick="openLiveStream()" class="watch-live-btn" style="width:100%;padding:.6rem;background:#dc2626;color:#fff;border:none;border-radius:.5rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem">
      <i class="fas fa-circle" style="font-size:.5rem;animation:live-pulse 2s infinite"></i> Watch Live
    </button>
  </div>
```

- [ ] **Step 4: Add `.sb-badge-live` style to `styles.css`**

Open `styles.css`. Find the `.sb-badge` block (around line 9164). Add immediately after it:

```css
.sb-badge-live {
    background: #dc2626 !important;
    color: #fff !important;
    animation: sb-live-pulse 2s ease-in-out infinite;
}
@keyframes sb-live-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.55; }
}
```

- [ ] **Step 5: Verify in browser**

Log in as student. Open `home.html`. Sidebar must show: Home → Dashboard → Courses → **Live Webinar** → Meneer AI. No red badge when stream is offline. Log in as admin in another tab, click Go Live, refresh student tab — badge turns red and pulses.

- [ ] **Step 6: Commit**

```bash
git add academy-main/script.js academy-main/styles.css
git commit -m "feat: add Live Webinar nav item to sidebar with pulsing LIVE badge"
```

---

## Task 6: Full smoke test

- [ ] **Step 1: Student registration end-to-end**

`localStorage.clear()` in console. Open `register.html`. Complete all 5 steps as a student. Confirm:
- Success screen: "Enter Academy" + "Sign In Instead" buttons shown, auto-redirects to `home.html` after 2.5s.
- `home.html` sidebar: registered name displayed.
- `profile.html`: all registration fields visible.
- `admin.html` (superadmin login): new student row in user table.

- [ ] **Step 2: Admin registration end-to-end**

Open `register.html`. Register as admin. Confirm:
- Success screen shows only "Go to Login". No auto-redirect.
- Click "Go to Login" → Admin tab → credentials → OTP `123456` → `admin.html` loads.

- [ ] **Step 3: Login security verification**

Student tab: random email + any password → error, no user created. Admin tab: valid email + `admin` → error. Admin tab: valid admin email + correct password → OTP step → `123456` → `admin.html`.

- [ ] **Step 4: Live Webinar end-to-end**

Student logged in → sidebar shows "Live Webinar" (no badge). Click it → offline placeholder. Admin tab: Live Stream → enter title + YouTube URL → Go Live. Student tab: iframe loads automatically, badge pulses red LIVE. Admin: End Stream → student page shows offline placeholder.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: smoke test passed — auth, registration, and live webinar complete"
```
