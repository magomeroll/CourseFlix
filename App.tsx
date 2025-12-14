import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import Login from './components/Login';
import Hero from './components/Hero';
import CourseBuilder from './components/CourseBuilder';
import CourseViewer from './components/CourseViewer';
import UserProfile from './components/UserProfile';
import { AppState, Suggestion, Course, Lesson } from './types';
import { suggestCategories, suggestSpecificTopics, generateCourseStructure, generateLessonContent, generateLessonImage, generateCourseIntro } from './services/geminiService';
import { LogOut, AlertTriangle, ArrowRight, UserCog } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [userQuery, setUserQuery] = useState('');
  const [categories, setCategories] = useState<Suggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Suggestion | null>(null);
  const [topics, setTopics] = useState<Suggestion[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Suggestion | null>(null);
  const [generatedCourse, setGeneratedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Safety Check State
  const [isConfigured] = useState(isSupabaseConfigured());
  const [bypassAuth, setBypassAuth] = useState(false);

  // Auth Listener
  useEffect(() => {
    if (!isConfigured) return;

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      // Se l'utente arriva da un link di reset password, apri automaticamente il profilo
      if (event === 'PASSWORD_RECOVERY') {
        setShowProfile(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  // Logout function
  const handleLogout = async () => {
    if (isConfigured) {
        await supabase.auth.signOut();
    } else {
        setBypassAuth(false);
    }
    handleReset();
    setShowProfile(false);
  };


  // --- 1. HOME ---
  const handleStart = async (query: string) => {
    setUserQuery(query);
    setAppState(AppState.SELECTING_CATEGORY);
    setIsLoading(true);
    const results = await suggestCategories(query);
    setCategories(results);
    setIsLoading(false);
  };

  const handleImportCourseFromHero = (course: Course) => {
      setGeneratedCourse(course);
      setAppState(AppState.COURSE_VIEW);
  };

  // --- 2. CATEGORY SELECTION ---
  const handleSelectCategory = async (category: Suggestion) => {
    setSelectedCategory(category);
    await fetchTopics(category.title);
  };

  const handleCustomCategory = async (customInput: string) => {
    const customCat: Suggestion = { id: 'custom', title: customInput, description: 'Personalizzato' };
    setSelectedCategory(customCat);
    await fetchTopics(customInput, customInput); 
  };

  const fetchTopics = async (categoryTitle: string, refinement?: string) => {
    setAppState(AppState.SELECTING_TOPIC);
    setIsLoading(true);
    const results = await suggestSpecificTopics(categoryTitle, refinement);
    setTopics(results);
    setIsLoading(false);
  };

  // --- 3. TOPIC SELECTION ---
  const handleSelectTopic = async (topic: Suggestion) => {
    setSelectedTopic(topic);
    await createCourse(topic.title);
  };

  const handleCustomTopic = async (customInput: string) => {
    const customTop: Suggestion = { id: 'custom-topic', title: customInput, description: 'Personalizzato' };
    setSelectedTopic(customTop);
    await createCourse(customInput, customInput);
  };

  const createCourse = async (topicTitle: string, refinement?: string) => {
    setAppState(AppState.GENERATING);
    setIsLoading(true);
    const fullContext = selectedCategory ? `${selectedCategory.title} -> ${topicTitle}` : topicTitle;
    
    const course = await generateCourseStructure(fullContext, refinement);
    if (course) {
      setGeneratedCourse(course);
      setAppState(AppState.COURSE_VIEW);
    } else {
      alert("Errore nella generazione del corso. Controlla la tua API Key nelle impostazioni.");
      setAppState(AppState.HOME);
    }
    setIsLoading(false);
  };

  // --- 4. LESSON CONTENT ---
  const handleGenerateLessonContent = async (lesson: Lesson): Promise<string> => {
    if (!generatedCourse) return "";
    return await generateLessonContent(generatedCourse.title, lesson.title, lesson.description);
  };

  const handleGenerateLessonImage = async (lesson: Lesson): Promise<string | null> => {
     if (!generatedCourse) return null;
     return await generateLessonImage(generatedCourse.title, lesson.title);
  };
  
  const handleGenerateCourseIntro = async (title: string, desc: string): Promise<string> => {
      return await generateCourseIntro(title, desc);
  };

  const handleReset = () => {
    setAppState(AppState.HOME);
    setUserQuery('');
    setCategories([]);
    setTopics([]);
    setGeneratedCourse(null);
    setSelectedCategory(null);
    setSelectedTopic(null);
  };

  // --- RENDERING SAFETY ---
  if (!isConfigured && !bypassAuth) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-white text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mb-6" />
              <h1 className="text-3xl font-bold mb-4">Supabase non configurato</h1>
              <p className="text-gray-400 max-w-lg mb-8">
                  Hai attivato la modalità "Login Protetto" ma non hai ancora inserito le chiavi API di Supabase nel file <code>services/supabaseClient.ts</code>.
              </p>
              <div className="flex gap-4">
                  <button 
                    onClick={() => setBypassAuth(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition"
                  >
                      Modalità Demo (Bypass Login) <ArrowRight className="w-4 h-4" />
                  </button>
              </div>
              <p className="mt-8 text-xs text-gray-600">
                  Per configurare il login reale, modifica il codice inserendo le chiavi del tuo progetto Supabase.
              </p>
          </div>
      );
  }

  if (isConfigured && !session && !bypassAuth) {
    return <Login />;
  }

  return (
    <div className="bg-black min-h-screen text-white relative">
      {/* Top Left Controls */}
      <div className="fixed top-6 left-6 z-50 flex flex-col gap-2">
          <button 
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest transition-colors bg-neutral-900/80 hover:bg-neutral-800 text-white p-3 rounded backdrop-blur border border-neutral-700 shadow-lg"
            title="Profilo Utente"
          >
            <UserCog className="w-4 h-4" /> Profilo
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest transition-colors bg-black/50 hover:bg-red-900/50 text-gray-400 hover:text-white p-3 rounded backdrop-blur"
            title="Esci"
          >
            <LogOut className="w-4 h-4" /> Esci
          </button>
      </div>

      {showProfile && (
        <UserProfile 
            onClose={() => setShowProfile(false)} 
            email={session?.user?.email} 
        />
      )}

      {appState === AppState.HOME && (
        <Hero onStart={handleStart} onImport={handleImportCourseFromHero} />
      )}

      {appState === AppState.SELECTING_CATEGORY && (
        <CourseBuilder
          stepTitle="Scegli il settore"
          stepSubtitle={`Abbiamo individuato queste aree per "${userQuery}". Scegli o specifica meglio.`}
          suggestions={categories}
          onSelect={handleSelectCategory}
          onCustomInput={handleCustomCategory}
          onBack={handleReset}
          isLoading={isLoading}
        />
      )}

      {appState === AppState.SELECTING_TOPIC && (
        <CourseBuilder
          stepTitle="Definisci la nicchia"
          stepSubtitle={`Ecco alcune idee specifiche per "${selectedCategory?.title}".`}
          suggestions={topics}
          onSelect={handleSelectTopic}
          onCustomInput={handleCustomTopic}
          onBack={() => setAppState(AppState.SELECTING_CATEGORY)}
          isLoading={isLoading}
        />
      )}
      
      {appState === AppState.GENERATING && (
         <CourseBuilder
            stepTitle="Generazione in corso..."
            stepSubtitle="I nostri agenti IA stanno scrivendo il curriculum perfetto."
            suggestions={[]}
            onSelect={() => {}}
            onCustomInput={() => {}}
            onBack={() => {}}
            isLoading={true}
         />
      )}

      {appState === AppState.COURSE_VIEW && generatedCourse && (
        <CourseViewer 
          course={generatedCourse} 
          onExit={handleReset}
          onGenerateLessonContent={handleGenerateLessonContent}
          onGenerateLessonImage={handleGenerateLessonImage}
          onGenerateCourseIntro={handleGenerateCourseIntro}
        />
      )}
    </div>
  );
};

export default App;