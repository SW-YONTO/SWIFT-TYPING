import React, { useState } from 'react';
import { Ban, ShieldCheck, Mail, History, Trash2, AlertCircle, Copy, Check } from 'lucide-react';

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
  bannedDevices = [],
  auditLogs = [],
  handleClearAuditLogs
}) {
  const [activeSubTab, setActiveSubTab] = useState('moderation'); // 'moderation' | 'audit' | 'mail'
  const [copiedText, setCopiedText] = useState(false);

  // Mailto builder helper (F4: Client Free Mail Explanation)
  const supportEmail = 'support@swifttyping.app';
  const mailtoSubject = encodeURIComponent('Swift Typing — Account Unban / Support Request');
  const mailtoBody = encodeURIComponent(
    `Hello Swift Typing Support Team,\n\nI am writing regarding my account/device status.\n\nUsername: \nDevice ID: \nReason for request: \n\nThank you!`
  );
  const mailtoUrl = `mailto:${supportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  const copyMailto = () => {
    navigator.clipboard.writeText(`To: ${supportEmail}\nSubject: Swift Typing — Account Unban / Support Request\nBody: Hello Swift Typing Support Team...`);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className={`flex items-center gap-2 border-b ${theme.border} pb-3 overflow-x-auto`}>
        <button
          onClick={() => setActiveSubTab('moderation')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
            activeSubTab === 'moderation' 
              ? `${theme.primary} text-white shadow-md` 
              : `${theme.cardBg} ${theme.border} border ${subTextClass} hover:opacity-80`
          }`}
        >
          <Ban className="w-3.5 h-3.5" /> Banning & Suspensions ({bannedDevices.length})
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
            activeSubTab === 'audit' 
              ? `${theme.primary} text-white shadow-md` 
              : `${theme.cardBg} ${theme.border} border ${subTextClass} hover:opacity-80`
          }`}
        >
          <History className="w-3.5 h-3.5" /> Admin Audit Log ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('mail')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
            activeSubTab === 'mail' 
              ? `${theme.primary} text-white shadow-md` 
              : `${theme.cardBg} ${theme.border} border ${subTextClass} hover:opacity-80`
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-emerald-500" /> Client Free Mailer Guide (F4) ✉️
        </button>
      </div>

      {/* --- SUB TAB 1: BANNING & SUSPENSIONS --- */}
      {activeSubTab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ban Form */}
          <div className={`${cardClass} p-6 space-y-4`}>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" /> Account &amp; Device Suspension (H-8)
            </h3>
            <p className={`text-xs ${subTextClass}`}>
              Enter a <strong>Username</strong> or <strong>Device ID</strong> to suspend access. Banned users see an automatic ban dialog.
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${subTextClass}`}>Username or Device ID</label>
                <input
                  type="text"
                  value={banInput}
                  onChange={(e) => setBanInput(e.target.value)}
                  placeholder="e.g. 'john_doe' or 'dev_84f9a12c...'"
                  className={`w-full ${inputClass} py-2.5 text-xs`}
                />
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${subTextClass}`}>Reason for Suspension (H-10)</label>
                <input
                  type="text"
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  placeholder="Enter suspension reason..."
                  className={`w-full ${inputClass} py-2.5 text-xs`}
                />
              </div>
              <button
                onClick={handleBanUser}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/20 active:scale-95"
              >
                <Ban className="w-3.5 h-3.5" /> Suspend User / Device
              </button>
            </div>
          </div>

          {/* Banned List with Reasons & Timestamps */}
          <div className={`${cardClass} p-6 space-y-4`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${subTextClass}`}>
              Currently Banned Items ({bannedDevices.length})
            </h4>
            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {bannedDevices.length === 0 ? (
                <p className={`text-xs italic py-8 text-center ${subTextClass}`}>No users or devices currently banned.</p>
              ) : (
                bannedDevices.map(b => (
                  <div key={b.device_id} className={`${theme.cardBg} border ${theme.border} p-3.5 rounded-xl text-xs space-y-2 shadow-xs`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-mono text-red-500 font-extrabold flex items-center gap-1">
                          <Ban className="w-3.5 h-3.5 text-red-500" /> {b.device_id}
                        </span>
                        {(b.created_at || b.bannedAt) && (
                          <p className={`text-[10px] ${subTextClass} mt-0.5`}>
                            Banned: {new Date(b.created_at || b.bannedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => handleUnbanUser(b.device_id)} 
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 rounded-lg cursor-pointer font-bold text-[11px] transition flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" /> Unban
                      </button>
                    </div>
                    {b.ban_reason && (
                      <div className={`text-[11px] ${subTextClass} bg-red-500/5 p-2 rounded-lg border border-red-500/10`}>
                        <strong className="text-red-500">Reason:</strong> {b.ban_reason}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SUB TAB 2: ADMIN AUDIT LOG (A-7 & H-11) --- */}
      {activeSubTab === 'audit' && (
        <div className={`${cardClass} p-6 space-y-4`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <History className={`w-5 h-5 ${theme.accent}`} /> Admin Action Audit Log
              </h3>
              <p className={`text-xs ${subTextClass}`}>Chronological record of all administrative overrides, bans, and certificate issuances.</p>
            </div>
            {auditLogs.length > 0 && (
              <button
                onClick={handleClearAuditLogs}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Audit History
              </button>
            )}
          </div>

          <div className={`overflow-x-auto border ${theme.border} rounded-xl max-h-96`}>
            <table className="w-full text-left text-xs">
              <thead className={`${theme.secondary} ${subTextClass} uppercase font-bold sticky top-0 border-b ${theme.border}`}>
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.border} font-mono`}>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={`p-8 text-center italic ${subTextClass}`}>No admin actions logged yet. Operations will be recorded here automatically.</td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className={`hover:${theme.secondary} transition-colors`}>
                      <td className={`p-3 whitespace-nowrap ${subTextClass}`}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3 whitespace-nowrap font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          log.action === 'USER_BAN' ? 'bg-red-500/20 text-red-500' :
                          log.action === 'USER_UNBAN' ? 'bg-emerald-500/20 text-emerald-600' :
                          log.action === 'PROGRESS_UPDATE' ? 'bg-blue-500/20 text-blue-600' :
                          'bg-purple-500/20 text-purple-600'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className={`p-3 whitespace-nowrap font-bold ${theme.accent}`}>{log.target || 'System'}</td>
                      <td className={`p-3 ${subTextClass}`}>{log.details || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUB TAB 3: CLIENT FREE MAILER GUIDE (F4) --- */}
      {activeSubTab === 'mail' && (
        <div className={`${cardClass} p-6 space-y-6`}>
          <div className="space-y-2 border-b border-gray-500/20 pb-4">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Mail className="w-6 h-6 text-emerald-500" /> Free Client-Side Support Email Architecture (F4)
            </h3>
            <p className={`text-xs ${subTextClass}`}>
              Explaining how users send support &amp; unban request emails to admin for <strong>100% FREE</strong> without any paid backend server costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Method 1 */}
            <div className={`p-4 border ${theme.border} ${theme.secondary} rounded-2xl space-y-3`}>
              <h4 className="font-extrabold text-sm flex items-center gap-2">
                <span>1. Standard `mailto:` URI Launcher (Zero Setup)</span>
              </h4>
              <p className={subTextClass}>
                When the user clicks "Request Unban" or "Contact Support", the application opens a standard <code>mailto:</code> link. This opens the user's native email client (Gmail, Outlook, Apple Mail) with your recipient email, subject, and pre-formatted body ready to send.
              </p>
              <div className="p-3 bg-gray-500/10 rounded-xl space-y-2">
                <p className="font-mono text-[11px] text-emerald-600 font-bold">Target: support@swifttyping.app</p>
                <a
                  href={mailtoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${theme.primary} text-white font-bold rounded-lg cursor-pointer`}
                >
                  <Mail className="w-3.5 h-3.5" /> Test Launch `mailto:` URI
                </a>
              </div>
            </div>

            {/* Method 2 */}
            <div className={`p-4 border ${theme.border} ${theme.secondary} rounded-2xl space-y-3`}>
              <h4 className="font-extrabold text-sm flex items-center gap-2">
                <span>2. Free Web Form API (Formspree / Web3Forms)</span>
              </h4>
              <p className={subTextClass}>
                If the user does not have a default email desktop client installed, Swift Typing provides a free web modal form connected to <strong>Web3Forms / Formspree</strong> (up to 500 free submissions/month). Emails arrive directly in your personal admin inbox!
              </p>
              <button
                onClick={copyMailto}
                className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-600 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText ? 'Copied Template!' : 'Copy Support Mail Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
