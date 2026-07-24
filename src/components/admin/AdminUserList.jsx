import React from 'react';
import { Users, Search } from 'lucide-react';

export default function AdminUserList({
  theme,
  cardClass,
  subTextClass,
  inputClass,
  registeredUsersList,
  selectedTypist,
  setSelectedTypist,
  searchQuery,
  setSearchQuery,
}) {
  const filtered = registeredUsersList.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${cardClass} p-6 space-y-4`}>
      <h3 className="text-lg font-bold flex items-center gap-2">
        <Users className={`w-5 h-5 ${theme.accent}`} /> Select Typist ({registeredUsersList.length})
      </h3>

      {/* Search */}
      <div className="relative">
        <Search className={`w-4 h-4 absolute left-3 top-3 ${subTextClass}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search username..."
          className={`w-full ${inputClass} pl-9 text-xs py-2`}
        />
      </div>

      {/* Typist Cards */}
      <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <p className={`text-xs italic text-center py-8 ${subTextClass}`}>No typists found.</p>
        ) : (
          filtered.map(u => {
            const isActive = selectedTypist?.username === u.username;
            return (
              <div
                key={u.id}
                onClick={() => setSelectedTypist(u)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  isActive
                    ? `${theme.secondary} ${theme.border} ${theme.accent} font-extrabold shadow-sm`
                    : `${theme.border} ${theme.cardBg} ${theme.text} hover:opacity-80`
                }`}
              >
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> {u.username}
                  </p>
                  <p className={`text-xs ${subTextClass}`}>{u.clientType || 'Web'} • {u.totalTests || 0} tests</p>
                </div>
                <span className={`text-sm font-extrabold ${theme.accent}`}>{u.averageWPM || 0} WPM</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
