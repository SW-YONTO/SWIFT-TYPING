import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { 
  RotateCcw, 
  Trophy, 
  Target, 
  Zap, 
  Clock, 
  Type, 
  AlertCircle,
  TrendingUp,
  Award,
  Star
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const results = location.state?.results;

  if (!results) {
    return (
      <div className={`min-h-screen ${theme.background} flex items-center justify-center`}>
        <div className={`${theme.cardBg} p-8 rounded-lg shadow-lg text-center border ${theme.border} animate-fade-in`}>
          <h2 className={`text-2xl font-bold ${theme.text} mb-4`}>No Results Found</h2>
          <p className={`${theme.textSecondary} mb-6`}>Please complete a typing session to view results.</p>
          <button
            onClick={() => navigate('/lessons')}
            className={`${theme.primary} text-white px-6 py-3 rounded-lg ${theme.primaryHover} transition-colors hover-lift`}
          >
            Go to Lessons
          </button>
        </div>
      </div>
    );
  }

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate performance level
  const getPerformanceLevel = (wpm, accuracy) => {
    if (wpm >= 60 && accuracy >= 95) return { level: 'Expert', color: 'text-purple-600', icon: Award };
    if (wpm >= 40 && accuracy >= 90) return { level: 'Advanced', color: 'text-blue-600', icon: Star };
    if (wpm >= 25 && accuracy >= 85) return { level: 'Intermediate', color: 'text-green-600', icon: TrendingUp };
    return { level: 'Beginner', color: 'text-orange-600', icon: Target };
  };

  const performance = getPerformanceLevel(results.wpm, results.accuracy);
  const PerformanceIcon = performance.icon;

  // Calculate improvement suggestions
  const getImprovementTip = (wpm, accuracy) => {
    if (accuracy < 85) return "Focus on accuracy first - slow down to build muscle memory";
    if (wpm < 25) return "Practice daily for 15-20 minutes to build speed";
    if (wpm < 40) return "Try touch typing without looking at the keyboard";
    return "Great job! Keep practicing to maintain your skills";
  };

  // Prepare chart data with proper background
  const chartData = {
    labels: results.wpmHistory?.length > 0 
      ? results.wpmHistory.map((_, index) => `${(index + 1) * 2}s`)
      : ['Final'],
    datasets: [
      {
        label: 'WPM',
        data: results.wpmHistory?.length > 0 
          ? results.wpmHistory.map(point => point.wpm)
          : [results.wpm],
        borderColor: theme.mode === 'dark' ? '#60a5fa' : '#3b82f6',
        backgroundColor: theme.mode === 'dark' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: theme.mode === 'dark' ? '#60a5fa' : '#3b82f6',
        pointBorderColor: theme.mode === 'dark' ? '#374151' : '#ffffff',
        pointBorderWidth: 2,
        borderWidth: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme.mode === 'dark' ? '#1f2937' : '#ffffff',
        titleColor: theme.mode === 'dark' ? '#f9fafb' : '#111827',
        bodyColor: theme.mode === 'dark' ? '#f9fafb' : '#111827',
        borderColor: theme.mode === 'dark' ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          color: theme.mode === 'dark' ? '#374151' : '#f3f4f6',
          borderColor: theme.mode === 'dark' ? '#4b5563' : '#d1d5db',
        },
        ticks: {
          color: theme.mode === 'dark' ? '#9ca3af' : '#6b7280',
          font: { size: 12 },
          maxTicksLimit: 10,
        },
        border: {
          color: theme.mode === 'dark' ? '#4b5563' : '#d1d5db',
        }
      },
      y: {
        grid: {
          color: theme.mode === 'dark' ? '#374151' : '#f3f4f6',
          borderColor: theme.mode === 'dark' ? '#4b5563' : '#d1d5db',
        },
        ticks: {
          color: theme.mode === 'dark' ? '#9ca3af' : '#6b7280',
          font: { size: 12 },
          callback: function(value) {
            return value + ' WPM';
          }
        },
        border: {
          color: theme.mode === 'dark' ? '#4b5563' : '#d1d5db',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className={`min-h-screen ${theme.background} py-6`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Enhanced Header with Performance Badge */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500 animate-bounce" />
            <h1 className={`text-4xl font-bold ${theme.text} animate-bounce-in`}>Test Results</h1>
            <Trophy className="w-8 h-8 text-yellow-500 animate-bounce" />
          </div>
          
          {/* Performance Level Badge with Enhanced Animation */}
          <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in">
            <div className={`p-3 rounded-full ${performance.level === 'Expert' ? 'bg-purple-100 dark:bg-purple-900/30' : performance.level === 'Advanced' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'} animate-float`}>
              <PerformanceIcon className={`w-6 h-6 ${performance.color}`} />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${performance.color}`}>
                {performance.level} Level
              </div>
              <div className={`text-sm ${theme.textSecondary} mt-1`}>
                {results.wpm >= 60 ? 'Outstanding Performance!' : results.wpm >= 40 ? 'Great Job!' : 'Keep Practicing!'}
              </div>
            </div>
          </div>
          
          {/* Test Type with Subtle Animation */}
          <div className={`${theme.textSecondary} text-lg animate-fade-in`}>
            <span className="inline-block px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
              {results.content}
            </span>
          </div>
        </div>

        {/* Enhanced Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* WPM Card with Animation */}
          <div className={`${theme.cardBg} p-6 rounded-2xl border ${theme.border} text-center hover-lift shadow-lg animate-fade-in group`}>
            <div className="flex items-center justify-center mb-4">
              <div className={`p-4 ${theme.mode === 'dark' ? 'bg-blue-900/40' : 'bg-blue-50'} rounded-full group-hover:scale-110 transition-transform duration-300`}>
                <Zap className={`w-8 h-8 ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
            </div>
            <div className={`text-5xl font-bold ${theme.text} mb-2 tabular-nums ${results.wpm > 50 ? 'animate-bounce-subtle' : ''}`}>
              {results.wpm}
            </div>
            <div className={`${theme.textSecondary} text-sm font-medium uppercase tracking-wide`}>Words Per Minute</div>
            <div className={`${theme.textSecondary} text-xs mt-1 opacity-70`}>Net Speed</div>
            {results.wpm > 60 && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 animate-pulse">
                  🚀 Excellent!
                </span>
              </div>
            )}
          </div>

          {/* Accuracy Card with Black/White Text Only */}
          <div className={`${theme.cardBg} p-6 rounded-2xl border ${theme.border} text-center hover-lift shadow-lg animate-fade-in group`}>
            <div className="flex items-center justify-center mb-4">
              <div className={`p-4 ${theme.mode === 'dark' ? 'bg-green-900/40' : 'bg-green-50'} rounded-full group-hover:scale-110 transition-transform duration-300`}>
                <Target className={`w-8 h-8 ${theme.mode === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
              </div>
            </div>
            <div className={`text-5xl font-bold mb-2 tabular-nums ${theme.text} ${
              results.accuracy >= 95 ? 'animate-bounce-subtle' : ''
            }`}>
              {results.accuracy}%
            </div>
            <div className={`${theme.textSecondary} text-sm font-medium uppercase tracking-wide`}>Accuracy</div>
            <div className={`${theme.textSecondary} text-xs mt-1 opacity-70`}>Correct Characters</div>
            {results.accuracy >= 95 && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 animate-pulse">
                  🎯 Perfect!
                </span>
              </div>
            )}
          </div>

          {/* Time Card */}
          <div className={`${theme.cardBg} p-6 rounded-2xl border ${theme.border} text-center hover-lift shadow-lg animate-fade-in group`}>
            <div className="flex items-center justify-center mb-4">
              <div className={`p-4 ${theme.mode === 'dark' ? 'bg-orange-900/40' : 'bg-orange-50'} rounded-full group-hover:scale-110 transition-transform duration-300`}>
                <Clock className={`w-8 h-8 ${theme.mode === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
              </div>
            </div>
            <div className={`text-5xl font-bold ${theme.text} mb-2 tabular-nums`}>{formatTime(results.timeSpent)}</div>
            <div className={`${theme.textSecondary} text-sm font-medium uppercase tracking-wide`}>Time Taken</div>
            <div className={`${theme.textSecondary} text-xs mt-1 opacity-70`}>Total Duration</div>
          </div>

          {/* Words Typed Card */}
          <div className={`${theme.cardBg} p-6 rounded-2xl border ${theme.border} text-center hover-lift shadow-lg animate-fade-in group`}>
            <div className="flex items-center justify-center mb-4">
              <div className={`p-4 ${theme.mode === 'dark' ? 'bg-purple-900/40' : 'bg-purple-50'} rounded-full group-hover:scale-110 transition-transform duration-300`}>
                <Type className={`w-8 h-8 ${theme.mode === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
              </div>
            </div>
            <div className={`text-5xl font-bold ${theme.text} mb-2 tabular-nums`}>{results.wordsTyped || 0}</div>
            <div className={`${theme.textSecondary} text-sm font-medium uppercase tracking-wide`}>Words Typed</div>
            <div className={`${theme.textSecondary} text-xs mt-1 opacity-70`}>Total Words</div>
          </div>
        </div>

        {/* Chart and Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Speed Chart */}
          <div className="lg:col-span-2">
            <div className={`${theme.cardBg} p-6 rounded-2xl border ${theme.border} shadow-lg animate-fade-in hover-lift`}>
              <h3 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                <TrendingUp className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
                Speed Over Time
              </h3>
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Enhanced Details */}
          <div className="space-y-4">
            {/* Character Stats */}
            <div className={`${theme.cardBg} p-6 rounded-2xl border ${theme.border} shadow-lg animate-fade-in hover-lift`}>
              <h4 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
                <Type className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                Character Stats
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`${theme.textSecondary} text-sm`}>Total Typed</span>
                  <span className={`${theme.text} font-semibold`}>{results.totalCharacters}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`${theme.textSecondary} text-sm`}>Correct</span>
                  <span className={`${theme.text} font-semibold text-green-600`}>{results.correctCharacters}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`${theme.textSecondary} text-sm`}>Errors</span>
                  <span className={`${theme.text} font-semibold text-red-600`}>{results.errors}</span>
                </div>
              </div>
            </div>

            {/* Quick Tip */}
            <div className={`${theme.cardBg} p-6 rounded-2xl border ${theme.border} shadow-lg animate-fade-in hover-lift`}>
              <h4 className={`text-lg font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
                <AlertCircle className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
                Quick Tip
              </h4>
              <p className={`${theme.textSecondary} text-sm leading-relaxed`}>
                {getImprovementTip(results.wpm, results.accuracy)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <button
            onClick={() => navigate('/lessons')}
            className={`flex items-center gap-2 ${theme.primary} text-white px-8 py-3 rounded-xl ${theme.primaryHover} transition-all hover-lift font-semibold`}
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 ${theme.secondary} ${theme.accent} px-8 py-3 rounded-xl ${theme.secondaryHover} transition-all hover-lift font-semibold border ${theme.border}`}
          >
            <Trophy className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
