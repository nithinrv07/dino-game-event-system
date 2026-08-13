import React from 'react';
import { Team } from '../types';
import { Award, Printer, X, Trophy, Sparkles, CheckCircle2, ShieldCheck, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CertificateModalProps {
  team: Team | null;
  rank?: number;
  totalTeams?: number;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  team,
  rank,
  totalTeams,
  onClose,
}) => {
  if (!team) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = team.highScoreTimestamp
    ? new Date(team.highScoreTimestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #certificate-print-area, #certificate-print-area * {
                visibility: visible !important;
              }
              #certificate-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 20px !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 print:my-0 print:shadow-none"
        >
          {/* Modal Toolbar (hidden when printing) */}
          <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FBBC05]" />
              <span className="font-black text-sm uppercase tracking-wider">Official Team Certificate</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[#4285F4] hover:bg-[#3367d6] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CERTIFICATE PRINT AREA */}
          <div
            id="certificate-print-area"
            className="p-8 sm:p-12 bg-white text-slate-900 relative overflow-hidden font-sans border-[12px] border-slate-900 rounded-2xl print:rounded-none"
          >
            {/* Top 4-Color Google Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-3 flex">
              <div className="w-1/4 bg-[#4285F4]"></div>
              <div className="w-1/4 bg-[#EA4335]"></div>
              <div className="w-1/4 bg-[#FBBC05]"></div>
              <div className="w-1/4 bg-[#34A853]"></div>
            </div>

            {/* Inner Decorative Corner Borders */}
            <div className="border-2 border-slate-200 p-8 rounded-xl relative bg-slate-50/50">
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#4285F4]"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#EA4335]"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#34A853]"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#FBBC05]"></div>

              {/* Certificate Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 text-[#FBBC05] rounded-2xl shadow-lg mb-3">
                  <span className="text-3xl select-none">🦖</span>
                </div>

                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#4285F4]">
                  CHROME DINO RUNNER ARCADE CHAMPIONSHIP
                </p>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mt-1 tracking-tight">
                  Certificate of Achievement
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05] mx-auto mt-3 rounded-full"></div>
              </div>

              {/* Recipient Details */}
              <div className="text-center max-w-2xl mx-auto space-y-4 mb-8">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                  This official certificate is proudly presented to
                </p>

                <div className="py-2 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm inline-block max-w-full">
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight break-words">
                    {team.name}
                  </h2>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-slate-700 font-bold">
                  <span className="px-3 py-1 bg-slate-200/70 rounded-full text-slate-800">
                    Player 1: <strong>{team.player1}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="px-3 py-1 bg-slate-200/70 rounded-full text-slate-800">
                    Player 2: <strong>{team.player2}</strong>
                  </span>
                </div>

                <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed pt-2">
                  For exemplary speed, focus, and teamwork demonstrated during the Chrome Dino Infinite Runner Stall Competition.
                </p>
              </div>

              {/* Achievement Highlights Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10 text-center">
                <div className="p-4 bg-white border border-amber-200 rounded-2xl shadow-xs relative overflow-hidden">
                  <div className="w-1.5 h-full bg-[#FBBC05] absolute left-0 top-0"></div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Highest Record
                  </span>
                  <span className="text-2xl font-black text-slate-900 block mt-0.5">
                    {team.highScore.toLocaleString()}{' '}
                    <span className="text-xs text-amber-600 font-extrabold">PTS</span>
                  </span>
                </div>

                <div className="p-4 bg-white border border-blue-200 rounded-2xl shadow-xs relative overflow-hidden">
                  <div className="w-1.5 h-full bg-[#4285F4] absolute left-0 top-0"></div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Event Standing
                  </span>
                  <span className="text-2xl font-black text-slate-900 block mt-0.5">
                    {rank ? `#${rank}` : 'Ranked'}{' '}
                    {totalTeams ? (
                      <span className="text-xs text-slate-400 font-bold">of {totalTeams}</span>
                    ) : null}
                  </span>
                </div>

                <div className="p-4 bg-white border border-green-200 rounded-2xl shadow-xs relative overflow-hidden">
                  <div className="w-1.5 h-full bg-[#34A853] absolute left-0 top-0"></div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Total Attempts
                  </span>
                  <span className="text-2xl font-black text-slate-900 block mt-0.5">
                    {team.totalAttempts || 1}{' '}
                    <span className="text-xs text-emerald-600 font-extrabold">Runs</span>
                  </span>
                </div>
              </div>

              {/* Certificate Signatures & Official Stamp */}
              <div className="pt-6 border-t border-slate-200 flex flex-wrap items-end justify-between gap-6">
                <div className="text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1">
                    <ShieldCheck className="w-4 h-4 text-[#34A853]" />
                    <span>VERIFIED RECORD ID</span>
                  </div>
                  <span className="font-mono text-xs font-black text-slate-800 bg-slate-200/80 px-2.5 py-1 rounded">
                    {team.id}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Issued on {formattedDate}</p>
                </div>

                {/* Event Seal Stamp */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full border-4 border-dashed border-[#EA4335] flex items-center justify-center p-1 text-center bg-red-50/50 transform -rotate-12">
                    <div className="w-full h-full rounded-full border border-[#EA4335] flex flex-col items-center justify-center p-0.5">
                      <span className="text-[7px] font-black text-[#EA4335] uppercase leading-tight">OFFICIAL</span>
                      <Sparkles className="w-3 h-3 text-[#EA4335] my-0.5" />
                      <span className="text-[7px] font-black text-[#EA4335] uppercase leading-tight">STALL SEAL</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-serif italic text-lg font-bold text-slate-800 border-b border-slate-300 pb-0.5 px-2">
                      Dino Arcade Committee
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                      Event Director Signature
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer (Hidden when printing) */}
          <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Tip: Click "Print / Save PDF" to download or print your official certificate.</span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
