import React, { useState, useEffect } from 'react';
import { ViewMode, Team } from './types';
import { Header } from './components/Header';
import { RegistrationForm } from './components/RegistrationForm';
import { DinoGame } from './components/DinoGame';
import { Leaderboard } from './components/Leaderboard';
import { AdminPanel } from './components/AdminPanel';
import { AdminPinModal } from './components/AdminPinModal';
import { subscribeToUpdates, getRankedTeams } from './lib/storage';
import { Sparkles, Trophy, Tv, Gamepad2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('play');
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Auto reload active team details when leaderboard updates
  useEffect(() => {
    const handleUpdate = () => {
      if (activeTeam) {
        const teams = getRankedTeams();
        const updated = teams.find((t) => t.id === activeTeam.id);
        if (updated) {
          setActiveTeam(updated);
        }
      }
    };

    return subscribeToUpdates(handleUpdate);
  }, [activeTeam]);

  // Show temporary toast notification
  const triggerToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleTeamRegistered = (newTeam: Team) => {
    setActiveTeam(newTeam);
    triggerToast(`Team "${newTeam.name}" registered! Ready to play! 🦖`);
  };

  const handleSelectExistingTeam = (team: Team) => {
    setActiveTeam(team);
    triggerToast(`Loaded team "${team.name}". Ready for run! 🎮`);
  };

  const handleScoreSubmitted = (updatedTeam: Team, scoreSubmitted: number, isNewHigh: boolean) => {
    setActiveTeam(updatedTeam);
    if (isNewHigh) {
      triggerToast(`🎉 New High Score Record for ${updatedTeam.name}: ${scoreSubmitted.toLocaleString()} pts!`);
    } else {
      triggerToast(`Score ${scoreSubmitted.toLocaleString()} pts logged for ${updatedTeam.name}.`);
    }
  };

  const handleRequestAdminLock = () => {
    setShowAdminPinModal(true);
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminUnlocked(true);
    setShowAdminPinModal(false);
    setCurrentView('admin');
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] text-slate-100 flex flex-col font-sans selection:bg-[#4285F4] selection:text-white relative overflow-hidden">
      {/* Event Top Navigation Bar */}
      <Header
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        activeTeam={activeTeam}
        isAdminUnlocked={isAdminUnlocked}
        onRequestAdminLock={handleRequestAdminLock}
      />

      {/* Main App Content View Container */}
      <main className="flex-1 w-full pb-16 pt-4">
        <AnimatePresence mode="wait">
          {currentView === 'play' && (
            <motion.div
              key="play-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {activeTeam ? (
                <DinoGame
                  activeTeam={activeTeam}
                  onScoreSubmitted={handleScoreSubmitted}
                  onChangeTeam={() => setActiveTeam(null)}
                />
              ) : (
                <RegistrationForm
                  onTeamRegistered={handleTeamRegistered}
                  onSelectExistingTeam={handleSelectExistingTeam}
                />
              )}
            </motion.div>
          )}

          {currentView === 'leaderboard' && (
            <motion.div
              key="leaderboard-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Leaderboard
                onPlayTeam={(team) => {
                  setActiveTeam(team);
                  setCurrentView('play');
                  triggerToast(`Playing as "${team.name}"`);
                }}
              />
            </motion.div>
          )}

          {currentView === 'admin' && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toast Notification Popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3.5 bg-[#EA4335] text-white font-black text-sm rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 flex-shrink-0 animate-bounce" />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin PIN Unlock Modal */}
      <AdminPinModal
        isOpen={showAdminPinModal}
        onClose={() => setShowAdminPinModal(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      <footer className="w-full py-4 border-t border-white/10 bg-black/20 backdrop-blur-md text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2 font-semibold">
          <span>🎮 Chrome Dino Event System • Powered by Google AI Studio</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('play')}
              className="hover:text-[#4285F4] transition-colors cursor-pointer"
            >
              Kiosk Register & Play
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentView('leaderboard')}
              className="hover:text-[#EA4335] transition-colors cursor-pointer"
            >
              TV Leaderboard
            </button>
            <span>•</span>
            <button
              onClick={handleRequestAdminLock}
              className="hover:text-[#34A853] transition-colors cursor-pointer"
            >
              Organizer Panel
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
