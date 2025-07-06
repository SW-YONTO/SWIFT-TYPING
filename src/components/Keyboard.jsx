import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Keyboard = ({ currentKey = '' }) => {
  const { theme } = useTheme();

  const keyboardLayout = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace'],
    ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift'],
    ['ctrl', 'alt', 'space', 'alt', 'ctrl']
  ];

  const getKeySize = (key) => {
    switch (key) {
      case 'backspace':
        return 'w-16';
      case 'tab':
        return 'w-12';
      case 'caps':
        return 'w-16';
      case 'enter':
        return 'w-20';
      case 'shift':
        return 'w-20';
      case 'space':
        return 'w-80';
      case 'ctrl':
      case 'alt':
        return 'w-12';
      default:
        return 'w-10';
    }
  };

  const getKeyLabel = (key) => {
    switch (key) {
      case 'backspace':
        return '⌫';
      case 'tab':
        return '⇥';
      case 'caps':
        return '⇪';
      case 'enter':
        return '↵';
      case 'shift':
        return '⇧';
      case 'space':
        return '';
      case 'ctrl':
        return 'Ctrl';
      case 'alt':
        return 'Alt';
      default:
        return key.toUpperCase();
    }
  };

  const isCurrentKey = (key) => {
    if (!currentKey) return false;
    
    // Handle special cases
    if (currentKey === ' ' && key === 'space') return true;
    if (currentKey === '\t' && key === 'tab') return true;
    if (currentKey === '\n' && key === 'enter') return true;
    
    // Handle regular keys
    return key.toLowerCase() === currentKey.toLowerCase();
  };

  const isHomeRowKey = (key) => {
    return ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'].includes(key.toLowerCase());
  };

  const getKeyStyle = (key) => {
    const baseClasses = `
      h-10 rounded-lg border-2 font-semibold text-sm flex items-center justify-center
      transition-all duration-150 transform hover:scale-105 hover:shadow-lg
      active:scale-95 cursor-pointer select-none shadow-sm
    `;

    if (isCurrentKey(key)) {
      return `${baseClasses} ${theme.primary} text-white border-transparent scale-105 shadow-xl ring-2 ring-offset-2 ring-offset-transparent ${theme.mode === 'dark' ? 'ring-blue-400' : 'ring-blue-500'}`;
    }

    // Home row highlighting
    if (isHomeRowKey(key)) {
      return `${baseClasses} ${theme.homeRowBg || theme.secondary} ${theme.homeRowText || theme.accent} border-2 ${theme.keyBorder || theme.border} shadow-md hover:shadow-lg`;
    }

    // Regular keys
    return `${baseClasses} ${theme.keyBg || theme.surface} ${theme.keyText || theme.text} border-2 ${theme.keyBorder || theme.border} hover:shadow-md`;
  };

  return (
    <div className={`${theme.keyboardBg || theme.cardBg} p-6 rounded-2xl shadow-lg border ${theme.border}`}>
      <div className="flex flex-col items-center space-y-2">
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex space-x-1">
            {row.map((key, keyIndex) => (
              <div
                key={`${rowIndex}-${keyIndex}`}
                className={`${getKeySize(key)} ${getKeyStyle(key)}`}
              >
                {getKeyLabel(key)}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className={`mt-6 text-center text-sm ${theme.textSecondary}`}>
        <div className="flex justify-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-md ${theme.primary} shadow-sm`}></div>
            <span>Current Key</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-md ${theme.homeRowBg || theme.secondary} border-2 ${theme.homeRowText || theme.accent} border-current shadow-sm`}></div>
            <span>Home Row</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Keyboard;
