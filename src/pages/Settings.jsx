import React, { useState, useEffect } from 'react';
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
  Smartphone
} from 'lucide-react';
import { progressManager, themes, userManager } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';
import Footer from '../components/Footer';

const Settings = ({ currentUser, settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState({
    ...settings,
    fontSize: settings.fontSize || 'medium',
    fontFamily: settings.fontFamily || 'inter',
    practiceMode: settings.practiceMode || 'time',
    timeLimit: settings.timeLimit || 60,
    wordLimit: settings.wordLimit || 50,
    userName: currentUser?.username || ''
  });
  const [saved, setSaved] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser?.username || '');
  const { 
    theme, 
    themeKey, 
    fontSize, 
    fontFamily,
    changeTheme, 
    changeFontSize, 
    changeFontFamily 
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
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
