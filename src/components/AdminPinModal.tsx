import React, { useState } from 'react';
import { verifyAdminPin } from '../lib/storage';
import { Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(pin)) {
      setError('');
      setPin('');
      onSuccess();
    } else {
      setError('Incorrect Admin PIN code (Default PIN is 1234)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-2xl relative text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#4285F4] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-black text-[#202124]">Admin Access</h3>
        <p className="text-xs text-gray-500 font-semibold mt-1 mb-6">
          Enter organizer PIN to manage teams, edit scores, or export data.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-[#EA4335] text-xs font-black flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN (Default: 1234)"
                maxLength={10}
                className="w-full bg-gray-100 border-2 border-transparent focus:border-[#4285F4] focus:bg-white rounded-xl py-2.5 pl-11 pr-4 text-[#202124] font-black text-center font-mono text-lg tracking-widest outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs rounded-xl transition-colors cursor-pointer uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#4285F4] hover:bg-[#3367d6] text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase"
            >
              <CheckCircle2 className="w-4 h-4" /> Unlock Admin
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
