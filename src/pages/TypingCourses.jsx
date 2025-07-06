import React, { useState } from 'react';
import { Trophy, Play, ArrowRight } from 'lucide-react';
import { typingCourses } from '../data/lessons';
import TypingComponent from '../components/TypingComponent';
import { progressManager } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';

const TypingCourses = ({ currentUser, settings }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showTyping, setShowTyping] = useState(false);
  const { theme } = useTheme();

  const handleCourseComplete = (result) => {
    // Save as a test result with course identifier
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

  if (showTyping && selectedCourse) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <button
            onClick={() => {
              setShowTyping(false);
              setSelectedCourse(null);
            }}
            className={`${theme.accent} hover:${theme.accentHover} transition-colors`}
          >
            ← Back to Courses
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

  return (
    <div className={`p-6 ${theme.background} min-h-screen`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Typing Courses</h1>
          <p className={theme.textSecondary}>Practice with common words and phrases to improve your speed</p>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(typingCourses).map(([courseId, course]) => (
            <div
              key={courseId}
              className={`${theme.cardBg} rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border ${theme.border}`}
              onClick={() => handleStartCourse(courseId, course)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <h2 className={`text-xl font-semibold ${theme.text}`}>{course.title}</h2>
                </div>
                <Play className={`w-5 h-5 ${theme.accent}`} />
              </div>

              {/* Preview of content */}
              <div className={`${theme.inputBg} p-4 rounded-lg mb-4 border ${theme.border}`}>
                <p className={`${theme.textSecondary} text-sm font-mono leading-relaxed`}>
                  {course.content.substring(0, 120)}
                  {course.content.length > 120 && '...'}
                </p>
              </div>

              {/* Stats */}
              <div className={`flex items-center justify-between text-sm ${theme.textSecondary}`}>
                <span>{course.content.split(' ').length} words</span>
                <div className="flex items-center gap-2">
                  <span>Start Course</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Course Benefits */}
        <div className={`mt-12 ${theme.cardBg} rounded-lg p-6 border ${theme.border} shadow-lg`}>
          <h2 className={`text-2xl font-bold ${theme.text} mb-4 text-center`}>Why Practice Courses?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`${theme.primary} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className={`font-semibold ${theme.text} mb-2`}>Build Muscle Memory</h3>
              <p className={`text-sm ${theme.textSecondary}`}>Practice common words to improve your typing fluency</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <h3 className={`font-semibold ${theme.text} mb-2`}>Increase Speed</h3>
              <p className={`text-sm ${theme.textSecondary}`}>Focus on frequently used words to boost your WPM</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Play className="w-6 h-6 text-white" />
              </div>
              <h3 className={`font-semibold ${theme.text} mb-2`}>Real-world Practice</h3>
              <p className={`text-sm ${theme.textSecondary}`}>Practice with words you use in everyday typing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingCourses;
