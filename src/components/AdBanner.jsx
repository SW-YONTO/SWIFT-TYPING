import { useEffect, useRef } from 'react';

// Detect Electron (desktop app uses file:// protocol — ads don't work there)
const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:';

/**
 * AdBanner — renders a Google AdSense display unit.
 *
 * Props:
 *   slot   {string}  — Ad slot ID from your AdSense dashboard (required)
 *   format {string}  — 'auto' | 'rectangle' | 'horizontal' | 'vertical' (default: 'auto')
 *   style  {object}  — Extra inline styles for the <ins> element
 */
const AdBanner = ({ slot, format = 'auto', style = {} }) => {
  const insRef = useRef(null);

  useEffect(() => {
    if (isElectron || !slot) return;

    try {
      // Push the ad after mount — required by AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Silently ignore — ad blocker or blocked environment
    }
  }, [slot]);

  // Don't render on Electron or if no slot provided
  if (isElectron || !slot) return null;

  return (
    <div
      className="ad-banner-wrapper"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        margin: '16px 0',
        minHeight: '90px',
        overflow: 'hidden',
      }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', ...style }}
        data-ad-client="ca-pub-4869966197556742"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdBanner;
