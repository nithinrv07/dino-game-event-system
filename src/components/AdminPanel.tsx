import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import {
  getRankedTeams,
  deleteTeam,
  updateTeamScore,
  resetAllData,
  seedDemoData,
  exportToCSV,
  getAdminPin,
  setAdminPin,
  subscribeToUpdates,
} from '../lib/storage';
import {
  ShieldAlert,
  Search,
  Download,
  Trash2,
  Edit3,
  RotateCcw,
  Sparkles,
  Users,
  Trophy,
  Key,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminPanel: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editScoreValue, setEditScoreValue] = useState<number>(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<{ id: string; name: string } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [showPinChange, setShowPinChange] = useState(false);

  const loadData = () => {
    setTeams(getRankedTeams());
  };

  useEffect(() => {
    loadData();
    return subscribeToUpdates(loadData);
  }, []);

  const handleDelete = (teamId: string, teamName: string) => {
    setDeletingTeam({ id: teamId, name: teamName });
  };

  const confirmDeleteTeam = () => {
    if (deletingTeam) {
      deleteTeam(deletingTeam.id);
      setDeletingTeam(null);
      loadData();
    }
  };

  const startEditScore = (team: Team) => {
    setEditingTeamId(team.id);
    setEditScoreValue(team.highScore);
  };

  const saveEditScore = (teamId: string) => {
    updateTeamScore(teamId, editScoreValue);
    setEditingTeamId(null);
    loadData();
  };

  const handleResetLeaderboard = () => {
    resetAllData();
    setShowResetConfirm(false);
    loadData();
  };

  const handleSeedDemo = () => {
    seedDemoData();
    loadData();
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length >= 4) {
      setAdminPin(pinInput.trim());
      setPinSuccessMsg('Admin PIN updated successfully!');
      setPinInput('');
      setTimeout(() => setPinSuccessMsg(''), 3000);
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.player1.toLowerCase().includes(search.toLowerCase()) ||
      t.player2.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Admin Dashboard Header */}
      <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-[#4285F4] text-xs font-black uppercase mb-1">
            <ShieldAlert className="w-3.5 h-3.5" /> EVENT ORGANIZER DASHBOARD
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#202124]">Leaderboard & Team Management</h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-[#34A853] hover:bg-[#2d9248] text-white font-black text-xs rounded-xl shadow transition-colors flex items-center gap-2 cursor-pointer uppercase tracking-tight"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={handleSeedDemo}
            className="px-4 py-2.5 bg-[#4285F4] hover:bg-[#3367d6] text-white font-black text-xs rounded-xl shadow transition-colors flex items-center gap-2 cursor-pointer uppercase tracking-tight"
            title="Seed sample Google-themed teams"
          >
            <Sparkles className="w-4 h-4 text-[#FBBC05]" /> Seed Demo Data
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 bg-red-50 hover:bg-[#EA4335] text-[#EA4335] hover:text-white border border-red-200 font-black text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer uppercase tracking-tight"
          >
            <RotateCcw className="w-4 h-4" /> Reset Leaderboard
          </button>
        </div>
      </div>

      {/* Admin PIN Settings Collapsible */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase">
            <Key className="w-4 h-4 text-[#FBBC05]" />
            Admin Security PIN (Current: <span className="font-mono text-[#4285F4] font-black">{getAdminPin()}</span>)
          </div>
          <button
            onClick={() => setShowPinChange(!showPinChange)}
            className="text-xs text-[#4285F4] hover:underline font-black uppercase cursor-pointer"
          >
            {showPinChange ? 'Hide PIN Settings' : 'Change PIN'}
          </button>
        </div>

        {showPinChange && (
          <form onSubmit={handleChangePin} className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter new 4+ digit PIN"
              className="bg-gray-100 border-2 border-transparent focus:border-[#4285F4] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#202124] font-semibold outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#4285F4] hover:bg-[#3367d6] text-white font-black text-xs rounded-xl cursor-pointer uppercase"
            >
              Save New PIN
            </button>
            {pinSuccessMsg && <span className="text-xs text-[#34A853] font-black">{pinSuccessMsg}</span>}
          </form>
        )}
      </div>

      {/* Filter & Team Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams by name, player, or Team ID..."
            className="w-full bg-gray-100 border-2 border-transparent focus:border-[#4285F4] focus:bg-white rounded-xl py-2 pl-10 pr-4 text-xs text-[#202124] font-semibold outline-none"
          />
        </div>

        <div className="text-xs text-gray-500 font-bold">
          Showing <strong className="text-[#202124]">{filteredTeams.length}</strong> of <strong className="text-[#202124]">{teams.length}</strong> registered teams
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] font-black border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Team ID & Name</th>
                <th className="py-3.5 px-4">Players</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">High Score</th>
                <th className="py-3.5 px-4">Attempts</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 font-bold">
                    No matching teams found.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team, index) => {
                  const rank = index + 1;
                  const isEditing = editingTeamId === team.id;

                  return (
                    <tr key={team.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-black text-sm text-[#202124]">
                        {rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : `#${rank}`}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-black text-[#202124] text-sm">{team.name}</div>
                        <div className="text-[10px] font-mono font-bold text-[#4285F4]">{team.id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-800">{team.player1}</div>
                        <div className="text-gray-500">{team.player2}</div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 font-semibold">{team.contact || 'N/A'}</td>

                      <td className="py-3.5 px-4 font-black text-sm">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editScoreValue}
                              onChange={(e) => setEditScoreValue(Number(e.target.value))}
                              className="w-24 bg-gray-100 border-2 border-[#4285F4] rounded px-2 py-1 text-[#202124] font-mono text-xs font-bold"
                            />
                            <button
                              onClick={() => saveEditScore(team.id)}
                              className="p-1 bg-[#34A853] text-white rounded hover:bg-green-600"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTeamId(null)}
                              className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#4285F4] font-mono text-base font-black">{team.highScore.toLocaleString()}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 font-mono font-bold">{team.totalAttempts || 0}</td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {!isEditing && (
                          <button
                            onClick={() => startEditScore(team)}
                            className="p-1.5 bg-gray-100 hover:bg-[#4285F4] text-gray-700 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-black uppercase"
                            title="Manually edit high score"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit Score
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(team.id, team.name)}
                          className="p-1.5 bg-gray-100 hover:bg-[#EA4335] text-gray-500 hover:text-white rounded-lg transition-colors inline-flex items-center text-[11px] font-black uppercase"
                          title="Delete registration"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Team Confirmation Modal */}
      <AnimatePresence>
        {deletingTeam && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full text-center shadow-2xl space-y-4 border-2 border-[#EA4335]"
            >
              <div className="w-12 h-12 bg-red-100 text-[#EA4335] rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#202124]">Delete Team "{deletingTeam.name}"?</h3>
              <p className="text-xs text-gray-500 font-semibold">
                Are you sure you want to delete team <strong className="text-[#202124]">{deletingTeam.name}</strong> ({deletingTeam.id})? This action cannot be undone.
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

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full text-center shadow-2xl space-y-4 border-2 border-[#EA4335]"
            >
              <div className="w-12 h-12 bg-red-100 text-[#EA4335] rounded-2xl flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#202124]">Reset Leaderboard Data?</h3>
              <p className="text-xs text-gray-500 font-semibold">
                This will delete all registered teams and score histories permanently. Export CSV before proceeding if you need a backup!
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs rounded-xl uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetLeaderboard}
                  className="flex-1 py-2.5 bg-[#EA4335] hover:bg-[#d93025] text-white font-black text-xs rounded-xl shadow-lg uppercase"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
