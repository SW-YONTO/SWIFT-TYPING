# ⚡ Swift Typing - Professional Desktop Typing Tutor

<div align="center">

![Version](https://img.shields.io/badge/version-2.5.1-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-61dafb.svg)
![Electron](https://img.shields.io/badge/Electron-39.0.0-47848f.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Rating](https://img.shields.io/badge/rating-8.7%2F10-success.svg)

A **professional-grade offline typing tutor** with Monkeytype-inspired interface, 40+ progressive lessons, 3 engaging games, comprehensive achievements system, and beautiful theming. Built with React and Electron for cross-platform desktop use.

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [What's New](#-whats-new-v251) • [Roadmap](#-roadmap)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Components](#-components)
- [Technologies](#-technologies)
- [Development](#-development)
- [Building](#-building)
- [Contributing](#-contributing)

---

## 🎯 Overview

**Swift Typing** is a **professional-grade desktop typing tutor** that rivals web-based platforms like Monkeytype and TypeRacer while offering the unique advantage of **complete offline functionality**. Perfect for students, professionals, and typing enthusiasts who want to improve their skills with structured learning, engaging games, and comprehensive progress tracking.

### 🏆 Why Swift Typing?

**Unique Advantages:**
- 🥇 **Only offline-first typing tutor** - Works completely without internet
- 🥇 **Desktop-native** - Dedicated Electron app, not browser-dependent
- 🥇 **Best multi-user system** - Perfect for families, schools, shared computers
- 🥇 **Combines lessons + games + tests** - All-in-one learning platform
- 🥇 **Free and open-source** - No subscriptions, ads, or paywalls

### ⭐ Key Features (v2.5.1)

**Learning & Practice:**
- ✅ **40+ Progressive Lessons** (9 units) - Home row to advanced programming
- ✅ **Monkeytype-Inspired Interface** - Smooth word-based display with line jumping
- ✅ **3 Typing Games** - Balloon Pop, Word Crusher, Word Racer
- ✅ **Typing Tests** - Customizable time/word limits with diverse content
- ✅ **Custom Courses** - Quick words, sentences, paragraphs

**Progress & Gamification:**
- ✅ **Achievement System** - 40+ achievements with XP rewards
- ✅ **Streak Tracking** - Daily streak counter with calendar view
- ✅ **Detailed Analytics** - WPM history, accuracy charts, progress visualization
- ✅ **Star Ratings** - Lesson completion with accuracy-based stars
- ✅ **Personal Bests** - Track highest WPM and accuracy

**Customization & UX:**
- ✅ **6 Beautiful Themes** - Light & dark variants (Ocean, Forest, Sunset, Midnight, Violet)
- ✅ **Typography Controls** - 4 font sizes, 4 font families
- ✅ **Virtual Keyboard** - Color-coded finger placement guide
- ✅ **Focus Mode** - Distraction-free typing experience
- ✅ **Hand Position Display** - Visual hand placement guide
- ✅ **Sound Effects** - Optional audio feedback (customizable volume)

**Data & Users:**
- ✅ **Multi-User Support** - Unlimited user profiles with individual progress
- ✅ **Export/Import** - Backup and restore your data
- ✅ **Offline Storage** - All data stored locally in browser
- ✅ **No Account Required** - Privacy-first, no registration needed

---

## 🆕 What's New (v2.5.1)

### Recent Updates (January 2026)

**🎨 Monkeytype-Inspired Typing Interface**
- ✨ Complete redesign with word-based rendering system
- ✨ Smooth line jumping (3-line display, types on middle line)
- ✨ Perfect cursor positioning (including space handling)
- ✨ GPU-accelerated scrolling with instant line transitions
- ✨ Responsive container heights (180px-320px based on font size)
- ✨ Natural browser word wrapping - no manual line calculations

**⚙️ Enhanced Typography System**
- ✨ 5 font sizes (Small to 2XL) with Ctrl+Plus/Minus shortcuts
- ✨ 4 font families (Inter, Roboto, JetBrains Mono, Georgia)
- ✨ Dynamic line heights and spacing per font size
- ✨ Theme-aware color system for all 6 themes

**🎮 Improved Games**
- ✨ Balloon Game - Time-based difficulty progression
- ✨ Word Crusher - Container overflow mechanics
- ✨ Word Racer - Competitive racing with AI opponents

**📊 Better Progress Tracking**
- ✨ Achievement toast notifications on unlock
- ✨ XP system with 40+ achievements
- ✨ Calendar view for daily streak tracking
- ✨ Export/import functionality for data backup

### Known Issues & Limitations
- ⚠️ No cloud sync (all data is local only)
- ⚠️ Limited accessibility features (working on improvements)
- ⚠️ No multiplayer mode yet
- ⚠️ Analytics are basic (advanced features planned)

---

## 🚀 Features

### 📚 Comprehensive Learning System

#### **9 Progressive Units** (40+ Lessons)

1. **Unit 1: Home Row** - Master ASDF and JKL; keys
2. **Unit 2: Upper Row** - Learn QWER and TYUI keys
3. **Unit 3: Lower Row** - Practice ZXCV and BNM keys
4. **Unit 4: Numbers & Symbols** - Type digits and punctuation
5. **Unit 5: Speed Building** - Fast typing with common words
6. **Unit 6: Accuracy Training** - Challenging letter combinations
7. **Unit 7: Professional Typing** - Business emails, programming keywords
8. **Unit 8: Advanced Patterns** - Code snippets, JSON, SQL queries
9. **Unit 9: Real-world Content** - Academic, news, creative writing

### 🎮 Practice Modes

- **Typing Lessons** - 40+ structured lessons across 9 progressive units
  - Unit 1-3: Basic keys (home row, upper row, lower row)
  - Unit 4: Numbers & symbols
  - Unit 5-6: Speed & accuracy training
  - Unit 7-9: Professional, programming, real-world content
  
- **Typing Tests** - Customizable timed tests with various content types
  - Time Mode: 15s to 15 minutes or unlimited
  - Word Mode: 10 to 500 words or unlimited
  - Content types: Speed tests, programming, business, creative writing
  
- **Typing Courses** - Pre-made practice sets
  - Quick Words (100 common short words)
  - Most Used Words (500 high-frequency words)
  - Short Sentences (quick practice)
  - Medium Paragraphs (sustained practice)
  
- **Typing Games** - Three engaging typing games
  - 🎈 Balloon Pop: Type words before balloons float away
  - 📦 Word Crusher: Destroy falling blocks by typing
  - 🏎️ Word Racer: Race against AI opponents

### 🎯 Real-time Statistics

- **WPM Tracking** - Both Gross WPM and Net WPM (adjusted for errors)
- **Accuracy Percentage** - Real-time calculation as you type
- **Error Tracking** - Visual indicators for incorrect keystrokes
- **Timer** - Precise timing for all typing sessions
- **Progress Bar** - Visual completion indicator
- **WPM History Chart** - See your speed fluctuations over time
- **Character Count** - Track typed vs total characters

### 👥 Multi-User Management

- **Unlimited Profiles** - Create as many users as needed
- **Individual Progress** - Each user has their own:
  - Lesson completion tracking
  - Achievement unlocks and XP
  - Statistics and best scores
  - Settings and preferences
  - Test history and analytics
- **Quick Switching** - Easily switch between users
- **Profile Management** - Edit usernames, delete profiles
- **Per-User Streaks** - Daily typing streak tracking
- **Data Isolation** - Complete separation of user data

### 🎨 Beautiful Theming

**Light Themes:**
- 🌊 **Ocean Blue** - Calming blue tones
- 🌲 **Forest Green** - Natural green palette
- 🌅 **Sunset Orange** - Warm orange hues

**Dark Themes:**
- 🌌 **Midnight Blue** - Deep blue for night typing
- 🌳 **Dark Forest** - Dark green for reduced eye strain
- 💜 **Dark Violet** - Purple tones for style

**Theme Features:**
- Instant theme switching
- Consistent color system across all components
- Dark mode optimized for low-light environments
- Accent colors for interactive elements
- Smooth transitions between themes

### 📊 Advanced Tracking & Analytics

- **Real-time Stats**: WPM, Accuracy, Time, Character Count
- **WPM Metrics**:
  - Gross WPM (raw typing speed)
  - Net WPM (adjusted for errors)
  - WPM History Chart (speed over session)
- **Error Tracking**: Visual red highlighting of mistakes
- **Progress Visualization**: 
  - Unit completion percentages
  - Lesson star ratings (based on accuracy)
  - Overall progress bars
- **Best Scores**: Track personal records for WPM and accuracy
- **Test History**: Review past typing sessions
- **Calendar View**: See daily typing activity
- **Streak System**: Daily streak counter with visual indicators
- **Recent Activity Log**: Quick view of recent typing sessions

### 🏆 Achievements & Gamification

**40+ Achievements Across Categories:**

**Speed Achievements:**
- 🐢 Speed Novice (20 WPM) - 50 XP
- 🚶 Getting Faster (30 WPM) - 100 XP
- 🏃 Keyboard Warrior (40 WPM) - 200 XP
- 🚀 Speed Demon (60 WPM) - 500 XP
- ⚡ Lightning Fingers (80 WPM) - 1000 XP
- 👑 Typing Master (100 WPM) - 2000 XP

**Accuracy Achievements:**
- 🎯 Careful Typer (90% accuracy) - 100 XP
- 🎪 Precision Pro (95% accuracy) - 250 XP
- 💎 Perfect Typist (98% accuracy) - 500 XP
- 🏅 Flawless (100% accuracy) - 1000 XP

**Progress Achievements:**
- 📚 Lesson Learner (complete 10 lessons)
- 🎓 Dedicated Student (complete 25 lessons)
- 🏫 Course Master (complete all lessons)
- 💯 Perfectionist (3-star 10 lessons)

**Consistency Achievements:**
- 🔥 On Fire (7-day streak)
- 💪 Consistent Typist (30-day streak)
- 🌟 Dedicated (100-day streak)

**Practice Achievements:**
- ⏱️ Speed Demon (100 tests completed)
- 🎮 Gamer (Play all 3 games)
- 🏆 Champion (Win 50 game rounds)

**Features:**
- Achievement toast notifications on unlock
- XP system for progression tracking
- Visual achievement badges
- Achievement panel with progress tracking
- Category-based organization

### ⚙️ Customization Options

**Typography Settings:**
- **Font Sizes**: Small, Medium, Large, XL, 2XL
  - Keyboard shortcuts: Ctrl+Plus (increase), Ctrl+Minus (decrease), Ctrl+0 (reset)
- **Font Families**: 
  - Inter (modern sans-serif)
  - Roboto (clean sans-serif)
  - JetBrains Mono (monospace for programmers)
  - Georgia (serif for classic look)

**Practice Settings:**
- **Default Mode**: Time, Word, or Lesson mode
- **Time Limits**: 15s, 30s, 1min, 5min, 10min, 15min, unlimited
- **Word Limits**: 10, 25, 50, 100, 200, 500, unlimited
- **Virtual Hand Guide**: Toggle on/off with position controls
- **Sound Effects**: Enable/disable with volume slider (0-100%)

**Visual Features:**
- **Focus Mode**: Hide stats and keyboard for concentration
- **Virtual Keyboard**: Color-coded finger placement guide
  - Red (Pinky), Orange (Ring), Yellow (Middle), Green (Index)
  - Blue (Index), Cyan (Middle), Indigo (Ring), Purple (Pinky)
  - Gray (Thumbs for spacebar)
- **Home Row Highlighting**: Visual emphasis on ASDF JKL; keys
- **Smooth Animations**: GPU-accelerated transitions
- **Responsive Design**: Works on all screen sizes

**Data Management:**
- **Export Progress**: Download all user data as JSON
- **Import Progress**: Restore from backup file
- **Auto-save**: All changes saved automatically
- **Local Storage**: No internet required for operation

---

## 💻 Installation

### Prerequisites

- Node.js 18+ and npm
- Git (optional, for cloning)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/sw-esports/SWIFT-TYPING.git
cd SWIFT-TYPING

# Install dependencies
npm install

# Run in development mode (Web)
npm run dev

# Run in development mode (Electron)
npm run electron-dev

# Build for production
npm run build

# Package as desktop app
npm run dist
```

### Installation Options

**Web Version:**
```bash
npm run dev
# Open http://localhost:5173
```

**Electron Desktop:**
```bash
npm run electron-dev
# Desktop app launches automatically
```

---

## 📖 Usage

### First Time Setup

1. **Launch the Application**
   - Web: Open browser to `http://localhost:5173`
   - Desktop: Launch the installed app

2. **Create a User Profile**
   - Click "Create User"
   - Enter your username
   - Click "Add User"

3. **Select Your Profile**
   - Choose your username from the list
   - Click "Continue as [username]"

### Learning Path

1. **Start with Lessons** (Recommended for beginners)
   - Navigate to "Typing Lessons"
   - Begin with Unit 1: Home Row
   - Complete lessons sequentially (they unlock progressively)

2. **Practice with Courses**
   - Try "Quick Words" for common short words
   - Practice "Most Used Words" for frequency training
   - Work through "Short Sentences" and "Medium Paragraphs"

3. **Take Typing Tests**
   - Challenge yourself with timed tests
   - Try different test content (Classic Fox, Programming, Business, etc.)
   - Customize time/word limits in Settings

### Features Guide

**During Typing:**
- Type naturally; the cursor advances automatically
- Correct characters turn gray, errors turn red
- Current character highlights in blue
- Press Pause to take a break
- Click Restart to start over
- Use Focus Mode to hide distractions

**Virtual Keyboard:**
- Shows which key to press next
- Color-coded by finger (Red=Pinky, Orange=Ring, Yellow=Middle, Green=Index, etc.)
- Home row keys highlighted for reference

**Settings:**
- Choose your favorite theme (light/dark)
- Adjust font size for comfort
- Set default practice mode
- Configure time/word limits
- Toggle virtual hand guide

**Progress Tracking:**
- View completion percentage for each unit
- See your best WPM and accuracy
- Check recent activity and test history
- Review lesson results with star ratings

---

## 📁 Project Structure

```
SWIFT-TYPING/
├── public/                      # Static assets
│   ├── favicon_io/             # App icons
│   ├── fonts/                  # Offline font files
│   ├── hands/                  # Virtual hand images
│   └── manifest.json           # PWA manifest
│
├── src/                        # Source code
│   ├── components/             # React components
│   │   ├── CustomizeModal.jsx  # Practice settings modal
│   │   ├── Footer.jsx          # App footer
│   │   ├── Keyboard.jsx        # Virtual keyboard
│   │   ├── Navigation.jsx      # Top navigation bar
│   │   ├── TypingComponent.jsx # Main typing engine
│   │   ├── UserManager.jsx     # User selection/management
│   │   └── VirtualHand.jsx     # Hand placement guide
│   │
│   ├── contexts/               # React contexts
│   │   └── ThemeContext.jsx    # Theme management
│   │
│   ├── data/                   # Static data
│   │   └── lessons.js          # All lesson content
│   │
│   ├── pages/                  # Page components
│   │   ├── About.jsx           # About page
│   │   ├── Features.jsx        # Features showcase
│   │   ├── Pricing.jsx         # Pricing information
│   │   ├── Results.jsx         # Test results page
│   │   ├── Settings.jsx        # Settings page
│   │   ├── TypingCourses.jsx   # Courses page
│   │   ├── TypingLessons.jsx   # Lessons page
│   │   └── TypingTests.jsx     # Tests page
│   │
│   ├── styles/                 # CSS files
│   │   ├── animations.css      # Animation definitions
│   │   └── fonts.css           # Font imports
│   │
│   ├── utils/                  # Utility functions
│   │   ├── offline.js          # Offline support
│   │   └── storage.js          # localStorage management
│   │
│   ├── App.css                 # App styles
│   ├── App.jsx                 # Main App component
│   ├── index.css               # Global styles + Tailwind
│   └── main.jsx                # React entry point
│
├── main.js                     # Electron main process
├── preload.js                  # Electron preload script
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
├── eslint.config.js            # ESLint rules
└── README.md                   # This file
```

---

## 🏗️ Architecture

### Application Flow

```
User Launch → User Selection → Main App → Navigation → Pages → Typing Component
                                                    ↓
                                               Theme Context
                                                    ↓
                                            Local Storage (Data Persistence)
```

### Key Design Patterns

1. **Context Pattern** - Theme management via React Context
2. **Component Composition** - Reusable TypingComponent across pages
3. **Local-First Storage** - All data in browser localStorage
4. **Progressive Enhancement** - Works offline, loads fast

### Data Flow

```
User Input → TypingComponent → State Updates → Visual Feedback
                                     ↓
                              Progress Calculation
                                     ↓
                              Results Generation
                                     ↓
                            LocalStorage Persistence
                                     ↓
                            User Progress Updated
```

---

## 🧩 Components

### Core Components

#### **TypingComponent** (`src/components/TypingComponent.jsx`)
The heart of the application. Handles all typing logic, real-time statistics, and user interaction.

**Key Features:**
- Character-by-character validation
- Real-time WPM and accuracy calculation
- Error tracking and visualization
- Auto-scrolling text display
- Customizable practice modes (time/word/lesson)
- Focus mode and pause functionality
- Results generation and navigation

**Props:**
```jsx
{
  content: string,           // Text to type
  onComplete: function,      // Callback on completion
  settings: object,          // User settings
  title: string,            // Display title
  isLesson: boolean         // Lesson mode flag
}
```

#### **Keyboard** (`src/components/Keyboard.jsx`)
Visual keyboard with finger placement guidance.

**Features:**
- Highlights current key to press
- Color-coded by finger assignment
- Home row emphasis
- Theme-aware styling
- Responsive layout

#### **UserManager** (`src/components/UserManager.jsx`)
User profile creation and selection interface.

**Features:**
- Create new users
- Delete existing users (with confirmation)
- User statistics display
- Profile selection
- Persistent user sessions

#### **Navigation** (`src/components/Navigation.jsx`)
Top navigation bar with route links and user controls.

**Features:**
- Route navigation
- Current page highlighting
- User profile display
- Theme switcher
- Logout functionality

### Page Components

#### **TypingLessons** (`src/pages/TypingLessons.jsx`)
Structured learning with progressive lesson unlocking.

**Features:**
- 9 units with 40+ lessons
- Progress visualization
- Lesson completion tracking
- Star ratings based on accuracy
- Collapsible progress overview

#### **TypingTests** (`src/pages/TypingTests.jsx`)
Typing tests with various content types.

**Features:**
- Multiple test types (speed, programming, business, etc.)
- Customizable time/word limits
- Test history tracking
- Best score displays

#### **Settings** (`src/pages/Settings.jsx`)
Comprehensive settings and customization.

**Features:**
- Theme selection (6 themes)
- Typography customization
- Practice mode defaults
- Time/word limit configuration
- Username editing
- Statistics sidebar
- Recent activity log

---

## 🎯 Competitive Comparison

| Feature | Swift Typing | Monkeytype | TypeRacer | Keybr | TypingClub |
|---------|--------------|------------|-----------|-------|------------|
| **Offline Mode** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Desktop App** | ✅ Electron | ❌ | ❌ | ❌ | ❌ |
| **Multi-User** | ✅ Unlimited | ❌ | ✅ Account | ✅ Account | ✅ Account |
| **Typing Games** | ✅ 3 Games | ❌ | ✅ Racing | ❌ | ✅ Many |
| **Structured Lessons** | ✅ 40+ | ❌ | ❌ | ✅ Adaptive | ✅ 100+ |
| **Custom Themes** | ✅ 6 Themes | ✅ 100+ | ❌ | ✅ Few | ✅ Many |
| **Advanced Analytics** | ⚠️ Basic | ✅ | ⚠️ Basic | ✅ | ✅ |
| **Achievements** | ✅ 40+ | ❌ | ✅ | ❌ | ✅ |
| **Cloud Sync** | ❌ Planned | ✅ | ✅ | ✅ | ✅ |
| **Multiplayer** | ❌ Planned | ✅ | ✅ | ❌ | ❌ |
| **Free & Open Source** | ✅ | ✅ | ✅ | ✅ | Freemium |
| **Privacy (No Account)** | ✅ | ✅ | ❌ | ❌ | ❌ |

**Swift Typing's Unique Advantages:**
1. 🥇 **Only truly offline typing tutor** - Works without internet
2. 🥇 **Best multi-user system** - Perfect for families/schools
3. 🥇 **All-in-one platform** - Lessons + Tests + Games
4. 🥇 **Privacy-first** - No accounts, no tracking
5. 🥇 **Desktop native** - Optimized for desktop use

---

## 🗺️ Roadmap

### 📅 Phase 1: Critical Improvements (Q1 2026)
**Focus: Accessibility, Testing, Performance**

- [ ] **Accessibility Overhaul** (Priority: CRITICAL)
  - ARIA labels and semantic HTML throughout
  - Screen reader support with announcements
  - Keyboard navigation for all features
  - High contrast mode support
  - Focus indicators and skip links
  
- [ ] **Testing Infrastructure** (Priority: CRITICAL)
  - Setup Vitest + React Testing Library
  - Unit tests for core components
  - Integration tests for user flows
  - E2E tests with Playwright
  - CI/CD pipeline with GitHub Actions
  
- [ ] **Performance Optimization** (Priority: HIGH)
  - Implement virtual scrolling for large lessons
  - Lazy loading for game components
  - Reduce bundle size (target: <500KB)
  - Optimize re-renders in TypingComponent
  - Service worker for PWA caching
  
- [ ] **Keyboard Shortcuts System** (Priority: HIGH)
  - Shortcuts modal (press "?" to show)
  - Global hotkeys (Ctrl+K command palette)
  - Customizable keyboard shortcuts
  - Help documentation integration

### 📅 Phase 2: Advanced Features (Q2 2026)
**Focus: Analytics & Cloud Sync**

- [ ] **Weak Keys Analysis** (Priority: HIGH)
  - Track error rate per key
  - Identify weak fingers/keys
  - Generate targeted practice lessons
  - Visual heatmap of problem areas
  - Personalized improvement suggestions
  
- [ ] **Advanced Analytics Dashboard** (Priority: HIGH)
  - WPM over time with trend lines
  - Accuracy heatmap by time of day
  - Detailed keystroke analysis
  - Session comparison tools
  - Consistency score metric
  - Burst WPM per word tracking
  
- [ ] **Cloud Sync with Firebase** (Priority: HIGH)
  - User authentication (optional)
  - Real-time data synchronization
  - Cross-device progress sync
  - Conflict resolution system
  - Offline-first with cloud backup
  
- [ ] **Daily Challenges** (Priority: MEDIUM)
  - New typing challenge every day
  - Bonus XP and exclusive rewards
  - Challenge history and completion tracking
  - Difficulty tiers (Easy/Medium/Hard)

### 📅 Phase 3: Social & Gamification (Q3 2026)
**Focus: Multiplayer & Competition**

- [ ] **Leaderboards** (Priority: MEDIUM)
  - Global rankings (WPM, accuracy, XP)
  - Friends leaderboards
  - Weekly/monthly/all-time boards
  - Filterable by test type and duration
  
- [ ] **Battle Mode (Multiplayer)** (Priority: MEDIUM)
  - Real-time 1v1 typing races
  - WebSocket-based matchmaking
  - Rating system (ELO)
  - Tournament brackets
  
- [ ] **Custom Lesson Builder** (Priority: MEDIUM)
  - UI for creating custom lessons
  - Import from text file or paste
  - Share lessons with community
  - Lesson rating and reviews
  
- [ ] **Level System & Rewards** (Priority: LOW)
  - Level 1-100 based on XP
  - Unlockable themes and avatars
  - Title system (badges)
  - Seasonal cosmetic rewards

### 📅 Phase 4: Expansion (Q4 2026+)
**Focus: Platform Expansion & AI**

- [ ] **Mobile App (React Native)** (Priority: LOW)
  - iOS and Android apps
  - Touch-optimized keyboard
  - Swipe gestures
  - Haptic feedback
  
- [ ] **Browser Extension** (Priority: LOW)
  - Quick typing practice from any page
  - Typing practice on text selection
  - Progress sync with desktop app
  
- [ ] **AI Typing Coach** (Priority: LOW)
  - Real-time technique feedback
  - Personalized improvement plans
  - Adaptive difficulty adjustment
  - Natural language coaching tips
  
- [ ] **Multilingual Support** (Priority: LOW)
  - Spanish, French, German, Chinese lessons
  - i18n for UI translations
  - Language-specific keyboards
  
- [ ] **Team/Classroom Mode** (Priority: LOW)
  - Teacher dashboard for educators
  - Student group management
  - Assign lessons and track progress
  - Generate class reports

### 🎯 Future Feature Ideas (Under Consideration)

- **Typing RPG Game** - Battle enemies by typing spell names
- **Code Typing Mode** - Practice typing actual code snippets
- **Voice Guidance Mode** - Audio instructions for accessibility
- **Biometric Integration** - Track heart rate during typing
- **Typing Story Mode** - Adventure narrative unlocked through typing
- **Advanced Heatmaps** - Visualize speed/accuracy per key
- **API for Developers** - Integrate Swift Typing into other apps
- **Custom Theme Builder** - Create and share custom themes
- **Replays** - Watch recording of your typing sessions
- **Anti-Cheat System** - Detect paste/copy/cheating

---

## 🛠️ Technologies

### Frontend Framework
- **React 19.1.0** - UI library with latest features
- **React Router DOM 7.6.3** - Client-side routing
- **React Context API** - Global state management

### Styling
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **@tailwindcss/vite** - Vite integration
- **Custom Animations** - CSS keyframe animations

### Icons & Charts
- **Lucide React 0.525.0** - Beautiful icon library
- **React Icons 5.5.0** - Additional icon sets
- **Chart.js 4.5.0** - Data visualization
- **React Chartjs 2** - React wrapper for Chart.js
- **Recharts 3.0.2** - Alternative charting library

### Desktop Application
- **Electron 39.0.0** - Cross-platform desktop framework
- **Electron Builder 26.0.12** - App packaging and distribution

### Build Tools
- **Vite 7.0.0** - Next-generation frontend tooling with lightning-fast HMR
- **@vitejs/plugin-react 4.5.2** - React support for Vite
- **ESLint 9.29.0** - Code linting and quality checks
- **Concurrently 9.2.1** - Run multiple commands simultaneously

### Development Tools
- **Wait-on 8.0.3** - Wait for resources before starting (dev server sync)
- **Cross-env 10.1.0** - Environment variables across platforms
- **Vite Plugin PWA 1.0.1** - Progressive Web App support

---

## 📊 Application Metrics

### Current Status (v2.5.1)

**Code Quality:**
- Lines of Code: ~15,000+
- Components: 30+
- Pages: 8
- Utilities: 8+
- Rating: **8.7/10** ⭐⭐⭐⭐

**Features:**
- Lessons: 40+ across 9 units
- Achievements: 40+ with XP system
- Themes: 6 (3 light + 3 dark)
- Games: 3 fully playable
- Test Types: 10+ content variations

**Performance:**
- Bundle Size: Optimized with code splitting
- Load Time: Fast with Vite
- Render Performance: GPU-accelerated animations
- Storage: Efficient localStorage usage

**User Experience:**
- Multi-user: ✅ Unlimited profiles
- Offline: ✅ 100% offline capable
- Responsive: ✅ All screen sizes
- Accessibility: ⚠️ Basic (improvements planned)

### Testing Coverage (Planned)
- Unit Tests: 0% → Target: 80%+
- Integration Tests: 0% → Target: 70%+
- E2E Tests: 0% → Target: Major flows covered

---

## 📖 Documentation

- **[README.md](README.md)** - This file (setup, features, usage)
- **[APPLICATION_ANALYSIS_REPORT.md](APPLICATION_ANALYSIS_REPORT.md)** - Comprehensive analysis & improvement suggestions
- **[UPDATES.md](UPDATES.md)** - Version history and changelog
- **[LICENSE](LICENSE)** - MIT License details

---

## 👨‍💻 Development

### Development Commands

```bash
# Install dependencies
npm install

# Start Vite dev server (web version)
npm run dev

# Start Electron in development mode
npm run electron
npm run electron-dev  # With hot reload

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup

**Web Development:**
```bash
npm run dev
```
- Vite dev server runs on `http://localhost:5173`
- Hot module replacement enabled
- Fast refresh for React components

**Electron Development:**
```bash
npm run electron-dev
```
- Starts Vite dev server
- Waits for server to be ready
- Launches Electron with hot reload
- DevTools automatically opened

### Code Structure Guidelines

**Component Guidelines:**
- Use functional components with hooks
- Implement proper PropTypes or TypeScript (future)
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use meaningful variable and function names

**State Management:**
- Local state for component-specific data
- Context for global theme and user data
- localStorage for persistence
- No external state libraries needed

**Styling:**
- Tailwind utility classes preferred
- Custom CSS for complex animations
- Theme-aware color classes
- Responsive design patterns

### Performance Optimizations

1. **React Memoization**
   - `React.memo()` for expensive components
   - `useMemo()` for computed values
   - `useCallback()` for stable function references

2. **Code Splitting**
   - Manual chunks in Vite config
   - Vendor, router, charts, icons bundles
   - Lazy loading for large components

3. **Efficient Rendering**
   - Virtualization for long lesson lists
   - Debounced input handling
   - Optimized re-render triggers

---

## 📦 Building

### Build for Production

```bash
# Build web version
npm run build

# Output: dist/ folder
```

### Package as Desktop App

```bash
# Package for current platform
npm run pack

# Build distributables for all platforms
npm run dist

# Output: build/ folder
```

### Platform-Specific Builds

**Windows:**
```bash
npm run dist
# Creates: build/Swift Typing Setup.exe (NSIS installer)
```

**macOS:**
```bash
npm run dist
# Creates: build/Swift Typing.dmg
```

**Linux:**
```bash
npm run dist
# Creates: build/Swift Typing.AppImage
```

### Build Configuration

**Electron Builder Config** (in `package.json`):
- App ID: `com.swifttyping.app`
- Product Name: `Swift Typing`
- Icons in `public/favicon_io/`
- NSIS installer for Windows (user-level, customizable install dir)
- DMG for macOS (supports Intel and ARM)
- AppImage for Linux

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/SW-YONTO/SWIFT-TYPING.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Your Changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation as needed
   - Test thoroughly before submitting

4. **Commit Your Changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```

5. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe your changes clearly
   - Link any related issues
   - Include screenshots if UI changes

### Contribution Ideas

**High Priority:**
- 🎯 Add accessibility features (ARIA labels, screen reader support)
- 🎯 Write unit tests for components
- 🎯 Implement cloud sync functionality
- 🎯 Create advanced analytics dashboard
- 🎯 Add weak keys analysis system

**Medium Priority:**
- 📊 Improve existing games with new levels
- 📊 Create new typing games
- 📊 Add more lesson content (medical, legal, etc.)
- 📊 Implement daily challenges
- 📊 Build custom lesson creator UI

**Low Priority:**
- ✨ Design new themes
- ✨ Add more font families
- ✨ Create animated backgrounds
- ✨ Add sound effect variations
- ✨ Improve mobile responsiveness

### Development Guidelines

- Follow React best practices and hooks patterns
- Use Tailwind CSS for styling (utility-first approach)
- Keep components focused and single-purpose
- Write meaningful variable and function names
- Add JSDoc comments for complex functions
- Test on multiple screen sizes
- Ensure offline functionality is maintained

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Keep discussions focused and professional

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**MIT License Summary:**
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ⚠️ No warranty provided
- ⚠️ Attribution required

---

## 🙏 Acknowledgments

- Built with ❤️ using React and Electron
- Inspired by **Monkeytype**, TypeRacer, Keybr, and TypingClub
- Icons by [Lucide Icons](https://lucide.dev/) and [React Icons](https://react-icons.github.io/react-icons/)
- Fonts: Inter, Roboto, JetBrains Mono, Georgia
- Charts by [Chart.js](https://www.chartjs.org/) and [Recharts](https://recharts.org/)
- Styling by [Tailwind CSS](https://tailwindcss.com/)

**Special Thanks:**
- The React and Electron communities
- All contributors and testers
- Open source developers worldwide

---

## 📧 Support & Contact

**Need Help?**
- 📖 Read the [comprehensive analysis report](APPLICATION_ANALYSIS_REPORT.md)
- 🐛 [Open an issue](https://github.com/SW-YONTO/SWIFT-TYPING/issues) on GitHub
- 💬 Discussions: GitHub Discussions (coming soon)
- 📧 Email: Contact SW-YONTO team

**Found a Bug?**
Please open an issue with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Your OS and app version

**Feature Request?**
We'd love to hear your ideas! Open an issue with:
- Feature description
- Use case / motivation
- Suggested implementation (optional)

---

## 📈 Project Stats

![GitHub stars](https://img.shields.io/github/stars/SW-YONTO/SWIFT-TYPING?style=social)
![GitHub forks](https://img.shields.io/github/forks/SW-YONTO/SWIFT-TYPING?style=social)
![GitHub issues](https://img.shields.io/github/issues/SW-YONTO/SWIFT-TYPING)
![GitHub pull requests](https://img.shields.io/github/issues-pr/SW-YONTO/SWIFT-TYPING)

**Version:** 2.5.1  
**Last Updated:** January 8, 2026  
**Status:** Active Development  
**Rating:** 8.7/10 ⭐⭐⭐⭐

---

<div align="center">

**Made with ⚡ by SW-YONTO (Suraj Maurya)**

*Helping people type faster, one keystroke at a time.*

[⬆ Back to Top](#-swift-typing---professional-desktop-typing-tutor)

</div>
