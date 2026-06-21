import React, { useState } from 'react';
import { Gauge, Play, ArrowRight, Zap, Target, Type, Hash, AtSign, Keyboard, Clock, Trophy, Activity } from 'lucide-react';
import { typingCourses } from '../data/lessons';
import TypingComponent from '../components/TypingComponent';
import { progressManager } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';

/* ── Category config ─────────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'all',      label: 'All',             icon: Keyboard },
  { id: 'similar',  label: 'Similar Words',   icon: Type     },
  { id: 'alphabet', label: 'Alphabet & Keys', icon: Hash     },
  { id: 'words',    label: 'Common Words',    icon: Zap      },
  { id: 'symbols',  label: 'Symbols',         icon: AtSign   },
];

const getCategoryColors = (mode) => ({
  similar:  {
    badge: mode === 'dark' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' : 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: mode === 'dark' ? 'text-blue-400' : 'text-blue-600',
  },
  alphabet: {
    badge: mode === 'dark' ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' : 'bg-purple-50 text-purple-700 border border-purple-200',
    icon: mode === 'dark' ? 'text-purple-400' : 'text-purple-600',
  },
  words: {
    badge: mode === 'dark' ? 'bg-green-900/40 text-green-300 border border-green-700/50' : 'bg-green-50 text-green-700 border border-green-200',
    icon: mode === 'dark' ? 'text-green-400' : 'text-green-600',
  },
  symbols: {
    badge: mode === 'dark' ? 'bg-orange-900/40 text-orange-300 border border-orange-700/50' : 'bg-orange-50 text-orange-700 border border-orange-200',
    icon: mode === 'dark' ? 'text-orange-400' : 'text-orange-600',
  },
});

/* ── Component ───────────────────────────────────────────────────────────── */

