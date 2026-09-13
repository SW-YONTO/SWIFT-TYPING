import React, { useState, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { DiwaliFairyLights } from './DiwaliFairyLights';
import { DiwaliFirecrackers } from './DiwaliFirecrackers';
import { soundEffects } from '../../utils/soundEffects';
import './diwali.css';

// Handcrafted Traditional Diwali Rangoli / Chakra Mandala Background Watermark
// 100% static & memoized with hardware isolation: renders once, zero CPU overhead
const CentralRangoliMandala = memo(() => {
  const angles = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5];
  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div 
      className="absolute top-1/2 left-1/2 pointer-events-none select-none opacity-[0.065]"
      style={{ transform: 'translate(-50%, -50%) translateZ(0)', contain: 'strict' }}
      aria-hidden="true"
    >
      <svg width="540" height="540" viewBox="0 0 200 200" fill="none">
        {/* Concentric Decorative Rings */}
        <circle cx="100" cy="100" r="92" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="5 4" />
        <circle cx="100" cy="100" r="80" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="62" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx="100" cy="100" r="46" stroke="#f59e0b" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="28" stroke="#fbbf24" strokeWidth="1" />
        <circle cx="100" cy="100" r="12" stroke="#f59e0b" strokeWidth="1" fill="#f59e0b" fillOpacity="0.1" />

        {/* 16 Radiating Chakra Spokes & Outer Petal Dots */}
        {angles.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          return (
            <g key={deg}>
              <line
                x1={100 + 12 * cos}
                y1={100 + 12 * sin}
                x2={100 + 80 * cos}
                y2={100 + 80 * sin}
                stroke="#fbbf24"
                strokeWidth="0.85"
              />
              <circle
                cx={100 + 86 * cos}
                cy={100 + 86 * sin}
                r="2"
                fill="#f59e0b"
              />
            </g>
          );
        })}

        {/* Inner Lotus Petal Arcs */}
        {petalAngles.map((deg) => (
          <path
            key={`petal-${deg}`}
            d="M100,100 Q90,65 100,46 Q110,65 100,100"
            stroke="#f59e0b"
            strokeWidth="0.85"
            transform={`rotate(${deg} 100 100)`}
          />
        ))}
      </svg>
    </div>
  );
});

CentralRangoliMandala.displayName = 'CentralRangoliMandala';

// Handcrafted pure SVG Traditional Earthen Diya (Deepak) - Memoized with hardware isolation
const DiyaSVG = memo(({ size = 64, className = '', isSparking = false }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ contain: 'layout paint' }}
  >
    <defs>
      {/* Flame Inner & Outer Gradients */}
      <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
        <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.7" />
        <stop offset="80%" stopColor="#ea580c" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
      </radialGradient>
      
      <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#ea580c" />
        <stop offset="35%" stopColor="#f59e0b" />
        <stop offset="70%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>

      {/* Clay Body Gradient */}
      <linearGradient id="clayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="30%" stopColor="#b45309" />
        <stop offset="70%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>

      {/* Clay Rim Gold Detail */}
      <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    {/* Ambient Light Halo */}
    <circle 
      cx="50" 
      cy="30" 
      r={isSparking ? 46 : 36} 
      fill="url(#flameGlow)" 
      className="diya-ambient-glow" 
    />

    {/* Animated Flame with GPU-only transform */}
    <g className={`diya-flame ${isSparking ? 'scale-125' : ''}`}>
      {/* Outer Flame */}
      <path 
        d="M50 8 C44 20, 36 28, 42 42 C46 50, 54 50, 58 42 C64 28, 56 20, 50 8 Z" 
        fill="url(#flameGrad)" 
      />
      {/* Inner White-Hot Core */}
      <path 
        d="M50 20 C47 28, 43 32, 46 39 C48 44, 52 44, 54 39 C57 32, 53 28, 50 20 Z" 
        fill="#ffffff" 
        opacity="0.85" 
      />
    </g>

    {/* Earthen Clay Diya Base */}
    <path 
      d="M12 55 C16 78, 35 88, 50 88 C65 88, 84 78, 88 55 C78 60, 60 62, 50 62 C40 62, 22 60, 12 55 Z" 
      fill="url(#clayGrad)" 
    />
    
    {/* Diya Base Stand */}
    <ellipse cx="50" cy="88" rx="20" ry="4" fill="#361502" />

    {/* Golden Rim Accent */}
    <path 
      d="M10 54 C24 61, 40 62, 50 62 C60 62, 76 61, 90 54 C82 58, 62 60, 50 60 C38 60, 18 58, 10 54 Z" 
      fill="url(#goldRim)" 
    />

    {/* Traditional Carved Patterns */}
    <circle cx="35" cy="70" r="2" fill="#fbbf24" opacity="0.8" />
    <circle cx="50" cy="74" r="2.5" fill="#fde047" opacity="0.9" />
    <circle cx="65" cy="70" r="2" fill="#fbbf24" opacity="0.8" />
  </svg>
));

