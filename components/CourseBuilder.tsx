import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Suggestion } from '../types';
import { ArrowLeft, Loader2, Sparkles, Send } from 'lucide-react';

interface CourseBuilderProps {
  stepTitle: string;
  stepSubtitle: string;
  suggestions: Suggestion[];
  onSelect: (item: Suggestion) => void;
  onCustomInput: (input: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const CourseBuilder: React.FC<CourseBuilderProps> = ({ 
  stepTitle, 
  stepSubtitle, 
  suggestions, 
  onSelect, 
  onCustomInput,
  onBack,
  isLoading 
}) => {
  const [customInput, setCustomInput] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onCustomInput(customInput);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
         <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
         >
            <Loader2 className="w-16 h-16 text-red-600 mb-6" />
         </motion.div>
         <h2 className="text-2xl font-bold text-white animate-pulse">L'IA sta costruendo il tuo corso...</h2>
         <p className="text-gray-400 mt-2">Analisi dei requisiti, scrittura dei moduli e strutturazione dei contenuti.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 md:px-12 pb-24 relative">
      <button 
        onClick={onBack}
        className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Indietro
      </button>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 max-w-4xl"
      >
        <h2 className="text-4xl font-bold mb-3">{stepTitle}</h2>
        <p className="text-gray-400 text-xl">{stepSubtitle}</p>
      </motion.div>

      {/* Grid of AI Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {suggestions.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03, y: -5 }}
            onClick={() => onSelect(item)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 cursor-pointer hover:bg-neutral-800 hover:border-red-600/50 transition-all group flex flex-col justify-between min-h-[250px] relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-5 h-5 text-red-500" />
             </div>
            <div>
              <div className="w-12 h-1 bg-red-600 mb-4 rounded-full group-hover:w-full transition-all duration-500" />
              <h3 className="text-2xl font-bold mb-3 group-hover:text-red-500 transition-colors">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
            </div>
            <div className="mt-4 flex items-center text-white font-semibold text-sm opacity-50 group-hover:opacity-100 transition-opacity">
              Scegli questo percorso <ArrowLeft className="rotate-180 w-4 h-4 ml-1" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom Input Area - Fixed at bottom or inline */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent pt-12 pb-8 px-4 md:px-12 pointer-events-none"
      >
        <div className="max-w-3xl mx-auto pointer-events-auto">
             <form onSubmit={handleCustomSubmit} className="relative">
                <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">
                    Non trovi quello che cerchi? Dai istruzioni specifiche all'IA:
                </label>
                <div className="relative flex items-center">
                    <input 
                        type="text" 
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Es. Voglio un focus specifico su..." 
                        className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-red-600 shadow-2xl placeholder-gray-500"
                    />
                    <button 
                        type="submit"
                        disabled={!customInput.trim()}
                        className="absolute right-2 bg-red-600 p-2 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                </div>
             </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CourseBuilder;