const TypingCourses = ({ currentUser, settings }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showTyping, setShowTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const { theme } = useTheme();

  const userProgress = progressManager.getUserProgress(currentUser.id);

  /* ── helpers ──────────────────────────────────────────────────────────── */

  const getCourseResults = (courseId) => {
    return userProgress.testResults.filter(
      r => r.testId === `course-${courseId}` && r.type === 'course'
    );
  };

  const getBestResult = (courseId) => {
    const results = getCourseResults(courseId);
    if (results.length === 0) return null;
    return results.reduce((best, cur) => {
      if (cur.wpm > best.wpm) return cur;
      if (cur.wpm === best.wpm && cur.accuracy > best.accuracy) return cur;
      return best;
    });
  };

  const filteredCourses = Object.entries(typingCourses).filter(
    ([, course]) => activeCategory === 'all' || course.category === activeCategory
  );

  /* ── aggregate stats (courses only) ───────────────────────────────────── */
  const courseResults = userProgress.testResults.filter(r => r.type === 'course');
  const totalAttempts = courseResults.length;
  const avgWpm = totalAttempts > 0
    ? Math.round(courseResults.reduce((s, r) => s + (r.wpm || 0), 0) / totalAttempts)
    : 0;
  const avgAcc = totalAttempts > 0
    ? Math.round(courseResults.reduce((s, r) => s + (r.accuracy || 0), 0) / totalAttempts)
    : 0;
  const bestWpm = totalAttempts > 0
    ? Math.max(...courseResults.map(r => r.wpm || 0))
    : 0;

  /* ── handlers ─────────────────────────────────────────────────────────── */

  const handleCourseComplete = (result) => {
    progressManager.saveTestResult(currentUser.id, {
      ...result,
      testId: `course-${selectedCourse.id}`,
      testTitle: selectedCourse.title,
      type: 'course'
    });
    setShowTyping(false);
    setSelectedCourse(null);
  };

  const handleStartCourse = (courseId, course) => {
    setSelectedCourse({ id: courseId, ...course });
    setShowTyping(true);
  };

  /* ── Typing view ──────────────────────────────────────────────────────── */

  if (showTyping && selectedCourse) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <button
            onClick={() => {
              setShowTyping(false);
              setSelectedCourse(null);
            }}
            className={`flex items-center gap-2 ${theme.primary} text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all font-medium`}
          >
            ← Back to Flow
          </button>
        </div>
        <TypingComponent
          content={selectedCourse.content}
          onComplete={handleCourseComplete}
          settings={settings}
          title={selectedCourse.title}
        />
      </div>
    );
  }

  /* ── Main list view ───────────────────────────────────────────────────── */

  return (
    <div className={`p-6 ${theme.background} min-h-screen`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Typing Flow</h1>
          <p className={theme.textSecondary}>Focused drills for similar-word combos, the alphabet, common words, and symbols</p>
        </div>

        {/* Stats Overview */}
        <div className={`${theme.cardBg} rounded-2xl shadow-xl p-6 mb-8 border ${theme.border} relative overflow-hidden`}>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className={`text-xl font-bold ${theme.text} mb-5 flex items-center gap-2`}>
            <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
            Your Flow Stats
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Attempts Card */}
            <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.03] hover:shadow-md ${
              theme.mode === 'dark' 
                ? 'bg-blue-950/20 border-blue-900/40' 
                : 'bg-blue-50 border-blue-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary}`}>Total Attempts</span>
                <div className={`p-1.5 rounded-lg ${theme.mode === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <Hash className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${theme.text}`}>{totalAttempts}</div>
            </div>

            {/* Best WPM Card */}
            <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.03] hover:shadow-md ${
              theme.mode === 'dark' 
                ? 'bg-yellow-950/20 border-yellow-900/40' 
                : 'bg-amber-50 border-amber-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary}`}>Best WPM</span>
                <div className={`p-1.5 rounded-lg ${theme.mode === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                  <Trophy className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${theme.text}`}>{bestWpm}</div>
            </div>

            {/* Avg Accuracy Card */}
            <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.03] hover:shadow-md ${
              theme.mode === 'dark' 
                ? 'bg-purple-950/20 border-purple-900/40' 
                : 'bg-purple-50 border-purple-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary}`}>Avg Accuracy</span>
                <div className={`p-1.5 rounded-lg ${theme.mode === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                  <Target className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${theme.text}`}>{avgAcc}%</div>
            </div>

            {/* Avg WPM Card */}
            <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.03] hover:shadow-md ${
              theme.mode === 'dark' 
                ? 'bg-orange-950/20 border-orange-900/40' 
                : 'bg-orange-50 border-orange-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary}`}>Avg WPM</span>
                <div className={`p-1.5 rounded-lg ${theme.mode === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                  <Gauge className="w-4 h-4 text-orange-500" />
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${theme.text}`}>{avgWpm}</div>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === id
                  ? `${theme.primary} text-white shadow-md`
                  : `${theme.cardBg} ${theme.text} border ${theme.border} hover:shadow-sm`
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id !== 'all' && (
                <span className={`ml-1 text-xs ${activeCategory === id ? 'text-white/80' : theme.textSecondary}`}>
                  ({Object.values(typingCourses).filter(c => c.category === id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(([courseId, course]) => {
            const bestResult = getBestResult(courseId);
            const attempts = getCourseResults(courseId).length;
            const catColor = getCategoryColors(theme.mode)[course.category] || getCategoryColors(theme.mode).similar;

            return (
              <div
                key={courseId}
                className={`${theme.cardBg} rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border ${theme.border}`}
                onClick={() => handleStartCourse(courseId, course)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Gauge className={`w-6 h-6 ${catColor.icon}`} />
                    <h2 className={`text-lg font-semibold ${theme.text}`}>{course.title}</h2>
                  </div>
                  <Play className={`w-5 h-5 ${theme.accent}`} />
                </div>

                {/* Category badge + description */}
                <div className="mb-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${catColor.badge} mb-2`}>
                    {CATEGORIES.find(c => c.id === course.category)?.label || course.category}
                  </span>
                  {course.description && (
                    <p className={`text-sm ${theme.textSecondary}`}>{course.description}</p>
                  )}
                </div>

                {/* Preview of content */}
                <div className={`${theme.inputBg} p-3 rounded-lg mb-4 border ${theme.border}`}>
                  <p className={`${theme.textSecondary} text-sm font-mono leading-relaxed`}>
                    {course.content.substring(0, 100)}
                    {course.content.length > 100 && '...'}
                  </p>
                </div>

                {/* Per-course stats */}
                <div className="space-y-2 mb-4">
                  <div className={`flex items-center justify-between text-sm ${theme.textSecondary}`}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.content.split(' ').length} words
                    </span>
                    <span>{attempts} attempt{attempts !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Best Result */}
                {bestResult ? (
                  <div className={`${theme.mode === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} p-3 rounded-lg mb-4 border ${theme.border}`}>
                    <div className={`text-xs ${theme.textSecondary} mb-1`}>Personal Best</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`flex items-center gap-1 ${theme.accent} font-semibold`}>
                          <Zap className="w-3 h-3" />
                          {bestResult.wpm} WPM
                        </span>
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <Target className="w-3 h-3" />
                          {bestResult.accuracy}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`${theme.inputBg} p-3 rounded-lg mb-4 text-center border ${theme.border}`}>
                    <div className={`text-sm ${theme.textSecondary}`}>No attempts yet</div>
                  </div>
                )}

                {/* Action */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${theme.accent}`}>
                    {bestResult ? 'Try Again' : 'Start Drill'}
                  </span>
                  <ArrowRight className={`w-4 h-4 ${theme.accent}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state for filtered view */}
        {filteredCourses.length === 0 && (
          <div className={`text-center py-12 ${theme.textSecondary}`}>
            <Keyboard className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className={`text-lg font-semibold ${theme.text} mb-2`}>No courses in this category</h3>
            <p>Try selecting a different category.</p>
          </div>
        )}

        {/* Tips */}
        <div className={`mt-12 ${theme.cardBg} rounded-lg p-6 border ${theme.border} shadow-lg`}>
          <h2 className={`text-2xl font-bold ${theme.text} mb-4 text-center`}>Why Typing Flow?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`${theme.primary} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Type className="w-6 h-6 text-white" />
              </div>
              <h3 className={`font-semibold ${theme.text} mb-2`}>Build Muscle Memory</h3>
              <p className={`text-sm ${theme.textSecondary}`}>Similar word combos train your fingers to recognize common letter patterns</p>
            </div>
            
            <div className="text-center">
              <div className={`${theme.primary} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className={`font-semibold ${theme.text} mb-2`}>Increase Speed</h3>
              <p className={`text-sm ${theme.textSecondary}`}>Focused drills on specific combos boost your WPM faster than random text</p>
            </div>
            
            <div className="text-center">
              <div className={`${theme.primary} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
                <AtSign className="w-6 h-6 text-white" />
              </div>
              <h3 className={`font-semibold ${theme.text} mb-2`}>Master All Keys</h3>
              <p className={`text-sm ${theme.textSecondary}`}>Symbol and number drills ensure you're fast on every key, not just letters</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingCourses;
