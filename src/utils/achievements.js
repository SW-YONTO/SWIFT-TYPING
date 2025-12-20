// Achievements & Gamification System for Swift Typing

// Achievement definitions
export const ACHIEVEMENTS = {
  // Speed achievements
  speed_novice: {
    id: 'speed_novice',
    name: 'Speed Novice',
    description: 'Reach 20 WPM in a test',
    icon: '🐢',
    category: 'speed',
    requirement: { type: 'wpm', value: 20 },
    xp: 50
  },
  speed_beginner: {
    id: 'speed_beginner',
    name: 'Getting Faster',
    description: 'Reach 30 WPM in a test',
    icon: '🚶',
    category: 'speed',
    requirement: { type: 'wpm', value: 30 },
    xp: 100
  },
  speed_intermediate: {
    id: 'speed_intermediate',
    name: 'Keyboard Warrior',
    description: 'Reach 40 WPM in a test',
    icon: '🏃',
    category: 'speed',
    requirement: { type: 'wpm', value: 40 },
    xp: 200
  },
  speed_advanced: {
    id: 'speed_advanced',
    name: 'Speed Demon',
    description: 'Reach 60 WPM in a test',
    icon: '🚀',
    category: 'speed',
    requirement: { type: 'wpm', value: 60 },
    xp: 500
  },
  speed_expert: {
    id: 'speed_expert',
    name: 'Lightning Fingers',
    description: 'Reach 80 WPM in a test',
    icon: '⚡',
    category: 'speed',
    requirement: { type: 'wpm', value: 80 },
    xp: 1000
  },
  speed_master: {
    id: 'speed_master',
    name: 'Typing Master',
    description: 'Reach 100 WPM in a test',
    icon: '👑',
    category: 'speed',
    requirement: { type: 'wpm', value: 100 },
    xp: 2000
  },

  // Accuracy achievements
  accuracy_good: {
    id: 'accuracy_good',
    name: 'Careful Typer',
    description: 'Complete a test with 90% accuracy',
    icon: '🎯',
    category: 'accuracy',
    requirement: { type: 'accuracy', value: 90 },
    xp: 100
  },
  accuracy_great: {
    id: 'accuracy_great',
    name: 'Precision Pro',
    description: 'Complete a test with 95% accuracy',
    icon: '🎪',
    category: 'accuracy',
    requirement: { type: 'accuracy', value: 95 },
    xp: 250
  },
  accuracy_perfect: {
    id: 'accuracy_perfect',
    name: 'Perfectionist',
    description: 'Complete a test with 100% accuracy',
    icon: '💎',
    category: 'accuracy',
    requirement: { type: 'accuracy', value: 100 },
    xp: 500
  },

  // Streak achievements
  streak_3: {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Practice 3 days in a row',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 3 },
    xp: 150
  },
  streak_7: {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Practice 7 days in a row',
    icon: '🔥🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 7 },
    xp: 350
  },
  streak_30: {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Practice 30 days in a row',
    icon: '🔥🔥🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 30 },
    xp: 1500
  },
  streak_100: {
    id: 'streak_100',
    name: 'Centurion',
    description: 'Practice 100 days in a row',
    icon: '💯',
    category: 'streak',
    requirement: { type: 'streak', value: 100 },
    xp: 5000
  },

  // Tests completed achievements
  tests_10: {
    id: 'tests_10',
    name: 'Warming Up',
    description: 'Complete 10 typing tests',
    icon: '📝',
    category: 'tests',
    requirement: { type: 'totalTests', value: 10 },
    xp: 100
  },
  tests_50: {
    id: 'tests_50',
    name: 'Dedicated Learner',
    description: 'Complete 50 typing tests',
    icon: '📚',
    category: 'tests',
    requirement: { type: 'totalTests', value: 50 },
    xp: 500
  },
  tests_100: {
    id: 'tests_100',
    name: 'Century Club',
    description: 'Complete 100 typing tests',
    icon: '🏆',
    category: 'tests',
    requirement: { type: 'totalTests', value: 100 },
    xp: 1000
  },
  tests_500: {
    id: 'tests_500',
    name: 'Typing Veteran',
    description: 'Complete 500 typing tests',
    icon: '🎖️',
    category: 'tests',
    requirement: { type: 'totalTests', value: 500 },
    xp: 5000
  },

  // Time achievements
  time_1h: {
    id: 'time_1h',
    name: 'Hour Hero',
    description: 'Practice for a total of 1 hour',
    icon: '⏱️',
    category: 'time',
    requirement: { type: 'totalTime', value: 3600 },
    xp: 200
  },
  time_10h: {
    id: 'time_10h',
    name: 'Time Investor',
    description: 'Practice for a total of 10 hours',
    icon: '⏰',
    category: 'time',
    requirement: { type: 'totalTime', value: 36000 },
    xp: 1000
  },
  time_50h: {
    id: 'time_50h',
    name: 'Dedication Master',
    description: 'Practice for a total of 50 hours',
    icon: '🕐',
    category: 'time',
    requirement: { type: 'totalTime', value: 180000 },
    xp: 5000
  },

  // Lessons achievements
  lessons_first: {
    id: 'lessons_first',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '👣',
    category: 'lessons',
    requirement: { type: 'lessonsCompleted', value: 1 },
    xp: 50
  },
  lessons_10: {
    id: 'lessons_10',
    name: 'Quick Learner',
    description: 'Complete 10 lessons',
    icon: '📖',
    category: 'lessons',
    requirement: { type: 'lessonsCompleted', value: 10 },
    xp: 300
  },
  lessons_all: {
    id: 'lessons_all',
    name: 'Graduate',
    description: 'Complete all typing lessons',
    icon: '🎓',
    category: 'lessons',
    requirement: { type: 'lessonsCompleted', value: 50 }, // Adjust based on total lessons
    xp: 2000
  },

  // Special achievements
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a test after midnight',
    icon: '🦉',
    category: 'special',
    requirement: { type: 'special', value: 'night' },
    xp: 100
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a test before 6 AM',
    icon: '🐦',
    category: 'special',
    requirement: { type: 'special', value: 'early' },
    xp: 100
  },
  comeback: {
    id: 'comeback',
    name: 'Welcome Back',
    description: 'Return after 7 days away',
    icon: '👋',
    category: 'special',
    requirement: { type: 'special', value: 'comeback' },
    xp: 150
  }
};

