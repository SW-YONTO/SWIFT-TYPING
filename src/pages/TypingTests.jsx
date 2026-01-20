import React, { useState } from 'react';
import { Zap, Play, ArrowRight, Clock, Target } from 'lucide-react';
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
            className={`${theme.accent} hover:${theme.accentHover} transition-colors`}
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

  return (
    <div className={`p-6 ${theme.background} min-h-screen`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Typing Tests</h1>
          <p className={theme.textSecondary}>Challenge yourself and measure your typing speed and accuracy</p>
        </div>

        {/* Quick Stats */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 mb-8 border ${theme.border}`}>
          <h2 className={`text-xl font-semibold ${theme.text} mb-4`}>Your Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${theme.accent}`}>{userProgress.stats.totalTests}</div>
              <div className={`text-sm ${theme.textSecondary}`}>Tests Taken</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userProgress.stats.bestWPM}</div>
              <div className={`text-sm ${theme.textSecondary}`}>Best WPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userProgress.stats.bestAccuracy}%</div>
              <div className={`text-sm ${theme.textSecondary}`}>Best Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(() => {
                  const nonGameResults = userProgress.testResults.filter(r => r.type !== 'game');
                  return nonGameResults.length > 0 
                    ? Math.round(nonGameResults.reduce((sum, result) => sum + (result.wpm || 0), 0) / nonGameResults.length)
                    : 0;
                })()}
              </div>
              <div className={`text-sm ${theme.textSecondary}`}>Avg WPM</div>
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {typingTests.map((test) => {
            const bestResult = getBestResult(test.id);
            const attempts = getTestResults(test.id).length;

            return (
              <div
                key={test.id}
                className={`${theme.cardBg} rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border ${theme.border}`}
                onClick={() => handleStartTest(test)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-600" />
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
