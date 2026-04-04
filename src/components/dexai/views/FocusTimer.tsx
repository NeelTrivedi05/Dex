import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Leaf, Flame, Target } from 'lucide-react';
import Button from '../../ui/Button';
import type { DexSubject, StudySessionLog } from '../types';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Kanji array for Japanese Break mode
const KANJI_SET = [
  { char: '静', reading: 'Sei', meaning: 'Quiet / Stillness' },
  { char: '集中', reading: 'Shūchū', meaning: 'Focus' },
  { char: '学', reading: 'Gaku', meaning: 'Learning' },
  { char: '悟', reading: 'Satoru', meaning: 'Enlightenment' },
  { char: '流', reading: 'Ryū', meaning: 'Flow' }
];

const HAIKU_SET = [
  "Mind like still water,\nThe rippling thoughts fade away,\nFocus finds its home.",
  "Breath in, slow and deep,\nEnergy returns to you,\nReady for the next."
];

const BREAK_ACTIVITIES = [
  "Stand up and stretch for 2 minutes",
  "Look 20 feet away for 20 seconds (20-20-20 rule)",
  "Drink a glass of water",
  "Take 5 deep breaths",
  "Walk around for 1 minute"
];

const playChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
};

const showNotification = (title: string, body: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
};

export default function FocusTimer() {
  const [subjects, setSubjects] = useState<DexSubject[]>([]);
  const [sessions, setSessions] = useState<StudySessionLog[]>([]);

  // Config
  const [mode, setMode] = useState<'Pomodoro' | 'Deep Work' | 'Custom'>('Pomodoro');
  const [workMins, setWorkMins] = useState(25);
  const [shortBreakMins, setShortBreakMins] = useState(5);
  const [longBreakMins, setLongBreakMins] = useState(15);
  const [cyclesBeforeLong, setCyclesBeforeLong] = useState(4);

  // Context
  const [subjectId, setSubjectId] = useState('');
  const [chapter, setChapter] = useState('');
  const [mood, setMood] = useState<string>('🙂');

  // Engine State
  const [sessionType, setSessionType] = useState<'Work' | 'Short Break' | 'Long Break'>('Work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isJapaneseBreak, setIsJapaneseBreak] = useState(false);

  // Audio Noise Gen
  const noiseCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const s = localStorage.getItem('dexai_subjects');
    const sl = localStorage.getItem('dexai_sessions');
    if (s) {
       const ps = JSON.parse(s);
       setSubjects(ps);
       if(ps.length>0) setSubjectId(ps[0].id);
    }
    if (sl) setSessions(JSON.parse(sl));

    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
       Notification.requestPermission();
    }
  }, []);

  const saveSession = () => {
    const newLog: StudySessionLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      subjectId,
      chapter: chapter || 'General',
      durationMinutes: mode === 'Pomodoro' ? workMins : (mode === 'Deep Work' ? 52 : workMins),
      timerMode: mode,
      mood,
      completedAt: new Date().toISOString()
    };
    const updated = [newLog, ...sessions];
    setSessions(updated);
    localStorage.setItem('dexai_sessions', JSON.stringify(updated));
  };

  useEffect(() => {
     let t: any;
     if (isActive && timeLeft > 0) {
        t = setInterval(() => setTimeLeft(l => l - 1), 1000);
     } else if (isActive && timeLeft === 0) {
        setIsActive(false);
        playChime();
        
        if (sessionType === 'Work') {
           saveSession();
           const nextCycle = currentCycle + 1;
           if (nextCycle > cyclesBeforeLong) {
              setSessionType('Long Break');
              setTimeLeft(longBreakMins * 60);
              setCurrentCycle(1);
              showNotification("Long Break Started", "Time to recharge for a bit.");
           } else {
              setCurrentCycle(nextCycle);
              setSessionType('Short Break');
              setTimeLeft(shortBreakMins * 60);
              showNotification("Short Break Started", "Take a breather.");
           }
           
           if (mode === 'Deep Work') setIsJapaneseBreak(true);
           
           setIsActive(true);
        } else {
           // Break ended
           setSessionType('Work');
           setTimeLeft(workMins * 60);
           setIsJapaneseBreak(false);
           showNotification("Work Session Started", "Let's focus.");
           setIsActive(true);
        }
     }
     return () => clearInterval(t);
  }, [isActive, timeLeft, sessionType, currentCycle, mode, workMins, shortBreakMins, longBreakMins, cyclesBeforeLong]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
     setIsActive(false);
     setSessionType('Work');
     setTimeLeft(workMins * 60);
     setCurrentCycle(1);
     setIsJapaneseBreak(false);
  };
  const skipSession = () => setTimeLeft(0);

  const applyMode = (m: 'Pomodoro' | 'Deep Work' | 'Custom') => {
     setMode(m);
     setIsActive(false);
     setIsJapaneseBreak(false);
     if (m === 'Pomodoro') {
        setWorkMins(25); setShortBreakMins(5); setLongBreakMins(15); setCyclesBeforeLong(4);
        setTimeLeft(25*60);
     } else if (m === 'Deep Work') {
        setWorkMins(52); setShortBreakMins(17); setLongBreakMins(17); setCyclesBeforeLong(1);
        setTimeLeft(52*60);
     } else {
        setTimeLeft(workMins*60);
     }
  };

  const toggleNoise = () => {
     if (audioEnabled) {
        if (noiseCtxRef.current) noiseCtxRef.current.close();
        setAudioEnabled(false);
     } else {
        try {
           const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
           const bufferSize = ctx.sampleRate * 2;
           const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
           const output = buffer.getChannelData(0);
           for (let i = 0; i < bufferSize; i++) {
               output[i] = Math.random() * 2 - 1;
           }
           const whiteNoise = ctx.createBufferSource();
           whiteNoise.buffer = buffer;
           whiteNoise.loop = true;
           
           // Lowpass filter for brown noise effect
           const biquad = ctx.createBiquadFilter();
           biquad.type = 'lowpass';
           biquad.frequency.value = 400;
           
           whiteNoise.connect(biquad);
           biquad.connect(ctx.destination);
           whiteNoise.start();
           
           noiseCtxRef.current = ctx;
           noiseSourceRef.current = whiteNoise;
           setAudioEnabled(true);
        } catch (e) {}
     }
  };

  const totalSeconds = sessionType === 'Work' ? workMins * 60 : (sessionType === 'Short Break' ? shortBreakMins * 60 : longBreakMins * 60);
  const progressPerc = 1 - (timeLeft / totalSeconds);
  const strokeColor = sessionType === 'Work' ? '#007AFF' : (sessionType === 'Short Break' ? '#34C759' : '#FF9F0A');

  const todayIso = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.date.startsWith(todayIso));
  const todayMins = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  // Japanese Break Math
  const jIndex = currentCycle % KANJI_SET.length;
  const kanji = KANJI_SET[jIndex];
  const haiku = HAIKU_SET[jIndex % HAIKU_SET.length];

  return (
    <div className="flex flex-col gap-6 h-full max-w-5xl mx-auto w-full relative animate-in fade-in pb-12">
       
       <div className="flex bg-white rounded-xl shadow-card border border-border-default p-1 w-full max-w-sm mx-auto z-10 shrink-0">
          {(['Pomodoro', 'Deep Work', 'Custom'] as const).map(m => (
             <button key={m} onClick={()=>applyMode(m)} className={clsx("flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors", mode === m ? "bg-accent-blue text-white" : "text-text-secondary hover:bg-bg-surface")}>
               {m}
             </button>
          ))}
       </div>

       {mode === 'Custom' && !isActive && sessionType === 'Work' && (
          <div className="grid grid-cols-4 gap-4 p-4 bg-white rounded-xl shadow-card border border-border-default max-w-2xl mx-auto z-10">
             <div><label className="text-2xs font-bold text-text-secondary mb-1 block">Work (m)</label><input type="number" min="1" value={workMins} onChange={e=>{setWorkMins(Number(e.target.value)); setTimeLeft(Number(e.target.value)*60)}} className="w-full h-8 px-2 border rounded-lg text-sm" /></div>
             <div><label className="text-2xs font-bold text-text-secondary mb-1 block">Short Break (m)</label><input type="number" min="1" value={shortBreakMins} onChange={e=>setShortBreakMins(Number(e.target.value))} className="w-full h-8 px-2 border rounded-lg text-sm" /></div>
             <div><label className="text-2xs font-bold text-text-secondary mb-1 block">Long Break (m)</label><input type="number" min="1" value={longBreakMins} onChange={e=>setLongBreakMins(Number(e.target.value))} className="w-full h-8 px-2 border rounded-lg text-sm" /></div>
             <div><label className="text-2xs font-bold text-text-secondary mb-1 block">Cycles Before Long</label><input type="number" min="1" value={cyclesBeforeLong} onChange={e=>setCyclesBeforeLong(Number(e.target.value))} className="w-full h-8 px-2 border rounded-lg text-sm" /></div>
          </div>
       )}

       <div className="flex flex-col lg:flex-row gap-8 items-start w-full relative h-[500px]">
          
          {/* Main Timer Area */}
          <div className="flex-1 w-full h-full bg-white rounded-xl shadow-card border border-border-default p-8 flex flex-col items-center justify-center relative overflow-hidden">
             
             <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 pointer-events-none">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" className="text-bg-surface" strokeWidth="4" />
                  <circle 
                    cx="50" cy="50" r="46" fill="none" stroke={strokeColor} className="transition-all duration-1000 ease-linear" strokeWidth="4" 
                    strokeDasharray={`${progressPerc * 289.02} 289.02`} 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <div className="text-5xl font-mono tracking-tight font-bold text-text-primary">
                      {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
                   </div>
                   <div className="text-sm font-bold mt-2 uppercase tracking-widest text-text-secondary" style={{color: strokeColor}}>{sessionType}</div>
                   {sessionType === 'Work' && mode !== 'Deep Work' && <div className="text-xs text-text-tertiary mt-1">Cycle {currentCycle} of {cyclesBeforeLong}</div>}
                </div>
             </div>

             <div className="flex items-center gap-4 z-10">
                <Button variant="ghost" onClick={resetTimer} className="h-12 w-12 rounded-full p-0 flex items-center justify-center"><RotateCcw size={18}/></Button>
                <Button onClick={toggleTimer} className="h-14 w-14 rounded-full p-0 flex items-center justify-center shadow-lg border-2" style={{borderColor: strokeColor}}>
                  {isActive ? <Pause size={24}/> : <Play size={24} className="ml-1"/>}
                </Button>
                <Button variant="ghost" onClick={skipSession} className="h-12 w-12 rounded-full p-0 flex items-center justify-center"><SkipForward size={18}/></Button>
             </div>

             <button onClick={toggleNoise} className={clsx("absolute top-4 right-4 p-2 rounded-full transition-colors z-10", audioEnabled ? "bg-accent-blue/10 text-accent-blue" : "text-text-tertiary hover:bg-bg-surface")}>
                {audioEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}
             </button>

             {/* Japanese Deep Work Overlay */}
             <AnimatePresence>
                {isJapaneseBreak && (
                   <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="absolute inset-0 bg-[#FBF9F6] z-40 flex flex-col items-center justify-center p-8 border-t-4 border-accent-blue">
                      <Leaf size={24} className="text-accent-blue/50 mb-6" />
                      <div className="text-[120px] font-serif leading-none mb-2 text-text-primary mix-blend-multiply opacity-80">{kanji.char}</div>
                      <div className="text-sm font-bold tracking-[0.3em] uppercase text-text-secondary mb-8">{kanji.reading} • {kanji.meaning}</div>
                      
                      <div className="text-center italic text-text-primary text-lg leading-relaxed max-w-sm mb-12 whitespace-pre-wrap font-serif">
                         {haiku}
                      </div>

                      <div className="bg-white/50 px-6 py-3 rounded-full border border-black/5 text-sm font-bold text-text-primary mb-6 animate-pulse shadow-sm">
                         {BREAK_ACTIVITIES[timeLeft % BREAK_ACTIVITIES.length]}
                      </div>

                      <div className="text-3xl font-mono text-accent-blue font-bold">
                        {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
                      </div>
                      
                      <button onClick={skipSession} className="absolute bottom-6 right-6 text-xs font-bold text-text-tertiary flex items-center gap-1 hover:text-text-primary"><SkipForward size={14}/> Skip Break</button>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* Right Context Panel */}
          <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full">
             
             {/* Pre-flight context */}
             <div className="bg-white rounded-xl shadow-card border border-border-default p-5">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex gap-2 items-center"><Target size={14}/> Session Context</h3>
                <div className="space-y-4">
                   <div>
                      <select value={subjectId} onChange={e=>setSubjectId(e.target.value)} disabled={isActive} className="w-full text-sm border border-border-default rounded-lg p-2 focus:outline-none focus:border-accent-blue disabled:opacity-50">
                         {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <input value={chapter} onChange={e=>setChapter(e.target.value)} disabled={isActive} placeholder="What are you studying? (optional)" className="w-full text-sm border border-border-default rounded-lg p-2 focus:outline-none focus:border-accent-blue disabled:opacity-50" />
                   </div>
                   <div>
                      <div className="text-2xs font-bold text-text-secondary mb-1">Check-in Mood</div>
                      <div className="flex justify-between p-1 bg-bg-surface rounded-lg">
                         {['😴','😐','🙂','😃','🔥'].map(emo => (
                            <button key={emo} onClick={()=>setMood(emo)} disabled={isActive} className={clsx("w-8 h-8 rounded shrink-0 flex items-center justify-center text-lg disabled:opacity-50 transition-all", mood===emo ? "bg-white shadow-sm ring-1 ring-border-subtle scale-110" : "")}>{emo}</button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             {/* Streak & Todays log */}
             <div className="flex-1 bg-white rounded-xl shadow-card border border-border-default p-5 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                   <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Today's Focus</h3>
                   <div className="flex items-center gap-1 font-bold text-sm text-accent-orange"><Flame size={16}/> {todayMins}m</div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar relative min-h-[100px]">
                   {todaySessions.length === 0 && <div className="text-xs text-text-tertiary italic text-center py-4">No sessions completed today yet.</div>}
                   {todaySessions.map(ses => {
                      const sName = subjects.find(s=>s.id===ses.subjectId)?.name || 'General';
                      return (
                        <div key={ses.id} className="p-2 border border-border-subtle rounded-lg bg-bg-surface flex justify-between items-center text-xs">
                           <div>
                             <div className="font-bold text-text-primary mr-2 truncate max-w-[100px] inline-block align-bottom">{sName}</div>
                             {ses.chapter && <div className="text-text-secondary inline-block truncate max-w-[80px] align-bottom text-[10px]">&bull; {ses.chapter}</div>}
                           </div>
                           <div className="flex items-center gap-2 font-mono font-semibold text-text-secondary">
                             {ses.durationMinutes}m <span>{ses.mood}</span>
                           </div>
                        </div>
                      )
                   })}
                </div>
             </div>

          </div>
       </div>

    </div>
  );
}
