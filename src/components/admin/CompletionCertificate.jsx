import React from 'react';
import { Trophy, Download } from 'lucide-react';

export default function CompletionCertificate({
  certificateUser,
  setCertificateUser
}) {
  if (!certificateUser) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
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
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:text-black {
            color: #000000 !important;
          }
          .print\\:border-amber-600 {
            border-color: #d97706 !important;
          }
        }
      `}} />
      
      <div id="cert-print-area" className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 max-w-2xl w-full space-y-6 shadow-2xl relative print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Certificate Document Border */}
        <div className="border-4 border-double border-amber-500/60 p-8 space-y-8 text-center bg-slate-950/40 relative print:bg-transparent print:border-amber-600 print:text-black">
          
          {/* Corner Ornaments */}
          <div className="absolute top-2 left-2 text-amber-500/50 font-serif text-lg">✦</div>
          <div className="absolute top-2 right-2 text-amber-500/50 font-serif text-lg">✦</div>
          <div className="absolute bottom-2 left-2 text-amber-500/50 font-serif text-lg">✦</div>
          <div className="absolute bottom-2 right-2 text-amber-500/50 font-serif text-lg">✦</div>

          <div className="space-y-2">
            <Trophy className="w-12 h-12 mx-auto text-amber-500 print:text-amber-600" />
            <h1 className="text-3xl font-serif text-amber-500 font-bold uppercase tracking-wider print:text-amber-600">Certificate of Completion</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono print:text-slate-500">Swift Typing Touch Typing Academy</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-serif italic text-slate-300 print:text-slate-700">This prestigious award is proudly presented to</p>
            <h2 className="text-4xl font-extrabold text-white font-serif border-b-2 border-amber-500/30 max-w-md mx-auto pb-2 print:text-black print:border-amber-600">
              {certificateUser.username}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed print:text-slate-600">
              for successfully mastering touch typing fundamentals, achieving outstanding finger muscle coordination, and completing the Touch Typing Lesson Curriculum.
            </p>
          </div>

          {/* Stats Block */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto p-4 bg-slate-900/60 border border-slate-800 rounded-xl print:bg-slate-100 print:border-slate-300">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Peak WPM Speed</p>
              <p className="text-lg font-black text-blue-400">{certificateUser.wpm} WPM</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Average Accuracy</p>
              <p className="text-lg font-black text-emerald-400">{certificateUser.accuracy}%</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-6 max-w-md mx-auto text-xs text-slate-400 print:text-slate-800">
            <div className="space-y-1">
              <p className="font-semibold text-slate-300 italic font-serif print:text-black">Touch Typing Instructor</p>
              <div className="w-24 border-t border-slate-700 mx-auto print:border-slate-500"></div>
              <p className="text-[9px] text-slate-500">Signature</p>
            </div>
            <div>
              <p className="font-semibold text-slate-300 print:text-black">{certificateUser.date}</p>
              <div className="w-24 border-t border-slate-700 mx-auto print:border-slate-500"></div>
              <p className="text-[9px] text-slate-500">Date Issued</p>
            </div>
          </div>

        </div>

        {/* Print & Close Controls */}
        <div className="flex justify-end gap-3 print:hidden">
          <button
            onClick={() => setCertificateUser(null)}
            className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <Download className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>

      </div>
    </div>
  );
}
