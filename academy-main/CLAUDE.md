# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Matla Academy** is a client-side-only Learning Management System (LMS) for Matla Life financial advisors. It is a static HTML/CSS/JS application with **no backend server** — all data persistence uses `localStorage`.

## Running the App

Open any `.html` file directly in a browser, or serve the directory with a local static server:

```bash
npx serve .
# or
python -m http.server 8080
```

There is no build step, no compilation, and no test suite. The `package.json` only declares a `motion` dependency which is not actively used.

## Architecture

### Data Layer — `db.js`
`MatlaDB` is a global singleton (IIFE attached to `window`) that acts as the single source of truth for all user data via `localStorage`. Every page that needs user data loads `<script src="db.js">` first.

Key `localStorage` keys:
- `matla_db_users` — array of all user records (students + staff)
- `matla_db_session` — active Academy (student) session
- `matla_admin_session` — active Admin portal session (8-hour TTL)
- `matlaProfile` — cached profile for the nav bar
- `userEmail` — legacy key still read by some pages
- Per-course progress: `matla_crs_sales`, `matla_crs_rma`, `matla_crs_capital_legacy`, `matla_crs_fais`, `matla_crs_fin_lit`
- Assessment: `matla_assess_w1`

Passwords are stored base64-encoded (via `btoa`/`atob`) — not cryptographically secure. Superadmin emails bypass password checks entirely (demo mode).

Hardcoded superadmins: `tshepangm@matlalife.co.za`, `nkululeko.gumata@gmail.com`

### Shared JS — `script.js`
Provides two globally-available classes used by all Academy pages:
- `ThemeManager` — cycles through light/dark/grey/blue themes, persists to `matla-theme`
- `NavigationManager` — renders the top nav bar, reads course progress from localStorage to compute live programme completion

### Admin Content Injection — `course-injector.js`
Loaded on course pages. Reads admin-authored notes and video URL overrides from localStorage and injects them into course content at runtime. Also shows a superadmin mode badge when the current user is a superadmin.

### Styling
- `styles.css` — shared styles for student-facing pages (nav, cards, themes via `data-theme` attribute on `<html>`)
- `admin-style.css` — styles for `admin.html` only
- `design-system.css` — CSS custom properties (color tokens, spacing) — not yet uniformly applied across all pages; many pages still use inline `<style>` blocks with hardcoded values

Pages use Tailwind CSS (CDN, v2.2.19) alongside custom CSS. Both coexist on the same pages.

### Page Map

**Student-facing:**
- `index.html` / `login.html` — login (same functionality, `index.html` is canonical)
- `register.html` — self-registration
- `home.html` — landing after login
- `dashboard.html` — student progress dashboard with Chart.js graphs
- `courses.html` — course catalogue
- `course-sales-training.html`, `course-product-rma.html`, `course-capital-legacy.html`, `course-fais-compliance.html`, `course-financial-literacy.html` — individual courses (tab/module structure, progress tracked per-course in localStorage)
- `course-dynamic.html` — admin-created dynamic course shell
- `assessments.html`, `assessment-w1.html` — Week 1 assessment
- `profile.html` — user profile editor
- `graduation.html` — completion page
- `meneer-ai.html` — AI coach chatbot interface
- `export.html` — data export utility

**Admin-facing:**
- `admin.html` + `admin-script.js` + `admin-style.css` — CRM/control centre for L&D and superadmins; role-gated to `ADMIN_ROLES = ['superadmin', 'L&D', 'IT']`

### Auth Flow
1. Login at `index.html` → `MatlaDB.validateLogin()` → `MatlaDB.startSession()` → redirect to `home.html`
2. Admin login at `admin.html` → `MatlaDB.startAdminSession()` → stays on `admin.html`
3. All protected pages check `MatlaDB.getCurrentUser()` or `MatlaDB.getAdminSession()` on load and redirect to login if null

### Progress Calculation
Course progress is stored as `{ completed: [moduleIndexes], xp: number }` per course key. `NavigationManager._loadProfile()` in `script.js` computes an overall programme percentage from all four course completion fractions. The admin panel reads this via `MatlaDB.syncProgress()` and `MatlaDB.getAllWithProgress()`.
