import React, { useState, useEffect } from 'react';
import { X, Clock, Hash, Settings, Play, BookOpen } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const CustomizeModal = ({ isOpen, onClose, onApply, currentSettings, isLesson = false }) => {
  const { theme } = useTheme();
  const [tempSettings, setTempSettings] = useState({
    practiceMode: isLesson ? 'lesson' : 'time',
    timeLimit: 60,
    wordLimit: 50,
    ...currentSettings
  });

  useEffect(() => {
    if (currentSettings) {
      setTempSettings({
        practiceMode: isLesson ? 'lesson' : 'time',
        timeLimit: 60,
        wordLimit: 50,
        ...currentSettings
      });
    }
  }, [currentSettings, isOpen, isLesson]);

  if (!isOpen) return null;

  const handleApply = () => {
    // Save to localStorage for persistence
    localStorage.setItem('typing_app_practice_settings', JSON.stringify(tempSettings));
    onApply(tempSettings);
    onClose();
  };

  const timeOptions = [
    { value: 15, label: '15 seconds' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
    { value: 900, label: '15 minutes' }
  ];

  const wordOptions = [
    { value: 10, label: '10 words' },
    { value: 25, label: '25 words' },
    { value: 50, label: '50 words' },
    { value: 100, label: '100 words' },
    { value: 200, label: '200 words' },
    { value: 500, label: '500 words' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${theme.cardBg} rounded-2xl shadow-2xl border ${theme.border} max-w-md w-full p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${theme.primary} rounded-lg`}>
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h2 className={`text-xl font-semibold ${theme.text}`}>Customize Practice</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${theme.secondary} rounded-lg ${theme.secondaryHover} transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Practice Mode Selection */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${theme.text} mb-3`}>
            Practice Mode
          </label>
          <div className={`grid ${isLesson ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
            {isLesson && (
              <button
                onClick={() => setTempSettings({ ...tempSettings, practiceMode: 'lesson' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  tempSettings.practiceMode === 'lesson'
                    ? `${theme.primary} border-transparent text-white shadow-lg`
                    : `${theme.inputBg} ${theme.border} ${theme.text} hover:${theme.border}`
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium text-xs">Lesson</span>
                  <span className="text-xs opacity-75">Complete content</span>
                </div>
              </button>
            )}
            
            <button
              onClick={() => setTempSettings({ ...tempSettings, practiceMode: 'time' })}
              className={`p-4 rounded-xl border-2 transition-all ${
                tempSettings.practiceMode === 'time'
                  ? `${theme.primary} border-transparent text-white shadow-lg`
                  : `${theme.inputBg} ${theme.border} ${theme.text} hover:${theme.border}`
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium text-xs">Time</span>
                <span className="text-xs opacity-75">Practice duration</span>
              </div>
            </button>
            
            <button
              onClick={() => setTempSettings({ ...tempSettings, practiceMode: 'word' })}
              className={`p-4 rounded-xl border-2 transition-all ${
                tempSettings.practiceMode === 'word'
                  ? `${theme.primary} border-transparent text-white shadow-lg`
                  : `${theme.inputBg} ${theme.border} ${theme.text} hover:${theme.border}`
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Hash className="w-4 h-4" />
                <span className="font-medium text-xs">Words</span>
                <span className="text-xs opacity-75">Word count</span>
              </div>
            </button>
          </div>
        </div>

        {/* Options based on selected mode */}
        {tempSettings.practiceMode !== 'lesson' && (
          <div className="mb-6">
            {tempSettings.practiceMode === 'time' ? (
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-3`}>
                  Time Limit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {timeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setTempSettings({ ...tempSettings, timeLimit: option.value })}
                      className={`p-3 rounded-lg border-2 transition-all text-sm ${
                        tempSettings.timeLimit === option.value
                          ? `${theme.primary} border-transparent text-white shadow-md`
                          : `${theme.inputBg} ${theme.border} ${theme.text} hover:${theme.border}`
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-3`}>
                  Word Count
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {wordOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setTempSettings({ ...tempSettings, wordLimit: option.value })}
                      className={`p-3 rounded-lg border-2 transition-all text-sm ${
                        tempSettings.wordLimit === option.value
                          ? `${theme.primary} border-transparent text-white shadow-md`
                          : `${theme.inputBg} ${theme.border} ${theme.text} hover:${theme.border}`
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lesson mode explanation */}
        {tempSettings.practiceMode === 'lesson' && (
          <div className={`mb-6 p-4 rounded-lg ${theme.background} border ${theme.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className={`w-4 h-4 ${theme.accent}`} />
              <span className={`text-sm font-medium ${theme.text}`}>Lesson Mode</span>
            </div>
            <p className={`text-xs ${theme.textSecondary}`}>
              Complete the lesson by typing all the provided content. The lesson will finish when you reach the end.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-3 rounded-xl border ${theme.border} ${theme.inputBg} ${theme.text} hover:${theme.border} transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${theme.primary} text-white ${theme.primaryHover} transition-colors`}
          >
            <Play className="w-4 h-4" />
            Start Practice
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeModal;
