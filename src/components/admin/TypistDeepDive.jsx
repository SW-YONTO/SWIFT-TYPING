import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { 
  UserCheck, Download, Filter, TrendingUp, Award, Sliders, 
  Zap, Target, Trophy, Clock, CheckCircle2, Lock, PlayCircle, 
  ChevronDown, ChevronUp, Layers, Settings2, X, Check
} from 'lucide-react';
import { typingLessons } from '../../data/lessons';

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
  handleToggleSingleLesson,
  setCertificateUser,
  userCompletedLessons = []
}) {
  const [customProgress, setCustomProgress] = useState(50);
  const [showLessonPickerModal, setShowLessonPickerModal] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState({});

  const _cardClass = cardClass || `${theme.cardBg} ${theme.border} border shadow-2xl rounded-3xl transition-all duration-300`;
  const _subText   = subTextClass || theme.textSecondary || 'text-gray-500';
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

  // Calculate Unit Breakdown & Slider Preview
  const units = Object.entries(typingLessons).map(([unitId, unitData]) => {
    const totalCount = unitData.lessons.length;
    const completedCount = unitData.lessons.filter(l => 
      userCompletedLessons.some(c => c.lessonId === l.id)
    ).length;

    return {
      id: unitId,
      title: unitData.title,
      description: unitData.description,
      lessons: unitData.lessons,
      totalCount,
      completedCount,
      percentage: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
      isFullyDone: completedCount === totalCount && totalCount > 0
    };
  });

  // Calculate preview of flat lessons that slider (customProgress %) will target
  const allFlatLessons = [];
  Object.values(typingLessons).forEach(unit => {
    unit.lessons.forEach(l => allFlatLessons.push(l));
  });
  const previewUnlockCount = Math.ceil(allFlatLessons.length * (customProgress / 100));

  const ranges = ['1D', '1W', '1M', '3M', '6M'];
  const activeIndex = ranges.indexOf(timeRange);

  const chartStroke  = isDarkMode ? '#94a3b8' : '#64748b';
  const chartGrid    = isDarkMode ? '#374151' : '#e2e8f0';
  const chartAccent  = theme.css?.['--theme-primary'] || '#3b82f6';
  const tooltipBg    = isDarkMode ? '#1f2937' : '#ffffff';
  const tooltipText  = isDarkMode ? '#f9fafb' : '#0f172a';
  const tooltipBorder = isDarkMode ? '#374151' : '#cbd5e1';

  const toggleUnitExpand = (unitId) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

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

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Generate JSON recovery backup file"
          >
            <Download className="w-3.5 h-3.5" /> Export Recovery File
          </button>

          {/* Timeline Filter */}
          <div
            className={`relative flex items-center p-1 ${theme.secondary} border ${theme.border} rounded-xl transition-all duration-300 overflow-hidden ${
              isFilterExpanded ? 'w-[250px]' : 'w-[90px]'
            }`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setIsFilterExpanded(!isFilterExpanded); }}
              className="p-1.5 hover:opacity-70 rounded-lg transition-colors flex-shrink-0 focus:outline-none cursor-pointer"
            >
              <Filter className={`w-3.5 h-3.5 ${_subText}`} />
            </button>

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
          { label: 'Peak Speed',    value: typistAnalytics.peakWpm,               unit: 'WPM',  valueCls: theme.accent,       icon: <Zap    className={`w-3.5 h-3.5 ${theme.accent}`}  />, border: theme.border },
          { label: 'Avg Accuracy',  value: `${typistAnalytics.avgAcc}%`,          unit: '',     valueCls: 'text-emerald-500', icon: <Target className="w-3.5 h-3.5 text-emerald-500" />, border: 'border-emerald-500/40' },
          { label: 'Lessons Done',  value: typistAnalytics.completedLessonsCount, unit: '',     valueCls: theme.accent,       icon: <Trophy className={`w-3.5 h-3.5 ${theme.accent}`}  />, border: theme.border },
          { label: 'Practice Time', value: typistAnalytics.timeSpentMins,         unit: 'mins', valueCls: 'text-amber-500',   icon: <Clock  className="w-3.5 h-3.5 text-amber-500"  />, border: 'border-amber-500/40' },
        ].map(({ label, value, unit, valueCls, icon, border }) => (
          <div key={label} className={`${theme.cardBg} border ${border} p-4 rounded-2xl`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${_subText}`}>{label}</span>
              {icon}
            </div>
            <p className={`text-3xl font-black ${valueCls}`}>
              {value}{unit && <span className={`text-xs font-normal ml-1.5 ${_subText}`}>{unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Admin Operations Panel with Slider & Live Preview (E4 & E6) */}
      <div className={`p-5 border ${theme.border} rounded-2xl ${theme.secondary} space-y-4`}>
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-bold uppercase tracking-wider ${_subText} flex items-center gap-1.5`}>
            <Sliders className={`w-3.5 h-3.5 ${theme.accent}`} /> Curriculum Operations
          </h4>
          <button
            onClick={() => setShowLessonPickerModal(true)}
            className={`px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 font-bold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer`}
          >
            <Settings2 className="w-3.5 h-3.5" /> Granular Lesson Picker 🎯
          </button>
        </div>

        {/* Row 1: Curriculum Progress Presets */}
        <div className="space-y-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${_subText}`}>Bulk Curriculum Progress Slider</span>
          
          <div className="flex flex-wrap gap-2">
            {[10, 25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                onClick={() => setCustomProgress(pct)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                  customProgress === pct
                    ? `${theme.primary} text-white border-transparent shadow-md`
                    : `${theme.cardBg} ${theme.border} ${_subText} hover:opacity-80`
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={customProgress}
              onChange={(e) => setCustomProgress(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full accent-[var(--theme-primary)] cursor-pointer"
              style={{ '--theme-primary': theme.css?.['--theme-primary'] || '#3b82f6' }}
            />
            <span className={`text-sm font-black min-w-[3rem] text-right ${theme.accent}`}>{customProgress}%</span>
          </div>

          {/* Real-Time Slider Preview (E4) */}
          <div className={`${theme.cardBg} border ${theme.border} p-3 rounded-xl text-xs space-y-1`}>
            <p className={`font-bold flex items-center justify-between ${_subText}`}>
              <span>Preview: Unlocking first {previewUnlockCount} of {allFlatLessons.length} total lessons</span>
              <span className={`font-black ${theme.accent}`}>{customProgress}%</span>
            </p>
            <div className="w-full bg-gray-500/20 h-2 rounded-full overflow-hidden">
              <div className={`h-full ${theme.primary} transition-all duration-300`} style={{ width: `${customProgress}%` }} />
            </div>
          </div>

          <button
            onClick={() => handleUnlockLessons(customProgress)}
            className={`w-full py-2.5 ${theme.primary} ${theme.primaryHover} text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2`}
          >
            Apply Progress Update — {customProgress}% Curriculum ({previewUnlockCount}/{allFlatLessons.length} Lessons)
          </button>
        </div>

        {/* Row 2: Issue Certificate */}
        <button
          onClick={() => setCertificateUser({
            username: selectedTypist.username,
            wpm: typistAnalytics.peakWpm,
            accuracy: typistAnalytics.avgAcc,
            date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
          })}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95 border border-purple-500/30"
        >
          <Award className="w-3.5 h-3.5" /> Issue Completion Certificate for {selectedTypist.username}
        </button>
      </div>

      {/* Per-Chapter / Unit Lesson Breakdown Accordion (D5) */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
          <Layers className={`w-4 h-4 ${theme.accent}`} /> Curriculum Breakdown by Chapter ({units.length} Units)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {units.map(unit => (
            <div key={unit.id} className={`${theme.cardBg} border ${theme.border} p-3.5 rounded-2xl space-y-2`}>
              <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => toggleUnitExpand(unit.id)}
              >
                <div className="flex items-center gap-2">
                  {unit.isFullyDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : unit.completedCount > 0 ? (
                    <PlayCircle className={`w-4 h-4 ${theme.accent} flex-shrink-0`} />
                  ) : (
                    <Lock className={`w-4 h-4 ${_subText} flex-shrink-0`} />
                  )}
                  <div>
                    <h5 className="text-xs font-bold">{unit.title}</h5>
                    <p className={`text-[10px] ${_subText}`}>{unit.completedCount}/{unit.totalCount} completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black ${unit.isFullyDone ? 'text-emerald-500' : theme.accent}`}>
                    {unit.percentage}%
                  </span>
                  {expandedUnits[unit.id] ? <ChevronUp className={`w-3.5 h-3.5 ${_subText}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${_subText}`} />}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-500/20 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${unit.isFullyDone ? 'bg-emerald-500' : theme.primary}`} 
                  style={{ width: `${unit.percentage}%` }}
                />
              </div>

              {/* Expanded Lesson Details */}
              {expandedUnits[unit.id] && (
                <div className="pt-2 border-t border-dashed border-gray-500/20 space-y-1">
                  {unit.lessons.map(l => {
                    const isDone = userCompletedLessons.some(c => c.lessonId === l.id);
                    return (
                      <div key={l.id} className={`flex items-center justify-between text-[11px] p-1.5 rounded-lg ${isDone ? 'bg-emerald-500/10 text-emerald-600 font-semibold' : _subText}`}>
                        <span>{l.title}</span>
                        <span>{isDone ? '✅ Done' : '🔒 Locked'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* WPM Progression AreaChart */}
      <div className="space-y-3 pt-2">
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

      {/* Granular Individual Lesson Picker Modal (E6) */}
      {showLessonPickerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${_cardClass} max-w-2xl w-full max-h-[85vh] flex flex-col p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center border-b border-gray-500/20 pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Settings2 className={`w-5 h-5 ${theme.accent}`} /> Granular Lesson Completion Picker ({selectedTypist.username})
              </h3>
              <button 
                onClick={() => setShowLessonPickerModal(false)}
                className="p-1 hover:opacity-70 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs ${_subText}`}>Click any lesson to manually toggle its unlock state for {selectedTypist.username}.</p>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {Object.entries(typingLessons).map(([unitId, unitData]) => (
                <div key={unitId} className={`p-3 border ${theme.border} rounded-xl space-y-2`}>
                  <h4 className="text-xs font-bold">{unitData.title}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {unitData.lessons.map(lesson => {
                      const isDone = userCompletedLessons.some(c => c.lessonId === lesson.id);
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleToggleSingleLesson && handleToggleSingleLesson(selectedTypist.username, lesson.id)}
                          className={`p-2 rounded-lg text-xs font-semibold border text-left flex items-center justify-between cursor-pointer transition ${
                            isDone 
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600'
                              : `${theme.cardBg} ${theme.border} ${_subText} hover:opacity-80`
                          }`}
                        >
                          <span className="truncate pr-2">{lesson.title}</span>
                          {isDone ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Lock className="w-3.5 h-3.5 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-500/20 flex justify-end">
              <button
                onClick={() => setShowLessonPickerModal(false)}
                className={`px-5 py-2 ${theme.primary} text-white font-bold rounded-xl text-xs cursor-pointer`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
