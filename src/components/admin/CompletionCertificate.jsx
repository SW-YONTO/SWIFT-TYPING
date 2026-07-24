import React from 'react';
import { Trophy, Download, Zap, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { progressManager } from '../../utils/storage';

export default function CompletionCertificate({
  certificateUser,
  setCertificateUser,
  typist,
  onClose
}) {
  const user = certificateUser || typist;
  const handleClose = () => {
    if (setCertificateUser) setCertificateUser(null);
    if (onClose) onClose();
  };

  if (!user) return null;

  const username = user.username || 'Typist';
  const peakWPM = user.wpm || user.averageWPM || user.bestWPM || 75;
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

  return (
    <>
      {/* Load elegant typography styles for the certificate */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;500;600;700;800&family=Great+Vibes&family=Pinyon+Script&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 print:p-0 print:bg-white print:static animate-fadeIn overflow-y-auto">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #cert-print-area, #cert-print-area * {
              visibility: visible !important;
            }
            #cert-print-area {
              position: absolute;
              left: 50% !important;
              top: 50% !important;
              transform: translate(-50%, -50%) !important;
              width: 297mm !important;
              height: 210mm !important;
              margin: 0 !important;
              padding: 2.5rem !important;
              background: #090d16 !important;
              color: white !important;
              border: none !important;
              box-shadow: none !important;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}} />
        
        <div className="max-w-4xl w-full flex flex-col gap-6 print:gap-0 my-8">
          
          {/* Certificate Container with Standard A4 Landscape Aspect Ratio */}
          <div 
            id="cert-print-area" 
            className="w-full aspect-[1.414/1] bg-[#090d16] border-[6px] border-amber-600/30 rounded-3xl p-8 sm:p-12 relative overflow-hidden text-white flex flex-col justify-between shadow-2xl border-double"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            
            {/* Elegant Vintage Corner Ornaments */}
            <div className="absolute top-4 left-4 text-amber-500/40 font-serif text-2xl select-none">✦</div>
            <div className="absolute top-4 right-4 text-amber-500/40 font-serif text-2xl select-none">✦</div>
            <div className="absolute bottom-4 left-4 text-amber-500/40 font-serif text-2xl select-none">✦</div>
            <div className="absolute bottom-4 right-4 text-amber-500/40 font-serif text-2xl select-none">✦</div>

            {/* Faded Lightning Bolt Pattern Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none">
              <Zap className="w-[450px] h-[450px] text-amber-400 transform -rotate-12 stroke-[1.2]" />
            </div>

            {/* Inner Border Frame */}
            <div className="border border-amber-500/20 h-full w-full rounded-xl p-6 sm:p-8 flex flex-col justify-between relative bg-slate-950/20 backdrop-blur-[1px]">
              
              {/* Header Section */}
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-1">
                  <Award className="w-10 h-10 text-amber-500/80 stroke-[1.5]" />
                </div>
                <h1 
                  className="text-2xl sm:text-4xl font-extrabold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 uppercase"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Certificate of Mastery
                </h1>
                <p 
                  className="text-[9px] sm:text-[10px] tracking-[0.25em] text-amber-500/70 uppercase font-medium"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Swift Typing Academy • Official Verification Standard
                </p>
              </div>

              {/* Recipient / Statement Section */}
              <div className="text-center space-y-4 my-auto">
                <p className="text-xs italic text-slate-400 font-serif">This credential is officially awarded to</p>
                
                <h2 
                  className="text-4xl sm:text-6xl font-normal text-amber-100/90 tracking-wide max-w-xl mx-auto border-b border-amber-500/20 pb-3"
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                >
                  {username}
                </h2>
                
                <p 
                  className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed font-light"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  in recognition of successfully completing the touch typing curriculum, demonstrating exceptional typing speed, and meeting all verification standards.
                </p>
              </div>

              {/* Metrics Box & Verification Seal */}
              <div className="grid grid-cols-3 items-center gap-4 max-w-2xl mx-auto w-full border-t border-b border-slate-800/80 py-4 my-2">
                
                {/* Speed Metric */}
                <div className="text-center space-y-1">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Peak Speed</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-400 font-mono">
                    {peakWPM} <span className="text-[10px] font-normal text-slate-400">WPM</span>
                  </p>
                </div>

                {/* Verification Stamp / Seal */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-amber-500/5 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5 mb-1">
                    <ShieldCheck className="w-6 h-6 text-amber-500/80" />
                  </div>
                  <p className="text-[7px] font-mono text-amber-500/60 uppercase tracking-widest">{certId.substring(0, 15)}</p>
                </div>

                {/* Duration/Time Spent Metric */}
                <div className="text-center space-y-1">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Practice Duration</p>
                  <p className="text-xs sm:text-sm font-semibold text-amber-400">
                    {formatTime(totalTime)}
                  </p>
                </div>

              </div>

              {/* Footer Signatures / Verification Details */}
              <div className="flex justify-between items-end w-full pt-4 text-slate-400">
                
                {/* Date of Issue */}
                <div className="text-left space-y-1 w-1/3">
                  <p className="font-medium text-slate-300 text-xs">{dateStr}</p>
                  <div className="w-24 border-t border-slate-800"></div>
                  <p className="text-[8px] uppercase tracking-wider text-slate-500">Date of Issue</p>
                </div>

                {/* Central Verified Credential Text */}
                <div className="text-center w-1/3 pb-1">
                  <span className="text-[9px] uppercase tracking-widest text-emerald-500/70 font-semibold border border-emerald-500/20 px-2 py-0.5 rounded-full bg-emerald-500/5">
                    ✓ Verified Credential
                  </span>
                </div>

                {/* Lead Moderator Signature */}
                <div className="text-right space-y-0 w-1/3 flex flex-col items-end">
                  {/* Handwritten Signature */}
                  <div 
                    className="text-3xl font-normal text-amber-200/90 h-8 transform -rotate-3 pr-2 select-none"
                    style={{ fontFamily: "'Pinyon Script', cursive" }}
                  >
                    Suraj
                  </div>
                  <div className="w-32 border-t border-slate-800"></div>
                  <p className="text-[8px] uppercase tracking-wider text-slate-500 mt-1">Lead Administrator</p>
                </div>

              </div>

            </div>
          </div>

          {/* Action Control Panel (Vite/Print mode only) */}
          <div className="flex justify-end gap-3 print:hidden px-4">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Close Preview
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Download className="w-4 h-4" /> Download / Print Official PDF
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
