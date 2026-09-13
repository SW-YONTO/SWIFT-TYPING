# 🧪 Comprehensive Test Cases — SWIFT-TYPING v3.26.11

Use this test plan to thoroughly verify the application from start to finish. Each test case includes exact steps, expected outcomes, and checkboxes to mark progress.

---

## 🚀 Pre-requisites & Setup
- **App Version**: `v3.26.11`
- **Environments to Test**:
  - Desktop Application (`npm run electron` or installed setup)
  - Web Version (Browser at `http://localhost:5173`)
- **Credentials**:
  - Admin Portal: `#admin` (Password: `admin` or default)

---

## 📋 Phase 1: Account Moderation & Ban/Unban Tests

### TC-01: Admin Ban User ➔ Real-time Client Suspension
- [passed] **Steps**:
  1. Open the user app and log in as `test_user_a`.
  2. In a separate tab/window, open the Admin Portal (`#admin`) and navigate to the **Moderation** or **Users** tab.
  3. Locate `test_user_a` and click **Ban User**.
- [ passed] **Expected Result**:
  - Within 3 seconds, `test_user_a`'s screen automatically locks with the Suspension modal dialog.
  - User cannot navigate away or type lessons.

### TC-02: Appeal for Unban ➔ Admin Sees Appeal
- [ passed ] **Steps**:
  1. On the suspended screen of `test_user_a`, click **Appeal Suspension**.
  2. Enter an appeal message (e.g. *"Please unban my account"*) and click **Submit Appeal**.
  3. Switch to the Admin Portal ➔ **Appeals** tab.
- [ passed ] **Expected Result**:
  - The appeal appears in real time on the Admin Appeals list showing the username, device, and message.

### TC-03: Admin Unban ➔ Automatic Client Restoration
- [ passed ] **Steps**:
  1. In Admin Portal, click **Unban** on `test_user_a`.
  2. Switch back to `test_user_a`'s screen and observe (do **NOT** refresh or open DevTools).
- [ passed ] **Expected Result**:
  - Within 3–6 seconds, the ban screen automatically vanishes.
  - A success toast appears: *"Account Restored! Welcome back."*
  - **No manual clearing of `localStorage` is required.**

### TC-04: Multi-Account Device Isolation (No Device Contamination)
- [ passed ] **Steps**:
  1. On the same device/browser where `test_user_a` was banned, click **Switch User** or **Logout**.
  2. Create or log in to a different account: `test_user_b`.
- [ passed ] **Expected Result**:
  - `test_user_b` logs in normally and is **NOT banned**.
  - Ban applies strictly to the username, never contaminating other accounts on the same computer.

---

## 📋 Phase 2: User Progress Persistence & Refresh Tests

### TC-05: Lesson Progression (Next Lesson Navigation)
- [passed ] **Steps**:
  1. Log in as a student user.
  2. Open **Typing Lessons** and select **Lesson 13** (`Upper Row - Q P`).
  3. Complete the lesson to reach the Results page.
  4. Click the **Next Lesson** button on the Results screen.
- [ passed] **Expected Result**:
  - Navigates directly into **Lesson 14** (`Full Upper Row`).
  - Lesson 13 is now marked with a checkmark / completed in curriculum.

### TC-06: Lesson Retry & Idle Persistence
- [passed ] **Steps**:
  1. Complete Lesson 14.
  2. On the Results screen, click **Retry** to practice it once more.
  3. Once finished, wait on the page for **15–20 seconds** (allowing background cloud sync to complete).
- [ passed ] **Expected Result**:
  - Best WPM and accuracy update cleanly without throwing errors.

### TC-07: Hard Reload Persistence (F5 / Restart)
- [ passed] **Steps**:
  1. Press `F5` or `Ctrl+R` (or close and restart the Electron app).
  2. Return to **Typing Lessons**.
- [ passed] **Expected Result**:
  - Both Lesson 13 and Lesson 14 **remain completed**.
  - Total progress counter (e.g. `15/83`) is preserved.
  - Cloud synchronization does **not** reset lessons to older counts.

---

## 📋 Phase 3: Admin Real-time Synchronization & Controls

### TC-08: Admin Deep Dive Accuracy (No Stale Local Cache)
- [passed ] **Steps**:
  1. Have a student complete Home Row (9/9) and Upper Row (6/8) (total 15 lessons).
  2. Open Admin Portal (`#admin`) ➔ select this student in **Users**.
- [ passed] **Expected Result**:
  - Top metric shows **`LESSONS DONE: 15 done`** (NOT stuck at 7).
  - Curriculum card shows **Home Row: 9/9 (100%)** and **Upper Row: 6/8 (75%)**.

### TC-09: Admin Progress Slider (Bulk Unlock)
- [ passed] **Steps**:
  1. In Admin Deep Dive for the student, drag the **Curriculum Progress Slider** to **50%**.
  2. Click **Apply 50% Progress**.
  3. Look at the student's screen in real time.
