import React, { useState, useMemo } from 'react';
import { X, Zap, Target, Clock, TrendingUp, Calendar, BookOpen, FlaskConical, Gamepad2, CheckCircle2, BarChart2 } from 'lucide-react';
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
import { useTheme } from '../contexts/ThemeContext';
import { formatTime } from '../utils/storage';

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

/* ─── helpers ──────────────────────────────────────────────────────────────── */

const getSessionType = (test) => {
  if (test.type === 'game')   return { label: 'Game',   icon: Gamepad2,    color: 'purple' };
  if (test.type === 'lesson') return { label: 'Lesson', icon: BookOpen,    color: 'green'  };
  if (test.type === 'course') return { label: 'Course', icon: CheckCircle2,color: 'teal'   };
  if (test.type === 'test')   return { label: 'Test',   icon: FlaskConical,color: 'blue'   };
  // fallback: guess from content string
  const c = (test.content || test.testTitle || '').toLowerCase();
  if (c.includes('lesson'))  return { label: 'Lesson', icon: BookOpen,    color: 'green'  };
  if (c.includes('game'))    return { label: 'Game',   icon: Gamepad2,    color: 'purple' };
  if (c.includes('course'))  return { label: 'Course', icon: CheckCircle2,color: 'teal'   };
  return { label: 'Test', icon: FlaskConical, color: 'blue' };
};

const colorMap = {
  blue:   { dark: 'text-blue-400   bg-blue-900/40   border-blue-700',   light: 'text-blue-600   bg-blue-50    border-blue-200'   },
  green:  { dark: 'text-green-400  bg-green-900/40  border-green-700',  light: 'text-green-600  bg-green-50   border-green-200'  },
  purple: { dark: 'text-purple-400 bg-purple-900/40 border-purple-700', light: 'text-purple-600 bg-purple-50  border-purple-200' },
  teal:   { dark: 'text-teal-400   bg-teal-900/40   border-teal-700',   light: 'text-teal-600   bg-teal-50    border-teal-200'   },
  orange: { dark: 'text-orange-400 bg-orange-900/40 border-orange-700', light: 'text-orange-600 bg-orange-50  border-orange-200' },
  amber:  { dark: 'text-amber-400  bg-amber-900/40  border-amber-700',  light: 'text-amber-600  bg-amber-50   border-amber-200'  },
};

const tc = (color, mode, part) => {
  const parts = colorMap[color]?.[mode]?.split(' ') || [];
  if (part === 'text')   return parts.find(p => p.startsWith('text-'))   || '';
  if (part === 'bg')     return parts.find(p => p.startsWith('bg-'))     || '';
  if (part === 'border') return parts.find(p => p.startsWith('border-')) || '';
  return colorMap[color]?.[mode] || '';
};

/* ─── Day Detail Modal ──────────────────────────────────────────────────────── */

