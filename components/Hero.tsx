
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Upload, Settings, X, Save, Key, HelpCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Course } from '../types';
import { testApiKey } from '../services/geminiService';

interface HeroProps {
  onStart: (query: string) => void;
  onImport: (course: Course) => void;
}

const INSTRUCTIONS_HTML = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guida Utente - CourseFlix AI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #000; color: #e5e5e5; }
        .step-number {
            background: #dc2626;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
        }
        .highlight { color: #dc2626; font-weight: bold; }
        .box { background: #111; border: 1px solid #333; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        a { color: #60a5fa; text-decoration: underline; }
    </style>
</head>
<body class="p-6 md:p-12 max-w-4xl mx-auto">

    <header class="mb-12 border-b border-gray-800 pb-8">
        <h1 class="text-4xl font-extrabold text-white mb-2">Guida all'uso <span class="text-red-600">CourseFlix</span></h1>
        <p class="text-gray-400 text-lg">Segui questi semplici passaggi per creare il tuo primo corso in meno di 2 minuti.</p>
    </header>

    <!-- STEP 0: PASSWORD -->
    <div class="box border-yellow-600/50 bg-yellow-900/10">
        <div class="flex items-start gap-4">
            <div class="step-number bg-yellow-600 text-black">!</div>
            <div>
                <h2 class="text-2xl font-bold text-white mb-4">Primo Accesso: Imposta la Password</h2>
                <p class="mb-4 text-gray-300">Se sei entrato tramite un <strong>link di invito</strong> o un'email di conferma, non hai ancora una password.</p>
                <ol class="list-decimal list-inside space-y-2 text-gray-300 ml-2">
                    <li>Una volta dentro l'app, clicca sul pulsante <strong>PROFILO</strong> in alto a sinistra.</li>
                    <li>Inserisci una nuova password nei campi appositi.</li>
                    <li>Clicca su <strong>Aggiorna Password</strong>.</li>
                </ol>
                <p class="mt-4 text-sm text-gray-400">⚠️ Questo passaggio è fondamentale per poter rientrare nell'app in futuro senza dover richiedere un nuovo link via email.</p>
            </div>
        </div>
    </div>

    <!-- STEP 1: API KEY -->
    <div class="box border-red-900/50 bg-red-950/10">
        <div class="flex items-start gap-4">
            <div class="step-number">1</div>
            <div>
                <h2 class="text-2xl font-bold text-white mb-4">Configurare la Chiave API (Gratis)</h2>
                <p class="mb-4">Per far funzionare l'Intelligenza Artificiale, hai bisogno di una "chiave" gratuita fornita da Google. È facile da ottenere:</p>
                
                <ol class="list-decimal list-inside space-y-3 ml-2 text-gray-300">
                    <li>Apri questo link: <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>.</li>
                    <li>Accedi con il tuo account <strong>Google/Gmail</strong>.</li>
                    <li>Clicca sul pulsante blu <strong>"Create API key"</strong>.</li>
                    <li>Seleziona "Create API key in new project" (o un progetto esistente se ne hai uno).</li>
                    <li>Apparirà una stringa lunga che inizia con <code>AIza...</code>. <strong>Copiala</strong>.</li>
                    <li>Torna su CourseFlix, clicca l'icona dell'<strong>Ingranaggio</strong> in alto a destra.</li>
                    <li>Incolla la chiave e clicca <strong>Salva</strong>.</li>
                </ol>
                <div class="mt-4 bg-black p-3 rounded text-sm text-gray-400 border border-gray-700">
                    💡 <strong>Nota:</strong> Questa operazione va fatta una volta sola. Il browser ricorderà la tua chiave.
                </div>
            </div>
        </div>
    </div>

    <!-- STEP 2: CREAZIONE -->
    <div class="box">
        <div class="flex items-start gap-4">
            <div class="step-number">2</div>
            <div>
                <h2 class="text-2xl font-bold text-white mb-4">Generare un Corso</h2>
                <ul class="space-y-3 text-gray-300">
                    <li>Nella schermata principale, scrivi l'argomento che ti interessa (es. <em>"Yoga per la schiena"</em> o <em>"Programmare in Python"</em>) e premi Invio.</li>
                    <li>L'IA ti suggerirà prima delle <strong>Macro-Categorie</strong>. Scegline una.</li>
                    <li>Successivamente ti proporrà delle <strong>Nicchie Specifiche</strong>. Seleziona quella che preferisci.</li>
                    <li>Attendi qualche secondo: l'IA sta scrivendo il programma completo (moduli e titoli delle lezioni).</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- STEP 3: CONTENUTI -->
    <div class="box">
        <div class="flex items-start gap-4">
            <div class="step-number">3</div>
            <div>
                <h2 class="text-2xl font-bold text-white mb-4">Vedere i Contenuti</h2>
                <p class="text-gray-300 mb-4">
                    Una volta generata la struttura, ti troverai nella dashboard del corso.
                </p>
                <ul class="space-y-3 text-gray-300">
                    <li>Clicca su una <strong>Lezione</strong> nel menu a destra per aprirla.</li>
                    <li>La prima volta che apri una lezione, l'IA impiegherà qualche secondo per <strong>scrivere il testo</strong> e <strong>disegnare l'immagine</strong> di copertina.</li>
                    <li>Se vuoi generare tutto subito, clicca il tasto rosso in alto a destra <strong>"GENERA CORSO COMPLETO"</strong>.</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- STEP 4: ESPORTAZIONE -->
    <div class="box">
        <div class="flex items-start gap-4">
            <div class="step-number">4</div>
            <div>
                <h2 class="text-2xl font-bold text-white mb-4">Esportare e Vendere</h2>
                <p class="text-gray-300 mb-4">
                    Usa i pulsanti nella barra in alto per scaricare il tuo lavoro:
                </p>
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="p-4 bg-zinc-900 rounded border border-zinc-800">
                        <strong class="text-blue-400">Scarica E-book (PDF)</strong><br>
                        Scarica l'intero corso impaginato come un libro PDF professionale. Perfetto per essere venduto su Gumroad o Amazon.
                    </div>
                    <div class="p-4 bg-zinc-900 rounded border border-zinc-800">
                        <strong class="text-green-500">Landing Page (HTML)</strong><br>
                        Scarica una pagina web pronta all'uso per vendere il corso. Dovrai solo inserire il tuo link di pagamento (PayPal/Stripe).
                    </div>
                    <div class="p-4 bg-zinc-900 rounded border border-zinc-800">
                        <strong class="text-gray-400">Esporta (JSON)</strong><br>
                        Salva il file del corso sul tuo PC per poterlo ricaricare e modificare in futuro usando il tasto "Importa".
                    </div>
                </div>
            </div>
        </div>
    </div>

    <footer class="mt-12 text-center text-gray-500 text-sm">
        &copy; CourseFlix AI - Piattaforma Didattica Intelligente
    </footer>

</body>
</html>
`;

const Hero: React.FC<HeroProps> = ({ onStart, onImport }) => {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [testingKey, setTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'success' | 'error'>('idle');
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

  const handleInstructionsClick = () => {
    // Generate a Blob URL to avoid 404 errors on hosting
    const blob = new Blob([INSTRUCTIONS_HTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
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

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;
    setTestingKey(true);
    setKeyStatus('idle');
    const isValid = await testApiKey(apiKey.trim());
    setTestingKey(false);
    setKeyStatus(isValid ? 'success' : 'error');
  };

  const saveSettings = () => {
    if (apiKey.trim()) {
        localStorage.setItem("courseflix_api_key", apiKey.trim());
        if (keyStatus !== 'success') {
            alert("Chiave salvata, ma attenzione: il test di validità non è stato superato o eseguito.");
        } else {
            alert("Chiave API salvata e verificata con successo!");
        }
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
                onClick={handleInstructionsClick}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full border border-green-500 backdrop-blur-sm transition-all text-sm font-bold uppercase hover:scale-105 shadow-lg shadow-green-900/20"
             >
                <HelpCircle className="w-4 h-4" /> Istruzioni
             </button>
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
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Google Gemini API Key</label>
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => { setApiKey(e.target.value); setKeyStatus('idle'); }}
                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-600 focus:outline-none placeholder-neutral-600"
                            placeholder="Incolla qui la tua chiave (AIzaSy...)"
                        />
                    </div>

                    {/* Status & Test Button */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-sm">
                            {keyStatus === 'success' && <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Chiave Valida!</span>}
                            {keyStatus === 'error' && <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Chiave Errata</span>}
                        </div>
                        <button 
                            onClick={handleTestKey}
                            disabled={testingKey || !apiKey}
                            className="text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 rounded border border-neutral-600 transition"
                        >
                            {testingKey ? <Loader2 className="w-4 h-4 animate-spin"/> : "Testa Chiave"}
                        </button>
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
