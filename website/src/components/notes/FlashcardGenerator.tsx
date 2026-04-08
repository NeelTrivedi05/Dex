import { useState, useEffect } from 'react';
import { Layers, Sparkles, SlidersHorizontal, Plus, Trash2, Shuffle, RotateCcw, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import type { SavedNote } from './types';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface FlashcardGeneratorProps {
  initialNote?: SavedNote | null;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function FlashcardGenerator({ initialNote }: FlashcardGeneratorProps) {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [cards, setCards] = useState<Flashcard[]>([]);
  
  // AI Config
  const [aiText, setAiText] = useState(initialNote?.content || '');
  const [aiCount, setAiCount] = useState(10);
  const [aiDiff, setAiDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Manual Config
  const [manFront, setManFront] = useState('');
  const [manBack, setManBack] = useState('');

  // Study Interface
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  
  // Stopwatch
  const [studyTime, setStudyTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let t: any;
    if (timerActive) {
      t = setInterval(() => setStudyTime(s => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [timerActive]);

  useEffect(() => {
    const handleBlur = () => setTimerActive(false);
    const handleFocus = () => { if (cards.length > 0) setTimerActive(true); };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => { window.removeEventListener('blur', handleBlur); window.removeEventListener('focus', handleFocus); };
  }, [cards.length]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleFlip = () => {
    if (!timerActive && cards.length > 0) setTimerActive(true);
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
       if (currentIndex < cards.length - 1) setCurrentIndex(currentIndex + 1);
       else setCurrentIndex(0); // wrap
    }, 200);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
       if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
       else setCurrentIndex(cards.length - 1);
    }, 200);
  };

  const handleAction = (action: 'know' | 'review' | 'delete') => {
    const curId = cards[currentIndex].id;
    if (action === 'know') {
       if (!masteredIds.includes(curId)) setMasteredIds([...masteredIds, curId]);
       nextCard();
    } else if (action === 'review') {
       const cur = cards[currentIndex];
       const remaining = cards.filter((_, i) => i !== currentIndex);
       setCards([...remaining, cur]);
       // staying at currentIndex inherently shows the new card that shifted down
       setIsFlipped(false);
    } else if (action === 'delete') {
       const updated = cards.filter((_, i) => i !== currentIndex);
       setCards(updated);
       setIsFlipped(false);
       if (currentIndex >= updated.length) setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  const addManualCard = () => {
    if (!manFront.trim() || !manBack.trim()) return;
    setCards([...cards, { id: crypto.randomUUID(), front: manFront, back: manBack }]);
    setManFront(''); setManBack('');
  };

  const generateAI = async (isRetry = false) => {
    if (!aiText.trim()) return showToast("Provide notes text first.");
    
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) return showToast("Summary failed — check your API key in Settings.");

    setIsGenerating(true);
    
    let extra = isRetry ? "Return ONLY the raw JSON array, nothing else. No explanation, no markdown ticks." : "";

    try {
       const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
         body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
               { role: 'system', content: `Generate exactly ${aiCount} flashcards from the student's notes at ${aiDiff} difficulty. Respond with ONLY a valid JSON array. No markdown, no code fences, no explanation. Each element: { "front": "string", "back": "string" }. Make flashcards progressively harder if difficulty is Hard. ${extra}` },
               { role: 'user', content: aiText }
            ],
            max_tokens: 2000,
            temperature: 0.2
         })
       });

       if (!res.ok) throw new Error("API Fails");
       const data = await res.json();
       let raw = data.choices[0].message.content.trim();
       if (raw.startsWith('```json')) raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
       if (raw.startsWith('```')) raw = raw.replace(/```/g, '').trim();
       
       const parsedRaw = JSON.parse(raw);
       const parsed = parsedRaw.map((p: any) => ({
           id: crypto.randomUUID(),
           front: p.front || p.question || 'Missing Front',
           back: p.back || p.answer || 'Missing Back'
       }));
       
       setCards(parsed);
       setCurrentIndex(0);
       setIsFlipped(false);
       setMasteredIds([]);
       setStudyTime(0);

    } catch (e) {
       if (!isRetry) {
          showToast("AI returned invalid format — retrying");
          generateAI(true);
       } else {
          showToast("Failed to parse JSON. Please try again.");
       }
    } finally {
       if (isRetry || !isGenerating) setIsGenerating(false);
       else if(!isRetry) setIsGenerating(false); // Clean exit if not retrying
    }
  };

  const shuffleCards = () => {
     const shuf = [...cards].sort(() => 0.5 - Math.random());
     setCards(shuf);
     setCurrentIndex(0);
     setIsFlipped(false);
  };
  
  const resetStudy = () => {
     setCurrentIndex(0);
     setIsFlipped(false);
     setMasteredIds([]);
     setStudyTime(0);
  };

  const activeCard = cards[currentIndex];

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full animate-in fade-in h-[calc(100vh-280px)] min-h-[600px]">
       
       {/* LEFT PANEL */}
       <div className="w-full lg:w-[40%] flex flex-col gap-4">
          <h3 className="text-sm font-bold text-text-primary mb-2">Generate Flashcards</h3>
          
          <div className="flex bg-white rounded-xl shadow-card border border-border-default p-1 w-full relative">
             {[ 
               { id: 'ai', label: 'AI Generate', icon: <Sparkles size={14}/> }, 
               { id: 'manual', label: 'Manual Create', icon: <Plus size={14}/> }
             ].map(m => (
                <button key={m.id} onClick={()=>setMode(m.id as any)} className={clsx("flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-colors", mode === m.id ? "bg-accent-blue text-white" : "text-text-secondary hover:bg-bg-surface")}>
                   {m.icon} {m.label}
                </button>
             ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
             {mode === 'ai' ? (
                <>
                   <textarea
                     value={aiText}
                     onChange={e => setAiText(e.target.value)}
                     placeholder="Paste notes here to generate dynamic study cards..."
                     className="w-full h-48 p-4 text-sm text-text-primary resize-none bg-white rounded-xl shadow-card border border-border-default focus:outline-none focus:border-accent-blue transition-colors shrink-0"
                   />
                   <div className="bg-white rounded-xl shadow-card border border-border-default p-5">
                      <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 flex items-center justify-between">
                         <SlidersHorizontal size={14}/>
                         <span>{aiText.trim().split(/\s+/).filter(Boolean).length} Words</span>
                      </h4>
                      <div className="mb-4">
                        <div className="flex justify-between mb-1 text-xs font-semibold text-text-primary">
                           <span>Number of Cards</span>
                           <span>{aiCount}</span>
                        </div>
                        <input type="range" min="5" max="30" step="1" value={aiCount} onChange={e=>setAiCount(Number(e.target.value))} className="w-full" />
                      </div>
                      <div>
                         <label className="text-xs font-semibold text-text-primary mb-2 block">Difficulty</label>
                         <div className="flex gap-2">
                           {(['Easy','Medium','Hard'] as const).map(d => (
                              <button key={d} onClick={()=>setAiDiff(d)} className={clsx("flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors", aiDiff === d ? "bg-accent-blue/10 border-accent-blue text-accent-blue" : "bg-bg-surface border-border-default text-text-secondary")}>
                                 {d}
                              </button>
                           ))}
                         </div>
                      </div>
                   </div>
                   <Button onClick={()=>generateAI(false)} disabled={isGenerating} className="w-full h-12 flex justify-center items-center gap-2 text-base font-bold shrink-0 mt-auto">
                     {isGenerating ? <RefreshCw className="animate-spin" size={18}/> : <Sparkles size={18}/>}
                     {isGenerating ? 'Synthesizing...' : 'Generate Flashcards'}
                   </Button>
                </>
             ) : (
                <>
                   <div className="bg-white rounded-xl shadow-card border border-border-default p-5 shrink-0 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-text-secondary mb-1 block">Front (Term)</label>
                        <input value={manFront} onChange={e=>setManFront(e.target.value)} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none bg-bg-surface" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-text-secondary mb-1 block">Back (Definition)</label>
                        <textarea value={manBack} onChange={e=>setManBack(e.target.value)} className="w-full h-20 p-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none bg-bg-surface resize-none" />
                      </div>
                      <Button onClick={addManualCard} disabled={!manFront.trim() || !manBack.trim()} className="w-full"><Plus size={16}/> Add Card</Button>
                   </div>
                   {cards.length > 0 && (
                      <div className="space-y-2 mt-4">
                         <div className="text-xs font-bold text-text-secondary uppercase tracking-widest pl-1 mb-2">Saved Cards ({cards.length})</div>
                         {cards.map((c, i) => (
                            <div key={c.id} className="bg-white p-3 rounded-lg border border-border-subtle shadow-sm flex items-start justify-between gap-3 group">
                               <div className="min-w-0">
                                  <div className="text-xs font-bold text-text-primary truncate">{c.front}</div>
                                  <div className="text-xs text-text-secondary truncate mt-0.5">{c.back}</div>
                               </div>
                               <button onClick={()=>{
                                  setCards(cards.filter(cx=>cx.id!==c.id));
                                  if (currentIndex >= cards.length - 1) setCurrentIndex(Math.max(0, cards.length - 2));
                               }} className="text-text-tertiary hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                            </div>
                         ))}
                      </div>
                   )}
                </>
             )}
          </div>
       </div>

       {/* RIGHT PANEL */}
       <div className="w-full lg:w-[60%] flex flex-col h-full bg-white rounded-xl shadow-card border border-border-default overflow-hidden relative">
          
          {cards.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-surface/50">
                <Layers size={48} className="text-border-default mb-4" />
                <p className="font-semibold text-text-primary">No Cards Loaded</p>
                <p className="text-sm text-text-secondary max-w-sm mt-1">Generate or create flashcards to start studying your active recall set.</p>
             </div>
          ) : (
             <>
               <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-bg-surface/50 w-full shrink-0">
                  <div className="text-sm font-bold text-text-primary">Study Mode</div>
                  <div className="flex gap-2">
                     <button onClick={shuffleCards} className="p-2 rounded hover:bg-black/5 text-text-secondary transition-colors" title="Shuffle"><Shuffle size={16}/></button>
                     <button onClick={resetStudy} className="p-2 rounded hover:bg-black/5 text-text-secondary transition-colors" title="Reset"><RotateCcw size={16}/></button>
                  </div>
               </div>

               <div className="flex-1 relative flex flex-col items-center justify-center p-8 perspective-1000">
                  <AnimatePresence mode="wait">
                     <motion.div 
                        key={`${activeCard.id}-${isFlipped}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="w-full max-w-lg aspect-[3/2] cursor-pointer relative preserve-3d"
                        onClick={handleFlip}
                     >
                        <div 
                           className={clsx(
                             "absolute inset-0 w-full h-full rounded-2xl shadow-elevated border flex flex-col items-center justify-center p-8 text-center transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] backface-hidden",
                             !isFlipped ? "bg-gradient-to-br from-white to-[#F8FAFF] border-blue-100/50" : "transform-rotateY-180 bg-white border-border-default"
                           )}
                        >
                           {!isFlipped ? (
                             <>
                               <div className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight tracking-tight">
                                  {activeCard.front}
                               </div>
                               <div className="absolute bottom-4 text-xs font-semibold text-text-tertiary uppercase tracking-widest">Click to flip</div>
                             </>
                           ) : (
                             <>
                               <div className="text-lg sm:text-xl font-medium text-text-primary leading-relaxed absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-8 transform-rotateY-180">
                                  {activeCard.back}
                               </div>
                               <div className="absolute bottom-4 text-xs font-semibold text-text-tertiary uppercase tracking-widest transform-rotateY-180">Click to flip back</div>
                             </>
                           )}
                        </div>
                     </motion.div>
                  </AnimatePresence>

                  <div className="flex items-center justify-between w-full max-w-lg mt-8">
                     <button onClick={prevCard} className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"><ArrowLeft size={16}/> Prev</button>
                     <div className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Card {currentIndex + 1} of {cards.length}</div>
                     <button onClick={nextCard} className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">Next <ArrowRight size={16}/></button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full max-w-lg mt-6">
                     <button onClick={()=>handleAction('know')} className="py-2.5 rounded-lg border border-green-200 bg-green-50 text-green-700 font-bold text-sm hover:bg-green-100 transition-colors flex justify-center items-center gap-1"><CheckCircle2 size={16}/> Know</button>
                     <button onClick={()=>handleAction('review')} className="py-2.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 font-bold text-sm hover:bg-orange-100 transition-colors flex justify-center items-center gap-1"><AlertTriangle size={16}/> Review</button>
                     <button onClick={()=>handleAction('delete')} className="py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 transition-colors flex justify-center items-center gap-1"><Trash2 size={16}/> Delete</button>
                  </div>
               </div>

               {/* Stats Bar */}
               <div className="p-3 border-t border-border-default bg-bg-surface w-full shrink-0 flex justify-between text-xs font-bold text-text-secondary uppercase tracking-widest">
                  <div>Mastered: <span className="text-accent-green">{masteredIds.length}</span> / {cards.length}</div>
                  <div>Study Time: <span className="text-text-primary">{Math.floor(studyTime/60).toString().padStart(2,'0')}:{(studyTime%60).toString().padStart(2,'0')}</span></div>
               </div>
             </>
          )}

       </div>

       {toast && (
        <div className="fixed bottom-4 right-4 bg-text-primary text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-elevated z-50 animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
       )}

       <style>{`
         .perspective-1000 { perspective: 1000px; }
         .preserve-3d { transform-style: preserve-3d; }
         .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
         .transform-rotateY-180 { transform: rotateY(180deg); }
       `}</style>
    </div>
  );
}
