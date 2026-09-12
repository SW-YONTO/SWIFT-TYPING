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
- [ ] **Steps**:
  1. Open the user app and log in as `test_user_a`.
  2. In a separate tab/window, open the Admin Portal (`#admin`) and navigate to the **Moderation** or **Users** tab.
  3. Locate `test_user_a` and click **Ban User**.
- [ ] **Expected Result**:
  - Within 3 seconds, `test_user_a`'s screen automatically locks with the Suspension modal dialog.
  - User cannot navigate away or type lessons.

### TC-02: Appeal for Unban ➔ Admin Sees Appeal
- [ ] **Steps**:
  1. On the suspended screen of `test_user_a`, click **Appeal Suspension**.
  2. Enter an appeal message (e.g. *"Please unban my account"*) and click **Submit Appeal**.
  3. Switch to the Admin Portal ➔ **Appeals** tab.
- [ ] **Expected Result**:
  - The appeal appears in real time on the Admin Appeals list showing the username, device, and message.

### TC-03: Admin Unban ➔ Automatic Client Restoration
- [ ] **Steps**:
  1. In Admin Portal, click **Unban** on `test_user_a`.
  2. Switch back to `test_user_a`'s screen and observe (do **NOT** refresh or open DevTools).
- [ ] **Expected Result**:
  - Within 3–6 seconds, the ban screen automatically vanishes.
  - A success toast appears: *"Account Restored! Welcome back."*
  - **No manual clearing of `localStorage` is required.**

### TC-04: Multi-Account Device Isolation (No Device Contamination)
- [ ] **Steps**:
  1. On the same device/browser where `test_user_a` was banned, click **Switch User** or **Logout**.
  2. Create or log in to a different account: `test_user_b`.
- [ ] **Expected Result**:
  - `test_user_b` logs in normally and is **NOT banned**.
  - Ban applies strictly to the username, never contaminating other accounts on the same computer.

---

## 📋 Phase 2: User Progress Persistence & Refresh Tests

### TC-05: Lesson Progression (Next Lesson Navigation)
- [ ] **Steps**:
  1. Log in as a student user.
  2. Open **Typing Lessons** and select **Lesson 13** (`Upper Row - Q P`).
  3. Complete the lesson to reach the Results page.
  4. Click the **Next Lesson** button on the Results screen.
- [ ] **Expected Result**:
  - Navigates directly into **Lesson 14** (`Full Upper Row`).
  - Lesson 13 is now marked with a checkmark / completed in curriculum.

### TC-06: Lesson Retry & Idle Persistence
- [ ] **Steps**:
  1. Complete Lesson 14.
  2. On the Results screen, click **Retry** to practice it once more.
  3. Once finished, wait on the page for **15–20 seconds** (allowing background cloud sync to complete).
- [ ] **Expected Result**:
  - Best WPM and accuracy update cleanly without throwing errors.

### TC-07: Hard Reload Persistence (F5 / Restart)
- [ ] **Steps**:
  1. Press `F5` or `Ctrl+R` (or close and restart the Electron app).
  2. Return to **Typing Lessons**.
- [ ] **Expected Result**:
  - Both Lesson 13 and Lesson 14 **remain completed**.
  - Total progress counter (e.g. `15/83`) is preserved.
  - Cloud synchronization does **not** reset lessons to older counts.

---

## 📋 Phase 3: Admin Real-time Synchronization & Controls

### TC-08: Admin Deep Dive Accuracy (No Stale Local Cache)
- [ ] **Steps**:
  1. Have a student complete Home Row (9/9) and Upper Row (6/8) (total 15 lessons).
  2. Open Admin Portal (`#admin`) ➔ select this student in **Users**.
- [ ] **Expected Result**:
  - Top metric shows **`LESSONS DONE: 15 done`** (NOT stuck at 7).
  - Curriculum card shows **Home Row: 9/9 (100%)** and **Upper Row: 6/8 (75%)**.

### TC-09: Admin Progress Slider (Bulk Unlock)
- [ ] **Steps**:
  1. In Admin Deep Dive for the student, drag the **Curriculum Progress Slider** to **50%**.
  2. Click **Apply 50% Progress**.
  3. Look at the student's screen in real time.
- [ ] **Expected Result**:
  - Student receives a toast: *"Administrator unlocked X lessons! (42/83 completed)"*.
  - Student curriculum immediately unlocks up to 50%.

### TC-10: Reverse Real-time Sync (Student Types ➔ Admin Updates Live)
- [ ] **Steps**:
  1. Leave the Admin Portal open with the student's inspector visible (showing 50%).
  2. On the student's machine, type and complete the next locked lesson to reach 52% or 53%.
  3. Watch the Admin screen (do **NOT** refresh the Admin page).
