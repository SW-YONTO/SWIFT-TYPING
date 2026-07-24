# Swift Typing — Admin Portal Requirements
> Version 2.0 | Compiled from full product discussion + engineering implementation
> This document defines every feature the Admin Operations Center supports, grouped by domain.

---

## 1. Authentication & Access

| # | Requirement | Status |
|---|---|---|
| A-1 | Password-protected admin login | ✅ Done |
| A-2 | Session persistence via `sessionStorage` (survives tab navigation, not reload to re-auth) | ✅ Done |
| A-3 | Lock button to immediately clear session | ✅ Done |
| A-4 | Tab/URL persistence — switching tabs writes hash, reload restores tab | ✅ Done |
| A-5 | Direct-link deep navigation — `#/admin#users/dsf` auto-opens that user's profile | ✅ Done |
| A-6 | **[TODO]** Multi-admin role system: `super_admin` (full access) vs `moderator` (ban-only, no progress edit) | 🔲 Planned |
| A-7 | Admin action audit log — every action (ban, progress change, certificate issued) recorded with timestamp | ✅ Done |

---

## 2. Overview Dashboard

| # | Requirement | Status |
|---|---|---|
| B-1 | Metric cards: Registered Accounts, Desktop vs Web ratio, Avg WPM, Total Tests | ✅ Done |
| B-2 | Daily activity trend bar chart (last 7 days) | ✅ Done |
| B-3 | Platform distribution pie chart (Web vs Electron/Desktop) | ✅ Done |
| B-4 | Real-time telemetry log stream table from Supabase | ✅ Done |
| B-5 | Telemetry table: Time, Name (clickable → user profile), Version, Event Type (color-coded), Device ID (copy button), Tests, Max WPM, Avg WPM, Accuracy, Time | ✅ Done |
| B-6 | Clicking user name in telemetry table → navigates to that user's Typist Profile tab | ✅ Done |
| B-7 | Anomaly detection alert: flag users with suspiciously high WPM (> 160 WPM / 3x platform avg) as bot suspect | ✅ Done |
| B-8 | **[TODO]** Export entire telemetry data as CSV for Excel / Google Sheets | 🔲 Planned |
| B-9 | **[TODO]** Real-time online count — how many users active right now (ping-based) | 🔲 Planned |

---

## 3. Typist Profiles & Progression Inspector

### 3a. User Discovery

| # | Requirement | Status |
|---|---|---|
| C-1 | Merged user list from local `localStorage` accounts + Supabase telemetry (unique by username) | ✅ Done |
| C-2 | Search/filter by username | ✅ Done |
| C-3 | Show WPM and test count per user in the list | ✅ Done |
| C-4 | Sort users by: WPM ↓, WPM ↑, Tests Count, Alphabetical | ✅ Done |
| C-5 | Quick action buttons directly on each user card: `Ban`, `Issue Certificate`, `Export Recovery` | ✅ Done |

### 3b. Per-User Metrics

| # | Requirement | Status |
|---|---|---|
| D-1 | Peak WPM, Avg Accuracy, Lessons Completed (count), Practice Time | ✅ Done |
| D-2 | Theme-consistent metric card colors with icons | ✅ Done |
| D-3 | Time-range filter: 1D / 1W / 1M / 3M / 6M — collapsible bar with sliding active indicator | ✅ Done |
| D-4 | WPM Progression Timeline — AreaChart built from telemetry + local test results | ✅ Done |
| D-5 | Lesson Completion Breakdown — show progress per Chapter/Unit with named status (`Unit 1: Home Row (9/9 ✅)`, etc.) | ✅ Done |
| D-6 | **[TODO]** Accuracy Progression Timeline (second chart or overlay) | 🔲 Planned |
| D-7 | **[TODO]** Per-lesson WPM heatmap (which lessons the user is fastest/slowest on) | 🔲 Planned |
| D-8 | **[TODO]** Show streak data (current streak, best streak, last active date) | 🔲 Planned |
| D-9 | **[TODO]** Show achievement badges earned by the user | 🔲 Planned |

### 3c. Curriculum / Progress Management

| # | Requirement | Status |
|---|---|---|
| E-1 | Quick preset chips: 10%, 25%, 50%, 75%, 100% | ✅ Done |
| E-2 | Precision slider (0–100%) with live % display | ✅ Done |
| E-3 | Apply Progress Update button with full label showing selected % | ✅ Done |
| E-4 | Real-time progress slider preview showing exact count & percentage slice before applying | ✅ Done |
| E-5 | **[TODO]** Reset progress to 0 — a destructive action with a confirmation dialog | 🔲 Planned |
| E-6 | Granular individual lesson picker modal — toggle completion of ANY single lesson manually | ✅ Done |
| E-7 | Progress edit history — recorded in Admin Audit Log | ✅ Done |