// Level thresholds
export const LEVELS = [
  { level: 1, xpRequired: 0, title: 'Beginner' },
  { level: 2, xpRequired: 100, title: 'Novice' },
  { level: 3, xpRequired: 300, title: 'Apprentice' },
  { level: 4, xpRequired: 600, title: 'Student' },
  { level: 5, xpRequired: 1000, title: 'Intermediate' },
  { level: 6, xpRequired: 1500, title: 'Skilled' },
  { level: 7, xpRequired: 2200, title: 'Proficient' },
  { level: 8, xpRequired: 3000, title: 'Advanced' },
  { level: 9, xpRequired: 4000, title: 'Expert' },
  { level: 10, xpRequired: 5500, title: 'Master' },
  { level: 11, xpRequired: 7500, title: 'Grandmaster' },
  { level: 12, xpRequired: 10000, title: 'Legend' },
  { level: 13, xpRequired: 15000, title: 'Mythic' },
  { level: 14, xpRequired: 22000, title: 'Immortal' },
  { level: 15, xpRequired: 30000, title: 'Transcendent' }
];

// Achievement Manager Class
class AchievementManager {
  constructor() {
    this.achievements = ACHIEVEMENTS;
    this.levels = LEVELS;
  }

  // Get user's achievement data
  getUserAchievements(userId) {
    try {
      const data = localStorage.getItem(`typing_app_achievements_${userId}`);
      return data ? JSON.parse(data) : {
        unlockedAchievements: [],
        totalXP: 0,
        level: 1,
        newAchievements: [] // Recently unlocked, not yet viewed
      };
    } catch (e) {
      console.error('Failed to load achievements:', e);
      return {
        unlockedAchievements: [],
        totalXP: 0,
        level: 1,
        newAchievements: []
      };
    }
  }