- [ ] **Expected Result**:
  - Within 2–3 seconds, Admin Deep Dive automatically refreshes:
    - Counter updates from 42 ➔ 43 lessons.
    - Slider updates automatically to 52%/53%.

### TC-11: Granular Single Lesson Unlock & Contextual Toast
- [ ] **Steps**:
  1. In Admin Deep Dive, expand a chapter (e.g. *Upper Row* or *Numbers*).
  2. Find any locked lesson (e.g. *"Number Sequences"*).
  3. Click the **Locked** button to toggle it to **Unlocked**.
  4. Look at the student's screen.
- [ ] **Expected Result**:
  - Student immediately gets a toast naming the exact assignment:
    > 🔓 **Lesson Unlocked**: *Administrator unlocked "Number Sequences" for you!*
  - The specific lesson unlocks in the student's curriculum view.

---

## 📋 Phase 4: Typing Engine & UI Stability Tests

### TC-12: Quotes (`"`), Semicolons (`;`), and Special Characters
- [ ] **Steps**:
  1. In **Typing Lessons**, open **Unit 1 Lesson 6** (`Pinky Fingers (A ;)`), or test custom text containing double quotes (`"Hello World!"`), single quotes (`'`), and backslashes.
  2. Type through the double quotes and symbols.
- [ ] **Expected Result**:
  - Virtual hands and active keyboard keys highlight smoothly.
  - **No crash**, no error boundary modal, and no `SyntaxError: 'g[id="""]' is not a valid selector`.

### TC-13: Stats Counter Accuracy (No Double Counting)
- [ ] **Steps**:
  1. Open your profile or check your current `Total Tests` count (e.g. `10 tests`).
  2. Complete **1 test** in *Typing Tests* or *Typing Lessons*.
  3. Check the counter again.
- [ ] **Expected Result**:
  - Counter increments by **exactly +1** (e.g. `11 tests`, NOT `12`).

---

## 📋 Phase 5: Backup, Export & Calendar Restoration Tests

### TC-14: User Local Export Test
- [ ] **Steps**:
  1. Go to **Settings** ➔ scroll down to **Data Backup**.
  2. Click **Export Progress**.
  3. Open the downloaded `.json` file in a text editor.
- [ ] **Expected Result**:
  - JSON contains:
    - `progress.completedLessons` (All completed lessons).
    - `progress.testResults` (Array of tests with `completedAt` timestamps, `wpm`, and `accuracy`).
    - `streak.practiceHistory` (List of practice dates).

### TC-15: Admin Recovery Export Test
- [ ] **Steps**:
  1. In **Admin Portal**, select any active typist with completed lessons.
  2. Click **Export Data**.
  3. Open the downloaded `swift-typing-recovery-<username>.json` file.
- [ ] **Expected Result**:
  - `progress.completedLessons` contains the **actual completed lessons** (NOT an empty `[]` array!).
  - `progress.testResults` contains authentic test records with timestamps.

### TC-16: User Import & Activity Calendar Restoration Test
- [ ] **Steps**:
  1. Create a fresh test user or clear local cache for a test account.
  2. Verify that the Activity Calendar is initially empty.
  3. Go to **Settings** ➔ **Import Progress** ➔ select the Admin recovery JSON from TC-15.
  4. Wait 1.5 seconds for the automatic page reload.
  5. Open the **Analytics Calendar** (from Navigation or Profile).
- [ ] **Expected Result**:
  - All completed lessons are restored into curriculum.
  - **Activity Calendar heatmap lights up with past practice days**.
  - Best WPM and practice streak are restored.

---

## 📋 Phase 6: Software Updater Tests

### TC-17: Desktop App Check for Updates
- [ ] **Steps**:
  1. In the Electron Desktop App, go to **Settings** ➔ **About & Updates**.
  2. Click **Check for Updates**.
- [ ] **Expected Result**:
  - Displays *"Checking for updates..."* animation.
  - Confirms: *"You are on the latest version!"* (v3.26.11).
  - No uncaught exceptions or electron-updater crashes.

### TC-18: Web Browser Check for Updates Fallback
- [ ] **Steps**:
  1. Open the web app in Chrome/Edge (`http://localhost:5173`).
  2. Go to **Settings** ➔ click **Check for Updates**.
- [ ] **Expected Result**:
  - Smoothly queries GitHub releases API without throwing desktop API errors.
  - Informs the user that they are up-to-date with the web version.

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
| **TOTAL** | **18** | | |