- [ passed] **Expected Result**:
  - Student receives a toast: *"Administrator unlocked X lessons! (42/83 completed)"*.
  - Student curriculum immediately unlocks up to 50%.

### TC-10: Reverse Real-time Sync (Student Types ➔ Admin Updates Live)
- [ passed] **Steps**:
  1. Leave the Admin Portal open with the student's inspector visible (showing 50%).
  2. On the student's machine, type and complete the next locked lesson to reach 52% or 53%.
  3. Watch the Admin screen (do **NOT** refresh the Admin page).
- [ passed] **Expected Result**:
  - Within 2–3 seconds, Admin Deep Dive automatically refreshes:
    - Counter updates from 42 ➔ 43 lessons.
    - Slider updates automatically to 52%/53%.

### TC-11: Granular Single Lesson Unlock & Contextual Toast
- [ passed ] **Steps**:
  1. In Admin Deep Dive, expand a chapter (e.g. *Upper Row* or *Numbers*).
  2. Find any locked lesson (e.g. *"Number Sequences"*).
  3. Click the **Locked** button to toggle it to **Unlocked**.
  4. Look at the student's screen.
- [ passed ] **Expected Result**:
  - Student immediately gets a toast naming the exact assignment:
    > 🔓 **Lesson Unlocked**: *Administrator unlocked "Number Sequences" for you!*
  - The specific lesson unlocks in the student's curriculum view.

---

## 📋 Phase 4: Typing Engine & UI Stability Tests

### TC-12: Quotes (`"`), Semicolons (`;`), and Special Characters
- [ passed] **Steps**:
  1. In **Typing Lessons**, open **Unit 1 Lesson 6** (`Pinky Fingers (A ;)`), or test custom text containing double quotes (`"Hello World!"`), single quotes (`'`), and backslashes.
  2. Type through the double quotes and symbols.
- [ passed] **Expected Result**:
  - Virtual hands and active keyboard keys highlight smoothly.
  - **No crash**, no error boundary modal, and no `SyntaxError: 'g[id="""]' is not a valid selector`.

### TC-13: Stats Counter Accuracy (No Double Counting)
- [ passed] **Steps**:
  1. Open your profile or check your current `Total Tests` count (e.g. `10 tests`).
  2. Complete **1 test** in *Typing Tests* or *Typing Lessons*.
  3. Check the counter again.
- [ passed] **Expected Result**:
  - Counter increments by **exactly +1** (e.g. `11 tests`, NOT `12`).

---

## 📋 Phase 5: Backup, Export & Calendar Restoration Tests

### TC-14: User Local Export Test
- [ passed] **Steps**:
  1. Go to **Settings** ➔ scroll down to **Data Backup**.
  2. Click **Export Progress**.
  3. Open the downloaded `.json` file in a text editor.
- [ passed] **Expected Result**:
  - JSON contains:
    - `progress.completedLessons` (All completed lessons).
    - `progress.testResults` (Array of tests with `completedAt` timestamps, `wpm`, and `accuracy`).
    - `streak.practiceHistory` (List of practice dates).

### TC-15: Admin Recovery Export Test
- [ passed] **Steps**:
  1. In **Admin Portal**, select any active typist with completed lessons.
  2. Click **Export Data**.
  3. Open the downloaded `swift-typing-recovery-<username>.json` file.
- [ passed] **Expected Result**:
  - `progress.completedLessons` contains the **actual completed lessons** (NOT an empty `[]` array!).
  - `progress.testResults` contains authentic test records with timestamps.

### TC-16: User Import & Activity Calendar Restoration Test
- [ passed] **Steps**:
  1. Create a fresh test user or clear local cache for a test account.
  2. Verify that the Activity Calendar is initially empty.
  3. Go to **Settings** ➔ **Import Progress** ➔ select the Admin recovery JSON from TC-15.
  4. Wait 1.5 seconds for the automatic page reload.
  5. Open the **Analytics Calendar** (from Navigation or Profile).
- [passed ] **Expected Result**:
  - All completed lessons are restored into curriculum.
  - **Activity Calendar heatmap lights up with past practice days**.
  - Best WPM and practice streak are restored.

---

## 📋 Phase 6: Software Updater Tests

### TC-17: Desktop App Check for Updates
- [ passed] **Steps**:
  1. In the Electron Desktop App, go to **Settings** ➔ **About & Updates**.
  2. Click **Check for Updates**.
- [ passed] **Expected Result**:
  - Displays *"Checking for updates..."* animation.
  - Confirms: *"You are on the latest version!"* (v3.26.11).
  - No uncaught exceptions or electron-updater crashes.

