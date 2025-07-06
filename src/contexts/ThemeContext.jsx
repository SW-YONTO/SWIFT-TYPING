import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes } from '../utils/storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children, theme = 'blue', settings = {} }) => {
  // Initialize from localStorage or props
  const [currentThemeKey, setCurrentThemeKey] = useState(() => {
    const savedTheme = localStorage.getItem('typing_app_theme');
    return savedTheme || theme;
  });
  const [fontSize, setFontSize] = useState(() => {
    const savedFontSize = localStorage.getItem('typing_app_fontSize');
    return savedFontSize || settings.fontSize || 'medium';
  });
  const [fontFamily, setFontFamily] = useState(() => {
    const savedFontFamily = localStorage.getItem('typing_app_fontFamily');
    return savedFontFamily || settings.fontFamily || 'inter';
  });

  // Determine if current theme is dark
  const isDarkMode = themes[currentThemeKey]?.mode === 'dark';
  const currentTheme = themes[currentThemeKey] || themes.blue;

  const changeTheme = (newTheme) => {
    setCurrentThemeKey(newTheme);
    localStorage.setItem('typing_app_theme', newTheme);
  };

  const toggleDarkMode = () => {
    let newTheme;
    if (isDarkMode) {
      // Switch to light equivalent
      const lightThemeMap = {
        'darkBlue': 'blue',
        'darkGreen': 'green',
        'darkPurple': 'orange'
      };
      newTheme = lightThemeMap[currentThemeKey] || 'blue';
    } else {
      // Switch to dark equivalent
      const darkThemeMap = {
        'blue': 'darkBlue',
        'green': 'darkGreen',
        'orange': 'darkPurple'
      };
      newTheme = darkThemeMap[currentThemeKey] || 'darkBlue';
    }
    setCurrentThemeKey(newTheme);
    localStorage.setItem('typing_app_theme', newTheme);
  };

  const changeFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('typing_app_fontSize', size);
  };

  const changeFontFamily = (family) => {
    setFontFamily(family);
    localStorage.setItem('typing_app_fontFamily', family);
  };

  useEffect(() => {
    // Apply CSS custom properties to the document root
    const root = document.documentElement;
    Object.entries(currentTheme.css).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply body classes for theme (but NOT font settings)
    // Use !important inline styles for Electron compatibility
    const body = document.body;
    body.className = `${currentTheme.background} ${currentTheme.text} transition-colors duration-300`;
    
    // Force inline styles for Electron compatibility
    if (currentTheme.mode === 'dark') {
      body.style.backgroundColor = '#111827 !important';
      body.style.color = '#f9fafb !important';
    } else {
      const bgColor = currentTheme.css['--theme-background'];
      const textColor = currentTheme.css['--theme-text'];
      body.style.backgroundColor = `${bgColor} !important`;
      body.style.color = `${textColor} !important`;
    }
    
    // Add a data attribute for easy theme detection
    body.setAttribute('data-theme', currentThemeKey);
    body.setAttribute('data-theme-mode', currentTheme.mode);
    
    return () => {
      // Cleanup
      Object.keys(currentTheme.css).forEach(property => {
        root.style.removeProperty(property);
      });
    };
  }, [currentTheme, currentThemeKey]);

  return (
    <ThemeContext.Provider value={{ 
      theme: { 
        ...currentTheme, 
        fontSize,
        fontFamily 
      }, 
      themeKey: currentThemeKey,
      isDarkMode,
      fontSize,
      fontFamily,
      changeTheme,
      toggleDarkMode,
      changeFontSize,
      changeFontFamily
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