const DayDetailModal = ({ stats, onClose, theme }) => {
  const mode = theme.mode;

  // Bar chart: WPM per session (non-game only)
  const typingTests = stats.tests.filter(t => t.type !== 'game' && (t.wpm || 0) > 0);
  const maxWpm = typingTests.length > 0 ? Math.max(...typingTests.map(t => t.wpm || 0)) : 1;

  const statCards = [
    { label: 'Sessions',    value: stats.count,                         color: 'blue',   icon: BarChart2  },
    { label: 'Avg Speed',   value: `${stats.avgWpm} WPM`,               color: 'green',  icon: Zap        },
    { label: 'Avg Accuracy',value: `${stats.avgAccuracy}%`,             color: 'purple', icon: Target     },
    { label: 'Total Time',  value: formatTime(stats.totalTime),         color: 'orange', icon: Clock      },
    { label: 'Best WPM',    value: `${stats.bestWpm} WPM`,              color: 'amber',  icon: TrendingUp },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`${theme.cardBg} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col animate-fade-in border ${theme.border}`}
        style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${mode === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <Calendar className={`w-5 h-5 ${tc('blue', mode, 'text')}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme.text}`}>{stats.date}</h2>
              <p className={`text-xs ${theme.textSecondary}`}>{stats.count} session{stats.count > 1 ? 's' : ''} recorded</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all hover:scale-105 group cursor-pointer ${
              mode === 'dark'
                ? 'bg-gray-700 hover:bg-red-600 text-gray-300'
                : 'bg-gray-100 hover:bg-red-500 text-gray-600'
            }`}
          >
            <X className="w-5 h-5 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Stat Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {statCards.map(({ label, value, color, icon: Icon }) => (
              <div
                key={label}
                className={`rounded-xl p-3 border ${tc(color, mode, 'bg')} ${tc(color, mode, 'border')} flex flex-col gap-1`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${tc(color, mode, 'text')}`} />
                  <span className={`text-xs font-medium ${theme.textSecondary}`}>{label}</span>
                </div>
                <span className={`text-xl font-bold ${tc(color, mode, 'text')}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Two-column layout: Chart | Type breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* LEFT: WPM Bar Chart */}
            <div className={`lg:col-span-3 rounded-xl p-5 border ${theme.border} ${mode === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className={`w-4 h-4 ${tc('blue', mode, 'text')}`} />
                <h3 className={`text-sm font-semibold ${theme.text}`}>Speed Per Session</h3>
              </div>

              {typingTests.length > 0 ? (
                <div className="h-64 w-full mt-2">
                  <Line
                    data={{
                      labels: typingTests.map((_, i) => `S${i + 1}`),
                      datasets: [
                        {
                          label: 'WPM',
                          data: typingTests.map(t => t.wpm || 0),
                          borderColor: mode === 'dark' ? '#60a5fa' : '#3b82f6',
                          backgroundColor: mode === 'dark' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          fill: true,
                          tension: 0.4,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                          pointBackgroundColor: mode === 'dark' ? '#60a5fa' : '#3b82f6',
                          pointBorderColor: mode === 'dark' ? '#374151' : '#ffffff',
                          pointBorderWidth: 2,
                          borderWidth: 3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: { intersect: false, mode: 'index' },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: mode === 'dark' ? '#1f2937' : '#ffffff',
                          titleColor: mode === 'dark' ? '#f9fafb' : '#111827',
                          bodyColor: mode === 'dark' ? '#f9fafb' : '#111827',
                          borderColor: mode === 'dark' ? '#374151' : '#e5e7eb',
                          borderWidth: 1,
                          cornerRadius: 8,
                          displayColors: false,
                          padding: 10,
                          callbacks: {
                            title: (items) => {
                              const test = typingTests[items[0].dataIndex];
                              return new Date(test.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            },
                            label: (context) => `${context.parsed.y} WPM`
                          }
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false, drawBorder: false },
                          ticks: { color: mode === 'dark' ? '#9ca3af' : '#6b7280', font: { size: 11 } }
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false,
                          },
                          ticks: { color: mode === 'dark' ? '#9ca3af' : '#6b7280', font: { size: 11 }, stepSize: 20 }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className={`text-center py-8 ${theme.textSecondary} text-sm`}>
                  No typing sessions with WPM data
                </div>
              )}
            </div>

            {/* RIGHT: Type Breakdown */}
            <div className={`lg:col-span-2 rounded-xl p-5 border ${theme.border} ${mode === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className={`w-4 h-4 ${tc('purple', mode, 'text')}`} />
                <h3 className={`text-sm font-semibold ${theme.text}`}>Session Types</h3>
              </div>
              {(() => {
                const counts = {};
                stats.tests.forEach(t => {
                  const { label } = getSessionType(t);
                  counts[label] = (counts[label] || 0) + 1;
                });
                const total = stats.tests.length;
                return Object.entries(counts).map(([label, count]) => {
                  const pct = Math.round((count / total) * 100);
                  const colorKey = label === 'Lesson' ? 'green' : label === 'Game' ? 'purple' : label === 'Course' ? 'teal' : 'blue';
                  return (
                    <div key={label} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`font-medium ${theme.text}`}>{label}</span>
                        <span className={theme.textSecondary}>{count} ({pct}%)</span>
                      </div>
                      <div className={`h-2 rounded-full ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                        <div
                          className={`h-full rounded-full ${tc(colorKey, mode, 'bg').replace('/40','')}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Sessions Table */}
          <div className={`rounded-xl border ${theme.border} overflow-hidden`}>
            <div className={`px-5 py-3 border-b ${theme.border} flex items-center gap-2 ${mode === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <FlaskConical className={`w-4 h-4 ${theme.textSecondary}`} />
              <h3 className={`text-sm font-semibold ${theme.text}`}>All Sessions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${mode === 'dark' ? 'bg-gray-800/60' : 'bg-gray-100'}`}>
                    {['#', 'Title', 'Type', 'Time', 'Speed', 'Accuracy', 'Duration'].map(h => (
                      <th key={h} className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide ${theme.textSecondary}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/10">
                  {stats.tests.map((test, i) => {
                    const sType = getSessionType(test);
                    const Icon = sType.icon;
                    const isGame = test.type === 'game';
                    return (
                      <tr
                        key={i}
                        className={`transition-colors ${mode === 'dark' ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}`}
                      >
                        <td className={`px-4 py-3 text-xs ${theme.textSecondary}`}>{i + 1}</td>
                        <td className={`px-4 py-3 max-w-[160px]`}>
                          <div className={`text-sm font-medium ${theme.text} truncate`}>
                            {test.testTitle || test.content || 'Typing Session'}
                          </div>
                          <div className={`text-xs ${theme.textSecondary}`}>
                            {new Date(test.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tc(sType.color, mode, 'bg')} ${tc(sType.color, mode, 'text')} ${tc(sType.color, mode, 'border')}`}>
                            <Icon className="w-3 h-3" />
                            {sType.label}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-xs ${theme.textSecondary}`}>
                          {new Date(test.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className={`px-4 py-3 font-bold text-sm ${tc(isGame ? 'purple' : 'blue', mode, 'text')}`}>
                          {isGame ? `${test.score ?? test.wpm ?? '—'} pts` : `${test.wpm ?? '—'} WPM`}
                        </td>
                        <td className={`px-4 py-3 font-semibold text-sm ${tc('green', mode, 'text')}`}>
                          {isGame ? '—' : `${test.accuracy ?? '—'}%`}
                        </td>
                        <td className={`px-4 py-3 text-sm ${theme.textSecondary}`}>
                          {test.timeSpent ? formatTime(test.timeSpent) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Calendar Component ───────────────────────────────────────────────── */

const AnalyticsCalendar = ({ testResults = [], onClose }) => {
  const { theme } = useTheme();
  const mode = theme.mode;
  const [selectedDate, setSelectedDate] = useState(null);

  const activityMap = useMemo(() => {
    const map = {};
    testResults.forEach(result => {
      if (result.completedAt) {
        const date = new Date(result.completedAt).toISOString().split('T')[0];
        if (!map[date]) map[date] = { count: 0, totalWpm: 0, totalAccuracy: 0, totalTime: 0, tests: [] };
        map[date].count++;
        map[date].totalWpm += result.wpm || 0;
        map[date].totalAccuracy += result.accuracy || 0;
        map[date].totalTime += result.timeSpent || 0;
        map[date].tests.push(result);
      }
    });
    return map;
  }, [testResults]);

  const calendarData = useMemo(() => {
    const data = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 5);
    startDate.setDate(1);

    for (let m = 0; m < 6; m++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + m);
      const month = { name: monthDate.toLocaleDateString('en-US', { month: 'short' }), year: monthDate.getFullYear(), weeks: [] };
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const lastDay  = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      let week = [];
      for (let i = 0; i < firstDay.getDay(); i++) week.push(null);
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        week.push({ date: dateStr, day, activity: activityMap[dateStr], isToday: dateStr === today.toISOString().split('T')[0], isFuture: date > today });
        if (week.length === 7) { month.weeks.push(week); week = []; }
      }
      if (week.length > 0) { while (week.length < 7) week.push(null); month.weeks.push(week); }
      data.push(month);
    }
    return data;
  }, [activityMap]);

  const getIntensityLevel = (count) => {
    if (!count) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  };

  const intensityColors = {
    dark:  ['bg-gray-800', 'bg-green-900', 'bg-green-700', 'bg-green-500', 'bg-green-400'],
    light: ['bg-gray-200', 'bg-green-200', 'bg-green-400', 'bg-green-500', 'bg-green-600'],
  };

  const getColor = (level, isFuture) => {
    if (isFuture) return mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
    return intensityColors[mode === 'dark' ? 'dark' : 'light'][level];
  };

  const overallStats = useMemo(() => {
    const activeDays = Object.keys(activityMap).length;
    const totalTime  = testResults.reduce((s, r) => s + (r.timeSpent || 0), 0);
    const nonGame    = testResults.filter(r => r.type !== 'game');
    const avgWpm     = nonGame.length ? Math.round(nonGame.reduce((s, r) => s + (r.wpm || 0), 0) / nonGame.length) : 0;
    const avgAcc     = nonGame.length ? Math.round(nonGame.reduce((s, r) => s + (r.accuracy || 0), 0) / nonGame.length) : 0;
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    let d = new Date(today);
    while (activityMap[d.toISOString().split('T')[0]]) { streak++; d.setDate(d.getDate() - 1); }
    return { activeDays, totalTests: testResults.length, totalTime, avgWpm, avgAcc, streak };
  }, [testResults, activityMap]);

  const selectedDateStats = useMemo(() => {
    if (!selectedDate) return null;
    const a = activityMap[selectedDate];
    if (!a) return null;
    const nonGame = a.tests.filter(t => t.type !== 'game');
    return {
      date: new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      count: a.count,
      avgWpm: nonGame.length ? Math.round(nonGame.reduce((s,t) => s+(t.wpm||0),0)/nonGame.length) : 0,
      avgAccuracy: nonGame.length ? Math.round(nonGame.reduce((s,t) => s+(t.accuracy||0),0)/nonGame.length) : 0,
      bestWpm: nonGame.length ? Math.max(...nonGame.map(t=>t.wpm||0)) : 0,
      totalTime: a.totalTime,
      tests: [...a.tests].sort((a,b) => new Date(a.completedAt)-new Date(b.completedAt)),
    };
  }, [selectedDate, activityMap]);

  const summaryCards = [
    { label: 'Avg WPM',     value: overallStats.avgWpm,                      color: 'blue',   icon: Zap        },
    { label: 'Avg Accuracy',value: `${overallStats.avgAcc}%`,                color: 'green',  icon: Target     },
    { label: 'Active Days', value: overallStats.activeDays,                   color: 'purple', icon: Calendar   },
    { label: 'Total Time',  value: `${Math.round(overallStats.totalTime/60)}m`,color: 'orange',icon: Clock      },
    { label: 'Streak',      value: `${overallStats.streak}d`,                color: 'amber',  icon: TrendingUp },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target===e.currentTarget && onClose()}>
        <div className={`${theme.cardBg} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border ${theme.border}`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${mode==='dark'?'bg-blue-900/50':'bg-blue-100'}`}>
                <Calendar className={`w-6 h-6 ${tc('blue',mode,'text')}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${theme.text}`}>Typing Analytics</h2>
                <p className={`text-sm ${theme.textSecondary}`}>Your activity over the last 6 months</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl transition-all hover:scale-105 group ${mode==='dark'?'bg-gray-700 hover:bg-red-600 text-gray-300':'bg-gray-100 hover:bg-red-500 text-gray-600'}`}>
              <X className="w-6 h-6 group-hover:text-white transition-colors" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {summaryCards.map(({ label, value, color, icon: Icon }) => (
                <div key={label} className={`rounded-xl p-4 border ${tc(color,mode,'bg')} ${tc(color,mode,'border')}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${tc(color,mode,'text')}`} />
                    <span className={`text-xs ${theme.textSecondary}`}>{label}</span>
                  </div>
                  <span className={`text-2xl font-bold ${tc(color,mode,'text')}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Calendar */}
            <div className={`rounded-xl p-5 ${mode==='dark'?'bg-gray-900/50':'bg-gray-50'} border ${theme.border}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${theme.text}`}>Activity Calendar</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className={theme.textSecondary}>Less</span>
                  {[0,1,2,3,4].map(l=><div key={l} className={`w-3 h-3 rounded-sm ${getColor(l,false)}`}/>)}
                  <span className={theme.textSecondary}>More</span>
                </div>
              </div>
            {/* Calendar grid with custom tooltips */}
            <div className="grid grid-cols-6 gap-2">
              {calendarData.map((month, mi) => (
                <div key={mi}>
                  <div className={`text-xs ${theme.textSecondary} mb-2 font-medium`}>{month.name}</div>
                  <div className="space-y-1">
                    {month.weeks.map((week, wi) => (
                      <div key={wi} className="flex gap-1">
                        {week.map((day, di) => (
                          <div key={di} className="relative" style={{ isolation: 'isolate' }}>
                            {day ? (
                              <>
                                <button
                                  onClick={() => day.activity && setSelectedDate(day.date)}
                                  className={`cal-day w-3 h-3 rounded-sm transition-all ${getColor(getIntensityLevel(day.activity?.count), day.isFuture)} ${day.isToday ? 'ring-1 ring-blue-500' : ''} ${day.activity ? 'cursor-pointer hover:ring-1 hover:ring-white/60 hover:scale-110' : 'cursor-default'} ${selectedDate===day.date ? 'ring-2 ring-yellow-400 scale-110' : ''}`}
                                />
                                {/* Custom tooltip */}
                                {day.activity && (
                                  <div className={`cal-tooltip ${mode === 'light' ? 'cal-tooltip-light' : ''}`}>
                                    <span className="cal-tooltip-date">
                                      {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="cal-tooltip-row">
                                      <span className="cal-tooltip-label">Sessions</span>
                                      <span className="cal-tooltip-val">{day.activity.count}</span>
                                    </div>
                                    {day.activity.totalWpm > 0 && (
                                      <div className="cal-tooltip-row">
                                        <span className="cal-tooltip-label">Avg WPM</span>
                                        <span className="cal-tooltip-val">{Math.round(day.activity.totalWpm / day.activity.count)}</span>
                                      </div>
                                    )}
                                    <div className="cal-tooltip-row">
                                      <span className="cal-tooltip-label">Accuracy</span>
                                      <span className="cal-tooltip-val">{Math.round(day.activity.totalAccuracy / day.activity.count)}%</span>
                                    </div>
                                    <div className="cal-tooltip-cta">Click to view details</div>
                                  </div>
                                )}
                                {!day.activity && (
                                  <div className={`cal-tooltip ${mode === 'light' ? 'cal-tooltip-light' : ''}`}>
                                    <span className="cal-tooltip-date">
                                      {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="cal-tooltip-row">
                                      <span className="cal-tooltip-label">No activity</span>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : <div className="w-3 h-3"/>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
              <p className={`text-xs ${theme.textSecondary} mt-3 text-center`}>
                Click on any highlighted day to see detailed session stats
              </p>
            </div>

            {/* No data */}
            {testResults.length === 0 && (
              <div className={`text-center py-12 ${theme.textSecondary}`}>
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30"/>
                <h3 className={`text-lg font-semibold ${theme.text} mb-2`}>No activity yet</h3>
                <p>Complete some typing sessions to see your activity here!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDateStats && (
        <DayDetailModal
          stats={selectedDateStats}
          theme={theme}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
};

export default AnalyticsCalendar;
