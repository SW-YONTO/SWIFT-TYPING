import React, { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemedKeyboard = React.memo(({ activeKey }) => {
  const { theme } = useTheme();

  console.log('⌨️ ThemedKeyboard render:', { 
    activeKey, 
    themeMode: theme?.mode,
    themePrimary: theme?.css?.['--theme-primary']
  });

  // Safely get theme colors with fallbacks - memoized
  const themeColors = useMemo(() => ({
    primaryColor: theme?.css?.['--theme-primary'] || '#3b82f6',
    isDark: theme?.mode === 'dark'
  }), [theme?.css, theme?.mode]);

  const { primaryColor, isDark } = themeColors;

  // Determine key colors based on theme and active state
  const getKeyStyle = (keyId) => {
    const isActive = keyId === activeKey;
    
    if (isActive) {
      console.log(`🔑 Active key style for: "${keyId}"`, { fill: primaryColor });
      return {
        fill: primaryColor,
        stroke: primaryColor,
        strokeWidth: 3
      };
    }
    
    return {
      fill: isDark ? '#1a1a1a' : '#ffffff',
      stroke: isDark ? '#444444' : '#cccccc',
      strokeWidth: 1
    };
  };

  const textColor = isDark ? '#e0e0e0' : '#333333';
  const activeTextColor = '#ffffff';

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <svg viewBox="0 0 683.3 254" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
        {/* Row 1 - Numbers */}
        <rect x="15.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('`')} />
        <text x="36" y="42" fill={activeKey === '`' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">`</text>
        
        <rect x="60.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('1')} />
        <text x="81" y="42" fill={activeKey === '1' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">1</text>
        
        <rect x="105.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('2')} />
        <text x="126" y="42" fill={activeKey === '2' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">2</text>
        
        <rect x="150.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('3')} />
        <text x="171" y="42" fill={activeKey === '3' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">3</text>
        
        <rect x="195.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('4')} />
        <text x="216" y="42" fill={activeKey === '4' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">4</text>
        
        <rect x="240.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('5')} />
        <text x="261" y="42" fill={activeKey === '5' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">5</text>
        
        <rect x="285.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('6')} />
        <text x="306" y="42" fill={activeKey === '6' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">6</text>
        
        <rect x="330.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('7')} />
        <text x="351" y="42" fill={activeKey === '7' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">7</text>
        
        <rect x="375.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('8')} />
        <text x="396" y="42" fill={activeKey === '8' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">8</text>
        
        <rect x="420.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('9')} />
        <text x="441" y="42" fill={activeKey === '9' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">9</text>
        
        <rect x="465.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('0')} />
        <text x="486" y="42" fill={activeKey === '0' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">0</text>
        
        <rect x="510.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('-')} />
        <text x="531" y="42" fill={activeKey === '-' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">-</text>
        
        <rect x="555.9" y="15.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('=')} />
        <text x="576" y="42" fill={activeKey === '=' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">=</text>
        
        <rect x="600.9" y="15.3" width="67" height="38.4" rx="3" {...getKeyStyle('Backspace')} />
        <text x="634" y="42" fill={activeKey === 'Backspace' ? activeTextColor : textColor} fontSize="14" textAnchor="middle">Back</text>

        {/* Row 2 - QWERTY */}
        <rect x="15.9" y="59.3" width="54" height="38.4" rx="3" {...getKeyStyle('Tab')} />
        <text x="43" y="86" fill={activeKey === 'Tab' ? activeTextColor : textColor} fontSize="14" textAnchor="middle">Tab</text>
        
        <rect x="74.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('q')} />
        <text x="94" y="86" fill={activeKey === 'q' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">Q</text>
        
        <rect x="119.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('w')} />
        <text x="139" y="86" fill={activeKey === 'w' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">W</text>
        
        <rect x="164.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('e')} />
        <text x="184" y="86" fill={activeKey === 'e' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">E</text>
        
        <rect x="209.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('r')} />
        <text x="229" y="86" fill={activeKey === 'r' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">R</text>
        
        <rect x="254.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('t')} />
        <text x="274" y="86" fill={activeKey === 't' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">T</text>
        
        <rect x="299.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('y')} />
        <text x="319" y="86" fill={activeKey === 'y' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">Y</text>
        
        <rect x="344.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('u')} />
        <text x="364" y="86" fill={activeKey === 'u' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">U</text>
        
        <rect x="389.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('i')} />
        <text x="409" y="86" fill={activeKey === 'i' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">I</text>
        
        <rect x="434.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('o')} />
        <text x="454" y="86" fill={activeKey === 'o' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">O</text>
        
        <rect x="479.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('p')} />
        <text x="499" y="86" fill={activeKey === 'p' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">P</text>
        
        <rect x="524.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle('[')} />
        <text x="544" y="86" fill={activeKey === '[' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">[</text>
        
        <rect x="569.2" y="59.3" width="39.5" height="38.4" rx="3" {...getKeyStyle(']')} />
        <text x="589" y="86" fill={activeKey === ']' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">]</text>
        
        <rect x="614.2" y="59.3" width="53.6" height="38.4" rx="3" {...getKeyStyle('\\')} />
        <text x="641" y="86" fill={activeKey === '\\' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">\</text>

        {/* Row 3 - ASDF (Home Row) */}
        <rect x="15.9" y="103.1" width="67" height="38.4" rx="3" {...getKeyStyle('CapsLock')} />
        <text x="49" y="130" fill={activeKey === 'CapsLock' ? activeTextColor : textColor} fontSize="12" textAnchor="middle">Caps</text>
        
        <rect x="88.4" y="103.1" width="39.5" height="38.4" rx="3" {...getKeyStyle('a')} />
        <text x="108" y="130" fill={activeKey === 'a' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">A</text>
        
        <rect x="133.4" y="103.1" width="39.5" height="38.4" rx="3" {...getKeyStyle('s')} />
        <text x="153" y="130" fill={activeKey === 's' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">S</text>
        
        <rect x="178.4" y="103.1" width="39.5" height="38.4" rx="3" {...getKeyStyle('d')} />
        <text x="198" y="130" fill={activeKey === 'd' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">D</text>
        
        <rect x="223.4" y="103.1" width="39.5" height="38.4" rx="3" {...getKeyStyle('f')} />
        <text x="243" y="130" fill={activeKey === 'f' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">F</text>
        
        <rect x="268.4" y="103.1" width="39.5" height="38.4" rx="3" {...getKeyStyle('g')} />
        <text x="288" y="130" fill={activeKey === 'g' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">G</text>
        
        <rect x="313.4" y="103.1" width="39.5" height="38.4" rx="3" {...getKeyStyle('h')} />
        <text x="333" y="130" fill={activeKey === 'h' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">H</text>
        
        <rect x="358.4" y="103.1" width="39.5" height="38.4" rx="3" {...getKeyStyle('j')} />
        <text x="378" y="130" fill={activeKey === 'j' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">J</text>
        
        <rect x="403.4" y="103.1" width="39.5" height="38.4" rx="3" {...getKeyStyle('k')} />
        <text x="423" y="130" fill={activeKey === 'k' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">K</text>
        
        <rect x="448.4" y="103.1" width="39.5" height="38.4" rx="3" {...getKeyStyle('l')} />
        <text x="468" y="130" fill={activeKey === 'l' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">L</text>
        
        <rect x="493.4" y="103.1" width="39.5" height="38.4" rx="3" {...getKeyStyle(';')} />
        <text x="513" y="130" fill={activeKey === ';' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">;</text>
        
        <rect x="538.4" y="103.1" width="39.5" height="38.4" rx="3" {...getKeyStyle("'")} />
        <text x="558" y="130" fill={activeKey === "'" ? activeTextColor : textColor} fontSize="18" textAnchor="middle">'</text>
        
        <rect x="583.4" y="103.1" width="84.4" height="38.4" rx="3" {...getKeyStyle('Enter')} />
        <text x="625" y="130" fill={activeKey === 'Enter' ? activeTextColor : textColor} fontSize="14" textAnchor="middle">Enter</text>

        {/* Row 4 - ZXCV */}
        <rect x="15.9" y="146.9" width="84" height="38.4" rx="3" {...getKeyStyle('ShiftLeft')} />
        <text x="58" y="174" fill={activeKey === 'ShiftLeft' ? activeTextColor : textColor} fontSize="14" textAnchor="middle">Shift</text>
        
        <rect x="105.4" y="146.9" width="39.5" height="38.4" rx="3" {...getKeyStyle('z')} />
        <text x="125" y="174" fill={activeKey === 'z' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">Z</text>
        
        <rect x="150.4" y="146.9" width="39.5" height="38.4" rx="3" {...getKeyStyle('x')} />
        <text x="170" y="174" fill={activeKey === 'x' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">X</text>
        
        <rect x="195.4" y="146.9" width="39.5" height="38.4" rx="3" {...getKeyStyle('c')} />
        <text x="215" y="174" fill={activeKey === 'c' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">C</text>
        
        <rect x="240.4" y="146.9" width="39.5" height="38.4" rx="3" {...getKeyStyle('v')} />
        <text x="260" y="174" fill={activeKey === 'v' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">V</text>
        
        <rect x="285.4" y="146.9" width="39.5" height="38.4" rx="3" {...getKeyStyle('b')} />
        <text x="305" y="174" fill={activeKey === 'b' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">B</text>
        
        <rect x="330.4" y="146.9" width="39.5" height="38.4" rx="3" {...getKeyStyle('n')} />
        <text x="350" y="174" fill={activeKey === 'n' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">N</text>
        
        <rect x="375.4" y="146.9" width="39.5" height="38.4" rx="3" {...getKeyStyle('m')} />
        <text x="395" y="174" fill={activeKey === 'm' ? activeTextColor : textColor} fontSize="20" textAnchor="middle">M</text>
        
        <rect x="420.4" y="146.9" width="39.5" height="38.4" rx="3" {...getKeyStyle(',')} />
        <text x="440" y="174" fill={activeKey === ',' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">,</text>
        
        <rect x="465.4" y="146.9" width="39.5" height="38.4" rx="3" {...getKeyStyle('.')} />
        <text x="485" y="174" fill={activeKey === '.' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">.</text>
        
        <rect x="510.4" y="146.9" width="39.5" height="38.4" rx="3" {...getKeyStyle('/')} />
        <text x="530" y="174" fill={activeKey === '/' ? activeTextColor : textColor} fontSize="18" textAnchor="middle">/</text>
        
        <rect x="555.4" y="146.9" width="112.4" height="38.4" rx="3" {...getKeyStyle('ShiftRight')} />
        <text x="611" y="174" fill={activeKey === 'ShiftRight' ? activeTextColor : textColor} fontSize="14" textAnchor="middle">Shift</text>

        {/* Row 5 - Spacebar */}
        <rect x="105.4" y="190.7" width="367" height="38.4" rx="3" {...getKeyStyle(' ')} />
        <text x="289" y="218" fill={activeKey === ' ' ? activeTextColor : textColor} fontSize="14" textAnchor="middle">Space</text>
      </svg>
    </div>
  );
});

ThemedKeyboard.displayName = 'ThemedKeyboard';

export default ThemedKeyboard;
