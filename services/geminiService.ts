
import { GoogleGenAI } from "@google/genai";
import { Suggestion, Course } from "../types";

// Helper to get client with priority: LocalStorage > Env
const getAiClient = (explicitKey?: string) => {
  const userApiKey = explicitKey || localStorage.getItem("courseflix_api_key");
  const envApiKey = process.env.API_KEY;
  
  // Priorità alla chiave dell'utente. Se non c'è, usa quella di ambiente (se presente).
  const finalKey = userApiKey || envApiKey;

  if (!finalKey) throw new Error("API Key mancante.");
  return new GoogleGenAI({ apiKey: finalKey });
};

// --- NUOVA FUNZIONE PER TESTARE LA CHIAVE ---
export const testApiKey = async (apiKey: string): Promise<boolean> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Test connection",
        });
        return true;
    } catch (error) {
        console.error("Test API Key failed:", error);
        return false;
    }
};

export const suggestCategories = async (query: string): Promise<Suggestion[]> => {
  try {
    const ai = getAiClient();
    
    const prompt = `
      L'utente vuole imparare: "${query}".
      Agisci come un consulente educativo esperto.
      Analizza la richiesta. Se è molto generica, suggerisci 4 macro-settori distinti.
      Se la richiesta è già specifica, suggerisci 4 varianti o approcci diversi a quel tema.
      Sii breve e accattivante. Lingua: Italiano.

      RISPONDI ESCLUSIVAMENTE CON UN ARRAY JSON. Esempio:
      [
        { "title": "Titolo 1", "description": "Descrizione 1" },
        { "title": "Titolo 2", "description": "Descrizione 2" }
      ]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    const data = JSON.parse(text);
    return data.map((item: any, index: number) => ({
      id: `cat-${index}`,
      title: item.title,
      description: item.description,
    }));
  } catch (error: any) {
    console.error("Errore nel suggerire categorie:", error);
    if (error.status === 429) alert("Hai superato la quota gratuita di richieste API per oggi. Riprova più tardi o usa un'altra chiave.");
    else if (error.status === 403 || error.status === 400) alert("API Key non valida o API non abilitata sulla Google Cloud Console. Controlla le impostazioni.");
    return [];
  }
};

export const suggestSpecificTopics = async (category: string, userRefinement?: string): Promise<Suggestion[]> => {
  try {
    const ai = getAiClient();

    let promptContext = `L'utente ha scelto il settore: "${category}".`;
    if (userRefinement) {
      promptContext += ` Inoltre, l'utente ha specificato: "${userRefinement}".`;
    }

    const prompt = `
      ${promptContext}
      Suggerisci 4 argomenti specifici ("nicchie") per un corso pratico e vendibile basato su queste indicazioni.
      I titoli devono essere accattivanti, pronti per la vendita.
      Lingua: Italiano.

      RISPONDI ESCLUSIVAMENTE CON UN ARRAY JSON. Esempio:
      [
        { "title": "Titolo Nicchia 1", "description": "Descrizione breve" },
        { "title": "Titolo Nicchia 2", "description": "Descrizione breve" }
      ]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    const data = JSON.parse(text);
    return data.map((item: any, index: number) => ({
      id: `topic-${index}`,
      title: item.title,
      description: item.description,
    }));
  } catch (error: any) {
    console.error("Errore nel suggerire argomenti:", error);
    if (error.status === 429) alert("Quota API esaurita.");
    return [];
  }
};

export const generateCourseStructure = async (topic: string, userRefinement?: string): Promise<Course | null> => {
  try {
    const ai = getAiClient();

    let promptContext = `Argomento principale: "${topic}".`;
    if (userRefinement) {
      promptContext += ` Nota specifica dell'utente: "${userRefinement}".`;
    }

    const prompt = `
      Crea la STRUTTURA completa (Syllabus) per un corso online professionale "stile Netflix".
      ${promptContext}
      Il corso deve essere adatto ai principianti ma estremamente completo.
      Struttura: 4-6 moduli. Ogni modulo: 3-5 lezioni.
      Titoli creativi e descrizioni brevi ma potenti.
      Lingua: Italiano.

      RISPONDI ESCLUSIVAMENTE CON UN OGGETTO JSON CHE SEGUE QUESTA STRUTTURA:
      {
        "title": "Titolo del Corso Accattivante",
        "description": "Descrizione generale del corso",
        "category": "Categoria",
        "difficulty": "Beginner", 
        "totalDuration": "es. 4 Ore",
        "modules": [
          {
            "title": "Titolo Modulo 1",
            "lessons": [
               { "title": "Titolo Lezione 1", "duration": "10 min", "description": "Cosa si impara" },
               { "title": "Titolo Lezione 2", "duration": "15 min", "description": "Cosa si impara" }
            ]
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    
    // Enrich with IDs and Fallbacks
    const enhancedModules = (data.modules || []).map((m: any, mIdx: number) => ({
      title: m.title || `Modulo ${mIdx + 1}`,
      lessons: (m.lessons || []).map((l: any, lIdx: number) => ({
        ...l,
        title: l.title || `Lezione ${lIdx + 1}`,
        description: l.description || "Lezione pratica.",
        duration: l.duration || "10 min",
        id: `l-${mIdx}-${lIdx}-${Date.now()}`
      }))
    }));

    return {
      id: `course-${Date.now()}`,
      title: data.title || "Nuovo Corso",
      description: data.description || "Descrizione non disponibile.",
      category: data.category || "Generale",
      difficulty: data.difficulty || "Beginner",
      totalDuration: data.totalDuration || "3 Ore",
      instructor: "CourseFlix AI",
      modules: enhancedModules,
      thumbnailUrl: `https://picsum.photos/1920/1080?random=${Date.now()}`,
    };
  } catch (error: any) {
    console.error("Errore nella generazione struttura:", error);
    if (error.status === 429) alert("Quota API esaurita. Impossibile generare la struttura.");
    else alert(`Errore generazione corso: ${error.message || 'Riprova più tardi'}`);
    return null;
  }
};

