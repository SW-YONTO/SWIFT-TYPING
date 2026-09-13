# Implementation Plan: v3.27.0 — Adaptive Weak Keys, Mechanical Sounds, Settings Auto-Save & Diwali Addon

Deliver three high-impact features and a major UX upgrade for **SWIFT-TYPING v3.27.0**:
1. **Smart Adaptive Practice Engine**: Dynamic weak key detection with tailored 3-stage drills and non-permanent contextual buttons.
2. **Mechanical Sound Pack (Thocky & Cherry MX)**: Realistic switch profiles in the existing Sound Effects card.
3. **Settings UX Auto-Save**: Instant persistence on every change with subtle header feedback (`✓ Saved automatically`), eliminating the need to scroll to the bottom.
4. **Zero-Mess Diwali Festive Addon (`src/addons/diwali/`)**: Complete theme and festive elements isolated in a single folder with a single master toggle (`ENABLE_DIWALI`) and a one-time non-intrusive onboarding banner.

---

## User Review Required

> [!IMPORTANT]
> **Zero-Mess Isolation**: All Diwali theme logic, SVG Diyas, and celebratory particles reside inside `src/addons/diwali/`. Disabling or removing the theme later requires setting `ENABLE_DIWALI = false` or deleting the folder. Core typing components remain 100% clean.

> [!NOTE]
> **One-Time Non-Intrusive Announcement**: To inform users without creating a repetitive headache, an elegant toast banner appears only once on first launch during the festive season. When dismissed or applied, `swift_diwali_announced_v1` is stored in `localStorage`, guaranteeing it **never** appears again.

---

## Architecture & Design Specifications

### 1. Smart Adaptive Weak Key Practice
* **Tracking (`weakKeyManager.js`)**:
  * Tracks per-key accuracy (`hits` vs `errors`) whenever characters are typed forward in [TypingComponent.jsx](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/components/TypingComponent.jsx).
  * Weak key criteria: Keys with at least 5 attempts and `< 85%` accuracy.
* **3-Stage Dynamic Drill Generator**:
  * *Stage 1 (Finger Warmup)*: Targeted bigrams/triads (e.g. `qp pq qpp pqq qpqp`).
  * *Stage 2 (Target Words)*: Curated real English words rich in target letters (e.g. `equip`, `plaque`, `opaque`, `puzzle`, `pique`).
  * *Stage 3 (Flow Sentence)*: Natural flow sentences emphasizing target keys.
* **Minimal Non-Permanent Placement**:
  * **Typing Lessons Page**: A simple button `[ Practice Weak Keys ]` appears next to the progress bar **ONLY when weak keys exist**. If accuracy across all keys is good, this button is **NOT visible**.
  * **Results Page**: A compact card in the right sidebar under *Character Stats* showing target keys and a `[ Practice Weak Keys → ]` button.

### 2. Mechanical Sound Pack
* **Sound Profiles (`soundEffects.js`)**:
  * `thocky`: Deep cream acoustic profile (low resonant frequency, square/saw hybrid with lowpass damping).
  * `cherry`: Sharp tactile click profile with rapid dual-pulse actuation.
  * Existing profiles (`mechanical`, `soft`, `typewriter`) remain intact for backward compatibility.
* **UI Integration**:
  * Add a 2-button selector directly inside the existing Sound Effects card in [Settings.jsx](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/pages/Settings.jsx).

### 3. Settings Auto-Save UX Fix
* **Problem**: Users currently have to scroll through 1,100+ lines of options to click "Save All Settings" at the bottom.
* **Solution**:
  * In `handleSettingChange` and slider/toggle callbacks, immediately invoke `progressManager.updateSettings(currentUser.id, newSettings)` and `onSettingsChange(newSettings)`.
  * Display a subtle header indicator next to the "Settings" title:
    `✓ Saved automatically` (fades in green and smoothly fades after 1.5s).
  * Keep the manual "Save All Settings" button at the bottom for explicit reassurance.

### 4. Zero-Mess Diwali Addon (`src/addons/diwali/`)
* **File Structure**:
  ```
  src/addons/diwali/
  ├── index.js              # Exports ENABLE_DIWALI master flag and theme registration
  ├── diwaliTheme.js        # Color tokens (Midnight Indigo #0e0a14, Golden Amber #f59e0b)
  ├── DiwaliOverlay.jsx     # Bottom corner SVG animated Diyas & subtle celebratory sparks
  ├── DiwaliBanner.jsx      # One-time dismissible announcement banner
  └── diwali.css            # Lightweight CSS animations for diya flame flicker & glow
  ```
