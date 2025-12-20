import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import resolveAssetPath from '../utils/pathResolver';

/**
 * KeyboardWithHands Component
 * 
 * Displays SVG keyboard with both hands positioned over it.
 * Uses the sample SVG keyboard and both hands from assets folder.
 * Highlights active keys and shows hand positions dynamically.
 */
const KeyboardWithHands = ({ currentKey }) => {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const [keyboardContent, setKeyboardContent] = useState('');
  const [handsContent, setHandsContent] = useState('');
  const [loading, setLoading] = useState(true);

  // Load both SVG files on mount
  useEffect(() => {
    const loadSVGs = async () => {
      try {
        const [keyboardRes, handsRes] = await Promise.all([
          fetch(resolveAssetPath('/hands/keyboard.html')),
          fetch(resolveAssetPath('/hands/bothhand.html'))
        ]);

        if (!keyboardRes.ok || !handsRes.ok) {
          throw new Error('Failed to load SVG files');
        }

        const keyboard = await keyboardRes.text();
        const hands = await handsRes.text();

        setKeyboardContent(keyboard);
        setHandsContent(hands);
      } catch (error) {
        console.error('Error loading SVG files:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSVGs();
  }, []);

  // Map keyboard keys to SVG g tag IDs
  const getGTagId = (key) => {
    if (!key) return null;

    const lowerKey = key.toLowerCase();

    // Direct letter matches (a-z)
    if (/^[a-z]$/.test(lowerKey)) {
      return lowerKey;
    }

    // Number keys need "key-" prefix
    if (/^[0-9]$/.test(key)) {
      return `key-${key}`;
    }

    // Special character mappings
    const specialChars = {
      ';': 'semicolon',
      ':': 'semicolon',
      ',': 'comma',
      '<': 'comma',
      '.': 'dot',
      '>': 'dot',
      '/': 'slash',
      '?': 'slash',
      "'": 'quote',
      '"': 'quote',
      '[': 'open-bracket',
      '{': 'open-bracket',
      ']': 'close-bracket',
      '}': 'close-bracket',
      '\\': 'backslash',
      '|': 'backslash',
      '`': 'tilda',
      '~': 'tilda',
      '=': 'equal',
      '+': 'equal',
      '-': 'minus',
      '_': 'minus',
    };

    if (specialChars[key]) {
      return specialChars[key];
    }

    // Special keys
    const specialKeys = {
      'enter': 'enter',
      ' ': 'space',
      'space': 'space',
      'tab': 'tab',
      'shiftleft': 'shift-left',
      'shiftright': 'shift-right',
      'shift': 'shift-left',
      'backspace': 'backspace',
      'capslock': 'capslock',
      'caps': 'capslock',
    };

    if (specialKeys[lowerKey]) {
      return specialKeys[lowerKey];
    }

    return null;
  };

  // Update keyboard and hands based on currentKey
  useEffect(() => {
    if (!containerRef.current || !keyboardContent || !handsContent) return;

    const activeKeyId = getGTagId(currentKey);

    // Update keyboard active key
    const keyboardSvg = containerRef.current.querySelector('.keyboard-svg');
    if (keyboardSvg) {
      const allKeyPaths = keyboardSvg.querySelectorAll('path[id]');
      allKeyPaths.forEach((path) => {
        const pathId = path.getAttribute('id');
        if (pathId === activeKeyId) {
          path.classList.add('active');
        } else {
          path.classList.remove('active');
        }
      });
    }

    // Update hands visibility - show the g tag for active key (contains both hands)
    const handsSvg = containerRef.current.querySelector('.hands-svg');
    if (handsSvg) {
      const allHandGTags = handsSvg.querySelectorAll('g[id]');
      
      console.log('Total hand g tags found:', allHandGTags.length);
      console.log('Current key:', currentKey, 'Active key ID:', activeKeyId);
      
      // If there's an active key, show only that key's hand position (which includes both hands)
      if (activeKeyId && activeKeyId !== null) {
        allHandGTags.forEach((gTag) => {
          const gId = gTag.getAttribute('id');
          if (gId === activeKeyId) {
            gTag.style.display = 'block';
            gTag.style.visibility = 'visible';
            console.log('Showing hands for key:', gId);
          } else {
            gTag.style.display = 'none';
          }
        });
      } else {
        // No active key - show home row position (f and j keys) or first available
        console.log('No active key - showing home position');
        let homeRowShown = false;
        allHandGTags.forEach((gTag) => {
          const gId = gTag.getAttribute('id');
          // Show 'f' position which typically shows both hands in home position
          if (gId === 'f' || gId === 'j') {
            gTag.style.display = 'block';
            gTag.style.visibility = 'visible';
            homeRowShown = true;
            console.log('Showing home row position:', gId);
          } else {
            gTag.style.display = 'none';
          }
        });
        
        // If no home row positions found, show the first g tag as fallback
        if (!homeRowShown && allHandGTags.length > 0) {
          console.log('No home row found, showing first g tag:', allHandGTags[0].getAttribute('id'));
          allHandGTags[0].style.display = 'block';
          allHandGTags[0].style.visibility = 'visible';
        }
      }
    }
  }, [currentKey, keyboardContent, handsContent]);

  // Apply theme colors to SVGs - Reapply on theme change or content load
  useEffect(() => {
    if (!containerRef.current || !keyboardContent || !handsContent) return;

    const keyboardSvg = containerRef.current.querySelector('.keyboard-svg svg');
    const handsSvg = containerRef.current.querySelector('.hands-svg svg');
    
    // Determine theme colors
    const isDark = theme.mode === 'dark' || theme.cardBg?.includes('gray-800') || theme.bg?.includes('gray-900');
    const keyFill = isDark ? '#1f2937' : '#ffffff';
    const borderColor = isDark ? '#6b7280' : '#374151';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    
    // Get accent color from theme
    let accentColor = '#3b82f6'; // default blue
    if (theme.primary?.includes('green')) accentColor = '#16a34a';
    else if (theme.primary?.includes('purple')) accentColor = '#9333ea';
    else if (theme.primary?.includes('blue')) accentColor = '#3b82f6';
    else if (theme.primary?.includes('orange')) accentColor = '#ea580c';
    else if (theme.primary?.includes('red')) accentColor = '#dc2626';
    
    if (keyboardSvg) {
      // Remove old style if exists
      const oldStyle = keyboardSvg.querySelector('style.theme-style');
      if (oldStyle) oldStyle.remove();
      
      // Update keyboard CSS for theme colors
      const style = document.createElement('style');
      style.className = 'theme-style';
      style.textContent = `
        .keyboard-svg .edc-st0 {
          fill: ${keyFill};
          stroke: ${borderColor};
          stroke-width: 1;
        }
        .keyboard-svg path.active {
          fill: ${accentColor} !important;
          stroke: ${borderColor} !important;
          stroke-width: 2;
        }
        .keyboard-svg path.incorrect {
          fill: #ef4444 !important;
          stroke: ${borderColor} !important;
          stroke-width: 2;
        }
        .keyboard-svg .edc-st2 {
          fill: ${textColor};
        }
      `;
      keyboardSvg.appendChild(style);
    }

    if (handsSvg) {
      // Remove old style if exists
      const oldHandStyle = handsSvg.querySelector('style.theme-style');
      if (oldHandStyle) oldHandStyle.remove();
      
      // Update hand SVG colors to match theme
      const handStyle = document.createElement('style');
      handStyle.className = 'theme-style';
      handStyle.textContent = `
        .hands-svg g[id] {
          display: block !important;
        }
        .hands-svg .st1 {
          fill: ${isDark ? '#9ca3af' : '#D1D5DB'};
          opacity: 0.5;
        }
        .hands-svg .st5 {
          stroke: ${accentColor} !important;
          stroke-width: 3;
        }
        .hands-svg .st2 {
          stroke: ${isDark ? '#6b7280' : '#9ca3af'};
          stroke-width: 2;
        }
      `;
      handsSvg.appendChild(handStyle);
    }
  }, [keyboardContent, handsContent, theme, currentKey]); // Added currentKey to dependencies

  if (loading) {
    return (
      <div className={`${theme.cardBg} p-6 rounded-2xl shadow-lg border ${theme.border} flex items-center justify-center`}>
        <div className={`${theme.textSecondary}`}>Loading keyboard...</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${theme.keyboardBg || theme.cardBg} p-6 rounded-2xl shadow-lg border ${theme.border}`}
    >
      <div className="relative w-full flex justify-center">
        {/* SVG Keyboard */}
        <div 
          className="keyboard-svg"
          dangerouslySetInnerHTML={{ __html: keyboardContent }}
          style={{ width: '685px', position: 'relative', zIndex: 1 }}
        />
        
        {/* Both Hands SVG - Positioned over keyboard middle row */}
        <div 
          className="hands-svg absolute"
          dangerouslySetInnerHTML={{ __html: handsContent }}
          style={{ 
            position: 'absolute',
            pointerEvents: 'none',
            height: '363px',
            top: '-10px',
            left: '0px',
            transform: 'translateX(55px) scale(1.55)',
            zIndex: 10,
            opacity: 0.9
          }}
        />
      </div>

      {/* Legend */}
      <div className={`mt-6 text-center text-sm ${theme.textSecondary}`}>
        <div className="flex justify-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-md bg-blue-500 shadow-sm"></div>
            <span>Current Key</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-md bg-gray-600 shadow-sm"></div>
            <span>Keyboard</span>
          </div>
        </div>
      </div>
    </div>
  );
};

KeyboardWithHands.propTypes = {
  currentKey: PropTypes.string
};

KeyboardWithHands.defaultProps = {
  currentKey: null
};

export default React.memo(KeyboardWithHands);
