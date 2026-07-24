import React from 'react';
import { Trophy, Download, Zap, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
  const accuracy = user.accuracy || user.averageAccuracy || 96;
  const dateStr = user.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const certId = `CERT-${username.substring(0, 4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 print:p-0 print:bg-white print:static animate-fadeIn">
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
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 2rem;
            background: #0f172a !important;
            color: white !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}} />
      
      <div id="cert-print-area" className="bg-slate-950 border-2 border-blue-500/40 rounded-3xl p-6 sm:p-10 max-w-3xl w-full space-y-6 shadow-2xl relative overflow-hidden text-white">
        
        {/* Faded Lightning Bolt Logo Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <Zap className="w-[500px] h-[500px] text-blue-400 transform -rotate-12 stroke-[1.2]" />
        </div>

        {/* Top Metallic Border Frame */}
        <div className="border-4 border-double border-blue-500/50 p-6 sm:p-8 space-y-6 text-center bg-slate-900/60 rounded-2xl relative backdrop-blur-sm">
          
          {/* Corner Ornaments */}
          <div className="absolute top-3 left-3 text-cyan-400/60 font-serif text-xl">✦</div>
          <div className="absolute top-3 right-3 text-cyan-400/60 font-serif text-xl">✦</div>
          <div className="absolute bottom-3 left-3 text-cyan-400/60 font-serif text-xl">✦</div>
          <div className="absolute bottom-3 right-3 text-cyan-400/60 font-serif text-xl">✦</div>

          {/* Certificate Header */}
          <div className="space-y-2">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400 shadow-lg shadow-blue-500/20">
              <Zap className="w-10 h-10 text-cyan-400 animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-amber-300 bg-clip-text text-transparent uppercase font-serif">
              Certificate of Mastery
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-cyan-400 font-mono font-bold">
              Swift Typing Academy • Official Verification Standard
            </p>
          </div>

          {/* Recipient Information */}
          <div className="space-y-3 py-2">
            <p className="text-xs font-serif italic text-slate-300">This official document certifies that</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-wide border-b-2 border-cyan-500/40 max-w-md mx-auto pb-2 text-cyan-300 shadow-cyan-500/10 drop-shadow-md">
              {username}
            </h2>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed pt-1">
              has demonstrated exceptional touch typing fluency, finger muscle speed, and high-precision accuracy across the full 13-Unit Touch Typing Curriculum.
            </p>
          </div>

          {/* Metric Stats Banner */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl shadow-inner">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Peak Typing Speed</p>
              <p className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">{peakWPM} <span className="text-xs font-normal">WPM</span></p>
            </div>
            <div className="space-y-0.5 border-l border-slate-800 pl-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Accuracy Rating</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{accuracy}%</p>
            </div>
          </div>

          {/* Verification Stamp & Signatures */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-4 max-w-lg mx-auto text-xs text-slate-300 border-t border-slate-800">
            
            {/* Gold Security Seal Badge */}
            <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl text-amber-400">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-amber-400" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-wider">Verified Credential</p>
                <p className="text-[9px] font-mono text-amber-300/80">{certId}</p>
              </div>
            </div>

            {/* Date & Signature */}
            <div className="text-right space-y-1">
              <p className="font-bold text-slate-200 text-xs">{dateStr}</p>
              <div className="w-28 border-t border-slate-700 ml-auto"></div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Official Issue Date</p>
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 print:hidden pt-2">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close Preview
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" /> Download / Print Official PDF
          </button>
        </div>

      </div>
    </div>
  );
}
