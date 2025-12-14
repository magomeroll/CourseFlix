
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Course, Module, Lesson } from '../types';
import { Play, Lock, Clock, CheckCircle, List, Info, Award, FileText, Loader2, Sparkles, Image as ImageIcon, Download, Home, User, BookOpen, LayoutTemplate, Upload, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CourseViewerProps {
  course: Course;
  onExit: () => void;
  onGenerateLessonContent: (lesson: Lesson) => Promise<string>;
  onGenerateLessonImage: (lesson: Lesson) => Promise<string | null>;
  onGenerateCourseIntro: (title: string, desc: string) => Promise<string>;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ 
    course, 
    onExit, 
    onGenerateLessonContent, 
    onGenerateLessonImage,
    onGenerateCourseIntro 
}) => {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null); // Null means showing Course Home
  const [localCourse, setLocalCourse] = useState<Course>(course);
  
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [currentGeneratingId, setCurrentGeneratingId] = useState<string | null>(null);
  
  const [courseIntroHtml, setCourseIntroHtml] = useState<string>('');
  const [loadingIntro, setLoadingIntro] = useState(false);

  // Reference for hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Load: Generate Intro if missing, stay on Home
  useEffect(() => {
    const loadIntro = async () => {
        setLoadingIntro(true);
        // If course description already looks like HTML (from import), don't regenerate immediately unless empty
        if (localCourse.description && localCourse.description.includes('<p>')) {
             // It might be simple text, so we check if we have a stored intro in a future implementation.
             // For now, we regenerate intro only if it's the initial raw generation
        }
        
        const intro = await onGenerateCourseIntro(localCourse.title, localCourse.description);
        setCourseIntroHtml(intro);
        setLoadingIntro(false);
    };
    // Only load intro if we haven't loaded it yet or if it's a fresh course
    if (!courseIntroHtml) {
        loadIntro();
    }
    // Intentionally do not set active lesson -> defaults to Home
  }, [localCourse.id]); // Reload if course ID changes (import)

  // Calculate Real Progress based on content existence
  const progressPercentage = useMemo(() => {
    let total = 0;
    let completed = 0;
    localCourse.modules.forEach(m => {
        m.lessons.forEach(l => {
            total++;
            if (l.content) completed++;
        });
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }, [localCourse]);

  // Handle Lesson Change (Load Content & Image)
  useEffect(() => {
    const fetchLessonData = async () => {
      if (!activeLesson) return; // Course Home
      
      const currentModule = localCourse.modules.find(m => m.lessons.some(l => l.id === activeLesson.id));
      const currentLessonData = currentModule?.lessons.find(l => l.id === activeLesson.id);

      if (!currentLessonData) return;

      const needsContent = !currentLessonData.content;
      const needsImage = !currentLessonData.imageUrl;

      if (!needsContent && !needsImage) {
        // Just update active lesson view if content already exists
        if (activeLesson.content !== currentLessonData.content || activeLesson.imageUrl !== currentLessonData.imageUrl) {
            setActiveLesson(currentLessonData);
        }
        return;
      }

      if (needsContent) setLoadingContent(true);
      if (needsImage) setLoadingImage(true);

      try {
        // Parallel fetching
        const contentPromise = needsContent ? onGenerateLessonContent(activeLesson) : Promise.resolve(null);
        // Only generate image if user is actively looking at it
        const imagePromise = needsImage ? onGenerateLessonImage(activeLesson) : Promise.resolve(null);

        const [content, imageUrl] = await Promise.all([contentPromise, imagePromise]);

        // Update local state
        setLocalCourse(prev => {
          const newModules = prev.modules.map(mod => ({
            ...mod,
            lessons: mod.lessons.map(les => {
              if (les.id === activeLesson.id) {
                 return {
                    ...les,
                    content: content || les.content,
                    imageUrl: imageUrl || les.imageUrl
                 };
              }
              return les;
            })
          }));
          return { ...prev, modules: newModules };
        });

        // Update active lesson view
        setActiveLesson(prev => {
            if (!prev) return null;
            return {
                ...prev,
                content: content || prev.content || currentLessonData.content,
                imageUrl: imageUrl || prev.imageUrl || currentLessonData.imageUrl
            };
        });

      } catch (e) {
        console.error("Failed to load lesson data", e);
      } finally {
        setLoadingContent(false);
        setLoadingImage(false);
      }
    };

    fetchLessonData();
  }, [activeLesson?.id]);

  const handleRegenerateImage = async () => {
    if (!activeLesson) return;
    setLoadingImage(true);
    try {
        const newImage = await onGenerateLessonImage(activeLesson);
        if (newImage) {
             setLocalCourse(prev => {
                const newModules = prev.modules.map(mod => ({
                    ...mod,
                    lessons: mod.lessons.map(les => {
                        if (les.id === activeLesson.id) {
                            return { ...les, imageUrl: newImage };
                        }
                        return les;
                    })
                }));
                return { ...prev, modules: newModules };
             });
             setActiveLesson(prev => prev ? ({ ...prev, imageUrl: newImage }) : null);
        }
    } catch (e) {
        console.error("Error regenerating image", e);
    } finally {
        setLoadingImage(false);
    }
  };


  // Enhanced Batch Generation Logic (Now includes Images)
  const handleBulkGenerate = async () => {
    if (progressPercentage === 100) {
        alert("Il corso è già completo!");
        return;
    }
    
    setIsBulkGenerating(true);

    const lessonsToGenerate: { mIdx: number; lIdx: number; lesson: Lesson }[] = [];
    localCourse.modules.forEach((mod, mIdx) => {
        mod.lessons.forEach((les, lIdx) => {
            // Check if either content or image is missing
            if (!les.content || !les.imageUrl) {
                lessonsToGenerate.push({ mIdx, lIdx, lesson: les });
            }
        });
    });

    for (const item of lessonsToGenerate) {
        setCurrentGeneratingId(item.lesson.id);
        
        try {
            // Force generate both if missing
            const needsContent = !item.lesson.content;
            const needsImage = !item.lesson.imageUrl;

            const contentPromise = needsContent ? onGenerateLessonContent(item.lesson) : Promise.resolve(item.lesson.content);
            const imagePromise = needsImage ? onGenerateLessonImage(item.lesson) : Promise.resolve(item.lesson.imageUrl);

            const [content, imageUrl] = await Promise.all([contentPromise, imagePromise]);
            
            // Update State
            setLocalCourse(prev => {
                const newModules = [...prev.modules];
                newModules[item.mIdx] = {
                    ...newModules[item.mIdx],
                    lessons: [...newModules[item.mIdx].lessons]
                };
                
                newModules[item.mIdx].lessons[item.lIdx] = { 
                    ...item.lesson, 
                    content: content!,
                    imageUrl: imageUrl || undefined
                };
                
                return { ...prev, modules: newModules };
            });

            // If this is the active lesson, update view
            if (activeLesson?.id === item.lesson.id) {
                 setActiveLesson(prev => prev ? ({ ...prev, content: content!, imageUrl: imageUrl || undefined }) : null);
            }

        } catch (e) {
            console.error(`Error generating lesson ${item.lesson.title}`, e);
        }
    }
    
    setCurrentGeneratingId(null);
    setIsBulkGenerating(false);
  };

  const handleDownloadPDF = () => {
    if (!activeLesson || !activeLesson.content) return;
    
    const element = document.createElement("a");
    const file = new Blob(
      [
        `<html>
          <head>
            <title>${activeLesson.title}</title>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 60px; line-height: 1.8; color: #111; max-width: 800px; margin: 0 auto; }
              h1 { color: #cc0000; border-bottom: 3px solid #eee; padding-bottom: 20px; font-size: 32px; }
              h2 { margin-top: 40px; font-size: 24px; color: #333; }
              p { font-size: 18px; margin-bottom: 20px; }
              li { margin-bottom: 10px; font-size: 18px; }
              .meta { color: #666; font-size: 14px; margin-bottom: 40px; }
            </style>
          </head>
          <body>
            <h1>${activeLesson.title}</h1>
            <div class="meta">
                <p><strong>Corso:</strong> ${localCourse.title}</p>
                <p><strong>Modulo:</strong> ${localCourse.modules[activeModuleIndex].title}</p>
            </div>
            ${activeLesson.content}
            <hr style="margin-top: 50px; border: 0; border-top: 1px solid #eee;" />
            <p style="text-align:center; font-size: 14px; color: #999;">Generato da CourseFlix AI</p>
          </body>
        </html>`
      ], 
      {type: 'text/html'}
    );
    element.href = URL.createObjectURL(file);
    element.download = `${activeLesson.title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  // Funzione per scaricare l'intero corso come unico PDF (E-book)
  const handleDownloadFullCoursePDF = () => {
    if (progressPercentage < 100) {
        if (!window.confirm("Attenzione: Il corso non è completo al 100%. Alcune lezioni potrebbero mancare. Vuoi procedere comunque?")) {
            return;
        }
    }

    const htmlContent = `
      <html>
        <head>
          <title>${localCourse.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
            
            /* CSS SPECIALE PER RIMUOVERE INTESTAZIONI BROWSER E FORMATTARE A4 */
            @page { 
                margin: 0; 
                size: A4;
            }
            
            body { 
                font-family: 'Inter', sans-serif; 
                color: #000; 
                line-height: 1.6; 
                margin: 0;
                padding: 0;
                background: white;
                -webkit-print-color-adjust: exact;
            }

            .page-container {
                width: 100%;
                max-width: 210mm; /* Larghezza A4 */
                margin: 0 auto; 
                padding: 20mm; /* Margini sicuri 2cm */
                box-sizing: border-box;
                overflow-wrap: break-word; /* Previene taglio testo */
            }

            .cover-page { 
                height: 100vh; 
                width: 100%;
                display: flex; 
                flex-direction: column; 
                justify-content: center; 
                text-align: center; 
                page-break-after: always; 
                padding: 20mm;
                box-sizing: border-box;
            }
            
            h1 { font-size: 48px; margin-bottom: 20px; color: #cc0000; font-weight: 800; letter-spacing: -1px; line-height: 1.1; }
            h2 { font-size: 28px; color: #111; margin-bottom: 15px; margin-top: 30px; }
            h3 { font-size: 22px; color: #333; margin-top: 25px; margin-bottom: 10px; }
            p { font-size: 12pt; margin-bottom: 1em; color: #333; text-align: justify; }
            ul, ol { margin-bottom: 1em; padding-left: 20px; font-size: 12pt; text-align: left; }
            li { margin-bottom: 8px; }
            img { max-width: 100%; height: auto; display: block; margin: 20px auto; }
            
            .meta { font-size: 16px; color: #666; margin-bottom: 40px; margin-top: 20px; }
            .module-header { page-break-before: always; border-bottom: 4px solid #cc0000; margin-bottom: 30px; padding-bottom: 10px; padding-top: 40px; }
            .lesson-container { margin-bottom: 50px; page-break-inside: avoid; }
            .lesson-image { width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            .lesson-title { font-size: 30px; margin-bottom: 15px; color: #000; font-weight: 700; border-left: 5px solid #cc0000; padding-left: 15px; page-break-after: avoid; }
            .content { text-align: justify; }
            .intro-section { margin-top: 40px; text-align: left; }
            .footer { text-align: center; margin-top: 80px; color: #888; font-size: 10px; border-top: 1px solid #eee; padding-top: 20px; page-break-inside: avoid; }
            
            @media print {
                body { margin: 0; }
                .cover-page { height: 100vh; margin: 0; }
                .page-container { width: 100%; max-width: none; padding: 15mm; }
                a { text-decoration: none; color: #000; }
            }
          </style>
        </head>
        <body>
          <!-- COPERTINA (Full Height) -->
          <div class="cover-page">
            <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #cc0000; margin-bottom: 10px;">Corso Completo</div>
            <h1>${localCourse.title}</h1>
            <p style="font-size: 20px; color: #555;">${localCourse.description}</p>
            <div class="meta">
              <p style="text-align: center;"><strong>Livello:</strong> ${localCourse.difficulty} | <strong>Durata:</strong> ${localCourse.totalDuration}</p>
              <p style="text-align: center;"><strong>Istruttore:</strong> ${localCourse.instructor}</p>
            </div>
            <div style="margin-top: 50px; font-size: 12px; color: #999;">Generato da CourseFlix AI</div>
          </div>

          <div class="page-container">
            <!-- INTRODUZIONE -->
            <div style="page-break-after: always;">
                <h2 style="color: #cc0000;">Introduzione al Corso</h2>
                <div class="intro-section">
                    ${courseIntroHtml || `<p>${localCourse.description}</p>`}
                </div>
            </div>
            
            <!-- CONTENUTI -->
            ${localCourse.modules.map((module, mIdx) => `
                <div class="module-header">
                <span style="font-size: 12px; text-transform: uppercase; color: #666;">MODULO ${mIdx + 1}</span>
                <h2>${module.title}</h2>
                </div>
                ${module.lessons.map((lesson, lIdx) => `
                <div class="lesson-container">
                    <div class="lesson-title">Lezione ${mIdx + 1}.${lIdx + 1}: ${lesson.title}</div>
                    <p style="font-style: italic; color: #666; margin-bottom: 20px;">${lesson.description}</p>
                    
                    ${(lesson.imageUrl || localCourse.thumbnailUrl) ? `<img src="${lesson.imageUrl || localCourse.thumbnailUrl}" class="lesson-image" alt="Copertina Lezione" />` : ''}
                    
                    <div class="content">${lesson.content || '<p><em>Contenuto non ancora generato.</em></p>'}</div>
                </div>
                `).join('')}
            `).join('')}

            <div class="footer">
                <p>Generato con CourseFlix AI - Piattaforma di E-Learning Intelligente</p>
            </div>
          </div>

          <script>
            window.onload = function() { setTimeout(function() { window.print(); }, 1000); }
          </script>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if(printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    } else {
        alert("Impossibile aprire la finestra di stampa. Controlla il blocco popup.");
    }
  };

  const handleDownloadLandingPage = () => {
     const htmlContent = `
     <!DOCTYPE html>
     <html lang="it">
     <head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <title>${localCourse.title} - Pagina Ufficiale</title>
         <style>
             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
             body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #f8f9fa; color: #333; }
             .hero {
                 background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${localCourse.thumbnailUrl}');
                 background-size: cover;
                 background-position: center;
                 color: white;
                 padding: 100px 20px;
                 text-align: center;
             }
             .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
             h1 { font-size: 48px; margin-bottom: 20px; font-weight: 800; }
             .tag { background: #cc0000; color: white; padding: 5px 15px; border-radius: 50px; font-size: 14px; text-transform: uppercase; font-weight: bold; }
             .btn-cta {
                 background: #cc0000; color: white; padding: 20px 40px; font-size: 24px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; transition: transform 0.2s; margin-top: 20px;
                 box-shadow: 0 10px 20px rgba(204,0,0,0.3);
             }
             .btn-cta:hover { transform: scale(1.05); background: #b30000; }
             .section { background: white; padding: 40px; border-radius: 12px; margin-bottom: 40px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
             h2 { color: #cc0000; margin-top: 0; font-size: 32px; }
             .module-list { list-style: none; padding: 0; }
             .module-item { border-bottom: 1px solid #eee; padding: 15px 0; display: flex; justify-content: space-between; align-items: center; }
             .module-title { font-weight: 600; font-size: 18px; }
             .module-count { color: #888; font-size: 14px; }
             .price-box { text-align: center; background: #111; color: white; padding: 40px; border-radius: 12px; }
             .price { font-size: 56px; font-weight: 800; color: #cc0000; }
             .features li { margin-bottom: 10px; }
         </style>
     </head>
     <body>
         <div class="hero">
             <div class="container">
                 <span class="tag">NUOVO CORSO</span>
                 <h1>${localCourse.title}</h1>
                 <p style="font-size: 20px; max-width: 700px; margin: 0 auto 30px;">${localCourse.description}</p>
                 <a href="#acquisto" class="btn-cta">INIZIA ORA</a>
             </div>
         </div>
 
         <div class="container">
             <div class="section">
                 <h2>Cosa Imparerai</h2>
                 <div style="font-size: 18px; line-height: 1.6;">
                     ${courseIntroHtml || `<p>${localCourse.description}</p>`}
                 </div>
             </div>
 
             <div class="section">
                 <h2>Programma del Corso</h2>
                 <ul class="module-list">
                     ${localCourse.modules.map((m, i) => `
                         <li class="module-item">
                             <span class="module-title">Modulo ${i+1}: ${m.title}</span>
                             <span class="module-count">${m.lessons.length} Lezioni</span>
                         </li>
                     `).join('')}
                 </ul>
             </div>
 
             <div id="acquisto" class="price-box">
                 <h2>Accesso Completo</h2>
                 <div class="price">€29.99</div>
                 <p style="color: #aaa; margin-bottom: 30px;">Accesso a vita • ${localCourse.modules.reduce((acc, m) => acc + m.lessons.length, 0)} Lezioni • Certificato Incluso</p>
                 <button class="btn-cta" onclick="alert('Qui inserirai il tuo link di pagamento (es. Stripe, PayPal, Gumroad)')">ACQUISTA ACCESSO</button>
             </div>
         </div>
     </body>
     </html>
     `;
     
     const element = document.createElement("a");
     const file = new Blob([htmlContent], {type: 'text/html'});
     element.href = URL.createObjectURL(file);
     element.download = `Landing_${localCourse.title.replace(/\s+/g, '_')}.html`;
     document.body.appendChild(element); 
     element.click();
     document.body.removeChild(element);
  };

  const handleExportCourse = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localCourse, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `Corso_${localCourse.title.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode); 
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImportCourse = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const importedCourse = JSON.parse(content) as Course;
            
            // Basic validation
            if (importedCourse.id && importedCourse.title && importedCourse.modules) {
                setLocalCourse(importedCourse);
                // Reset to home view of the new course
                setActiveLesson(null);
                setCourseIntroHtml(''); // Force regeneration or reload of intro logic
                alert("Corso importato correttamente! Bentornato.");
            } else {
                alert("Il file non sembra essere un corso valido di CourseFlix.");
            }
        } catch (error) {
            console.error("Import failed", error);
            alert("Errore durante l'importazione del file.");
        }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    event.target.value = '';
  };

  const startFirstLesson = () => {
      if (localCourse.modules.length > 0 && localCourse.modules[0].lessons.length > 0) {
          setActiveLesson(localCourse.modules[0].lessons[0]);
      }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans flex flex-col">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleImportCourse}
        className="hidden"
        accept=".json"
      />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-lg h-[72px]">
        <div className="flex items-center gap-4">
             <div className="text-red-600 font-extrabold text-2xl tracking-tighter cursor-pointer hover:scale-105 transition" onClick={onExit}>
                COURSEFLIX
            </div>
            {isBulkGenerating && (
                <div className="hidden md:flex items-center gap-3 bg-neutral-800 px-4 py-2 rounded-full border border-neutral-700 shadow-red-900/20 shadow-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                    <span className="text-sm font-medium text-gray-200">
                        Creazione corso... <span className="text-red-500">{progressPercentage}%</span>
                    </span>
                </div>
            )}
        </div>
       
        <div className="flex gap-4 items-center">
            {/* Tasto Landing Page */}
            <button 
                onClick={handleDownloadLandingPage}
                className="hidden md:flex items-center gap-2 text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-bold uppercase transition shadow-lg hover:scale-105"
                title="Scarica la Landing Page HTML per vendere il corso"
            >
                <LayoutTemplate className="w-5 h-5" />
                Landing Page (HTML)
            </button>

            {/* Tasto E-book Completo */}
            <button 
                onClick={handleDownloadFullCoursePDF}
                className="hidden md:flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold uppercase transition shadow-lg hover:scale-105"
                title="Scarica l'intero corso come E-Book PDF per la vendita"
            >
                <BookOpen className="w-5 h-5" />
                Scarica E-book (PDF)
            </button>
            
            {/* Export & Import Group */}
            <div className="flex bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-2 text-sm font-semibold uppercase transition hover:bg-neutral-700 rounded"
                    title="Importa Corso (JSON)"
                >
                    <Upload className="w-5 h-5" />
                </button>
                <div className="w-[1px] bg-neutral-700 mx-1"></div>
                <button 
                    onClick={handleExportCourse}
                    className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-2 text-sm font-semibold uppercase transition hover:bg-neutral-700 rounded"
                    title="Esporta Corso (JSON)"
                >
                    <Download className="w-5 h-5" />
                </button>
            </div>

            <button 
                onClick={handleBulkGenerate}
                disabled={isBulkGenerating || progressPercentage === 100}
                className={`hidden md:flex items-center gap-2 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 px-5 py-2.5 rounded text-sm font-bold uppercase tracking-wider transition shadow-lg ${isBulkGenerating || progressPercentage === 100 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
                {progressPercentage === 100 ? (
                    <>
                         <CheckCircle className="w-5 h-5" /> Completato
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        {isBulkGenerating ? "Generazione..." : "Genera Corso Completo"}
                    </>
                )}
            </button>
            <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center font-bold text-lg shadow-lg">
                {localCourse.title.charAt(0)}
            </div>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row flex-grow mt-[72px] h-[calc(100vh-72px)]">
        
        {/* LEFT COLUMN: Content Area */}
        <div className="lg:w-2/3 bg-black overflow-y-auto scrollbar-hide">
            
            {activeLesson === null ? (
                // COURSE HOME (PRESENTATION) VIEW
                <div className="relative w-full min-h-full">
                     <div 
                        className="absolute inset-0 bg-cover bg-center opacity-40"
                        style={{ backgroundImage: `url(${localCourse.thumbnailUrl})` }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                     
                     <div className="relative z-10 px-8 md:px-16 py-12 flex flex-col justify-end min-h-[60vh]">
                         <span className="text-red-600 font-bold tracking-widest mb-4 uppercase">Corso Originale</span>
                         <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">{localCourse.title}</h1>
                         
                         <div className="flex flex-wrap gap-6 text-xl md:text-2xl text-gray-300 mb-8 font-medium">
                            <span className="flex items-center gap-2"><Clock className="text-red-600" /> {localCourse.totalDuration}</span>
                            <span className="flex items-center gap-2"><Award className="text-red-600" /> Livello {localCourse.difficulty}</span>
                            <span className="flex items-center gap-2"><User className="text-red-600" /> {localCourse.instructor}</span>
                         </div>
                         
                         <div className="flex gap-4 mb-12">
                             <button 
                                onClick={startFirstLesson}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded font-bold text-xl flex items-center gap-3 transition-transform hover:scale-105"
                            >
                                <Play className="fill-current w-6 h-6" /> INIZIA CORSO
                             </button>
                         </div>
                     </div>

                     <div className="relative z-10 px-8 md:px-16 py-12 bg-black">
                        {loadingIntro ? (
                            <div className="animate-pulse space-y-4 max-w-3xl">
                                <div className="h-6 bg-neutral-800 rounded w-3/4"></div>
                                <div className="h-4 bg-neutral-800 rounded w-full"></div>
                                <div className="h-4 bg-neutral-800 rounded w-full"></div>
                                <div className="h-4 bg-neutral-800 rounded w-5/6"></div>
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-2xl max-w-4xl text-gray-300 leading-relaxed">
                                <h3 className="text-white text-4xl font-bold mb-6">Informazioni sul corso</h3>
                                <div dangerouslySetInnerHTML={{ __html: courseIntroHtml || `<p>${localCourse.description}</p>` }} />
                            </div>
                        )}
                     </div>
                </div>
            ) : (
                // ACTIVE LESSON VIEW
                <>
                    <div className="relative aspect-video w-full bg-neutral-900 group overflow-hidden">
                        {/* Regenerate Button Overlay */}
                        <div className="absolute top-4 right-4 z-20">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleRegenerateImage(); }}
                                className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur transition-all hover:rotate-180"
                                title="Rigenera immagine copertina"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>

                        {loadingImage ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-gray-500">
                                <Sparkles className="w-12 h-12 mb-3 animate-pulse text-red-600" />
                                <span className="text-xl font-medium">Disegno copertina lezione...</span>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key={activeLesson.imageUrl || 'default-bg'}
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear hover:scale-105"
                                style={{ 
                                    backgroundImage: `url(${activeLesson.imageUrl || localCourse.thumbnailUrl})` 
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30"></div>
                            </motion.div>
                        )}
                        
                        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full z-10">
                            <span className="inline-block px-4 py-2 bg-red-600 text-white text-base font-bold rounded mb-4 shadow-lg">
                                LEZIONE {localCourse.modules[activeModuleIndex].lessons.findIndex(l => l.id === activeLesson.id) + 1}
                            </span>
                            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 shadow-black drop-shadow-xl leading-tight">
                                {activeLesson.title}
                            </h1>
                            <div className="flex items-center gap-6 text-lg md:text-xl text-gray-200 font-medium">
                                <span className="flex items-center gap-2 drop-shadow-md"><Clock className="w-6 h-6"/> {activeLesson.duration}</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 md:px-16 py-12">
                        <div className="flex justify-between items-center border-b border-neutral-800 pb-8 mb-10">
                            <div>
                                <h2 className="text-4xl font-bold text-white mb-2">Materiale Didattico</h2>
                                <p className="text-gray-400 text-xl">Contenuto completo del modulo.</p>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleDownloadPDF}
                                    disabled={!activeLesson.content}
                                    className={`bg-neutral-800 hover:bg-neutral-700 p-4 rounded-lg text-gray-300 transition hover:text-white ${!activeLesson.content ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Scarica Lezione (PDF/HTML)"
                                >
                                    <FileText className="w-8 h-8" />
                                </button>
                            </div>
                        </div>

                        {loadingContent ? (
                            <div className="space-y-8 max-w-5xl mx-auto py-10">
                                <div className="h-8 bg-neutral-800 rounded w-3/4 animate-pulse"></div>
                                <div className="h-6 bg-neutral-800 rounded w-full animate-pulse"></div>
                                <div className="h-6 bg-neutral-800 rounded w-5/6 animate-pulse"></div>
                                <div className="h-6 bg-neutral-800 rounded w-full animate-pulse"></div>
                                <div className="h-6 bg-neutral-800 rounded w-2/3 animate-pulse"></div>
                            </div>
                        ) : (
                            <motion.div 
                                key={activeLesson.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="prose prose-invert prose-2xl max-w-none text-gray-300 leading-loose"
                                dangerouslySetInnerHTML={{ __html: activeLesson.content || "<p class='text-gray-500 italic text-xl'>Seleziona una lezione o clicca 'Genera Corso Completo' per creare i contenuti.</p>" }}
                            />
                        )}
                    </div>
                </>
            )}
        </div>


        {/* RIGHT COLUMN: Sidebar */}
        <div className="lg:w-1/3 bg-[#141414] border-l border-neutral-800 h-full overflow-y-auto custom-scrollbar">
             <div className="p-8">
                
                {/* Course Presentation Link */}
                <div 
                    onClick={() => setActiveLesson(null)}
                    className={`cursor-pointer rounded-xl p-6 mb-6 border transition-all flex items-center gap-4 ${activeLesson === null ? 'bg-neutral-800 border-red-600' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
                >
                    <div className={`p-3 rounded-full ${activeLesson === null ? 'bg-red-600 text-white' : 'bg-black text-gray-400'}`}>
                        <Home className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className={`font-bold text-xl ${activeLesson === null ? 'text-white' : 'text-gray-300'}`}>Presentazione Corso</h4>
                        <p className="text-sm text-gray-500">Home page e introduzione</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 rounded-xl mb-10 border border-neutral-700 shadow-2xl">
                    <h3 className="font-bold text-white text-xl mb-4 flex items-center gap-2">
                        <Award className="w-6 h-6 text-yellow-500" />
                        Stato Generazione
                    </h3>
                    <div className="w-full h-4 bg-black rounded-full overflow-hidden mb-3 border border-neutral-700">
                         <div 
                            className="h-full bg-red-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                         ></div>
                    </div>
                    <p className="text-base text-gray-400 flex justify-between font-medium">
                        <span>{progressPercentage}% completato</span>
                        {progressPercentage === 100 && <span className="text-green-500 font-bold">PRONTO</span>}
                    </p>
                </div>

                <div className="space-y-6 pb-24">
                    {localCourse.modules.map((module, mIdx) => (
                        <div key={mIdx} className="overflow-hidden rounded-xl bg-neutral-900/40 border border-neutral-800/60">
                            <button 
                                onClick={() => setActiveModuleIndex(mIdx)}
                                className={`w-full text-left p-6 flex justify-between items-center transition-colors ${activeModuleIndex === mIdx ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800/50 text-gray-400'}`}
                            >
                                <span className="font-bold text-xl md:text-2xl">{module.title}</span>
                                {activeModuleIndex === mIdx ? (
                                    <List className="w-6 h-6" />
                                ) : (
                                    <span className="text-base font-mono bg-black/50 px-3 py-1 rounded text-gray-500">{module.lessons.length}</span>
                                )}
                            </button>

                            <AnimatePresence>
                                {activeModuleIndex === mIdx && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: "auto" }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t border-neutral-800">
                                            {module.lessons.map((lesson, lIdx) => (
                                                <div 
                                                    key={lesson.id}
                                                    onClick={() => setActiveLesson(lesson)}
                                                    className={`
                                                        group flex items-center p-6 cursor-pointer transition-all border-l-4 hover:bg-white/5
                                                        ${activeLesson?.id === lesson.id 
                                                            ? 'bg-white/10 border-red-600' 
                                                            : 'border-transparent'}
                                                    `}
                                                >
                                                    <div className="mr-6 relative flex-shrink-0">
                                                        {currentGeneratingId === lesson.id ? (
                                                            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                                                        ) : lesson.content && lesson.imageUrl ? (
                                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                                        ) : (
                                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold font-mono ${activeLesson?.id === lesson.id ? 'border-red-500 text-red-500' : 'border-gray-600 text-gray-600'}`}>
                                                                {lIdx + 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <h4 className={`text-xl font-medium truncate mb-2 ${activeLesson?.id === lesson.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                            {lesson.title}
                                                        </h4>
                                                        <span className="text-base text-gray-500 flex items-center gap-2">
                                                            {lesson.duration}
                                                            {lesson.imageUrl && <ImageIcon className="w-5 h-5 text-blue-400" />}
                                                            {currentGeneratingId === lesson.id && <span className="text-red-400 text-sm italic">Generazione in corso...</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
