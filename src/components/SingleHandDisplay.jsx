import React, { useEffect, useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import bothhandHTML from './hands/bothhand.html?raw';

const SingleHandDisplay = React.memo(({ activeKey, settings = {} }) => {
  const [svgContent, setSvgContent] = useState('');
  const [responsiveStyles, setResponsiveStyles] = useState({});
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const previousKeyRef = useRef(activeKey);

  // Define which hand each key uses
  const leftHandKeys = useMemo(() => ['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b', '1', '2', '3', '4', '5', '`'], []);
  const rightHandKeys = useMemo(() => ['y', 'u', 'i', 'o', 'p', '[', ']', '\\', 'h', 'j', 'k', 'l', ';', "'", 'n', 'm', ',', '.', '/', '6', '7', '8', '9', '0', '-', '=','space'], []);

  // Calculate responsive positioning based on screen characteristics
  const calculateResponsiveStyles = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const aspectRatio = viewportWidth / viewportHeight;
    const dpr = window.devicePixelRatio || 1;

    console.log('📱 Screen Info:', {
      width: viewportWidth,
      height: viewportHeight,
      aspectRatio: aspectRatio.toFixed(2),
      dpr: dpr,
      classification: aspectRatio > 1.7 ? 'wide' : aspectRatio > 1.5 ? 'standard' : 'square'
    });

    let styles = {
      width: '150%',
      height: '100%',
      bottom: '35%', // Changed default from 15% to 35%
      left: '56%'
    };

    // Adjust based on viewport height (your main issue)
    if (viewportHeight <= 720) {
      // 720p or smaller screens
      styles.height = '85%';
      styles.bottom = '40%'; // Changed from 20% to 40%
      styles.left = '58%';
    } else if (viewportHeight <= 900) {
      // Medium height screens
      styles.height = '95%';
      styles.bottom = '38%'; // Changed from 18% to 38%
    } else if (viewportHeight >= 1080) {
      // 1080p or larger screens
      styles.height = '115%';
      styles.bottom = '35%'; // Changed from 15% to 35%
    }

    // Adjust based on aspect ratio
    if (aspectRatio < 1.4) {
      // Very square screens (4:3 or similar)
      styles.height = '85%';
      styles.bottom = '42%'; // Changed from 22% to 42%
    } else if (aspectRatio > 1.8) {
      // Very wide screens (21:9 or similar)
      styles.left = '54%';
      styles.width = '140%';
    }

    // Adjust for very small or large screens
    if (viewportWidth < 1366) {
      styles.width = '140%';
      styles.left = '54%';
    }

    return styles;
  }, []);

  // Get final styles (responsive + user overrides)
  const getFinalStyles = useMemo(() => {
    const baseStyles = calculateResponsiveStyles;
    
    // Apply user overrides if set
    const finalStyles = { ...baseStyles };
    
    if (settings.handPositionHeight && settings.handPositionHeight !== 'auto') {
      finalStyles.height = settings.handPositionHeight;
    }
    
    if (settings.handPositionBottom && settings.handPositionBottom !== 'auto') {
      finalStyles.bottom = settings.handPositionBottom;
    }
    
    if (settings.handPositionLeft && settings.handPositionLeft !== 'auto') {
      finalStyles.left = settings.handPositionLeft;
    }
    
    console.log('👋 Hand Positioning:', {
      responsive: baseStyles,
      userOverrides: {
        height: settings.handPositionHeight,
        bottom: settings.handPositionBottom,
        left: settings.handPositionLeft
      },
      final: finalStyles
    });
    
    return finalStyles;
  }, [calculateResponsiveStyles, settings.handPositionHeight, settings.handPositionBottom, settings.handPositionLeft]);

  // Update responsive styles on window resize
  useEffect(() => {
    const updateStyles = () => {
      setResponsiveStyles(getFinalStyles);
    };

    updateStyles(); // Initial calculation
    window.addEventListener('resize', updateStyles);
    return () => window.removeEventListener('resize', updateStyles);
  }, [getFinalStyles]);

  // Load the bothhand.html SVG file once
  useEffect(() => {
    setSvgContent(bothhandHTML);
  }, []);

  // Update hand visibility and apply theme when activeKey changes
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    const keyChanged = previousKeyRef.current !== activeKey;
    if (!keyChanged && previousKeyRef.current !== undefined) {
      return; // Skip if key hasn't changed
    }

    previousKeyRef.current = activeKey;
    const container = containerRef.current;

    // Determine which hand is active
    const isLeftHand = leftHandKeys.includes(activeKey?.toLowerCase());
    const isRightHand = rightHandKeys.includes(activeKey?.toLowerCase());
    
    let leftHandState = 'neutral';
    let rightHandState = 'neutral';
    let activeGroup = null;
    
    if (activeKey && activeKey !== ' ') {
      const keyToShow = activeKey.toLowerCase();
      activeGroup = container.querySelector(`g[id="${keyToShow}"]`);
      
      if (activeGroup && isLeftHand) {
        leftHandState = keyToShow;
        rightHandState = 'neutral';
      } else if (activeGroup && isRightHand) {
        rightHandState = keyToShow;
        leftHandState = 'neutral';
      }
    }

    console.log('🎯 Hand States:', {
      currentKey: activeKey,
      leftHandState,
      rightHandState,
      svgRendered: activeGroup ? activeKey.toLowerCase() : 'neutral',
      theme: theme?.mode
    });

    // Hide ALL groups first
    const allGroups = container.querySelectorAll('g[id]:not([id="Layer_1"])');
    allGroups.forEach(g => g.style.display = 'none');

    // Show active key group (contains both hands in position)
    if (activeGroup) {
      activeGroup.style.display = 'block';
    }

    // Show neutral/rest hand for the opposite hand
    if (leftHandState === 'neutral' || rightHandState === 'neutral') {
      const neutralLeft = container.querySelector('g[id="neutral-left"]');
      const neutralRight = container.querySelector('g[id="neutral-right"]');
      
      if (leftHandState === 'neutral' && neutralLeft) {
        neutralLeft.style.display = 'block';
      }
      if (rightHandState === 'neutral' && neutralRight) {
        neutralRight.style.display = 'block';
      }
    }

    // Apply theme via CSS class on SVG root
    const svg = container.querySelector('svg');
    if (svg) {
      // Remove old theme classes
      svg.classList.remove('theme-dark', 'theme-robot', 'theme-kingfish', 'kb-colorful');
      
      // Add theme class based on current theme
      if (theme?.mode === 'dark') {
        svg.classList.add('theme-dark');
      }
      // You can add more theme mappings here based on your theme keys
    }

    // Inject dynamic CSS for current primary color
    let styleTag = container.querySelector('#dynamic-hand-theme');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-hand-theme';
      container.appendChild(styleTag);
    }
    
    const primaryColor = theme?.css?.['--theme-primary'] || '#297bff';
    styleTag.textContent = `
      .st5 { stroke: ${primaryColor} !important; }
    `;

  }, [activeKey, svgContent, theme, leftHandKeys, rightHandKeys]);

  return (
    <>
      <div 
        ref={containerRef}
        className="hand-display-responsive hand-display-spaced"
        style={{ 
          position: 'absolute',
          pointerEvents: 'none',
          transform: 'translateX(-50%)',
          // Use calculated responsive styles
          width: responsiveStyles.width || '150%',
          height: responsiveStyles.height || '100%',
          bottom: responsiveStyles.bottom || '35%', // Changed default from 15% to 35%
          left: responsiveStyles.left || '56%',
          // Smooth transitions when styles change
          transition: 'all 0.3s ease-out'
        }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </>
  );
});

SingleHandDisplay.displayName = 'SingleHandDisplay';

SingleHandDisplay.propTypes = {
  activeKey: PropTypes.string,
  settings: PropTypes.shape({
    handPositionHeight: PropTypes.string,
    handPositionBottom: PropTypes.string,
    handPositionLeft: PropTypes.string
  })
};

export default SingleHandDisplay;
