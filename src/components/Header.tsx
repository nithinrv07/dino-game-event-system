import React from 'react';
import { ViewMode, Team } from '../types';
import { Gamepad2, Tv, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  activeTeam: Team | null;
  isAdminUnlocked: boolean;
  onRequestAdminLock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  activeTeam,
  isAdminUnlocked,
  onRequestAdminLock,
}) => {
  return (
    <header className="w-full bg-slate-900/60 backdrop-blur-xl border-b border-white/10 text-white shadow-lg sticky top-0 z-40">
      {/* Top Google Colors Bar */}
      <div className="h-1 bg-gradient-to-r from-blue-300 via-red-400 via-yellow-300 to-green-400 w-full opacity-80"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-4">
          <div className="bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] p-2.5 rounded-2xl flex items-center justify-center text-2xl">
            🦖
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                DINO SPRINT <span className="opacity-80 font-light">2026</span>
              </h1>
              <span className="bg-[#34A853] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                LIVE EVENT
              </span>
            </div>
            <p className="text-xs text-blue-100 font-medium">Stall Leaderboard Arcade Event</p>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <nav className="flex items-center p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
          {/* Play / Registration View */}
          <button
            onClick={() => onViewChange('play')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentView === 'play'
                ? 'bg-[#4285F4] text-white shadow-[0_0_15px_rgba(66,133,244,0.5)] scale-105'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>PLAY GAME</span>
          </button>

          {/* TV Leaderboard View */}
          <button
            onClick={() => onViewChange('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentView === 'leaderboard'
                ? 'bg-[#FBBC05] text-slate-950 shadow-[0_0_15px_rgba(251,188,5,0.5)] scale-105'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>TV LEADERBOARD</span>
          </button>

          {/* Admin Panel View */}
          <button
            onClick={() => {
              if (isAdminUnlocked) {
                onViewChange('admin');
              } else {
                onRequestAdminLock();
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentView === 'admin'
                ? 'bg-[#34A853] text-white shadow-[0_0_15px_rgba(52,168,83,0.5)] scale-105'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ADMIN</span>
          </button>
        </nav>

        {/* Active Team Indicator in Header */}
        {activeTeam && (
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-white/15 border border-white/25 rounded-2xl text-xs font-bold text-white shadow-inner">
            <UserCheck className="w-4 h-4 text-green-300" />
            <span className="opacity-90">Playing:</span>
            <span className="font-extrabold truncate max-w-[130px]">{activeTeam.name}</span>
            <span className="bg-[#FBBC05] text-slate-950 px-2 py-0.5 rounded-full font-black ml-1 text-[11px]">
              {(activeTeam.highScore || 0).toLocaleString()} pts
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
