import { telemetry } from './telemetryTracker';

// Local storage utilities for multi-user support
export const STORAGE_KEYS = {
  USERS: 'typing_app_users',
  CURRENT_USER: 'typing_app_current_user',
  USER_PROGRESS: 'typing_app_user_progress',
  ADMIN_AUDIT_LOGS: 'swift_admin_audit_logs',
  BANNED_DEVICES: 'swift_banned_devices'
};

// Safe localStorage helper with error handling
const safeStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('LocalStorage read failed:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('LocalStorage write failed:', error);
      return false;
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('LocalStorage remove failed:', error);
      return false;
    }
  }
};

export const userManager = {
  // Get all users
  getUsers: () => {
    try {
      const usersRaw = safeStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersRaw) return [];
      const users = JSON.parse(usersRaw);
      let needsSave = false;

      const syncedUsers = users.map(user => {
        if (!user || !user.id) return user;
        const progressRaw = safeStorage.getItem(`${STORAGE_KEYS.USER_PROGRESS}_${user.id}`);
        if (!progressRaw) return user;
        try {
          const prog = JSON.parse(progressRaw);
          if (prog && prog.testResults) {
            const nonGameResults = prog.testResults.filter(r => r.type !== 'game');
            const totalTests = prog.stats?.totalTests || prog.testResults.length;
            const averageWPM = nonGameResults.length
              ? Math.round(nonGameResults.reduce((sum, r) => sum + (r.wpm || 0), 0) / nonGameResults.length)
              : (user.averageWPM || 0);
            const averageAccuracy = nonGameResults.length
              ? Math.round(nonGameResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) / nonGameResults.length)
              : (user.averageAccuracy || 0);

            if (user.totalTests !== totalTests || user.averageWPM !== averageWPM || user.averageAccuracy !== averageAccuracy) {
              needsSave = true;
              return { ...user, totalTests, averageWPM, averageAccuracy };
            }
          }
        } catch (e) {}
        return user;
      });

      if (needsSave) {
        safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(syncedUsers));
      }
      return syncedUsers;
    } catch (error) {
      console.warn('Failed to parse users:', error);
      return [];
    }
  },

  // Add new user
  addUser: (username, avatar = 'avatar1.png') => {
    const users = userManager.getUsers();
    const newUser = {
      id: Date.now().toString(),
      username,
      avatar,
      createdAt: new Date().toISOString(),
      totalTests: 0,
      averageWPM: 0,
      averageAccuracy: 0
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  // Set current user
  setCurrentUser: (userId) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
  },

  // Get current user
  getCurrentUser: () => {
    const userId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!userId) return null;
    
    const users = userManager.getUsers();
    return users.find(user => user.id === userId) || null;
  },

  // Delete user
  deleteUser: (userId) => {
    const users = userManager.getUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
    
    // Clear current user if deleted
    const currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (currentUserId === userId) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    
    // Clear user progress
    localStorage.removeItem(`${STORAGE_KEYS.USER_PROGRESS}_${userId}`);
  },

  // Update user avatar
  updateUserAvatar: (userId, avatar) => {
    const users = userManager.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      users[userIndex].avatar = avatar;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return users[userIndex];
    }
    return null;
  }
};

