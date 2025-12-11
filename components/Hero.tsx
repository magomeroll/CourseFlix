import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Upload, Settings, X, Save, Key } from 'lucide-react';
import { Course } from '../types';

interface HeroProps {
  onStart: (query: string) => void;
  onImport: (course: Course) => void;
}

const Hero: React.FC<HeroProps> = ({ onStart, onImport }) => {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem("courseflix_api_key");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onStart(input);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const importedCourse = JSON.parse(content) as Course;
            if (importedCourse.id && importedCourse.title && importedCourse.modules) {
                onImport(importedCourse);
            } else {
                alert("File non valido.");
            }
        } catch (error) {
            alert("Errore importazione.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const saveSettings = () => {
    if (apiKey.trim()) {
        localStorage.setItem("courseflix_api_key", apiKey.trim());
        alert("Chiave API salvata con successo!");
        setShowSettings(false);
    } else {
        localStorage.removeItem("courseflix_api_key");
        alert("Chiave API rimossa.");
        setShowSettings(false);
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".json"
      />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-30">
         <div className="text-red-600 font-extrabold text-2xl tracking-tighter cursor-pointer">COURSEFLIX</div>
         <div className="flex gap-3">
             <button 
                onClick={handleImportClick}
                className="flex items-center gap-2 bg-neutral-900/80 hover:bg-neutral-800 text-white px-4 py-2 rounded-full border border-neutral-700 backdrop-blur-sm transition-all text-sm font-bold uppercase hover:scale-105"
             >
                <Upload className="w-4 h-4" /> Importa Corso
             </button>
             <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 bg-neutral-900/80 hover:bg-neutral-800 text-white p-2 rounded-full border border-neutral-700 backdrop-blur-sm transition-all hover:scale-105"
                title="Impostazioni API Key"
             >
                <Settings className="w-5 h-5" />
             </button>
         </div>
      </div>

      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-105"
        style={{ backgroundImage: 'url("https://picsum.photos/1920/1080?grayscale&blur=2")' }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight"
        >
          Impara qualsiasi cosa. <br />
          <span className="text-red-600">Generato dall'IA.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-xl md:text-2xl text-gray-300 mb-10"
        >
          Corsi professionali, strutturati e pronti in pochi secondi.
        </motion.p>

        <motion.form 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-4 justify-center items-center w-full"
        >
          <div className="relative w-full max-w-lg group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Es. Cucina, Marketing, Yoga, Python..."
              className="block w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-gray-600 rounded-lg text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all backdrop-blur-sm"
            />
          </div>
          <button 
            type="submit"
            className="w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            Inizia <ChevronRight className="w-6 h-6" />
          </button>
        </motion.form>
        
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-sm text-gray-500"
        >
            Potenziato da Google Gemini • Richiede tua API Key
        </motion.div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-neutral-900 border border-neutral-700 rounded-xl p-8 max-w-md w-full shadow-2xl relative"
                >
                    <button 
                        onClick={() => setShowSettings(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                        <Key className="w-6 h-6 text-red-600" /> Configura API Key
                    </h2>
                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                        Per generare i corsi, devi inserire la tua chiave API di Google Gemini.
                        <br/>La chiave viene salvata <strong>solo nel tuo browser</strong> per le visite future.
                        <br />
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-red-500 hover:text-red-400 underline mt-2 inline-block">
                            Clicca qui per ottenere una chiave gratuita.
                        </a>
                    </p>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Google Gemini API Key</label>
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-600 focus:outline-none placeholder-neutral-600"
                            placeholder="Incolla qui la tua chiave (AIzaSy...)"
                        />
                    </div>

                    <button 
                        onClick={saveSettings}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors hover:scale-105 active:scale-95"
                    >
                        <Save className="w-5 h-5" /> Salva e Chiudi
                    </button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Hero;