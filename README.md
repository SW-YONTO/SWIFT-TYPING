# ⚡ Swift Typing - Desktop Typing Tutor

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-61dafb.svg)
![Electron](https://img.shields.io/badge/Electron-37.2.0-47848f.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A comprehensive offline typing tutor desktop application built with React and Electron, featuring structured lessons, practice modes, multi-user support, and beautiful theming.

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture) • [Development](#-development)

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

**Swift Typing** is a modern, feature-rich desktop typing tutor application designed to help users improve their typing speed and accuracy through structured lessons, customizable practice modes, and comprehensive progress tracking. Built as an Electron desktop app, it works completely offline with all data stored locally.

### Key Highlights

- ✅ **9 Progressive Learning Units** - From home row basics to advanced programming content
- ✅ **Multi-User Support** - Perfect for families, classrooms, or shared computers
- ✅ **6 Beautiful Themes** - Light and dark mode variants
- ✅ **Offline First** - No internet required, all data stored locally
- ✅ **Cross-Platform** - Windows, macOS, and Linux support
- ✅ **Real-time Feedback** - Live WPM, accuracy, and error tracking
- ✅ **Virtual Keyboard** - Color-coded finger placement guide
- ✅ **Focus Mode** - Distraction-free typing experience
- ✅ **Customizable** - Font sizes, families, time/word limits

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

- **Lesson Mode** - Structured learning with unlockable progression
- **Time Mode** - Practice for a set duration (15s to 15 minutes)
- **Word Mode** - Type a specific number of words (10 to 500)
- **Typing Tests** - Challenge yourself with curated content
- **Custom Courses** - Practice with common words and phrases

### 👥 Multi-User Management

- Create unlimited user profiles
- Individual progress tracking per user
- Switch between users instantly
- Delete users with confirmation
- Edit usernames on the fly
- Per-user statistics and achievements

### 🎨 Beautiful Theming

**Light Themes:**
- Ocean Blue
- Forest Green  
- Sunset Orange

**Dark Themes:**
- Midnight Blue
- Dark Forest
- Dark Violet

### 📊 Advanced Tracking

- **Real-time Stats**: WPM, Accuracy, Time
- **Gross vs Net WPM**: Track both typing speeds
- **Error Tracking**: See exactly where you made mistakes
- **WPM History**: Chart showing speed over time
- **Progress Visualization**: Unit and lesson completion tracking
- **Best Scores**: Track personal records

### ⚙️ Customization Options

**Typography:**
- 4 font sizes (Small to Extra Large)
- 4 font families (Inter, Roboto, JetBrains Mono, Georgia)

**Practice Settings:**
- Default practice mode (Time/Word/Lesson)
- Time limits (15s, 30s, 1min, 5min, 10min, 15min, unlimited)
- Word limits (10, 25, 50, 100, 200, 500, unlimited)
- Virtual hand guide toggle

**Visual Features:**
- Focus mode for distraction-free typing
- Virtual keyboard with finger color-coding
- Home row highlighting
- Animated progress bars
- Achievement badges

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
- **Electron 37.2.0** - Cross-platform desktop framework
- **Electron Builder 26.0.12** - App packaging and distribution

### Build Tools
- **Vite 7.0.0** - Next-generation frontend tooling
- **@vitejs/plugin-react** - React support for Vite
- **ESLint** - Code linting
- **Concurrently** - Run multiple commands

### Development Tools
- **Wait-on** - Wait for resources before starting
- **Cross-env** - Environment variables across platforms

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

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Your Changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed
- Keep commits focused and descriptive

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ using React and Electron
- Icons by [Lucide](https://lucide.dev/)
- Fonts: Inter, Roboto, JetBrains Mono, Georgia
- Inspired by typing tutors like TypeRacer, Keybr, and TypingClub

---

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: sw-esports team

---

<div align="center">

**Made with ⚡ by the Swift Typing Team**

[⬆ Back to Top](#-swift-typing---desktop-typing-tutor)

</div>
