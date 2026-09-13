import React, { memo } from 'react';

// Hanging Festive Diwali Fairy Lights (Ladi / Jhalaar)
// Traditional string lights that drape along the bottom border of the navigation bar
// Ultra-lightweight: precomputed bulb descriptors and pure GPU compositing

const BULB_COLORS = [
  { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.75)' }, // Golden Amber
  { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.75)' },  // Ruby Red
  { color: '#10b981', glow: 'rgba(16, 185, 129, 0.75)' }, // Emerald Green
  { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.75)' }, // Sky Cyan
  { color: '#f97316', glow: 'rgba(249, 115, 22, 0.75)' }, // Marigold Orange
  { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.75)' }, // Gulabi Pink
  { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.75)' }, // Royal Violet
  { color: '#facc15', glow: 'rgba(250, 204, 21, 0.75)' }, // Bright Yellow
];

// Pre-compute 22 bulbs once at module load to avoid any runtime allocations or GC pressure
const BULBS_DATA = Array.from({ length: 22 }).map((_, i) => {
  const scheme = BULB_COLORS[i % BULB_COLORS.length];
  return {
    id: i,
    color: scheme.color,
    boxShadow: `0 0 7px ${scheme.glow}, 0 0 14px ${scheme.glow}`,
    animationDelay: `${((i * 0.2) % 2.2).toFixed(2)}s`,
    dropHeight: i % 2 === 0 ? '16px' : '22px'
  };
});

export const DiwaliFairyLights = memo(() => {
  return (
    <div 
      className="fixed top-[54px] left-0 right-0 z-40 pointer-events-none select-none overflow-visible h-9"
      style={{ transform: 'translateZ(0)', contain: 'layout paint' }}
      aria-hidden="true"
    >
      {/* Curved Garland Wire running along bottom of Navbar */}
      <svg 
        className="w-full h-5 absolute top-0 left-0" 
        preserveAspectRatio="none" 
        viewBox="0 0 1400 20" 
        fill="none"
      >
        <path
          d="M0,2 Q50,12 100,2 Q150,12 200,2 Q250,12 300,2 Q350,12 400,2 Q450,12 500,2 Q550,12 600,2 Q650,12 700,2 Q750,12 800,2 Q850,12 900,2 Q950,12 1000,2 Q1050,12 1100,2 Q1150,12 1200,2 Q1250,12 1300,2 Q1350,12 1400,2"
          stroke="#78350f"
          strokeWidth="1.5"
          opacity="0.75"
        />
      </svg>

      {/* Hanging Bulbs draped beneath navbar */}
      <div className="flex justify-between items-start w-full px-4 sm:px-8 relative top-0.5">
        {BULBS_DATA.map((bulb) => (
          <div 
            key={bulb.id} 
            className="flex flex-col items-center"
            style={{ height: bulb.dropHeight }}
          >
            {/* Bulb Socket Cap */}
            <div className="w-1.5 h-1 bg-[#361502] rounded-t-sm" />
            {/* Glowing Teardrop Bulb */}
            <div 
              className="w-2.5 h-3.5 rounded-full fairy-bulb shrink-0"
              style={{
                backgroundColor: bulb.color,
                boxShadow: bulb.boxShadow,
                animationDelay: bulb.animationDelay
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

DiwaliFairyLights.displayName = 'DiwaliFairyLights';