---

## 4. Recovery & Export

| # | Requirement | Status |
|---|---|---|
| F-1 | Export Recovery JSON file per user (reconstructed from Supabase telemetry) | ✅ Done |
| F-2 | Recovery file contains: user profile, test results, stats, activity dates | ✅ Done |
| F-3 | Import recovery file feature (on user settings page for the user themselves) | ✅ Done |
| F-4 | Free Client Email architecture guide & interactive launcher (`mailto:` URI + free Formspree/Web3Forms instructions) | ✅ Done |
| F-5 | **[TODO]** Bulk export — generate recovery files for all users at once as a ZIP | 🔲 Planned |

---

## 5. Certificates

| # | Requirement | Status |
|---|---|---|
| G-1 | Admin can issue a Completion Certificate to any user, even if they haven't finished all lessons (e.g., for school departures) | ✅ Done |
| G-2 | Certificate modal shows: Name, WPM, Accuracy, Date, "Issued by Administrator" | ✅ Done |
| G-3 | Issue Certificate button visible in user profile admin controls | ✅ Done |
| G-4 | Quick Certificate Issue button accessible directly from user card list (one click) | ✅ Done |
| G-5 | **[TODO]** Download certificate as printable PDF / high-res PNG | 🔲 Planned |
| G-6 | **[TODO]** Certificate history — logged in Admin Audit Log | ✅ Done |

---

## 6. Moderation & Banning

| # | Requirement | Status |
|---|---|---|
| H-1 | Ban device by Device ID with custom reason | ✅ Done |
| H-2 | Unban device | ✅ Done |
| H-3 | View list of all currently banned devices & usernames | ✅ Done |
| H-4 | Copy Device ID from telemetry → auto-fills ban form | ✅ Done |
| H-5 | Banned user sees a full-screen ban dialog on login with: reason message, "Request Unban" (opens email dialog), "Delete Account" button | ✅ Done |
| H-6 | Quick Ban button on each user card in the typist list (no need to go to Moderation tab) | ✅ Done |
| H-7 | Quick Unban button from banned list | ✅ Done |
| H-8 | Ban by Username OR Device ID | ✅ Done |
| H-9 | **[TODO]** Temporary ban with auto-expiry date (e.g., "banned for 7 days") | 🔲 Planned |
| H-10 | Ban reason displayed clearly in the list of banned items | ✅ Done |
| H-11 | Moderation audit log — ban/unban history with timestamps and target details | ✅ Done |

---

## 7. Data Sync & Reliability

| # | Requirement | Status |
|---|---|---|
| I-1 | Works offline with local `localStorage` data when Supabase is unreachable | ✅ Done |
| I-2 | Status message on Supabase connection failure | ✅ Done |
| I-3 | IST (India Standard Time) correct timestamps — Supabase stores UTC, display in local timezone via `toLocaleTimeString()` | ✅ Done |
| I-4 | Telemetry fetches from `user_daily_telemetry` with fallback to `app_telemetry` | ✅ Done |
| I-5 | Manual / Auto data refresh interval option (Off, 30s, 1m, 5m) | ✅ Done |
| I-6 | **[TODO]** Supabase real-time subscription for live telemetry (no manual refresh needed) | 🔲 Planned |

---

## 8. UI / UX Standards

| # | Requirement | Status |
|---|---|---|
| J-1 | Fully theme-aware: all colors use `theme.*` tokens — works correctly on all 8 themes (Forest Green, Sunset Orange, Midnight Blue, Dark Forest, Dark Violet, Dark Red, Minimal) | ✅ Done |
| J-2 | Light mode and dark mode both look correct — page background uses `${theme.background}` matching main app | ✅ Done |
| J-3 | AdminPortal.jsx stays small (~260 lines) — each tab in its own component | ✅ Done |
| J-4 | No emoji in tables — Lucide React icons only | ✅ Done |
| J-5 | Telemetry table is horizontally scrollable | ✅ Done |
| J-6 | Filter bar collapses to "1D" badge and expands on click, stays open until re-clicked | ✅ Done |
| J-7 | Chart colors driven by CSS variable `--theme-primary` | ✅ Done |
| J-8 | Mobile-responsive admin layout | ✅ Done |
| J-9 | Loading skeleton screens while data is fetching | ✅ Done |

---

> **Free Email Architecture (F4):**
> 1. `mailto:` launcher opens user's default desktop/mobile email client pre-filled with support address & template at **$0 cost**.
> 2. Web form fallback uses Web3Forms / Formspree free tier (500 submissions/mo) with zero backend setup.
