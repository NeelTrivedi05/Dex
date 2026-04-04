import { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, BarChart3, MessageSquare, Settings,
  X, Download, Upload, Trash2, Bell, CheckCircle2 
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../ui/Button';
import { clearDexaiData, collectDexaiData } from '../../lib/dexaiStorage';

import AIPlanner from './views/AIPlanner';
import AnalyticsDashboard from './views/AnalyticsDashboard';
import DexAIChat from './views/DexAIChat';

export type DexAITab = 'planner' | 'analytics' | 'chat';

const TABS: { id: DexAITab; label: string; icon: React.ReactNode }[] = [
  { id: 'planner', label: 'AI Planner', icon: <BrainCircuit size={20} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  { id: 'chat', label: 'Dex Chat', icon: <MessageSquare size={20} /> },
];

export default function DexAIHub() {
  const [activeTab, setActiveTab] = useState<DexAITab>('planner');
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [apiKey, setApiKey] = useState('');
  const [dailyGoal, setDailyGoal] = useState(120);
  const [timerMode, setTimerMode] = useState('Pomodoro');
  const [customColor, setCustomColor] = useState('#007AFF');
  
  const [testResult, setTestResult] = useState<'none'|'testing'|'success'|'fail'>('none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dexai_active_tab');
    if (saved && TABS.some(t => t.id === saved)) setActiveTab(saved as DexAITab);
    
    // Load non-sensitive settings only. API keys are intentionally not persisted in browser storage.
    
    const goal = localStorage.getItem('dexai_daily_goal');
    if (goal) setDailyGoal(Number(goal));
    
    const mode = localStorage.getItem('dexai_default_timer');
    if (mode) setTimerMode(mode);

    const c = localStorage.getItem('dexai_accent_color');
    if (c) setCustomColor(c);
  }, [showSettings]);

  const handleTabChange = (tab: DexAITab) => {
    setActiveTab(tab);
    localStorage.setItem('dexai_active_tab', tab);
  };

  const saveSettings = () => {
     localStorage.setItem('dexai_daily_goal', String(dailyGoal));
     localStorage.setItem('dexai_default_timer', timerMode);
     localStorage.setItem('dexai_accent_color', customColor);
     alert("Settings saved!");
     setShowSettings(false);
  };

  const testConnection = async () => {
      setTestResult('fail');
      alert('Connection test is disabled in the browser for security. Route this through a backend endpoint.');
  };

  const requestNotification = () => {
     if ("Notification" in window) Notification.requestPermission().then(p => alert(`Permission: ${p}`));
  };

  const exportData = () => {
      const data = collectDexaiData();
     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a'); a.href = url; a.download = 'dexai_backup.json';
     a.click(); URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (event) => {
        try {
           const parsed = JSON.parse(event.target?.result as string);
           if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
             throw new Error('Invalid backup data');
           }

           const entries = Object.entries(parsed as Record<string, unknown>)
             .filter(([key]) => key.startsWith('dexai_'))
             .filter(([, value]) => typeof value === 'string');

           if (entries.length === 0) {
             throw new Error('No valid Dex AI data found');
           }

           entries.forEach(([key, value]) => localStorage.setItem(key, value));
           alert("Data successfully imported! The app will now reload.");
           window.location.reload();
        } catch(err) { alert("Invalid backup file."); }
     };
     reader.readAsText(file);
  };

  const resetData = () => {
     if (confirm("WARNING: This will permanently delete all Dex AI subjects, exams, sessions, and plans. Are you sure?")) {
        clearDexaiData();
        alert("All Dex AI data reset. Reverting to empty states.");
        window.location.reload();
     }
  };

  // Inject Custom Accent if set (simple overriding trick for this sub-app)
  const isCustomColor = customColor !== '#007AFF';

  return (
    <div className="h-full flex flex-col md:flex-row bg-bg-surface w-full relative" style={isCustomColor ? {'--color-accent-blue': customColor} as React.CSSProperties : {}}>
      
      {/* Sub-Sidebar */}
      <aside className="w-full md:w-20 lg:w-64 flex-shrink-0 bg-white border-b md:border-b-0 md:border-r border-border-default flex flex-row md:flex-col p-2 md:p-4 gap-2 overflow-x-auto overflow-y-hidden md:overflow-y-auto no-scrollbar justify-start md:justify-between items-center md:items-stretch z-10 transition-all">
        <div className="flex flex-row md:flex-col gap-2">
          {/* Header/Branding for large screens */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-4 mb-4">
            <BrainCircuit size={24} className="text-accent-blue" />
            <span className="font-bold text-text-primary text-xl tracking-tight">Dex AI</span>
          </div>

          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={clsx(
                  "flex items-center gap-3 px-3 md:px-0 lg:px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer w-auto lg:w-full group whitespace-nowrap",
                  isActive 
                    ? "bg-accent-blue/10 text-accent-blue shadow-sm"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                )}
                title={tab.label}
              >
                <div className="flex-shrink-0 mx-auto md:mx-auto lg:mx-0">{tab.icon}</div>
                <span className={clsx("hidden lg:block text-sm font-semibold")}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-row md:flex-col gap-2 mt-auto ml-auto md:ml-0 md:mt-4 pl-4 md:pl-0 border-l md:border-l-0 md:border-t border-border-default pt-0 md:pt-4">
           {/* Settings Button */}
           <button
                className={clsx(
                  "flex items-center gap-3 px-3 md:px-0 lg:px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer w-auto lg:w-full",
                  showSettings ? "bg-bg-surface text-text-primary" : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                )}
                title="Settings"
                onClick={() => setShowSettings(true)}
              >
                <div className="flex-shrink-0 mx-auto md:mx-auto lg:mx-0"><Settings size={20} /></div>
                <span className={clsx("hidden lg:block text-sm font-semibold")}>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden p-4 md:p-8 relative">
        {activeTab === 'planner' && <AIPlanner />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'chat' && <DexAIChat />}
      </main>

      {/* Global Settings Modal Overlay */}
      {showSettings && (
         <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-full overflow-y-auto animate-in zoom-in-95 border border-border-default">
               <div className="p-5 border-b border-border-subtle flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur z-10">
                  <h2 className="text-xl font-bold text-text-primary flex items-center gap-2"><Settings className="text-accent-blue"/> Dex AI Global Settings</h2>
                  <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-bg-surface text-text-secondary"><X size={20}/></button>
               </div>
               
               <div className="p-6 space-y-8">
                  {/* API Key */}
                  <section>
                    <h3 className="text-sm font-bold text-text-primary mb-3">AI Configuration</h3>
                    <div className="bg-bg-surface p-4 rounded-xl border border-border-default space-y-3">
                       <label className="text-xs font-semibold text-text-secondary mb-1 block">Grok API Key</label>
                       <div className="flex gap-2">
                         <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="xai-..." className="flex-1 h-10 px-3 bg-white border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none" />
                         <Button onClick={testConnection} variant="ghost" className="h-10 px-4 whitespace-nowrap">
                            {testResult === 'testing' ? 'Testing...' : 'Test Connection'}
                         </Button>
                       </div>
                       {testResult === 'success' && <div className="text-xs text-accent-green font-semibold flex items-center gap-1"><CheckCircle2 size={14}/> Connection Successful!</div>}
                       {testResult === 'fail' && <div className="text-xs text-accent-red font-semibold flex items-center gap-1"><X size={14}/> Connection Failed</div>}
                       <p className="text-2xs text-text-tertiary">Stored locally in your browser. Required for AI Planner, Chat, and Analytics.</p>
                    </div>
                  </section>

                  {/* Preferences */}
                  <section>
                    <h3 className="text-sm font-bold text-text-primary mb-3">Preferences & Goals</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                         <label className="text-xs font-semibold text-text-secondary mb-1 block">Daily Study Goal (minutes)</label>
                         <input type="number" value={dailyGoal} onChange={e=>setDailyGoal(Number(e.target.value))} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none" />
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-text-secondary mb-1 block">Default Timer Mode</label>
                         <select value={timerMode} onChange={e=>setTimerMode(e.target.value)} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none bg-white">
                           <option>Pomodoro</option>
                           <option>Deep Work</option>
                           <option>Custom</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-text-secondary mb-1 block">System Permissions</label>
                         <Button variant="ghost" onClick={requestNotification} className="w-full h-10 flex gap-2"><Bell size={16}/> Enable Desktop Notifications</Button>
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-text-secondary mb-1 block">Dex Theme Accent Override</label>
                         <input type="color" value={customColor} onChange={e=>setCustomColor(e.target.value)} className="w-full h-10 p-1 border border-border-default rounded-lg cursor-pointer bg-white" />
                       </div>
                    </div>
                  </section>

                  {/* Data Mgmt */}
                  <section>
                    <h3 className="text-sm font-bold text-text-primary mb-3">Data Management</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                       <Button onClick={exportData} className="flex-1 flex gap-2"><Download size={16}/> Export All Data</Button>
                       <input type="file" ref={fileInputRef} onChange={importData} accept=".json" className="hidden" />
                       <Button variant="ghost" onClick={()=>fileInputRef.current?.click()} className="flex-1 flex gap-2"><Upload size={16}/> Import Data</Button>
                       <Button variant="ghost" onClick={resetData} className="flex-1 flex gap-2 text-accent-red hover:bg-red-50 hover:text-accent-red hover:border-red-200"><Trash2 size={16}/> Factory Reset</Button>
                    </div>
                  </section>
               </div>

               <div className="p-5 border-t border-border-subtle bg-bg-surface flex justify-end gap-3 rounded-b-2xl">
                  <Button variant="ghost" onClick={()=>setShowSettings(false)}>Cancel</Button>
                  <Button onClick={saveSettings}>Save Changes</Button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