  // Save user's achievement data
  saveUserAchievements(userId, data) {
    try {
      localStorage.setItem(`typing_app_achievements_${userId}`, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save achievements:', e);
    }
  }

  // Calculate level from XP
  calculateLevel(xp) {
    let currentLevel = this.levels[0];
    for (const level of this.levels) {
      if (xp >= level.xpRequired) {
        currentLevel = level;
      } else {
        break;
      }
    }
    return currentLevel;
  }

  // Get XP progress to next level
  getXPProgress(xp) {
    const currentLevel = this.calculateLevel(xp);
    const nextLevel = this.levels.find(l => l.level === currentLevel.level + 1);
    
    if (!nextLevel) {
      return { current: xp, required: xp, percentage: 100 };
    }

    const xpInCurrentLevel = xp - currentLevel.xpRequired;
    const xpRequiredForNext = nextLevel.xpRequired - currentLevel.xpRequired;
    const percentage = Math.min(100, (xpInCurrentLevel / xpRequiredForNext) * 100);

    return {
      current: xpInCurrentLevel,
      required: xpRequiredForNext,
      percentage
    };
  }

  // Check and unlock achievements based on stats
  checkAchievements(userId, stats) {
    const userData = this.getUserAchievements(userId);
    const newlyUnlocked = [];

    Object.values(this.achievements).forEach(achievement => {
      // Skip if already unlocked
      if (userData.unlockedAchievements.includes(achievement.id)) {
        return;
      }

      let unlocked = false;

      switch (achievement.requirement.type) {
        case 'wpm':
          unlocked = stats.bestWPM >= achievement.requirement.value;
          break;
        case 'accuracy':
          unlocked = stats.bestAccuracy >= achievement.requirement.value;
          break;
        case 'streak':
          unlocked = stats.currentStreak >= achievement.requirement.value;
          break;
        case 'totalTests':
          unlocked = stats.totalTests >= achievement.requirement.value;
          break;
        case 'totalTime':
          unlocked = stats.totalTime >= achievement.requirement.value;
          break;
        case 'lessonsCompleted':
          unlocked = (stats.lessonsCompleted || 0) >= achievement.requirement.value;
          break;
        case 'special':
          unlocked = this.checkSpecialAchievement(achievement.requirement.value, stats);
          break;
      }

      if (unlocked) {
        userData.unlockedAchievements.push(achievement.id);
        userData.totalXP += achievement.xp;
        userData.newAchievements.push(achievement.id);
        newlyUnlocked.push(achievement);
      }
    });

    // Update level
    userData.level = this.calculateLevel(userData.totalXP).level;

    // Save updated data
    this.saveUserAchievements(userId, userData);

    return newlyUnlocked;
  }

  // Check special achievements
  checkSpecialAchievement(type, stats) {
    const now = new Date();
    const hour = now.getHours();

    switch (type) {
      case 'night':
        return hour >= 0 && hour < 5;
      case 'early':
        return hour >= 4 && hour < 6;
      case 'comeback':
        if (stats.lastActiveDate) {
          const lastActive = new Date(stats.lastActiveDate);
          const daysDiff = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
          return daysDiff >= 7;
        }
        return false;
      default:
        return false;
    }
  }

  // Mark achievements as viewed
  markAchievementsViewed(userId) {
    const userData = this.getUserAchievements(userId);
    userData.newAchievements = [];
    this.saveUserAchievements(userId, userData);
  }

  // Get all achievements with unlock status
  getAllAchievements(userId) {
    const userData = this.getUserAchievements(userId);
    
    return Object.values(this.achievements).map(achievement => ({
      ...achievement,
      unlocked: userData.unlockedAchievements.includes(achievement.id),
      isNew: userData.newAchievements.includes(achievement.id)
    }));
  }

  // Get achievement categories
  getCategories() {
    return ['speed', 'accuracy', 'streak', 'tests', 'time', 'lessons', 'special'];
  }

  // Get achievements by category
  getAchievementsByCategory(userId, category) {
    return this.getAllAchievements(userId).filter(a => a.category === category);
  }
}

// Export singleton instance
export const achievementManager = new AchievementManager();
export default achievementManager;