### TC-18: Web Browser Check for Updates Fallback
- [ passed] **Steps**:
  1. Open the web app in Chrome/Edge (`http://localhost:5173`).
  2. Go to **Settings** ➔ click **Check for Updates**.
- [ passed] **Expected Result**:
  - Smoothly queries GitHub releases API without throwing desktop API errors.
  - Informs the user that they are up-to-date with the web version.

---

## 🪔 Phase 7: Smart Adaptive Practice, Mechanical Sounds & Diwali Festive Addon

### TC-19: Mechanical Keyboard Sound Profiles
- [ passed] **Steps**:
  1. Go to **Settings** ➔ scroll to **Sound Effects**.
  2. Select **Thocky (Cream)** ➔ click **Test Keypress** or type on keyboard.
  3. Select **Cherry MX (Clicky)** ➔ click **Test Keypress** or type on keyboard.
- [passed ] **Expected Result**:
  - *Thocky* emits a deep, buttery acoustic switch thock.
  - *Cherry MX* emits a crisp, snappy tactile click.
  - Selection saves immediately without needing to scroll to the bottom.

### TC-20: Settings Auto-Save & Floating Bottom Feedback
- [ ]passed **Steps**:
  1. In **Settings**, change font size or adjust a slider, sound profile, or toggle.
  2. Observe the bottom center of the viewport.
  3. Refresh the page or navigate away without clicking "Save All Settings" at the bottom.
- [ passed] **Expected Result**:
  - Floating pill slides up at the bottom: `[ ✓ Settings saved automatically ]` in dark glassmorphism and emerald text, fading out after 2 seconds.
  - On page refresh, all changed settings remain saved and active.

### TC-21: Smart Adaptive Practice (75% Accuracy Cap & Contextual Buttons)
- [passed ] **Steps**:
  1. Start a typing test or lesson.
  2. Intentionally mistype letters (e.g. `P` and `Q`) repeatedly while typing forward so accuracy for those keys drops below 75%.
  3. Complete the test and reach the **Results** screen.
  4. Look at the action buttons row at the bottom (after **Back to Home**).
  5. Click **Practice Weak Keys**.
  6. In **Typing Flow** (`/courses`), verify the **Practice Weak Keys** button in the Flow Stats header.
- [ passed] **Expected Result**:
  - If weak keys exist (<75% accuracy), a `Practice Weak Keys` button appears directly after **Back to Home** in the same row and same size (`px-8 py-3 rounded-xl`).
  - No bulky card clutters the right-hand stats column.
  - Clicking launches the 3-stage drill: Stage 1 (Warmup bigrams/triads) ➔ Stage 2 (Target words) ➔ Stage 3 (Flow sentence).
  - On **Typing Flow**, the `Practice Weak Keys` button appears in the "Your Flow Stats" header.
  - If a user has no weak keys (<75%), the button is completely hidden (non-permanent).

### TC-22: Zero-Mess Diwali Festive Addon & Per-Account Announcement
- [passed ] **Steps**:
  1. Open the app as a fresh or active user.
  2. Observe the top floating announcement banner.
  3. Click **Try Theme** (or switch to **Diwali Festive ✨** in Settings).
  4. Observe the screen corners, colors, and background.
  5. Close/dismiss the banner and refresh the page.
- [ passed] **Expected Result**:
  - Banner shows: *"🪔 Shubh Deepawali! New Festive Theme & Sounds are live."*
  - Clicking **Try Theme** activates the Royal Midnight Indigo & Golden Amber theme.
  - Handcrafted SVG Earthen Diyas appear in screen corners with flickering animated flames and warm ambient glow.
  - Once dismissed or applied, the banner never appears again for that account on reload.
  - Disabling `ENABLE_DIWALI = false` in `src/addons/diwali/index.js` cleanly reverts the app to 100% stock state with zero errors.

---

## 📊 Summary Scorecard

| Test Suite | Total Cases | Status | Notes |
|---|:---:|:---:|---|
| **Phase 1: Account Moderation & Ban/Unban** | 4 | ⏳ Pending | Tests TC-01 to TC-04 |
| **Phase 2: Progress Persistence & Reload** | 3 | ⏳ Pending | Tests TC-05 to TC-07 |
| **Phase 3: Admin Real-time Synchronization** | 4 | ⏳ Pending | Tests TC-08 to TC-11 |
| **Phase 4: Typing Engine & UI Stability** | 2 | ⏳ Pending | Tests TC-12 to TC-13 |
| **Phase 5: Backup, Export & Calendar** | 3 | ⏳ Pending | Tests TC-14 to TC-16 |
| **Phase 6: Software Updater** | 2 | ⏳ Pending | Tests TC-17 to TC-18 |
| **Phase 7: Adaptive Practice, Sounds & Diwali Addon** | 4 | ⏳ Pending | Tests TC-19 to TC-22 |
| **TOTAL** | **22** | | |
