import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface UserProfileProps {
  onClose: () => void;
  email?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose, email }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: "La password deve essere di almeno 6 caratteri." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "Le password non coincidono." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setMessage({ type: 'success', text: "Password aggiornata con successo!" });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || "Errore durante l'aggiornamento." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-neutral-900 border border-neutral-700 rounded-xl p-8 max-w-md w-full shadow-2xl relative"
      >
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
            <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-600/20 rounded-full text-red-500">
                <User className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white">Profilo Utente</h2>
                <p className="text-sm text-gray-400">{email || 'Utente CourseFlix'}</p>
            </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="bg-black/40 p-4 rounded-lg border border-neutral-800">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-500" /> Imposta Password
                </h3>
                
                <p className="text-xs text-gray-500 mb-4">
                    Se ti sei registrato tramite link o invito, imposta qui la tua password per accedere in futuro.
                </p>

                <div className="space-y-3">
                    <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nuova Password"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded p-3 text-white focus:ring-2 focus:ring-red-600 focus:outline-none placeholder-gray-500 text-sm"
                    />
                    <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Conferma Password"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded p-3 text-white focus:ring-2 focus:ring-red-600 focus:outline-none placeholder-gray-500 text-sm"
                    />
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Salvataggio...' : <><Save className="w-4 h-4" /> Aggiorna Password</>}
            </button>
        </form>
      </motion.div>
    </div>
  );
};

export default UserProfile;