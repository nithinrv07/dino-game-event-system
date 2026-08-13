import React, { useState } from 'react';
import { Team } from '../types';
import { registerTeam, getTeams, deleteTeam } from '../lib/storage';
import { audio } from '../lib/audio';
import { Users, User, Phone, Sparkles, Play, Search, ArrowRight, CheckCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegistrationFormProps {
  onTeamRegistered: (team: Team) => void;
  onSelectExistingTeam: (team: Team) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onTeamRegistered,
  onSelectExistingTeam,
}) => {
  const [teamName, setTeamName] = useState('');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'new' | 'existing'>('new');
  const [deletingTeam, setDeletingTeam] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteTeam = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
    setDeletingTeam({ id: team.id, name: team.name });
  };

  const confirmDeleteTeam = () => {
    if (deletingTeam) {
      deleteTeam(deletingTeam.id);
      setDeletingTeam(null);
    }
  };

  const existingTeams = getTeams();
  const filteredTeams = existingTeams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.player1.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.player2.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError('Please enter a Team Name.');
      return;
    }
    if (!player1.trim() || !player2.trim()) {
      setError('Both Player 1 and Player 2 names are required.');
      return;
    }

    setError('');
    audio.playClick();

    const newTeam = await registerTeam({
      name: teamName,
      player1,
      player2,
      contact,
    });

    onTeamRegistered(newTeam);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Registration / Team Selection Column (2 cols) */}
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/10 relative overflow-hidden flex flex-col justify-between text-white">
        {/* Top Google accent indicator */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]"></div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#EA4335]/10 text-[#EA4335] rounded-2xl flex items-center justify-center text-2xl font-black shrink-0">
              🦖
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#EA4335] tracking-tight">JOIN THE RACE</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Two-Player Team Arcade Challenge</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl mb-6">
            <button
              onClick={() => {
                setTab('new');
                audio.playClick();
              }}
              className={`py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'new'
                  ? 'bg-[#EA4335] text-white shadow-[0_0_15px_rgba(234,67,53,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              New Registration
            </button>

            <button
              onClick={() => {
                setTab('existing');
                audio.playClick();
              }}
              className={`py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'existing'
                  ? 'bg-[#4285F4] text-white shadow-[0_0_15px_rgba(66,133,244,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              Registered Teams ({existingTeams.length})
            </button>
          </div>

          {tab === 'new' ? (
            <motion.form
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4 text-left"
            >
              {error && (
                <div className="p-3 bg-red-100 border-2 border-red-200 rounded-xl text-red-600 text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Team Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                  Team Name <span className="text-[#EA4335]">*</span>
                </label>
                <div className="relative">
                  <Users className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Pixel Predators"
                    maxLength={32}
                    className="w-full px-4 py-3 pl-11 bg-white/10 border-2 border-transparent rounded-xl focus:border-[#4285F4] focus:bg-white/20 outline-none font-semibold text-white placeholder-gray-400 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Players Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Player 1 */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                    Player 1 <span className="text-[#EA4335]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-[#4285F4] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={player1}
                      onChange={(e) => setPlayer1(e.target.value)}
                      placeholder="Player 1 Name"
                      maxLength={24}
                      className="w-full px-4 py-3 pl-11 bg-white/10 border-2 border-transparent rounded-xl focus:border-[#4285F4] focus:bg-white/20 outline-none font-semibold text-white placeholder-gray-400 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Player 2 */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                    Player 2 <span className="text-[#EA4335]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-[#34A853] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={player2}
                      onChange={(e) => setPlayer2(e.target.value)}
                      placeholder="Player 2 Name"
                      maxLength={24}
                      className="w-full px-4 py-3 pl-11 bg-white/10 border-2 border-transparent rounded-xl focus:border-[#4285F4] focus:bg-white/20 outline-none font-semibold text-white placeholder-gray-400 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Optional Contact */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                  Contact Phone / Email <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="For winner announcements"
                    maxLength={40}
                    className="w-full px-4 py-3 pl-11 bg-white/10 border-2 border-transparent rounded-xl focus:border-[#4285F4] focus:bg-white/20 outline-none font-semibold text-white placeholder-gray-400 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#EA4335] hover:bg-[#d93025] text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all uppercase tracking-tight flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-current text-white" />
                  START GAME NOW
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 text-left"
            >
              {/* Search filter */}
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search registered team..."
                  className="w-full bg-white/10 border-2 border-transparent focus:border-[#4285F4] focus:bg-white/20 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-400 text-sm font-semibold outline-none"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filteredTeams.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm font-medium">
                    No registered teams found.
                  </div>
                ) : (
                  filteredTeams.map((team) => (
                    <div
                      key={team.id}
                      onClick={() => {
                        audio.playClick();
                        onSelectExistingTeam(team);
                      }}
                      className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-[#4285F4] px-2 py-0.5 rounded bg-blue-100 border border-blue-200">
                            {team.id}
                          </span>
                          <h4 className="text-sm font-black text-white group-hover:text-blue-200 transition-colors">
                            {team.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                          {team.player1} & {team.player2} • {team.totalAttempts || 0} attempts
                        </p>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-bold block uppercase">High Score</span>
                          <span className="text-sm font-black text-[#EA4335]">
                            {team.highScore.toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteTeam(e, team)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#EA4335] rounded-lg transition-colors cursor-pointer"
                          title="Delete Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#4285F4] transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Delete Team Confirmation Modal */}
        <AnimatePresence>
          {deletingTeam && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl space-y-4 text-white"
              >
                <div className="w-12 h-12 bg-red-100 text-[#EA4335] rounded-2xl flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-[#202124]">Delete Team "{deletingTeam.name}"?</h3>
                <p className="text-xs text-gray-500 font-semibold">
                  Are you sure you want to delete <strong className="text-[#202124]">{deletingTeam.name}</strong> ({deletingTeam.id})? This will remove all their score logs permanently.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setDeletingTeam(null)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs rounded-xl uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteTeam}
                    className="flex-1 py-2.5 bg-[#EA4335] hover:bg-[#d93025] text-white font-black text-xs rounded-xl shadow-lg uppercase cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Yellow How-To-Play Guide Card */}
      <div className="bg-[#FBBC05] text-[#202124] rounded-3xl p-8 shadow-lg flex flex-col justify-center items-center text-center gap-4">
        <div className="w-20 h-20 bg-white/80 rounded-3xl flex items-center justify-center text-5xl shadow-md">
          🦖
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight">How to Play</h3>
        <p className="text-sm font-semibold leading-relaxed opacity-90 max-w-xs">
          Press <span className="bg-white px-2 py-1 rounded shadow-sm text-xs font-black">SPACE</span> or{' '}
          <span className="bg-white px-2 py-1 rounded shadow-sm text-xs font-black">UP ARROW</span> to jump over cacti and pterodactyls!
        </p>
        <p className="text-xs font-bold text-[#202124]/70 max-w-xs">
          Survive as long as possible. The team with the highest combined survival score tops the event leaderboard!
        </p>
      </div>
    </div>
  );
};
