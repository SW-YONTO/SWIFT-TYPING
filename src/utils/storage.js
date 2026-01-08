// Local storage utilities for multi-user support
export const STORAGE_KEYS = {
  USERS: 'typing_app_users',
  CURRENT_USER: 'typing_app_current_user',
  USER_PROGRESS: 'typing_app_user_progress'
};

export const userManager = {
  // Get all users
  getUsers: () => {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
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
    localStorage.setItem(`${STORAGE_KEYS.USER_PROGRESS}_${userId}`, JSON.stringify(progress));
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

    progressManager.saveUserProgress(userId, progress);

    // Update user summary
    const users = userManager.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      users[userIndex].totalTests = progress.stats.totalTests;
      users[userIndex].averageWPM = Math.round(
        progress.testResults.reduce((sum, result) => sum + result.wpm, 0) / progress.testResults.length
      );
      users[userIndex].averageAccuracy = Math.round(
        progress.testResults.reduce((sum, result) => sum + result.accuracy, 0) / progress.testResults.length
      );
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
    progress.stats.totalTime += testResult.timeSpent;
    progress.stats.totalCharacters += testResult.totalCharacters;
    progress.stats.bestWPM = Math.max(progress.stats.bestWPM, testResult.wpm);
    progress.stats.bestAccuracy = Math.max(progress.stats.bestAccuracy, testResult.accuracy);

    progressManager.saveUserProgress(userId, progress);

    // Update user summary
    const users = userManager.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      users[userIndex].totalTests = progress.stats.totalTests;
      users[userIndex].averageWPM = Math.round(
        progress.testResults.reduce((sum, result) => sum + result.wpm, 0) / progress.testResults.length
      );
      users[userIndex].averageAccuracy = Math.round(
        progress.testResults.reduce((sum, result) => sum + result.accuracy, 0) / progress.testResults.length
      );
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
    navText: 'text-purple-300', // More vibrant purple instead of gray-100
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
    
    const exportData = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      user: user,
      progress: progress,
      streak: streakData,
      achievements: achievements ? JSON.parse(achievements) : null
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
      
      return { success: true, message: 'Data imported successfully!' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

