import React, { useState } from 'react';
import { Users, Search, Ban, Trash2, Download, AlertTriangle, ShieldCheck, ShieldAlert, CheckSquare, Square, Award } from 'lucide-react';
import { banManager } from '../../utils/storage';
import CustomDropdown from '../common/CustomDropdown';

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
  handleQuickBan,
  handleIssueCertQuick,
  handleExportBackupQuick,
  handleDeleteUser,
  bannedDevices = [],
  whitelistedAnomalies = []
}) {
  const [sortBy, setSortBy] = useState('wpm_desc');
  const [isMultiSelectActive, setIsMultiSelectActive] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Filter & Sort typists
  const processedUsers = registeredUsersList
    .filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(u => {
      const name = u.username?.toLowerCase();
      const isBanned = banManager.isBanned(name) || bannedDevices.some(b => b.device_id?.toLowerCase() === name || b.device_id?.toLowerCase() === u.id?.toLowerCase());
      return {
        ...u,
        isBanned,
        isSuspicious: ((u.averageWPM || 0) > 160 || (u.totalTests > 500 && (u.averageWPM || 0) > 140)) && !whitelistedAnomalies.includes(name)
      };
    })
    .sort((a, b) => {
      if (sortBy === 'wpm_desc') return (b.averageWPM || 0) - (a.averageWPM || 0);
      if (sortBy === 'wpm_asc')  return (a.averageWPM || 0) - (b.averageWPM || 0);
      if (sortBy === 'tests_desc') return (b.totalTests || 0) - (a.totalTests || 0);
      if (sortBy === 'name_asc') return (a.username || '').localeCompare(b.username || '');
      return 0;
    });

  const toggleMultiSelectMode = () => {
    const nextState = !isMultiSelectActive;
    setIsMultiSelectActive(nextState);
    if (!nextState) setSelectedUserIds([]);
  };

  const toggleSelectUser = (uKey, e) => {
    e.stopPropagation();
    setSelectedUserIds(prev => 
      prev.includes(uKey) ? prev.filter(id => id !== uKey) : [...prev, uKey]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === processedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(processedUsers.map(u => u.username || u.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedUserIds.length === 0) return;
    const selectedTargets = processedUsers.filter(u => selectedUserIds.includes(u.username || u.id));
    if (handleDeleteUser) {
      handleDeleteUser(selectedTargets);
      setSelectedUserIds([]);
    }
  };

  return (
    <div className={`${cardClass} p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold flex items-center gap-2">
          <Users className={`w-5 h-5 ${theme.accent}`} /> Typists ({registeredUsersList.length})
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Multi-Select Toggle Button */}
          <button
            onClick={toggleMultiSelectMode}
            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
              isMultiSelectActive
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/10'
                : `${theme.border} ${theme.secondary} ${subTextClass} hover:opacity-80`
            }`}
            title="Toggle Multi-Select Checkboxes"
          >
            <CheckSquare className={`w-3.5 h-3.5 ${isMultiSelectActive ? 'text-cyan-400' : ''}`} />
            <span>Multi-Select</span>
          </button>

        </div>
      </div>

      {/* Multi-Select Active Toolbar */}
      {isMultiSelectActive && processedUsers.length > 0 && (
        <div className="flex items-center justify-between bg-cyan-950/30 p-2 rounded-xl border border-cyan-500/30 text-xs animate-fadeIn">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 font-bold text-cyan-300 hover:text-white transition cursor-pointer"
          >
            {selectedUserIds.length === processedUsers.length && processedUsers.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <Square className="w-4 h-4 text-gray-500" />
            )}
            <span>Select All ({selectedUserIds.length}/{processedUsers.length})</span>
          </button>

          {selectedUserIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] transition flex items-center gap-1 cursor-pointer shadow-md shadow-red-600/20"
            >
              <Trash2 className="w-3 h-3" /> Delete Selected ({selectedUserIds.length})
            </button>
          )}
        </div>
      )}

      {/* Controls: Search & Sort */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${subTextClass}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter typists..."
            className={`w-full ${inputClass} pl-8 text-xs py-1.5`}
          />
        </div>
        <CustomDropdown
          value={sortBy}
          onChange={(val) => setSortBy(val)}
          theme={theme}
          options={[
            { value: 'wpm_desc', label: 'Sort: WPM ↓' },
            { value: 'wpm_asc', label: 'Sort: WPM ↑' },
            { value: 'tests_desc', label: 'Sort: Tests ↓' },
            { value: 'name_asc', label: 'Sort: Name (A-Z)' },
          ]}
        />
      </div>

      {/* Typist Cards List */}
      <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-1">
        {processedUsers.length === 0 ? (
          <p className={`text-xs italic text-center py-8 ${subTextClass}`}>No typists found matching filter.</p>
        ) : (
          processedUsers.map(u => {
            const uKey = u.username || u.id;
            const isChecked = selectedUserIds.includes(uKey);
            const isActive = selectedTypist?.username?.toLowerCase() === u.username?.toLowerCase();
            return (
              <div
                key={u.id || u.username}
                onClick={() => setSelectedTypist(u)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isActive
                    ? `${theme.secondary} ${theme.border} border-2 shadow-md`
                    : `${theme.border} ${theme.cardBg} ${theme.text} hover:opacity-90`
                }`}
              >
                {/* Header row */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-2.5">
                    {/* Checkbox ONLY shown when isMultiSelectActive is TRUE */}
                    {isMultiSelectActive && (
                      <button
                        onClick={(e) => toggleSelectUser(uKey, e)}
                        className="mt-0.5 text-gray-400 hover:text-cyan-400 transition cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    )}
                    <div>
                      <p className="text-sm font-bold flex items-center gap-1.5 flex-wrap">
                        <span className={`w-2 h-2 rounded-full ${u.isBanned ? 'bg-red-500 animate-pulse' : u.isSuspicious ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span>{u.username}</span>

                        {u.isBanned && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-500 font-extrabold text-[9px] rounded-md flex items-center gap-0.5" title="User is suspended">
                            <ShieldAlert className="w-2.5 h-2.5" /> Banned
                          </span>
                        )}

                        {u.isSuspicious && !u.isBanned && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-600 font-extrabold text-[9px] rounded-md flex items-center gap-0.5" title="Suspiciously high WPM detected">
                            <AlertTriangle className="w-2.5 h-2.5" /> Bot Suspect
                          </span>
                        )}
                      </p>
                      <p className={`text-[11px] ${subTextClass} mt-0.5`}>
                        {u.clientType || 'Web'} • {u.totalTests || 0} tests
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-black ${u.isBanned ? 'text-red-500' : u.isSuspicious ? 'text-amber-500' : theme.accent}`}>
                    {u.averageWPM || 0} <span className="text-[10px] font-normal">WPM</span>
                  </span>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-dashed border-gray-500/20" onClick={(e) => e.stopPropagation()}>
                  {u.isBanned ? (
                    <button
                      onClick={() => handleQuickBan && handleQuickBan(u)}
                      className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Unban User"
                    >
                      <ShieldCheck className="w-3 h-3" /> Unban
                    </button>
                  ) : (
                    <button
                      onClick={() => handleQuickBan && handleQuickBan(u)}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-500 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Ban User"
                    >
                      <Ban className="w-3 h-3" /> Ban
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteUser && handleDeleteUser(u)}
                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-500 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Delete User Account"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>

                  <button
                    onClick={() => handleIssueCertQuick && handleIssueCertQuick(u)}
                    className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-purple-600 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Issue Certificate &amp; Notify"
                  >
                    <Award className="w-3 h-3" /> Issue Cert
                  </button>

                  <button
                    onClick={() => handleExportBackupQuick && handleExportBackupQuick(u)}
                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ml-auto"
                    title="Export JSON Recovery File"
                  >
                    <Download className="w-3 h-3" /> Export
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
