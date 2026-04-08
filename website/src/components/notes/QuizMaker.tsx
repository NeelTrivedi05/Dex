import { useState, useEffect } from 'react';
import { Target, FileText, AlignLeft, Settings2, Clock, CheckCircle2, ChevronRight, RefreshCw, Save, RefreshCcw, BookOpen, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import type { SavedNote } from './types';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizMakerProps {
  initialNote?: SavedNote | null;
}

interface QuizQuestion {
  question: string;
  options?: string[]; // for MCQ
  answer: string;
  explanation: string;
}

type QuizPhase = 'config' | 'taking' | 'results';

export default function QuizMaker({ initialNote }: QuizMakerProps) {
  // Config State
  const [sourceMode, setSourceMode] = useState<'notes' | 'summary' | 'topic'>('notes');
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [summaryText, setSummaryText] = useState('');
  const [topicInput, setTopicInput] = useState('');

  const [qCount, setQCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'Easy'|'Medium'|'Hard'>('Medium');
  const [qType, setQType] = useState<'Multiple Choice'|'True/False'|'Mixed'>('Multiple Choice');
  const [timeLimit, setTimeLimit] = useState<number>(0); // 0 = None, minutes

  // Quiz Engine State
  const [phase, setPhase] = useState<QuizPhase>('config');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);

  const [toast, setToast] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('edumind_notes');
    if (s) {
       const parsed = JSON.parse(s);
       setSavedNotes(parsed);
       if (initialNote) setSelectedNoteIds([initialNote.id]);
    }
  }, [initialNote]);

  // Timer Effect
  useEffect(() => {
    let t: any;
    if (phase === 'taking') {
       t = setInterval(() => {
          setTimeSpent(s => s + 1);
          if (timeRemaining !== null && timeRemaining > 0) {
             setTimeRemaining(r => r! - 1);
          } else if (timeRemaining === 0) {
             handleFinishQuiz();
          }
       }, 1000);
    }
    return () => clearInterval(t);
  }, [phase, timeRemaining]);

  const showToast = (m: string) => { setToast(m); setTimeout(()=>setToast(null), 4000); };

  const handleGenerate = async () => {
    let contextStr = '';
    if (sourceMode === 'notes') {
       if (selectedNoteIds.length === 0) return showToast("Select at least one note.");
       const txt = savedNotes.filter(n => selectedNoteIds.includes(n.id)).map(n => n.content).join('\n---\n');
       contextStr = `Content:\n${txt}`;
    } else if (sourceMode === 'summary') {
       if (!summaryText.trim()) return showToast("Enter summary text.");
       contextStr = `Content:\n${summaryText}`;
    } else {
       if (!topicInput.trim()) return showToast("Enter a topic.");
       contextStr = topicInput.trim();
    }

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) return showToast("API key missing. Check settings.");

    setIsGenerating(true);
    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
           body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                 { role: 'system', content: `Generate a quiz with exactly ${qCount} questions at ${difficulty} difficulty on the topic of: '${contextStr}'. Question type: ${qType}. Respond with ONLY a valid JSON array. No markdown. No code fences. For multiple choice: { "question": "string", "options": ["string", "string", "string", "string"], "answer": "string matching one option", "explanation": "string" }. For true/false: { "question": "string", "answer": "True" or "False", "explanation": "string" }.` },
                 { role: 'user', content: 'Generate JSON array' }
              ],
              max_tokens: 3000,
              temperature: 0.3
           })
        });

        if (!res.ok) throw new Error("API call failed.");
        const data = await res.json();
        let raw = data.choices[0].message.content.trim();
        if (raw.startsWith('```json')) raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        if (raw.startsWith('```')) raw = raw.replace(/```/g, '').trim();

        const qs = JSON.parse(raw);
        if (!Array.isArray(qs) || qs.length === 0) throw new Error("Bad JSON format");

        setQuestions(qs);
        setUserAnswers([]);
        setCurrentIndex(0);
        setSelectedAns(null);
        setSubmitted(false);
        setTimeSpent(0);
        setShowReview(false);
        if (timeLimit > 0) setTimeRemaining(timeLimit * 60);
        else setTimeRemaining(null);
        
        setPhase('taking');

    } catch(e) {
        showToast("AI parsing error. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const submitAnswer = () => {
     if (!selectedAns) return;
     setSubmitted(true);
     const newAnswers = [...userAnswers];
     newAnswers[currentIndex] = selectedAns;
     setUserAnswers(newAnswers);
  };

  const handleNext = () => {
     if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAns(null);
        setSubmitted(false);
     } else {
        handleFinishQuiz();
     }
  };

  const handleFinishQuiz = () => {
     setPhase('results');
  };

  const saveScore = () => {
      const correct = userAnswers.reduce((acc, a, i) => acc + (a === questions[i].answer ? 1 : 0), 0);
      const scorePerc = Math.round((correct / questions.length) * 100);
      
      const topicName = sourceMode === 'topic' ? topicInput : (sourceMode === 'notes' ? savedNotes.find(n=>n.id===selectedNoteIds[0])?.title || 'Selected Notes' : 'Summary Context');

      const entry = {
         id: crypto.randomUUID(),
         date: new Date().toISOString(),
         score: scorePerc,
         total: questions.length,
         topic: topicName,
         timeSpent
      };

      const h = localStorage.getItem('edumind_quiz_history');
      const hist = h ? JSON.parse(h) : [];
      localStorage.setItem('edumind_quiz_history', JSON.stringify([entry, ...hist]));
      showToast("Score saved to history!");
  };

  const formatTime = (sec: number) => {
     if (sec < 0) return '00:00';
     const m = Math.floor(sec/60);
     const s = sec % 60;
     return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const correctCount = userAnswers.reduce((acc, a, i) => acc + (a === questions[i]?.answer ? 1 : 0), 0);
  const scoreBadge = (score: number) => {
    if (score >= 90) return { label: 'A', c: 'bg-green-100 text-green-700' };
    if (score >= 80) return { label: 'B', c: 'bg-blue-100 text-blue-700' };
    if (score >= 70) return { label: 'C', c: 'bg-yellow-100 text-yellow-700' };
    if (score >= 60) return { label: 'D', c: 'bg-orange-100 text-orange-700' };
    return { label: 'F', c: 'bg-red-100 text-red-700' };
  };

  const renderConfig = () => (
     <div className="w-full lg:w-[45%] flex flex-col gap-6">
        <h3 className="text-sm font-bold text-text-primary">Quiz Configuration</h3>
        
        {/* Source Mode */}
        <div className="space-y-3">
           <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block">Quiz Source</label>
           <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'notes', l: 'From Notes', i: <FileText size={16}/> },
                { id: 'summary', l: 'From Summary', i: <AlignLeft size={16}/> },
                { id: 'topic', l: 'Enter Topic', i: <Target size={16}/> }
              ].map(m => (
                 <button key={m.id} onClick={()=>setSourceMode(m.id as any)} className={clsx("flex flex-col items-center justify-center p-3 gap-2 rounded-xl border transition-all text-xs font-bold", sourceMode === m.id ? "bg-accent-blue/5 border-accent-blue text-accent-blue" : "bg-white border-border-default text-text-secondary hover:bg-bg-surface")}>
                    {m.i} {m.l}
                 </button>
              ))}
           </div>

           <div className="bg-white rounded-xl shadow-card border border-border-default p-4 h-48 overflow-y-auto">
              {sourceMode === 'notes' && (
                 <>
                   {savedNotes.length === 0 ? <p className="text-sm text-text-tertiary">No saved notes found.</p> : (
                      savedNotes.map(sn => (
                         <label key={sn.id} className="flex items-center gap-3 p-2 hover:bg-bg-surface rounded-lg cursor-pointer">
                            <input type="checkbox" checked={selectedNoteIds.includes(sn.id)} onChange={e=> {
                               if(e.target.checked) setSelectedNoteIds([...selectedNoteIds, sn.id]);
                               else setSelectedNoteIds(selectedNoteIds.filter(i=>i!==sn.id));
                            }} className="w-4 h-4 rounded text-accent-blue focus:ring-accent-blue border-border-default" />
                            <span className="text-sm font-medium text-text-primary">{sn.title}</span>
                         </label>
                      ))
                   )}
                 </>
              )}
              {sourceMode === 'summary' && (
                 <textarea value={summaryText} onChange={e=>setSummaryText(e.target.value)} placeholder="Paste your summary or raw text..." className="w-full h-full resize-none text-sm focus:outline-none" />
              )}
              {sourceMode === 'topic' && (
                 <input value={topicInput} onChange={e=>setTopicInput(e.target.value)} placeholder="E.g. Cell Biology, Machine Learning..." className="w-full h-10 px-3 bg-bg-surface border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-blue" />
              )}
           </div>
        </div>

        {/* Settings */}
        <div className="space-y-4 bg-white rounded-xl shadow-card border border-border-default p-5">
           <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2"><Settings2 size={14}/> Settings</h4>
           
           <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                 <span>Number of Questions</span><span>{qCount}</span>
              </div>
              <input type="range" min="5" max="20" step="1" value={qCount} onChange={e=>setQCount(Number(e.target.value))} className="w-full" />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-xs font-semibold text-text-secondary mb-1 block">Difficulty</label>
                 <select value={difficulty} onChange={e=>setDifficulty(e.target.value as any)} className="w-full h-9 bg-bg-surface border border-border-default rounded text-sm px-2">
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                 </select>
              </div>
              <div>
                 <label className="text-xs font-semibold text-text-secondary mb-1 block">Type</label>
                 <select value={qType} onChange={e=>setQType(e.target.value as any)} className="w-full h-9 bg-bg-surface border border-border-default rounded text-sm px-2">
                    <option>Multiple Choice</option><option>True/False</option><option>Mixed</option>
                 </select>
              </div>
           </div>

           <div>
              <label className="text-xs font-semibold text-text-secondary mb-1 block">Time Limit</label>
              <select value={timeLimit} onChange={e=>setTimeLimit(Number(e.target.value))} className="w-full h-9 bg-bg-surface border border-border-default rounded text-sm px-2">
                 <option value={0}>None</option>
                 <option value={5}>5 min</option>
                 <option value={10}>10 min</option>
                 <option value={15}>15 min</option>
                 <option value={30}>30 min</option>
              </select>
           </div>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-12 text-base font-bold flex justify-center items-center gap-2">
           {isGenerating ? <RefreshCw className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
           {isGenerating ? 'Drafting Assessment...' : 'Generate Quiz'}
        </Button>
     </div>
  );

  const curQ = questions[currentIndex];

  const renderActive = () => (
     <div className="w-full lg:w-[55%] flex flex-col h-[600px] border border-border-default rounded-xl shadow-card bg-white overflow-hidden relative">
        <div className="h-1.5 w-full bg-border-default">
           <div className="h-full bg-accent-blue transition-all" style={{width: `${((currentIndex)/questions.length)*100}%`}} />
        </div>
        
        <div className="p-5 border-b border-border-subtle bg-bg-surface flex items-center justify-between shrink-0">
           <div className="text-sm font-bold text-text-primary">Question {currentIndex + 1} / {questions.length}</div>
           {timeRemaining !== null && (
              <div className={clsx("flex items-center gap-2 font-mono font-bold px-3 py-1 rounded-full text-xs", timeRemaining < 30 ? "bg-red-100 text-red-600 animate-pulse" : "bg-white border shadow-sm text-text-secondary")}>
                 <Clock size={14}/> {formatTime(timeRemaining)}
              </div>
           )}
        </div>

        <div className="flex-1 p-6 sm:p-10 overflow-y-auto">
           <h2 className="text-xl font-medium text-text-primary leading-relaxed mb-8">{curQ?.question}</h2>
           
           <div className="space-y-3">
              {curQ?.options ? curQ.options.map((opt, i) => {
                 const isSel = selectedAns === opt;
                 const isCorrect = submitted && curQ.answer === opt;
                 const isWrong = submitted && isSel && !isCorrect;
                 
                 let styleClass = "border-border-default hover:border-accent-blue text-text-secondary hover:bg-bg-surface";
                 if (isSel && !submitted) styleClass = "border-accent-blue bg-accent-blue/5 text-accent-blue";
                 else if (isCorrect) styleClass = "border-accent-green bg-green-50 text-green-800";
                 else if (isWrong) styleClass = "border-accent-red bg-red-50 text-red-800";
                 else if (submitted) styleClass = "opacity-50 border-border-subtle";

                 return (
                   <button key={i} onClick={() => !submitted && setSelectedAns(opt)} disabled={submitted} className={clsx("w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-sm flex gap-3 items-center group", styleClass)}>
                      <div className={clsx("w-6 h-6 rounded flex items-center justify-center shrink-0 border-2 font-bold text-xs transition-colors", 
                        isSel && !submitted ? "border-accent-blue bg-accent-blue text-white" : isCorrect ? "border-accent-green bg-accent-green text-white" : isWrong ? "border-accent-red bg-accent-red text-white" : "border-border-default text-text-tertiary group-hover:border-accent-blue group-hover:text-accent-blue"
                      )}>
                         {String.fromCharCode(65+i)}
                      </div>
                      <span className="leading-snug">{opt}</span>
                   </button>
                 )
              }) : (
                 <div className="grid grid-cols-2 gap-4">
                    {['True', 'False'].map(opt => {
                       const isSel = selectedAns === opt;
                       const isCorrect = submitted && curQ.answer === opt;
                       const isWrong = submitted && isSel && !isCorrect;
                       let styleClass = "border-border-default hover:border-accent-blue text-text-secondary hover:bg-bg-surface";
                       if (isSel && !submitted) styleClass = "border-accent-blue bg-accent-blue/5 text-accent-blue";
                       else if (isCorrect) styleClass = "border-accent-green bg-green-50 text-green-800";
                       else if (isWrong) styleClass = "border-accent-red bg-red-50 text-red-800";
                       else if (submitted) styleClass = "opacity-50 border-border-subtle";

                       return (
                         <button key={opt} onClick={() => !submitted && setSelectedAns(opt)} disabled={submitted} className={clsx("py-6 rounded-xl border-2 transition-all font-bold text-lg", styleClass)}>
                            {opt}
                         </button>
                       )
                    })}
                 </div>
              )}
           </div>

           {submitted && (
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={clsx("mt-6 p-4 rounded-xl border", selectedAns === curQ.answer ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                 <div className="font-bold mb-1">{selectedAns === curQ.answer ? 'Correct!' : 'Incorrect'}</div>
                 <p className="text-sm">{curQ.explanation}</p>
              </motion.div>
           )}
        </div>

        <div className="p-5 border-t border-border-default bg-bg-surface flex justify-end shrink-0">
           {!submitted ? (
              <Button onClick={submitAnswer} disabled={!selectedAns}>Submit Answer</Button>
           ) : (
              <Button onClick={handleNext} className="flex gap-2 items-center">{currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ChevronRight size={16}/></Button>
           )}
        </div>
     </div>
  );

  const renderResults = () => {
    const finalScore = Math.round((correctCount / questions.length) * 100);
    const badge = scoreBadge(finalScore);

    return (
     <div className="w-full lg:w-[55%] flex flex-col h-[600px] border border-border-default rounded-xl shadow-card bg-white overflow-hidden relative overflow-y-auto p-8">
        <div className="flex flex-col items-center justify-center py-8">
           <div className={clsx("w-24 h-24 rounded-full flex items-center justify-center text-5xl font-black mb-4 shadow-sm text-white", badge.c.split(' ')[0], badge.c.replace('bg-','').replace('-100','').replace('text-','bg-'))}>
              {badge.label}
           </div>
           <h2 className="text-3xl font-bold text-text-primary mb-2">{finalScore}%</h2>
           <p className="font-medium text-text-secondary">You got {correctCount} out of {questions.length} correct.</p>
           <p className="text-sm text-text-tertiary mt-1 flex items-center gap-1.5"><Clock size={14}/> Completed in {formatTime(timeSpent)}</p>
           
           <div className="flex gap-3 mt-8">
             <Button variant="ghost" onClick={saveScore} className="font-semibold flex items-center gap-2"><Save size={16}/> Save Score</Button>
             <Button onClick={()=>setPhase('config')} className="flex items-center gap-2"><RefreshCcw size={16}/> New Quiz</Button>
           </div>
        </div>

        <div className="mt-8">
           <button onClick={()=>setShowReview(!showReview)} className="text-sm font-bold text-text-primary flex items-center justify-between w-full p-4 bg-bg-surface rounded-xl hover:bg-black/5 transition-colors">
              Review Answers <ChevronRight size={16} className={clsx("transition-transform", showReview && "rotate-90")}/>
           </button>
           <AnimatePresence>
             {showReview && (
                <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} className="overflow-hidden space-y-4 mt-4">
                   {questions.map((q, i) => {
                      const uA = userAnswers[i];
                      const isC = uA === q.answer;
                      return (
                        <div key={i} className="p-4 border border-border-default rounded-xl bg-white shadow-sm">
                           <div className="text-sm font-bold text-text-primary mb-2">{i+1}. {q.question}</div>
                           <div className="flex items-center gap-2 text-xs mb-1">
                              <span className="text-text-tertiary uppercase font-bold tracking-widest w-12 text-right">You</span>
                              <span className={clsx("font-semibold px-2 py-0.5 rounded", isC ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{uA || 'Skipped'}</span>
                           </div>
                           {!isC && (
                             <div className="flex items-center gap-2 text-xs mb-2">
                                <span className="text-text-tertiary uppercase font-bold tracking-widest w-12 text-right">Answer</span>
                                <span className="font-semibold text-green-700">{q.answer}</span>
                             </div>
                           )}
                           <div className="mt-2 text-xs text-text-secondary border-t border-border-subtle pt-2">{q.explanation}</div>
                        </div>
                      )
                   })}
                </motion.div>
             )}
           </AnimatePresence>
        </div>
     </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full animate-in fade-in pb-12 items-start">
       
       {phase === 'config' ? renderConfig() : <div className="hidden lg:block w-[45%] opacity-50 pointer-events-none">{renderConfig()}</div>}

       {phase === 'config' && (
          <div className="w-full lg:w-[55%] flex flex-col h-[600px] border border-border-default rounded-xl bg-bg-surface/50 items-center justify-center p-10 text-center">
             <div className="w-20 h-20 rounded-full bg-white shadow-card flex items-center justify-center mb-6 border border-border-subtle">
               <BookOpen size={32} className="text-accent-blue" />
             </div>
             <h2 className="text-xl font-bold text-text-primary mb-3">Ready to Test Your Knowledge?</h2>
             <ul className="text-sm text-text-secondary space-y-2 text-left bg-white p-6 rounded-xl border border-border-default shadow-sm w-full max-w-sm">
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-accent-green shrink-0 mt-0.5"/> <span>Automatically extracted from your academic notes.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-accent-green shrink-0 mt-0.5"/> <span>Timed assessments build exam-day pressure resilience.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-accent-green shrink-0 mt-0.5"/> <span>Detailed explanations reinforce difficult concepts.</span></li>
             </ul>
          </div>
       )}

       {phase === 'taking' && renderActive()}
       {phase === 'results' && renderResults()}

       {toast && (
        <div className="fixed bottom-4 right-4 bg-text-primary text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-elevated z-50 animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
       )}
    </div>
  );
}
