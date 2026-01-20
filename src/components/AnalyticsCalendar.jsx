import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Zap, Target, Clock, TrendingUp, Calendar } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { formatTime } from '../utils/storage';

/**
 * GitHub-style Activity Calendar Component
 * Shows typing activity over time with clickable days for detailed stats
 */
const AnalyticsCalendar = ({ testResults = [], onClose }) => {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Process test results into a map of date -> activities
  const activityMap = useMemo(() => {
    const map = {};
    testResults.forEach(result => {
      if (result.completedAt) {
        const date = new Date(result.completedAt).toISOString().split('T')[0];
        if (!map[date]) {
          map[date] = {
            count: 0,
            totalWpm: 0,
            totalAccuracy: 0,
            totalTime: 0,
            tests: []
          };
        }
        map[date].count++;
        map[date].totalWpm += result.wpm || 0;
        map[date].totalAccuracy += result.accuracy || 0;
        map[date].totalTime += result.timeSpent || 0;
        map[date].tests.push(result);
      }
    });
    return map;
  }, [testResults]);

  // Get calendar data for current month view (showing last 6 months)
  const calendarData = useMemo(() => {
    const data = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 5);
    startDate.setDate(1);

    // Generate 6 months of data
    for (let m = 0; m < 6; m++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + m);
      
      const month = {
        name: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        year: monthDate.getFullYear(),
        weeks: []
      };

      // Get first day of month and number of days
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const daysInMonth = lastDay.getDate();
      
      // Start from Sunday of the week containing the first day
      const startDayOfWeek = firstDay.getDay();
      
      let week = [];
      // Add empty cells for days before the first day of month
      for (let i = 0; i < startDayOfWeek; i++) {
        week.push(null);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        const activity = activityMap[dateStr];
        
        week.push({
          date: dateStr,
          day,
          activity,
          isToday: dateStr === today.toISOString().split('T')[0],
          isFuture: date > today
        });

        if (week.length === 7) {
          month.weeks.push(week);
          week = [];
        }
      }

      // Add remaining days
      if (week.length > 0) {
        while (week.length < 7) {
          week.push(null);
        }
        month.weeks.push(week);
      }

      data.push(month);
    }

    return data;
  }, [activityMap]);

  // Get intensity level (0-4) based on activity count
  const getIntensityLevel = (count) => {
    if (!count || count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  };

  // Get color class based on intensity and theme
  const getIntensityColor = (level, isFuture) => {
    if (isFuture) return theme.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
    
    const darkColors = [
      'bg-gray-800', // 0 - no activity
      'bg-green-900', // 1 - light activity
      'bg-green-700', // 2 - moderate activity
      'bg-green-500', // 3 - good activity
      'bg-green-400'  // 4 - high activity
    ];
    
    const lightColors = [
      'bg-gray-200', // 0 - no activity
      'bg-green-200', // 1 - light activity
      'bg-green-400', // 2 - moderate activity
      'bg-green-500', // 3 - good activity
      'bg-green-600'  // 4 - high activity
    ];

    return theme.mode === 'dark' ? darkColors[level] : lightColors[level];
  };

  // Get stats for selected date
  const selectedDateStats = useMemo(() => {
    if (!selectedDate) return null;
    const activity = activityMap[selectedDate];
    if (!activity) return null;

    return {
      date: new Date(selectedDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      count: activity.count,
      avgWpm: Math.round(activity.totalWpm / activity.count),
      avgAccuracy: Math.round(activity.totalAccuracy / activity.count),
      totalTime: activity.totalTime,
      tests: activity.tests
    };
  }, [selectedDate, activityMap]);

  // Calculate overall stats - EXCLUDE games from WPM/accuracy averages
  const overallStats = useMemo(() => {
    const activeDays = Object.keys(activityMap).length;
    const totalTests = testResults.length;
    const totalTime = testResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
    
    // Filter out games for WPM/accuracy calculations
    const nonGameResults = testResults.filter(r => r.type !== 'game');
    const avgWpm = nonGameResults.length > 0 
      ? Math.round(nonGameResults.reduce((sum, r) => sum + (r.wpm || 0), 0) / nonGameResults.length) 
      : 0;
    const avgAccuracy = nonGameResults.length > 0 
      ? Math.round(nonGameResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) / nonGameResults.length) 
      : 0;

    // Calculate streak
    let currentStreak = 0;
    let maxStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check consecutive days starting from today going backwards
    let checkDate = new Date(today);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (activityMap[dateStr]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { activeDays, totalTests, totalTime, avgWpm, avgAccuracy, currentStreak };
  }, [testResults, activityMap]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${theme.cardBg} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${theme.primary} rounded-lg`}>
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${theme.text}`}>Typing Analytics</h2>
              <p className={`text-sm ${theme.textSecondary}`}>Your activity over the last 6 months</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <X className={`w-6 h-6 ${theme.text}`} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Overall Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className={`${theme.mode === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'} p-4 rounded-xl`}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm ${theme.textSecondary}`}>Avg WPM</span>
              </div>
              <span className={`text-2xl font-bold ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                {overallStats.avgWpm}
              </span>
            </div>
            
            <div className={`${theme.mode === 'dark' ? 'bg-green-900/30' : 'bg-green-50'} p-4 rounded-xl`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`text-sm ${theme.textSecondary}`}>Avg Accuracy</span>
              </div>
              <span className={`text-2xl font-bold ${theme.mode === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                {overallStats.avgAccuracy}%
              </span>
            </div>
            
            <div className={`${theme.mode === 'dark' ? 'bg-purple-900/30' : 'bg-purple-50'} p-4 rounded-xl`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-sm ${theme.textSecondary}`}>Active Days</span>
              </div>
              <span className={`text-2xl font-bold ${theme.mode === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                {overallStats.activeDays}
              </span>
            </div>
            
            <div className={`${theme.mode === 'dark' ? 'bg-orange-900/30' : 'bg-orange-50'} p-4 rounded-xl`}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                <span className={`text-sm ${theme.textSecondary}`}>Total Time</span>
              </div>
              <span className={`text-2xl font-bold ${theme.mode === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                {Math.round(overallStats.totalTime / 60)}m
              </span>
            </div>
            
            <div className={`${theme.mode === 'dark' ? 'bg-amber-900/30' : 'bg-amber-50'} p-4 rounded-xl`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                <span className={`text-sm ${theme.textSecondary}`}>Current Streak</span>
              </div>
              <span className={`text-2xl font-bold ${theme.mode === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                {overallStats.currentStreak} days
              </span>
            </div>
          </div>

          {/* Activity Calendar */}
          <div className={`${theme.mode === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'} p-6 rounded-xl mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${theme.text}`}>Activity Calendar</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className={theme.textSecondary}>Less</span>
                {[0, 1, 2, 3, 4].map(level => (
                  <div 
                    key={level} 
                    className={`w-3 h-3 rounded-sm ${getIntensityColor(level, false)}`}
                  />
                ))}
                <span className={theme.textSecondary}>More</span>
              </div>
            </div>

            {/* Months Grid */}
            <div className="grid grid-cols-6 gap-2">
              {calendarData.map((month, monthIndex) => (
                <div key={monthIndex}>
                  <div className={`text-xs ${theme.textSecondary} mb-2 font-medium`}>
                    {month.name}
                  </div>
                  <div className="space-y-1">
                    {month.weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex gap-1">
                        {week.map((day, dayIndex) => (
                          <div key={dayIndex}>
                            {day ? (
                              <button
                                onClick={() => day.activity && setSelectedDate(day.date)}
                                className={`w-3 h-3 rounded-sm transition-all ${
                                  getIntensityColor(getIntensityLevel(day.activity?.count), day.isFuture)
                                } ${day.isToday ? 'ring-1 ring-blue-500' : ''} ${
                                  day.activity ? 'cursor-pointer hover:ring-1 hover:ring-white/50' : 'cursor-default'
                                } ${selectedDate === day.date ? 'ring-2 ring-yellow-400' : ''}`}
                                title={day.activity 
                                  ? `${day.activity.count} test${day.activity.count > 1 ? 's' : ''} on ${day.date}` 
                                  : day.date
                                }
                              />
                            ) : (
                              <div className="w-3 h-3" />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDateStats && (
            <div className={`${theme.cardBg} border ${theme.border} rounded-xl p-6 animate-fade-in`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${theme.text}`}>{selectedDateStats.date}</h3>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className={`text-sm ${theme.textSecondary} hover:${theme.text}`}
                >
                  Clear
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className={`${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-3 rounded-lg text-center`}>
                  <div className={`text-2xl font-bold ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    {selectedDateStats.count}
                  </div>
                  <div className={`text-xs ${theme.textSecondary}`}>Tests</div>
                </div>
                <div className={`${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-3 rounded-lg text-center`}>
                  <div className={`text-2xl font-bold ${theme.mode === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    {selectedDateStats.avgWpm}
                  </div>
                  <div className={`text-xs ${theme.textSecondary}`}>Avg WPM</div>
                </div>
                <div className={`${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-3 rounded-lg text-center`}>
                  <div className={`text-2xl font-bold ${theme.mode === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                    {selectedDateStats.avgAccuracy}%
                  </div>
                  <div className={`text-xs ${theme.textSecondary}`}>Accuracy</div>
                </div>
                <div className={`${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-3 rounded-lg text-center`}>
                  <div className={`text-2xl font-bold ${theme.mode === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                    {formatTime(selectedDateStats.totalTime)}
                  </div>
                  <div className={`text-xs ${theme.textSecondary}`}>Time</div>
                </div>
              </div>

              {/* Tests List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedDateStats.tests.map((test, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3 ${theme.mode === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg`}
                  >
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${theme.text} truncate`}>
                        {test.testTitle || test.content || 'Typing Test'}
                      </div>
                      <div className={`text-xs ${theme.textSecondary}`}>
                        {new Date(test.completedAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {test.type === 'game' ? (
                        <div className={`text-sm font-semibold ${theme.mode === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                          {test.score || test.wpm} pts
                        </div>
                      ) : (
                        <div className={`text-sm font-semibold ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                          {test.wpm} WPM
                        </div>
                      )}
                      <div className={`text-sm ${theme.mode === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                        {test.accuracy}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Data State */}
          {testResults.length === 0 && (
            <div className={`text-center py-12 ${theme.textSecondary}`}>
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className={`text-lg font-semibold ${theme.text} mb-2`}>No activity yet</h3>
              <p>Complete some typing tests to see your activity here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCalendar;
