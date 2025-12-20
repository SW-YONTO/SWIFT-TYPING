import React, { useState } from 'react';
import { Book, Play, CheckCircle, Lock, ArrowRight, Star, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { typingLessons } from '../data/lessons';
import { progressManager } from '../utils/storage';
import TypingComponent from '../components/TypingComponent';
import { useTheme } from '../contexts/ThemeContext';

const TypingLessons = ({ currentUser, settings }) => {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showTyping, setShowTyping] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const { theme } = useTheme();

  const userProgress = progressManager.getUserProgress(currentUser.id);

  const isLessonCompleted = (lessonId) => {
    return userProgress.completedLessons.some(lesson => lesson.lessonId === lessonId);
  };

  const isLessonUnlocked = (unitId, lessonIndex) => {
    // First lesson of each unit is always unlocked
    if (lessonIndex === 0) return true;
    
    // Check if previous lesson is completed
    const unit = typingLessons[unitId];
    const previousLessonId = unit.lessons[lessonIndex - 1].id;
    return isLessonCompleted(previousLessonId);
  };

  const getLessonResult = (lessonId) => {
    return userProgress.completedLessons.find(lesson => lesson.lessonId === lessonId);
  };

  const handleLessonComplete = (result) => {
    progressManager.completLesson(currentUser.id, selectedLesson.id, result);
    setShowTyping(false);
    setSelectedLesson(null);
  };

  const handleStartLesson = (lesson) => {
    setSelectedLesson(lesson);
    setShowTyping(true);
  };

  if (showTyping && selectedLesson) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <button
            onClick={() => {
              setShowTyping(false);
              setSelectedLesson(null);
            }}
            className={`${theme.primary} hover:${theme.primaryHover} transition-colors text-white px-4 py-2 rounded-lg`}
          >
            ← Back to Lessons
          </button>
        </div>
        <TypingComponent
          content={selectedLesson.content}
          onComplete={handleLessonComplete}
          settings={settings}
          title={selectedLesson.title}
          isLesson={true}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Typing Lessons</h1>
          <p className={theme.textSecondary}>Learn typing step by step from basics to advanced</p>
        </div>

        {/* Collapsible Progress Overview */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg border ${theme.border} mb-8 overflow-hidden`}>
          {/* Progress Header with Toggle */}
          <div 
            className={`p-4 cursor-pointer hover:${theme.background} transition-colors border-b ${theme.border}`}
            onClick={() => setShowProgress(!showProgress)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className={`w-5 h-5 ${theme.accent}`} />
                <h2 className={`text-lg font-semibold ${theme.text}`}>Learning Progress</h2>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${theme.primary} text-white`}>
                  {userProgress.completedLessons.length}/{Object.values(typingLessons).reduce((total, unit) => total + unit.lessons.length, 0)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${theme.textSecondary}`}>
                  {showProgress ? 'Hide Details' : 'Show Details'}
                </span>
                {showProgress ? (
                  <ChevronUp className={`w-5 h-5 ${theme.textSecondary}`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 ${theme.textSecondary}`} />
                )}
              </div>
            </div>
          </div>

          {/* Collapsible Progress Content */}
          <div className={`transition-all duration-300 ease-in-out ${showProgress ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="p-6">
              {/* Overall Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${theme.text}`}>Overall Progress</span>
                  <span className={`text-sm ${theme.textSecondary}`}>
                    {Math.round((userProgress.completedLessons.length / Object.values(typingLessons).reduce((total, unit) => total + unit.lessons.length, 0)) * 100)}%
                  </span>
                </div>
                <div className={`w-full ${theme.mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3 shadow-inner overflow-hidden`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${theme.primary.replace('bg-', 'bg-')} relative overflow-hidden`}
                    style={{ 
                      width: `${(userProgress.completedLessons.length / Object.values(typingLessons).reduce((total, unit) => total + unit.lessons.length, 0)) * 100}%` 
                    }}
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
                  </div>
                </div>
              </div>

              {/* Units Progress - Compact Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(typingLessons).map(([unitId, unit]) => {
                  const completed = unit.lessons.filter(lesson => isLessonCompleted(lesson.id)).length;
                  const total = unit.lessons.length;
                  const progress = (completed / total) * 100;
                  const isUnitCompleted = completed === total;
                  const isUnitStarted = completed > 0;

                  return (
                    <div
                      key={unitId}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        isUnitCompleted
                          ? `border-green-500 ${theme.cardBg} ring-1 ring-green-200 dark:ring-green-800`
                          : isUnitStarted
                          ? `border-yellow-500 ${theme.cardBg} ring-1 ring-yellow-200 dark:ring-yellow-800`
                          : `${theme.border} ${theme.cardBg}`
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-semibold ${theme.text} text-sm`}>{unit.title}</h3>
                        <div className="flex items-center gap-2">
                          {isUnitCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : isUnitStarted ? (
                            <Play className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <Lock className={`w-5 h-5 ${theme.textSecondary}`} />
                          )}
                          <span className={`text-xs font-bold ${
                            isUnitCompleted ? 'text-green-600' : 
                            isUnitStarted ? 'text-yellow-600' : 
                            theme.textSecondary
                          }`}>
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className={`w-full ${theme.mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 mb-2 overflow-hidden`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            isUnitCompleted ? 'bg-green-500' :
                            isUnitStarted ? 'bg-yellow-500' :
                            theme.primary.replace('bg-', 'bg-')
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className={theme.textSecondary}>{completed}/{total} lessons</span>
                        <span className={`font-medium ${
                          isUnitCompleted ? 'text-green-600' : 
                          isUnitStarted ? 'text-yellow-600' : 
                          theme.textSecondary
                        }`}>
                          {isUnitCompleted ? 'Complete' : 
                           isUnitStarted ? 'In Progress' : 
                           'Not Started'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className={`text-lg font-bold text-green-600`}>
                    {Object.values(typingLessons).filter(unit => 
                      unit.lessons.every(lesson => isLessonCompleted(lesson.id))
                    ).length}
                  </div>
                  <div className={`text-xs ${theme.textSecondary}`}>Units Completed</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold text-yellow-600`}>
                    {Object.values(typingLessons).filter(unit => 
                      unit.lessons.some(lesson => isLessonCompleted(lesson.id)) &&
                      !unit.lessons.every(lesson => isLessonCompleted(lesson.id))
                    ).length}
                  </div>
                  <div className={`text-xs ${theme.textSecondary}`}>Units In Progress</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${theme.primary.replace('bg-', 'text-')}`}>
                    {userProgress.stats?.bestWPM || 0}
                  </div>
                  <div className={`text-xs ${theme.textSecondary}`}>Best WPM</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${theme.primary.replace('bg-', 'text-')}`}>
                    {userProgress.stats?.bestAccuracy || 0}%
                  </div>
                  <div className={`text-xs ${theme.textSecondary}`}>Best Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="space-y-8">
          {Object.entries(typingLessons).map(([unitId, unit]) => (
            <div key={unitId} className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border}`}>
              <div className="flex items-center gap-3 mb-6">
                <Book className={`w-6 h-6 ${theme.accent}`} />
                <h2 className={`text-2xl font-semibold ${theme.text}`}>{unit.title}</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unit.lessons.map((lesson, index) => {
                  const completed = isLessonCompleted(lesson.id);
                  const unlocked = isLessonUnlocked(unitId, index);
                  const result = getLessonResult(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        unlocked
                          ? completed
                            ? `border-green-500 ${theme.cardBg} hover:shadow-md ring-1 ring-green-200`
                            : `${theme.border} ${theme.cardBg} hover:shadow-md cursor-pointer hover:${theme.border}`
                          : `${theme.border} ${theme.cardBg} opacity-60`
                      }`}
                      onClick={() => unlocked && handleStartLesson(lesson)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className={`font-semibold ${theme.text}`}>{lesson.title}</h3>
                        <div className="flex items-center gap-1">
                          {completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : unlocked ? (
                            <Play className={`w-5 h-5 ${theme.accent}`} />
                          ) : (
                            <Lock className={`w-5 h-5 ${theme.textSecondary}`} />
                          )}
                        </div>
                      </div>

                      <p className={`text-sm ${theme.textSecondary} mb-3`}>{lesson.description}</p>

                      {result && (
                        <div className={`flex items-center gap-4 text-xs ${theme.textSecondary} mb-2`}>
                          <span>WPM: {result.wpm}</span>
                          <span>Accuracy: {result.accuracy}%</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  result.accuracy >= (i + 1) * 20
                                    ? 'text-yellow-400 fill-current'
                                    : `${theme.textSecondary}`
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {unlocked && !completed && (
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${theme.accent} font-medium`}>Start Lesson</span>
                          <ArrowRight className={`w-4 h-4 ${theme.accent}`} />
                        </div>
                      )}

                      {completed && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600 font-medium">Completed</span>
                          <button className={`text-xs ${theme.accent} hover:${theme.accentHover}`}>
                            Practice Again
                          </button>
                        </div>
                      )}

                      {!unlocked && (
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${theme.textSecondary}`}>Locked</span>
                          <span className={`text-xs ${theme.textSecondary} opacity-75`}>Complete previous lesson</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypingLessons;
