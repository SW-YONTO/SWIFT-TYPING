import React, { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Target, Clock, BookOpen, Award, ChevronRight, X, Flame, Lock } from 'lucide-react';
import { achievementManager, ACHIEVEMENTS, LEVELS } from '../utils/achievements';
import { useTheme } from '../contexts/ThemeContext';
import CompletionCertificate from './admin/CompletionCertificate';
import { userManager } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';

const AchievementsPanel = ({ userId, isOpen, onClose }) => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [achievements, setAchievements] = useState([]);
  const [userData, setUserData] = useState({ totalXP: 0, level: 1, unlockedAchievements: [] });
  const [xpProgress, setXpProgress] = useState({ current: 0, required: 100, percentage: 0 });
  const [showCertModal, setShowCertModal] = useState(false);
  const [latestCert, setLatestCert] = useState(null);

  useEffect(() => {
    if (userId && isOpen) {
      const allAchievements = achievementManager.getAllAchievements(userId);
      setAchievements(allAchievements);
      
      const data = achievementManager.getUserAchievements(userId);
      setUserData(data);
      
      const progress = achievementManager.getXPProgress(data.totalXP);
      setXpProgress(progress);
      
      // Mark new achievements as viewed
      achievementManager.markAchievementsViewed(userId);

      // Verify certificate status with Supabase to enforce revocation
      const checkCertsStatus = async () => {
        const savedCerts = JSON.parse(localStorage.getItem(`swift_issued_certs_${userId}`) || '[]');
        let activeCert = savedCerts.length > 0 ? savedCerts[savedCerts.length - 1] : null;

        if (navigator.onLine) {
          try {
            const user = (userManager.getUsers() || []).find(u => u.id === userId);
            if (user?.username) {
              const { data, error } = await supabase
                .from('issued_certificates')
                .select('*')
                .eq('username', user.username)
                .order('issued_at', { ascending: false });

              if (!error) {
                if (data && data.length > 0) {
                  const formatted = data.map(c => {
                    const dateVal = c.issued_at 
                      ? new Date(c.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                    return {
                      id: c.id,
                      username: c.username,
                      wpm: c.wpm,
                      totalTime: c.total_time,
                      date: dateVal
                    };
                  });
                  localStorage.setItem(`swift_issued_certs_${userId}`, JSON.stringify(formatted));
                  activeCert = formatted[formatted.length - 1];
                } else {
                  localStorage.removeItem(`swift_issued_certs_${userId}`);
                  activeCert = null;
                }
              }
            }
          } catch (e) {}
        }
        setLatestCert(activeCert);
      };

      checkCertsStatus();
    }
  }, [userId, isOpen]);

  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'speed', name: 'Speed', icon: Zap },
    { id: 'accuracy', name: 'Accuracy', icon: Target },
    { id: 'streak', name: 'Streaks', icon: Flame },
    { id: 'tests', name: 'Tests', icon: BookOpen },
    { id: 'time', name: 'Time', icon: Clock },
    { id: 'lessons', name: 'Lessons', icon: BookOpen },
    { id: 'special', name: 'Special', icon: Star }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const currentLevel = LEVELS.find(l => l.level === userData.level) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === userData.level + 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className={`${theme.cardBg} w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border ${theme.border}`}>
        {/* Header */}
        <div className={`p-6 ${theme.background} border-b ${theme.border}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${theme.mode === 'dark' ? 'bg-amber-900/40' : 'bg-amber-100'}`}>
                <Trophy className={`w-8 h-8 ${theme.mode === 'dark' ? 'text-amber-400' : 'text-amber-500'}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${theme.text}`}>Achievements</h2>
                <p className={`text-sm ${theme.textSecondary}`}>
                  {unlockedCount} of {totalCount} unlocked
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all hover:scale-105 group cursor-pointer ${theme.mode === 'dark' ? 'hover:bg-red-600' : 'hover:bg-red-500'}`}
            >
              <X className={`w-6 h-6 transition-colors group-hover:text-white ${theme.textSecondary}`} />
            </button>
          </div>

          {/* Level & XP Bar */}
          <div className={`p-4 rounded-xl ${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${theme.mode === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                  Lvl {userData.level}
                </span>
                <span className={`text-sm font-medium ${theme.textSecondary}`}>
                  {currentLevel.title}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${theme.mode === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {userData.totalXP.toLocaleString()} XP
                </span>
                {nextLevel && (
                  <span className={`text-xs ${theme.textSecondary} block`}>
                    {nextLevel.xpRequired - userData.totalXP} XP to Level {nextLevel.level}
                  </span>
                )}
              </div>
            </div>
            <div className={`w-full h-3 rounded-full ${theme.mode === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} overflow-hidden`}>
              <div 
                className="h-full rounded-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${xpProgress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className={`px-6 py-3 border-b ${theme.border} overflow-x-auto`}>
          <div className="flex gap-2 min-w-max">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              const categoryCount = cat.id === 'all' 
                ? achievements.filter(a => a.unlocked).length
                : achievements.filter(a => a.category === cat.id && a.unlocked).length;
              const categoryTotal = cat.id === 'all'
                ? achievements.length
                : achievements.filter(a => a.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? `${theme.primary} text-white`
                      : `${theme.mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} ${theme.textSecondary}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-white/20' 
                      : theme.mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    {categoryCount}/{categoryTotal}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Certificate Banner (if issued) */}
          {latestCert && (
            <div className={`p-5 rounded-2xl border-2 border-dashed ${theme.mode === 'dark' ? 'bg-purple-950/20 border-purple-500/30' : 'bg-purple-50/50 border-purple-300/60'} flex flex-col sm:flex-row items-center justify-between gap-4 mb-5 animate-fadeIn`}>
              <div className="flex items-center gap-3.5 text-center sm:text-left flex-col sm:flex-row">
                <div className={`p-3.5 ${theme.secondary} rounded-2xl ${theme.accent} flex items-center justify-center shadow-sm`}>
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h3 className={`font-black text-base ${theme.text}`}>Certificate Unlocked!</h3>
                  <p className={`text-xs ${theme.textSecondary} mt-0.5`}>
                    Issued on {latestCert.date} with a speed of <strong className={theme.accent}>{latestCert.wpm} WPM</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCertModal(true)}
                className={`w-full sm:w-auto px-5 py-2.5 ${theme.primary} ${theme.primaryHover} text-white font-extrabold rounded-xl text-xs transition shadow-lg hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2`}
              >
                <Award className="w-4 h-4" /> Download Certificate
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map(achievement => (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  achievement.unlocked
                    ? `${theme.mode === 'dark' ? 'bg-linear-to-br from-gray-800 to-gray-900 border-yellow-500/50' : 'bg-linear-to-br from-yellow-50 to-orange-50 border-yellow-400/50'}`
                    : `${theme.cardBg} ${theme.border} opacity-60`
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl text-3xl ${
                    achievement.unlocked
                      ? theme.mode === 'dark' ? 'bg-yellow-900/40' : 'bg-yellow-100'
                      : theme.mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6 opacity-50" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold ${achievement.unlocked ? theme.text : theme.textSecondary}`}>
                        {achievement.name}
                      </h3>
                      {achievement.isNew && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-green-500 text-white rounded-full animate-pulse">
                          NEW!
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${theme.textSecondary} mb-2`}>
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        achievement.unlocked
                          ? theme.mode === 'dark' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                          : theme.mode === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                      }`}>
                        +{achievement.xp} XP
                      </span>
                      {achievement.unlocked && (
                        <span className={`text-xs ${theme.mode === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                          ✓ Unlocked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className={`w-16 h-16 mx-auto mb-4 ${theme.textSecondary} opacity-50`} />
              <p className={theme.textSecondary}>No achievements in this category yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${theme.border} ${theme.background}`}>
          <p className={`text-center text-sm ${theme.textSecondary}`}>
            Keep practicing to unlock more achievements and earn XP! 🎮
          </p>
        </div>
      </div>

      {showCertModal && (() => {
        const currentUser = (userManager.getUsers() || []).find(u => u.id === userId) || { id: userId, username: 'Typist' };
        const savedCerts = JSON.parse(localStorage.getItem(`swift_issued_certs_${userId}`) || '[]');
        const latestCert = savedCerts.length > 0 ? savedCerts[savedCerts.length - 1] : null;
        return (
          <CompletionCertificate
            certificateUser={latestCert}
            typist={currentUser}
            onClose={() => setShowCertModal(false)}
          />
        );
      })()}
    </div>
  );
};

// Achievement Notification Toast
export const AchievementToast = ({ achievement, onClose }) => {
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!achievement) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`${theme.cardBg} p-4 rounded-xl shadow-2xl border-2 border-yellow-500 max-w-sm`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl text-3xl ${theme.mode === 'dark' ? 'bg-yellow-900/40' : 'bg-yellow-100'}`}>
            {achievement.icon}
          </div>
          <div>
            <p className={`text-xs font-medium ${theme.mode === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} uppercase tracking-wide`}>
              🎉 Achievement Unlocked!
            </p>
            <h4 className={`font-bold ${theme.text}`}>{achievement.name}</h4>
            <p className={`text-xs ${theme.textSecondary}`}>+{achievement.xp} XP</p>
          </div>
          <button onClick={onClose} className="ml-auto">
            <X className={`w-5 h-5 ${theme.textSecondary}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPanel;
