import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { motion } from 'framer-motion';
import { Loader2, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenziali non valide. Controlla email e password.");
      setLoading(false);
    } else {
      // Il listener in App.tsx gestirà il reindirizzamento
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-50 z-0 scale-105"
        style={{ backgroundImage: 'url("https://picsum.photos/1920/1080?grayscale&blur=2")' }}
      ></div>
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      {/* Login Box */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 bg-black/75 backdrop-blur-md border border-neutral-800 p-12 rounded-xl w-full max-w-md shadow-2xl"
      >
        <h2 className="text-3xl font-bold text-white mb-8">Accedi</h2>
        
        {error && (
          <div className="bg-orange-500/20 border border-orange-500 text-orange-200 p-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email o numero di telefono"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#333] text-white rounded px-4 py-4 border-none focus:ring-2 focus:ring-red-600 focus:outline-none placeholder-gray-400"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#333] text-white rounded px-4 py-4 border-none focus:ring-2 focus:ring-red-600 focus:outline-none placeholder-gray-400"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded transition-all mt-4 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Accedi"}
          </button>
        </form>

        <div className="mt-8 text-neutral-400 text-sm">
          <p className="mb-4">
            Prima volta su CourseFlix? <br/>
            <a href="https://www.courseflix.it" className="text-white hover:underline">Acquista l'accesso sul sito ufficiale.</a>
          </p>
          <p className="text-xs text-neutral-500 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Pagina protetta da Google reCAPTCHA.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;