DiyaSVG.displayName = 'DiyaSVG';

export const DiwaliOverlay = memo(() => {
  const { themeKey } = useTheme();
  const location = useLocation();
  const [sparkingLeft, setSparkingLeft] = useState(false);
  const [sparkingRight, setSparkingRight] = useState(false);

  // Only render festive decorative elements if using the Diwali theme
  if (themeKey !== 'diwali') return null;

  // Check if current view is Results page
  const isResultsPage = location.pathname === '/results' || (typeof window !== 'undefined' && window.location.hash.includes('results'));

  const handleDiyaClick = (side) => {
    soundEffects.playKeypress();
    if (side === 'left') {
      setSparkingLeft(true);
      setTimeout(() => setSparkingLeft(false), 600);
    } else {
      setSparkingRight(true);
      setTimeout(() => setSparkingRight(false), 600);
    }
  };

  return (
    <>
      {/* 1. Hanging Diwali Fairy Lights (Ladi) along the top */}
      <DiwaliFairyLights />

      {/* 2. Celebratory Firecrackers Burst on Results Page */}
      {isResultsPage && <DiwaliFirecrackers />}

      {/* 3. Screen Overlay (Central Rangoli Chakra & Corner Diyas) */}
      <div 
        className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none"
        style={{ contain: 'layout paint' }}
        aria-hidden="true"
      >
        {/* Restored Subtle Central Rangoli / Chakra Mandala Watermark */}
        <CentralRangoliMandala />

        {/* Bottom Corner Diyas: Shown on Lessons, Flow, Tests, Games, Settings (Hidden on Results page) */}
        {!isResultsPage && (
          <>
            {/* Bottom-Left Diya with click micro-interaction */}
            <div 
              onClick={() => handleDiyaClick('left')}
              className="absolute bottom-4 left-6 hidden sm:block opacity-90 hover:opacity-100 transition-all pointer-events-auto diya-interactive active:scale-95"
              style={{ transform: 'translateZ(0)' }}
              title="Happy Diwali! Click to kindle the flame ✨"
            >
              <DiyaSVG size={68} isSparking={sparkingLeft} />
            </div>

            {/* Bottom-Right Diya with click micro-interaction */}
            <div 
              onClick={() => handleDiyaClick('right')}
              className="absolute bottom-4 right-6 hidden sm:block opacity-90 hover:opacity-100 transition-all pointer-events-auto diya-interactive active:scale-95"
              style={{ transform: 'translateZ(0)' }}
              title="Happy Diwali! Click to kindle the flame ✨"
            >
              <DiyaSVG size={68} isSparking={sparkingRight} />
            </div>
          </>
        )}
      </div>
    </>
  );
});

DiwaliOverlay.displayName = 'DiwaliOverlay';
