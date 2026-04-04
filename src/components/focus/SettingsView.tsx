import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import Button from '../ui/Button';

export interface FocusTimerSettings {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  soundEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
}

export const defaultSettings: FocusTimerSettings = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  autoStartBreaks: true,
  autoStartFocus: false,
  dailyGoalMinutes: 120,
  weeklyGoalMinutes: 600
};

export default function SettingsView() {
  const [settings, setSettings] = useState<FocusTimerSettings>(defaultSettings);
  const [tasks, setTasks] = useState<{id:string, name:string}[]>([{ id:'general', name:'General Study' }]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('general');
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);

  useEffect(() => {
    // Load existing config
    const raw = localStorage.getItem('focus_timer_settings');
    if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) });

    // Load session progress
    const sessStr = localStorage.getItem('dexai_sessions');
    if (sessStr) {
       const sessions = JSON.parse(sessStr);
       const now = new Date();
       const todayStr = now.toISOString().split('T')[0];
       
       let tM = 0;
       let wM = 0;
       
       const startOfWeek = new Date(now);
       startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday start
       const startStr = startOfWeek.toISOString().split('T')[0];

       sessions.forEach((s: any) => {
          if (s.date === todayStr) tM += s.durationMinutes || 0;
          if (s.date >= startStr) wM += s.durationMinutes || 0;
       });
       setTodayMinutes(tM);
       setWeekMinutes(wM);
    }
  }, []);

  const updateSetting = (k: keyof FocusTimerSettings, v: any) => {
    const next = { ...settings, [k]: v };
    setSettings(next);
    localStorage.setItem('focus_timer_settings', JSON.stringify(next));
      window.dispatchEvent(new Event('focus_timer_settings_update'));
  };

  const formatHours = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full animate-in fade-in">
       
       {/* LEFT - TIMER SETTINGS CARD */}
       <div className="w-full lg:w-[50%] bg-white rounded-xl shadow-card border border-border-default p-6 flex flex-col gap-6">
          
          <div>
             <h2 className="text-[1.2rem] font-semibold text-accent-blue mb-4">Timer Settings</h2>
             <div className="space-y-5">
                {[
                  { k: 'focusDuration', label: 'Focus Duration', min:5, max:90, step:1, display: (v:any)=>`${v} minutes` },
                  { k: 'breakDuration', label: 'Break Duration', min:1, max:30, step:1, display: (v:any)=>`${v} minutes` },
                  { k: 'longBreakDuration', label: 'Long Break Duration', min:5, max:60, step:1, display: (v:any)=>`${v} minutes` },
                  { k: 'sessionsBeforeLongBreak', label: 'Sessions Before Long Break', min:1, max:8, step:1, display: (v:any)=>`${v} sessions` },
                ].map(s => (
                   <div key={s.k}>
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-sm font-semibold text-text-primary">{s.label}</span>
                         <span className="text-sm font-bold text-accent-blue">{(s as any).display(settings[s.k as keyof FocusTimerSettings])}</span>
                      </div>
                      <input 
                         type="range" 
                         min={s.min} max={s.max} step={s.step} 
                         value={settings[s.k as keyof FocusTimerSettings] as number}
                         onChange={e => updateSetting(s.k as keyof FocusTimerSettings, Number(e.target.value))}
                         className="w-full h-1 bg-border-default rounded-full appearance-none accent-accent-blue cursor-pointer outline-none"
                      />
                   </div>
                ))}
             </div>
          </div>

          <div className="border-t border-border-default"></div>

          <div>
             <h2 className="text-[1.2rem] font-semibold text-accent-blue mb-4">Sound Settings</h2>
             <div className="space-y-3">
                {[
                  { k: 'soundEnabled', label: 'Enable sound notifications' },
                  { k: 'autoStartBreaks', label: 'Auto-start breaks' },
                  { k: 'autoStartFocus', label: 'Auto-start focus sessions' }
                ].map(c => (
                   <label key={c.k} className="flex items-center gap-3 cursor-pointer group w-fit">
                      <div className="relative w-[18px] h-[18px]">
                         <input 
                           type="checkbox" 
                           checked={settings[c.k as keyof FocusTimerSettings] as boolean}
                           onChange={e => updateSetting(c.k as keyof FocusTimerSettings, e.target.checked)}
                           className="peer appearance-none w-full h-full border border-border-subtle rounded bg-white checked:bg-accent-blue checked:border-accent-blue transition-colors outline-none cursor-pointer"
                         />
                         <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                         </div>
                      </div>
                      <span className="text-sm text-text-primary group-hover:text-black transition-colors">{c.label}</span>
                   </label>
                ))}
             </div>
          </div>

       </div>


       {/* RIGHT - CURRENT SESSION CARD */}
       <div className="w-full lg:w-[50%] flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-card border border-border-default p-6">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-[1.1rem] font-semibold text-accent-blue">Current Session</h2>
                <span className="text-sm text-text-tertiary">No task selected</span>
             </div>

             <h3 className="text-sm font-semibold text-accent-blue mb-3 uppercase tracking-widest">Select Study Task</h3>
             <div className="flex flex-col gap-3">
                <select value={selectedTaskId} onChange={(e)=>setSelectedTaskId(e.target.value)} className="w-full h-10 px-3 bg-bg-surface border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none placeholder:text-text-tertiary">
                   {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <Button className="w-fit self-start rounded-full px-5 h-9 flex items-center gap-2 font-bold text-xs"><Play size={14}/> Start with Task</Button>
             </div>

             <h3 className="text-sm font-semibold text-accent-blue mb-3 uppercase tracking-widest mt-8">Session Progress</h3>
             <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-xs font-semibold text-text-primary mb-1">
                     <span>Today's Focus Time</span>
                     <span className="text-accent-blue font-bold">{formatHours(todayMinutes)}</span>
                  </div>
                  <div className="w-full h-[6px] bg-bg-surface rounded-full overflow-hidden">
                     <div className="h-full bg-accent-blue rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (todayMinutes / settings.dailyGoalMinutes)*100)}%` }}/>
                  </div>
               </div>

               <div>
                  <div className="flex justify-between text-xs font-semibold text-text-primary mb-1">
                     <span>Weekly Goal ({formatHours(settings.weeklyGoalMinutes)})</span>
                     <span className="text-accent-blue font-bold">{formatHours(weekMinutes)}</span>
                  </div>
                  <div className="w-full h-[6px] bg-bg-surface rounded-full overflow-hidden">
                     <div className="h-full bg-accent-blue rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (weekMinutes / settings.weeklyGoalMinutes)*100)}%` }}/>
                  </div>
               </div>
             </div>
          </div>
       </div>

    </div>
  );
}
