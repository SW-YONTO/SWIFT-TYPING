import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { UserCheck, Download, Filter, TrendingUp, Award, Sliders } from 'lucide-react';

export default function TypistDeepDive({
  theme,
  isDarkMode,
  cardClass,
  subTextClass,
  inputClass,
  selectedTypist,
  typistAnalytics,
  handleExportBackup,
  timeRange,
  setTimeRange,
  isFilterExpanded,
  setIsFilterExpanded,
  handleUnlockLessons,
  setCertificateUser,
}) {
  const [customProgress, setCustomProgress] = useState(50);

  // Fallbacks so component works even if parent doesn't pass helpers yet
  const _cardClass = cardClass || `${theme.cardBg} ${theme.border} border shadow-2xl rounded-3xl transition-all duration-300`;
  const _subText = subTextClass || theme.textSecondary || 'text-gray-500';
  const _inputClass = inputClass || `${theme.inputBg} ${theme.border} border ${theme.text} rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`;

  if (!selectedTypist || !typistAnalytics) {
    return (
      <div className={`lg:col-span-2 ${_cardClass} p-6`}>
        <div className="py-20 text-center space-y-3">
          <div className={`w-12 h-12 mx-auto rounded-full ${theme.secondary} flex items-center justify-center border ${theme.border}`}>
            <UserCheck className={`w-6 h-6 ${_subText}`} />
          </div>
          <p className={`text-base font-semibold ${_subText}`}>Select a typist from the left column to view progression stats.</p>
        </div>
      </div>
    );
  }

  // Find active filter index for sliding indicator translation
  const ranges = ['1D', '1W', '1M', '3M', '6M'];
  const activeIndex = ranges.indexOf(timeRange);

  // Chart colors based on actual theme mode
  const chartStroke = isDarkMode ? '#94a3b8' : '#64748b';
  const chartGrid   = isDarkMode ? '#374151' : '#e2e8f0';
  const chartAccent = theme.css?.['--theme-primary'] || '#3b82f6';
  const tooltipBg   = isDarkMode ? '#1f2937' : '#ffffff';
  const tooltipText = isDarkMode ? '#f9fafb' : '#0f172a';
  const tooltipBorder = isDarkMode ? '#374151' : '#cbd5e1';

  return (
    <div className={`lg:col-span-2 ${_cardClass} p-6 space-y-6`}>
      {/* Header Profile Info */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${theme.border} pb-4`}>
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
            <UserCheck className={`w-7 h-7 ${theme.accent}`} /> {selectedTypist.username}
          </h2>
          <p className={`text-xs mt-1 ${_subText}`}>Deep progression telemetry inspector for user</p>
        </div>

        {/* Action controls (Export Recovery File & Timeline filter) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Generate JSON recovery backup file from daily summary telemetry"
          >
            <Download className="w-3.5 h-3.5" /> Export Recovery File
          </button>

          {/* Collapsible Timeline Filter with Sliding Active Indicator */}
          <div
            className={`relative flex items-center p-1 ${theme.secondary} border ${theme.border} rounded-xl transition-all duration-300 overflow-hidden ${
              isFilterExpanded ? 'w-[250px]' : 'w-[90px]'
            }`}
          >
            {/* Filter Toggle Button */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsFilterExpanded(!isFilterExpanded); }}
              className={`p-1.5 hover:opacity-70 rounded-lg transition-colors flex-shrink-0 focus:outline-none cursor-pointer`}
              title="Toggle filter options"
            >
              <Filter className={`w-3.5 h-3.5 ${_subText}`} />
            </button>

            {/* Sliding Indicator + Options */}
            <div className={`relative flex items-center gap-0 transition-all duration-300 ${
              isFilterExpanded ? 'opacity-100 ml-1.5' : 'opacity-0 pointer-events-none w-0'
            }`}>
              {isFilterExpanded && (
                <div
                  className={`absolute top-0 bottom-0 ${theme.primary} rounded-lg transition-all duration-300`}
                  style={{ left: `${activeIndex * 40}px`, width: '40px' }}
                />
              )}
              {ranges.map((range) => (
                <button
                  key={range}
                  onClick={(e) => { e.stopPropagation(); setTimeRange(range); }}
                  className={`w-10 h-7 rounded-lg text-xs font-black relative z-10 transition duration-300 flex items-center justify-center cursor-pointer ${
                    timeRange === range ? 'text-white' : `${_subText} hover:opacity-80`
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Collapsed active badge */}
            {!isFilterExpanded && (
              <span
                onClick={(e) => { e.stopPropagation(); setIsFilterExpanded(true); }}
                className={`text-xs font-black ${theme.accent} ml-2 mr-2 select-none cursor-pointer hover:underline`}
              >
                {timeRange}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Peak Speed',   value: `${typistAnalytics.peakWpm}`,          unit: 'WPM',  color: 'text-blue-500' },
          { label: 'Avg Accuracy', value: `${typistAnalytics.avgAcc}%`,           unit: '',     color: 'text-emerald-500' },
          { label: 'Lessons Done', value: `${typistAnalytics.completedLessonsCount}`, unit: '', color: 'text-purple-500' },
          { label: 'Practice Time', value: `${typistAnalytics.timeSpentMins}`,    unit: 'mins', color: 'text-amber-500' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className={`${theme.secondary} border ${theme.border} p-4 rounded-2xl text-center`}>
            <p className={`text-xs uppercase font-semibold ${_subText}`}>{label}</p>
            <p className={`text-2xl font-black mt-1 ${color}`}>
              {value} {unit && <span className={`text-xs font-normal ${_subText}`}>{unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Admin Operations Panel */}
      <div className={`p-5 border ${theme.border} rounded-2xl ${theme.secondary} space-y-4`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider ${_subText} flex items-center gap-1.5`}>
          <Sliders className={`w-3.5 h-3.5 ${theme.accent}`} /> Admin Controls
        </h4>
        <div className="flex flex-wrap items-center gap-4">

          {/* Custom Curriculum Progress Input */}
          <div className={`flex items-center gap-3 ${theme.cardBg} border ${theme.border} p-2.5 rounded-2xl`}>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[9px] font-bold uppercase tracking-widest ${_subText}`}>Adjust Curriculum Progress</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customProgress}
                  onChange={(e) => setCustomProgress(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className={`w-14 text-center ${_inputClass} py-1 text-xs font-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                />
                <span className={`text-xs font-black ${_subText}`}>%</span>
              </div>
            </div>
            <button
              onClick={() => handleUnlockLessons(customProgress)}
              className={`px-4 py-2 ${theme.primary} ${theme.primaryHover} text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md active:scale-95`}
              title={`Set typist lesson progress to ${customProgress}%`}
            >
              Apply Progress Update
            </button>
          </div>

          <button
            onClick={() => setCertificateUser({
              username: selectedTypist.username,
              wpm: typistAnalytics.peakWpm,
              accuracy: typistAnalytics.avgAcc,
              date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
            })}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95 border border-purple-500/30"
          >
            <Award className="w-3.5 h-3.5" /> Issue Completion Certificate
          </button>
        </div>
      </div>

      {/* WPM Progression AreaChart */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${theme.accent}`} /> {timeRange} WPM Speed Progression Timeline
        </h3>
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={typistAnalytics.dataPoints}>
              <defs>
                <linearGradient id="wpmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={chartAccent} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartAccent} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
              <XAxis dataKey="date" stroke={chartStroke} fontSize={10} tickLine={false} />
              <YAxis stroke={chartStroke} fontSize={10} tickLine={false} domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderRadius: '12px',
                  borderColor: tooltipBorder,
                  color: tooltipText
                }}
              />
              <Area type="monotone" dataKey="wpm" stroke={chartAccent} strokeWidth={3} fillOpacity={1} fill="url(#wpmGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
