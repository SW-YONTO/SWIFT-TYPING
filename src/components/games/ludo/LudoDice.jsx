import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

const DICE_FACES = {
  1: [[1,1]],
  2: [[0,2],[2,0]],
  3: [[0,2],[1,1],[2,0]],
  4: [[0,0],[0,2],[2,0],[2,2]],
  5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
  6: [[0,0],[0,1],[0,2],[2,0],[2,1],[2,2]]
};

const LudoDice = ({ value, isRolling, canRoll, onRoll, playerColor }) => {
  const { theme } = useTheme();
  const [displayValue, setDisplayValue] = useState(value || 1);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRolling) {
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 70);
    } else {
      setDisplayValue(value || 1);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRolling, value]);

  const dots = DICE_FACES[displayValue] || DICE_FACES[1];

  const colorMap = {
    red: { bg: 'bg-red-500', dot: 'bg-white', shadow: 'shadow-red-500/30', border: 'border-red-400' },
    blue: { bg: 'bg-blue-500', dot: 'bg-white', shadow: 'shadow-blue-500/30', border: 'border-blue-400' },
    green: { bg: 'bg-green-500', dot: 'bg-white', shadow: 'shadow-green-500/30', border: 'border-green-400' },
    yellow: { bg: 'bg-yellow-500', dot: 'bg-white', shadow: 'shadow-yellow-500/30', border: 'border-yellow-400' }
  };

  const colors = colorMap[playerColor] || colorMap.red;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={canRoll ? onRoll : undefined}
        disabled={!canRoll}
        className={`
          relative w-12 h-12 rounded-2xl border-2
          ${colors.bg} ${colors.border}
          flex items-center justify-center shadow-lg ${colors.shadow}
          transition-transform duration-150 transform-none select-none
          ${canRoll ? 'cursor-pointer hover:scale-105 active:scale-95 animate-pulse border-white' : 'opacity-95'}
        `}
        style={{ transform: 'none' }}
      >
        <div className="absolute inset-2 grid grid-cols-3 grid-rows-3 gap-0.5 pointer-events-none">
          {[0,1,2].map(row =>
            [0,1,2].map(col => {
              const hasDot = dots.some(([r,c]) => r === col && c === row);
              return (
                <div key={`${row}-${col}`} className="flex items-center justify-center">
                  {hasDot && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm opacity-100" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </button>

      {canRoll && (
        <span className={`text-[10px] font-black tracking-wider uppercase text-amber-400 animate-pulse`}>
          TAP TO ROLL
        </span>
      )}
    </div>
  );
};

export default LudoDice;
