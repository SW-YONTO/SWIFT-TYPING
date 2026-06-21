import React, { useState } from 'react';
import { Zap, Play, ArrowRight, Clock, Target, ClipboardList, Flame, TrendingUp } from 'lucide-react';
import { typingTests } from '../data/lessons';
import TypingComponent from '../components/TypingComponent';
import { progressManager } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';

const TypingTests = ({ currentUser, settings }) => {
  const [selectedTest, setSelectedTest] = useState(null);
  const [showTyping, setShowTyping] = useState(false);
  const { theme } = useTheme();

  const userProgress = progressManager.getUserProgress(currentUser.id);

  const getTestResults = (testId) => {
    return userProgress.testResults.filter(result => result.testId === testId);
  };

  const getBestResult = (testId) => {
    const results = getTestResults(testId);
    if (results.length === 0) return null;
    
    return results.reduce((best, current) => {
      if (current.wpm > best.wpm) return current;
      if (current.wpm === best.wpm && current.accuracy > best.accuracy) return current;
      return best;
    });
  };

  const handleTestComplete = (result) => {
    progressManager.saveTestResult(currentUser.id, {
      ...result,
      testId: selectedTest.id,
      testTitle: selectedTest.title,
      type: 'test'
    });
    setShowTyping(false);
    setSelectedTest(null);
  };

  const handleStartTest = (test) => {
    setSelectedTest(test);
    setShowTyping(true);
  };

  if (showTyping && selectedTest) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <button
            onClick={() => {
              setShowTyping(false);
              setSelectedTest(null);
            }}
            className={`flex items-center gap-2 ${theme.primary} text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all font-medium`}
          >
            ← Back to Tests
          </button>
        </div>
        <TypingComponent
          content={selectedTest.content}
          onComplete={handleTestComplete}
          settings={settings}
          title={selectedTest.title}
        />
      </div>
    );
  }

  const avgWpm = (() => {
    const nonGameResults = userProgress.testResults.filter(r => r.type !== 'game');
    return nonGameResults.length > 0 
      ? Math.round(nonGameResults.reduce((sum, result) => sum + (result.wpm || 0), 0) / nonGameResults.length)
      : 0;
  })();

  return (
    <div className={`p-6 ${theme.background} min-h-screen`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Typing Tests</h1>
          <p className={theme.textSecondary}>Challenge yourself and measure your typing speed and accuracy</p>
        </div>

        {/* Quick Stats */}
        <div className={`${theme.cardBg} rounded-2xl shadow-xl p-6 mb-8 border ${theme.border} relative overflow-hidden`}>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className={`text-xl font-bold ${theme.text} mb-5 flex items-center gap-2`}>
            <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
            Your Test Stats
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Tests Taken Card */}
            <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.03] hover:shadow-md ${
              theme.mode === 'dark' 
                ? 'bg-emerald-950/20 border-emerald-900/40' 
                : 'bg-emerald-50 border-emerald-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary}`}>Tests Taken</span>
                <div className={`p-1.5 rounded-lg ${theme.mode === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}>
                  <ClipboardList className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${theme.text}`}>{userProgress.stats.totalTests}</div>
            </div>

            {/* Best WPM Card */}
            <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.03] hover:shadow-md ${
              theme.mode === 'dark' 
                ? 'bg-amber-950/20 border-amber-900/40' 
                : 'bg-amber-50 border-amber-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary}`}>Best WPM</span>
                <div className={`p-1.5 rounded-lg ${theme.mode === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
                  <Flame className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${theme.text}`}>{userProgress.stats.bestWPM}</div>
            </div>

            {/* Best Accuracy Card */}
            <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.03] hover:shadow-md ${
              theme.mode === 'dark' 
                ? 'bg-teal-950/20 border-teal-900/40' 
                : 'bg-teal-50 border-teal-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary}`}>Best Accuracy</span>
                <div className={`p-1.5 rounded-lg ${theme.mode === 'dark' ? 'bg-teal-900/30' : 'bg-teal-100'}`}>
                  <Target className="w-4 h-4 text-teal-500" />
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${theme.text}`}>{userProgress.stats.bestAccuracy}%</div>
            </div>

            {/* Avg WPM Card */}
            <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.03] hover:shadow-md ${
              theme.mode === 'dark' 
                ? 'bg-rose-950/20 border-rose-900/40' 
                : 'bg-rose-50 border-rose-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary}`}>Avg WPM</span>
                <div className={`p-1.5 rounded-lg ${theme.mode === 'dark' ? 'bg-rose-900/30' : 'bg-rose-100'}`}>
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${theme.text}`}>{avgWpm}</div>
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {typingTests.map((test) => {
            const bestResult = getBestResult(test.id);
            const attempts = getTestResults(test.id).length;

            return (
              <div key={test.id}
                className={`${theme.cardBg} rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border ${theme.border}`}
                onClick={() => handleStartTest(test)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Zap className={`w-6 h-6 ${theme.mode === 'dark' ? 'text-yellow-600' : 'text-amber-500'}`} />
                    <h2 className={`text-lg font-semibold ${theme.text}`}>{test.title}</h2>
                  </div>
                  <Play className={`w-5 h-5 ${theme.accent}`} />
                </div>

                {/* Preview */}
                <div className={`${theme.inputBg} p-3 rounded-lg mb-4 border ${theme.border}`}>
                  <p className={`${theme.textSecondary} text-sm font-mono leading-relaxed`}>
                    {test.content.substring(0, 100)}...
                  </p>
                </div>

                {/* Test Info */}
                <div className="space-y-2 mb-4">
                  <div className={`flex items-center justify-between text-sm ${theme.textSecondary}`}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {test.content.split(' ').length} words
                    </span>
                    <span>{attempts} attempts</span>
                  </div>
                </div>

                {/* Best Result */}
                {bestResult ? (
                  <div className={`${theme.secondary} p-3 rounded-lg mb-4 border ${theme.border}`}>
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
                    {bestResult ? 'Try Again' : 'Start Test'}
                  </span>
                  <ArrowRight className={`w-4 h-4 ${theme.accent}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className={`mt-12 ${theme.cardBg} rounded-lg p-6 border ${theme.border} shadow-lg`}>
          <h2 className={`text-2xl font-bold ${theme.text} mb-4 text-center`}>Test Taking Tips</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <h3 className={`font-semibold ${theme.text} mb-2`}>Focus on Accuracy</h3>
              <p className={`text-sm ${theme.textSecondary}`}>Accuracy is more important than speed. Speed comes naturally with practice.</p>
            </div>
            
            <div className="text-center">
              <h3 className={`font-semibold ${theme.text} mb-2`}>Use All Fingers</h3>
              <p className={`text-sm ${theme.textSecondary}`}>Make sure to use proper finger placement and all ten fingers.</p>
            </div>
            
            <div className="text-center">
              <h3 className={`font-semibold ${theme.text} mb-2`}>Don't Look at Keyboard</h3>
              <p className={`text-sm ${theme.textSecondary}`}>Keep your eyes on the screen and trust your muscle memory.</p>
            </div>
            
            <div className="text-center">
              <h3 className={`font-semibold ${theme.text} mb-2`}>Practice Regularly</h3>
              <p className={`text-sm ${theme.textSecondary}`}>Consistent practice is key to improving your typing speed and accuracy.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingTests;
