import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, Trophy, Zap, Settings, User, LogOut, ChevronDown, Palette, Gamepad2 } from 'lucide-react';
import { themes } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';

const Navigation = ({ currentUser, onLogout, onThemeChange, currentTheme }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const { theme, themeKey, changeTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { id: 'lessons', label: 'Typing Lessons', icon: Book, path: '/lessons' },
    { id: 'courses', label: 'Typing Courses', icon: Trophy, path: '/courses' },
    { id: 'games', label: 'Typing Games', icon: Gamepad2, path: '/games' },
    { id: 'tests', label: 'Typing Tests', icon: Zap, path: '/tests' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  return (
    <nav className={`${theme.navbar} shadow-lg ${theme.navBorder} border-b sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Zap className={`w-6 h-6 ${theme.accent} drop-shadow-sm`} />
            <span className={`text-lg font-bold ${theme.navText}`}>Swift Typing</span>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? `${theme.primary} text-white`
                      : `${theme.navText} hover:${theme.secondary}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Theme and User */}
          <div className="flex items-center space-x-3">
            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className={`flex items-center space-x-1 ${theme.navText} hover:${theme.accent} transition-colors text-sm px-2 py-1 rounded`}
              >
                <Palette className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showThemeDropdown && (
                <div className={`absolute right-0 mt-2 w-48 ${theme.surface} rounded-lg shadow-lg ${theme.border} border z-50`}>
                  <div className="py-2">
                    <div className={`px-3 py-2 text-xs font-semibold ${theme.textSecondary} uppercase tracking-wide`}>
                      Light Themes
                    </div>
                    {Object.entries(themes).filter(([_, t]) => t.mode === 'light').map(([key, themeData]) => (
                      <button
                        key={key}
                        onClick={() => {
                          changeTheme(key);
                          onThemeChange && onThemeChange(key);
                          setShowThemeDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${theme.text} hover:${theme.secondary} transition-colors flex items-center justify-between`}
                      >
                        <span>{themeData.name}</span>
                        {themeKey === key && <div className={`w-3 h-3 rounded-full ${themeData.primary.replace('bg-', 'bg-')}`}></div>}
                      </button>
                    ))}
                    
                    <div className={`px-3 py-2 text-xs font-semibold ${theme.textSecondary} uppercase tracking-wide mt-2 border-t ${theme.border}`}>
                      Dark Themes
                    </div>
                    {Object.entries(themes).filter(([_, t]) => t.mode === 'dark').map(([key, themeData]) => (
                      <button
                        key={key}
                        onClick={() => {
                          changeTheme(key);
                          onThemeChange && onThemeChange(key);
                          setShowThemeDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${theme.text} hover:${theme.secondary} transition-colors flex items-center justify-between`}
                      >
                        <span>{themeData.name}</span>
                        {themeKey === key && <div className={`w-3 h-3 rounded-full ${themeData.primary.replace('bg-', 'bg-')}`}></div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex items-center space-x-2 ${theme.navText} text-sm px-2 py-1 rounded hover:${theme.secondary} transition-colors`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">{currentUser?.username}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showUserDropdown && (
                <div className={`absolute right-0 mt-2 w-48 ${theme.surface} rounded-lg shadow-lg ${theme.border} border z-50`}>
                  <div className="py-2">
                    <div className={`px-3 py-2 ${theme.text} border-b ${theme.border}`}>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{currentUser?.username}</span>
                      </div>
                      <div className={`text-xs ${theme.textSecondary} mt-1`}>
                        Best WPM: {currentUser?.averageWPM || 0} • Tests: {currentUser?.totalTests || 0}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${theme.text} hover:${theme.secondary} transition-colors flex items-center space-x-2`}
                    >
                      <User className="w-4 h-4" />
                      <span>Switch User</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className={`w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${
                    isActive
                      ? `${theme.primary} text-white`
                      : `${theme.navText} hover:${theme.secondary}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{item.label.replace('Typing ', '')}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Click outside to close dropdowns */}
      {(showUserDropdown || showThemeDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserDropdown(false);
            setShowThemeDropdown(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navigation;