* **One-Time Non-Intrusive Announcement Banner**:
  * Checked on mount: `if (ENABLE_DIWALI && !localStorage.getItem('swift_diwali_announced_v1'))`
  * Displays a graceful banner: *"🪔 Shubh Deepawali! New Festive Theme & Mechanical Sounds are here."*
  * Actions: `[ Try Theme ]` (switches theme and closes) | `[ Dismiss ✕ ]` (closes immediately).
  * Auto-dismisses after 10s. Never shown again once dismissed or applied.

---

## Proposed Changes

### Addons Layer
#### [NEW] [index.js](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/addons/diwali/index.js)
Master entry point: exports `ENABLE_DIWALI = true`, `diwaliTheme`, `<DiwaliOverlay />`, and `<DiwaliBanner />`.

#### [NEW] [diwaliTheme.js](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/addons/diwali/diwaliTheme.js)
Complete theme object adhering to Swift-Typing theme schema (`mode: 'dark'`, Royal Midnight Indigo background, Warm Amber accents, high-contrast readable text).

#### [NEW] [DiwaliOverlay.jsx](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/addons/diwali/DiwaliOverlay.jsx)
Pure SVG animated Earthen Diyas with flickering flame resting gently in screen corners, rendered only when `themeKey === 'diwali'`.

#### [NEW] [DiwaliBanner.jsx](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/addons/diwali/DiwaliBanner.jsx)
One-time non-intrusive festive notification banner that records dismissal to `localStorage`.

#### [NEW] [diwali.css](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/addons/diwali/diwali.css)
Keyframe animations for soft flame flicker and warm radial glow.

---

### Core Storage & Logic Layer
#### [NEW] [weakKeyManager.js](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/utils/weakKeyManager.js)
Stores per-key accuracy, detects weak keys (<85%), and generates 3-stage custom drills.

#### [MODIFY] [soundEffects.js](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/utils/soundEffects.js)
Add `thocky` and `cherry` sound synthesis algorithms into `soundProfiles`.

#### [MODIFY] [storage.js](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/utils/storage.js)
Register `diwali` in `themes` conditionally if `ENABLE_DIWALI` is active.

---

### UI & Component Layer
#### [MODIFY] [App.jsx](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/App.jsx)
Mount `<DiwaliBanner />` and `<DiwaliOverlay />` conditionally when `ENABLE_DIWALI` is true.

#### [MODIFY] [Settings.jsx](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/pages/Settings.jsx)
1. Add instant auto-save to `handleSettingChange` and sliders/toggles.
2. Add subtle header indicator `✓ Saved automatically`.
3. Add Sound Profile selector (`Thocky` vs `Cherry MX`) inside Sound Effects card.

#### [MODIFY] [TypingComponent.jsx](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/components/TypingComponent.jsx)
1. Record keystroke accuracy in `weakKeyManager.recordKey()`.
2. Pass weak keys to completion result so Results page can display targeted practice drill.

#### [MODIFY] [TypingLessons.jsx](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/pages/TypingLessons.jsx)
Render `[ Practice Weak Keys ]` button next to progress count **only when weak keys are detected**. Clicking launches the generated drill.

#### [MODIFY] [Results.jsx](file:///d:/1.%20PROGRAMING%20WORKSPACE/1.Projects/100%20Days%20of%20Projects/62.SWIFT-TYPING/src/pages/Results.jsx)
Add compact `Focus Keys Drill` card in the right sidebar under Character Stats when weak keys are present.

---

## Verification Plan

### Automated Checks
- Run `npm run lint` / `npx eslint src` to ensure clean syntax and 0 errors.
- Run `npm run build` to verify Vite bundle compilation without warnings or broken imports.

### Manual Verification
1. **Weak Key Detection**:
   - Type a test intentionally mistyping `p` and `q`.
   - Verify on Results screen: `Focus Keys Drill` card appears with `[ Practice Weak Keys → ]`.
   - Verify in Typing Lessons: `[ Practice Weak Keys ]` button appears.
   - Verify drill progression: Stage 1 bigrams -> Stage 2 words -> Stage 3 sentence.
   - Verify that when no keys are weak, neither button nor card is displayed.
2. **Mechanical Sound Pack**:
   - In Settings, switch between `Thocky` and `Cherry MX`.
   - Click "Test Keypress" and type on keyboard — verify distinct audio acoustic characteristics.
3. **Settings Auto-Save**:
   - Adjust a slider or change a theme in Settings.
   - Verify `✓ Saved automatically` indicator appears in the header.
   - Refresh the page or navigate away — verify settings are preserved without having clicked the bottom button.
4. **Diwali Theme & One-Time Announcement**:
   - Launch app on fresh storage — verify festive banner appears.
   - Click "Dismiss" — verify banner disappears and does NOT reappear on page refresh.
   - Activate "Diwali Festive" theme — verify rich royal dark theme and corner SVG Diyas.
   - Set `ENABLE_DIWALI = false` in `src/addons/diwali/index.js` — verify app reverts to normal stock state cleanly.