export const progressManager = {
  // Get user progress
  getUserProgress: (userId) => {
    const progress = localStorage.getItem(`${STORAGE_KEYS.USER_PROGRESS}_${userId}`);
    return progress ? JSON.parse(progress) : {
      completedLessons: [],
      testResults: [],
      settings: {
        theme: 'blue',
        timeLimit: 60,
        wordLimit: 50,
        showVirtualHand: false
      },
      stats: {
        totalTests: 0,
        totalTime: 0,
        totalCharacters: 0,
        bestWPM: 0,
        bestAccuracy: 0
      }
    };
  },

  // Save user progress
  saveUserProgress: (userId, progress) => {
    try {
      const users = userManager.getUsers();
      const u = users.find(usr => usr.id === userId);
      if (u) {
        progress.userId = userId;
        progress.username = u.username;
      }
    } catch (e) {}
    localStorage.setItem(`${STORAGE_KEYS.USER_PROGRESS}_${userId}`, JSON.stringify(progress));
    try {
      const activeUserId = localStorage.getItem('typing_app_current_user');
      if (activeUserId && activeUserId === userId) {
        telemetry.syncUserProgress(userId);
      }
    } catch (e) {}
  },

  // Mark lesson as completed
  completLesson: (userId, lessonId, result) => {
    const progress = progressManager.getUserProgress(userId);
    
    // Remove existing result for this lesson
    progress.completedLessons = progress.completedLessons.filter(
      lesson => lesson.lessonId !== lessonId
    );
    
    // Add new result
    progress.completedLessons.push({
      lessonId,
      ...result,
      completedAt: new Date().toISOString()
    });

    // Update stats (same as saveTestResult)
    progress.stats.totalTests += 1;
    progress.stats.totalTime += result.timeSpent || 0;
    progress.stats.totalCharacters += result.totalCharacters || 0;
    progress.stats.bestWPM = Math.max(progress.stats.bestWPM, result.wpm || 0);
    progress.stats.bestAccuracy = Math.max(progress.stats.bestAccuracy, result.accuracy || 0);

    // Also add to testResults for recent activity
    progress.testResults.push({
      ...result,
      testTitle: `Lesson: ${lessonId}`,
      type: 'lesson',
      completedAt: new Date().toISOString()
    });

    // Record telemetry stats for live admin tracking
    try {
      telemetry.recordTest({
        wpm: result.wpm || 0,
        accuracy: result.accuracy || 0,
        timeSpent: result.timeSpent || 0,
        type: 'lesson',
        lessonId,
        completedLessonsCount: progress.completedLessons.length,
        totalTimeSeconds: progress.stats.totalTime,
        bestWPM: progress.stats.bestWPM,
        bestAccuracy: progress.stats.bestAccuracy
      });
    } catch (e) {}

    progressManager.saveUserProgress(userId, progress);

    // Update user summary - EXCLUDE games from WPM/accuracy averages
    const users = userManager.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      const nonGameResults = progress.testResults.filter(r => r.type !== 'game');
      users[userIndex].totalTests = progress.stats.totalTests;
      
      if (nonGameResults.length > 0) {
        users[userIndex].averageWPM = Math.round(
          nonGameResults.reduce((sum, result) => sum + (result.wpm || 0), 0) / nonGameResults.length
        );
        users[userIndex].averageAccuracy = Math.round(
          nonGameResults.reduce((sum, result) => sum + (result.accuracy || 0), 0) / nonGameResults.length
        );
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  },

  // Save test result
  saveTestResult: (userId, testResult) => {
    const progress = progressManager.getUserProgress(userId);
    
    progress.testResults.push({
      ...testResult,
      completedAt: new Date().toISOString()
    });

    // Update stats
    progress.stats.totalTests += 1;
    progress.stats.totalTime += testResult.timeSpent || 0;
    progress.stats.totalCharacters += testResult.totalCharacters || 0;
    progress.stats.bestWPM = Math.max(progress.stats.bestWPM, testResult.wpm || 0);
    progress.stats.bestAccuracy = Math.max(progress.stats.bestAccuracy, testResult.accuracy || 0);

    // Record telemetry stats
    try {
      telemetry.recordTest({
        wpm: testResult.wpm || 0,
        accuracy: testResult.accuracy || 0,
        timeSpent: testResult.timeSpent || 0,
        type: testResult.type || 'test',
        completedLessonsCount: progress.completedLessons.length,
        totalTimeSeconds: progress.stats.totalTime,
        bestWPM: progress.stats.bestWPM,
        bestAccuracy: progress.stats.bestAccuracy
      });
    } catch (e) {}

    // Update stats
    progress.stats.totalTests += 1;
    progress.stats.totalTime += testResult.timeSpent;
    progress.stats.totalCharacters += testResult.totalCharacters;
    progress.stats.bestWPM = Math.max(progress.stats.bestWPM, testResult.wpm);
    progress.stats.bestAccuracy = Math.max(progress.stats.bestAccuracy, testResult.accuracy);

    progressManager.saveUserProgress(userId, progress);

    // Update user summary - EXCLUDE games from WPM/accuracy averages
    const users = userManager.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      // Filter out game results for WPM calculation
      const nonGameResults = progress.testResults.filter(r => r.type !== 'game');
      users[userIndex].totalTests = progress.stats.totalTests;
      
      if (nonGameResults.length > 0) {
        users[userIndex].averageWPM = Math.round(
          nonGameResults.reduce((sum, result) => sum + (result.wpm || 0), 0) / nonGameResults.length
        );
        users[userIndex].averageAccuracy = Math.round(
          nonGameResults.reduce((sum, result) => sum + (result.accuracy || 0), 0) / nonGameResults.length
        );
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  },

  // Update settings
  updateSettings: (userId, settings) => {
    const progress = progressManager.getUserProgress(userId);
    progress.settings = { ...progress.settings, ...settings };
    progressManager.saveUserProgress(userId, progress);
  }
};

// Utility functions
export const calculateWPM = (correctCharacters, timeInSeconds) => {
  if (timeInSeconds === 0 || timeInSeconds < 1) return 0;
  const timeInMinutes = timeInSeconds / 60;
  return Math.round((correctCharacters / 5) / timeInMinutes);
};

export const calculateGrossWPM = (totalCharacters, timeInSeconds) => {
  if (timeInSeconds === 0 || timeInSeconds < 1) return 0;
  const timeInMinutes = timeInSeconds / 60;
  return Math.round((totalCharacters / 5) / timeInMinutes);
};

export const calculateWordsTyped = (text) => {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const calculateAccuracy = (correctCharacters, totalCharacters) => {
  if (totalCharacters === 0) return 100;
  return Math.round((correctCharacters / totalCharacters) * 100);
};

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const themes = {
  // Light Themes
  blue: {
    name: 'Ocean Blue',
    mode: 'light',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    secondary: 'bg-blue-100',
    secondaryHover: 'hover:bg-blue-200',
    accent: 'text-blue-600',
    accentHover: 'hover:text-blue-700',
    background: 'bg-blue-50',
    surface: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-blue-200',
    navbar: 'bg-white',
    navText: 'text-blue-700', // More vibrant blue instead of gray-800
    navBorder: 'border-gray-200',
    cardBg: 'bg-white',
    inputBg: 'bg-gray-50',
    correctBg: 'bg-gray-100',
    errorBg: 'bg-red-200',
    errorText: 'text-red-700',
    currentBg: 'bg-blue-400',
    keyboardBg: 'bg-gray-50',
    keyBg: 'bg-white',
    keyBorder: 'border-gray-300',
    keyText: 'text-gray-700',
    homeRowBg: 'bg-blue-100',
    homeRowText: 'text-blue-600',
    progressBg: 'bg-gray-200',
    progressFill: 'bg-blue-500',
    css: {
      '--theme-primary': '#2563eb',
      '--theme-secondary': '#dbeafe',
      '--theme-accent': '#2563eb',
      '--theme-background': '#eff6ff',
      '--theme-surface': '#ffffff',
      '--theme-text': '#111827',
      '--theme-cursor': '#2563eb'
    }
  },
  green: {
    name: 'Forest Green',
    mode: 'light',
    primary: 'bg-green-600',
    primaryHover: 'hover:bg-green-700',
    secondary: 'bg-green-100',
    secondaryHover: 'hover:bg-green-200',
    accent: 'text-green-600',
    accentHover: 'hover:text-green-700',
    background: 'bg-green-50',
    surface: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-green-200',
    navbar: 'bg-white',
    navText: 'text-green-700', // More vibrant green instead of gray-800
    navBorder: 'border-gray-200',
    cardBg: 'bg-white',
    inputBg: 'bg-gray-50',
    correctBg: 'bg-gray-100',
    errorBg: 'bg-red-200',
    errorText: 'text-red-700',
    currentBg: 'bg-green-400',
    keyboardBg: 'bg-gray-50',
    keyBg: 'bg-white',
    keyBorder: 'border-gray-300',
    keyText: 'text-gray-700',
    homeRowBg: 'bg-green-100',
    homeRowText: 'text-green-600',
    progressBg: 'bg-gray-200',
    progressFill: 'bg-green-500',
    css: {
      '--theme-primary': '#16a34a',
      '--theme-secondary': '#dcfce7',
      '--theme-accent': '#16a34a',
      '--theme-background': '#f0fdf4',
      '--theme-surface': '#ffffff',
      '--theme-text': '#111827',
      '--theme-cursor': '#16a34a'
    }
  },
  orange: {
    name: 'Sunset Orange',
    mode: 'light',
    primary: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-700',
    secondary: 'bg-orange-100',
    secondaryHover: 'hover:bg-orange-200',
    accent: 'text-orange-600',
    accentHover: 'hover:text-orange-700',
    background: 'bg-orange-50',
    surface: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-orange-200',
    navbar: 'bg-white',
    navText: 'text-orange-700', // More vibrant orange instead of gray-800
    navBorder: 'border-gray-200',
    cardBg: 'bg-white',
    inputBg: 'bg-gray-50',
    correctBg: 'bg-gray-100',
    errorBg: 'bg-red-200',
    errorText: 'text-red-700',
    currentBg: 'bg-orange-400',
    keyboardBg: 'bg-gray-50',
    keyBg: 'bg-white',
    keyBorder: 'border-gray-300',
    keyText: 'text-gray-700',
    homeRowBg: 'bg-orange-100',
    homeRowText: 'text-orange-600',
    progressBg: 'bg-gray-200',
    progressFill: 'bg-orange-500',
    css: {
      '--theme-primary': '#ea580c',
      '--theme-secondary': '#fed7aa',
      '--theme-accent': '#ea580c',
      '--theme-background': '#fff7ed',
      '--theme-surface': '#ffffff',
      '--theme-text': '#111827',
      '--theme-cursor': '#ea580c'
    }
  },
  // Dark Themes
  darkBlue: {
    name: 'Midnight Blue',
    mode: 'dark',
    primary: 'bg-blue-500',
    primaryHover: 'hover:bg-blue-400',
    secondary: 'bg-blue-900',
    secondaryHover: 'hover:bg-blue-800',
    accent: 'text-blue-400',
    accentHover: 'hover:text-blue-300',
    background: 'bg-gray-900',
    surface: 'bg-gray-800',
    text: 'text-gray-100',
    textSecondary: 'text-gray-300',
    border: 'border-gray-700',
    navbar: 'bg-gray-800',
    navText: 'text-blue-300', // More vibrant blue instead of gray-100
    navBorder: 'border-gray-700',
    cardBg: 'bg-gray-800',
    inputBg: 'bg-gray-700',
    correctBg: 'bg-gray-600',
    errorBg: 'bg-red-900',
    errorText: 'text-red-300',
    currentBg: 'bg-blue-500',
    keyboardBg: 'bg-gray-800',
    keyBg: 'bg-gray-700',
    keyBorder: 'border-gray-600',
    keyText: 'text-gray-100',
    homeRowBg: 'bg-blue-900',
    homeRowText: 'text-blue-400',
    progressBg: 'bg-gray-700',
    progressFill: 'bg-blue-500',
    css: {
      '--theme-primary': '#3b82f6',
      '--theme-secondary': '#1e3a8a',
      '--theme-accent': '#60a5fa',
      '--theme-background': '#111827',
      '--theme-surface': '#1f2937',
      '--theme-text': '#f9fafb',
      '--theme-cursor': '#3b82f6'
    }
  },
  darkGreen: {
    name: 'Dark Forest',
    mode: 'dark',
    primary: 'bg-green-500',
    primaryHover: 'hover:bg-green-400',
    secondary: 'bg-green-900',
    secondaryHover: 'hover:bg-green-800',
    accent: 'text-green-400',
    accentHover: 'hover:text-green-300',
    background: 'bg-gray-900',
    surface: 'bg-gray-800',
    text: 'text-gray-100',
    textSecondary: 'text-gray-300',
    border: 'border-gray-700',
    navbar: 'bg-gray-800',
    navText: 'text-green-300', // More vibrant green instead of gray-100
    navBorder: 'border-gray-700',
    cardBg: 'bg-gray-800',
    inputBg: 'bg-gray-700',
    correctBg: 'bg-gray-600',
    errorBg: 'bg-red-900',
    errorText: 'text-red-300',
    currentBg: 'bg-green-500',
    keyboardBg: 'bg-gray-800',
    keyBg: 'bg-gray-700',
    keyBorder: 'border-gray-600',
    keyText: 'text-gray-100',
    homeRowBg: 'bg-green-900',
    homeRowText: 'text-green-400',
    progressBg: 'bg-gray-700',
    progressFill: 'bg-green-500',
    css: {
      '--theme-primary': '#22c55e',
      '--theme-secondary': '#14532d',
      '--theme-accent': '#4ade80',
      '--theme-background': '#111827',
      '--theme-surface': '#1f2937',
      '--theme-text': '#f9fafb',
      '--theme-cursor': '#22c55e'
    }
  },
  darkPurple: {
    name: 'Dark Violet',
    mode: 'dark',
    primary: 'bg-violet-600',
    primaryHover: 'hover:bg-violet-500',
    secondary: 'bg-[#2e1065]',
    secondaryHover: 'hover:bg-[#3b0764]',
    accent: 'text-[#d946ef]',
    accentHover: 'hover:text-[#f472b6]',
    background: 'bg-[#0b0713]',
    surface: 'bg-[#160f24]',
    text: 'text-[#e9e3f5]',
    textSecondary: 'text-[#a78bfa]',
    border: 'border-[#3b0764]/40',
    navbar: 'bg-[#160f24]',
    navText: 'text-[#e9e3f5]',
    navBorder: 'border-[#3b0764]/40',
    cardBg: 'bg-[#160f24]',
    inputBg: 'bg-[#0b0713]',
    correctBg: 'bg-violet-950/40',
    errorBg: 'bg-red-950/50',
    errorText: 'text-red-400',
    currentBg: 'bg-violet-600',
    keyboardBg: 'bg-[#160f24]',
    keyBg: 'bg-[#2e1065]/20',
    keyBorder: 'border-[#3b0764]/40',
    keyText: 'text-[#e9e3f5]',
    homeRowBg: 'bg-[#3b0764]/50',
    homeRowText: 'text-[#d946ef]',
    progressBg: 'bg-[#2e1065]/40',
    progressFill: 'bg-violet-600',
    css: {
      '--theme-primary': '#8b5cf6',
      '--theme-secondary': '#2e1065',
      '--theme-accent': '#d946ef',
      '--theme-background': '#0b0713',
      '--theme-surface': '#160f24',
      '--theme-text': '#e9e3f5',
      '--theme-cursor': '#8b5cf6',
      
      '--background': '#0b0713',
      '--foreground': '#e9e3f5',
      '--card': '#160f24',
      '--card-foreground': '#e9e3f5',
      '--popover': '#160f24',
      '--popover-foreground': '#e9e3f5',
      '--primary': '#8b5cf6',
      '--primary-foreground': '#ffffff',
      '--secondary': '#2e1065',
      '--secondary-foreground': '#e9e3f5',
      '--muted': '#1c132c',
      '--muted-foreground': '#a78bfa',
      '--accent': '#d946ef',
      '--accent-foreground': '#ffffff',
      '--destructive': '#ef4444',
      '--destructive-foreground': '#ffffff',
      '--border': '#3b0764',
      '--input': '#2e1065',
      '--ring': '#8b5cf6',
      '--chart-1': '#8b5cf6',
      '--chart-2': '#d946ef',
      '--chart-3': '#3b82f6',
      '--chart-4': '#10b981',
      '--chart-5': '#f59e0b',
      '--sidebar': '#160f24',
      '--sidebar-foreground': '#e9e3f5',
      '--sidebar-primary': '#8b5cf6',
      '--sidebar-primary-foreground': '#ffffff',
      '--sidebar-accent': '#2e1065',
      '--sidebar-accent-foreground': '#e9e3f5',
      '--sidebar-border': '#3b0764',
      '--sidebar-ring': '#8b5cf6',
      '--radius': '0.75rem'
    }
  },
  darkPurpleOld: {
    name: 'Dark Violet (Legacy)',
    mode: 'dark',
    primary: 'bg-purple-500',
    primaryHover: 'hover:bg-purple-400',
    secondary: 'bg-purple-900',
    secondaryHover: 'hover:bg-purple-800',
    accent: 'text-purple-400',
    accentHover: 'hover:text-purple-300',
    background: 'bg-gray-900',
    surface: 'bg-gray-800',
    text: 'text-gray-100',
    textSecondary: 'text-gray-300',
    border: 'border-gray-700',
    navbar: 'bg-gray-800',
    navText: 'text-purple-300',
    navBorder: 'border-gray-700',
    cardBg: 'bg-gray-800',
    inputBg: 'bg-gray-700',
    correctBg: 'bg-gray-600',
    errorBg: 'bg-red-900',
    errorText: 'text-red-300',
    currentBg: 'bg-purple-500',
    keyboardBg: 'bg-gray-800',
    keyBg: 'bg-gray-700',
    keyBorder: 'border-gray-600',
    keyText: 'text-gray-100',
    homeRowBg: 'bg-purple-900',
    homeRowText: 'text-purple-400',
    progressBg: 'bg-gray-700',
    progressFill: 'bg-purple-500',
    css: {
      '--theme-primary': '#a855f7',
      '--theme-secondary': '#581c87',
      '--theme-accent': '#c084fc',
      '--theme-background': '#111827',
      '--theme-surface': '#1f2937',
      '--theme-text': '#f9fafb',
      '--theme-cursor': '#a855f7'
    }
  },
  iyami: {
    name: 'Iyami',
    mode: 'dark',
    primary: 'bg-[#ffffff]',
    primaryHover: 'hover:bg-neutral-200',
    secondary: 'bg-[#3a3a3a]',
    secondaryHover: 'hover:bg-[#4b4b4b]',
    accent: 'text-neutral-50',
    accentHover: 'hover:text-[#ffffff]',
    background: 'bg-[#000000]',
    surface: 'bg-[#1f1f1f]',
    text: 'text-[#ffffff]',
    textSecondary: 'text-[#b1b1b1]',
    border: 'border-[#3d3d3d]',
    navbar: 'bg-[#282828]',
    navText: 'text-[#ffffff]',
    navBorder: 'border-[#3d3d3d]',
    cardBg: 'bg-[#1f1f1f]',
    inputBg: 'bg-[#000000]',
    correctBg: 'bg-[#3a3a3a]/60',
    errorBg: 'bg-red-950/50',
    errorText: 'text-[#ff4f56]',
    currentBg: 'bg-[#727272]',
    keyboardBg: 'bg-[#282828]',
    keyBg: 'bg-[#3a3a3a]/20',
    keyBorder: 'border-[#3d3d3d]/60',
    keyText: 'text-[#ffffff]',
    homeRowBg: 'bg-[#3a3a3a]/80',
    homeRowText: 'text-[#ffffff]',
    progressBg: 'bg-[#3a3a3a]',
    progressFill: 'bg-[#ffffff]',
    css: {
      '--theme-primary': '#ffffff',
      '--theme-secondary': '#3a3a3a',
      '--theme-accent': '#ffffff',
      '--theme-background': '#000000',
      '--theme-surface': '#1f1f1f',
      '--theme-text': '#ffffff',
      '--theme-cursor': '#ffffff',
      
      '--background': 'oklch(0 0 0)',
      '--foreground': 'oklch(1.00 0 0)',
      '--card': 'oklch(0.14 0 0)',
      '--card-foreground': 'oklch(1.00 0 0)',
      '--popover': 'oklch(0.18 0 0)',
      '--popover-foreground': 'oklch(1.00 0 0)',
      '--primary': 'oklch(1.00 0 0)',
      '--primary-foreground': 'oklch(0 0 0)',
      '--secondary': 'oklch(0.25 0 0)',
      '--secondary-foreground': 'oklch(1.00 0 0)',
      '--muted': 'oklch(0.23 0 0)',
      '--muted-foreground': 'oklch(0.72 0 0)',
      '--accent': 'oklch(0.32 0 0)',
      '--accent-foreground': 'oklch(1.00 0 0)',
      '--destructive': 'oklch(0.69 0.20 23.91)',
      '--destructive-foreground': 'oklch(0 0 0)',
      '--border': 'oklch(0.26 0 0)',
      '--input': 'oklch(0.32 0 0)',
      '--ring': 'oklch(0.72 0 0)',
      '--chart-1': 'oklch(0.81 0.17 75.35)',
      '--chart-2': 'oklch(0.58 0.21 260.84)',
      '--chart-3': 'oklch(0.56 0 0)',
      '--chart-4': 'oklch(0.44 0 0)',
      '--chart-5': 'oklch(0.92 0 0)',
      '--sidebar': 'oklch(0.18 0 0)',
      '--sidebar-foreground': 'oklch(1.00 0 0)',
      '--sidebar-primary': 'oklch(1.00 0 0)',
      '--sidebar-primary-foreground': 'oklch(0 0 0)',
      '--sidebar-accent': 'oklch(0.32 0 0)',
      '--sidebar-accent-foreground': 'oklch(1.00 0 0)',
      '--sidebar-border': 'oklch(0.32 0 0)',
      '--sidebar-ring': 'oklch(0.72 0 0)',
      '--radius': '0.5rem'
    }
  },
  coffeeCafe: {
    name: 'Coffee Café',
    mode: 'light',
    primary: 'bg-[#644a40]',
    primaryHover: 'hover:bg-[#53392f]',
    secondary: 'bg-[#ffdfb5]',
    secondaryHover: 'hover:bg-[#ffe6c4]',
    accent: 'text-[#644a40]',
    accentHover: 'hover:text-[#53392f]',
    background: 'bg-[#f9f9f9]',
    surface: 'bg-[#fcfcfc]',
    text: 'text-[#202020]',
    textSecondary: 'text-[#646464]',
    border: 'border-[#d8d8d8]',
    navbar: 'bg-[#fcfcfc]',
    navText: 'text-[#202020]',
    navBorder: 'border-[#d8d8d8]',
    cardBg: 'bg-[#fcfcfc]',
    inputBg: 'bg-[#f9f9f9]',
    correctBg: 'bg-[#ffdfb5]/30',
    errorBg: 'bg-red-50',
    errorText: 'text-[#e54d2e]',
    currentBg: 'bg-[#644a40]',
    keyboardBg: 'bg-[#efefef]',
    keyBg: 'bg-[#fcfcfc]',
    keyBorder: 'border-[#d8d8d8]',
    keyText: 'text-[#202020]',
    homeRowBg: 'bg-[#ffdfb5]/40',
    homeRowText: 'text-[#582d1d]',
    progressBg: 'bg-[#d8d8d8]',
    progressFill: 'bg-[#644a40]',
    css: {
      '--theme-primary': '#644a40',
      '--theme-secondary': '#ffdfb5',
      '--theme-accent': '#644a40',
      '--theme-background': '#f9f9f9',
      '--theme-surface': '#fcfcfc',
      '--theme-text': '#202020',
      '--theme-cursor': '#644a40',

      '--background': 'oklch(0.98 0 0)',
      '--foreground': 'oklch(0.20 0 0)',
      '--card': 'oklch(0.99 0 0)',
      '--card-foreground': 'oklch(0.20 0 0)',
      '--popover': 'oklch(0.99 0 0)',
      '--popover-foreground': 'oklch(0.20 0 0)',
      '--primary': 'oklch(0.40 0.05 45)',
      '--primary-foreground': 'oklch(1 0 0)',
      '--secondary': 'oklch(0.92 0.07 80)',
      '--secondary-foreground': 'oklch(0.32 0.08 40)',
      '--muted': 'oklch(0.95 0 0)',
      '--muted-foreground': 'oklch(0.48 0 0)',
      '--accent': 'oklch(0.93 0 0)',
      '--accent-foreground': 'oklch(0.20 0 0)',
      '--destructive': 'oklch(0.58 0.20 30)',
      '--destructive-foreground': 'oklch(1 0 0)',
      '--border': 'oklch(0.88 0 0)',
      '--input': 'oklch(0.88 0 0)',
      '--ring': 'oklch(0.40 0.05 45)',
      '--chart-1': 'oklch(0.40 0.05 45)',
      '--chart-2': 'oklch(0.92 0.07 80)',
      '--chart-3': 'oklch(0.93 0 0)',
      '--chart-4': 'oklch(0.94 0.06 80)',
      '--chart-5': 'oklch(0.40 0.05 45)',
      '--sidebar': 'oklch(0.99 0 0)',
      '--sidebar-foreground': 'oklch(0.22 0 0)',
      '--sidebar-primary': 'oklch(0.28 0 0)',
      '--sidebar-primary-foreground': 'oklch(0.99 0 0)',
      '--sidebar-accent': 'oklch(0.97 0 0)',
      '--sidebar-accent-foreground': 'oklch(0.28 0 0)',
      '--sidebar-border': 'oklch(0.88 0 0)',
      '--sidebar-ring': 'oklch(0.40 0.05 45)',
      '--radius': '0.75rem'
    }
  },
  amethystHaze: {
    name: 'Amethyst Haze',
    mode: 'light',
    primary: 'bg-[#8b5cf6]',
    primaryHover: 'hover:bg-[#7c3aed]',
    secondary: 'bg-[#f3f0ff]',
    secondaryHover: 'hover:bg-[#ede9fe]',
    accent: 'text-[#8b5cf6]',
    accentHover: 'hover:text-[#7c3aed]',
    background: 'bg-[#faf8ff]',
    surface: 'bg-[#ffffff]',
    text: 'text-[#1e1033]',
    textSecondary: 'text-[#6e6185]',
    border: 'border-[#e4dff5]',
    navbar: 'bg-[#ffffff]',
    navText: 'text-[#1e1033]',
    navBorder: 'border-[#e4dff5]',
    cardBg: 'bg-[#ffffff]',
    inputBg: 'bg-[#faf8ff]',
    correctBg: 'bg-purple-50',
    errorBg: 'bg-red-50',
    errorText: 'text-red-600',
    currentBg: 'bg-[#8b5cf6]',
    keyboardBg: 'bg-[#f3f0ff]',
    keyBg: 'bg-[#ffffff]',
    keyBorder: 'border-[#e4dff5]',
    keyText: 'text-[#1e1033]',
    homeRowBg: 'bg-purple-100',
    homeRowText: 'text-purple-700',
    progressBg: 'bg-[#e4dff5]',
    progressFill: 'bg-[#8b5cf6]',
    css: {
      '--theme-primary': '#8b5cf6',
      '--theme-secondary': '#f3f0ff',
      '--theme-accent': '#8b5cf6',
      '--theme-background': '#faf8ff',
      '--theme-surface': '#ffffff',
      '--theme-text': '#1e1033',
      '--theme-cursor': '#8b5cf6',

      '--background': 'oklch(0.98 0.01 290)',
      '--foreground': 'oklch(0.18 0.04 290)',
      '--card': 'oklch(1 0.003 290)',
      '--card-foreground': 'oklch(0.18 0.04 290)',
      '--popover': 'oklch(1 0.003 290)',
      '--popover-foreground': 'oklch(0.18 0.04 290)',
      '--primary': 'oklch(0.55 0.22 285)',
      '--primary-foreground': 'oklch(0.99 0.005 290)',
      '--secondary': 'oklch(0.96 0.02 290)',
      '--secondary-foreground': 'oklch(0.25 0.04 290)',
      '--muted': 'oklch(0.96 0.02 290)',
      '--muted-foreground': 'oklch(0.50 0.04 290)',
      '--accent': 'oklch(0.94 0.03 285)',
      '--accent-foreground': 'oklch(0.22 0.04 290)',
      '--destructive': 'oklch(0.63 0.24 27)',
      '--destructive-foreground': 'oklch(0.99 0 0)',
      '--border': 'oklch(0.91 0.03 285)',
      '--input': 'oklch(0.91 0.03 285)',
      '--ring': 'oklch(0.55 0.22 285)',
      '--chart-1': 'oklch(0.55 0.22 285)',
      '--chart-2': 'oklch(0.62 0.18 310)',
      '--chart-3': 'oklch(0.68 0.15 260)',
      '--chart-4': 'oklch(0.74 0.12 235)',
      '--chart-5': 'oklch(0.80 0.09 210)',
      '--sidebar': 'oklch(0.985 0.008 290)',
      '--sidebar-foreground': 'oklch(0.18 0.04 290)',
      '--sidebar-primary': 'oklch(0.55 0.22 285)',
      '--sidebar-primary-foreground': 'oklch(1 0 0)',
      '--sidebar-accent': 'oklch(0.94 0.03 285)',
      '--sidebar-accent-foreground': 'oklch(0.20 0.04 290)',
      '--sidebar-border': 'oklch(0.91 0.03 285)',
      '--sidebar-ring': 'oklch(0.55 0.22 285)',
      '--radius': '0.75rem'
    }
  },
  incognito: {
    name: 'Incognito',
    mode: 'dark',
    primary: 'bg-[#ff9900]',
    primaryHover: 'hover:bg-[#ffad33]',
    secondary: 'bg-[#252525]',
    secondaryHover: 'hover:bg-[#303030]',
    accent: 'text-[#ff9900]',
    accentHover: 'hover:text-[#ffad33]',
    background: 'bg-[#0e0e0e]',
    surface: 'bg-[#151515]',
    text: 'text-[#c6c6c6]',
    textSecondary: 'text-[#555555]',
    border: 'border-[#2a2a2a]',
    navbar: 'bg-[#151515]',
    navText: 'text-[#c6c6c6]',
    navBorder: 'border-[#2a2a2a]',
    cardBg: 'bg-[#151515]',
    inputBg: 'bg-[#0e0e0e]',
    correctBg: 'bg-[#1a1400]/60',
    errorBg: 'bg-[#e44545]/15',
    errorText: 'text-[#e44545]',
    currentBg: 'bg-[#ff9900]',
    keyboardBg: 'bg-[#151515]',
    keyBg: 'bg-[#1a1a1a]',
    keyBorder: 'border-[#2a2a2a]/60',
    keyText: 'text-[#c6c6c6]',
    homeRowBg: 'bg-[#ff9900]/15',
    homeRowText: 'text-[#ff9900]',
    progressBg: 'bg-[#2a2a2a]',
    progressFill: 'bg-[#ff9900]',
    css: {
      '--theme-primary': '#ff9900',
      '--theme-secondary': '#151515',
      '--theme-accent': '#ff9900',
      '--theme-background': '#0e0e0e',
      '--theme-surface': '#151515',
      '--theme-text': '#c6c6c6',
      '--theme-cursor': '#ff9900',

      '--background': 'oklch(0.10 0 0)',
      '--foreground': 'oklch(0.82 0 0)',
      '--card': 'oklch(0.14 0 0)',
      '--card-foreground': 'oklch(0.82 0 0)',
      '--popover': 'oklch(0.14 0 0)',
      '--popover-foreground': 'oklch(0.82 0 0)',
      '--primary': 'oklch(0.75 0.17 70)',
      '--primary-foreground': 'oklch(0.10 0 0)',
      '--secondary': 'oklch(0.18 0 0)',
      '--secondary-foreground': 'oklch(0.82 0 0)',
      '--muted': 'oklch(0.18 0 0)',
      '--muted-foreground': 'oklch(0.42 0 0)',
      '--accent': 'oklch(0.22 0 0)',
      '--accent-foreground': 'oklch(0.82 0 0)',
      '--destructive': 'oklch(0.58 0.22 25)',
      '--destructive-foreground': 'oklch(0.95 0 0)',
      '--border': 'oklch(0.22 0 0)',
      '--input': 'oklch(0.22 0 0)',
      '--ring': 'oklch(0.75 0.17 70)',
      '--chart-1': 'oklch(0.75 0.17 70)',
      '--chart-2': 'oklch(0.68 0.14 55)',
      '--chart-3': 'oklch(0.62 0.11 40)',
      '--chart-4': 'oklch(0.55 0.08 85)',
      '--chart-5': 'oklch(0.48 0.05 100)',
      '--sidebar': 'oklch(0.14 0 0)',
      '--sidebar-foreground': 'oklch(0.82 0 0)',
      '--sidebar-primary': 'oklch(0.75 0.17 70)',
      '--sidebar-primary-foreground': 'oklch(0.10 0 0)',
      '--sidebar-accent': 'oklch(0.18 0 0)',
      '--sidebar-accent-foreground': 'oklch(0.82 0 0)',
      '--sidebar-border': 'oklch(0.22 0 0)',
      '--sidebar-ring': 'oklch(0.75 0.17 70)',
      '--radius': '0.625rem'
    }
  }
};

// Daily Streak Manager
export const streakManager = {
  STREAK_KEY: 'typing_app_streak',
  
  getStreakData: (userId) => {
    const data = localStorage.getItem(`${streakManager.STREAK_KEY}_${userId}`);
    return data ? JSON.parse(data) : {
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null,
      practiceHistory: [] // Array of dates with practice
    };
  },
  
  saveStreakData: (userId, data) => {
    localStorage.setItem(`${streakManager.STREAK_KEY}_${userId}`, JSON.stringify(data));
  },
  
  recordPractice: (userId) => {
    const data = streakManager.getStreakData(userId);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Already practiced today
    if (data.lastPracticeDate === today) {
      return data;
    }
    
    // Update streak
    if (data.lastPracticeDate === yesterday) {
      // Continuing streak
      data.currentStreak += 1;
    } else if (data.lastPracticeDate !== today) {
      // Streak broken or first practice
      data.currentStreak = 1;
    }
    
    // Update longest streak
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
    data.lastPracticeDate = today;
    
    // Add to history (keep last 365 days)
    if (!data.practiceHistory.includes(today)) {
      data.practiceHistory.push(today);
      if (data.practiceHistory.length > 365) {
        data.practiceHistory = data.practiceHistory.slice(-365);
      }
    }
    
    streakManager.saveStreakData(userId, data);
    return data;
  },
  
  checkStreak: (userId) => {
    const data = streakManager.getStreakData(userId);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // If last practice wasn't today or yesterday, streak is broken
    if (data.lastPracticeDate !== today && data.lastPracticeDate !== yesterday) {
      if (data.currentStreak > 0) {
        data.currentStreak = 0;
        streakManager.saveStreakData(userId, data);
      }
    }
    
    return data;
  }
};

// Data Export/Import Manager
export const dataManager = {
  exportUserData: (userId) => {
    const progress = progressManager.getUserProgress(userId);
    const streakData = streakManager.getStreakData(userId);
    const users = userManager.getUsers();
    const user = users.find(u => u.id === userId);
    const achievements = localStorage.getItem(`typing_achievements_${userId}`);
    const keyStats = keyStatsManager.getKeyStats(userId);
    
    const exportData = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      user: user,
      progress: progress,
      streak: streakData,
      achievements: achievements ? JSON.parse(achievements) : null,
      keyStats: keyStats
    };
    
    return JSON.stringify(exportData, null, 2);
  },
  
  downloadExport: (userId, username) => {
    const data = dataManager.exportUserData(userId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swift-typing-backup-${username}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  importUserData: (userId, jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate structure
      if (!data.version || !data.progress) {
        throw new Error('Invalid backup file format');
      }
      
      // Import user data (avatar, username, global stats)
      if (data.user) {
        const users = userManager.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...data.user, id: userId }; // ensure ID stays the same
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
      }

      // Import progress
      if (data.progress) {
        progressManager.saveUserProgress(userId, data.progress);
      }
      
      // Import streak data
      if (data.streak) {
        streakManager.saveStreakData(userId, data.streak);
      }
      
      // Import achievements
      if (data.achievements) {
        localStorage.setItem(`typing_achievements_${userId}`, JSON.stringify(data.achievements));
      }
      
      // Import key stats
      if (data.keyStats) {
        keyStatsManager.saveKeyStats(userId, data.keyStats);
      }
      
      return { success: true, message: 'Data imported successfully!' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

// Key Statistics Manager - Track weak keys
export const keyStatsManager = {
  KEY_STATS_KEY: 'typing_app_key_stats',
  
  // Get key stats for a user
  getKeyStats: (userId) => {
    try {
      const data = localStorage.getItem(`${keyStatsManager.KEY_STATS_KEY}_${userId}`);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },
  
  // Save key stats
  saveKeyStats: (userId, stats) => {
    try {
      localStorage.setItem(`${keyStatsManager.KEY_STATS_KEY}_${userId}`, JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to save key stats:', error);
    }
  },
  
  // Track a key press (correct or error)
  trackKey: (userId, key, isCorrect) => {
    const stats = keyStatsManager.getKeyStats(userId);
    const lowerKey = key.toLowerCase();
    
    if (!stats[lowerKey]) {
      stats[lowerKey] = { correct: 0, errors: 0, total: 0 };
    }
    
    stats[lowerKey].total += 1;
    if (isCorrect) {
      stats[lowerKey].correct += 1;
    } else {
      stats[lowerKey].errors += 1;
    }
    
    keyStatsManager.saveKeyStats(userId, stats);
    return stats;
  },
  
  // Batch track multiple keys (for performance)
  trackKeysBatch: (userId, keyResults) => {
    const stats = keyStatsManager.getKeyStats(userId);
    
    keyResults.forEach(({ key, isCorrect }) => {
      const lowerKey = key.toLowerCase();
      
      if (!stats[lowerKey]) {
        stats[lowerKey] = { correct: 0, errors: 0, total: 0 };
      }
      
      stats[lowerKey].total += 1;
      if (isCorrect) {
        stats[lowerKey].correct += 1;
      } else {
        stats[lowerKey].errors += 1;
      }
    });
    
    keyStatsManager.saveKeyStats(userId, stats);
    return stats;
  },
  
  // Get weak keys (keys with high error rate)
  getWeakKeys: (userId, minAttempts = 10, maxAccuracy = 90) => {
    const stats = keyStatsManager.getKeyStats(userId);
    const weakKeys = [];
    
    Object.entries(stats).forEach(([key, data]) => {
      if (data.total >= minAttempts) {
        const accuracy = (data.correct / data.total) * 100;
        if (accuracy < maxAccuracy) {
          weakKeys.push({
            key,
            accuracy: Math.round(accuracy),
            correct: data.correct,
            errors: data.errors,
            total: data.total
          });
        }
      }
    });
    
    // Sort by accuracy (lowest first)
    return weakKeys.sort((a, b) => a.accuracy - b.accuracy);
  },
  
  // Get key accuracy for visualization
  getAllKeyAccuracies: (userId) => {
    const stats = keyStatsManager.getKeyStats(userId);
    const accuracies = {};
    
    Object.entries(stats).forEach(([key, data]) => {
      if (data.total > 0) {
        accuracies[key] = {
          accuracy: Math.round((data.correct / data.total) * 100),
          total: data.total,
          errors: data.errors
        };
      }
    });
    
    return accuracies;
  },
  
  // Generate practice content for weak keys
  generateWeakKeyPractice: (userId, wordCount = 20) => {
    const weakKeys = keyStatsManager.getWeakKeys(userId);
    if (weakKeys.length === 0) {
      return null;
    }
    
    // Common words containing weak keys
    const wordBank = {
      'a': ['and', 'are', 'as', 'at', 'about', 'after', 'also', 'made', 'have', 'can'],
      'b': ['be', 'been', 'but', 'back', 'before', 'being', 'both', 'best', 'job', 'able'],
      'c': ['can', 'come', 'could', 'call', 'case', 'each', 'such', 'much', 'place', 'back'],
      'd': ['do', 'did', 'day', 'down', 'during', 'end', 'good', 'made', 'need', 'said'],
      'e': ['each', 'even', 'ever', 'every', 'end', 'here', 'where', 'these', 'make', 'time'],
      'f': ['for', 'from', 'first', 'find', 'few', 'after', 'before', 'off', 'life', 'self'],
      'g': ['get', 'go', 'good', 'great', 'give', 'going', 'long', 'thing', 'big', 'high'],
      'h': ['have', 'has', 'had', 'he', 'him', 'his', 'how', 'here', 'help', 'home'],
      'i': ['in', 'is', 'it', 'if', 'into', 'its', 'like', 'time', 'with', 'this'],
      'j': ['just', 'job', 'join', 'jump', 'judge', 'major', 'project', 'object', 'enjoy', 'adjust'],
      'k': ['know', 'keep', 'kind', 'key', 'work', 'make', 'like', 'look', 'take', 'back'],
      'l': ['like', 'long', 'look', 'last', 'left', 'life', 'little', 'well', 'all', 'will'],
      'm': ['make', 'more', 'most', 'must', 'man', 'may', 'many', 'much', 'time', 'some'],
      'n': ['new', 'now', 'no', 'not', 'never', 'need', 'next', 'into', 'own', 'one'],
      'o': ['of', 'on', 'or', 'one', 'out', 'over', 'only', 'own', 'other', 'come'],
      'p': ['people', 'place', 'part', 'put', 'point', 'program', 'up', 'help', 'keep', 'top'],
      'q': ['question', 'quick', 'quite', 'quality', 'require', 'unique', 'equal', 'square', 'quiet', 'quote'],
      'r': ['right', 'really', 'rather', 'read', 'run', 'are', 'for', 'from', 'more', 'or'],
      's': ['so', 'some', 'such', 'same', 'still', 'see', 'she', 'should', 'said', 'use'],
      't': ['the', 'to', 'that', 'this', 'they', 'there', 'than', 'time', 'then', 'take'],
      'u': ['up', 'us', 'use', 'used', 'under', 'until', 'much', 'such', 'just', 'but'],
      'v': ['very', 'view', 'value', 'over', 'every', 'even', 'ever', 'have', 'give', 'live'],
      'w': ['will', 'with', 'was', 'we', 'what', 'when', 'where', 'which', 'while', 'who'],
      'x': ['example', 'next', 'experience', 'expect', 'explain', 'exist', 'text', 'extra', 'box', 'fix'],
      'y': ['you', 'your', 'year', 'yes', 'yet', 'any', 'many', 'way', 'say', 'may'],
      'z': ['zero', 'zone', 'size', 'organize', 'realize', 'amazing', 'recognize', 'utilize', 'analyze', 'prize']
    };
    
    // Collect words for weak keys
    const practiceWords = [];
    weakKeys.forEach(({ key }) => {
      const words = wordBank[key] || [];
      practiceWords.push(...words);
    });
    
    // Shuffle and select
    const shuffled = practiceWords.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, wordCount);
    
    return {
      content: selected.join(' '),
      weakKeys: weakKeys.map(k => k.key),
      title: `Weak Keys Practice: ${weakKeys.slice(0, 5).map(k => k.key.toUpperCase()).join(', ')}`
    };
  },
  
  // Reset key stats
  resetKeyStats: (userId) => {
    localStorage.removeItem(`${keyStatsManager.KEY_STATS_KEY}_${userId}`);
  }
};

export const adminAuditManager = {
  getLogs: () => {
    try {
      const logs = safeStorage.getItem(STORAGE_KEYS.ADMIN_AUDIT_LOGS);
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      return [];
    }
  },
  logAction: (action, target, details = '') => {
    try {
      const logs = adminAuditManager.getLogs();
      const newEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        action, // 'PROGRESS_UPDATE', 'USER_BAN', 'USER_UNBAN', 'CERTIFICATE_ISSUED', 'EXPORT_DATA'
        target, // username or device_id
        details,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newEntry);
      // keep max 200 logs
      safeStorage.setItem(STORAGE_KEYS.ADMIN_AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
      return newEntry;
    } catch (e) {
      return null;
    }
  },
  clearLogs: () => {
    safeStorage.removeItem(STORAGE_KEYS.ADMIN_AUDIT_LOGS);
  }
};

export const banManager = {
  getBanned: () => {
    try {
      const list = safeStorage.getItem(STORAGE_KEYS.BANNED_DEVICES);
      return list ? JSON.parse(list) : [];
    } catch (e) {
      return [];
    }
  },
  ban: (deviceId, ban_reason = 'Abuse of service or leaderboard cheating.') => {
    try {
      const list = banManager.getBanned();
      const existingIdx = list.findIndex(b => b.device_id?.toLowerCase() === deviceId.toLowerCase());
      const item = { device_id: deviceId, is_banned: true, ban_reason, banned_at: new Date().toISOString() };
      if (existingIdx >= 0) {
        list[existingIdx] = item;
      } else {
        list.unshift(item);
      }
      safeStorage.setItem(STORAGE_KEYS.BANNED_DEVICES, JSON.stringify(list));
      return list;
    } catch (e) {
      return [];
    }
  },
  unban: (deviceId) => {
    try {
      const list = banManager.getBanned().filter(b => b.device_id?.toLowerCase() !== deviceId.toLowerCase());
      safeStorage.setItem(STORAGE_KEYS.BANNED_DEVICES, JSON.stringify(list));
      return list;
    } catch (e) {
      return [];
    }
  },
  isBanned: (identifier) => {
    if (!identifier) return false;
    const clean = identifier.toLowerCase();
    const list = banManager.getBanned();
    return list.some(b => b.device_id?.toLowerCase() === clean);
  }
};
