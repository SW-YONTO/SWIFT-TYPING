import React from 'react';
import { Ban } from 'lucide-react';

export default function AdminModeration({
  theme,
  cardClass,
  subTextClass,
  inputClass,
  banInput,
  setBanInput,
  banReasonInput,
  setBanReasonInput,
  handleBanUser,
  handleUnbanUser,
  bannedDevices,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ban Form */}
      <div className={`${cardClass} p-6 space-y-4`}>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-500" /> Device Moderation &amp; Banning
        </h3>
        <p className={`text-xs ${subTextClass}`}>Ban fraudulent device IDs from syncing leaderboard scores</p>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ${subTextClass}`}>Device ID</label>
            <input
              type="text"
              value={banInput}
              onChange={(e) => setBanInput(e.target.value)}
              placeholder="Paste device_id to ban..."
              className={`w-full ${inputClass} font-mono py-2.5 text-xs`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ${subTextClass}`}>Reason for Suspension</label>
            <input
              type="text"
              value={banReasonInput}
              onChange={(e) => setBanReasonInput(e.target.value)}
              placeholder="Enter custom reason..."
              className={`w-full ${inputClass} py-2.5 text-xs`}
            />
          </div>
          <button
            onClick={handleBanUser}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Ban className="w-3.5 h-3.5" /> Ban Device ID &amp; Account
          </button>
        </div>
      </div>

      {/* Banned List */}
      <div className={`${cardClass} p-6 space-y-4`}>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${subTextClass}`}>
          Currently Banned ({bannedDevices.length})
        </h4>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {bannedDevices.length === 0 ? (
            <p className={`text-xs italic ${subTextClass}`}>No devices currently banned.</p>
          ) : (
            bannedDevices.map(b => (
              <div key={b.device_id} className={`flex justify-between items-center ${theme.inputBg} border ${theme.border} p-3 rounded-xl text-xs`}>
                <span className="font-mono text-red-500 font-bold">{b.device_id}</span>
                <button onClick={() => handleUnbanUser(b.device_id)} className={`${theme.accent} hover:underline cursor-pointer font-bold`}>Unban</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
