## Offline Typing Application — CoPilot Development Plan

### Introduction

This plan outlines a phased approach to building an **offline, multi-user typing application** using React. The app will provide structured lessons, high-frequency drills, timed tests, and customizable settings, with progress tracking for each user. Each phase includes clear goals, tasks, and deliverables to guide development and AI-assisted coding.

---

### Application Overview

The app features four primary sections accessible via a top navigation bar:

1. **Typing Lessons**

   * Progressive units teaching keyboard rows and symbol sets.
   * Beginner-focused: Home Row ➔ Upper Row ➔ Lower Row & Symbols ➔ Numbers & Symbols.
   * Subdivided by hand groups or symbol categories for targeted practice.

2. **Typing Course**

   * Drills using high-frequency words (e.g., “the,” “is,” “I,” “who”).
   * Noun lists (e.g., “car,” “dog,” “cat,” “hello,” “bye”).
   * Custom drill creation for personalized practice.

3. **Typing Test**

   * Pre-configured passages (e.g., “The quick brown fox jumps over the lazy dog”).
   * Multiple test variants (4–5 different pangrams/sentences).
   * Configurable modes: time-based or word-count limited.

4. **Settings**

   * Theme selection: 4 pre-built color schemes.
   * Default session configuration: duration (30s, 1m, 5m, 10m, custom) and word limit (10, 50, 100, custom).
   * Multi-user profile management: switch between 2–3 users, with data persisted in `localStorage`.

**Core Typing Component**

* A reusable React component drives all typing interactions across lessons, courses, and tests.
* Features:

  * Renders the text passage with a dynamic cursor.
  * Handles keystroke events: correct entries turn grey, errors turn red and prevent cursor advance until fixed.
  * Displays an on-screen keyboard highlighting pressed keys in real time.
  * Accepts props for session duration, word limit, and theme.

**Post-Session Summary**

* Metrics: gross & net WPM, accuracy percentage, total keystrokes, and error count.
* Visual: speed-over-time graph to pinpoint slowdowns/errors.
* Controls: Repeat session, advance to next lesson, or practice error words.

---

## Phase 1: Project Initialization & Navigation

**Goal:** Scaffold the React application, implement routing, and support multiple users.

**Tasks:**

1. **Project Setup**

   * Bootstrap with Vite or Create React App (TypeScript optional).
   * Configure ESLint, Prettier, and Husky for code quality.
2. **Dependencies**

   * `react-router-dom` for client-side routing.
   * `react-icons` for iconography.
   * `classnames` for conditional styling (optional).
3. **Folder Structure**

   ```
   src/
   ├─ components/    # Reusable UI components
   ├─ pages/         # Top-level pages (Home, Lessons, Course, Test, Settings)
   ├─ hooks/         # Custom React hooks
   ├─ utils/         # Static data and helpers
   ├─ styles/        # Global styles and CSS variables
   └─ App.tsx        # Main app shell
   ```
4. **Routing & Navigation**

   * Implement `<BrowserRouter>` with routes:

     * `/` → HomePage (user selection and nav links)
     * `/lessons` → LessonListPage
     * `/course` → CoursePage
     * `/test` → TestListPage
     * `/settings` → SettingsPage
   * Build a shared `NavBar` component with links and active state.
5. **Multi-User Support**

   * Create user profile management in `localStorage`.
   * HomePage displays user avatars/names; allow switching or adding up to 3 profiles.

**Deliverable:** A navigable React app with empty pages and user-switch functionality.

---

## Phase 2: Typing Lessons Module

**Goal:** Develop the structured lesson flow with live typing feedback.

**Tasks:**

1. **Data Modeling**

   * Define `lessons.js` exporting lesson metadata and text passages.
2. **Lesson List UI**

   * LessonListPage: accordions or cards for each unit and subunit.
   * Clickable items navigate to `/lessons/:lessonId`.
3. **LessonPage**

   * Fetch and display the selected text.
   * Embed the `TypingComponent` with default session settings.
