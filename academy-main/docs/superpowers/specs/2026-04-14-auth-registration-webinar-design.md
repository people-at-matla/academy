# Design: Auth Fixes, Registration Linking & Live Webinar
**Date:** 2026-04-14
**Status:** Approved

---

## 1. Overview

Matla Academy is a client-side-only LMS backed exclusively by `localStorage` via the `MatlaDB` singleton (`db.js`). This spec covers:

1. Closing critical login security holes
2. Fixing registration so users appear on profile and admin pages
3. Making the login screen truly universal (student + admin from one page)
4. Adding a Live Webinar page and sidebar button
5. Linking admin and student platforms through a single data key

---

## 2. Scope & Approach

**Approach A — Targeted surgical fixes.** No structural HTML/CSS design changes. All pages keep their existing visual design. Only logic, data flow, and one new page (`webinar.html`) are added or changed.

---

## 3. Login Fixes (`login.html` + `db.js`)

### Security holes closed

| Hole | Fix |
|------|-----|
| Student login auto-creates a new user on any failed login | Removed. Failed login shows an error and stops. |
| `pwd === 'admin'` bypasses admin auth | Removed entirely. |
| Passwords stored as base64 (trivially reversible) | Replaced with SHA-256 via `crypto.subtle` (browser-native, no library). |

### Password migration
- `db.js` gets `hashPassword(plain)` (async, returns hex string) and `verifyPassword(plain, stored)`.
- `verifyPassword` detects legacy base64 passwords (not 64-char hex) and accepts them once, then re-hashes on the fly. Transparent — no data loss for existing users.

### Universal login flow
- Existing Student / Admin tab UI is kept exactly as-is.
- **Student tab:** validate via `MatlaDB.validateLogin()` → on success, `startSession()` → redirect `home.html`.
- **Admin tab:** validate credentials + `MatlaDB.isAdmin()` check → on success, show OTP step → on OTP pass, `startAdminSession()` → redirect `admin.html`.
- Superadmin emails still bypass password (demo mode) but the `"admin"` shortcut is gone.
- OTP remains hardcoded `123456` (demo mode — noted for future real email integration).

---

## 4. Registration Fixes (`register.html`)

| Bug | Fix |
|-----|-----|
| Two `submitReg()` functions — old one writes to wrong key `matla_admin_users` | Old function deleted. Only v2 (MatlaDB) remains. |
| Duplicate email check reads `matla_admin_users` | Changed to `MatlaDB.getByEmail()`. |
| Password stored plain (base64) | Calls `hashPassword()` before `MatlaDB.setPassword()`. |
| Admin registration redirects to `home.html` | Admin path: no session started, success screen shows "Go to Login". Student path: `startSession()` + auto-redirect to `home.html` after 2.5s (unchanged). |
| Logo path `../Matla Academy .png` is wrong | Fixed to `Matla Academy .png` (same directory). |
| `approved` for admin registrations | Set to `true` (no pending gate — single-admin setup). |

---

## 5. Live Webinar Feature

### `webinar.html` (new page)
- Same nav/sidebar as all other Academy pages (loads `script.js`, `styles.css`).
- Header: "Live Webinar" with a pulsing red LIVE badge.
- Main content: `<iframe>` loading `localStorage.getItem('matla_live_stream_url')`.
- If key is absent or empty: friendly placeholder — *"No live session scheduled right now. Check back soon."*
- Auth-gated: redirects to `login.html` if no session.

### Sidebar (`script.js`)
- New item added to the **Main** nav group between "Courses" and "Meneer AI":
  ```
  { icon:'fa-broadcast-tower', label:'Live Webinar', href:'webinar.html', badge:'LIVE' }
  ```
- Badge is a pulsing red dot. It only renders when `matla_live_stream_url` is set in localStorage.
- The existing hidden `#watchLiveWrap` button is removed (replaced by the nav item).

### Admin panel (`admin.html`)
- New **"Live Stream"** card in the Settings / Broadcast section.
- Fields: "Stream Embed URL" input + "Save" button + "Clear" button.
- Save: `localStorage.setItem('matla_live_stream_url', url)`.
- Clear: `localStorage.removeItem('matla_live_stream_url')`.

---

## 6. Platform Linking (`matla_admin_users` → `matla_db_users`)

| Before | After |
|--------|-------|
| `register.html` old fn wrote to `matla_admin_users` | Deleted. All writes go via `MatlaDB.upsert()` → `matla_db_users`. |
| Admin panel may read `matla_admin_users` | All reads use `MatlaDB.getAll()` / `MatlaDB.getAllWithProgress()`. |
| Profile page couldn't find newly registered users | `MatlaDB.getCurrentUser()` reads session email → fetches from `matla_db_users` → works. |

### Session linkage

| Action | Session key | Redirect |
|--------|-------------|----------|
| Student login | `matla_db_session` | `home.html` |
| Admin login (post-OTP) | `matla_admin_session` | `admin.html` |
| Student registration | `matla_db_session` | `home.html` |
| Admin registration | none (must log in after) | success screen → login |

---

## 7. Files Changed

| File | Change type |
|------|-------------|
| `db.js` | Add `hashPassword`, `verifyPassword`; update `validateLogin`, `setPassword` |
| `login.html` | Remove auto-create loophole, remove `"admin"` bypass, wire hashing |
| `register.html` | Remove old `submitReg`, fix duplicate check, hash password, fix redirect, fix logo path |
| `script.js` | Add Live Webinar nav item, remove hidden `#watchLiveWrap` |
| `webinar.html` | New file |
| `admin.html` | Add Live Stream URL card |

---

## 8. Out of Scope

- Real email OTP delivery (no backend)
- Role-based approval workflow (admin approves new admins)
- bcrypt or Argon2 password hashing (requires backend or WASM library)
- Any visual/CSS redesign
