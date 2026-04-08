import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Target } from 'lucide-react';
import clsx from 'clsx';
import { defaultSettings, type FocusTimerSettings } from './SettingsView';

type TimerMode = 'pomodoro' | 'custom';
type TimerPhase = 'work' | 'short_break' | 'long_break';

interface Session {
  id: string; date: string; subject: string; chapter: string;
  durationMinutes: number; timerMode: string; mood: string; completedAt: string;
}

export default function TimerView() {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [phase, setPhase] = useState<TimerPhase>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [cycle, setCycle] = useState(1);
  const [settings, setSettings] = useState<FocusTimerSettings>(defaultSettings);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('timer_sound_enabled') !== 'false');

  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('General Study');
  const [taskName, setTaskName] = useState('');
  const [mood, setMood] = useState<string>('😐');
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);

  const emojis = ['😴', '😐', '🙂', '😃', '🔥'];

   const loadSettingsFromStorage = (): FocusTimerSettings => {
       const raw = localStorage.getItem('focus_timer_settings');
       if (!raw) return defaultSettings;
       try {
          return { ...defaultSettings, ...JSON.parse(raw) };
       } catch {
          return defaultSettings;
       }
   };

  useEffect(() => {
       const st = loadSettingsFromStorage();
       setSettings(st);
     
     const subRaw = localStorage.getItem('dexai_subjects');
     if (subRaw) setSubjects(JSON.parse(subRaw));

     loadTodaySessions();

     if (mode === 'pomodoro') resetToPhase('work', 'pomodoro', st);
     else resetToPhase('work', 'custom', st);
  }, [mode]);

  useEffect(() => {
     const syncSettings = () => {
        setSettings(loadSettingsFromStorage());
     };

     window.addEventListener('storage', syncSettings);
     window.addEventListener('focus_timer_settings_update', syncSettings);

     return () => {
        window.removeEventListener('storage', syncSettings);
        window.removeEventListener('focus_timer_settings_update', syncSettings);
     };
  }, []);

  const loadTodaySessions = () => {
     const tRaw = localStorage.getItem('dexai_sessions');
     if (tRaw) {
        const today = new Date().toISOString().split('T')[0];
        setTodaySessions(JSON.parse(tRaw).filter((s:any)=>s.date === today));
     }
  };

  const resetToPhase = (ph: TimerPhase, m: TimerMode, s: FocusTimerSettings) => {
     setPhase(ph);
     setIsRunning(false);
     let min = 25;
     if (m === 'pomodoro') {
        if (ph === 'work') min = 25; else if (ph === 'short_break') min = 5; else min = 15;
     } else if (m === 'custom') {
        if (ph === 'work') min = s.focusDuration; else if (ph === 'short_break') min = s.breakDuration; else min = s.longBreakDuration;
     }
     setTimeLeft(min * 60);
     setTotalTime(min * 60);
  };

  useEffect(() => {
     let t: any;
     if (isRunning && timeLeft > 0) t = setInterval(()=>setTimeLeft(l => l - 1), 1000);
     else if (isRunning && timeLeft === 0) handlePhaseComplete();
     return () => clearInterval(t);
  }, [isRunning, timeLeft]);

  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); setIsRunning(r=>!r); }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const playChime = (freq: number) => {
     if (!soundOn || !settings.soundEnabled) return;
     try {
       const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
       const osc = actx.createOscillator();
       const gain = actx.createGain();
       osc.type = 'sine'; osc.frequency.setValueAtTime(freq, actx.currentTime);
       gain.gain.setValueAtTime(0, actx.currentTime);
       gain.gain.linearRampToValueAtTime(0.5, actx.currentTime + 0.1);
       gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.4);
       osc.connect(gain); gain.connect(actx.destination);
       osc.start(); osc.stop(actx.currentTime + 0.4);
     } catch(e) {}
  };

  const sendNotif = (title: string, body: string) => {
     if (Notification.permission === 'granted') new Notification(title, { body });
  };

  const logSession = () => {
     if (phase !== 'work') return;
     let dur = 0;
     if (mode === 'pomodoro') dur = 25; else dur = settings.focusDuration;
     
     const s = localStorage.getItem('dexai_sessions');
     const past = s ? JSON.parse(s) : [];
     const entry: Session = {
        id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0],
        subject: selectedSubject, chapter: taskName || 'Focus Session',
        durationMinutes: dur, timerMode: mode, mood, completedAt: new Date().toISOString()
     };
     localStorage.setItem('dexai_sessions', JSON.stringify([entry, ...past]));
     window.dispatchEvent(new Event('dexai_sessions_update'));
     loadTodaySessions();
  };

  const handlePhaseComplete = () => {
     if (phase === 'work') {
        playChime(440);
        sendNotif("Dex Focus Timer", "Work session complete — take a break!");
        logSession();
        
        let nextPhase: TimerPhase = 'short_break';
        if (cycle % settings.sessionsBeforeLongBreak === 0) nextPhase = 'long_break';
        
        resetToPhase(nextPhase, mode, settings);
        if (settings.autoStartBreaks) setIsRunning(true);
     } else {
        playChime(528);
        sendNotif("Dex Focus Timer", "Break over — back to work!");
        setCycle(c => c + 1);
        resetToPhase('work', mode, settings);
        if (settings.autoStartFocus) setIsRunning(true);
     }
  };

  const toggleTimer = () => {
     if (!isRunning && Notification.permission === 'default') Notification.requestPermission();
     setIsRunning(!isRunning);
  };

  const skipPhase = () => handlePhaseComplete();
  const resetCurrent = () => resetToPhase(phase, mode, settings);

  const toggleSound = () => {
     const next = !soundOn; setSoundOn(next);
     localStorage.setItem('timer_sound_enabled', String(next));
  };

  const renderTimerRing = () => {
     const radius = 106; const circ = 2 * Math.PI * radius;
     const pct = timeLeft / totalTime;
     const offset = circ - (circ * pct);
     const cColor = phase === 'work' ? 'stroke-accent-blue' : phase === 'short_break' ? 'stroke-accent-green' : 'stroke-orange-500';

     return (
       <div className="relative w-[240px] h-[240px] mx-auto my-6 flex items-center justify-center">
         <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 240 240">
           <circle cx="120" cy="120" r={radius} fill="none" className="stroke-border-default transition-all duration-1000" strokeWidth="8" />
           <circle cx="120" cy="120" r={radius} fill="none" className={clsx("transition-all duration-1000 ease-linear", cColor)} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
         </svg>
         <div className="flex flex-col items-center justify-center relative z-10 w-full">
            <div className="text-[2.75rem] font-bold text-text-primary leading-none tracking-tight font-mono">
               {Math.floor(timeLeft / 60).toString().padStart(2,'0')}:{(timeLeft % 60).toString().padStart(2,'0')}
            </div>
            {!isRunning && timeLeft === totalTime && phase !== 'work' ? (
                <div className="text-xs font-bold text-accent-blue uppercase tracking-widest mt-2 px-6 text-center">Ready to focus? Click play.</div>
            ) : (
               <>
                 <div className={clsx("text-[0.8rem] font-bold uppercase tracking-widest mt-2", phase==='work' ? 'text-accent-blue' : phase==='short_break' ? 'text-accent-green' : 'text-orange-500')}>
                    {phase === 'work' ? 'Work' : phase === 'short_break' ? 'Short Break' : 'Long Break'}
                 </div>
                 <div className="text-[0.8rem] text-text-secondary mt-1">Cycle {cycle} of {settings.sessionsBeforeLongBreak}</div>
               </>
            )}
         </div>
       </div>
     );
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in">
       
       {/* MODE SELECTOR */}
       <div className="flex justify-center mb-2">
          <div className="flex bg-bg-surface border border-border-default rounded-full p-1 shadow-sm">
                   {(['pomodoro', 'custom'] as TimerMode[]).map(m => (
                <button 
                  key={m} onClick={() => setMode(m)}
                  className={clsx("px-5 py-1.5 text-xs font-bold rounded-full transition-colors capitalize", mode === m ? "bg-accent-blue text-white shadow-sm" : "text-text-secondary hover:text-text-primary")}
                >
                   {m}
                </button>
             ))}
          </div>
       </div>

       <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN - TIMER CARD */}
          <div className="w-full lg:w-[55%] bg-white rounded-xl shadow-card border border-border-default relative p-8 flex flex-col items-center">
             <button onClick={toggleSound} className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-text-primary transition-colors">
                {soundOn ? <Volume2 size={20}/> : <VolumeX size={20}/>}
             </button>

             {renderTimerRing()}

             <div className="flex items-center gap-6 mt-4">
                <button onClick={resetCurrent} className="w-12 h-12 rounded-xl border border-border-default flex items-center justify-center text-text-secondary hover:bg-bg-surface transition-colors"><RotateCcw size={20}/></button>
                <button onClick={toggleTimer} className="w-14 h-14 rounded-xl bg-accent-blue flex items-center justify-center text-white hover:bg-blue-700 shadow-sm transition-colors">
                   {isRunning ? <Pause size={28} fill="currentColor"/> : <Play size={28} fill="currentColor" className="ml-1"/>}
                </button>
                <button onClick={skipPhase} className="w-12 h-12 rounded-xl border border-border-default flex items-center justify-center text-text-secondary hover:bg-bg-surface transition-colors"><SkipForward size={20}/></button>
             </div>
             
             <div className="absolute bottom-4 left-0 w-full text-center text-xs text-text-tertiary font-medium">Keyboard shortcut: Space = play/pause</div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-[45%] flex flex-col gap-6">
             {/* CONTEXT CARD */}
             <div className="bg-white rounded-xl shadow-card border border-border-default p-6">
                 <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4">
                    <Target size={14}/> Session Context
                 </div>
                 
                 <select value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)} className="w-full h-10 px-3 bg-bg-surface border border-border-default rounded-lg text-sm focus:border-accent-blue outline-none mb-3">
                    <option value="General Study">General Study</option>
                    {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                 </select>

                 <input value={taskName} onChange={e=>setTaskName(e.target.value)} placeholder="What are you studying? (optional)" className="w-full h-10 px-3 bg-bg-surface border border-border-default rounded-lg text-sm focus:border-accent-blue outline-none mb-5" />

                 <div className="text-[0.875rem] font-semibold text-text-primary mb-3">Check-in Mood</div>
                 <div className="flex gap-2 w-full">
                    {emojis.map(em => (
                       <button 
                         key={em} onClick={()=>setMood(em)} 
                         className={clsx("flex-1 h-[52px] rounded-xl flex items-center justify-center text-2xl transition-colors border", mood === em ? "bg-white border-accent-blue/50 shadow-sm" : "bg-bg-surface border-transparent opacity-70 hover:opacity-100")}
                       >
                          {em}
                       </button>
                    ))}
                 </div>
             </div>

             {/* TODAY'S FOCUS */}
             <div className="bg-white rounded-xl shadow-card border border-border-default p-6 flex-1 overflow-hidden flex flex-col">
                 <div className="flex justify-between items-center mb-4 shrink-0">
                    <div className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-1">Today's Focus <span className="text-orange-500">🔥</span></div>
                    <div className="text-xs font-bold text-orange-500">
                       {todaySessions.length === 0 ? '0m' : (() => {
                          const min = todaySessions.reduce((a,c)=>a+c.durationMinutes,0);
                          const h = Math.floor(min/60); const m = min%60;
                          return h>0 ? `${h}h ${m}m` : `${m}m`;
                       })()}
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {todaySessions.length === 0 ? (
                       <div className="h-full flex items-center justify-center text-sm italic text-text-secondary font-medium">No sessions completed today yet.</div>
                    ) : (
                       <>
                         {todaySessions.slice(0,4).map(s => (
                            <div key={s.id} className="flex flex-col gap-1 p-2 bg-bg-surface rounded-lg">
                               <div className="flex justify-between items-center">
                                  <div className="text-xs font-bold text-text-primary flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent-blue"></div> {s.subject}</div>
                                  <div className="text-[10px] font-bold text-text-tertiary">{new Date(s.completedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                               </div>
                               <div className="flex justify-between items-center pl-3.5">
                                  <div className="text-xs text-text-secondary truncate">{s.chapter}</div>
                                  <div className="text-[10px] font-bold bg-black/5 text-text-secondary px-1.5 py-0.5 rounded shrink-0">{s.durationMinutes}m</div>
                               </div>
                            </div>
                         ))}
                         {todaySessions.length > 4 && (
                            <button className="text-xs font-bold text-accent-blue hover:underline w-full text-left mt-2">View all {todaySessions.length} sessions →</button>
                         )}
                       </>
                    )}
                 </div>
             </div>
          </div>
       </div>

    </div>
  );
}
