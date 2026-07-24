import React, { useState } from 'react';
import { Trophy, Download, Zap, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { progressManager } from '../../utils/storage';

export default function CompletionCertificate({
  certificateUser,
  setCertificateUser,
  typist,
  onClose
}) {
  const [certTheme, setCertTheme] = useState('darkBlue'); // 'darkBlue' | 'light'
  
  const user = certificateUser || typist;
  const handleClose = () => {
    if (setCertificateUser) setCertificateUser(null);
    if (onClose) onClose();
  };

  if (!user) return null;

  const username = user.username || 'Typist';
  const avgWPM = user.averageWPM || user.wpm || user.bestWPM || 75;
  const dateStr = user.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const certId = user.id || `CERT-${username.substring(0, 4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  // Retrieve total practice time spent (default to 4 hours if none exists)
  let totalTime = user.totalTime || user.total_time || 14400; 
  if (user.id) {
    try {
      const prog = progressManager.getUserProgress(user.id);
      if (prog?.stats?.totalTime) {
        totalTime = prog.stats.totalTime;
      }
    } catch (e) {}
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs} ${hrs === 1 ? 'Hour' : 'Hours'} ${mins} ${mins === 1 ? 'Minute' : 'Minutes'}`;
    }
    return `${mins} ${mins === 1 ? 'Minute' : 'Minutes'}`;
  };

  // Define styling theme properties
  const themeStyles = {
    darkBlue: {
      bg: 'bg-[#040814]',
      outerBorder: 'border-cyan-600/30',
      innerBorder: 'border-cyan-500/25 bg-slate-950/40',
      accentText: 'text-cyan-400',
      mainHeading: 'from-cyan-400 via-blue-200 to-cyan-300',
      recipientName: 'text-cyan-200/90',
      descriptionText: 'text-slate-300',
      bodyText: 'text-white',
      metaLabel: 'text-slate-500',
      metaValue: 'text-cyan-400',
      verifiedBadge: 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400/80',
      watermarkColor: 'text-cyan-400/5',
      cornerOrnament: 'text-cyan-500/40',
      lineSeparator: 'border-slate-800/80',
      signatureColor: 'text-cyan-200/90',
      signatureUnderline: 'border-slate-800'
    },
    light: {
      bg: 'bg-white',
      outerBorder: 'border-slate-400/80',
      innerBorder: 'border-slate-300 bg-slate-50/20',
      accentText: 'text-slate-800',
      mainHeading: 'from-slate-900 via-slate-700 to-slate-850',
      recipientName: 'text-slate-900 font-bold',
      descriptionText: 'text-slate-600',
      bodyText: 'text-slate-800',
      metaLabel: 'text-slate-400',
      metaValue: 'text-slate-900',
      verifiedBadge: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600',
      watermarkColor: 'text-slate-300/10',
      cornerOrnament: 'text-slate-400/50',
      lineSeparator: 'border-slate-200',
      signatureColor: 'text-slate-800',
      signatureUnderline: 'border-slate-350'
    }
  }[certTheme];

  return (
    <>
      {/* Load elegant typography styles for the certificate */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Cinzel:wght@400;500;600;700;800&family=Great+Vibes&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 print:p-0 print:bg-white print:static animate-fadeIn overflow-y-auto">
        <style dangerouslySetInnerHTML={{__html: `
          @page {
            size: landscape;
            margin: 0;
          }
          @media print {
            html, body {
              width: 297mm !important;
              height: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden !important;
            }
            #cert-print-area, #cert-print-area * {
              visibility: visible !important;
            }
            #cert-print-area {
              position: absolute;
              left: 0 !important;
              top: 0 !important;
              transform: none !important;
              width: 297mm !important;
              height: 210mm !important;
              margin: 0 !important;
              padding: 2.5rem !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}} />
        
        <div className="max-w-4xl w-full flex flex-col gap-6 print:gap-0 my-8">
          
          {/* Certificate Theme Selection Panel (Print hidden) */}
          <div className="flex flex-wrap justify-between items-center bg-slate-900/60 backdrop-blur border border-slate-800 px-4 py-3 rounded-2xl print:hidden gap-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Configure Styling:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCertTheme('darkBlue')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  certTheme === 'darkBlue'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                💙 Dark Blue Theme
              </button>
              <button
                onClick={() => setCertTheme('light')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  certTheme === 'light'
                    ? 'bg-slate-200 text-slate-900'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                🤍 Classic Light Theme
              </button>
            </div>
          </div>

          {/* Certificate Container with Standard A4 Landscape Aspect Ratio */}
          <div 
            id="cert-print-area" 
            className={`w-full aspect-[1.414/1] ${themeStyles.bg} border-[6px] ${themeStyles.outerBorder} rounded-3xl p-8 sm:p-12 relative overflow-hidden ${themeStyles.bodyText} flex flex-col justify-between shadow-2xl border-double`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            
            {/* Elegant Vintage Corner Ornaments */}
            <div className={`absolute top-4 left-4 ${themeStyles.cornerOrnament} font-serif text-2xl select-none`}>✦</div>
            <div className={`absolute top-4 right-4 ${themeStyles.cornerOrnament} font-serif text-2xl select-none`}>✦</div>
            <div className={`absolute bottom-4 left-4 ${themeStyles.cornerOrnament} font-serif text-2xl select-none`}>✦</div>
            <div className={`absolute bottom-4 right-4 ${themeStyles.cornerOrnament} font-serif text-2xl select-none`}>✦</div>

            {/* Faded Lightning Bolt Pattern Background Watermark */}
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${themeStyles.watermarkColor} select-none`}>
              <Zap className="w-[450px] h-[450px] transform -rotate-12 stroke-[1.2]" />
            </div>

            {/* Inner Border Frame */}
            <div className={`border ${themeStyles.innerBorder} h-full w-full rounded-xl p-6 sm:p-8 flex flex-col justify-between relative backdrop-blur-[1px]`}>
              
              {/* Header Section */}
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-1">
                  <Award className={`w-10 h-10 ${themeStyles.accentText} stroke-[1.5]`} />
                </div>
                <h1 
                  className={`text-2xl sm:text-4xl font-extrabold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r ${themeStyles.mainHeading} uppercase`}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Certificate of Mastery
                </h1>
                <p 
                  className={`text-[9px] sm:text-[10px] tracking-[0.25em] ${themeStyles.accentText} uppercase font-medium`}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Swift Typing Academy • Official Verification Standard
                </p>
              </div>

              {/* Recipient / Statement Section */}
              <div className="text-center space-y-4 my-auto">
                <p className="text-xs italic text-slate-400 font-serif">This credential is officially awarded to</p>
                
                <h2 
                  className={`text-4xl sm:text-6xl font-normal ${themeStyles.recipientName} tracking-wide max-w-xl mx-auto border-b ${themeStyles.lineSeparator} pb-3`}
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                >
                  {username}
                </h2>
                
                <p 
                  className={`text-xs ${themeStyles.descriptionText} max-w-lg mx-auto leading-relaxed font-light`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  in recognition of successfully completing the touch typing curriculum, demonstrating exceptional typing speed, and meeting all verification standards.
                </p>
              </div>

              {/* Metrics Box & Verification Seal */}
              <div className={`grid grid-cols-3 items-center gap-4 max-w-2xl mx-auto w-full border-t border-b ${themeStyles.lineSeparator} py-4 my-2`}>
                
                {/* Speed Metric */}
                <div className="text-center space-y-1">
                  <p className={`text-[9px] uppercase tracking-wider ${themeStyles.metaLabel} font-bold`}>Average Speed</p>
                  <p className={`text-lg sm:text-xl font-bold ${themeStyles.metaValue} font-mono`}>
                    {avgWPM} <span className="text-[10px] font-normal text-slate-400">WPM</span>
                  </p>
                </div>

                {/* Verification Stamp / Seal */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg mb-1 ${themeStyles.verifiedBadge}`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <p className={`text-[7px] font-mono uppercase tracking-widest ${themeStyles.metaLabel}`}>{certId.substring(0, 15)}</p>
                </div>

                {/* Duration/Time Spent Metric */}
                <div className="text-center space-y-1">
                  <p className={`text-[9px] uppercase tracking-wider ${themeStyles.metaLabel} font-bold`}>Practice Duration</p>
                  <p className={`text-xs sm:text-sm font-semibold ${themeStyles.metaValue}`}>
                    {formatTime(totalTime)}
                  </p>
                </div>

              </div>

              {/* Footer Signatures / Verification Details */}
              <div className="flex justify-between items-end w-full pt-4 text-slate-400">
                
                {/* Date of Issue */}
                <div className="text-left space-y-1 w-1/3">
                  <p className={`font-medium text-xs ${certTheme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>{dateStr}</p>
                  <div className={`w-24 border-t ${themeStyles.lineSeparator}`}></div>
                  <p className={`text-[8px] uppercase tracking-wider ${themeStyles.metaLabel}`}>Date of Issue</p>
                </div>

                {/* Central Verified Credential Text */}
                <div className="text-center w-1/3 pb-1">
                  <span className={`text-[9px] uppercase tracking-widest font-semibold border px-2 py-0.5 rounded-full ${themeStyles.verifiedBadge}`}>
                    ✓ Verified Credential
                  </span>
                </div>

                {/* Lead Moderator Signature */}
                <div className="text-right space-y-0 w-1/3 flex flex-col items-end">
                  {/* Handwritten Signature */}
                  <div 
                    className={`text-3xl font-normal h-8 transform -rotate-3 pr-2 select-none ${themeStyles.signatureColor}`}
                    style={{ fontFamily: "'Allura', cursive" }}
                  >
                    Sharagaki
                  </div>
                  <div className={`w-32 border-t ${themeStyles.signatureUnderline}`}></div>
                  <p className={`text-[8px] uppercase tracking-wider ${themeStyles.metaLabel} mt-1`}>Lead Administrator</p>
                </div>

              </div>

            </div>
          </div>

          {/* Action Control Panel (Print hidden) */}
          <div className="flex justify-end gap-3 print:hidden px-4">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Close Preview
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              <Download className="w-4 h-4" /> Download / Print Official PDF
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