export const generateLessonContent = async (courseTitle: string, lessonTitle: string, lessonDescription: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    const prompt = `
      Sei un istruttore esperto del corso "${courseTitle}".
      Scrivi il contenuto completo, dettagliato ed educativo per la lezione: "${lessonTitle}".
      Descrizione lezione: "${lessonDescription}".
      
      Il contenuto deve essere:
      1. Formattato in HTML pulito (usa <h2>, <p>, <ul>, <li>, <strong>, non usare markdown \`\`\`html).
      2. Tono conversazionale ma autorevole, chiaro per i principianti.
      3. Includi esempi pratici, metafore o esercizi.
      4. Lunghezza: circa 600-800 parole.
      5. Usa paragrafi brevi per facilitare la lettura.
      
      Non includere tag <html> o <body>, solo il contenuto del body.
      Lingua: Italiano.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "<p>Contenuto non disponibile.</p>";
  } catch (error) {
    console.error("Errore generazione contenuto lezione:", error);
    return "<p>Si è verificato un errore nel caricamento della lezione. Riprova più tardi o controlla la tua API Key.</p>";
  }
};

export const generateLessonImage = async (courseTitle: string, lessonTitle: string): Promise<string | null> => {
    try {
        const ai = getAiClient();

        const prompt = `
          Create a cinematic, high-quality photorealistic thumbnail image for an online course lesson.
          Course Topic: ${courseTitle}
          Lesson Topic: ${lessonTitle}
          Style: Professional, cinematic documentary style, 4k, sharp focus, detailed.
          No text overlay.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
        });

        // Find image part
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Image generation failed", error);
        // Fail silently for images, return null so we use the default cover
        return null;
    }
}

export const generateCourseIntro = async (courseTitle: string, courseDescription: string): Promise<string> => {
  try {
     const ai = getAiClient();

     const prompt = `
        Scrivi un testo di presentazione persuasivo per la landing page del corso: "${courseTitle}".
        Descrizione base: "${courseDescription}".
        
        Il testo deve:
        1. Essere formattato in HTML (usa <h3> per i sottotitoli, <p>, <ul>, <li>).
        2. Avere una sezione "Cosa imparerai" con bullet points.
        3. Avere una sezione "Perché questo corso".
        4. Essere motivante e professionale.
        5. No markdown blocks.
        Lingua: Italiano.
     `;

     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    return "<p>Benvenuto nel corso.</p>";
  }
}