4. **TypingComponent Implementation**

   * Split text into character array with unique keys.
   * Manage internal state: `currentIndex`, `errors`, `startTime`, `endTime`.
   * Keystroke handler:

     * Compare `event.key` to expected char.
     * Update UI (grey for correct, red for incorrect).
     * Highlight on-screen key via CSS class toggle.
   * Props:

     * `duration` (optional countdown timer)
     * `wordLimit` (stop after N words)
     * `theme` (inject CSS variables)
     * `onComplete` callback for summary.
5. **Session Summary**

   * Create SummaryPage showing metrics and graph.
   * Use an offline chart library (Chart.js/Recharts) for speed-over-time.
   * Offer action buttons (Repeat, Next, Practice Errors).

**Deliverable:** Fully functional lesson experience with real-time feedback and summary.

---

## Phase 3: High-Frequency Word Drills

**Goal:** Implement a course module for rapid-fire word practice.

**Tasks:**

1. **Word Lists**

   * Create `course.js` with arrays of common words by difficulty level.
2. **CoursePage UI**

   * Display available drills and allow custom list uploads.
3. **Drill Execution**

   * Reuse `TypingComponent` to render word sequences (space-separated).
   * Adjust settings (duration, word limit, theme) as props.
4. **Progress Persistence**

   * Save drill results per user in `localStorage` with timestamp.

**Deliverable:** A responsive course drill section mirroring lesson UI/UX.

---

## Phase 4: Configurable Typing Tests

**Goal:** Provide pre-made tests with flexible timing or word limits.

**Tasks:**

1. **Test Data**

   * Define `tests.js` containing 4–5 pangrammatic sentences.
2. **TestListPage**

   * List tests; clicking navigates to `/test/:testId`.
3. **TestPage Configuration**

   * Let users choose mode: time-based or word-count.
   * Start/pause/reset controls.
   * Use `TypingComponent` for interaction.
4. **Result Recording**

   * Capture metrics and graph data like in lessons.
   * Store in user-specific history.

**Deliverable:** Seamless, configurable typing test experience.

---

## Phase 5: Theming & User Settings

**Goal:** Enable theme switching and persist user preferences.

**Tasks:**

1. **ThemeContext**

   * Implement via React Context or CSS variable injection.
   * Define 4 theme palettes (light, dark, mint, coral).
2. **SettingsPage**

   * UI controls for theme, default duration, and default word limit.
   * Multi-user profile editing (rename, avatar selection).
3. **Persistence Layer**

   * Sync theme and default settings to `localStorage` per user.

**Deliverable:** Intuitive settings interface reflecting across the app.

---

## Phase 6: Progress Analytics

**Goal:** Visualize user performance trends over time.

**Tasks:**

1. **StatsPage**

   * Aggregate session data for the active user.
   * Display summary cards (Total sessions, Best WPM, Avg accuracy).
2. **Charts**

   * Render line chart of WPM vs. date.
   * Bar chart of error counts per session.
3. **Offline Capability**

   * Ensure charts load from local data without network requests.

**Deliverable:** A comprehensive analytics dashboard for self-assessment.

---

## Phase 7: Build Optimization & Offline Packaging

**Goal:** Prepare the app for offline distribution and optimal performance.

**Tasks:**

1. **Build Configuration**

   * Configure Vite/CRA to output static assets.
   * Minify and code-split where applicable.
2. **Service Worker (Optional)**

   * Register for PWA support and offline caching of assets.
3. **Multi-User Data Integrity**

   * Test scenarios with multiple profiles on the same device.
4. **Documentation**

   * Write a comprehensive README: setup, usage, profile management.
   * Include developer notes for future enhancements.

**Deliverable:** Production-ready offline-capable build and developer documentation.

---

*Proceed through each phase sequentially, validating deliverables before progressing. This structured plan will help your AI co-pilot and development team collaborate efficiently.*
