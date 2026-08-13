import React, { useEffect, useState } from 'react';
import { Team, EventStats } from '../types';
import { getRankedTeams, getEventStats, subscribeToUpdates } from '../lib/storage';
import { Trophy, Medal, Flame, Users, Maximize2, Minimize2, Search, Sparkles, RefreshCw, Play, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CertificateModal } from './CertificateModal';

interface LeaderboardProps {
  onPlayTeam?: (team: Team) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onPlayTeam }) => {
  const [rankedTeams, setRankedTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<EventStats>({
    totalTeams: 0,
    totalGamesPlayed: 0,
    topScore: 0,
    topTeamName: 'N/A',
    latestScore: null,
  });
  const [search, setSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [certificateData, setCertificateData] = useState<{ team: Team; rank: number } | null>(null);

  const reloadData = () => {
    const teams = getRankedTeams();
    setRankedTeams(teams);
    setStats(getEventStats());
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = subscribeToUpdates(() => {
      reloadData();
    });
    // Interval polling for TV kiosk display
    const intervalId = setInterval(reloadData, 2000);
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const filteredTeams = rankedTeams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.player1.toLowerCase().includes(search.toLowerCase()) ||
      t.player2.toLowerCase().includes(search.toLowerCase())
  );

  const top1 = filteredTeams[0];
  const top2 = filteredTeams[1];
  const top3 = filteredTeams[2];
  const restTeams = filteredTeams.slice(3);

  return (
    <div className={`w-full max-w-6xl mx-auto p-4 sm:p-6 transition-all ${isFullscreen ? 'bg-slate-950 p-8' : ''}`}>
      {/* Event Top Banner & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/10 text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EA4335] animate-ping"></span>
            <span className="text-xs font-black uppercase tracking-widest text-[#EA4335]">LIVE STALL LEADERBOARD</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Dino Runner Champions</span>
            <Sparkles className="w-7 h-7 text-[#FBBC05]" />
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team or player..."
              className="bg-white/10 border-2 border-transparent focus:border-[#4285F4] focus:bg-white/20 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-gray-400 font-semibold outline-none w-44 sm:w-56"
            />
          </div>

          <button
            onClick={reloadData}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white transition-colors cursor-pointer"
            title="Refresh Leaderboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-[#4285F4] hover:bg-[#3367d6] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer uppercase tracking-tight"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'TV Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Metric 1: Total Teams */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden shadow-sm">
          <div className="w-2 rounded-full h-full bg-[#4285F4] absolute left-0 top-0 bottom-0"></div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500 block uppercase">Total Teams</span>
            <span className="text-2xl font-black text-white">{stats.totalTeams}</span>
          </div>
        </div>

        {/* Metric 2: Top Event Score */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden shadow-sm">
          <div className="w-2 rounded-full h-full bg-[#FBBC05] absolute left-0 top-0 bottom-0"></div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#FBBC05] flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500 block uppercase">Highest Score</span>
            <span className="text-2xl font-black text-white">{stats.topScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 3: Total Games Played */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden shadow-sm">
          <div className="w-2 rounded-full h-full bg-[#34A853] absolute left-0 top-0 bottom-0"></div>
          <div className="w-10 h-10 rounded-xl bg-green-50 text-[#34A853] flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500 block uppercase">Total Runs</span>
            <span className="text-2xl font-black text-white">{stats.totalGamesPlayed}</span>
          </div>
        </div>

        {/* Metric 4: Latest Score Ticker */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden shadow-sm">
          <div className="w-2 rounded-full h-full bg-[#EA4335] absolute left-0 top-0 bottom-0"></div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#EA4335] flex items-center justify-center font-bold">
            ⚡
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-gray-500 block uppercase">Latest Score</span>
            {stats.latestScore ? (
              <span className="text-sm font-bold text-white truncate block">
                {stats.latestScore.teamName}:{' '}
                <strong className="text-[#EA4335] font-extrabold">{stats.latestScore.score.toLocaleString()}</strong>
              </span>
            ) : (
              <span className="text-sm text-gray-400 font-medium">No attempts yet</span>
            )}
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM SECTION */}
      {filteredTeams.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider text-center mb-4">
            🏆 Event Podium Champions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6">
            {/* Rank 2 - Silver/Blue (Left on Desktop, 2nd place) */}
            {top2 && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="order-2 md:order-1 bg-gradient-to-br from-[#4285F4] to-blue-600 text-white rounded-3xl p-6 text-center relative shadow-xl border-2 border-blue-400"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Medal className="w-6 h-6" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white font-black text-xs mb-2 uppercase">
                  🥈 2nd PLACE
                </span>
                <h3
                  onClick={() => setCertificateData({ team: top2, rank: 2 })}
                  className="text-xl font-black text-white truncate cursor-pointer hover:underline flex items-center justify-center gap-1.5 group"
                  title="Click to view & print participation certificate"
                >
                  <span>{top2.name}</span>
                  <Award className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
                </h3>
                <p className="text-xs text-blue-100 mt-1 mb-3 font-medium">
                  {top2.player1} & {top2.player2}
                </p>
                <div className="text-3xl font-black text-white tracking-tight">
                  {top2.highScore.toLocaleString()} <span className="text-xs text-blue-100 font-bold">pts</span>
                </div>
                {onPlayTeam && (
                  <button
                    onClick={() => onPlayTeam(top2)}
                    className="mt-4 w-full py-2 bg-white text-[#4285F4] hover:bg-blue-50 text-xs font-black rounded-xl transition-all shadow cursor-pointer uppercase"
                  >
                    Play Again
                  </button>
                )}
              </motion.div>
            )}

            {/* Rank 1 - Gold (Center, 1st place taller height) */}
            {top1 && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="order-1 md:order-2 bg-gradient-to-br from-[#FBBC05] via-amber-400 to-yellow-500 text-slate-950 rounded-3xl p-7 text-center relative shadow-2xl border-4 border-amber-300 transform md:-translate-y-4"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#202124] text-[#FBBC05] font-black text-xs tracking-wider uppercase shadow-lg flex items-center gap-1">
                  👑 OVERALL LEADER
                </div>

                <div className="w-16 h-16 rounded-3xl bg-slate-950/10 text-slate-950 flex items-center justify-center mx-auto mb-3 mt-2 shadow-lg">
                  <Trophy className="w-8 h-8 text-slate-950" />
                </div>
                <span className="inline-block px-3.5 py-1 rounded-full bg-slate-950/10 text-slate-950 font-black text-xs mb-2 uppercase">
                  🥇 1st PLACE
                </span>
                <h3
                  onClick={() => setCertificateData({ team: top1, rank: 1 })}
                  className="text-2xl font-black text-slate-950 truncate cursor-pointer hover:underline flex items-center justify-center gap-1.5 group"
                  title="Click to view & print participation certificate"
                >
                  <span>{top1.name}</span>
                  <Award className="w-5 h-5 text-amber-900 group-hover:scale-110 transition-transform" />
                </h3>
                <p className="text-xs text-slate-900 mt-1 mb-3 font-extrabold">
                  {top1.player1} & {top1.player2}
                </p>
                <div className="text-4xl font-black text-slate-950 tracking-tight">
                  {top1.highScore.toLocaleString()} <span className="text-sm font-bold text-slate-800">pts</span>
                </div>
                {onPlayTeam && (
                  <button
                    onClick={() => onPlayTeam(top1)}
                    className="mt-4 w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-[#FBBC05] font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-tight"
                  >
                    Play Again
                  </button>
                )}
              </motion.div>
            )}

            {/* Rank 3 - Bronze/Red (Right on Desktop, 3rd place) */}
            {top3 && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="order-3 bg-gradient-to-br from-[#EA4335] to-red-600 text-white rounded-3xl p-6 text-center relative shadow-xl border-2 border-red-400"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Medal className="w-6 h-6" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white font-black text-xs mb-2 uppercase">
                  🥉 3rd PLACE
                </span>
                <h3
                  onClick={() => setCertificateData({ team: top3, rank: 3 })}
                  className="text-xl font-black text-white truncate cursor-pointer hover:underline flex items-center justify-center gap-1.5 group"
                  title="Click to view & print participation certificate"
                >
                  <span>{top3.name}</span>
                  <Award className="w-4 h-4 text-red-200 group-hover:scale-110 transition-transform" />
                </h3>
                <p className="text-xs text-red-100 mt-1 mb-3 font-medium">
                  {top3.player1} & {top3.player2}
                </p>
                <div className="text-3xl font-black text-white tracking-tight">
                  {top3.highScore.toLocaleString()} <span className="text-xs text-red-100 font-bold">pts</span>
                </div>
                {onPlayTeam && (
                  <button
                    onClick={() => onPlayTeam(top3)}
                    className="mt-4 w-full py-2 bg-white text-[#EA4335] hover:bg-red-50 text-xs font-black rounded-xl transition-all shadow cursor-pointer uppercase"
                  >
                    Play Again
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* FULL RANKINGS LIST TABLE (Ranks 4+ and complete listing) */}
      <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 overflow-hidden shadow-xl text-white">
        <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FBBC05]" />
            Complete Event Rankings ({filteredTeams.length})
          </h2>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#4285F4] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <Award className="w-3.5 h-3.5 text-[#4285F4]" /> Click team name to print certificate
            </span>
            <span className="text-xs font-bold text-[#34A853]">Auto-Updates Live</span>
          </div>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold">No teams registered yet.</p>
            <p className="text-xs text-gray-400 mt-1">Register a team to start building the leaderboard!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence initial={false}>
              {filteredTeams.map((team, idx) => {
                const rank = idx + 1;
                let rankBadgeClass = 'bg-white/10 text-white border-white/20 font-bold';
                if (rank === 1) rankBadgeClass = 'bg-[#FBBC05] text-slate-950 border-amber-400 font-black';
                else if (rank === 2) rankBadgeClass = 'bg-[#4285F4] text-white border-blue-400 font-black';
                else if (rank === 3) rankBadgeClass = 'bg-[#EA4335] text-white border-red-400 font-black';

                return (
                  <motion.div
                    key={team.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                      rank === 1 ? 'bg-amber-50/20' : rank === 2 ? 'bg-blue-50/20' : rank === 3 ? 'bg-red-50/20' : 'hover:bg-white/10'
                    }`}
                  >
                    {/* Left: Rank & Team Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-sm font-black flex-shrink-0 shadow-sm ${rankBadgeClass}`}
                      >
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setCertificateData({ team, rank })}
                            className="text-base font-black text-white hover:text-blue-300 hover:underline truncate cursor-pointer text-left flex items-center gap-1.5 group"
                            title="Click to generate & print team certificate"
                          >
                            <span>{team.name}</span>
                            <Award className="w-4 h-4 text-gray-400 group-hover:text-[#4285F4] group-hover:scale-110 transition-all" />
                          </button>
                          <span className="text-[10px] font-bold text-[#4285F4] px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                            {team.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate font-medium">
                          Players: <strong className="text-white">{team.player1}</strong> &{' '}
                          <strong className="text-white">{team.player2}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Right: Score & Actions */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-black text-[#4285F4] tracking-tight block">
                          {team.highScore.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">
                          {team.totalAttempts || 0} attempt{team.totalAttempts === 1 ? '' : 's'}
                        </span>
                      </div>

                      <button
                        onClick={() => setCertificateData({ team, rank })}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer uppercase shadow-2xs"
                        title="Print Certificate"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden sm:inline text-amber-900">Certificate</span>
                      </button>

                      {onPlayTeam && (
                        <button
                          onClick={() => onPlayTeam(team)}
                          className="px-3.5 py-2 bg-white/10 hover:bg-[#4285F4] text-white hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 border border-white/20 cursor-pointer uppercase"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden sm:inline">Play</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* CERTIFICATE MODAL POPUP */}
      <CertificateModal
        team={certificateData?.team || null}
        rank={certificateData?.rank}
        totalTeams={rankedTeams.length}
        onClose={() => setCertificateData(null)}
      />
    </div>
  );
};
