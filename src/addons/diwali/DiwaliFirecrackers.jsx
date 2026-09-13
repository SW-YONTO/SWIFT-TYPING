import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const DiwaliFirecrackers = () => {
  const canvasRef = useRef(null);
  const { themeKey } = useTheme();

  useEffect(() => {
    if (themeKey !== 'diwali') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const colors = ['#f59e0b', '#fbbf24', '#ef4444', '#10b981', '#ec4899', '#f97316', '#38bdf8', '#ffffff'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create a firework burst at (x, y)
    const createBurst = (x, y, count = 55) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          color,
          size: Math.random() * 3.5 + 1.5,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.015,
          sparkle: Math.random() > 0.5
        });
      }
    };

    // Trigger initial festive bursts
    const bursts = [
      { x: window.innerWidth * 0.25, y: window.innerHeight * 0.35, delay: 100 },
      { x: window.innerWidth * 0.75, y: window.innerHeight * 0.3, delay: 350 },
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.25, delay: 700 },
      { x: window.innerWidth * 0.35, y: window.innerHeight * 0.4, delay: 1100 },
      { x: window.innerWidth * 0.65, y: window.innerHeight * 0.38, delay: 1450 }
    ];

    const timeouts = bursts.map(b => setTimeout(() => createBurst(b.x, b.y), b.delay));

    const startTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.09; // gentle gravity
        p.vx *= 0.98; // air resistance
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stop loop once 4 seconds passed and particles cleared
      if (Date.now() - startTime < 4500 || particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      timeouts.forEach(clearTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [themeKey]);

  if (themeKey !== 'diwali') return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-30" 
      aria-hidden="true" 
    />
  );
};
