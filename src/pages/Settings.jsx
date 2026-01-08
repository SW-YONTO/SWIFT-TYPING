import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Clock, 
  Hash, 
  Save, 
  BarChart3,
  Type,
  User,
  Edit3,
  Check,
  X,
  Sliders,
  Monitor,
  Smartphone,
  Hand,
  RotateCcw,
  Laptop,
  MonitorSpeaker,
  Calendar,
  TrendingUp,
  Volume2,
  VolumeX,
  Trophy,
  Star,
  Download,
  Upload,
  Flame,
  AlertCircle,
  Camera
} from 'lucide-react';
import { progressManager, themes, userManager, streakManager, dataManager } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';
import Footer from '../components/Footer';
import AnalyticsCalendar from '../components/AnalyticsCalendar';
import AchievementsPanel from '../components/AchievementsPanel';
import { soundEffects } from '../utils/soundEffects';
import { achievementManager } from '../utils/achievements';

// Available avatars (15 avatars)
const AVATARS = Array.from({ length: 15 }, (_, i) => `avatar${i + 1}.png`);

const Settings = ({ currentUser, settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState({
    ...settings,
    fontSize: settings.fontSize || 'medium',
    fontFamily: settings.fontFamily || 'inter',
    practiceMode: settings.practiceMode || 'time',
    timeLimit: settings.timeLimit || 60,
    wordLimit: settings.wordLimit || 50,
    showVirtualHand: settings.showVirtualHand === true, // Strict boolean check
    handPositionHeight: settings.handPositionHeight || '100%',
    handPositionBottom: settings.handPositionBottom || '35%',
    handPositionLeft: settings.handPositionLeft || '56%',
    userName: currentUser?.username || ''
  });
  const [saved, setSaved] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser?.username || '');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundEffects.getConfig().enabled);
  const [soundVolume, setSoundVolume] = useState(() => soundEffects.getConfig().volume);
  const [streakData, setStreakData] = useState(() => streakManager.checkStreak(currentUser?.id));
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(() => currentUser?.avatar || 'avatar1.png');

  // Update streak data on mount
  useEffect(() => {
    if (currentUser?.id) {
      setStreakData(streakManager.checkStreak(currentUser.id));
    }
  }, [currentUser?.id]);

  // Handle export
  const handleExport = () => {
    if (currentUser) {
      dataManager.downloadExport(currentUser.id, currentUser.username);
      soundEffects.playSuccess();
    }
  };

  // Handle import
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = dataManager.importUserData(currentUser.id, e.target.result);
      setImportStatus(result);
      if (result.success) {
        soundEffects.playAchievement();
        // Refresh the page after successful import
        setTimeout(() => window.location.reload(), 1500);
      } else {
        soundEffects.playError();
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Handle avatar change
  const handleAvatarChange = (newAvatar) => {
    userManager.updateUserAvatar(currentUser.id, newAvatar);
    setCurrentAvatar(newAvatar);
    setShowAvatarModal(false);
    soundEffects.playSuccess();
    
    // Update current user object
    const updatedUser = { ...currentUser, avatar: newAvatar };
    // Trigger re-render by updating through parent if available
    window.location.reload(); // Simple solution to refresh user data
  };

  // Get avatar path
  const getAvatarPath = (avatar) => {
    try {
      return new URL(`../assets/avatars/${avatar}`, import.meta.url).href;
    } catch {
      return new URL('../assets/avatars/avatar1.png', import.meta.url).href;
    }
  };

  // Handle manual input changes for hand position
  const handleManualPositionInput = (key, value) => {
    // Validate and format the input
    let numValue = parseInt(value.replace(/[^0-9]/g, ''));
    if (isNaN(numValue)) return;
    
    // Apply constraints based on the setting type
    if (key === 'handPositionHeight') {
      numValue = Math.max(70, Math.min(130, numValue));
    } else if (key === 'handPositionBottom') {
      numValue = Math.max(5, Math.min(50, numValue));
    } else if (key === 'handPositionLeft') {
      numValue = Math.max(45, Math.min(65, numValue));
    }
    
    handleSettingChange(key, `${numValue}%`);
  };
  const { 
    theme, 
    themeKey, 
    fontSize, 
    fontFamily,
    changeTheme, 
    changeFontSize, 
    changeFontFamily,
    isDarkMode
  } = useTheme();

  useEffect(() => {
    setLocalSettings({
      ...settings,
      theme: themeKey,
      fontSize: fontSize,
      fontFamily: fontFamily,
      practiceMode: settings.practiceMode || 'time',
      timeLimit: settings.timeLimit || 60,
      wordLimit: settings.wordLimit || 50,
      showVirtualHand: settings.showVirtualHand === true, // Strict boolean check
      handPositionHeight: settings.handPositionHeight || '100%',
      handPositionBottom: settings.handPositionBottom || '35%',
      handPositionLeft: settings.handPositionLeft || '56%',
      userName: currentUser?.username || ''
    });
  }, [settings, themeKey, fontSize, fontFamily, currentUser]);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setSaved(false);

    // Apply changes immediately for UI settings
    if (key === 'theme') {
      changeTheme(value);
    } else if (key === 'fontSize') {
      changeFontSize(value);
    } else if (key === 'fontFamily') {
      changeFontFamily(value);
    } else if (key === 'showVirtualHand') {
      // Immediately save showVirtualHand to storage and notify parent
      progressManager.updateSettings(currentUser.id, newSettings);
      onSettingsChange(newSettings);
    }
  };

  const handleUsernameEdit = () => {
    setEditingUsername(true);
    setNewUsername(currentUser?.username || '');
  };

  const handleUsernameSave = () => {
    if (newUsername.trim() && newUsername !== currentUser?.username) {
      // Update user in storage
      const users = userManager.getUsers();
      const userIndex = users.findIndex(user => user.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex].username = newUsername.trim();
        localStorage.setItem('typing_app_users', JSON.stringify(users));
        
        // Update local settings
        handleSettingChange('userName', newUsername.trim());
      }
    }
    setEditingUsername(false);
  };

  const handleUsernameCancel = () => {
    setNewUsername(currentUser?.username || '');
    setEditingUsername(false);
  };

  const handleSave = () => {
    progressManager.updateSettings(currentUser.id, localSettings);
    onSettingsChange(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const userProgress = progressManager.getUserProgress(currentUser.id);

  const fontSizeOptions = [
    { value: 'small', label: 'Small (20px)', preview: 'text-sm' },
    { value: 'medium', label: 'Medium (24px)', preview: 'text-md' },
    { value: 'large', label: 'Large (30px)', preview: 'text-xl' },
    { value: 'xl', label: 'Extra Large (36px)', preview: 'text-2xl' }
  ];

  const fontFamilyOptions = [
    { value: 'inter', label: 'Inter (Sans-serif)', class: 'font-sans' },
    { value: 'roboto', label: 'Roboto (Sans-serif)', class: 'font-sans' },
    { value: 'mono', label: 'JetBrains Mono (Monospace)', class: 'font-mono' },
    { value: 'serif', label: 'Georgia (Serif)', class: 'font-serif' }
  ];

  return (
    <div className={`min-h-screen ${theme.background} py-8`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-3 ${theme.primary} rounded-2xl shadow-lg`}>
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-4xl font-bold ${theme.text}`}>Settings</h1>
          </div>
          <p className={`${theme.textSecondary} text-lg`}>Customize your typing experience</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Settings Panel */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* User Profile Section */}
            <div className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.border} p-8`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 ${theme.primary} rounded-lg`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className={`text-2xl font-semibold ${theme.text}`}>Profile</h2>
              </div>
              
              <div className="space-y-6">
                {/* Avatar Section */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-3`}>
                    Profile Avatar
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-1">
                        <img
                          src={getAvatarPath(currentAvatar)}
                          alt="Profile Avatar"
                          className={`w-full h-full rounded-full object-cover border-4 ${isDarkMode ? 'border-gray-700' : 'border-white'} shadow-lg`}
                        />
                      </div>
                      <button
                        onClick={() => setShowAvatarModal(true)}
                        className={`absolute -bottom-1 -right-1 p-2 ${theme.primary} text-white rounded-full shadow-lg hover:opacity-90 transition-all transform hover:scale-110`}
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <p className={`${theme.text} font-medium mb-1`}>Change your avatar</p>
                      <p className={`${theme.textSecondary} text-sm mb-3`}>Click the camera icon to choose from 15 available avatars</p>
                      <button
                        onClick={() => setShowAvatarModal(true)}
                        className={`px-4 py-2 ${theme.secondary} ${theme.accent} rounded-lg hover:opacity-90 transition-all text-sm font-medium flex items-center gap-2`}
                      >
                        <Camera className="w-4 h-4" />
                        Choose Avatar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Username Section */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-3`}>
                    Username
                  </label>
                  <div className="flex items-center gap-3">
                    {editingUsername ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className={`flex-1 px-4 py-3 border ${theme.border} rounded-xl ${theme.inputBg} ${theme.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                          placeholder="Enter username"
                          autoFocus
                          autoComplete="username"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-gramm="false"
                          data-gramm_editor="false"
                          data-enable-grammarly="false"
                        />
                        <button
                          onClick={handleUsernameSave}
                          className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleUsernameCancel}
                          className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`px-4 py-3 ${theme.inputBg} border ${theme.border} rounded-xl flex-1 ${theme.text}`}>
                          {currentUser?.username}
                        </div>
                        <button
                          onClick={handleUsernameEdit}
                          className={`p-3 ${theme.secondary} ${theme.accent} rounded-xl ${theme.secondaryHover} transition-colors`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Selection Modal */}
            {showAvatarModal && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowAvatarModal(false)}
              >
                <div
                  className={`${theme.cardBg} rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border ${theme.border} shadow-2xl`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-2xl font-bold ${theme.text}`}>Choose Your Avatar</h3>
                    <button
                      onClick={() => setShowAvatarModal(false)}
                      className={`p-2 ${theme.secondary} rounded-lg hover:opacity-80 transition-all`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 mb-6">
                    {AVATARS.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => handleAvatarChange(avatar)}
                        className={`relative rounded-full overflow-hidden transition-all hover:scale-110 aspect-square p-0.5 ${
                          currentAvatar === avatar
                            ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg ring-4 ring-blue-300'
                            : 'bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 hover:from-blue-300 hover:via-purple-300 hover:to-pink-300'
                        }`}
                      >
                        <div className={`rounded-full overflow-hidden ${
                          isDarkMode ? 'bg-gray-800' : 'bg-white'
                        } p-1 w-full h-full`}>
                          <img
                            src={getAvatarPath(avatar)}
                            alt={`Avatar ${avatar}`}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                        {currentAvatar === avatar && (
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center rounded-full">
                            <Check className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setShowAvatarModal(false)}
                    className={`w-full py-3 rounded-xl ${theme.secondary} ${theme.accent} hover:opacity-90 transition-all font-medium`}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            <div className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.border} p-8`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 ${theme.primary} rounded-lg`}>
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <h2 className={`text-2xl font-semibold ${theme.text}`}>Appearance</h2>
              </div>
              
              <div className="space-y-8">
                {/* Color Theme Selection */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-4`}>
                    Theme Selection
                  </label>
                  
                  {/* Light Themes */}
                  <div className="mb-6">
                    <h3 className={`text-sm font-medium ${theme.textSecondary} mb-3 flex items-center gap-2`}>
                      <span>☀️</span> Light Themes
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(themes).filter(([_, themeData]) => themeData.mode === 'light').map(([key, themeData]) => (
                        <div
                          key={key}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                            themeKey === key
                              ? `${theme.primary} border-transparent shadow-lg text-white`
                              : `${theme.inputBg} ${theme.border} hover:${theme.border} ${theme.text}`
                          }`}
                          onClick={() => handleSettingChange('theme', key)}
                        >
                          <div className={`w-full h-6 rounded-md mb-2 ${themeData.primary} shadow-sm`}></div>
                          <div className="text-center">
                            <div className="text-xs font-medium">{themeData.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dark Themes */}
                  <div>
                    <h3 className={`text-sm font-medium ${theme.textSecondary} mb-3 flex items-center gap-2`}>
                      <span>🌙</span> Dark Themes
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(themes).filter(([_, themeData]) => themeData.mode === 'dark').map(([key, themeData]) => (
                        <div
                          key={key}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                            themeKey === key
                              ? `${theme.primary} border-transparent shadow-lg text-white`
                              : `${theme.inputBg} ${theme.border} hover:${theme.border} ${theme.text}`
                          }`}
                          onClick={() => handleSettingChange('theme', key)}
                        >
                          <div className={`w-full h-6 rounded-md mb-2 ${themeData.primary} shadow-sm`}></div>
                          <div className="text-center">
                            <div className="text-xs font-medium">{themeData.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography Settings */}
            <div className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.border} p-8`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 ${theme.primary} rounded-lg`}>
                  <Type className="w-5 h-5 text-white" />
                </div>
                <h2 className={`text-2xl font-semibold ${theme.text}`}>Typography</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Font SizeHello amma khani me roti banai chawan. Laptop ID.  */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-3`}>
                    Font Size
                  </label>
                  <div className="space-y-2">
                    {fontSizeOptions.map(option => (
                      <div
                        key={option.value}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          localSettings.fontSize === option.value
                            ? `${theme.primary} border-transparent text-white shadow-lg`
                            : `${theme.inputBg} ${theme.border} ${theme.text} hover:${theme.border}`
                        }`}
                        onClick={() => handleSettingChange('fontSize', option.value)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.label}</span>
                          <span className={`${option.preview} opacity-75`}>Sample text</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-3`}>
                    Font Family
                  </label>
                  <div className="space-y-2">
                    {fontFamilyOptions.map(option => (
                      <div
                        key={option.value}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          localSettings.fontFamily === option.value
                            ? `${theme.primary} border-transparent text-white shadow-lg`
                            : `${theme.inputBg} ${theme.border} ${theme.text} hover:${theme.border}`
                        }`}
                        onClick={() => handleSettingChange('fontFamily', option.value)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.label}</span>
                          <span className={`${option.class} opacity-75`}>Sample text</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Practice Preferences */}
            <div className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.border} p-8`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 ${theme.primary} rounded-lg`}>
                  <Sliders className="w-5 h-5 text-white" />
                </div>
                <h2 className={`text-2xl font-semibold ${theme.text}`}>Practice Preferences</h2>
              </div>
              
              <div className="space-y-8">
                {/* Practice Mode Selection */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-3`}>
                    Default Practice Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        localSettings.practiceMode === 'time'
                          ? `${theme.primary} border-transparent text-white shadow-lg`
                          : `${theme.inputBg} ${theme.border} ${theme.text} hover:${theme.border}`
                      }`}
                      onClick={() => handleSettingChange('practiceMode', 'time')}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5" />
                        <div>
                          <div className="font-semibold">Time Mode</div>
                          <div className="text-xs opacity-75">Practice for a set duration</div>
                        </div>
                      </div>
                    </div>
                    
                    <div
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        localSettings.practiceMode === 'word'
                          ? `${theme.primary} border-transparent text-white shadow-lg`
                          : `${theme.inputBg} ${theme.border} ${theme.text} hover:${theme.border}`
                      }`}
                      onClick={() => handleSettingChange('practiceMode', 'word')}
                    >
                      <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5" />
                        <div>
                          <div className="font-semibold">Word Mode</div>
                          <div className="text-xs opacity-75">Practice for a set word count</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Time Limits */}
                  <div>
                    <label className={`block text-sm font-medium ${theme.text} mb-3`}>
                      Time Limit Options
                    </label>
                    <select
                      value={localSettings.timeLimit}
                      onChange={(e) => handleSettingChange('timeLimit', parseInt(e.target.value))}
                      className={`w-full px-4 py-3 border ${theme.border} rounded-xl ${theme.inputBg} ${theme.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    >
                      <option value={15}>15 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={300}>5 minutes</option>
                      <option value={600}>10 minutes</option>
                      <option value={900}>15 minutes</option>
                      <option value={0}>No limit</option>
                    </select>
                  </div>

                  {/* Word Limits */}
                  <div>
                    <label className={`block text-sm font-medium ${theme.text} mb-3`}>
                      Word Limit Options
                    </label>
                    <select
                      value={localSettings.wordLimit}
                      onChange={(e) => handleSettingChange('wordLimit', parseInt(e.target.value))}
                      className={`w-full px-4 py-3 border ${theme.border} rounded-xl ${theme.inputBg} ${theme.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    >
                      <option value={10}>10 words</option>
                      <option value={25}>25 words</option>
                      <option value={50}>50 words</option>
                      <option value={100}>100 words</option>
                      <option value={200}>200 words</option>
                      <option value={500}>500 words</option>
                      <option value={0}>No limit</option>
                    </select>
                  </div>
                </div>

                {/* Virtual Hand Setting */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-3 flex items-center gap-2`}>
                    <Hand className="w-4 h-4" />
                    Virtual Hand Guide
                  </label>
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      localSettings.showVirtualHand
                        ? `${theme.primary} border-transparent text-white shadow-lg`
                        : `${theme.inputBg} ${theme.border} ${theme.text} hover:border-blue-300`
                    }`}
                    onClick={() => handleSettingChange('showVirtualHand', !localSettings.showVirtualHand)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold mb-1">Show Virtual Hand</div>
                        <div className="text-xs opacity-75">Display hand diagram showing proper finger placement for beginners</div>
                      </div>
                      <div className={`relative w-12 h-6 rounded-full transition-all ${
                        localSettings.showVirtualHand 
                          ? 'bg-white/20' 
                          : theme.mode === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all transform ${
                          localSettings.showVirtualHand 
                            ? 'translate-x-6 bg-white' 
                            : 'translate-x-0.5 bg-white'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hand Position Adjustment */}
                {localSettings.showVirtualHand && (
                  <div>
                    <label className={`block text-sm font-medium ${theme.text} mb-3 flex items-center gap-2`}>
                      <Sliders className="w-4 h-4" />
                      Hand Position Adjustment
                    </label>
                    <div className={`p-6 rounded-xl border ${theme.border} ${theme.cardBg}`}>
                      <div className="space-y-6">
                        {/* Height Control */}
                        <div>
                          <label className={`block text-sm font-medium ${theme.text} mb-3 flex items-center justify-between`}>
                            <span>Hand Height</span>
                            <input
                              type="text"
                              value={localSettings.handPositionHeight || '100%'}
                              onChange={(e) => handleManualPositionInput('handPositionHeight', e.target.value)}
                              className={`w-20 text-sm font-mono px-2 py-1 rounded border ${theme.border} ${theme.inputBg} ${theme.text} text-center`}
                              placeholder="100%"
                              autoComplete="off"
                              spellCheck="false"
                              autoCorrect="off"
                            />
                          </label>
                          <div className="space-y-3">
                            <input
                              type="range"
                              min="70"
                              max="130"
                              step="1"
                              value={parseInt(localSettings.handPositionHeight?.replace('%', '')) || 100}
                              onChange={(e) => handleSettingChange('handPositionHeight', `${e.target.value}%`)}
                              className={`w-full h-2 rounded-lg appearance-none cursor-pointer hand-slider settings-slider ${theme.mode === 'dark' ? 'hand-slider-dark' : 'hand-slider-light'}`}
                              style={{ pointerEvents: 'auto' }}
                            />
                            <div className={`flex justify-between text-xs ${theme.textSecondary}`}>
                              <span>70% (Small)</span>
                              <span>100% (Normal)</span>
                              <span>130% (Large)</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Position Control */}
                        <div>
                          <label className={`block text-sm font-medium ${theme.text} mb-3 flex items-center justify-between`}>
                            <span>Vertical Position (from bottom)</span>
                            <input
                              type="text"
                              value={localSettings.handPositionBottom || '35%'}
                              onChange={(e) => handleManualPositionInput('handPositionBottom', e.target.value)}
                              className={`w-20 text-sm font-mono px-2 py-1 rounded border ${theme.border} ${theme.inputBg} ${theme.text} text-center`}
                              placeholder="35%"
                              autoComplete="off"
                              spellCheck="false"
                              autoCorrect="off"
                            />
                          </label>
                          <div className="space-y-3">
                            <input
                              type="range"
                              min="5"
                              max="50"
                              step="1"
                              value={parseInt(localSettings.handPositionBottom?.replace('%', '')) || 35}
                              onChange={(e) => handleSettingChange('handPositionBottom', `${e.target.value}%`)}
                              className={`w-full h-2 rounded-lg appearance-none cursor-pointer hand-slider settings-slider ${theme.mode === 'dark' ? 'hand-slider-dark' : 'hand-slider-light'}`}
                              style={{ pointerEvents: 'auto' }}
                            />
                            <div className={`flex justify-between text-xs ${theme.textSecondary}`}>
                              <span>5% (Higher)</span>
                              <span>25% (Middle)</span>
                              <span>50% (Lower)</span>
                            </div>
                          </div>
                        </div>

                        {/* Left Position Control */}
                        <div>
                          <label className={`block text-sm font-medium ${theme.text} mb-3 flex items-center justify-between`}>
                            <span>Horizontal Position (from left)</span>
                            <input
                              type="text"
                              value={localSettings.handPositionLeft || '56%'}
                              onChange={(e) => handleManualPositionInput('handPositionLeft', e.target.value)}
                              className={`w-20 text-sm font-mono px-2 py-1 rounded border ${theme.border} ${theme.inputBg} ${theme.text} text-center`}
                              placeholder="56%"
                              autoComplete="off"
                              spellCheck="false"
                              autoCorrect="off"
                            />
                          </label>
                          <div className="space-y-3">
                            <input
                              type="range"
                              min="45"
                              max="65"
                              step="1"
                              value={parseInt(localSettings.handPositionLeft?.replace('%', '')) || 56}
                              onChange={(e) => handleSettingChange('handPositionLeft', `${e.target.value}%`)}
                              className={`w-full h-2 rounded-lg appearance-none cursor-pointer hand-slider settings-slider ${theme.mode === 'dark' ? 'hand-slider-dark' : 'hand-slider-light'}`}
                              style={{ pointerEvents: 'auto' }}
                            />
                            <div className={`flex justify-between text-xs ${theme.textSecondary}`}>
                              <span>45% (Left)</span>
                              <span>56% (Center)</span>
                              <span>65% (Right)</span>
                            </div>
                          </div>
                        </div>

                        {/* Reset and Preset Buttons */}
                        <div className={`flex flex-wrap gap-3 pt-4 border-t ${theme.border}`}>
                          <button
                            onClick={() => {
                              handleSettingChange('handPositionHeight', '100%');
                              handleSettingChange('handPositionBottom', '35%');
                              handleSettingChange('handPositionLeft', '56%');
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${theme.border} ${theme.text} ${theme.inputBg} hover:${theme.secondary} transition-colors text-sm`}
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reset to Default
                          </button>
                          
                          <button
                            onClick={() => {
                              handleSettingChange('handPositionHeight', '85%');
                              handleSettingChange('handPositionBottom', '40%');
                              handleSettingChange('handPositionLeft', '58%');
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${theme.border} ${theme.text} ${theme.inputBg} hover:${theme.secondary} transition-colors text-sm`}
                          >
                            <Smartphone className="w-4 h-4" />
                            720p Preset
                          </button>
                          
                          <button
                            onClick={() => {
                              handleSettingChange('handPositionHeight', '115%');
                              handleSettingChange('handPositionBottom', '30%');
                              handleSettingChange('handPositionLeft', '54%');
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${theme.border} ${theme.text} ${theme.inputBg} hover:${theme.secondary} transition-colors text-sm`}
                          >
                            <MonitorSpeaker className="w-4 h-4" />
                            1080p+ Preset
                          </button>
                        </div>

                        <div className={`text-xs ${theme.textSecondary} p-4 rounded-lg ${theme.mode === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5">i</div>
                            <div>
                              <strong className={theme.text}>Tips:</strong>
                              <ul className="mt-1 space-y-1">
                                <li>• Height: Adjust hand size relative to keyboard</li>
                                <li>• Bottom: Higher values move hands lower on screen</li>
                                <li>• Left: Fine-tune horizontal alignment</li>
                                <li>• Use presets for common screen resolutions</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sound Settings */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-3 flex items-center gap-2`}>
                    <Volume2 className="w-4 h-4" />
                    Sound Effects
                  </label>
                  <div className={`p-6 rounded-xl border ${theme.border} ${theme.cardBg}`}>
                    <div className="space-y-6">
                      {/* Sound Toggle */}
                      <div
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          soundEnabled
                            ? `${theme.primary} border-transparent text-white shadow-lg`
                            : `${theme.inputBg} ${theme.border} ${theme.text} hover:border-blue-300`
                        }`}
                        onClick={() => {
                          const newState = soundEffects.toggle();
                          setSoundEnabled(newState);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold mb-1">Enable Sound Effects</div>
                            <div className="text-xs opacity-75">Play sounds on keypress, errors, and achievements</div>
                          </div>
                          <div className={`relative w-12 h-6 rounded-full transition-all ${
                            soundEnabled 
                              ? 'bg-white/20' 
                              : theme.mode === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                          }`}>
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all transform ${
                              soundEnabled 
                                ? 'translate-x-6 bg-white' 
                                : 'translate-x-0.5 bg-white'
                            }`}></div>
                          </div>
                        </div>
                      </div>

                      {/* Volume Control */}
                      {soundEnabled && (
                        <div>
                          <label className={`block text-sm font-medium ${theme.text} mb-3 flex items-center justify-between`}>
                            <span>Volume</span>
                            <span className={`text-sm font-mono ${theme.textSecondary}`}>{Math.round(soundVolume * 100)}%</span>
                          </label>
                          <div className="space-y-3">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={soundVolume * 100}
                              onChange={(e) => {
                                const newVolume = e.target.value / 100;
                                soundEffects.setVolume(newVolume);
                                setSoundVolume(newVolume);
                              }}
                              className={`w-full h-2 rounded-lg appearance-none cursor-pointer hand-slider settings-slider ${theme.mode === 'dark' ? 'hand-slider-dark' : 'hand-slider-light'}`}
                            />
                            <div className={`flex justify-between text-xs ${theme.textSecondary}`}>
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>
                          
                          {/* Sound Test Buttons */}
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => soundEffects.playKeypress()}
                              className={`flex-1 py-2 rounded-lg border ${theme.border} ${theme.text} ${theme.inputBg} hover:${theme.secondary} transition-colors text-sm`}
                            >
                              Test Keypress
                            </button>
                            <button
                              onClick={() => soundEffects.playError()}
                              className={`flex-1 py-2 rounded-lg border ${theme.border} ${theme.text} ${theme.inputBg} hover:${theme.secondary} transition-colors text-sm`}
                            >
                              Test Error
                            </button>
                            <button
                              onClick={() => soundEffects.playSuccess()}
                              className={`flex-1 py-2 rounded-lg border ${theme.border} ${theme.text} ${theme.inputBg} hover:${theme.secondary} transition-colors text-sm`}
                            >
                              Test Success
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSave}
                className={`flex items-center gap-3 px-8 py-4 rounded-xl transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  saved 
                    ? 'bg-green-600 text-white' 
                    : `${theme.primary} text-white ${theme.primaryHover}`
                }`}
              >
                <Save className="w-5 h-5" />
                {saved ? 'Settings Saved!' : 'Save All Settings'}
              </button>
            </div>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* User Stats */}
            <div className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.border} p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 ${theme.primary} rounded-lg`}>
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h2 className={`text-xl font-semibold ${theme.text}`}>Your Stats</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className={`${theme.textSecondary} text-sm`}>Tests Completed</span>
                  <span className={`font-bold ${theme.text} text-lg`}>{userProgress.stats.totalTests}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className={`${theme.textSecondary} text-sm`}>Best WPM</span>
                  <span className="font-bold text-blue-600 text-lg">{userProgress.stats.bestWPM}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className={`${theme.textSecondary} text-sm`}>Best Accuracy</span>
                  <span className="font-bold text-green-600 text-lg">{userProgress.stats.bestAccuracy}%</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className={`${theme.textSecondary} text-sm`}>Lessons Completed</span>
                  <span className="font-bold text-purple-600 text-lg">{userProgress.completedLessons.length}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className={`${theme.textSecondary} text-sm`}>Total Time</span>
                  <span className="font-bold text-orange-600 text-lg">
                    {Math.round(userProgress.stats.totalTime / 60)} min
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.border} p-6`}>
              <h2 className={`text-xl font-semibold ${theme.text} mb-6`}>Recent Activity</h2>
              
              <div className="space-y-3">
                {userProgress.testResults.slice(-5).reverse().map((result, index) => (
                  <div key={index} className={`py-3 border-b ${theme.border} last:border-b-0`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${theme.text} truncate`}>
                          {result.testTitle || result.content}
                        </div>
                        <div className={`text-xs ${theme.textSecondary} mt-1`}>
                          {new Date(result.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm font-bold text-blue-600">{result.wpm} WPM</div>
                        <div className={`text-xs ${theme.textSecondary}`}>{result.accuracy}% acc</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {userProgress.testResults.length === 0 && (
                  <div className={`text-center ${theme.textSecondary} py-8`}>
                    <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-xs mt-1">Complete some tests to see your progress here</p>
                  </div>
                )}
              </div>
              
              {/* View Analytics Button */}
              <button
                onClick={() => setShowAnalytics(true)}
                className={`w-full mt-6 flex items-center justify-center gap-2 ${theme.primary} text-white px-4 py-3 rounded-xl ${theme.primaryHover} transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">View Analytics</span>
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
            
            {/* Achievements Card */}
            <div className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.border} p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 ${theme.mode === 'dark' ? 'bg-yellow-900/40' : 'bg-yellow-100'} rounded-lg`}>
                  <Trophy className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                </div>
                <h2 className={`text-xl font-semibold ${theme.text}`}>Achievements</h2>
              </div>
              
              <div className="space-y-4">
                {(() => {
                  const userData = achievementManager.getUserAchievements(currentUser?.id);
                  const allAchievements = achievementManager.getAllAchievements(currentUser?.id);
                  const unlockedCount = allAchievements.filter(a => a.unlocked).length;
                  const xpProgress = achievementManager.getXPProgress(userData.totalXP);
                  
                  return (
                    <>
                      <div className="flex justify-between items-center py-2">
                        <span className={`${theme.textSecondary} text-sm`}>Level</span>
                        <span className={`font-bold ${theme.mode === 'dark' ? 'text-purple-400' : 'text-purple-600'} text-lg`}>
                          {userData.level}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <span className={`${theme.textSecondary} text-sm`}>Total XP</span>
                        <span className={`font-bold ${theme.mode === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} text-lg`}>
                          {userData.totalXP.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <span className={`${theme.textSecondary} text-sm`}>Achievements</span>
                        <span className={`font-bold ${theme.mode === 'dark' ? 'text-green-400' : 'text-green-600'} text-lg`}>
                          {unlockedCount}/{allAchievements.length}
                        </span>
                      </div>
                      
                      {/* XP Progress Bar */}
                      <div className={`pt-2 border-t ${theme.border}`}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={theme.textSecondary}>Level Progress</span>
                          <span className={theme.textSecondary}>{Math.round(xpProgress.percentage)}%</span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${theme.mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div 
                            className="h-full rounded-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${xpProgress.percentage}%` }}
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* View Achievements Button */}
              <button
                onClick={() => setShowAchievements(true)}
                className={`w-full mt-6 flex items-center justify-center gap-2 bg-linear-to-r from-amber-400 via-yellow-500 to-amber-400 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-300 text-amber-900 font-semibold px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-amber-400/40 hover:shadow-amber-400/60 border border-amber-300/50`}
              >
                <Trophy className="w-5 h-5 text-amber-800" />
                <span className="font-bold">View All Achievements</span>
                <Star className="w-4 h-4 text-amber-800" />
              </button>
            </div>
          </div>

          {/* Daily Streak Card */}
          <div className={`${theme.cardBg} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 ${theme.mode === 'dark' ? 'bg-orange-900/40' : 'bg-orange-100'} rounded-xl`}>
                <Flame className={`w-6 h-6 ${theme.mode === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.text}`}>Daily Streak</h3>
                <p className={`text-sm ${theme.textSecondary}`}>Keep practicing every day!</p>
              </div>
            </div>
            
            <div className="text-center py-4">
              <div className={`text-6xl font-bold ${
                streakData.currentStreak > 0 
                  ? theme.mode === 'dark' ? 'text-orange-400' : 'text-orange-500'
                  : theme.textSecondary
              } mb-2`}>
                {streakData.currentStreak}
              </div>
              <div className={`${theme.textSecondary} text-sm font-medium`}>
                {streakData.currentStreak === 1 ? 'Day' : 'Days'} Current Streak
              </div>
              {streakData.currentStreak > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className={`text-sm ${theme.mode === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                    On Fire!
                  </span>
                </div>
              )}
            </div>
            
            <div className={`border-t ${theme.border} pt-4 mt-4`}>
              <div className="flex justify-between items-center py-2">
                <span className={`${theme.textSecondary} text-sm`}>Longest Streak</span>
                <span className={`font-bold ${theme.text}`}>{streakData.longestStreak} days</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className={`${theme.textSecondary} text-sm`}>Practice Days</span>
                <span className={`font-bold ${theme.text}`}>{streakData.practiceHistory?.length || 0}</span>
              </div>
              {streakData.lastPracticeDate && (
                <div className="flex justify-between items-center py-2">
                  <span className={`${theme.textSecondary} text-sm`}>Last Practice</span>
                  <span className={`font-medium ${theme.text}`}>
                    {streakData.lastPracticeDate === new Date().toISOString().split('T')[0] 
                      ? 'Today' 
                      : new Date(streakData.lastPracticeDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Application Info Card */}
          <div className={`${theme.cardBg} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 ${theme.mode === 'dark' ? 'bg-blue-900/40' : 'bg-blue-100'} rounded-xl`}>
                <Monitor className={`w-6 h-6 ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.text}`}>Application Info</h3>
                <p className={`text-sm ${theme.textSecondary}`}>About Swift Typing</p>
              </div>
            </div>
            
            <div className={`space-y-4`}>
              <div className="flex justify-between items-center py-2">
                <span className={`${theme.textSecondary} text-sm`}>Version</span>
                <span className={`font-bold ${theme.text}`}>2.5.1</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className={`${theme.textSecondary} text-sm`}>Developer</span>
                <span className={`font-medium ${theme.text}`}>SW-YONTO</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className={`${theme.textSecondary} text-sm`}>Author</span>
                <span className={`font-medium ${theme.text}`}>Suraj Maurya</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className={`${theme.textSecondary} text-sm`}>Platform</span>
                <span className={`font-medium ${theme.text}`}>Desktop (Electron)</span>
              </div>
              <div className={`border-t ${theme.border} pt-4 mt-4`}>
                <p className={`${theme.textSecondary} text-xs text-center`}>
                  A comprehensive offline typing tutor desktop application
                </p>
              </div>
            </div>
          </div>

          {/* Data Backup Card */}
          <div className={`${theme.cardBg} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 ${theme.mode === 'dark' ? 'bg-cyan-900/40' : 'bg-cyan-100'} rounded-xl`}>
                <Download className={`w-6 h-6 ${theme.mode === 'dark' ? 'text-cyan-400' : 'text-cyan-500'}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.text}`}>Data Backup</h3>
                <p className={`text-sm ${theme.textSecondary}`}>Export or import your progress</p>
              </div>
            </div>
            
            {/* Import Status Message */}
            {importStatus && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                importStatus.success 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {importStatus.success ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-sm font-medium">{importStatus.message}</span>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className={`w-full flex items-center justify-center gap-2 ${theme.primary} text-white px-4 py-3 rounded-xl ${theme.primaryHover} transition-all duration-200 hover:scale-[1.02]`}
              >
                <Download className="w-5 h-5" />
                <span className="font-medium">Export Progress</span>
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full flex items-center justify-center gap-2 ${theme.secondary} ${theme.text} px-4 py-3 rounded-xl ${theme.secondaryHover} transition-all duration-200 hover:scale-[1.02] border ${theme.border}`}
              >
                <Upload className="w-5 h-5" />
                <span className="font-medium">Import Backup</span>
              </button>
            </div>
            
            <p className={`${theme.textSecondary} text-xs mt-4 text-center`}>
              Backups include progress, achievements, and streak data
            </p>
          </div>
        </div>
      </div>
      
      {/* Analytics Calendar Modal */}
      {showAnalytics && (
        <AnalyticsCalendar 
          testResults={userProgress.testResults} 
          onClose={() => setShowAnalytics(false)} 
        />
      )}
      
      {/* Achievements Panel Modal */}
      <AchievementsPanel
        userId={currentUser?.id}
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />
      
      <Footer />
    </div>
  );
};

export default Settings;
